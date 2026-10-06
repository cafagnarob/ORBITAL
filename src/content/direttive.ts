/**
 * ============================================================================
 * direttive.ts — Le direttive nascoste di V.A.L.E. per E-17 (vertical slice)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §13.7 (catalogo D01–D15).
 *
 * Nella slice ce ne sono tre, una per tipo di partita:
 *   D01 Osserva il Segnale      COMPATIBILE   → V.A.L.E. è sincera. Dubitare
 *                                                di lei costa (fiducia, tempo):
 *                                                è la "paranoia mal riposta".
 *   D05 Preserva la Struttura   NEUTRALE      → svia su ciò che trova nel
 *                                                cratere; non ama i droni.
 *   D12 Sopprimi il Segnale     IN CONFLITTO  → nasconde il segnale; analisi
 *                                                e verifiche la mettono contro
 *                                                il Capitano, fino al rifiuto.
 *
 * tagContrari: i task con questi tag vanno contro la direttiva e fanno
 * salire la tensione (balance.ts).
 *
 * richiede: le capacità che devono essere a bordo perché la direttiva abbia
 * senso (DESIGN §11.4). Osservare o sopprimere un segnale presuppone che la
 * nave sappia SCANSIONARE; preservare la struttura dai droni presuppone che
 * a bordo ci sia un DRONE. Così il loadout scelto nella Preparazione cambia
 * quali misteri sono possibili.
 * ============================================================================
 */

import type { DefinizioneDirettiva, IdDirettiva } from "../engine/types";

export const LISTA_DIRETTIVE: readonly DefinizioneDirettiva[] = [
  { id: "D01", nome: "Osserva il segnale", classe: "COMPATIBILE", peso: 35, tagContrari: [], richiede: ["SCANSIONE"] },
  { id: "D05", nome: "Preserva la struttura", classe: "NEUTRALE", peso: 30, tagContrari: ["DRONE"], richiede: ["DRONE"] },
  { id: "D12", nome: "Sopprimi il segnale", classe: "IN_CONFLITTO", peso: 35, tagContrari: ["SEGNALE", "VERIFICA"], richiede: ["SCANSIONE"] },
];

export const CATALOGO_DIRETTIVE: Readonly<Record<IdDirettiva, DefinizioneDirettiva>> = Object.fromEntries(
  LISTA_DIRETTIVE.map((d) => [d.id, d]),
);
