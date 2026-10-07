/**
 * ============================================================================
 * viaggio.test.ts — La tratta in corso (v3.7.1)
 * ============================================================================
 *
 * trattaInCorso() alimenta la Plancia: la griglia che scorre e il pianeta
 * che si avvicina. Qui controlliamo i conti: inizio, metà, arrivo, orbita
 * e rientro.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { creaMissioneIniziale } from "../../../src/content/missioneIniziale";
import { trattaInCorso } from "../../../src/engine/storia/viaggio";
import type { StatoMissione } from "../../../src/engine/types";

const GIORNO = 1440;
const alle = (s: StatoMissione, tempo: number): StatoMissione => ({ ...s, tempo });

describe("trattaInCorso", () => {
  const inizio = creaMissioneIniziale("TRATTA-1");

  it("al via si parte verso E-17 con progresso 0 e 3 giorni all'arrivo", () => {
    const t = trattaInCorso(inizio);
    expect(t?.destinazione).toBe("E-17");
    expect(t?.progresso).toBe(0);
    expect(t?.minutiAllArrivo).toBe(3 * GIORNO);
  });

  it("a metà viaggio il progresso è 0.5", () => {
    const t = trattaInCorso(alle(inizio, inizio.tempo + 1.5 * GIORNO));
    expect(t?.progresso).toBeCloseTo(0.5);
  });

  it("in orbita non c'è nessuna tratta", () => {
    expect(trattaInCorso(alle(inizio, 4 * GIORNO + 600))).toBeNull();
  });

  it("dopo la partenza si torna verso la Terra, con arrivo al risveglio di 3 giorni dopo", () => {
    const partenza = 5 * GIORNO + 15 * 60; // giorno 6, 15:00
    const s: StatoMissione = { ...alle(inizio, partenza), partenza };
    const t = trattaInCorso(s);
    expect(t?.destinazione).toBe("TERRA");
    expect(t?.progresso).toBe(0);
    expect(t?.a).toBe(8 * GIORNO + 360); // giorno 9, 06:00
  });
});
