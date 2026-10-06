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

  it("consuma le scorte per ogni membro a bordo", () => {
    const g = BALANCE.giornata;
    expect(finoAlRapporto().risorse.scorte).toBe(540 - 4 * g.scortePerMembro);
  });

  it("un membro morto non consuma scorte", () => {
    const iniziale = creaMissioneDiProva();
    iniziale.crew.sarah!.stato = "MORTO";
    const stato = avanzaFinoAPausa(esegui(iniziale, [{ tipo: "AVVIA_OPERAZIONI" }]));
    expect(stato.risorse.scorte).toBe(540 - 3 * BALANCE.giornata.scortePerMembro);
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
