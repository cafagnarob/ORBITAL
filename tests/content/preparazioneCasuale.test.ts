/**
 * ============================================================================
 * preparazioneCasuale.test.ts — «Carica a caso» e i pezzi suggeriti (v3.9)
 * ============================================================================
 *
 * Con il contenuto vero e tutte e cinque le missioni: la nave caricata a
 * caso deve SEMPRE poter partire (nessun problema bloccante), avere
 * l'indispensabile della missione e una crew di 4 tra i candidati proposti.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { BALANCE } from "../../src/content/balance";
import { LISTA_CANDIDATI } from "../../src/content/candidati";
import { cataloghiPreparazionePer } from "../../src/content/contesto";
import { LISTA_MISSIONI, pianoPartita } from "../../src/content/missioni";
import { PREPARAZIONE_VUOTA } from "../../src/content/missioneIniziale";
import {
  attrezzaturaIndispensabile,
  candidatiProposti,
  fattibilita,
  pezziSuggeriti,
  preparazioneCasuale,
  problemiPreparazione,
} from "../../src/engine/preparazione";
import { createRng } from "../../src/engine/rng";

describe("Carica a caso", () => {
  const casi = LISTA_MISSIONI.flatMap((m) => Array.from({ length: 10 }, (_, i) => ({ m, seed: `${m.sigla}-${i}`, n: i })));

  it.each(casi.map((c) => [c.seed, c] as const))("%s: si può partire, con l'indispensabile e 4 dei candidati proposti", (_s, c) => {
    const cat = cataloghiPreparazionePer(pianoPartita(c.seed));
    const proposti = candidatiProposti(c.seed, LISTA_CANDIDATI, BALANCE.preparazione.candidatiProposti).map((m) => m.id);
    const prep = preparazioneCasuale(cat, proposti, createRng(c.n * 7919 + 1));
    expect(fattibilita(problemiPreparazione(prep, cat))).not.toBe("IMPOSSIBILE");
    expect(prep.crew).toHaveLength(BALANCE.preparazione.crewRichiesta);
    for (const id of prep.crew) expect(proposti).toContain(id);
    const ind = attrezzaturaIndispensabile(cat.taskObbligatori ?? [], cat);
    for (const x of ind.moduli) expect(prep.moduli).toContain(x);
    for (const x of ind.equipaggiamento) expect(prep.equipaggiamento).toContain(x);
  });

  it("due clic danno (quasi sempre) navi diverse", () => {
    const cat = cataloghiPreparazionePer(pianoPartita("E17-1"));
    const proposti = candidatiProposti("E17-1", LISTA_CANDIDATI, 6).map((m) => m.id);
    const a = preparazioneCasuale(cat, proposti, createRng(1));
    const b = preparazioneCasuale(cat, proposti, createRng(2));
    expect(a).not.toEqual(b);
  });
});

describe("pezzi suggeriti sulla mappa", () => {
  const cat = cataloghiPreparazionePer(pianoPartita("HK7-2"));

  it("a nave vuota l'indispensabile è MANCANTE (e il Modulo Minerario per HK-7)", () => {
    const pezzi = pezziSuggeriti(PREPARAZIONE_VUOTA, cat);
    expect(pezzi.moduli).toContainEqual({ id: "MODULO_MINERARIO", livello: "MANCANTE" });
    expect(pezzi.equipaggiamento.filter((x) => x.livello === "MANCANTE").map((x) => x.id)).toContain("TUTA_EVA_MK2");
  });

  it("con la crew ma senza casse, cibo e acqua sono MANCANTI; con poche, CONSIGLIATE", () => {
    const crew = ["mara", "adrian", "nadia", "sarah"];
    expect(pezziSuggeriti({ ...PREPARAZIONE_VUOTA, crew }, cat).scorte.map((s) => s.livello)).toEqual(["MANCANTE", "MANCANTE"]);
    const poche = pezziSuggeriti({ ...PREPARAZIONE_VUOTA, crew, scorte: { CASSA_CIBO: 1, CASSA_ACQUA: 1 } }, cat);
    expect(poche.scorte.every((s) => s.livello === "CONSIGLIATO" && s.quante > 0)).toBe(true);
  });

  it("non si suggeriscono più pezzi degli slot liberi", () => {
    const pezzi = pezziSuggeriti(PREPARAZIONE_VUOTA, cat);
    expect(pezzi.moduli.length).toBeLessThanOrEqual(BALANCE.preparazione.slotModuli);
    expect(pezzi.equipaggiamento.length).toBeLessThanOrEqual(BALANCE.preparazione.slotEquipaggiamento);
  });
});
