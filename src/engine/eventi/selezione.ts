/**
 * ============================================================================
 * selezione.ts — Quale evento accade in questo momento?
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10 — niente RandomEvent(): condizioni,
 * pool pesati e cronologia.
 *
 * IL PROCEDIMENTO
 *   1. IDONEI: gli eventi le cui condizioni sono tutte vere, esclusi quelli
 *      "una volta sola" già accaduti.
 *   2. PROBABILITÀ: ogni idoneo supera un tiro con la sua probabilità
 *      (gli eventi con probabilità 1 non consumano tiri).
 *   3. PRIORITÀ: tra i superstiti restano solo quelli di priorità più alta.
 *   4. PESO: tra questi se ne sceglie uno con una scelta pesata.
 *
 * REGOLA [PROVVISORIO]: al massimo UN evento per momento. Evita valanghe di
 * eventi nello stesso istante; quelli rimasti, se le loro condizioni sono
 * ancora vere, potranno accadere al momento successivo.
 *
 * DETERMINISMO
 * Gli eventi si scorrono in ordine di ID e i tiri usano l'Rng della partita:
 * stessa partita e stesse scelte → stessi eventi.
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import type { Rng } from "../rng";
import { PRIORITA_EVENTO, type DefinizioneEvento, type StatoMissione } from "../types";
import { attoriDisponibili } from "../storia/attori";
import { verificaTutte, type MomentoEventi } from "./condizioni";

export function eventiIdonei(stato: StatoMissione, contesto: ContestoMissione, momento: MomentoEventi): DefinizioneEvento[] {
  return Object.values(contesto.catalogoEventi)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .filter((def) => !(def.unaVolta && stato.eventi.accaduti.some((r) => r.id === def.id)))
    .filter((def) => verificaTutte(stato, contesto, def.condizioni, momento))
    // Gli eventi con protagonista accadono solo se c'è qualcuno adatto a viverli.
    .filter((def) => attoriDisponibili(stato, def.protagonista, def.secondo));
}

export function scegliEvento(idonei: readonly DefinizioneEvento[], rng: Rng): DefinizioneEvento | null {
  const superati = idonei.filter((def) => def.probabilita >= 1 || rng.chance(def.probabilita));
  if (superati.length === 0) return null;

  const rangoMassimo = Math.max(...superati.map((def) => PRIORITA_EVENTO.indexOf(def.priorita)));
  const migliori = superati.filter((def) => PRIORITA_EVENTO.indexOf(def.priorita) === rangoMassimo);

  // Un solo candidato: nessun tiro necessario.
  if (migliori.length === 1) return migliori[0] ?? null;
  return rng.weightedPick(migliori.map((def) => ({ item: def, peso: def.peso })));
}
