/**
 * ============================================================================
 * clock.ts — L'orologio event-driven di ORBITAL
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §8.
 *
 * COSA FA
 * 1. Converte il tempo di gioco (un solo numero di minuti) in giorno, ora
 *    e fase della giornata, per mostrarlo al giocatore.
 * 2. Trova il PROSSIMO MOMENTO IMPORTANTE: il gioco non scorre minuto per
 *    minuto, ma "salta" direttamente al primo istante in cui succede
 *    qualcosa (un task finisce, arriva il rapporto serale, la sveglia...).
 * 3. Fa avanzare il tempo, garantendo che non torni mai indietro.
 *
 * COSA NON FA
 * Non decide cosa SUCCEDE in quel momento (esito del task, consumo di
 * risorse, eventi): quello è compito del reducer della missione.
 * L'orologio risponde solo a "quando?". Responsabilità separate = file
 * piccoli, facili da testare e da cambiare.
 *
 * PERCHÉ "EVENT-DRIVEN"
 * Simulare ogni minuto significherebbe ~1000 passi al giorno in cui di
 * solito non succede nulla. Saltando al prossimo momento importante, una
 * giornata intera richiede pochi passi, e il gioco si ferma da solo
 * quando serve una decisione del Capitano.
 * ============================================================================
 */

import type { IdIstanzaTask, Minuti, StatoMissione } from "./types";

// ----------------------------------------------------------------------------
// COSTANTI DEL CALENDARIO (DESIGN §8, [BLOCCATO])
// ----------------------------------------------------------------------------
// Sono struttura del gioco, non numeri da bilanciare: per questo stanno qui
// e non in content/balance.ts.

export const MINUTI_PER_ORA = 60;
export const MINUTI_PER_GIORNO = 24 * MINUTI_PER_ORA; // 1440

/** 06:00 — risveglio e briefing, inizio della pianificazione. */
export const ORARIO_RISVEGLIO: Minuti = 6 * MINUTI_PER_ORA;
/** 07:00 — iniziano le operazioni. */
export const ORARIO_OPERAZIONI: Minuti = 7 * MINUTI_PER_ORA;
/** 22:00 — rapporto serale, inizio della notte. */
export const ORARIO_RAPPORTO: Minuti = 22 * MINUTI_PER_ORA;

// ----------------------------------------------------------------------------
// CONVERSIONI: dal numero di minuti a ciò che vede il giocatore
// ----------------------------------------------------------------------------

/** Il tempo scomposto in parti leggibili. */
export interface TempoScomposto {
  /** Giorno di missione, a partire da 1. */
  giorno: number;
  /** Ora 0–23. */
  ore: number;
  /** Minuti 0–59. */
  minuti: number;
}

/**
 * Scompone i minuti assoluti in giorno, ore e minuti.
 *
 * Esempio con t = 1830:
 *   giorno  = floor(1830 / 1440) + 1 = 1 + 1 = 2
 *   resto   = 1830 % 1440 = 390 minuti nel giorno
 *   ore     = floor(390 / 60) = 6
 *   minuti  = 390 % 60 = 30           → Giorno 2, 06:30
 * L'operatore % ("modulo") dà il resto della divisione: è lo strumento
 * giusto per tutto ciò che "ricomincia da capo", come le ore del giorno.
 */
export function scomponiTempo(t: Minuti): TempoScomposto {
  const nelGiorno = minutoDelGiorno(t);
  return {
    giorno: Math.floor(t / MINUTI_PER_GIORNO) + 1,
    ore: Math.floor(nelGiorno / MINUTI_PER_ORA),
    minuti: nelGiorno % MINUTI_PER_ORA,
  };
}

/** Minuti trascorsi dalla mezzanotte del giorno corrente (0–1439). */
export function minutoDelGiorno(t: Minuti): Minuti {
  return t % MINUTI_PER_GIORNO;
}

/**
 * Testo pronto per la UI, es. "Giorno 2 · 06:30".
 * padStart(2, "0") aggiunge lo zero iniziale: 6 → "06".
 */
