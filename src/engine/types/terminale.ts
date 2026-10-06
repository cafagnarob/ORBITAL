/**
 * ============================================================================
 * terminale.ts — Tipi del Terminale di manutenzione SVC-07
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.3 (codici nascosti), §4.4.
 *
 * L'IDEA
 * Dietro un pulsante "di servizio" sulla cornice del monitor c'è un
 * terminale che V.A.L.E. non controlla del tutto. Il Capitano può:
 *   1. SEGNALARE righe del log che gli sembrano sospette: se contengono un
 *      codice nascosto, il codice diventa un FRAMMENTO nel terminale;
 *   2. INSERIRE codici: quelli validi alzano il LIVELLO DI ACCESSO e
 *      rivelano informazioni interne; quelli sbagliati lasciano una traccia
 *      nel log… che V.A.L.E. può leggere.
 *
 * Livelli (0–5): FUNZIONI NORMALI · LOG DIAGNOSTICI · PROTOCOLLI INTERNI ·
 * MEMORIA RISERVATA · ACCESSO DIRETTIVA · OVERRIDE DEL NUCLEO.
 * ============================================================================
 */

import type { Minuti } from "./comuni";
import type { Effetto } from "./eventi";

/** Livello minimo e massimo di accesso. */
export const LIVELLO_MINIMO = 0;
export const LIVELLO_MASSIMO = 5;

/** Come va mostrata una riga di risposta (colori del design system). */
export type TonoRisposta = "normale" | "attenzione" | "critico" | "vale";

/** Un codice valido, nel catalogo content/codici.ts. */
export interface DefinizioneCodice {
  /** Il codice esatto, già normalizzato (maiuscolo, senza spazi), es. "VL-P7-04". */
  codice: string;
  /** Livello necessario perché il codice venga accettato. */
  livelloRichiesto: number;
  /** Livello raggiunto dopo averlo inserito (il livello non scende mai). */
  livelloOttenuto: number;
  /** Ciò che il terminale risponde. */
  risposta: { testo: string; tono: TonoRisposta }[];
  /** Conseguenze (di solito una scoperta). */
  effetti: Effetto[];
}

export type EsitoCodice = "ACCETTATO" | "GIA_ESEGUITO" | "LIVELLO_INSUFFICIENTE" | "NEGATO";

/** Un tentativo registrato: il terminale ricostruisce lo schermo da qui. */
export interface TentativoCodice {
  codice: string;
  tempo: Minuti;
  esito: EsitoCodice;
}

export interface StatoTerminale {
  livello: number;
  /** Codici raccolti segnalando righe del log, senza ripetizioni. */
  frammenti: string[];
  /** Indici delle voci di log segnalate dal Capitano (sue annotazioni). */
  segnalate: number[];
  tentativi: TentativoCodice[];
}
