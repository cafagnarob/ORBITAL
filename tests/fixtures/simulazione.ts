/**
 * ============================================================================
 * simulazione.ts — Funzioni di supporto per simulare partite nei test
 * ============================================================================
 *
 * Permettono di scrivere i test come una sequenza leggibile di azioni,
 * invece di ripetere applicaAzione(..., CONTESTO_DI_PROVA) a ogni riga.
 * ============================================================================
 */

import { applicaAzione, type Azione, type ContestoMissione } from "../../src/engine/mission";
import type { IstanzaTask, MembroCrew, StatoMissione } from "../../src/engine/types";
import { CONTESTO_DI_PROVA } from "./taskDiProva";

/** Applica una serie di azioni in ordine e restituisce lo stato finale. */
export function esegui(stato: StatoMissione, azioni: Azione[], contesto: ContestoMissione = CONTESTO_DI_PROVA): StatoMissione {
  return azioni.reduce((s, azione) => applicaAzione(s, azione, contesto), stato);
}

/**
 * Invia AVANZA finché il gioco non si ferma per qualcosa che non è la fine
 * di un task (rapporto serale o pianificazione). Il limite evita che un
 * bug faccia girare il test all'infinito.
 */
export function avanzaFinoAPausa(stato: StatoMissione, contesto: ContestoMissione = CONTESTO_DI_PROVA): StatoMissione {
  let s = stato;
  for (let i = 0; i < 100; i++) {
    s = applicaAzione(s, { tipo: "AVANZA" }, contesto);
    if (s.statoGioco !== "IN_ESECUZIONE") return s;
  }
  throw new Error("avanzaFinoAPausa: il gioco non si è mai fermato");
}

/** Legge un task che DEVE esistere (altrimenti il test fallisce chiaramente). */
export function task(stato: StatoMissione, id: string): IstanzaTask {
  const t = stato.tasks[id];
  if (!t) throw new Error(`Task ${id} non trovato`);
  return t;
}

/** Legge un membro che DEVE esistere. */
export function membro(stato: StatoMissione, id: string): MembroCrew {
  const m = stato.crew[id];
  if (!m) throw new Error(`Membro ${id} non trovato`);
  return m;
}
