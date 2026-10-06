/**
 * ============================================================================
 * terminale.test.ts — Il Terminale di manutenzione SVC-07
 * ============================================================================
 *
 * Codici di prova scritti qui, indipendenti dal contenuto del gioco:
 *   ALFA-1 → livello 0 → 1, rivela la scoperta "SEGRETO_A"
 *   BETA-2 → richiede livello 1 → 2
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { applicaAzione, normalizzaCodice, type Azione, type ContestoMissione } from "../../../src/engine/mission";
import type { StatoMissione } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { CONTESTO_DI_PROVA } from "../../fixtures/taskDiProva";

const CONTESTO: ContestoMissione = {
  ...CONTESTO_DI_PROVA,
  catalogoCodici: {
    "ALFA-1": {
      codice: "ALFA-1",
      livelloRichiesto: 0,
      livelloOttenuto: 1,
      risposta: [{ testo: "LIVELLO 1", tono: "normale" }],
      effetti: [{ tipo: "SCOPERTA", id: "SEGRETO_A" }],
    },
    "BETA-2": {
      codice: "BETA-2",
      livelloRichiesto: 1,
      livelloOttenuto: 2,
      risposta: [{ testo: "LIVELLO 2", tono: "normale" }],
      effetti: [],
    },
  },
};

const esegui = (s: StatoMissione, azioni: Azione[]) => azioni.reduce((acc, a) => applicaAzione(acc, a, CONTESTO), s);
const codice = (c: string): Azione => ({ tipo: "INSERISCI_CODICE", codice: c });

/** Missione con una voce di log che contiene un codice nascosto (indice 1). */
function conVoceCodificata(): StatoMissione {
  const s = creaMissioneDiProva();
  s.log.push({ tempo: 360, fonte: "SISTEMA", testo: "PROTOCOLLO ALFA-1 · ATTIVO", codici: ["ALFA-1"] });
  return s;
}

describe("segnalazione delle voci di log", () => {
  it("segnalare una voce con un codice crea un frammento", () => {
    const s = esegui(conVoceCodificata(), [{ tipo: "SEGNALA_VOCE", indice: 1 }]);
    expect(s.terminale.frammenti).toEqual(["ALFA-1"]);
    expect(s.terminale.segnalate).toEqual([1]);
  });

  it("una voce senza codici si segna lo stesso, ma non crea frammenti", () => {
    const s = esegui(conVoceCodificata(), [{ tipo: "SEGNALA_VOCE", indice: 0 }]);
    expect(s.terminale.segnalate).toEqual([0]);
    expect(s.terminale.frammenti).toEqual([]);
  });

  it("segnalare due volte non duplica nulla", () => {
    const s = esegui(conVoceCodificata(), [
      { tipo: "SEGNALA_VOCE", indice: 1 },
      { tipo: "SEGNALA_VOCE", indice: 1 },
    ]);
    expect(s.terminale.frammenti).toEqual(["ALFA-1"]);
    expect(s.terminale.segnalate).toEqual([1]);
  });

  it("una voce inesistente è un errore", () => {
    expect(() => esegui(conVoceCodificata(), [{ tipo: "SEGNALA_VOCE", indice: 99 }])).toThrow(/inesistente/);
  });
});

describe("inserimento dei codici", () => {
  it("normalizza maiuscole e spazi", () => {
    expect(normalizzaCodice("  alfa - 1 ")).toBe("ALFA-1");
  });

  it("un codice valido alza il livello e applica gli effetti", () => {
    const s = esegui(creaMissioneDiProva(), [codice("alfa-1")]);
    expect(s.terminale.livello).toBe(1);
    expect(s.conoscenza.scoperte).toContain("SEGRETO_A");
    expect(s.terminale.tentativi.at(-1)).toMatchObject({ codice: "ALFA-1", esito: "ACCETTATO" });
  });

  it("un codice sbagliato è NEGATO e lascia traccia nel log", () => {
    const prima = creaMissioneDiProva();
    const s = esegui(prima, [codice("XYZ")]);
    expect(s.terminale.tentativi.at(-1)?.esito).toBe("NEGATO");
    expect(s.log).toHaveLength(prima.log.length + 1);
    expect(s.log.at(-1)?.testo).toMatch(/SVC\.ACCESSO/);
  });

  it("un codice di livello troppo alto viene rifiutato", () => {
    const s = esegui(creaMissioneDiProva(), [codice("BETA-2")]);
    expect(s.terminale.tentativi.at(-1)?.esito).toBe("LIVELLO_INSUFFICIENTE");
    expect(s.terminale.livello).toBe(0);
  });

  it("i livelli si sbloccano in sequenza e non scendono mai", () => {
    const s = esegui(creaMissioneDiProva(), [codice("ALFA-1"), codice("BETA-2"), codice("ALFA-1")]);
    expect(s.terminale.livello).toBe(2);
    expect(s.terminale.tentativi.map((t) => t.esito)).toEqual(["ACCETTATO", "ACCETTATO", "GIA_ESEGUITO"]);
  });

  it("il terminale funziona anche durante il rapporto e non fa scorrere il tempo", () => {
    const inRapporto: StatoMissione = { ...creaMissioneDiProva(), statoGioco: "RAPPORTO" };
    const s = esegui(inRapporto, [codice("ALFA-1")]);
    expect(s.statoGioco).toBe("RAPPORTO");
    expect(s.tempo).toBe(inRapporto.tempo);
  });

  it("lo stato del terminale sopravvive a salvataggio e caricamento", () => {
    const s = esegui(conVoceCodificata(), [{ tipo: "SEGNALA_VOCE", indice: 1 }, codice("ALFA-1")]);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
