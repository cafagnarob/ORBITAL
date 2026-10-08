/**
 * ============================================================================
 * candidati.ts — Quali candidati si presentano in questa partita (v3.7.3)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.5.
 *
 * Il catalogo ha 10 candidati (content/candidati.ts), ma in ogni partita se
 * ne presentano solo `balance.preparazione.candidatiProposti` (6), estratti
 * a caso. Così ogni partita comincia con un equipaggio diverso da comporre.
 *
 * ESTRAZIONE CON IL SEED
 * Il generatore nasce da deriveSeed(seed, "candidati"):
 *   - stessa partita (stesso seed) → sempre gli stessi 6;
 *   - un generatore DEDICATO non consuma i numeri casuali del resto del
 *     gioco: eventi, task e direttiva restano quelli di prima.
 *
 * COME ESTRAE: il mescolamento di Fisher-Yates
 * Si scorre la lista da destra a sinistra; ogni elemento si scambia con uno
 * a caso tra quelli ancora da sistemare (lui compreso). Ogni ordine finale
 * ha la stessa probabilità. Poi si prendono i primi 6.
 * Il risultato si rimette nell'ordine del catalogo, così le schede non
 * "saltano" di posto da una partita all'altra in modo strano.
 *
 * Funzione pura: nessuno stato da salvare, si ricalcola dal seed.
 * ============================================================================
 */

import { createRng, deriveSeed } from "../rng";

export function candidatiProposti<T>(seed: string, catalogo: readonly T[], quanti: number): T[] {
  if (quanti >= catalogo.length) return [...catalogo];
  const rng = createRng(deriveSeed(seed, "candidati"));
  // Mescoliamo gli INDICI (0…n−1), non gli oggetti: poi li riordiniamo.
  const indici = catalogo.map((_, i) => i);
  for (let i = indici.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [indici[i], indici[j]] = [indici[j] as number, indici[i] as number];
  }
  return indici
    .slice(0, quanti)
    .sort((a, b) => a - b)
    .map((i) => catalogo[i] as T);
}
