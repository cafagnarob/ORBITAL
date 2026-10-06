/**
 * ============================================================================
 * direttiva.ts — Scelta e lettura della direttiva nascosta di V.A.L.E.
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3.2.
 *
 * La direttiva si sceglie UNA volta, a inizio missione, con un generatore
 * dedicato al dominio "vale" (deriveSeed): così cambiare il meteo o gli
 * eventi non cambia mai quale direttiva esce con un certo seed.
 *
 * IL LOADOUT FILTRA LE DIRETTIVE (DESIGN §11.4)
 * Prima del sorteggio si tengono solo le direttive "possibili" con ciò che
 * c'è a bordo (direttiveEleggibili). Se nessuna lo è, si sceglie tra tutte:
 * V.A.L.E. ha SEMPRE una direttiva, anche con una nave mal equipaggiata.
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { createRng, deriveSeed } from "../rng";
import type { DefinizioneDirettiva, DefinizioneTask, IdDirettiva, StatoMissione, TagLoadout } from "../types";

/** Le direttive compatibili con le capacità a bordo (tutti i tag richiesti presenti). */
export function direttiveEleggibili(
  catalogo: readonly DefinizioneDirettiva[],
  tagABordo: readonly TagLoadout[],
): DefinizioneDirettiva[] {
  const eleggibili = catalogo.filter((d) => d.richiede.every((t) => tagABordo.includes(t)));
  return eleggibili.length > 0 ? eleggibili : [...catalogo];
}

/** Sceglie la direttiva per una nuova missione, in modo deterministico. */
export function scegliDirettiva(seed: string, catalogo: readonly DefinizioneDirettiva[]): IdDirettiva {
  if (catalogo.length === 0) throw new Error("scegliDirettiva: catalogo vuoto");
  const rng = createRng(deriveSeed(seed, "vale"));
  // Ordine per ID: il risultato non dipende dall'ordine in cui è scritto il catalogo.
  const ordinate = [...catalogo].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return rng.weightedPick(ordinate.map((d) => ({ item: d.id, peso: d.peso }))).valueOf();
}

/** La definizione della direttiva attiva (null se il catalogo non la conosce). */
export function direttivaAttiva(stato: StatoMissione, contesto: ContestoMissione): DefinizioneDirettiva | null {
  return contesto.catalogoDirettive[stato.vale.direttiva] ?? null;
}

/** Il task va contro la direttiva attiva? */
export function contrastaDirettiva(stato: StatoMissione, contesto: ContestoMissione, def: DefinizioneTask): boolean {
  const direttiva = direttivaAttiva(stato, contesto);
  return direttiva !== null && def.tag.some((t) => direttiva.tagContrari.includes(t));
}
