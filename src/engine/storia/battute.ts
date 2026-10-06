/**
 * ============================================================================
 * battute.ts — Cosa dice un membro della crew in una certa situazione
 * ============================================================================
 *
 * Le battute stanno nel contenuto (content/storia/battute.ts), divise per
 * situazione e per APPROCCIO del membro (CAUTO, AMANTE DEL RISCHIO,
 * PRAGMATICO): la stessa notizia suona diversa in bocca ad Adrian o a Sarah.
 *
 * QUALE BATTUTA, TRA LE POSSIBILI?
 * Non usiamo il generatore casuale della partita: questa funzione è
 * chiamata in punti diversi del motore e non vogliamo che "consumi" numeri
 * casuali (cambierebbe il resto della partita). Usiamo invece un hash di
 * seed + membro + situazione + tempo: un numero che sembra casuale ma è
 * sempre lo stesso per la stessa situazione. Determinismo garantito.
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { hashSeed } from "../rng";
import type { MembroCrew, SituazioneBattuta, StatoMissione } from "../types";

export function battuta(
  stato: StatoMissione,
  contesto: ContestoMissione,
  membro: MembroCrew,
  situazione: SituazioneBattuta,
): string {
  const possibili = contesto.storia.battute[situazione][membro.personalita.approccio];
  if (possibili.length === 0) return "…";
  const indice = hashSeed(`${stato.seed}:${membro.id}:${situazione}:${stato.tempo}`) % possibili.length;
  return possibili[indice] ?? "…";
}
