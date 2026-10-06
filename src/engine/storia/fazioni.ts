/**
 * ============================================================================
 * fazioni.ts — Da che parte sta ogni membro della crew
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.5, §10.2.
 *
 * La fazione NON si salva: si ricava dalla fiducia in V.A.L.E.
 *   fiducia ≥ 65  → CON_VALE      ("V.A.L.E. sa quello che fa")
 *   fiducia ≤ 35  → CONTRO_VALE   ("non mi fido dei suoi dati")
 *   in mezzo      → INDECISO
 * Così la crew si sposta da sola mentre la storia va avanti: una smentita
 * abbassa la fiducia di tutti, e qualcuno cambia parte. Quando succede,
 * lo DICE (modificaFiduciaMembro → battuta + giornale di bordo).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { limita } from "../tasks/rischio";
import type { Fazione, MembroCrew, StatoMissione } from "../types";
import { battuta } from "./battute";
import { scriviDiario } from "./diario";

export function fazioneDaFiducia(fiducia: number): Fazione {
  const s = BALANCE.storia;
  if (fiducia >= s.fazioneCon) return "CON_VALE";
  if (fiducia <= s.fazioneContro) return "CONTRO_VALE";
  return "INDECISO";
}

export function fazioneDi(membro: MembroCrew): Fazione {
  return fazioneDaFiducia(membro.fiduciaVale);
}

/** I membri vivi e a bordo, in ordine alfabetico (determinismo). */
export function membriAttivi(stato: StatoMissione): MembroCrew[] {
  return Object.keys(stato.crew)
    .sort()
    .map((id) => stato.crew[id])
    .filter((m): m is MembroCrew => m !== undefined && m.stato !== "MORTO" && m.stato !== "DISPERSO");
}

/** Quanti membri attivi stanno in una fazione. */
export function contaFazione(stato: StatoMissione, fazione: Fazione): number {
  return membriAttivi(stato).filter((m) => fazioneDi(m) === fazione).length;
}

/** Cambia la fiducia di UN membro; se cambia fazione, lo dice. */
export function modificaFiduciaMembro(
  bozza: StatoMissione,
  contesto: ContestoMissione,
  membro: MembroCrew,
  delta: number,
): void {
  if (membro.stato === "MORTO" || membro.stato === "DISPERSO" || delta === 0) return;
  const prima = fazioneDi(membro);
  membro.fiduciaVale = limita(membro.fiduciaVale + delta, 0, 100);
  const dopo = fazioneDi(membro);
  if (prima === dopo) return;

  const situazione = dopo === "CON_VALE" ? "PASSA_CON_VALE" : dopo === "CONTRO_VALE" ? "PASSA_CONTRO_VALE" : "TORNA_INDECISO";
  scriviLog(bozza, "CREW", `${membro.nome}: «${battuta(bozza, contesto, membro, situazione)}»`);
  const frasi: Record<Fazione, string> = {
    CON_VALE: `${membro.nome} ha deciso di fidarsi di V.A.L.E.`,
    CONTRO_VALE: `${membro.nome} non si fida più di V.A.L.E.`,
    INDECISO: `${membro.nome} non sa più cosa pensare di V.A.L.E.`,
  };
  scriviDiario(bozza, frasi[dopo]);
}

/** Cambia la fiducia di tutta la crew a bordo (es. dopo una smentita). */
export function modificaFiduciaCrew(bozza: StatoMissione, contesto: ContestoMissione, delta: number): void {
  for (const membro of membriAttivi(bozza)) modificaFiduciaMembro(bozza, contesto, membro, delta);
}
