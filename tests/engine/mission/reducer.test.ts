/**
 * ============================================================================
 * reducer.test.ts — Le garanzie fondamentali del motore
 * ============================================================================
 *
 * Questi test proteggono le promesse dell'architettura (DESIGN §16.1):
 *   1. PUREZZA: lo stato ricevuto non viene mai modificato.
 *   2. DETERMINISMO: stessa partita + stesse azioni → stesso risultato.
 *   3. SALVATAGGI: salvare a metà, ricaricare e continuare dà lo stesso
 *      identico risultato che continuare senza salvare.
 * Se uno di questi test fallisce, c'è un problema serio di architettura.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import type { Azione } from "../../../src/engine/mission";
import type { StatoMissione } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { esegui } from "../../fixtures/simulazione";
import { DIAGNOSTICA, ISPEZIONE_ESTERNA, MANOVRA_ORBITALE } from "../../fixtures/taskDiProva";

/** Una giornata completa: pianificazione, operazioni, rapporto, notte, risveglio. */
const PRIMA_META: Azione[] = [
  { tipo: "ASSEGNA_TASK", idDefinizione: MANOVRA_ORBITALE.id, responsabile: "adrian", supporto: null },
  { tipo: "ASSEGNA_TASK", idDefinizione: ISPEZIONE_ESTERNA.id, responsabile: "sarah", supporto: "adrian" },
  { tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "nadia", supporto: null },
  { tipo: "AVVIA_OPERAZIONI" },
  { tipo: "AVANZA" },
  { tipo: "AVANZA" },
];
const SECONDA_META: Azione[] = [
  { tipo: "AVANZA" },
  { tipo: "AVANZA" },
  { tipo: "AVANZA" },
  { tipo: "AVANZA" },
];
const GIORNATA: Azione[] = [...PRIMA_META, ...SECONDA_META];

/**
 * Esegue le azioni, ma salta gli AVANZA quando il gioco è già fermo al
 * rapporto: il numero di task che finiscono prima delle 22:00 dipende
 * dai tiri, quindi non sappiamo in anticipo quanti AVANZA servono.
 */
function gioca(stato: StatoMissione, azioni: Azione[]): StatoMissione {
  let s = stato;
  for (const azione of azioni) {
    if (azione.tipo === "AVANZA" && s.statoGioco !== "IN_ESECUZIONE") continue;
    s = esegui(s, [azione]);
  }
  return s;
}

function giocaGiornata(stato: StatoMissione): StatoMissione {
  return gioca(stato, GIORNATA);
}

describe("purezza", () => {
  it("applicaAzione non modifica lo stato ricevuto", () => {
    const stato = creaMissioneDiProva();
    const fotografia = structuredClone(stato);
    giocaGiornata(stato);
    expect(stato).toEqual(fotografia);
  });
});

describe("determinismo", () => {
  it("stessa partita e stesse azioni producono lo stesso stato finale", () => {
    expect(giocaGiornata(creaMissioneDiProva())).toEqual(giocaGiornata(creaMissioneDiProva()));
  });

  it("i tiri consumano la sequenza casuale (rngState cambia)", () => {
    const iniziale = creaMissioneDiProva();
    expect(giocaGiornata(iniziale).rngState).not.toBe(iniziale.rngState);
  });

  it("seed diversi producono partite diverse", () => {
    // Con 4 task e 5 esiti possibili, è praticamente impossibile che 20 seed
    // diversi diano tutti gli stessi esiti: verifichiamo che ci sia varietà.
    const esitiPerSeed = new Set(
      Array.from({ length: 20 }, (_, i) => {
        const finale = giocaGiornata(creaMissioneDiProva(`SEED-${i}`));
        return Object.values(finale.tasks).map((t) => t.esito).join(",");
      }),
    );
    expect(esitiPerSeed.size).toBeGreaterThan(1);
  });
});

describe("salvataggi", () => {
  it("salvare a metà giornata e ricaricare non cambia il risultato", () => {
    const meta = gioca(creaMissioneDiProva(), PRIMA_META);
    expect(meta.statoGioco).toBe("IN_ESECUZIONE"); // siamo davvero a metà giornata

    // "Salvataggio" e "caricamento": esattamente ciò che farà localStorage.
    const ricaricata: StatoMissione = JSON.parse(JSON.stringify(meta));

    const senzaSalvare = gioca(meta, SECONDA_META);
    const dopoCaricamento = gioca(ricaricata, SECONDA_META);
    expect(dopoCaricamento).toEqual(senzaSalvare);
  });
});

describe("stati di gioco", () => {
  it("AVANZA non è permessa durante la pianificazione", () => {
    expect(() => esegui(creaMissioneDiProva(), [{ tipo: "AVANZA" }])).toThrow(/non permessa/);
  });

  it("AVVIA_OPERAZIONI non si può ripetere durante l'esecuzione", () => {
    const avviata = esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }]);
    expect(() => esegui(avviata, [{ tipo: "AVVIA_OPERAZIONI" }])).toThrow(/non permessa/);
  });
});
