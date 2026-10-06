/**
 * ============================================================================
 * log.ts — Scrittura delle voci di log durante una missione
 * ============================================================================
 *
 * Una sola funzione, usata da tutti i moduli della missione, così ogni voce
 * ha sempre la stessa forma e il tempo giusto (quello attuale della bozza).
 * ============================================================================
 */

import type { FonteLog, StatoMissione } from "../types";

/**
 * Aggiunge una voce al log della BOZZA (vedi reducer.ts: la bozza è una
 * copia dello stato che il reducer può modificare liberamente).
 */
export function scriviLog(bozza: StatoMissione, fonte: FonteLog, testo: string, codici: string[] = []): void {
  bozza.log.push({ tempo: bozza.tempo, fonte, testo, codici });
}
