/**
 * ============================================================================
 * rischio.ts — Competenza e rischio effettivo di un task
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9 (formula del rischio, proposta v2.1).
 *
 * LA FORMULA, A PAROLE
 *   1. COMPETENZA (scala 0–10): quanto è bravo chi esegue il task.
 *        70% abilità principale del responsabile
 *      + 30% abilità secondaria (dell'aiutante se c'è, altrimenti sua).
 *   2. RISCHIO EFFETTIVO (0–100): probabilità di fallire.
 *        rischio base del task
 *      − 6 punti per ogni punto di competenza sopra 5 (o + sotto 5)
 *      + penalità di fatica del responsabile
 *      − 5 se c'è un aiutante
 *      il tutto limitato tra 2 e 95, e arrotondato.
 *
 * ESEMPIO: Diagnostica (rischio base 30, Ingegneria + Scienza) fatta da Mara
 * (Ingegneria 8, Scienza 3, fatica 10):
 *   competenza = 8 × 0.7 + 3 × 0.3 = 6.5
 *   rischio    = 30 − (6.5 − 5) × 6 + 0 = 21%
 * Con Nadia come aiutante (Scienza 9):
 *   competenza = 8 × 0.7 + 9 × 0.3 = 8.3
 *   rischio    = 30 − 3.3 × 6 − 5 = 5.2 → 5%
 * La scelta dell'aiutante conta davvero, ed è una scelta: Nadia aiuta Mara,
 * ma intanto non fa altro.
 *
 * Tutti i numeri vengono da content/balance.ts.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance"
import { penalitaRischioFatica } from "../crew/fatica"
import type { DefinizioneTask, MembroCrew, Percentuale } from "../types"

/**
 * Competenza combinata, scala 0–10.
 * `supporto` è `MembroCrew | null`: null significa "lavora da solo".
 */
export function calcolaCompetenza(
  def: DefinizioneTask,
  responsabile: MembroCrew,
  supporto: MembroCrew | null,
): number {
  const principale = responsabile.abilita[def.abilitaPrincipale]

  // Task senza abilità secondaria: conta solo la principale.
  if (def.abilitaSecondaria === null) return principale

  // L'operatore ?? ("nullish coalescing") vuol dire: usa `supporto`,
  // ma se è null usa `responsabile`.
  const esecutoreSecondaria = supporto ?? responsabile
  const secondaria = esecutoreSecondaria.abilita[def.abilitaSecondaria]

  const peso = BALANCE.task.pesoAbilitaPrincipale
  return principale * peso + secondaria * (1 - peso)
}

/** Limita un valore tra un minimo e un massimo. */
export function limita(valore: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valore))
}

/** Rischio effettivo di fallimento, intero tra rischioMinimo e rischioMassimo. */
export function calcolaRischio(
  def: DefinizioneTask,
  responsabile: MembroCrew,
  supporto: MembroCrew | null,
): Percentuale {
  const b = BALANCE.task
  const competenza = calcolaCompetenza(def, responsabile, supporto)

  const rischio =
    def.rischioBase -
    (competenza - b.abilitaNeutra) * b.rischioPerPuntoCompetenza +
    penalitaRischioFatica(responsabile.fatica) -
    (supporto !== null ? b.bonusRischioSupporto : 0)

  return Math.round(limita(rischio, b.rischioMinimo, b.rischioMassimo))
}
