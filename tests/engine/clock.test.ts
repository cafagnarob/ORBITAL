/**
 * ============================================================================
 * clock.test.ts — Test dell'orologio event-driven
 * ============================================================================
 *
 * COSA VERIFICA
 * - Conversioni minuti → giorno/ora, soprattutto ai CONFINI (23:59 → 00:00,
 *   06:59 → 07:00): è lì che si nascondono gli errori "di uno".
 * - Che il prossimo momento importante sia quello giusto, inclusi i pareggi.
 * - Che il tempo non torni mai indietro e lo stato originale resti intatto.
 *
 * Le missioni partono dalla fixture e vengono modificate localmente:
 * ogni test riceve una copia nuova, quindi i test non si influenzano.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  avanzaTempo,
  faseGiornata,
  formattaTempo,
  prossimaOccorrenza,
  prossimoMomento,
  scomponiTempo,
} from "../../src/engine/clock";
import type { IstanzaTask, StatoMissione } from "../../src/engine/types";
import { creaMissioneDiProva } from "../fixtures/missioneDiProva";

/** Aggiunge alla missione un task IN_CORSO che finisce al minuto indicato. */
function conTaskInCorso(stato: StatoMissione, id: string, fine: number): StatoMissione {
  const task: IstanzaTask = {
    id,
    idDefinizione: "T-DIAGNOSTICA",
    responsabile: "mara",
    supporto: null,
    stato: "IN_CORSO",
    inizio: stato.tempo,
    fine,
    rischio: 20,
    esito: null,
  };
  return { ...stato, tasks: { ...stato.tasks, [id]: task } };
}

// ----------------------------------------------------------------------------
describe("scomponiTempo / formattaTempo", () => {
  it("converte i minuti in giorno, ore e minuti", () => {
    expect(scomponiTempo(0)).toEqual({ giorno: 1, ore: 0, minuti: 0 });
    expect(scomponiTempo(360)).toEqual({ giorno: 1, ore: 6, minuti: 0 });
    expect(scomponiTempo(1830)).toEqual({ giorno: 2, ore: 6, minuti: 30 });
  });

  it("gestisce il passaggio di mezzanotte", () => {
    expect(scomponiTempo(1439)).toEqual({ giorno: 1, ore: 23, minuti: 59 });
    expect(scomponiTempo(1440)).toEqual({ giorno: 2, ore: 0, minuti: 0 });
  });

  it("formatta con gli zeri iniziali", () => {
    expect(formattaTempo(360)).toBe("Giorno 1 · 06:00");
    expect(formattaTempo(1440 + 7 * 60 + 5)).toBe("Giorno 2 · 07:05");
  });
});

// ----------------------------------------------------------------------------
describe("faseGiornata", () => {
  it("rispetta i confini delle fasi (inizio incluso, fine esclusa)", () => {
    expect(faseGiornata(359)).toBe("NOTTE"); // 05:59
    expect(faseGiornata(360)).toBe("PIANIFICAZIONE"); // 06:00
    expect(faseGiornata(419)).toBe("PIANIFICAZIONE"); // 06:59
    expect(faseGiornata(420)).toBe("OPERAZIONI"); // 07:00
    expect(faseGiornata(1319)).toBe("OPERAZIONI"); // 21:59
    expect(faseGiornata(1320)).toBe("NOTTE"); // 22:00
  });

  it("funziona allo stesso modo nei giorni successivi", () => {
    expect(faseGiornata(1440 * 3 + 600)).toBe("OPERAZIONI"); // G4 10:00
  });
});

// ----------------------------------------------------------------------------
describe("prossimaOccorrenza", () => {
  it("trova l'orario più tardi nello stesso giorno", () => {
    expect(prossimaOccorrenza(360, 1320)).toBe(1320);
  });

  it("se l'orario è già passato, passa al giorno dopo", () => {
    expect(prossimaOccorrenza(1400, 360)).toBe(1440 + 360);
  });

  it("è strettamente successiva: alle 22:00 il prossimo rapporto è domani", () => {
    expect(prossimaOccorrenza(1320, 1320)).toBe(1320 + 1440);
  });
});

