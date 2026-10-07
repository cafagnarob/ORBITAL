/**
 * ============================================================================
 * assegnazione.ts — Mettere e togliere task dalla coda di un membro
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9 (assegnazione e code).
 *
 * DUE FUNZIONI PER OGNI OPERAZIONE
 *   verificaAssegnazione → risponde "si può fare?" con un MOTIVO leggibile
 *                          (o null se va tutto bene). Non modifica nulla.
 *   assegnaTask          → esegue l'operazione, dando per scontato che la
 *                          verifica sia già stata superata.
 * La UI userà le funzioni di verifica per disabilitare i pulsanti e
 * mostrare al giocatore il perché ("Nadia è a bordo ma ferita gravemente").
 * Il reducer le richiama comunque: un'azione non valida è un bug della UI,
 * e va fermata con un errore chiaro invece di corrompere lo stato.
 * ============================================================================
 */

import type { DefinizioneTask, IdDefinizioneTask, IdIstanzaTask, IdMembro, IdScoperta, StatoMissione } from "../types";
import type { ContestoMissione } from "./contesto";
import { formattaTempo } from "../clock";
import { disponibilitaTask } from "../tasks/disponibilita";
import { puoLavorare } from "./disponibilita";
import { capacitaGiornaliera, consumaCapacita, taskDiOggi } from "../crew/razioni";
import { luogoBloccato } from "../storia/iniziative";

// ----------------------------------------------------------------------------
// ASSEGNAZIONE
// ----------------------------------------------------------------------------

/**
 * Le scoperte che mancano perché un task sia disponibile.
 * Lista vuota = il task è disponibile. La UI la usa per mostrare solo i
 * task che la crew "sa" di poter fare.
 */
export function scoperteMancanti(stato: StatoMissione, def: DefinizioneTask): IdScoperta[] {
  return def.scoperteRichieste.filter((id) => !stato.conoscenza.scoperte.includes(id));
}

/** Restituisce il motivo per cui l'assegnazione NON è possibile, o null se lo è. */
export function verificaAssegnazione(
  stato: StatoMissione,
  contesto: ContestoMissione,
  idDefinizione: IdDefinizioneTask,
  idResponsabile: IdMembro,
  idSupporto: IdMembro | null,
): string | null {
  const def = contesto.catalogoTask[idDefinizione];
  if (!def) return `Task sconosciuto: ${idDefinizione}`;

  if (scoperteMancanti(stato, def).length > 0) return `${def.nome}: informazioni insufficienti`;

  // Progressione (v3.3): sbloccato? già in mano a qualcuno? in ricarica?
  const disp = disponibilitaTask(stato, contesto, def);
  switch (disp.tipo) {
    case "NASCOSTO": {
      // Il motivo più utile, se è uno di quelli "materiali".
      const equip = def.equipaggiamentoRichiesto.find((e) => !stato.nave.equipaggiamento.includes(e));
      if (equip !== undefined) return `Equipaggiamento mancante: ${equip}`;
      const modulo = def.moduliRichiesti.find((m) => !stato.nave.moduli.includes(m));
      if (modulo !== undefined) return `Modulo mancante: ${modulo}`;
      // Una verifica ha senso solo se c'è un'affermazione di V.A.L.E. contestata.
      if (def.tag.includes("VERIFICA")) return "Nessuna affermazione contestata da verificare";
      return `${def.nome}: non ancora disponibile`;
    }
    case "ESAURITO":
      return `${def.nome}: già completato, non si ripete`;
    case "IN_CORSO":
      return `${def.nome}: già assegnato a ${stato.crew[disp.chi]?.nome ?? disp.chi}`;
    case "IN_RICARICA":
      return `${def.nome}: di nuovo disponibile da ${formattaTempo(disp.finoA)}`;
    case "DISPONIBILE":
      break;
  }

  const responsabile = stato.crew[idResponsabile];
  if (!responsabile) return `Membro sconosciuto: ${idResponsabile}`;
  if (!puoLavorare(responsabile)) return `${responsabile.nome} non è in grado di lavorare`;

  // Fame e sete (v3.4): ognuno può fare un numero limitato di task al giorno.
  if (consumaCapacita(contesto, idDefinizione)) {
    const capacita = capacitaGiornaliera(responsabile);
    if (capacita === 0) return `${responsabile.nome} è troppo debole per lavorare (fame o sete)`;
    if (taskDiOggi(stato, contesto, idResponsabile) >= capacita) {
      return `${responsabile.nome} oggi può fare al massimo ${capacita} task`;
    }
  }

  if (idSupporto !== null) {
    if (!def.supportoAmmesso) return `${def.nome} si svolge da soli`;
    if (idSupporto === idResponsabile) return `${responsabile.nome} non può aiutare sé stesso`;
    const supporto = stato.crew[idSupporto];
    if (!supporto) return `Membro sconosciuto: ${idSupporto}`;
    if (!puoLavorare(supporto)) return `${supporto.nome} non è in grado di aiutare`;
  }

  // V.A.L.E. può aver chiuso il compartimento (v3.0).
  if (luogoBloccato(stato, def.luogo)) return `Accesso a ${def.luogo.replaceAll("_", " ")} bloccato da V.A.L.E.`;

  return null;
}

/**
 * Crea una nuova istanza in coda al responsabile.
 * Modifica la BOZZA: va chiamata solo dal reducer.
 */
export function assegnaTask(
  bozza: StatoMissione,
  idDefinizione: IdDefinizioneTask,
  idResponsabile: IdMembro,
  idSupporto: IdMembro | null,
): IdIstanzaTask {
  // ID deterministico: "task-" + contatore (vedi missione.ts).
  bozza.contatoreId += 1;
  const id = `task-${bozza.contatoreId}`;

  bozza.tasks[id] = {
    id,
    idDefinizione,
    responsabile: idResponsabile,
    supporto: idSupporto,
    stato: "IN_CODA",
    inizio: null,
    fine: null,
    rischio: null,
    esito: null,
  };

  // `??=` assegna solo se il valore è null o undefined: crea la coda
  // se per qualche motivo non esiste ancora.
  bozza.code[idResponsabile] ??= [];
  bozza.code[idResponsabile].push(id);
  return id;
}

// ----------------------------------------------------------------------------
// RIMOZIONE
// ----------------------------------------------------------------------------

/** Si può togliere dalla coda solo un task che non è ancora iniziato. */
export function verificaRimozione(stato: StatoMissione, idTask: IdIstanzaTask): string | null {
  const task = stato.tasks[idTask];
  if (!task) return `Task sconosciuto: ${idTask}`;
  if (task.stato !== "IN_CODA") return "Si possono rimuovere solo i task ancora in coda";
  return null;
}

/**
 * Toglie un task dalla coda e lo segna ANNULLATO.
 * Non lo cancelliamo da `tasks`: la storia della missione resta completa.
 */
export function rimuoviDallaCoda(bozza: StatoMissione, idTask: IdIstanzaTask): void {
  const task = bozza.tasks[idTask];
  if (!task) return;
  task.stato = "ANNULLATO";
  const coda = bozza.code[task.responsabile];
  if (coda) bozza.code[task.responsabile] = coda.filter((id) => id !== idTask);
}
