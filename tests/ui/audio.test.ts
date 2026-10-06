/**
 * ============================================================================
 * audio.test.ts — Le decisioni dell'audio (senza casse né browser)
 * ============================================================================
 *
 * Testiamo solo le funzioni PURE: quali frasi dice V.A.L.E., quali suoni
 * accompagnano un'azione, che atmosfera serve, come si gira una manopola.
 * Il suono vero (Web Audio, sintesi vocale) si prova a orecchio.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { PREPARAZIONE_DI_RIFERIMENTO } from "../../src/content/missioneIniziale";
import type { StatoMissione } from "../../src/engine/types";
import {
  atmosferaDi,
  frasiNuoveDiVale,
  suoniMissione,
  suonoPreparazione,
  testoPerVoce,
} from "../../src/ui/audio/annunci";
import { limita, livelloSuccessivo } from "../../src/ui/audio/impostazioni";
import { creaMissioneDiProva } from "../fixtures/missioneDiProva";

/** Una copia dello stato con qualche riga di log in più. */
function conLog(stato: StatoMissione, righe: [StatoMissione["log"][number]["fonte"], string][]): StatoMissione {
  const s = structuredClone(stato);
  for (const [fonte, testo] of righe) s.log.push({ tempo: s.tempo, fonte, testo, codici: [] });
  return s;
}

describe("voce di V.A.L.E.", () => {
  it("dice solo le righe NUOVE e solo quelle di V.A.L.E.", () => {
    const prima = conLog(creaMissioneDiProva(), [["VALE", "Vecchia frase."]]);
    const dopo = conLog(prima, [
      ["SISTEMA", "Riga tecnica."],
      ["VALE", "Capitano. Operazioni avviate."],
      ["CREW", "Mara: «Pronta.»"],
    ]);
    expect(frasiNuoveDiVale(prima, dopo)).toEqual(["Capitano. Operazioni avviate."]);
  });

  it("adatta il testo alla lettura ad alta voce", () => {
    expect(testoPerVoce("«V.A.L.E. · pianeta E-17»")).toBe("Vale, pianeta E 17");
  });
});

describe("suoni della missione", () => {
  const base = creaMissioneDiProva();

  it("un'assegnazione rifiutata suona ERRORE, una accettata CONFERMA", () => {
    const azione = { tipo: "ASSEGNA_TASK", idDefinizione: "T-X", responsabile: "mara", supporto: null } as const;
    expect(suoniMissione(base, base, azione)).toEqual(["ERRORE"]);
    const conTask = structuredClone(base);
    conTask.tasks["task-nuovo"] = {} as StatoMissione["tasks"][string];
    expect(suoniMissione(base, conTask, azione)).toEqual(["CONFERMA"]);
  });

  it("quando compare una decisione suona l'ALLARME e l'atmosfera va in ALLERTA", () => {
    const decisione = { ...structuredClone(base), statoGioco: "DECISIONE" as const };
    expect(suoniMissione(base, decisione, { tipo: "AVANZA" })).toContain("ALLARME");
    expect(atmosferaDi(decisione)).toBe("ALLERTA");
    expect(atmosferaDi({ ...base, statoGioco: "RAPPORTO" })).toBe("NOTTE");
    expect(atmosferaDi(base)).toBe("MISSIONE");
  });

  it("un codice che alza il livello suona ACCESSO, altrimenti ERRORE", () => {
    const azione = { tipo: "INSERISCI_CODICE", codice: "X" } as const;
    const salito = structuredClone(base);
    salito.terminale.livello = 1;
    expect(suoniMissione(base, salito, azione)).toEqual(["ACCESSO"]);
    expect(suoniMissione(base, base, azione)).toEqual(["ERRORE"]);
  });
});

describe("suoni della Preparazione", () => {
  const prep = PREPARAZIONE_DI_RIFERIMENTO;

  it("montare un modulo è un INNESTO, toglierlo RIMUOVI, slot pieni ERRORE", () => {
    const azione = { tipo: "SCEGLI_MODULO", id: "MODULO_POTENZA" } as const;
    const senza = { ...prep, moduli: prep.moduli.slice(1) };
    expect(suonoPreparazione(senza, prep, azione)).toBe("INNESTO");
    expect(suonoPreparazione(prep, senza, azione)).toBe("RIMUOVI");
    expect(suonoPreparazione(prep, prep, azione)).toBe("ERRORE");
  });

  it("una cassa in più suona CASSA", () => {
    const azione = { tipo: "IMPOSTA_SCORTA", id: "CASSA_CIBO", quantita: 13 } as const;
    const dopo = { ...prep, scorte: { ...prep.scorte, CASSA_CIBO: 11 } };
    expect(suonoPreparazione(prep, dopo, azione)).toBe("CASSA");
  });
});

describe("manopole", () => {
  it("girano a scatti 0 → 1 → 2 → 3 → 0", () => {
    expect([0, 1, 2, 3].map(livelloSuccessivo)).toEqual([1, 2, 3, 0]);
  });

  it("qualunque valore salvato diventa un livello valido", () => {
    expect([-2, 1.4, 9, Number.NaN].map(limita)).toEqual([0, 1, 3, 0]);
  });
});
