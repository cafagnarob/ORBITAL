/**
 * ============================================================================
 * giornata.ts — I tre appuntamenti fissi del giorno
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6 (risorse), §8 (tempo).
 *
 *   07:00  avviaOperazioni  → partono i task in coda
 *   22:00  rapportoSerale   → consumi del giorno, il gioco si ferma
 *   06:00  risveglio        → recupero della fatica, nuova pianificazione
 *
 * REGOLE [PROVVISORIO]
 * - Consumi di scorte ed energia applicati una volta al giorno, al rapporto.
 * - Il sonno toglie una quantità fissa di fatica a chi è a bordo.
 * Generazione di energia e moduli installati arriveranno con il loadout.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance"
import { minutoDelGiorno, ORARIO_OPERAZIONI, scomponiTempo } from "../clock"
import type { StatoMissione } from "../types"
import type { ContestoMissione } from "./contesto"
import { membriABordo } from "./disponibilita"
import { avviaTaskPronti } from "./esecuzione"
import { scriviLog } from "./log"

/** Fine della pianificazione: si passa alle 07:00 e partono i task. */
export function avviaOperazioni(
  bozza: StatoMissione,
  contesto: ContestoMissione,
): void {
  // Se la pianificazione è finita prima delle 07:00, si attende le 07:00.
  const m = minutoDelGiorno(bozza.tempo)
  if (m < ORARIO_OPERAZIONI) bozza.tempo += ORARIO_OPERAZIONI - m

  bozza.statoGioco = "IN_ESECUZIONE"
  scriviLog(bozza, "VALE", "Capitano. Operazioni avviate.")
  avviaTaskPronti(bozza, contesto)
}

/** 22:00 — si applicano i consumi del giorno e il gioco si ferma. */
export function rapportoSerale(bozza: StatoMissione): void {
  const g = BALANCE.giornata
  const aBordo = membriABordo(bozza).length

  bozza.risorse.scorte = Math.max(
    0,
    bozza.risorse.scorte - aBordo * g.scortePerMembro,
  )

  const bilancioEnergia = g.generazioneEnergia - g.consumoEnergia
  bozza.risorse.energia = Math.min(
    g.capacitaBatteria,
    Math.max(0, bozza.risorse.energia + bilancioEnergia),
  )

  bozza.statoGioco = "RAPPORTO"
  const { giorno } = scomponiTempo(bozza.tempo)
  scriviLog(
    bozza,
    "VALE",
    `Rapporto serale, giorno ${giorno}. Scorte ${bozza.risorse.scorte} · Energia ${bozza.risorse.energia} · Carburante ${bozza.risorse.carburante}.`,
  )
  if (bozza.risorse.scorte === 0) {
    scriviLog(bozza, "VALE", "Capitano. Le scorte sono esaurite.")
  }
}

/** 06:00 — la crew ha dormito: recupera fatica e si torna a pianificare. */
export function risveglio(bozza: StatoMissione): void {
  for (const membro of membriABordo(bozza)) {
    membro.fatica = Math.max(
      0,
      membro.fatica - BALANCE.giornata.recuperoFaticaNotturno,
    )
  }
  bozza.statoGioco = "PIANIFICAZIONE"
  const { giorno } = scomponiTempo(bozza.tempo)
  scriviLog(
    bozza,
    "VALE",
    `Giorno ${giorno}. Buongiorno, Capitano. In attesa di istruzioni.`,
  )
}
