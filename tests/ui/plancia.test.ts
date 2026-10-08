/**
 * ============================================================================
 * plancia.test.ts — I calcoli della Plancia e degli strumenti (v3.7.1)
 * ============================================================================
 *
 * La grafica non si testa con Vitest, ma i NUMERI che la guidano sì:
 * modo dell'orbita, distanza, conto alla rovescia, raggio del pianeta,
 * angolo delle lancette e archi dei quadranti.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { creaMissioneIniziale } from "../../src/content/missioneIniziale";
import type { StatoMissione } from "../../src/engine/types";
import { contoAllaRovescia, distanzaUA, modoOrbita, numeriDalSeed, raggioDestinazione } from "../../src/ui/missione/plancia/derivati";
import { angoloLancetta, circonferenza, trattoArco } from "../../src/ui/missione/strumenti/geometria";

const tratta = (progresso: number) => ({ destinazione: "BERSAGLIO" as const, da: 0, a: 100, progresso, minutiAllArrivo: 0 });

describe("Plancia · derivati", () => {
  const base = creaMissioneIniziale("PLANCIA-1");

  it("in orbita si osserva; con una scansione del cratere in corso si acquisisce; poi l'obiettivo è conseguito", () => {
    expect(modoOrbita(base)).toBe("OSSERVAZIONE");
    const inCorso: StatoMissione = {
      ...base,
      tasks: {
        t1: { ...Object.values(base.tasks)[0], id: "t1", idDefinizione: "T-SCANSIONE-OBIETTIVO", stato: "IN_CORSO" } as StatoMissione["tasks"][string],
      },
    };
    expect(modoOrbita(inCorso)).toBe("ACQUISIZIONE");
    const fatta: StatoMissione = { ...base, conoscenza: { ...base.conoscenza, scoperte: ["OBIETTIVO_PRIMARIO"] } };
    expect(modoOrbita(fatta)).toBe("ACQUISITA");
  });

  it("la distanza scende a zero e il pianeta cresce con il progresso", () => {
    expect(distanzaUA(tratta(0))).toBe("1.84");
    expect(distanzaUA(tratta(1))).toBe("0.00");
    expect(raggioDestinazione(0)).toBeLessThan(raggioDestinazione(0.5));
    expect(raggioDestinazione(0.5)).toBeLessThan(raggioDestinazione(1));
  });

  it("il conto alla rovescia è in ore:minuti", () => {
    expect(contoAllaRovescia(4320)).toBe("T−72:00");
    expect(contoAllaRovescia(65)).toBe("T−01:05");
  });

  it("i numeri decorativi sono stabili per seed e diversi tra seed", () => {
    expect(numeriDalSeed("A", 5, 100)).toEqual(numeriDalSeed("A", 5, 100));
    expect(numeriDalSeed("A", 5, 100)).not.toEqual(numeriDalSeed("B", 5, 100));
    for (const n of numeriDalSeed("A", 20, 100)) expect(n).toBeGreaterThanOrEqual(0);
  });
});

describe("strumenti · geometria", () => {
  it("la lancetta va da −135° (0) a +135° (100), passando per 0° a metà", () => {
    expect(angoloLancetta(0)).toBe(-135);
    expect(angoloLancetta(50)).toBe(0);
    expect(angoloLancetta(100)).toBe(135);
    expect(angoloLancetta(140)).toBe(135); // fuori scala: si ferma al fondo
  });

  it("l'arco pieno su 270° è tre quarti di circonferenza", () => {
    const [pieno] = trattoArco(18, 1, 270).split(" ").map(Number);
    expect(pieno).toBeCloseTo(circonferenza(18) * 0.75, 1);
    const [vuoto] = trattoArco(18, 0, 270).split(" ").map(Number);
    expect(vuoto).toBe(0);
  });
});