export function formattaTempo(t: Minuti): string {
  const { giorno, ore, minuti } = scomponiTempo(t);
  const hh = String(ore).padStart(2, "0");
  const mm = String(minuti).padStart(2, "0");
  return `Giorno ${giorno} · ${hh}:${mm}`;
}

// ----------------------------------------------------------------------------
// FASI DELLA GIORNATA
// ----------------------------------------------------------------------------

export const FASI_GIORNATA = ["PIANIFICAZIONE", "OPERAZIONI", "NOTTE"] as const;
export type FaseGiornata = (typeof FASI_GIORNATA)[number];

/**
 * In quale fase della giornata cade un istante.
 *   06:00–06:59 PIANIFICAZIONE · 07:00–21:59 OPERAZIONI · 22:00–05:59 NOTTE
 * Ogni intervallo include l'inizio ed esclude la fine: così ogni minuto
 * appartiene a una e una sola fase, senza buchi né sovrapposizioni.
 */
export function faseGiornata(t: Minuti): FaseGiornata {
  const m = minutoDelGiorno(t);
  if (m >= ORARIO_RISVEGLIO && m < ORARIO_OPERAZIONI) return "PIANIFICAZIONE";
  if (m >= ORARIO_OPERAZIONI && m < ORARIO_RAPPORTO) return "OPERAZIONI";
  return "NOTTE";
}

/**
 * Il primo istante STRETTAMENTE SUCCESSIVO a `t` in cui l'orologio segna
 * `orario` (minuti dalla mezzanotte).
 *
 * "Strettamente" è voluto: se sono già le 22:00 e chiedo il prossimo
 * rapporto, la risposta è domani alle 22:00, non adesso. Altrimenti il
 * gioco troverebbe all'infinito lo stesso momento e non avanzerebbe mai.
 *
 * Esempi:  t = 360 (G1 06:00), orario 22:00 → 1320 (G1 22:00)
 *          t = 1320 (G1 22:00), orario 22:00 → 2760 (G2 22:00)
 */
export function prossimaOccorrenza(t: Minuti, orario: Minuti): Minuti {
  const inizioGiorno = t - minutoDelGiorno(t);
  const oggi = inizioGiorno + orario;
  return oggi > t ? oggi : oggi + MINUTI_PER_GIORNO;
}

// ----------------------------------------------------------------------------
// IL PROSSIMO MOMENTO IMPORTANTE
// ----------------------------------------------------------------------------

/**
 * Il motivo per cui il gioco si ferma.
 *
 * È una "union discriminata": il campo `tipo` dice di che caso si tratta,
 * e TypeScript sa quali altri campi esistono in ogni caso. Se scrivi
 * `if (m.tipo === "FINE_TASK")`, dentro l'if puoi usare `m.idTask`;
 * negli altri casi il compilatore non te lo permette.
 * Nelle prossime fasi aggiungeremo qui EVENTO, CHECKPOINT, INTERVENTO_VALE.
 */
export type MotivoSosta =
  | { tipo: "FINE_TASK"; idTask: IdIstanzaTask }
  | { tipo: "RISVEGLIO" }
  | { tipo: "TURNO" }
  | { tipo: "RAPPORTO_SERALE" };

/** Il prossimo istante importante e TUTTI i motivi che vi accadono. */
export interface ProssimoMomento {
  tempo: Minuti;
  motivi: MotivoSosta[];
}

/**
 * I CAMBI TURNO (v3.3): quattro momenti fissi della giornata operativa in
 * cui può accadere un evento "esterno" (una nave di passaggio, un
 * meteorite...). Senza, gli eventi arriverebbero solo alla fine dei task,
 * al rapporto e al risveglio: con il tempo reale la giornata sembrerebbe vuota.
 */
export const ORARI_TURNO: readonly Minuti[] = [10, 13, 16, 19].map((h) => h * MINUTI_PER_ORA);

/** Gli appuntamenti fissi di ogni giorno. */
const MOMENTI_PROGRAMMATI: readonly { orario: Minuti; motivo: MotivoSosta }[] = [
  { orario: ORARIO_RISVEGLIO, motivo: { tipo: "RISVEGLIO" } },
  ...ORARI_TURNO.map((orario) => ({ orario, motivo: { tipo: "TURNO" } as const })),
  { orario: ORARIO_RAPPORTO, motivo: { tipo: "RAPPORTO_SERALE" } },
];

