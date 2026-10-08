/**
 * ============================================================================
 * mappe.ts — Quale icona per quale cosa del gioco
 * ============================================================================
 *
 * Il contenuto (content/loadout.ts) non sa nulla di icone: è la UI a
 * decidere come mostrare una cassa o una risorsa. Le corrispondenze stanno
 * qui, in un posto solo.
 * ============================================================================
 */

import type { TipoIcona } from "./disegni";

/** Le risorse di missione (stato.risorse) e la loro icona. */
export const ICONA_RISORSA = {
  cibo: "cibo",
  acqua: "acqua",
  ossigeno: "ossigeno",
  energia: "energia",
  carburante: "carburante",
} as const satisfies Record<string, TipoIcona>;

/** Le casse della stiva (content/loadout.ts → LISTA_SCORTE) e la loro icona. */
export const ICONA_SCORTA: Readonly<Record<string, TipoIcona>> = {
  CASSA_CIBO: "cibo",
  CASSA_ACQUA: "acqua",
  BOMBOLA_OSSIGENO: "ossigeno",
  TANICA_CARBURANTE: "carburante",
  CASSA_SCORTE_MEDICHE: "medicine",
  CASSA_PEZZI_RICAMBIO: "ricambi",
  CASSA_CELLE_BATTERIA: "batteria",
  CASSA_CONSUMABILI_RICERCA: "ricerca",
};

/**
 * Le PAROLE dei testi che hanno un'icona (costi, rese, rapporti):
 * "ENERGIA −2" diventa "⚡ ENERGIA −2". Le usa ConIcone.tsx.
 */
export const PAROLE_CON_ICONA: Readonly<Record<string, TipoIcona>> = {
  CIBO: "cibo",
  ACQUA: "acqua",
  OSSIGENO: "ossigeno",
  "O₂": "ossigeno",
  ENERGIA: "energia",
  CARBURANTE: "carburante",
};
