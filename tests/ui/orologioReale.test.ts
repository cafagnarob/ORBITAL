/**
 * ============================================================================
 * orologioReale.test.ts — L'orologio che fa scorrere il tempo (v3.3)
 * ============================================================================
 *
 * vi.useFakeTimers() sostituisce setInterval E performance.now() con un
 * orologio finto che avanza solo quando lo diciamo noi (advanceTimersByTime):
 * possiamo "far passare" 15 minuti in un millisecondo e controllare che
 * l'orologio abbia contato bene.
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creaOrologioReale } from "../../src/ui/tempo/orologioReale";

describe("orologio reale", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  });
  afterEach(() => vi.useRealTimers());

  it("in 5 minuti reali fa passare 900 minuti di gioco, solo mentre qualcuno guarda", () => {
    let minuti = 0;
    const orologio = creaOrologioReale();
    orologio.collega((m) => (minuti += m));
    vi.advanceTimersByTime(5000);
    expect(minuti).toBe(0); // nessun iscritto: l'orologio è spento

    const smetti = orologio.iscriviti(() => {});
    vi.advanceTimersByTime(5 * 60 * 1000); // 5 minuti reali
    expect(minuti).toBe(900); // = le operazioni dalle 07:00 alle 22:00

    smetti();
    vi.advanceTimersByTime(10_000);
    expect(minuti).toBe(900);
  });

  it("in pausa non conta, e avvisa React del cambio", () => {
    let minuti = 0;
    const avvisi = vi.fn();
    const orologio = creaOrologioReale();
    orologio.collega((m) => (minuti += m));
    orologio.iscriviti(avvisi);
    orologio.impostaPausa(true);
    expect(avvisi).toHaveBeenCalledTimes(1);
    expect(orologio.leggi().pausa).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(minuti).toBe(0);
    orologio.impostaPausa(false);
    vi.advanceTimersByTime(6000); // 6 s reali = 18 minuti di gioco
    expect(minuti).toBe(18);
  });

  it("la velocità di prova moltiplica lo scorrere del tempo", () => {
    let minuti = 0;
    const orologio = creaOrologioReale(20);
    orologio.collega((m) => (minuti += m));
    orologio.iscriviti(() => {});
    vi.advanceTimersByTime(1000); // 1 s × 20 = 20 s reali equivalenti = 60 minuti
    expect(minuti).toBe(60);
  });
});