/**
 * Trova il prossimo momento importante a partire dallo stato attuale.
 *
 * COME FUNZIONA
 *   1. Raccoglie tutti i "candidati": la fine di ogni task IN_CORSO e il
 *      prossimo risveglio / rapporto serale.
 *   2. Prende il tempo minimo.
 *   3. Restituisce TUTTI i candidati che cadono in quel minuto.
 *
 * PERCHÉ TUTTI E NON UNO SOLO
 * Se un task finisce alle 22:00 esatte, nello stesso minuto ci sono due
 * motivi. Restituendone uno solo, dopo averlo gestito il tempo sarebbe
 * già 22:00, e il rapporto (cercato "strettamente dopo") slitterebbe a
 * domani: lo salteremmo. Restituendoli insieme il reducer li gestisce tutti.
 *
 * ORDINE DETERMINISTICO
 * A parità di minuto: prima le fine dei task (ordinati per ID), poi gli
 * appuntamenti fissi. Prima si chiude il lavoro, poi si fa rapporto.
 * Un ordine fisso è necessario per il determinismo: stessa partita,
 * stessa sequenza, sempre.
 */
export function prossimoMomento(stato: StatoMissione): ProssimoMomento {
  const candidati: { tempo: Minuti; motivo: MotivoSosta }[] = [];

  // 1a. Task in corso, ordinati per ID per avere sempre lo stesso ordine.
  const inCorso = Object.values(stato.tasks)
    .filter((task) => task.stato === "IN_CORSO")
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const task of inCorso) {
    if (task.fine === null) {
      throw new Error(`clock: il task ${task.id} è IN_CORSO ma non ha un tempo di fine`);
    }
    if (task.fine < stato.tempo) {
      // Un task doveva finire nel passato e nessuno l'ha gestito: è un bug
      // del reducer. Meglio fermarsi subito che proseguire con dati sbagliati.
      throw new Error(`clock: il task ${task.id} doveva finire al minuto ${task.fine}, ma ora è il minuto ${stato.tempo}`);
    }
    candidati.push({ tempo: task.fine, motivo: { tipo: "FINE_TASK", idTask: task.id } });
  }

  // 1b. Appuntamenti fissi (sempre presenti: quindi c'è sempre un candidato).
  for (const { orario, motivo } of MOMENTI_PROGRAMMATI) {
    candidati.push({ tempo: prossimaOccorrenza(stato.tempo, orario), motivo });
  }

  // 2. Il minuto più vicino.
  const tempo = Math.min(...candidati.map((c) => c.tempo));

  // 3. Tutti i motivi di quel minuto. L'ordine di inserimento (task prima,
  //    appuntamenti dopo) è già quello voluto, e filter lo conserva.
  const motivi = candidati.filter((c) => c.tempo === tempo).map((c) => c.motivo);

  return { tempo, motivi };
}

// ----------------------------------------------------------------------------
// AVANZAMENTO
// ----------------------------------------------------------------------------

/**
 * Restituisce un NUOVO stato con il tempo spostato a `nuovoTempo`.
 *
 * Funzione pura: lo stato originale non viene toccato.
 * `{ ...stato, tempo }` (spread) crea una copia superficiale con il solo
 * campo `tempo` cambiato; gli altri campi sono condivisi con l'originale,
 * il che va bene perché nessuno li modifica.
 *
 * Il tempo non può tornare indietro: se succede, è un bug, e lo segnaliamo.
 */
export function avanzaTempo(stato: StatoMissione, nuovoTempo: Minuti): StatoMissione {
  if (!Number.isInteger(nuovoTempo)) {
    throw new Error(`clock: il tempo deve essere un intero di minuti (ricevuto ${nuovoTempo})`);
  }
  if (nuovoTempo < stato.tempo) {
    throw new Error(`clock: il tempo non può tornare indietro (${stato.tempo} → ${nuovoTempo})`);
  }
  return { ...stato, tempo: nuovoTempo };
}
