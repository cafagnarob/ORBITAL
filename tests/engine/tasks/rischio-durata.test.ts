/**
 * ============================================================================
 * rischio-durata.test.ts — Test di competenza, rischio e durata
 * ============================================================================
 *
 * STRATEGIA: TESTARE PROPRIETÀ, NON NUMERI ESATTI
 * Scrivere "il rischio di Mara è 21" rompe il test a ogni ribilanciamento.
 * Verifichiamo invece le regole che devono restare vere QUALSIASI siano i
 * numeri: più abilità → meno rischio; più fatica → più tempo; un aiutante
 * non peggiora mai le cose; il rischio resta nei limiti.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { calcolaDurata } from "../../../src/engine/tasks/durata";
import { calcolaCompetenza, calcolaRischio } from "../../../src/engine/tasks/rischio";
import type { MembroCrew } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { DIAGNOSTICA, MANOVRA_ORBITALE } from "../../fixtures/taskDiProva";

/** I quattro membri della fixture, presi in modo sicuro. */
function crew() {
  const { mara, adrian, nadia, sarah } = creaMissioneDiProva().crew;
  if (!mara || !adrian || !nadia || !sarah) throw new Error("fixture incompleta");
  return { mara, adrian, nadia, sarah };
}

/** Copia di un membro con alcuni campi cambiati. */
function con(m: MembroCrew, modifiche: Partial<MembroCrew>): MembroCrew {
  return { ...m, ...modifiche };
}

// ----------------------------------------------------------------------------
describe("calcolaCompetenza", () => {
  it("senza abilità secondaria conta solo la principale", () => {
    const { adrian } = crew();
    expect(calcolaCompetenza(MANOVRA_ORBITALE, adrian, null)).toBe(adrian.abilita.PILOTAGGIO);
  });

  it("l'abilità secondaria è dell'aiutante, se c'è", () => {
    const { mara, nadia } = crew();
    const p = BALANCE.task.pesoAbilitaPrincipale;
    expect(calcolaCompetenza(DIAGNOSTICA, mara, nadia)).toBeCloseTo(
      mara.abilita.INGEGNERIA * p + nadia.abilita.SCIENZA * (1 - p),
    );
  });

  it("senza aiutante l'abilità secondaria è del responsabile", () => {
    const { mara } = crew();
    const p = BALANCE.task.pesoAbilitaPrincipale;
    expect(calcolaCompetenza(DIAGNOSTICA, mara, null)).toBeCloseTo(
      mara.abilita.INGEGNERIA * p + mara.abilita.SCIENZA * (1 - p),
    );
  });
});

// ----------------------------------------------------------------------------
describe("calcolaRischio", () => {
  it("l'esperto rischia meno del non esperto", () => {
    const { mara, sarah } = crew(); // Ingegneria 8 contro 1
    expect(calcolaRischio(DIAGNOSTICA, mara, null)).toBeLessThan(calcolaRischio(DIAGNOSTICA, sarah, null));
  });

  it("un buon aiutante riduce il rischio", () => {
    const { mara, nadia } = crew();
    expect(calcolaRischio(DIAGNOSTICA, mara, nadia)).toBeLessThan(calcolaRischio(DIAGNOSTICA, mara, null));
  });

  it("la fatica aumenta il rischio", () => {
    const { mara } = crew();
    const stanca = con(mara, { fatica: 95 });
    expect(calcolaRischio(DIAGNOSTICA, stanca, null)).toBeGreaterThan(calcolaRischio(DIAGNOSTICA, mara, null));
  });

  it("resta sempre tra il minimo e il massimo ed è intero", () => {
    const { mara } = crew();
    const { rischioMinimo, rischioMassimo } = BALANCE.task;
    const genio = con(mara, { abilita: { ...mara.abilita, INGEGNERIA: 10, SCIENZA: 10 } });
    const negato = con(mara, { abilita: { ...mara.abilita, INGEGNERIA: 0, SCIENZA: 0 }, fatica: 100 });
    const facile = { ...DIAGNOSTICA, rischioBase: 0 };
    const impossibile = { ...DIAGNOSTICA, rischioBase: 100 };

    expect(calcolaRischio(facile, genio, null)).toBe(rischioMinimo);
    expect(calcolaRischio(impossibile, negato, null)).toBe(rischioMassimo);
    expect(Number.isInteger(calcolaRischio(DIAGNOSTICA, mara, null))).toBe(true);
  });
});

// ----------------------------------------------------------------------------
describe("calcolaDurata", () => {
  it("con abilità medie e senza fatica la durata è quella base", () => {
    const { mara } = crew();
    const medio = con(mara, { abilita: { ...mara.abilita, VELOCITA: BALANCE.task.abilitaNeutra }, fatica: 0 });
    expect(calcolaDurata(DIAGNOSTICA, medio, null)).toBe(DIAGNOSTICA.durataBase);
  });

  it("la fatica allunga i tempi, la velocità e l'aiutante li accorciano", () => {
    const { mara, nadia } = crew();
    const base = calcolaDurata(DIAGNOSTICA, mara, null);
    expect(calcolaDurata(DIAGNOSTICA, con(mara, { fatica: 80 }), null)).toBeGreaterThan(base);
    expect(calcolaDurata(DIAGNOSTICA, con(mara, { abilita: { ...mara.abilita, VELOCITA: 10 } }), null)).toBeLessThan(base);
    expect(calcolaDurata(DIAGNOSTICA, mara, nadia)).toBeLessThan(base);
  });

  it("è un intero di almeno 1 minuto", () => {
    const { adrian } = crew();
    const lampo = { ...MANOVRA_ORBITALE, durataBase: 1 };
    const durata = calcolaDurata(lampo, con(adrian, { abilita: { ...adrian.abilita, VELOCITA: 10 } }), null);
    expect(durata).toBe(1);
  });
});
