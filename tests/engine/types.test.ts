/**
 * ============================================================================
 * types.test.ts — Verifiche sui tipi e sulle regole dello stato di gioco
 * ============================================================================
 *
 * I tipi TypeScript spariscono quando il codice gira, quindi non si
 * "testano" direttamente: il controllo lo fa il compilatore. Qui verifichiamo
 * invece le REGOLE che il compilatore non può garantire:
 *   - le liste di valori corrispondono al DESIGN (es. 8 sistemi core);
 *   - lo stato sopravvive intatto a salvataggio e caricamento (JSON);
 *   - i riferimenti interni sono coerenti (ogni ID in coda esiste davvero).
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  ABILITA_TECNICHE,
  COMPARTIMENTI,
  ESITI_TASK,
  SISTEMI_CORE,
  STATI_TASK,
} from "../../src/engine/types";
import { creaMissioneDiProva } from "../fixtures/missioneDiProva";

describe("liste di valori (coerenza con DESIGN.md)", () => {
  it("la nave ha 9 compartimenti e 8 sistemi core (§5)", () => {
    expect(COMPARTIMENTI).toHaveLength(9);
    expect(SISTEMI_CORE).toHaveLength(8);
    // Il Comando è un compartimento ma NON un sistema core.
    expect(COMPARTIMENTI).toContain("COMANDO");
    expect(SISTEMI_CORE).not.toContain("COMANDO");
  });

  it("i task hanno 8 stati e 5 esiti (§9)", () => {
    expect(STATI_TASK).toHaveLength(8);
    expect(ESITI_TASK).toHaveLength(5);
  });

  it("velocità e precisione non sono abilità tecniche", () => {
    expect(ABILITA_TECNICHE).not.toContain("VELOCITA");
    expect(ABILITA_TECNICHE).not.toContain("PRECISIONE");
  });
});

describe("StatoMissione", () => {
  it("sopravvive identico a salvataggio e caricamento JSON", () => {
    const stato = creaMissioneDiProva();
    const ricaricato = JSON.parse(JSON.stringify(stato));
    // toEqual confronta il contenuto in profondità: se un campo fosse
    // undefined, una Date o una Map, qui il test fallirebbe.
    expect(ricaricato).toEqual(stato);
  });

  it("ogni membro della crew ha una coda (anche vuota)", () => {
    const stato = creaMissioneDiProva();
    for (const id of Object.keys(stato.crew)) {
      expect(stato.code[id]).toBeDefined();
    }
  });

  it("ogni task in coda esiste ed è assegnato al membro di quella coda", () => {
    const stato = creaMissioneDiProva();
    for (const [idMembro, coda] of Object.entries(stato.code)) {
      for (const idTask of coda) {
        const task = stato.tasks[idTask];
        expect(task).toBeDefined();
        expect(task?.responsabile).toBe(idMembro);
      }
    }
  });

  it("le chiavi della crew coincidono con gli ID dei membri", () => {
    const stato = creaMissioneDiProva();
    for (const [chiave, m] of Object.entries(stato.crew)) {
      expect(m.id).toBe(chiave);
    }
  });

  it("la fixture rispetta gli slot del loadout (4 moduli, 6 equipaggiamenti)", () => {
    const { nave } = creaMissioneDiProva();
    expect(nave.moduli.length).toBeLessThanOrEqual(4);
    expect(nave.equipaggiamento.length).toBeLessThanOrEqual(6);
  });

  it("ogni chiamata restituisce un oggetto nuovo e indipendente", () => {
    const a = creaMissioneDiProva();
    const b = creaMissioneDiProva();
    a.risorse.scorte = 0;
    expect(b.risorse.scorte).toBe(540);
  });
});
