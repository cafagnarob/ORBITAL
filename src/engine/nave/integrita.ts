/**
 * ============================================================================
 * integrita.ts — Fasce di integrità di scafo e sistemi
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §5.1 [BLOCCATO].
 *
 * Come per la fatica, nello stato c'è solo il numero (0–100): la fascia
 * mostrata al giocatore ("DEGRADATO", "CRITICO"...) si calcola qui.
 * Le soglie sono struttura del gioco, non bilanciamento: per questo stanno
 * in questo file e non in balance.ts.
 * ============================================================================
 */

import type { Percentuale } from "../types";

export const FASCE_SCAFO = ["NOMINALE", "DANNEGGIATO", "CRITICO", "GRAVE", "DISTRUTTO"] as const;
export type FasciaScafo = (typeof FASCE_SCAFO)[number];

export const FASCE_SISTEMA = ["NOMINALE", "BUONO", "DEGRADATO", "DANNEGGIATO", "CRITICO", "FUORI_SERVIZIO"] as const;
export type FasciaSistema = (typeof FASCE_SISTEMA)[number];

/** 80–100 NOMINALE · 50–79 DANNEGGIATO · 25–49 CRITICO · 1–24 GRAVE · 0 DISTRUTTO */
export function fasciaScafo(valore: Percentuale): FasciaScafo {
  if (valore >= 80) return "NOMINALE";
  if (valore >= 50) return "DANNEGGIATO";
  if (valore >= 25) return "CRITICO";
  if (valore >= 1) return "GRAVE";
  return "DISTRUTTO";
}

/** 90–100 NOMINALE · 70–89 BUONO · 40–69 DEGRADATO · 20–39 DANNEGGIATO · 1–19 CRITICO · 0 FUORI SERVIZIO */
export function fasciaSistema(valore: Percentuale): FasciaSistema {
  if (valore >= 90) return "NOMINALE";
  if (valore >= 70) return "BUONO";
  if (valore >= 40) return "DEGRADATO";
  if (valore >= 20) return "DANNEGGIATO";
  if (valore >= 1) return "CRITICO";
  return "FUORI_SERVIZIO";
}
