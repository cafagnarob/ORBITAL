/**
 * ============================================================================
 * salute.ts — Salute e condizione dei membri della crew
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.2 (stati del membro).
 *
 * La SALUTE è un numero (0–100); lo STATO (SANO, FERITO…) ne è in gran
 * parte la conseguenza. Per non far divergere i due, cambiamo la salute
 * SOLO con modificaSalute(), che aggiorna anche lo stato:
 *   > 85  SANO      36–85  FERITO      1–35  CRITICO      0  MORTO
 * (v3.9: prima FERITO partiva da 60, così una ferita da −15 lasciava il
 * membro "sano" e V.A.L.E. lo diceva sano. Ora ogni ferita vera si vede.)
 * Eccezioni: MORTO è definitivo (nessuna cura lo annulla); DISPERSO e
 * INCOSCIENTE non dipendono dalla salute e restano finché un evento non
 * li cambia.
 * ============================================================================
 */

import type { MembroCrew, StatoMembro } from "../types";

export const SOGLIE_SALUTE = { FERITO: 85, CRITICO: 35 } as const;

/** Lo stato che corrisponde a una certa salute. */
export function statoDaSalute(salute: number): StatoMembro {
  if (salute <= 0) return "MORTO";
  if (salute <= SOGLIE_SALUTE.CRITICO) return "CRITICO";
  if (salute <= SOGLIE_SALUTE.FERITO) return "FERITO";
  return "SANO";
}

/**
 * Cambia la salute di un membro (sulla BOZZA) e aggiorna il suo stato.
 * Restituisce true se il membro è appena morto: chi chiama lo annuncia.
 */
export function modificaSalute(membro: MembroCrew, delta: number): boolean {
  if (membro.stato === "MORTO") return false;
  membro.salute = Math.max(0, Math.min(100, membro.salute + delta));
  if (membro.stato === "DISPERSO" || membro.stato === "INCOSCIENTE") {
    if (membro.salute > 0) return false;
  }
  membro.stato = statoDaSalute(membro.salute);
  return membro.stato === "MORTO";
}
