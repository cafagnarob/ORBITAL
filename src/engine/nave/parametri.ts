/**
 * ============================================================================
 * parametri.ts — I numeri della nave, moduli compresi
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.2 (potenza), §11 (loadout).
 *
 * COSA FA
 * Parte dai valori della nave "nuda" (balance.ts) e ci somma gli effetti di
 * ogni modulo installato. Esempio con Modulo di Potenza (+6 / +2):
 *   generazioneEnergia = 12 + 6 = 18     consumoEnergia = 5 + 2 = 7
 *
 * PERCHÉ È UNA FUNZIONE E NON UN DATO SALVATO
 * Nello stato salviamo solo QUALI moduli ci sono. Se salvassimo anche
 * "generazione 18", un ritocco al catalogo non arriverebbe mai alle partite
 * in corso, e i due numeri potrebbero contraddirsi. Calcolare costa poco
 * (al massimo 4 moduli) e dà una sola fonte di verità.
 *
 * La usano sia la Preparazione (anteprima prima di partire) sia la missione
 * (rapporto serale, risveglio, integrità dei dati, pannello Risorse).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { PARAMETRI_NAVE, type DefinizioneModulo, type IdModulo, type ParametriNave } from "../types";

/** I valori della nave senza moduli. */
export function parametriBase(): ParametriNave {
  const g = BALANCE.giornata;
  return {
    generazioneEnergia: g.generazioneEnergia,
    consumoEnergia: g.consumoEnergia,
    capacitaBatteria: g.capacitaBatteria,
    spazioScorte: BALANCE.preparazione.spazioScorte,
    recuperoFatica: g.recuperoFaticaNotturno,
    ciboPerMembro: g.ciboPerMembro,
    acquaPerMembro: g.acquaPerMembro,
    produzioneOssigeno: g.produzioneOssigeno,
    integritaDati: 0,
  };
}

/**
 * Base + effetti dei moduli. Un ID che il catalogo non conosce viene
 * ignorato (un salvataggio vecchio non deve far crollare il gioco).
 */
export function parametriNave(
  moduli: readonly IdModulo[],
  catalogo: Readonly<Record<IdModulo, DefinizioneModulo>>,
): ParametriNave {
  const risultato = parametriBase();
  for (const id of moduli) {
    const def = catalogo[id];
    if (!def) continue;
    for (const p of PARAMETRI_NAVE) {
      // `?? 0`: se il modulo non tocca questo parametro, aggiunge zero.
      risultato[p] += def.effetti[p] ?? 0;
    }
  }
  // Nessun parametro può scendere sotto zero (es. acqua per membro).
  for (const p of PARAMETRI_NAVE) risultato[p] = Math.max(0, risultato[p]);
  return risultato;
}
