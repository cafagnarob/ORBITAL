/**
 * ============================================================================
 * toni.test.ts — Il dialogo con V.A.L.E. (v3.9): toni, nuove domande,
 *                feriti, scuse, codici casuali
 * ============================================================================
 *
 * Il contesto di prova ha risposte riconoscibili ("SCORTE-SUFFICIENTI",
 * "SEGNALE-SI"…) e una direttiva IN_CONFLITTO: livello di comportamento
 * 2 senza tensione, 3 con tensione 3, 4 con tensione 6.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { applicaAzione, type Azione, type ContestoMissione } from "../../../src/engine/mission";
import { forseCodiceCasuale } from "../../../src/engine/terminale/codiciCasuali";
import type { DomandaVale, StatoMissione, TonoCapitano } from "../../../src/engine/types";
import { consiglio } from "../../../src/engine/vale/domande";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { CONTESTO_DI_PROVA } from "../../fixtures/taskDiProva";

const c: ContestoMissione = {
  ...CONTESTO_DI_PROVA,
  catalogoDirettive: { "D-TEST": { id: "D-TEST", nome: "Test", classe: "IN_CONFLITTO", peso: 1, tagContrari: [], richiede: [] } },
  catalogoCodici: {
    "AAA-1": { codice: "AAA-1", livelloRichiesto: 0, livelloOttenuto: 1, risposta: [], effetti: [] },
    "BBB-2": { codice: "BBB-2", livelloRichiesto: 1, livelloOttenuto: 2, risposta: [], effetti: [] },
  },
};

function stato(tensione = 0, tono: TonoCapitano = "CALMO"): StatoMissione {
  const s = creaMissioneDiProva();
  s.vale.direttiva = "D-TEST";
  s.vale.tensione = tensione;
  s.vale.tono = tono;
  return s;
}
const esegui = (s: StatoMissione, azioni: Azione[]) => azioni.reduce((acc, a) => applicaAzione(acc, a, c), s);
const chiedi = (s: StatoMissione, domanda: DomandaVale) => esegui(s, [{ tipo: "INTERROGA_VALE", domanda }]);
const ultimaVale = (s: StatoMissione) => s.log.filter((v) => v.fonte === "VALE").at(-1)?.testo ?? "";

describe("la battuta del Capitano", () => {
  it("finisce nel log come CAPITANO, con il tono", () => {
    const s = chiedi(stato(0, "ARRABBIATO"), "STATO");
    const cap = s.log.find((v) => v.fonte === "CAPITANO");
    expect(cap?.tono).toBe("ARRABBIATO");
  });

  it("IMPOSTA_TONO cambia il tono e non fa altro", () => {
    const prima = stato();
    const dopo = esegui(prima, [{ tipo: "IMPOSTA_TONO", tono: "FERMO" }]);
    expect(dopo.vale.tono).toBe("FERMO");
    expect(dopo.log).toEqual(prima.log);
    expect(dopo.vale.tensione).toBe(prima.vale.tensione);
  });
});

describe("i toni cambiano risposte e numeri", () => {
  it("AMICHEVOLE: un livello più disponibile e la crew si fida un po' di più", () => {
    // Tensione 6 → livello 4: in CALMO mente sulle scorte, AMICHEVOLE (livello 3) no.
    expect(ultimaVale(chiedi(stato(6), "RISORSE"))).toBe("SCORTE-SUFFICIENTI");
    const amica = chiedi(stato(6, "AMICHEVOLE"), "RISORSE");
    expect(ultimaVale(amica)).toContain("SCORTE ");
    expect(amica.crew.mara?.fiduciaVale).toBe((stato().crew.mara?.fiduciaVale ?? 0) + BALANCE.vale.toni.AMICHEVOLE.fiduciaCrew);
  });

  it("FERMO: sulle domande di fatto i dati veri anche quando è in tensione; su di lei la irrita", () => {
    expect(ultimaVale(chiedi(stato(6, "FERMO"), "RISORSE"))).toContain("SCORTE ");
    expect(chiedi(stato(0, "FERMO"), "RISORSE").vale.tensione).toBe(0);
    expect(chiedi(stato(0, "FERMO"), "PERCHE").vale.tensione).toBe(BALANCE.vale.toni.FERMO.suDiLei);
  });

  it("ARRABBIATO: più tensione, la crew diffida, e prima o poi V.A.L.E. si incrina con un codice", () => {
    const s = chiedi(stato(0, "ARRABBIATO"), "STATO");
    expect(s.vale.tensione).toBe(BALANCE.vale.toni.ARRABBIATO.tensione);
    expect(s.crew.mara?.fiduciaVale).toBeLessThan(stato().crew.mara?.fiduciaVale ?? 0);
    let t = stato(0, "ARRABBIATO");
    for (let i = 0; i < 20; i++) t = chiedi(t, "SALUTO");
    expect(t.log.some((v) => v.fonte === "SISTEMA" && v.codici.length > 0 && v.testo.startsWith("CREPA"))).toBe(true);
  });

  it("SOSPETTOSO: la concordanza della verifica incrociata scende quando V.A.L.E. è evasiva", () => {
    const concordanza = (s: StatoMissione) => Number(/VERIFICA (\d+)%/.exec(s.log.at(-1)?.testo ?? "")?.[1]);
    const calma = concordanza(chiedi(stato(0, "SOSPETTOSO"), "STATO"));
    const tesa = concordanza(chiedi(stato(9, "SOSPETTOSO"), "STATO"));
    expect(calma).toBeGreaterThan(tesa);
  });

  it("ogni tono apre la risposta a modo suo (cornice), CALMO no", () => {
    expect(ultimaVale(chiedi(stato(), "SALUTO"))).toBe("SALUTO-0");
    expect(ultimaVale(chiedi(stato(0, "AMICHEVOLE"), "SALUTO"))).toBe("AMICA SALUTO-0");
  });
});

describe("le nuove domande", () => {
  it("il segnale: prima non c'è, poi sì", () => {
    expect(ultimaVale(chiedi(stato(), "SEGNALE"))).toBe("SEGNALE-NO");
    const s = stato();
    s.conoscenza.scoperte.push("SEGNALE_RILEVATO");
    expect(ultimaVale(chiedi(s, "SEGNALE"))).toBe("SEGNALE-SI");
  });

  it("la missione dice giorno e durata dal piano", () => {
    expect(ultimaVale(chiedi(stato(), "MISSIONE"))).toBe("MISSIONE G1/10");
  });

  it("il consiglio punta alla scorta che sta finendo", () => {
    const s = stato();
    s.risorse.acqua = 10;
    expect(consiglio(s, c)).toMatch(/acqua per 0 giorni/);
  });

  it("le scuse tolgono tensione, una volta al giorno", () => {
    const s = esegui(stato(4), [{ tipo: "SCRIVI_VALE", testo: "Scusami" }]);
    expect(s.vale.tensione).toBe(4 - BALANCE.vale.scusaTensione);
    expect(ultimaVale(s)).toBe("SCUSA-OK");
    const ancora = esegui(s, [{ tipo: "SCRIVI_VALE", testo: "scusa ancora" }]);
    expect(ancora.vale.tensione).toBe(s.vale.tensione);
    expect(ultimaVale(ancora)).toBe("SCUSA-PRESTO");
  });
});

describe("i feriti (bug v3.9)", () => {
  it("una ferita da −15 rende il membro FERITO, e V.A.L.E. lo dice con la salute", () => {
    const s = stato();
    const mara = s.crew.mara;
    if (!mara) throw new Error("manca mara");
    mara.salute = 85;
    mara.stato = "FERITO";
    expect(ultimaVale(chiedi(s, "EQUIPAGGIO"))).toMatch(/Mara ferito \(85%\)/);
  });
});

describe("codici casuali nei log", () => {
  it("compaiono ogni tanto (né spesso né mai), con il codice nella riga", () => {
    let comparsi = 0;
    for (let i = 0; i < 400; i++) {
      const s = stato();
      s.seed = `CASUALE-${i}`;
      if (forseCodiceCasuale(s, c) !== null) {
        comparsi++;
        const riga = s.log.at(-1);
        expect(riga?.codici.length).toBe(1);
        expect(riga?.testo).toContain(riga?.codici[0] ?? "?");
      }
    }
    const atteso = 400 * BALANCE.codici.probabilitaPerTurno;
    expect(comparsi).toBeGreaterThan(atteso * 0.6);
    expect(comparsi).toBeLessThan(atteso * 1.4);
  });

  it("stessa partita e stesso momento → stesso codice", () => {
    const a = stato();
    const b = stato();
    expect(forseCodiceCasuale(a, c)).toBe(forseCodiceCasuale(b, c));
  });
});
