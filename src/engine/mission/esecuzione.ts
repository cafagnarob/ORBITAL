/**
 * ============================================================================
 * esecuzione.ts — Avviare e concludere i task
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.6 (spostamenti), §9 (task).
 *
 * IL CICLO DI VITA DI UN TASK
 *
 *   IN_CODA ──avviaTask──▶ IN_CORSO ──concludiTask──▶ COMPLETATO / FALLITO
 *      │
 *      └── se il responsabile non può lavorare o mancano risorse → ANNULLATO
 *
 * REGOLE [PROVVISORIO]
 * - Un task parte solo durante le OPERAZIONI (07:00–22:00) e solo se
 *   FINISCE entro le 22:00: niente lavoro notturno. Se non ci sta, resta in
 *   coda e partirà il giorno dopo.
 * - Il costo in risorse si paga ALL'AVVIO: se non basta, il task è annullato.
 * - Se l'aiutante è occupato o non può lavorare, il responsabile procede da
 *   solo (e il log lo dice): la coda non si blocca.
 * - Il rischio si calcola all'avvio e si salva nell'istanza. Nel log compare
 *   la STIMA (che con bassa integrità dei dati può essere sbagliata).
 * - V.A.L.E. (Fase 3): un task contrario alla direttiva fa salire la tensione;
 *   con autonomia RESTRITTIVA o superiore V.A.L.E. lo RIFIUTA.
 *
 * Tutte le funzioni lavorano sulla BOZZA (vedi reducer.ts).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { faseGiornata, formattaTempo, minutoDelGiorno, ORARIO_RAPPORTO } from "../clock";
import type { Rng } from "../rng";
import { calcolaSoglie, tiraEsito } from "../tasks/esito";
import { valutaTask } from "../tasks/valutazione";
import type { EsitoTask, IdIstanzaTask, Luogo, Minuti, ResaTask, Risorse, StatoMissione } from "../types";
import { MOLTIPLICATORE_RESA, taskSbloccato } from "../tasks/disponibilita";
import { modificaSalute } from "../crew/salute";
import { proponiMinigioco } from "../tasks/minigiochi";
import { capacitaGiornaliera, consumaCapacita } from "../crew/razioni";
import { AUTONOMIA_RIFIUTO, livelloAutonomia } from "../vale/comportamento";
import { risolviVerifica, TAG_VERIFICA } from "../vale/contestazioni";
import { contrastaDirettiva } from "../vale/direttiva";
import { modificaFiduciaCrew } from "../storia/fazioni";
import { bloccoVale, luogoBloccato, rifiutoCrew, sbloccaTutto } from "../storia/iniziative";
import { scriviDiario } from "../storia/diario";
import { stimaRischio } from "../vale/integritaDati";
import { rimuoviDallaCoda } from "./assegnazione";
import type { ContestoMissione } from "./contesto";
import { idCrewOrdinati, membroOccupato, puoLavorare } from "./disponibilita";
import { scriviLog } from "./log";

/** Il tag dei task di sblocco manuale (v3.0). */
export const TAG_SBLOCCO = "SBLOCCO";

/** Come il giocatore legge ogni esito nel log. */
const ETICHETTE_ESITO: Record<EsitoTask, string> = {
  SUCCESSO_PERFETTO: "successo perfetto",
  SUCCESSO: "completato",
  SUCCESSO_PARZIALE: "completato in parte",
  FALLIMENTO: "fallito",
  FALLIMENTO_CRITICO: "fallimento critico",
};

// ----------------------------------------------------------------------------
// SPOSTAMENTI
// ----------------------------------------------------------------------------

function eFuoriDallaNave(luogo: Luogo): boolean {
  return luogo === "ESTERNO_NAVE" || luogo === "SUPERFICIE";
}

/**
 * Minuti per andare da un luogo all'altro (versione semplificata del §7.6:
 * la mappa delle adiacenze arriverà più avanti).
 */
export function tempoSpostamento(da: Luogo, a: Luogo): Minuti {
  if (da === a) return 0;
  const { interno, airlock } = BALANCE.spostamento;
  // Uscire o rientrare richiede anche la procedura di airlock.
  return interno + (eFuoriDallaNave(da) || eFuoriDallaNave(a) ? airlock : 0);
}

// ----------------------------------------------------------------------------
// AVVIO
// ----------------------------------------------------------------------------

/** Ultimo minuto utile del giorno corrente: le 22:00. */
function fineOperazioni(t: Minuti): Minuti {
  return t - minutoDelGiorno(t) + ORARIO_RAPPORTO;
}

