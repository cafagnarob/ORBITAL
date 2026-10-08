/**
 * ============================================================================
 * razioni.test.ts — Razioni serali, fame, sete e colloqui del Capitano (v3.4)
 * ============================================================================
 *
 * Si parte dal rapporto serale della missione di prova e si chiude con
 * razioni scelte a mano: così si controlla una regola per volta.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import {
  capacitaGiornaliera,
  caricoBisogni,
  livelloBisogno,
  razioniPredefinite,
  type RazioniSerali,
} from "../../../src/engine/crew/razioni";
import { applicaAzione } from "../../../src/engine/mission";
import { probabilitaColloquio } from "../../../src/engine/storia/colloqui";
import type { StatoMissione } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { avanzaFinoAPausa, esegui } from "../../fixtures/simulazione";
import { CONTESTO_DI_PROVA } from "../../fixtures/taskDiProva";

const rapporto = () => avanzaFinoAPausa(esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }]));
const tutti = (cibo: "PIENA" | "MEZZA" | "NIENTE", acqua: "PIENA" | "MEZZA" | "NIENTE"): RazioniSerali =>
  Object.fromEntries(["mara", "adrian", "nadia", "sarah"].map((id) => [id, { cibo, acqua }]));
const chiudi = (s: StatoMissione, razioni: RazioniSerali) => esegui(s, [{ tipo: "CHIUDI_RAPPORTO", razioni }]);

describe("razioni serali", () => {
  it("piena costa 3, mezza 2, niente 0 (per cibo e acqua)", () => {
    const s = rapporto();
    const razioni: RazioniSerali = { ...tutti("PIENA", "PIENA"), nadia: { cibo: "MEZZA", acqua: "NIENTE" } };
    const dopo = chiudi(s, razioni);
    expect(dopo.risorse.cibo).toBe(120 - (3 + 3 + 2 + 3));
    expect(dopo.risorse.acqua).toBe(120 - (3 + 3 + 0 + 3));
  });

  it("non si può distribuire più di quanto c'è", () => {
    const s = rapporto();
    s.risorse.cibo = 3;
    expect(() => chiudi(s, tutti("PIENA", "PIENA"))).toThrow(/Cibo insufficiente/);
  });

  it("le razioni predefinite si adattano alle scorte: piena, poi mezza, poi a chi arriva", () => {
    const s = rapporto();
    expect(razioniPredefinite(s, CONTESTO_DI_PROVA).mara).toEqual({ cibo: "PIENA", acqua: "PIENA" });
    s.risorse.cibo = 9; // non basta per tutti piena (12), basta per tutti mezza (8)
    expect(razioniPredefinite(s, CONTESTO_DI_PROVA).mara?.cibo).toBe("MEZZA");
    s.risorse.cibo = 4; // solo due mezze razioni (2 + 2)
    const r = razioniPredefinite(s, CONTESTO_DI_PROVA);
    expect(Object.values(r).filter((x) => x.cibo === "MEZZA")).toHaveLength(2);
  });

  it("senza cibo né acqua salgono fame e sete; la razione piena le fa scendere", () => {
    const digiuno = chiudi(rapporto(), tutti("NIENTE", "NIENTE"));
    const mara = digiuno.crew.mara!;
    expect(mara.fame).toBe(BALANCE.razioni.fame.NIENTE);
    expect(mara.sete).toBe(BALANCE.razioni.sete.NIENTE);
    expect(livelloBisogno(mara.sete)).toBe(2);
  });

  it("fame e sete tolgono task al giorno e, oltre il primo livello, salute", () => {
    const s = rapporto();
    const mara = s.crew.mara!;
    mara.fame = 3; // livello 2
    mara.sete = 1; // livello 1
    expect(caricoBisogni(mara)).toBe(3);
    expect(capacitaGiornaliera(mara)).toBe(BALANCE.razioni.taskMassimi - 3);

    const dopo = chiudi(s, tutti("NIENTE", "PIENA"));
    // fame 3+2 = 5 → livello 3 → (3−1) × dannoFame; sete scende a 0.
    expect(dopo.crew.mara!.salute).toBe(100 - 2 * BALANCE.razioni.dannoFame);
  });

  it("chi ha fame e sete recupera meno fatica di notte", () => {
    const s = rapporto();
    s.crew.mara!.fatica = 80;
    s.crew.adrian!.fatica = 80;
    s.crew.mara!.sete = 4; // dopo una mezza razione: 5 → livello 3
    const razioni: RazioniSerali = { ...tutti("PIENA", "PIENA"), mara: { cibo: "PIENA", acqua: "MEZZA" } };
    const mattino = esegui(chiudi(s, razioni), [{ tipo: "AVANZA" }]);
    expect(mattino.crew.mara!.fatica).toBeGreaterThan(mattino.crew.adrian!.fatica);
  });

  it("la capacità giornaliera blocca le assegnazioni in eccesso", () => {
    const s = creaMissioneDiProva();
    s.crew.adrian!.fame = 6;
    s.crew.adrian!.sete = 6; // carico 6 → capacità 0
    expect(() =>
      applicaAzione(s, { tipo: "ASSEGNA_TASK", idDefinizione: "T-MANOVRA", responsabile: "adrian", supporto: null }, CONTESTO_DI_PROVA),
    ).toThrow(/troppo debole/);
  });

  it("la fame rende paranoici: chi diffida di V.A.L.E. diffida di più", () => {
    const s = rapporto();
    s.crew.adrian!.fiduciaVale = 30; // CONTRO
    s.crew.adrian!.fame = 3;
    s.crew.adrian!.sete = 3;
    const prima = s.crew.adrian!.fiduciaVale;
    const dopo = chiudi(s, tutti("NIENTE", "NIENTE"));
    expect(dopo.crew.adrian!.fiduciaVale).toBeLessThan(prima);
  });
});

describe("colloqui del Capitano", () => {
  it("una volta al giorno per persona", () => {
    const s = esegui(creaMissioneDiProva(), [{ tipo: "PARLA", membro: "nadia", discorso: "INCORAGGIA" }]);
    expect(s.colloqui).toHaveLength(1);
    expect(() => esegui(s, [{ tipo: "PARLA", membro: "nadia", discorso: "DIFENDI_VALE" }])).toThrow(/già parlato/);
    // Con un'altra persona si può.
    expect(() => esegui(s, [{ tipo: "PARLA", membro: "mara", discorso: "DIFENDI_VALE" }])).not.toThrow();
  });

  it("un discorso su V.A.L.E. sposta la fiducia (in su se convince, in giù se irrita)", () => {
    const s = esegui(creaMissioneDiProva(), [{ tipo: "PARLA", membro: "nadia", discorso: "DIFENDI_VALE" }]);
    const delta = s.crew.nadia!.fiduciaVale - creaMissioneDiProva().crew.nadia!.fiduciaVale;
    const c = s.colloqui[0]!;
    expect(delta).toBe(c.esito === "CONVINTO" ? BALANCE.colloqui.convinto : BALANCE.colloqui.controproducente);
  });

  it("la fame rende sordi: la probabilità di convincere scende", () => {
    const m = creaMissioneDiProva().crew.mara!;
    const sazio = probabilitaColloquio(m, "DIFENDI_VALE");
    const affamato = probabilitaColloquio({ ...m, fame: 6, sete: 6 }, "DIFENDI_VALE");
    expect(affamato).toBeLessThan(sazio);
  });
});
