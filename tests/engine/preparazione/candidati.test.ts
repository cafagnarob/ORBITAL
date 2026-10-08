/**
 * ============================================================================
 * candidati.test.ts — L'estrazione dei 6 candidati di una partita (v3.7.3)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { LISTA_CANDIDATI } from "../../../src/content/candidati";
import { candidatiProposti } from "../../../src/engine/preparazione";

const N = BALANCE.preparazione.candidatiProposti;
const ids = (seed: string) => candidatiProposti(seed, LISTA_CANDIDATI, N).map((c) => c.id);

describe("candidati proposti", () => {
  it(`ogni partita presenta ${N} candidati diversi, presi dal catalogo`, () => {
    const scelti = ids("E17-0042");
    expect(scelti).toHaveLength(N);
    expect(new Set(scelti).size).toBe(N);
    for (const id of scelti) expect(LISTA_CANDIDATI.some((c) => c.id === id)).toBe(true);
  });

  it("stesso seed → stessi candidati; seed diversi → gruppi diversi", () => {
    expect(ids("E17-0042")).toEqual(ids("E17-0042"));
    const gruppi = new Set(Array.from({ length: 20 }, (_, i) => ids(`SEED-${i}`).join(",")));
    expect(gruppi.size).toBeGreaterThan(10);
  });

  it("restano nell'ordine del catalogo", () => {
    const ordine = LISTA_CANDIDATI.map((c) => c.id);
    const scelti = ids("E17-0042");
    expect([...scelti].sort((a, b) => ordine.indexOf(a) - ordine.indexOf(b))).toEqual(scelti);
  });

  it("su tante partite ogni candidato del catalogo prima o poi si presenta", () => {
    const visti = new Set(Array.from({ length: 50 }, (_, i) => ids(`GIRO-${i}`)).flat());
    expect(visti.size).toBe(LISTA_CANDIDATI.length);
  });

  it("ci sono abbastanza candidati per formare la crew", () => {
    expect(N).toBeGreaterThanOrEqual(BALANCE.preparazione.crewRichiesta);
  });
});
