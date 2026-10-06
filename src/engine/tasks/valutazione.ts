/**
 * ============================================================================
 * valutazione.ts — Valutazione completa di un task prima di avviarlo
 * ============================================================================
 *
 * COSA FA
 * Mette insieme durata, rischio, soglie e probabilità per una combinazione
 * "task + responsabile + aiutante". È l'unico punto d'ingresso che il
 * reducer (e in futuro la UI) devono chiamare: non devono sapere che
 * dietro ci sono quattro file diversi. Questo schema si chiama "facciata".
 *
 * Controlla anche che la combinazione sia valida. Le regole su CHI può
 * lavorare (stato, posizione, coda piena) arriveranno con l'assegnazione;
 * qui ci sono solo quelle che riguardano il task in sé.
 * ============================================================================
 */

import type {
  DefinizioneTask,
  EsitoTask,
  MembroCrew,
  Minuti,
  Percentuale,
} from "../types"
import { calcolaDurata } from "./durata"
import { calcolaSoglie, probabilitaEsiti, type SoglieEsito } from "./esito"
import { calcolaRischio } from "./rischio"

export interface ValutazioneTask {
  durata: Minuti
  /** Probabilità di fallimento (inclusi i critici), 0–100. */
  rischio: Percentuale
  soglie: SoglieEsito
  probabilita: Record<EsitoTask, number>
}

export function valutaTask(
  def: DefinizioneTask,
  responsabile: MembroCrew,
  supporto: MembroCrew | null,
): ValutazioneTask {
  if (supporto !== null) {
    if (!def.supportoAmmesso) {
      throw new Error(`valutaTask: il task ${def.id} non ammette un aiutante`)
    }
    if (supporto.id === responsabile.id) {
      throw new Error(
        `valutaTask: ${responsabile.id} non può aiutare sé stesso`,
      )
    }
  }

  const rischio = calcolaRischio(def, responsabile, supporto)
  // La precisione che conta è quella di chi guida il lavoro.
  const soglie = calcolaSoglie(rischio, responsabile.abilita.PRECISIONE)

  return {
    durata: calcolaDurata(def, responsabile, supporto),
    rischio,
    soglie,
    probabilita: probabilitaEsiti(soglie),
  }
}