/** Il primo tipo di risorsa che non basta per pagare il costo, o null. */
function risorsaInsufficiente(risorse: Risorse, costo: Partial<Risorse>): keyof Risorse | null {
  // Object.entries perde i tipi delle chiavi: il cast li ripristina.
  for (const [chiave, quantita] of Object.entries(costo) as [keyof Risorse, number][]) {
    if (risorse[chiave] < quantita) return chiave;
  }
  return null;
}

export type RisultatoAvvio = "AVVIATO" | "IN_ATTESA" | "ANNULLATO";

/** Prova ad avviare il task indicato. */
export function avviaTask(bozza: StatoMissione, contesto: ContestoMissione, idTask: IdIstanzaTask): RisultatoAvvio {
  const task = bozza.tasks[idTask];
  if (!task) throw new Error(`avviaTask: task sconosciuto ${idTask}`);
  const def = contesto.catalogoTask[task.idDefinizione];
  if (!def) throw new Error(`avviaTask: definizione sconosciuta ${task.idDefinizione}`);

  const responsabile = bozza.crew[task.responsabile];
  if (!responsabile || !puoLavorare(responsabile)) {
    rimuoviDallaCoda(bozza, idTask);
    scriviLog(bozza, "SISTEMA", `${def.nome} annullato: il responsabile non è in grado di lavorare`);
    return "ANNULLATO";
  }

  // Fame e sete (v3.4): se nella notte le forze sono calate, i task di troppo
  // in coda si annullano (contano solo quelli già avviati oggi).
  if (consumaCapacita(contesto, def.id)) {
    const inizioGiorno = bozza.tempo - minutoDelGiorno(bozza.tempo);
    const avviatiOggi = Object.values(bozza.tasks).filter(
      (t) => t.responsabile === responsabile.id && t.inizio !== null && t.inizio >= inizioGiorno && consumaCapacita(contesto, t.idDefinizione),
    ).length;
    if (avviatiOggi >= capacitaGiornaliera(responsabile)) {
      rimuoviDallaCoda(bozza, idTask);
      scriviLog(bozza, "SISTEMA", `${def.nome} annullato: ${responsabile.nome} non ha più forze oggi`);
      return "ANNULLATO";
    }
  }

  // L'aiutante, se previsto, deve essere libero e operativo.
  let supporto = task.supporto !== null ? (bozza.crew[task.supporto] ?? null) : null;
  if (supporto !== null && (!puoLavorare(supporto) || membroOccupato(bozza, supporto.id))) {
    scriviLog(bozza, "CREW", `${supporto.nome} non è disponibile: ${responsabile.nome} procede da solo`);
    supporto = null;
  }

  const valutazione = valutaTask(def, responsabile, supporto);
  const spostamento = Math.max(
    tempoSpostamento(responsabile.posizione, def.luogo),
    supporto !== null ? tempoSpostamento(supporto.posizione, def.luogo) : 0,
  );
  const fine = bozza.tempo + spostamento + valutazione.durata;

  // Non c'è tempo per finirlo oggi: resta in coda, senza cambiare nulla.
  if (fine > fineOperazioni(bozza.tempo)) return "IN_ATTESA";

  // FINESTRA (v3.7): certi task partono solo in certe ore (il cratere è
  // inquadrabile dalle 10 alle 16). Fuori dalla finestra si aspetta in coda.
  if (def.finestra) {
    const ora = minutoDelGiorno(bozza.tempo) / 60;
    if (ora < def.finestra.da || ora >= def.finestra.a) return "IN_ATTESA";
  }

  // Le condizioni possono essere cambiate da quando è stato assegnato (v3.7):
  // la traiettoria corretta è "scaduta", l'occasione è passata, si è partiti…
  if (!taskSbloccato(bozza, contesto, def)) {
    rimuoviDallaCoda(bozza, idTask);
    scriviLog(bozza, "SISTEMA", `${def.nome} annullato: le condizioni non ci sono più`);
    return "ANNULLATO";
  }

  // Il compartimento può essere stato chiuso da V.A.L.E. dopo l'assegnazione.
  if (luogoBloccato(bozza, def.luogo)) {
    rimuoviDallaCoda(bozza, idTask);
    scriviLog(bozza, "SISTEMA", `${def.nome} annullato: accesso bloccato da V.A.L.E.`);
    return "ANNULLATO";
  }

  // V.A.L.E. e la direttiva nascosta: blocco del compartimento (autonomia
  // AUTONOMA), rifiuto (RESTRITTIVA) o, più in basso, solo tensione.
  if (bloccoVale(bozza, contesto, def)) {
    rimuoviDallaCoda(bozza, idTask);
    bozza.vale.tensione += 1;
    return "ANNULLATO";
  }
  if (contrastaDirettiva(bozza, contesto, def)) {
    if (livelloAutonomia(bozza, contesto) >= AUTONOMIA_RIFIUTO) {
      const { vale, sistema, codici } = contesto.testiVale.rifiuto;
      rimuoviDallaCoda(bozza, idTask);
      scriviLog(bozza, "VALE", vale);
      scriviLog(bozza, "SISTEMA", `${sistema} · ${def.nome.toUpperCase()}`, codici);
      bozza.vale.tensione += 1;
      modificaFiduciaCrew(bozza, contesto, BALANCE.vale.fiduciaRifiuto);
      return "ANNULLATO";
    }
  }

  // La crew che si fida di V.A.L.E. può rifiutarsi anche quando lei non
  // blocca nulla (v3.0, storia/iniziative.ts): è una scelta della persona.
  if (rifiutoCrew(bozza, contesto, responsabile, def)) {
    rimuoviDallaCoda(bozza, idTask);
    return "ANNULLATO";
  }

  const mancante = risorsaInsufficiente(bozza.risorse, def.costoRisorse);
  if (mancante !== null) {
    rimuoviDallaCoda(bozza, idTask);
    scriviLog(bozza, "SISTEMA", `${def.nome} annullato: ${mancante} insufficiente`);
    return "ANNULLATO";
  }

  // Da qui il task parte davvero: paghiamo il costo e aggiorniamo tutto.
  for (const [chiave, quantita] of Object.entries(def.costoRisorse) as [keyof Risorse, number][]) {
    bozza.risorse[chiave] -= quantita;
  }

  task.supporto = supporto?.id ?? null;
  task.stato = "IN_CORSO";
  task.inizio = bozza.tempo;
  task.fine = fine;
  task.rischio = valutazione.rischio;

  if (contrastaDirettiva(bozza, contesto, def)) bozza.vale.tensione += BALANCE.vale.tensioneTaskContrario;

  // Il Capitano può dare una mano con un minigioco (v3.6).
  proponiMinigioco(bozza, def, task);

  responsabile.posizione = def.luogo;
  if (supporto !== null) supporto.posizione = def.luogo;

  const conChi = supporto !== null ? ` con ${supporto.nome}` : "";
  scriviLog(
    bozza,
    "SISTEMA",
    `${responsabile.nome}${conChi} avvia: ${def.nome} · rischio stimato ${stimaRischio(bozza, contesto, def.id, valutazione.rischio)}% · fine prevista ${formattaTempo(fine)}`,
  );
  return "AVVIATO";
}

