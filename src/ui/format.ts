/**
 * ============================================================================
 * format.ts — Trasformare i dati del motore in testo e "toni" per la UI
 * ============================================================================
 *
 * Il motore parla in codici ("SUPPORTO_VITALE", 21, "ALTA"); il giocatore
 * legge "SUPPORTO VITALE", "21%", e vede un colore. Tutte queste traduzioni
 * stanno qui, così i componenti restano semplici e le regole di colore
 * (verde / ambra / rosso) sono decise in un solo posto.
 * ============================================================================
 */

import type { FasciaFatica } from "../engine/crew/fatica";
import type { FasciaScafo, FasciaSistema } from "../engine/nave/integrita";
import type { Minuti, Percentuale, StatoMembro } from "../engine/types";

/** I tre toni del design system: verde, ambra, rosso. */
export type Tono = "normale" | "attenzione" | "critico";

/** "SUPPORTO_VITALE" → "SUPPORTO VITALE". */
export function etichetta(codice: string): string {
  return codice.replaceAll("_", " ");
}

/** 115 → "1h 55m"; 45 → "45m". */
export function formattaDurata(minuti: Minuti): string {
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Solo l'orario, es. "09:05" (il giorno è già nell'intestazione). */
export function formattaOra(t: Minuti): string {
  const m = t % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function tonoRischio(rischio: Percentuale): Tono {
  if (rischio >= 45) return "critico";
  if (rischio >= 25) return "attenzione";
  return "normale";
}

export function tonoFatica(fascia: FasciaFatica): Tono {
  if (fascia === "ESAURITO") return "critico";
  if (fascia === "ALTA") return "attenzione";
  return "normale";
}

export function tonoSistema(fascia: FasciaSistema): Tono {
  if (fascia === "NOMINALE" || fascia === "BUONO") return "normale";
  if (fascia === "DEGRADATO") return "attenzione";
  return "critico";
}

export function tonoScafo(fascia: FasciaScafo): Tono {
  if (fascia === "NOMINALE") return "normale";
  if (fascia === "DANNEGGIATO") return "attenzione";
  return "critico";
}

export function tonoStatoMembro(stato: StatoMembro): Tono {
  if (stato === "SANO") return "normale";
  if (stato === "FERITO") return "attenzione";
  return "critico";
}
