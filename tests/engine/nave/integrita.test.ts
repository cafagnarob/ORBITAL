/**
 * ============================================================================
 * integrita.test.ts — Confini delle fasce di integrità (DESIGN §5.1)
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { fasciaScafo, fasciaSistema } from "../../../src/engine/nave/integrita";

describe("fasciaScafo", () => {
  it("rispetta i confini del DESIGN", () => {
    expect(fasciaScafo(100)).toBe("NOMINALE");
    expect(fasciaScafo(80)).toBe("NOMINALE");
    expect(fasciaScafo(79)).toBe("DANNEGGIATO");
    expect(fasciaScafo(50)).toBe("DANNEGGIATO");
    expect(fasciaScafo(49)).toBe("CRITICO");
    expect(fasciaScafo(25)).toBe("CRITICO");
    expect(fasciaScafo(24)).toBe("GRAVE");
    expect(fasciaScafo(1)).toBe("GRAVE");
    expect(fasciaScafo(0)).toBe("DISTRUTTO");
  });
});

describe("fasciaSistema", () => {
  it("rispetta i confini del DESIGN", () => {
    expect(fasciaSistema(90)).toBe("NOMINALE");
    expect(fasciaSistema(89)).toBe("BUONO");
    expect(fasciaSistema(70)).toBe("BUONO");
    expect(fasciaSistema(69)).toBe("DEGRADATO");
    expect(fasciaSistema(40)).toBe("DEGRADATO");
    expect(fasciaSistema(39)).toBe("DANNEGGIATO");
    expect(fasciaSistema(20)).toBe("DANNEGGIATO");
    expect(fasciaSistema(19)).toBe("CRITICO");
    expect(fasciaSistema(1)).toBe("CRITICO");
    expect(fasciaSistema(0)).toBe("FUORI_SERVIZIO");
  });
});