/**
 * Avvia il primo task in coda di ogni membro libero.
 *
 * Si scorre la crew in ordine alfabetico (determinismo): se due membri
 * vogliono lo stesso aiutante, lo ottiene sempre lo stesso.
 * Per ogni membro si prova il primo della coda; se viene annullato si prova
 * il successivo; se è IN_ATTESA ci si ferma (l'ordine della coda è una
 * scelta del Capitano e va rispettato).
 */
export function avviaTaskPronti(bozza: StatoMissione, contesto: ContestoMissione): void {
  if (faseGiornata(bozza.tempo) !== "OPERAZIONI") return;

  for (const idMembro of idCrewOrdinati(bozza)) {
    while (!membroOccupato(bozza, idMembro)) {
      const primo = bozza.code[idMembro]?.[0];
      if (primo === undefined) break;
      const risultato = avviaTask(bozza, contesto, primo);
      if (risultato !== "ANNULLATO") break;
    }
  }
}

// ----------------------------------------------------------------------------
// CONCLUSIONE
// ----------------------------------------------------------------------------

/**
 * Conclude un task IN_CORSO: tira l'esito, applica la fatica, libera la coda.
 * Le CONSEGUENZE dell'esito (danni, ferite, scoperte) arriveranno con il
 * sistema di eventi nella Fase 2: per ora l'esito viene solo registrato.
 */
