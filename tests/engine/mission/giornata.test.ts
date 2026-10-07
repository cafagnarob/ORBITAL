/**
 * ============================================================================
 * giornata.test.ts — Rapporto serale, notte e risveglio
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { MINUTI_PER_GIORNO, ORARIO_RAPPORTO, ORARIO_RISVEGLIO } from "../../../src/engine/clock";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { avanzaFinoAPausa, esegui, membro } from "../../fixtures/simulazione";

/** Dalla fixture: operazioni avviate e giornata giocata fino al rapporto. */
function finoAlRapporto() {
  return avanzaFinoAPausa(esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }]));
}

describe("rapporto serale", () => {
  it("alle 22:00 il gioco si ferma in RAPPORTO", () => {
    const stato = finoAlRapporto();
    expect(stato.tempo).toBe(ORARIO_RAPPORTO);
    expect(stato.statoGioco).toBe("RAPPORTO");
  });

  it("al rapporto cibo e acqua NON si consumano: si aspettano le razioni del Capitano", () => {
    const { risorse } = finoAlRapporto();
    expect(risorse.cibo).toBe(120);
    expect(risorse.acqua).toBe(120);
  });

  it("chiuso il rapporto (razioni predefinite: piene) consuma cibo e acqua per ogni membro", () => {
    const g = BALANCE.giornata;
    const { risorse } = esegui(finoAlRapporto(), [{ tipo: "CHIUDI_RAPPORTO" }]);
    expect(risorse.cibo).toBe(120 - 4 * g.ciboPerMembro);
    expect(risorse.acqua).toBe(120 - 4 * g.acquaPerMembro);
  });

  it("un membro morto non consuma", () => {
    const iniziale = creaMissioneDiProva();
    iniziale.crew.sarah!.stato = "MORTO";
    const stato = esegui(avanzaFinoAPausa(esegui(iniziale, [{ tipo: "AVVIA_OPERAZIONI" }])), [{ tipo: "CHIUDI_RAPPORTO" }]);
    expect(stato.risorse.cibo).toBe(120 - 3 * BALANCE.giornata.ciboPerMembro);
  });

  it("con il Supporto Vitale integro l'ossigeno resta stabile", () => {
    // 4 membri × 2 consumati, 8 rigenerati: i serbatoi restano pieni.
    expect(finoAlRapporto().risorse.ossigeno).toBe(BALANCE.giornata.capacitaOssigeno);
  });

  it("con il Supporto Vitale danneggiato l'ossigeno cala", () => {
    const iniziale = creaMissioneDiProva();
    iniziale.nave.sistemi.SUPPORTO_VITALE = 25; // rigenera solo 2
    const stato = avanzaFinoAPausa(esegui(iniziale, [{ tipo: "AVVIA_OPERAZIONI" }]));
    expect(stato.risorse.ossigeno).toBe(60 - 8 + 2);
  });

  it("la batteria si ricarica ma non supera la capacità massima", () => {
    const g = BALANCE.giornata;
    const energiaDopoTask = 150 - 2; // la diagnostica costa 2
    const attesa = Math.min(g.capacitaBatteria, energiaDopoTask + g.generazioneEnergia - g.consumoEnergia);
    expect(finoAlRapporto().risorse.energia).toBe(attesa);
  });

  it("durante il rapporto non si può avanzare", () => {
    expect(() => esegui(finoAlRapporto(), [{ tipo: "AVANZA" }])).toThrow(/non permessa/);
  });
});

describe("notte e risveglio", () => {
  it("chiuso il rapporto, la notte scorre fino alle 06:00 del giorno dopo", () => {
    const stato = esegui(finoAlRapporto(), [{ tipo: "CHIUDI_RAPPORTO" }, { tipo: "AVANZA" }]);
    expect(stato.tempo).toBe(MINUTI_PER_GIORNO + ORARIO_RISVEGLIO);
    expect(stato.statoGioco).toBe("PIANIFICAZIONE");
  });

  it("il sonno riduce la fatica, senza scendere sotto zero", () => {
    const rapporto = finoAlRapporto();
    const faticaSera = membro(rapporto, "mara").fatica;
    const mattino = esegui(rapporto, [{ tipo: "CHIUDI_RAPPORTO" }, { tipo: "AVANZA" }]);
    const attesa = Math.max(0, faticaSera - BALANCE.giornata.recuperoFaticaNotturno);
    expect(membro(mattino, "mara").fatica).toBe(attesa);
    expect(membro(mattino, "adrian").fatica).toBe(0);
  });
});
