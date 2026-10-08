/**
 * ============================================================================
 * log.ts — Tipi delle voci di log
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.2–4.3.
 *
 * Ogni azione importante produce una voce di log con doppia funzione:
 * feedback tecnico per il giocatore e possibile indizio narrativo.
 * I codici nascosti (es. "VL-P7-04", "MEM-12") sono salvati a parte dal
 * testo, così la Tavola del Capitano potrà cercarli e collegarli senza
 * dover "leggere" le frasi.
 * ============================================================================
 */

import type { Minuti } from "./comuni";
import type { TonoCapitano } from "./vale";

/**
 * Chi ha prodotto la voce. CAPITANO (v3.9): le battute del Capitano a
 * V.A.L.E. (prima erano righe di SISTEMA "Capitano: …").
 */
export const FONTI_LOG = ["SISTEMA", "VALE", "CREW", "CAPITANO"] as const;
export type FonteLog = (typeof FONTI_LOG)[number];

export interface VoceLog {
  /** Quando è stata scritta. */
  tempo: Minuti;
  fonte: FonteLog;
  /** Testo mostrato, es. "ROUTE PWR-07 → LS-01 · PRIORITÀ VITA". */
  testo: string;
  /** Codici nascosti contenuti nella voce (può essere vuoto). */
  codici: string[];
  /** Solo per le battute del Capitano (v3.9): il tono con cui ha parlato. */
  tono?: TonoCapitano;
}