// ----------------------------------------------------------------------------
describe("prossimoMomento", () => {
  it("senza task in corso, alle 06:00 il prossimo momento è il rapporto delle 22:00", () => {
    const stato = creaMissioneDiProva(); // tempo 360, task-1 solo IN_CODA
    expect(prossimoMomento(stato)).toEqual({
      tempo: 1320,
      motivi: [{ tipo: "RAPPORTO_SERALE" }],
    });
  });

  it("un task che finisce prima del rapporto viene prima", () => {
    const stato = conTaskInCorso(creaMissioneDiProva(), "task-2", 500);
    expect(prossimoMomento(stato)).toEqual({
      tempo: 500,
      motivi: [{ tipo: "FINE_TASK", idTask: "task-2" }],
    });
  });

  it("dopo il rapporto serale il prossimo momento è il risveglio", () => {
    const stato = avanzaTempo(creaMissioneDiProva(), 1320);
    expect(prossimoMomento(stato)).toEqual({
      tempo: 1440 + 360,
      motivi: [{ tipo: "RISVEGLIO" }],
    });
  });

  it("pareggio: task e rapporto alle 22:00 vengono restituiti insieme, task prima", () => {
    const stato = conTaskInCorso(creaMissioneDiProva(), "task-2", 1320);
    expect(prossimoMomento(stato)).toEqual({
      tempo: 1320,
      motivi: [{ tipo: "FINE_TASK", idTask: "task-2" }, { tipo: "RAPPORTO_SERALE" }],
    });
  });

  it("pareggio tra task: ordine per ID, indipendente dall'ordine di inserimento", () => {
    let stato = creaMissioneDiProva();
    stato = conTaskInCorso(stato, "task-b", 700);
    stato = conTaskInCorso(stato, "task-a", 700);
    expect(prossimoMomento(stato).motivi).toEqual([
      { tipo: "FINE_TASK", idTask: "task-a" },
      { tipo: "FINE_TASK", idTask: "task-b" },
    ]);
  });

  it("un task che finisce proprio ora viene restituito subito", () => {
    const stato = conTaskInCorso(creaMissioneDiProva(), "task-2", 360);
    expect(prossimoMomento(stato).tempo).toBe(360);
  });

  it("segnala un bug se un task in corso doveva finire nel passato", () => {
    const stato = avanzaTempo(conTaskInCorso(creaMissioneDiProva(), "task-2", 400), 500);
    expect(() => prossimoMomento(stato)).toThrow();
  });

  it("segnala un bug se un task in corso non ha tempo di fine", () => {
    const stato = conTaskInCorso(creaMissioneDiProva(), "task-2", 400);
    const rotto: StatoMissione = {
      ...stato,
      tasks: { ...stato.tasks, "task-2": { ...stato.tasks["task-2"]!, fine: null } },
    };
    expect(() => prossimoMomento(rotto)).toThrow();
  });
});

// ----------------------------------------------------------------------------
describe("avanzaTempo", () => {
  it("restituisce un nuovo stato senza modificare l'originale", () => {
    const originale = creaMissioneDiProva();
    const nuovo = avanzaTempo(originale, 500);
    expect(nuovo.tempo).toBe(500);
    expect(originale.tempo).toBe(360);
    expect(nuovo).not.toBe(originale);
  });

  it("permette di restare nello stesso minuto", () => {
    expect(avanzaTempo(creaMissioneDiProva(), 360).tempo).toBe(360);
  });

  it("vieta di tornare indietro o di usare minuti non interi", () => {
    const stato = creaMissioneDiProva();
    expect(() => avanzaTempo(stato, 300)).toThrow();
    expect(() => avanzaTempo(stato, 400.5)).toThrow();
  });

  it("simula una giornata saltando di momento in momento", () => {
    // Dalle 06:00 del giorno 1, tre salti: rapporto, risveglio, rapporto.
    let stato = creaMissioneDiProva();
    const visitati: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { tempo } = prossimoMomento(stato);
      stato = avanzaTempo(stato, tempo);
      visitati.push(tempo);
    }
    expect(visitati).toEqual([1320, 1800, 2760]);
  });
});
