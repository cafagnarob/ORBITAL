/**
 * ============================================================================
 * missioni/index.ts — Il catalogo delle supermissioni (v3.8)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * Unico punto da toccare per AGGIUNGERE una missione:
 *   1. crea content/missioni/<nome>.ts con MISSIONE_, TASK_ ed EVENTI_;
 *   2. aggiungili alle tre liste qui sotto.
 * Il seed la potrà scegliere subito (per sigla o per caso), e i suoi task
 * ed eventi entrano nei cataloghi comuni (tasks.ts, eventi.ts) già filtrati
 * da `soloIn(id)`.
 *
 * L'ORDINE CONTA: il seed "casuale" pesca dalla lista per posizione.
 * Aggiungi in fondo, così i seed già giocati non cambiano missione.
 * ============================================================================
 */

import { pianoDalSeed } from "../../engine/storia/piano";
import type { DefinizioneEvento, DefinizioneMissione, DefinizioneTask, IdDefinizioneTask, IdMissione, PianoMissione } from "../../engine/types";
import { EVENTI_ARGO3, MISSIONE_ARGO3, TASK_ARGO3 } from "./argo3";
import { EVENTI_E17, MISSIONE_E17, TASK_E17 } from "./e17";
import { EVENTI_HALVOR, MISSIONE_HALVOR, TASK_HALVOR } from "./halvor";
import { EVENTI_HK7, MISSIONE_HK7, TASK_HK7 } from "./hk7";
import { EVENTI_KESTREL4, MISSIONE_KESTREL4, TASK_KESTREL4 } from "./kestrel4";

/** Tutte le supermissioni, nell'ordine in cui il seed le pesca. */
export const LISTA_MISSIONI: readonly DefinizioneMissione[] = [MISSIONE_E17, MISSIONE_ARGO3, MISSIONE_HK7, MISSIONE_HALVOR, MISSIONE_KESTREL4];

/** Le stesse, per id: è quello che va nel contesto del motore. */
export const CATALOGO_MISSIONI: Readonly<Record<IdMissione, DefinizioneMissione>> = Object.fromEntries(
  LISTA_MISSIONI.map((m) => [m.id, m]),
);

/** I task propri delle missioni (ognuno con soloIn nello sblocco). */
export const TASK_MISSIONI: readonly DefinizioneTask[] = [...TASK_E17, ...TASK_ARGO3, ...TASK_HK7, ...TASK_HALVOR, ...TASK_KESTREL4];

/** Gli eventi propri delle missioni (ognuno con soloIn nelle condizioni). */
export const EVENTI_MISSIONI: readonly DefinizioneEvento[] = [
  ...EVENTI_E17,
  ...EVENTI_ARGO3,
  ...EVENTI_HK7,
  ...EVENTI_HALVOR,
  ...EVENTI_KESTREL4,
];

export { MISSIONE_E17 };

// ----------------------------------------------------------------------------
// SCORCIATOIE PER LE SCHERMATE
// ----------------------------------------------------------------------------

/** Il piano (missione e durate) che il seed decide, col catalogo vero. */
export function pianoPartita(seed: string): PianoMissione {
  return pianoDalSeed(seed, LISTA_MISSIONI);
}

/**
 * La definizione della missione di un piano. Se l'id non c'è (un salvataggio
 * di una versione futura, un test) si ripiega su E-17: meglio di uno schermo vuoto.
 */
export function definizioneMissione(id: IdMissione): DefinizioneMissione {
  return CATALOGO_MISSIONI[id] ?? MISSIONE_E17;
}

/** I task della scaletta (preparativi + finale): la loro attrezzatura è indispensabile. */
export function taskObbligatori(m: DefinizioneMissione): IdDefinizioneTask[] {
  return [...m.scaletta.passi.map((p) => p.task), m.scaletta.finale.task];
}
