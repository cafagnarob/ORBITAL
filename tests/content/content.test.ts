/**
 * ============================================================================
 * content.test.ts — Il contenuto del gioco è coerente con il motore
 * ============================================================================
 *
 * Il contenuto è scritto a mano: è facile sbagliare un ID o dimenticare un
 * campo. Questi test controllano che i dati veri del gioco rispettino le
 * regole del motore, così un errore di battitura si scopre qui e non
 * a metà partita.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { CONTESTO_GIOCO } from "../../src/content/contesto";
import { creaMissioneIniziale } from "../../src/content/missioneIniziale";
import { TASK_DISPONIBILI } from "../../src/content/tasks";
import { applicaAzione } from "../../src/engine/mission";

describe("catalogo dei task", () => {
  it("ha ID unici", () => {
    const ids = TASK_DISPONIBILI.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("i task che non ammettono aiutanti non hanno abilità secondaria da 'prestare'", () => {
    for (const t of TASK_DISPONIBILI) {
      if (!t.supportoAmmesso) expect(t.abilitaSecondaria).toBeNull();
    }
  });

  it("ogni task è eseguibile con il loadout iniziale", () => {
    const { nave } = creaMissioneIniziale();
    for (const t of TASK_DISPONIBILI) {
      for (const e of t.equipaggiamentoRichiesto) expect(nave.equipaggiamento).toContain(e);
    }
  });
});

describe("missione iniziale", () => {
  it("rispetta gli slot del loadout e ha una coda per ogni membro", () => {
    const stato = creaMissioneIniziale();
    expect(stato.nave.moduli.length).toBeLessThanOrEqual(4);
    expect(stato.nave.equipaggiamento.length).toBeLessThanOrEqual(6);
    expect(Object.keys(stato.code).sort()).toEqual(Object.keys(stato.crew).sort());
  });

  it("si può giocare una giornata intera con ogni task del catalogo", () => {
    let stato = creaMissioneIniziale();
    const crew = Object.keys(stato.crew);
    TASK_DISPONIBILI.forEach((t, i) => {
      stato = applicaAzione(
        stato,
        { tipo: "ASSEGNA_TASK", idDefinizione: t.id, responsabile: crew[i % crew.length]!, supporto: null },
        CONTESTO_GIOCO,
      );
    });
    stato = applicaAzione(stato, { tipo: "AVVIA_OPERAZIONI" }, CONTESTO_GIOCO);
    for (let i = 0; i < 50 && stato.statoGioco === "IN_ESECUZIONE"; i++) {
      stato = applicaAzione(stato, { tipo: "AVANZA" }, CONTESTO_GIOCO);
    }
    expect(stato.statoGioco).toBe("RAPPORTO");
  });
});
