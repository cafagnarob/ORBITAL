/**
 * ============================================================================
 * esito.ts — Dal rischio all'esito: un solo tiro da 1 a 100
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9 (cinque esiti).
 *
 * COME FUNZIONA: UNA "LINEA" DI 100 NUMERI DIVISA IN 5 ZONE
 * Si tira un intero da 1 a 100. Numeri bassi = male, numeri alti = bene.
 * Con rischio 40 e precisione 7 (quotaPerfetto = 0.1 + 7 × 0.02 = 0.24):
 *
 *   1 ─── 10 │ 11 ───── 40 │ 41 ── 55 │ 56 ───── 86 │ 87 ── 100
 *   CRITICO  │ FALLIMENTO   │ PARZIALE │ SUCCESSO    │ PERFETTO
 *   (25% dei fallimenti)    (25% dei successi)       (24% dei successi)
 *
 *   - i primi R numeri (R = rischio) sono fallimenti: probabilità R%;
 *   - un quarto di questi sono critici;
 *   - dei successi, il primo quarto è parziale e l'ultima parte è perfetta;
 *   - la PRECISIONE del responsabile allarga la zona perfetta.
 *
 * PERCHÉ UN SOLO TIRO
 * Con un tiro solo, le probabilità di ogni esito si leggono direttamente
 * dalle soglie (vedi probabilitaEsiti). Così la UI potrà mostrare al
 * giocatore la stima di V.A.L.E. ("Rischio di fallimento: 21%")
 * calcolata con la stessa identica logica che decide l'esito vero.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance"
import type { Rng } from "../rng"
import type { EsitoTask, Percentuale } from "../types"

/**
 * Le soglie che dividono la linea 1–100.
 * Ogni valore è l'ULTIMO numero della propria zona.
 */
export interface SoglieEsito {
  /** Tiri da 1 a `critico` → FALLIMENTO_CRITICO. */
  critico: number
  /** Tiri fino a `fallimento` (= rischio) → FALLIMENTO. */
  fallimento: number
  /** Tiri fino a `parziale` → SUCCESSO_PARZIALE. */
  parziale: number
  /** Tiri fino a `successo` → SUCCESSO; oltre → SUCCESSO_PERFETTO. */
  successo: number
}

/** Calcola le soglie a partire da rischio (0–100) e precisione (0–10). */
export function calcolaSoglie(
  rischio: Percentuale,
  precisione: number,
): SoglieEsito {
  const b = BALANCE.task
  const zonaSuccesso = 100 - rischio
  const quotaPerfetto =
    b.quotaPerfettoBase + precisione * b.quotaPerfettoPerPrecisione

  return {
    critico: Math.round(rischio * b.quotaCritico),
    fallimento: rischio,
    parziale: rischio + Math.round(zonaSuccesso * b.quotaParziale),
    successo: 100 - Math.round(zonaSuccesso * quotaPerfetto),
  }
}

/** Legge l'esito corrispondente a un tiro (1–100). */
export function esitoDaTiro(tiro: number, soglie: SoglieEsito): EsitoTask {
  if (tiro <= soglie.critico) return "FALLIMENTO_CRITICO"
  if (tiro <= soglie.fallimento) return "FALLIMENTO"
  if (tiro <= soglie.parziale) return "SUCCESSO_PARZIALE"
  if (tiro <= soglie.successo) return "SUCCESSO"
  return "SUCCESSO_PERFETTO"
}

/**
 * Probabilità (in %) di ogni esito. La somma è sempre 100.
 * Ogni zona contiene (soglia attuale − soglia precedente) numeri su 100,
 * quindi quella differenza È la sua percentuale.
 */
export function probabilitaEsiti(
  soglie: SoglieEsito,
): Record<EsitoTask, number> {
  return {
    FALLIMENTO_CRITICO: soglie.critico,
    FALLIMENTO: soglie.fallimento - soglie.critico,
    SUCCESSO_PARZIALE: soglie.parziale - soglie.fallimento,
    SUCCESSO: soglie.successo - soglie.parziale,
    SUCCESSO_PERFETTO: 100 - soglie.successo,
  }
}

/** Risultato di un tiro: il numero uscito e l'esito che produce. */
export interface RisultatoTiro {
  tiro: number
  esito: EsitoTask
}

/**
 * Tira l'esito con il generatore della partita.
 * Riceve l'Rng già creato dal reducer (pattern "mutabile dentro, puro fuori",
 * vedi rng.ts): fa avanzare la sequenza di esattamente un passo.
 */
export function tiraEsito(soglie: SoglieEsito, rng: Rng): RisultatoTiro {
  const tiro = rng.int(1, 100)
  return { tiro, esito: esitoDaTiro(tiro, soglie) }
}
