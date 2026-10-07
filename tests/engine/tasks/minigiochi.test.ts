/**
 * ============================================================================
 * minigiochi.test.ts — Proposta, pausa del tempo e bonus dei minigiochi (v3.6)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { applicaAzione, type ContestoMissione } from "../../../src/engine/mission";
import { bonusMinigioco, difficoltaDaRischio } from "../../../src/engine/tasks/minigiochi";
import type { DefinizioneTask } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { CONTESTO_DI_PROVA, DIAGNOSTICA } from "../../fixtures/taskDiProva";

/** La diagnostica della fixture, ma rischiosa e con un minigioco. */
const RISCHIOSA: DefinizioneTask = {
  ...DIAGNOSTICA,
  rischioBase: 80,
  minigioco: { tipo: "SEQUENZA", titolo: "Prova", istruzioni: "Ripeti la sequenza." },
};
const CONTESTO: ContestoMissione = { ...CONTESTO_DI_PROVA, catalogoTask: { ...CONTESTO_DI_PROVA.catalogoTask, [RISCHIOSA.id]: RISCHIOSA } };

/** La missione di prova ha già task-1 (diagnostica di Mara) in coda. */
const avviata = () => applicaAzione(creaMissioneDiProva(), { tipo: "AVVIA_OPERAZIONI" }, CONTESTO);

describe("minigiochi", () => {
  it("un task rischioso propone il minigioco all'avvio", () => {
    const s = avviata();
    expect(s.minigioco).toMatchObject({ idTask: "task-1", tipo: "SEQUENZA" });
    expect(s.minigioco?.difficolta).toBe(difficoltaDaRischio(s.tasks["task-1"]!.rischio!));
  });

  it("finché il minigioco aspetta, il tempo non scorre", () => {
    const s = avviata();
    expect(() => applicaAzione(s, { tipo: "AVANZA" }, CONTESTO)).toThrow(/Minigioco in attesa/);
    expect(() => applicaAzione(s, { tipo: "AVANZA_FINO", tempo: s.tempo + 5 }, CONTESTO)).toThrow(/Minigioco in attesa/);
  });

  it("il punteggio toglie rischio al task; rinunciare non toglie nulla", () => {
    const s = avviata();
    const prima = s.tasks["task-1"]!.rischio!;
    const giocato = applicaAzione(s, { tipo: "RISOLVI_MINIGIOCO", punteggio: 0.5 }, CONTESTO);
    expect(giocato.minigioco).toBeNull();
    expect(giocato.tasks["task-1"]!.rischio).toBe(prima - bonusMinigioco(0.5));
    const rinuncia = applicaAzione(s, { tipo: "RISOLVI_MINIGIOCO", punteggio: 0 }, CONTESTO);
    expect(rinuncia.tasks["task-1"]!.rischio).toBe(prima);
  });

  it("il bonus massimo è quello del bilanciamento, e il punteggio è limitato a 0–1", () => {
    expect(bonusMinigioco(1)).toBe(BALANCE.minigiochi.bonusMassimo);
    expect(bonusMinigioco(7)).toBe(BALANCE.minigiochi.bonusMassimo);
    expect(bonusMinigioco(-1)).toBe(0);
  });

  it("senza minigioco nel catalogo (task di prova) non compare mai", () => {
    expect(applicaAzione(creaMissioneDiProva(), { tipo: "AVVIA_OPERAZIONI" }, CONTESTO_DI_PROVA).minigioco).toBeNull();
  });

  it("senza minigioco in attesa, RISOLVI_MINIGIOCO è un errore", () => {
    expect(() => applicaAzione(creaMissioneDiProva(), { tipo: "RISOLVI_MINIGIOCO", punteggio: 1 }, CONTESTO_DI_PROVA)).toThrow();
  });
});
