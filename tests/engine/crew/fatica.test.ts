/**
 * ============================================================================
 * fatica.test.ts — Test delle fasce di fatica
 * ============================================================================
 *
 * I confini delle fasce si leggono da BALANCE invece di scriverli a mano:
 * se un playtest sposta la soglia ALTA da 70 a 65, i test restano validi.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import {
  fasciaFatica,
  moltiplicatoreDurataFatica,
  penalitaRischioFatica,
} from "../../../src/engine/crew/fatica";

const { soglie } = BALANCE.fatica;

describe("fasciaFatica", () => {
  it("assegna le fasce rispettando i confini", () => {
    expect(fasciaFatica(0)).toBe("BASSA");
    expect(fasciaFatica(soglie.MODERATA - 1)).toBe("BASSA");
    expect(fasciaFatica(soglie.MODERATA)).toBe("MODERATA");
    expect(fasciaFatica(soglie.ALTA - 1)).toBe("MODERATA");
    expect(fasciaFatica(soglie.ALTA)).toBe("ALTA");
    expect(fasciaFatica(soglie.ESAURITO)).toBe("ESAURITO");
    expect(fasciaFatica(100)).toBe("ESAURITO");
  });
});

describe("effetti della fatica", () => {
  const valori = [0, soglie.MODERATA, soglie.ALTA, soglie.ESAURITO];

  it("da riposati non c'è alcun effetto", () => {
    expect(moltiplicatoreDurataFatica(0)).toBe(1);
    expect(penalitaRischioFatica(0)).toBe(0);
  });

  it("più fatica non rende mai i task più veloci o meno rischiosi", () => {
    for (let i = 1; i < valori.length; i++) {
      const prima = valori[i - 1]!;
      const dopo = valori[i]!;
      expect(moltiplicatoreDurataFatica(dopo)).toBeGreaterThanOrEqual(moltiplicatoreDurataFatica(prima));
      expect(penalitaRischioFatica(dopo)).toBeGreaterThanOrEqual(penalitaRischioFatica(prima));
    }
  });
});
