/**
 * ============================================================================
 * durata.ts — Durata effettiva di un task
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.4 (fatica), §9 (task).
 *
 * LA FORMULA
 *   durata = durata base
 *          × moltiplicatore fatica del responsabile   (1 / 1.1 / 1.25 / 1.5)
 *          × (1 − (velocità − 5) × 0.04)              (vel. 10 → ×0.8, vel. 0 → ×1.2)
 *          × 0.85 se c'è un aiutante                   (−15%)
 *   arrotondata ai minuti, mai meno di 1.
 *
 * Si MOLTIPLICANO i fattori invece di sommarli: così ogni effetto è una
 * percentuale della durata, e un task di 10 minuti e uno di 5 ore vengono
 * influenzati in proporzione.
 *
 * NON INCLUSO (ARRIVERÀ NEL REDUCER)
 * Il tempo di spostamento verso il luogo del task (DESIGN §7.6) dipende da
 * dove si trova il membro in quel momento, quindi si aggiunge quando il task
 * viene avviato, non qui.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance"
import { moltiplicatoreDurataFatica } from "../crew/fatica"
import type { DefinizioneTask, MembroCrew, Minuti } from "../types"

export function calcolaDurata(
  def: DefinizioneTask,
  responsabile: MembroCrew,
  supporto: MembroCrew | null,
): Minuti {
  const b = BALANCE.task

  const fattoreFatica = moltiplicatoreDurataFatica(responsabile.fatica)
  const fattoreVelocita =
    1 -
    (responsabile.abilita.VELOCITA - b.abilitaNeutra) * b.durataPerPuntoVelocita
  const fattoreSupporto = supporto !== null ? 1 - b.riduzioneDurataSupporto : 1

  const durata =
    def.durataBase * fattoreFatica * fattoreVelocita * fattoreSupporto
  return Math.max(1, Math.round(durata))
}
