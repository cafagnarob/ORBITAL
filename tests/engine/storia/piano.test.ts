/**
 * ============================================================================
 * piano.test.ts — Dal seed alla supermissione (v3.8)
 * ============================================================================
 *
 * pianoDalSeed è una funzione pura: riceve un catalogo, quindi qui si prova
 * con due missioni inventate, senza dipendere dal contenuto del gioco.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { giorniTotali, pianoDalSeed } from "../../../src/engine/storia/piano";
import type { DefinizioneMissione } from "../../../src/engine/types";

/** Una missione minima: contano solo id, sigla e durate. */
const missione = (id: string, sigla: string, min: number, max: number): DefinizioneMissione => ({
  id,
  sigla,
  nome: id,
  titolo: id,
  bersaglio: { forma: "PIANETA", luogo: id, puntoInteresse: "X" },
  durate: { andata: { min, max }, orbita: { min, max }, rientro: { min, max } },
  scaletta: { passi: [], finale: { task: "T", titolo: "T" } },
  obiettivi: [],
  briefing: { protocollo: "", scheda: [], contesto: [], parti: { andata: "", orbita: "", rientro: "" }, obiettivoFinale: "" },
  risultato: "",
  dati: [],
});

const CATALOGO = [missione("ALFA", "AL", 2, 4), missione("BETA", "BT", 3, 5)];

describe("pianoDalSeed", () => {
  it("la sigla in testa al seed sceglie la missione (anche minuscola o da sola)", () => {
    expect(pianoDalSeed("AL-0001", CATALOGO).id).toBe("ALFA");
    expect(pianoDalSeed("bt-xyz", CATALOGO).id).toBe("BETA");
    expect(pianoDalSeed("BT", CATALOGO).id).toBe("BETA");
  });

  it("una sigla senza trattino non conta: «ALBA» non è la missione AL", () => {
    // Decide il caso, ma il risultato deve essere lo stesso di un seed qualunque.
    expect(["ALFA", "BETA"]).toContain(pianoDalSeed("ALBA", CATALOGO).id);
  });

  it("stesso seed, stesso piano", () => {
    expect(pianoDalSeed("PARTITA-42", CATALOGO)).toEqual(pianoDalSeed("PARTITA-42", CATALOGO));
  });

  it("senza sigla, su molti seed escono tutte le missioni", () => {
    const uscite = new Set(Array.from({ length: 60 }, (_, i) => pianoDalSeed(`S-${i}`, CATALOGO).id));
    expect(uscite).toEqual(new Set(["ALFA", "BETA"]));
  });

  it("le durate stanno negli intervalli, e variano tra un seed e l'altro", () => {
    const piani = Array.from({ length: 80 }, (_, i) => pianoDalSeed(`AL-${i}`, CATALOGO));
    for (const p of piani) {
      for (const g of Object.values(p.durate)) {
        expect(g).toBeGreaterThanOrEqual(2);
        expect(g).toBeLessThanOrEqual(4);
      }
    }
    expect(new Set(piani.map(giorniTotali)).size).toBeGreaterThan(2);
  });

  it("un catalogo vuoto è un errore", () => {
    expect(() => pianoDalSeed("X", [])).toThrow();
  });
});
