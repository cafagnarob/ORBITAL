/**
 * ============================================================================
 * supermissione.ts — Le supermissioni: cosa sono e come il seed ne sceglie una
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7 (v3.8).
 *
 * DUE COSE DIVERSE
 *   DefinizioneMissione  il CONTENUTO di una missione (content/missioni/):
 *                        dove si va, la scaletta, gli obiettivi, il
 *                        briefing, i dati della Plancia. Uguale per tutti.
 *   PianoMissione        quello che il SEED ha deciso per QUESTA partita:
 *                        quale missione e quanti giorni dura ogni fase.
 *                        Sta nello stato (stato.missione), così la partita
 *                        sa sempre "dove" e "quanto" senza ricalcolarlo.
 *
 * Tutte le missioni hanno le stesse tre fasi (FaseViaggio):
 *   ANDATA → ORBITA (operazioni vicino al bersaglio) → RIENTRO.
 * "ORBITA" vale per ogni bersaglio: in orbita attorno al pianeta, in
 * stazionamento accanto alla stazione, in formazione con la cometa…
 * ============================================================================
 */

import type { IdDefinizioneTask } from "./comuni";
import type { DefinizioneObiettivo } from "./storia";

export type IdMissione = string;

/** Come la Plancia disegna il bersaglio (ui/missione/plancia). */
export const FORME_BERSAGLIO = ["PIANETA", "STAZIONE", "ASTEROIDE", "COMETA", "RELITTO"] as const;
export type FormaBersaglio = (typeof FORME_BERSAGLIO)[number];

/** Un numero di giorni da `min` a `max` compresi: il seed sceglie dove cadere. */
export interface IntervalloGiorni {
  min: number;
  max: number;
}

/** I giorni di ogni fase di una partita. */
export interface DurateMissione {
  andata: number;
  orbita: number;
  rientro: number;
}

/** Ciò che il seed ha deciso: quale missione, quanto dura. */
export interface PianoMissione {
  id: IdMissione;
  durate: DurateMissione;
}

/** Un passo della scaletta, come lo mostra il pannello Missione. */
export interface PassoScaletta {
  task: IdDefinizioneTask;
  titolo: string;
  /** Ore di validità dopo il completamento (null = resta valido). */
  validitaOre: number | null;
}

/** Una riga della scheda del briefing: "TIPO · Soccorso". */
export interface VoceSchedaBriefing {
  etichetta: string;
  valore: string;
}

export interface DefinizioneMissione {
  id: IdMissione;
  /**
   * Sigla per il seed: un seed che comincia con "SIGLA-" sceglie questa
   * missione (es. "ARGO-0001"). Senza sigla, decide il caso.
   */
  sigla: string;
  /** Nome breve del bersaglio, nei titoli: "E-17", "Argo-3". */
  nome: string;
  /** Il titolo della missione: "Ricognizione orbitale di E-17". */
  titolo: string;
  bersaglio: {
    forma: FormaBersaglio;
    /** Dove si è in fase ORBITA, nell'intestazione: "ORBITA E-17", "ATTRACCO ARGO-3". */
    luogo: string;
    /** Il punto da agganciare nella Plancia: "CRATERE SETTENTRIONALE". */
    puntoInteresse: string;
  };
  /** Gli intervalli di giorni per fase: il seed sceglie dentro questi. */
  durate: { andata: IntervalloGiorni; orbita: IntervalloGiorni; rientro: IntervalloGiorni };
  /**
   * La SCALETTA dell'obiettivo principale: preparativi (alcuni scadono)
   * e il task finale. Il motore la applica con lo SBLOCCO dei task
   * (content/tasks): qui c'è come mostrarla.
   */
  scaletta: { passi: readonly PassoScaletta[]; finale: { task: IdDefinizioneTask; titolo: string } };
  /** Obiettivi principali (P1 arrivo, P2 obiettivo, P3 tutti a casa) e di contorno. */
  obiettivi: readonly DefinizioneObiettivo[];
  /**
   * L'ordine di missione letto prima della Preparazione. Le righe comuni
   * (durata dal piano, equipaggio, nave) le aggiunge la schermata.
   */
  briefing: {
    protocollo: string;
    /** Righe proprie della missione: tipo, bersaglio, posizione, rischio… */
    scheda: readonly VoceSchedaBriefing[];
    /** Perché siete lì: uno o due paragrafi. */
    contesto: readonly string[];
    /** Cosa si fa in ogni fase (la schermata aggiunge i giorni del piano). */
    parti: { andata: string; orbita: string; rientro: string };
    obiettivoFinale: string;
  };
  /**
   * Cosa riporta a casa chi completa la missione: compare nel finale
   * «Missione compiuta» ("Nella stiva dei dati c'è …").
   */
  risultato: string;
  /** Le righe delle schede dati della Plancia in orbita (tre gruppi di due). */
  dati: readonly (readonly (readonly [string, string])[])[];
}
