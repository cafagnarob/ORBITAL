/**
 * ============================================================================
 * filtro.ts — Quale filtro informativo applica V.A.L.E. a un evento?
 * ============================================================================
 *
 * Un evento può avere più filtri, ognuno attivo con certe direttive.
 * Con la direttiva attiva si usa il primo filtro che la elenca; se nessuno
 * la elenca, V.A.L.E. dice la VERITÀ (l'evento accade normalmente).
 * ============================================================================
 */

import type { DefinizioneEvento, FiltroVale, StatoMissione } from "../types";

export function filtroAttivo(stato: StatoMissione, evento: DefinizioneEvento): FiltroVale | null {
  return evento.filtri?.find((f) => f.direttive.includes(stato.vale.direttiva)) ?? null;
}
