/**
 * ============================================================================
 * storia.ts — Tipi della storia emergente (v3.0, "alla 60 Seconds")
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §15 (finali), §10.2 (storia emergente).
 *
 * L'IDEA
 * Non c'è una trama scritta dall'inizio alla fine: c'è un MAZZO di eventi
 * narrativi, ognuno con condizioni, un PROTAGONISTA scelto tra la crew e
 * scelte con ESITI CASUALI. Seed, crew, carico e decisioni decidono quali
 * eventi escono, chi li vive e come finiscono. Ogni sera un GIORNALE DI
 * BORDO racconta la giornata; a fine missione un FINALE la chiude.
 * Come in 60 Seconds, due partite non raccontano mai la stessa storia.
 *
 * Qui ci sono solo i tipi; le regole sono in engine/storia/, i testi in
 * content/storia/.
 * ============================================================================
 */

import type { IdMembro, Minuti } from "./comuni";
import type { Personalita, Ruolo } from "./crew";
import type { Condizione, Effetto } from "./eventi";

// ----------------------------------------------------------------------------
// FAZIONI — da che parte sta ogni membro (derivato dalla fiducia, mai salvato)
// ----------------------------------------------------------------------------

export const FAZIONI = ["CON_VALE", "INDECISO", "CONTRO_VALE"] as const;
export type Fazione = (typeof FAZIONI)[number];

// ----------------------------------------------------------------------------
// PROTAGONISTA — chi vive un evento
// ----------------------------------------------------------------------------

/**
 * Come scegliere il protagonista (o il "secondo") di un evento.
 * Tutti i campi presenti devono valere; tra i candidati rimasti si sceglie
 * a caso, oppure il più/meno fiducioso verso V.A.L.E.
 * Se nessuno va bene, l'evento non può accadere.
 */
export interface SelettoreMembro {
  fazione?: Fazione;
  /** true = solo chi ha fame o sete (carico ≥ 2, v3.4): la paranoia. */
  affamato?: boolean;
  ruolo?: Ruolo;
  personalita?: Partial<Personalita>;
  preferisci?: "CASUALE" | "PIU_FIDUCIOSO" | "MENO_FIDUCIOSO";
}

/** Un esito possibile di una scelta: se ne estrae uno, in base al peso. */
export interface EsitoCasuale {
  /** Breve e stabile, es. "RIUSCITO": finisce nel registro. */
  id: string;
  peso: number;
  /** Se non sono tutte vere, questo esito non può uscire. */
  requisiti: Condizione[];
  /** Cosa si legge nel log quando esce (con {P} e {S}). */
  testo: string;
  effetti: Effetto[];
  /** Riga per il giornale di bordo. */
  diario?: string;
}

// ----------------------------------------------------------------------------
// GIORNALE DI BORDO
// ----------------------------------------------------------------------------

export interface VoceDiario {
  giorno: number;
  testo: string;
}

// ----------------------------------------------------------------------------
// FINE DELLA MISSIONE
// ----------------------------------------------------------------------------

/**
 * Perché la missione finisce:
 *   RIENTRO          la nave riparte per la Terra
 *   MORTE            nessuno è più vivo a bordo
 *   CONTROLLO_VALE   V.A.L.E. prende la nave e non riparte
 *   DERIVA           si vuole tornare ma il carburante non basta
 */
export const CAUSE_FINE = ["RIENTRO", "MORTE", "CONTROLLO_VALE", "DERIVA"] as const;
export type CausaFine = (typeof CAUSE_FINE)[number];

export type IdFinale = string;

/** Un finale possibile (content/storia/finali.ts). */
export interface DefinizioneFinale {
  id: IdFinale;
  titolo: string;
  /** Le cause per cui questo finale è possibile. */
  cause: CausaFine[];
  condizioni: Condizione[];
  /** Più alto = controllato prima. Il primo che va bene vince. */
  priorita: number;
  /** L'epilogo, con {CAPITANO}-style segnaposto: {VIVI}, {MORTI}, {GIORNI}. */
  testo: string;
  tono: "normale" | "attenzione" | "critico";
}

/** Com'è finita (salvato nello stato quando la missione si chiude). */
export interface EsitoMissione {
  finale: IdFinale;
  causa: CausaFine;
  tempo: Minuti;
}

// ----------------------------------------------------------------------------
// IMPREVISTO DI PARTENZA — ogni partita comincia con una piccola differenza
// ----------------------------------------------------------------------------

export interface DefinizioneImprevisto {
  id: string;
  peso: number;
  /** Riga del giornale di bordo del giorno 1 (con {P}). */
  diario: string;
  /** Riga di log (di solito di V.A.L.E. o di sistema). */
  log: { fonte: "VALE" | "SISTEMA" | "CREW"; testo: string };
  effetti: Effetto[];
  protagonista?: SelettoreMembro;
}

// ----------------------------------------------------------------------------
// BATTUTE DELLA CREW — cosa dicono quando cambiano idea o agiscono da soli
// ----------------------------------------------------------------------------

export const SITUAZIONI_BATTUTA = [
  "PASSA_CON_VALE", // ora si fida di V.A.L.E.
  "PASSA_CONTRO_VALE", // non si fida più
  "TORNA_INDECISO",
  "RIFIUTA_TASK", // si rifiuta di fare un task che V.A.L.E. sconsiglia
  "CONTESTA_DA_SOLO", // apre una contestazione di sua iniziativa
  "MORTE_COMPAGNO",
] as const;
export type SituazioneBattuta = (typeof SITUAZIONI_BATTUTA)[number];

/** Per ogni situazione, battute diverse secondo l'approccio (DESIGN §7.3). */
export type Battute = Record<SituazioneBattuta, Record<Personalita["approccio"], string[]>>;

/** Chi è stato scelto per un evento in corso. */
export interface Attori {
  protagonista: IdMembro | null;
  secondo: IdMembro | null;
}

/** I testi della storia che il motore usa (iniezione di dipendenze, come testiVale). */
export interface ContenutiStoria {
  finali: Readonly<Record<IdFinale, DefinizioneFinale>>;
  battute: Battute;
  /** Frasi per le giornate in cui non è successo niente. */
  diarioVuoto: readonly string[];
  /** Righe d'epilogo per ogni membro, secondo come è finito ({N} = nome). */
  epiloghiCrew: Readonly<Record<Fazione | "MORTO", readonly string[]>>;
  /** Le risposte della crew ai discorsi del Capitano (v3.4). */
  colloqui: TestiColloqui;
}

// ----------------------------------------------------------------------------
// COLLOQUI DEL CAPITANO (v3.4)
// ----------------------------------------------------------------------------

export const DISCORSI = ["DIFENDI_VALE", "DUBITA_VALE", "INCORAGGIA"] as const;
export type Discorso = (typeof DISCORSI)[number];
export type EsitoColloquio = "CONVINTO" | "RESPINTO";

/** Per ogni discorso e ogni esito, le frasi possibili della persona. */
export type TestiColloqui = Readonly<Record<Discorso, Readonly<Record<EsitoColloquio, readonly string[]>>>>;

/** Traccia di un colloquio nello stato: serve al limite di uno al giorno. */
export interface RegistroColloquio {
  membro: IdMembro;
  tempo: Minuti;
  discorso: Discorso;
  esito: EsitoColloquio;
}
