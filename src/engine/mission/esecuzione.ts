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
 * - Il rischio si calcola all'avvio e si salva nell'istanza.
 *
 * Tutte le funzioni lavorano sulla BOZZA (vedi reducer.ts).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { faseGiornata, formattaTempo, minutoDelGiorno, ORARIO_RAPPORTO } from "../clock";
import type { Rng } from "../rng";
import { calcolaSoglie, tiraEsito } from "../tasks/esito";
import { valutaTask } from "../tasks/valutazione";
import type { EsitoTask, IdIstanzaTask, Luogo, Minuti, Risorse, StatoMissione } from "../types";
import { rimuoviDallaCoda } from "./assegnazione";
import type { ContestoMissione } from "./contesto";
import { idCrewOrdinati, membroOccupato, puoLavorare } from "./disponibilita";
import { scriviLog } from "./log";

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

  responsabile.posizione = def.luogo;
  if (supporto !== null) supporto.posizione = def.luogo;

  const conChi = supporto !== null ? ` con ${supporto.nome}` : "";
  scriviLog(
    bozza,
    "SISTEMA",
    `${responsabile.nome}${conChi} avvia: ${def.nome} · rischio stimato ${valutazione.rischio}% · fine prevista ${formattaTempo(fine)}`,
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

  // Fatica: tutta al responsabile, una quota all'aiutante. Mai oltre 100.
  responsabile.fatica = Math.min(100, responsabile.fatica + def.costoFatica);
  if (supporto) {
    const quota = Math.round(def.costoFatica * BALANCE.task.quotaFaticaSupporto);
    supporto.fatica = Math.min(100, supporto.fatica + quota);
  }

  // Il task era il primo della coda del responsabile: lo togliamo.
  const coda = bozza.code[task.responsabile];
  if (coda) bozza.code[task.responsabile] = coda.filter((id) => id !== idTask);

  scriviLog(bozza, "SISTEMA", `${responsabile.nome}: ${def.nome} — ${ETICHETTE_ESITO[esito]}`);
}
