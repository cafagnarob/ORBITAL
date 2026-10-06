/**
 * ============================================================================
 * comportamento.ts — Comportamento e autonomia di V.A.L.E. (calcolati)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3.1 — direttiva ≠ comportamento ≠ autonomia.
 *
 * COMPORTAMENTO (0–5): parte da un livello che dipende dalla direttiva
 *   COMPATIBILE → SUPPORTIVA · NEUTRALE → COOPERATIVA
 *   IN_CONFLITTO → NEUTRALE · CONFLITTO_CRITICO → PERSISTENTE
 * e sale di un livello ogni N punti di tensione (balance.ts).
 * Così l'evoluzione è PROGRESSIVA: mai "buona → cattiva" all'improvviso.
 *
 * AUTONOMIA (0–4): cosa V.A.L.E. può fare. Resta ROUTINE finché il
 * comportamento è collaborativo, poi sale insieme a lui. Da RESTRITTIVA (3)
 * V.A.L.E. può rifiutare i task contrari alla direttiva.
 * L'override (ORD-01) la riporta e la tiene a ROUTINE.
 *
 * Nulla di questo è salvato: si calcola sempre da direttiva + tensione.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { ContestoMissione } from "../mission/contesto";
import {
  AUTONOMIE_VALE,
  COMPORTAMENTI_VALE,
  type AutonomiaVale,
  type ClasseDirettiva,
  type ComportamentoVale,
  type StatoMissione,
} from "../types";
import { direttivaAttiva } from "./direttiva";

const BASE_PER_CLASSE: Record<ClasseDirettiva, number> = {
  COMPATIBILE: 0,
  NEUTRALE: 1,
  IN_CONFLITTO: 2,
  CONFLITTO_CRITICO: 3,
};

/** Livello di comportamento, 0 (SUPPORTIVA) … 5 (OSTILE). */
export function livelloComportamento(stato: StatoMissione, contesto: ContestoMissione): number {
  const classe = direttivaAttiva(stato, contesto)?.classe ?? "NEUTRALE";
  const livello = BASE_PER_CLASSE[classe] + Math.floor(stato.vale.tensione / BALANCE.vale.tensionePerLivello);
  return Math.min(COMPORTAMENTI_VALE.length - 1, livello);
}

/** Livello di autonomia, 0 (ASSISTENZA) … 4 (AUTONOMA). */
export function livelloAutonomia(stato: StatoMissione, contesto: ContestoMissione): number {
  if (stato.vale.override) return 1;
  const comportamento = livelloComportamento(stato, contesto);
  // 0–2 → ROUTINE · 3 PERSISTENTE → OPERATIVA · 4 RESISTENTE → RESTRITTIVA · 5 OSTILE → AUTONOMA
  return Math.max(1, comportamento - 1);
}

export function comportamento(stato: StatoMissione, contesto: ContestoMissione): ComportamentoVale {
  return COMPORTAMENTI_VALE[livelloComportamento(stato, contesto)] ?? "NEUTRALE";
}

export function autonomia(stato: StatoMissione, contesto: ContestoMissione): AutonomiaVale {
  return AUTONOMIE_VALE[livelloAutonomia(stato, contesto)] ?? "ROUTINE";
}

/** Da RESTRITTIVA in su V.A.L.E. può rifiutare i task contrari alla direttiva. */
export const AUTONOMIA_RIFIUTO = 3;
