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
import { CATALOGO_EVENTI } from "../../src/content/eventi";
import { creaMissioneIniziale } from "../../src/content/missioneIniziale";
import { CATALOGO_SCOPERTE } from "../../src/content/scoperte";
import { TASK_DISPONIBILI } from "../../src/content/tasks";
import type { Condizione, Effetto } from "../../src/engine/types";

/** Tutte le condizioni, anche quelle annidate dentro UNO_TRA. */
function appiattisci(condizioni: readonly Condizione[]): Condizione[] {
  return condizioni.flatMap((c) => (c.tipo === "UNO_TRA" ? [c, ...appiattisci(c.condizioni)] : [c]));
}

const EVENTI = Object.values(CATALOGO_EVENTI);
const TUTTE_LE_CONDIZIONI = EVENTI.flatMap((e) => appiattisci([...e.condizioni, ...e.scelte.flatMap((s) => s.requisiti)]));
const TUTTI_GLI_EFFETTI: Effetto[] = EVENTI.flatMap((e) => [...e.effetti, ...e.scelte.flatMap((s) => s.effetti)]);

describe("catalogo dei task", () => {
  it("ha ID unici", () => {
    const ids = TASK_DISPONIBILI.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("i task che non ammettono aiutanti non hanno abilità secondaria", () => {
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

  it("le scoperte richieste esistono nel catalogo delle scoperte", () => {
    for (const t of TASK_DISPONIBILI) {
      for (const s of t.scoperteRichieste) expect(CATALOGO_SCOPERTE).toHaveProperty(s);
    }
  });
});

describe("catalogo degli eventi", () => {
  it("ogni evento ha peso positivo, probabilità tra 0 e 1 e scelte con ID unici", () => {
    for (const e of EVENTI) {
      expect(e.peso).toBeGreaterThan(0);
      expect(e.probabilita).toBeGreaterThanOrEqual(0);
      expect(e.probabilita).toBeLessThanOrEqual(1);
      const ids = e.scelte.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("le condizioni citano solo scoperte, eventi, tag ed equipaggiamenti esistenti", () => {
    const tagEsistenti = new Set(TASK_DISPONIBILI.flatMap((t) => t.tag));
    for (const c of TUTTE_LE_CONDIZIONI) {
      if (c.tipo === "SCOPERTA" || c.tipo === "NON_SCOPERTA") expect(CATALOGO_SCOPERTE).toHaveProperty(c.id);
      if (c.tipo === "EVENTO_ACCADUTO") {
        const evento = CATALOGO_EVENTI[c.id];
        expect(evento).toBeDefined();
        if (c.scelta !== undefined) expect(evento?.scelte.map((s) => s.id)).toContain(c.scelta);
      }
      if (c.tipo === "TASK_CONCLUSO_ORA") expect(tagEsistenti).toContain(c.tag);
    }
  });

  it("gli effetti scoprono solo scoperte esistenti", () => {
    for (const ef of TUTTI_GLI_EFFETTI) {
      if (ef.tipo === "SCOPERTA") expect(CATALOGO_SCOPERTE).toHaveProperty(ef.id);
    }
  });

  it("ogni scoperta del catalogo può essere ottenuta da almeno un evento", () => {
    const ottenibili = new Set(TUTTI_GLI_EFFETTI.flatMap((ef) => (ef.tipo === "SCOPERTA" ? [ef.id] : [])));
    for (const id of Object.keys(CATALOGO_SCOPERTE)) expect(ottenibili).toContain(id);
  });
});

describe("missione iniziale", () => {
  it("rispetta gli slot del loadout e ha una coda per ogni membro", () => {
    const stato = creaMissioneIniziale();
    expect(stato.nave.moduli.length).toBeLessThanOrEqual(4);
    expect(stato.nave.equipaggiamento.length).toBeLessThanOrEqual(6);
    expect(Object.keys(stato.code).sort()).toEqual(Object.keys(stato.crew).sort());
  });

  it("parte senza scoperte né eventi", () => {
    const stato = creaMissioneIniziale();
    expect(stato.conoscenza.scoperte).toEqual([]);
    expect(stato.eventi).toEqual({ accaduti: [], inAttesa: null });
  });
});
