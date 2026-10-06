/**
 * ============================================================================
 * fatica.ts — Fasce di fatica e loro effetti
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.4.
 *
 * COSA FA
 * Nello stato salviamo solo il numero (0–100). Qui lo trasformiamo nella
 * fascia (BASSA, MODERATA, ALTA, ESAURITO) e negli effetti su durata e
 * rischio dei task. È l'applicazione della regola "si salva solo ciò che
 * non si può calcolare": la fascia si calcola sempre da qui.
 *
 * PERCHÉ IN engine/crew/
 * La fatica è una proprietà del membro della crew, non del task: la useranno
 * anche il rapporto serale, il riposo, le raccomandazioni della crew.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance"
import type { Percentuale } from "../types"

export const FASCE_FATICA = ["BASSA", "MODERATA", "ALTA", "ESAURITO"] as const
export type FasciaFatica = (typeof FASCE_FATICA)[number]

/**
 * Fascia corrispondente a un valore di fatica.
 * Si controlla dalla soglia più alta verso il basso: il primo confronto
 * vero è la risposta. Con le soglie 40/70/90: 39 → BASSA, 40 → MODERATA.
 */
export function fasciaFatica(fatica: Percentuale): FasciaFatica {
  const { soglie } = BALANCE.fatica
  if (fatica >= soglie.ESAURITO) return "ESAURITO"
  if (fatica >= soglie.ALTA) return "ALTA"
  if (fatica >= soglie.MODERATA) return "MODERATA"
  return "BASSA"
}

/** Moltiplicatore della durata dei task dovuto alla fatica (1 = nessun effetto). */
export function moltiplicatoreDurataFatica(fatica: Percentuale): number {
  return BALANCE.fatica.moltiplicatoreDurata[fasciaFatica(fatica)]
}

/** Punti di rischio aggiunti a un task dovuti alla fatica. */
export function penalitaRischioFatica(fatica: Percentuale): number {
  return BALANCE.fatica.penalitaRischio[fasciaFatica(fatica)]
}