export function concludiTask(bozza: StatoMissione, contesto: ContestoMissione, rng: Rng, idTask: IdIstanzaTask): void {
  const task = bozza.tasks[idTask];
  if (!task || task.stato !== "IN_CORSO" || task.rischio === null) {
    throw new Error(`concludiTask: ${idTask} non è un task in corso valido`);
  }
  const def = contesto.catalogoTask[task.idDefinizione];
  const responsabile = bozza.crew[task.responsabile];
  if (!def || !responsabile) throw new Error(`concludiTask: dati mancanti per ${idTask}`);
  const supporto = task.supporto !== null ? bozza.crew[task.supporto] : undefined;

  // L'esito usa il rischio salvato all'avvio, non uno ricalcolato ora.
  const soglie = calcolaSoglie(task.rischio, responsabile.abilita.PRECISIONE);
  const { esito } = tiraEsito(soglie, rng);

  task.esito = esito;
  task.stato = esito === "FALLIMENTO" || esito === "FALLIMENTO_CRITICO" ? "FALLITO" : "COMPLETATO";

  // Fatica: tutta al responsabile, una quota all'aiutante. Sempre tra 0 e
  // 100 (un costo negativo, come la pausa di riposo, la fa scendere).
  responsabile.fatica = limita(responsabile.fatica + def.costoFatica);
  if (supporto) {
    const quota = Math.round(def.costoFatica * BALANCE.task.quotaFaticaSupporto);
    supporto.fatica = limita(supporto.fatica + quota);
  }

  // Il task era il primo della coda del responsabile: lo togliamo.
  const coda = bozza.code[task.responsabile];
  if (coda) bozza.code[task.responsabile] = coda.filter((id) => id !== idTask);

  scriviLog(bozza, "SISTEMA", `${responsabile.nome}: ${def.nome} — ${ETICHETTE_ESITO[esito]}`);

  // Ciò che il task produce, in proporzione all'esito (v3.3).
  if (def.resa) applicaResa(bozza, def.resa, MOLTIPLICATORE_RESA[esito]);

  // Un task di verifica chiude (o lascia aperta) la contestazione più vecchia.
  if (def.tag.includes(TAG_VERIFICA)) risolviVerifica(bozza, contesto, esito);

  // Sblocco manuale (v3.0): riapre i compartimenti chiusi da V.A.L.E.
  if (def.tag.includes(TAG_SBLOCCO) && task.stato === "COMPLETATO" && sbloccaTutto(bozza)) {
    bozza.vale.tensione += BALANCE.storia.tensioneSblocco;
    scriviLog(bozza, "SISTEMA", "BYPASS MANUALE · ACCESSI RIPRISTINATI");
    scriviLog(bozza, "VALE", "Registro l'intervento non autorizzato, Capitano.");
    scriviDiario(bozza, `${responsabile.nome} ha forzato le porte chiuse da V.A.L.E.`);
  }
}

// ----------------------------------------------------------------------------
// RESA (v3.3)
// ----------------------------------------------------------------------------

/** Limita un valore tra 0 e 100 (fatica, integrità). */
function limita(n: number): number {
  return Math.min(100, Math.max(0, n));
}

/**
 * Applica ciò che un task restituisce: risorse, riparazioni, cure.
 * `fattore` viene dall'esito (×1,5 perfetto … ×0 fallimento); si arrotonda
 * all'intero, perché le risorse sono unità intere. Riga di log riassuntiva.
 */
function applicaResa(bozza: StatoMissione, resa: ResaTask, fattore: number): void {
  if (fattore === 0) return;
  const voci: string[] = [];

  for (const [chiave, q] of Object.entries(resa.risorse ?? {}) as [keyof Risorse, number][]) {
    const delta = Math.round(q * fattore);
    if (delta === 0) continue;
    bozza.risorse[chiave] = Math.max(0, bozza.risorse[chiave] + delta);
    voci.push(`${chiave.toUpperCase()} ${delta > 0 ? "+" : ""}${delta}`);
  }
  if (resa.sistema) {
    const delta = Math.round(resa.sistema.delta * fattore);
    bozza.nave.sistemi[resa.sistema.id] = limita(bozza.nave.sistemi[resa.sistema.id] + delta);
    voci.push(`${resa.sistema.id.replaceAll("_", " ")} +${delta}%`);
  }
  if (resa.scafo !== undefined) {
    const delta = Math.round(resa.scafo * fattore);
    bozza.nave.scafo = limita(bozza.nave.scafo + delta);
    voci.push(`SCAFO +${delta}%`);
  }
  if (resa.cure !== undefined) {
    const delta = Math.round(resa.cure * fattore);
    const curati = Object.values(bozza.crew).filter((m) => m.stato === "FERITO" || m.stato === "CRITICO");
    for (const m of curati) modificaSalute(m, delta);
    if (curati.length > 0) voci.push(`CURE +${delta} a ${curati.map((m) => m.nome).join(", ")}`);
  }

  if (voci.length > 0) scriviLog(bozza, "SISTEMA", `RESA · ${voci.join(" · ")}`);
}
