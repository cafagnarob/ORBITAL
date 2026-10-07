/**
 * ============================================================================
 * progressione.test.ts — Tempo reale, turni, sblocco e ricarica dei task (v3.3)
 * ============================================================================
 *
 * Le regole provate qui:
 *   - AVANZA_FINO porta l'orologio a un minuto preciso, attraversando i
 *     momenti importanti, e si ferma prima se serve il Capitano;
 *   - i cambi turno (10, 13, 16, 19) fanno accadere gli eventi "TURNO";
 *   - un task già assegnato, completato da poco o "una volta sola" non si
 *     può riassegnare; i task si sbloccano per giorno, a catena, da eventi;
 *   - la resa di un task riuscito arriva alla nave.
 * Lo stato si costruisce a mano dove serve: la disponibilità è una
 * funzione pura dello stato, e così i test non dipendono dai dadi.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { applicaAzione, type ContestoMissione } from "../../../src/engine/mission";
import { disponibilitaTask } from "../../../src/engine/tasks/disponibilita";
import type { DefinizioneEvento, DefinizioneTask, IstanzaTask, StatoMissione } from "../../../src/engine/types";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { CONTESTO_DI_PROVA, DIAGNOSTICA } from "../../fixtures/taskDiProva";

const GIORNALIERO: DefinizioneTask = {
  ...DIAGNOSTICA,
  id: "T-GIORNALIERO",
  nome: "Riciclo",
  rischioBase: 0,
  costoRisorse: {},
  ricaricaOre: 24,
  resa: { risorse: { acqua: 6 } },
};
const UNICO: DefinizioneTask = { ...GIORNALIERO, id: "T-UNICO", nome: "Mappa", ricaricaOre: null, resa: undefined };
const CATENA: DefinizioneTask = {
  ...GIORNALIERO,
  id: "T-CATENA",
  nome: "Dopo il riciclo",
  sblocco: [{ tipo: "TASK_COMPLETATO", task: "T-GIORNALIERO" }],
};
const DAL_GIORNO_3: DefinizioneTask = { ...GIORNALIERO, id: "T-G3", sblocco: [{ tipo: "GIORNO_ALMENO", giorno: 3 }] };
const TEMPORANEO: DefinizioneTask = {
  ...GIORNALIERO,
  id: "T-TEMP",
  ricaricaOre: null,
  sblocco: [{ tipo: "EVENTO_RECENTE", id: "EV-OCCASIONE", ore: 6 }],
};

const EV_TURNO: DefinizioneEvento = {
  id: "EV-TURNO",
  titolo: "Nave di passaggio",
  categoria: "ESPLORAZIONE",
  priorita: "NORMALE",
  unaVolta: true,
  probabilita: 1,
  peso: 1,
  condizioni: [{ tipo: "MOMENTO", momento: "TURNO" }],
  fonte: "VALE",
  testo: "Una nave di passaggio ci lascia dell'acqua.",
  codici: [],
  effetti: [{ tipo: "RISORSA", risorsa: "acqua", delta: 5 }],
  scelte: [],
};

const CONTESTO: ContestoMissione = {
  ...CONTESTO_DI_PROVA,
  catalogoTask: {
    ...CONTESTO_DI_PROVA.catalogoTask,
    ...Object.fromEntries([GIORNALIERO, UNICO, CATENA, DAL_GIORNO_3, TEMPORANEO].map((t) => [t.id, t])),
  },
};

/** Aggiunge allo stato un'istanza già conclusa (o in coda) di un task. */
function conIstanza(stato: StatoMissione, def: DefinizioneTask, parziale: Partial<IstanzaTask>): StatoMissione {
  const id = `task-x${Object.keys(stato.tasks).length}`;
  const istanza: IstanzaTask = {
    id,
    idDefinizione: def.id,
    responsabile: "mara",
    supporto: null,
    stato: "COMPLETATO",
    inizio: 420,
    fine: 500,
    rischio: 0,
    esito: "SUCCESSO",
    ...parziale,
  };
  return { ...stato, tasks: { ...stato.tasks, [id]: istanza } };
}

const alMinuto = (stato: StatoMissione, tempo: number): StatoMissione => ({ ...stato, tempo });

// ----------------------------------------------------------------------------
describe("AVANZA_FINO (tempo reale)", () => {
  const operativa = () => applicaAzione(creaMissioneDiProva(), { tipo: "AVVIA_OPERAZIONI" }, CONTESTO_DI_PROVA);

  it("porta l'orologio esattamente al minuto chiesto se nel frattempo non succede nulla", () => {
    const s = operativa();
    const dopo = applicaAzione(s, { tipo: "AVANZA_FINO", tempo: s.tempo + 1 }, CONTESTO_DI_PROVA);
    expect(dopo.tempo).toBe(s.tempo + 1);
    expect(dopo.statoGioco).toBe("IN_ESECUZIONE");
  });

  it("attraversa la fine dei task incontrati lungo la strada", () => {
    const s = operativa();
    const fine = s.tasks["task-1"]!.fine!;
    const dopo = applicaAzione(s, { tipo: "AVANZA_FINO", tempo: fine + 5 }, CONTESTO_DI_PROVA);
    expect(dopo.tasks["task-1"]!.esito).not.toBeNull();
    expect(dopo.tempo).toBe(fine + 5);
  });

  it("si ferma al rapporto serale anche se gli si chiede di andare oltre", () => {
    const s = operativa();
    const dopo = applicaAzione(s, { tipo: "AVANZA_FINO", tempo: 23 * 60 }, CONTESTO_DI_PROVA);
    expect(dopo.statoGioco).toBe("RAPPORTO");
    expect(dopo.tempo).toBe(22 * 60);
  });

  it("non torna indietro e non funziona fuori dalle operazioni", () => {
    const s = operativa();
    expect(() => applicaAzione(s, { tipo: "AVANZA_FINO", tempo: s.tempo - 1 }, CONTESTO_DI_PROVA)).toThrow();
    expect(() => applicaAzione(creaMissioneDiProva(), { tipo: "AVANZA_FINO", tempo: 500 }, CONTESTO_DI_PROVA)).toThrow(/non permessa/);
  });

  it("ai cambi turno fa accadere gli eventi TURNO", () => {
    const contesto: ContestoMissione = { ...CONTESTO_DI_PROVA, catalogoEventi: { [EV_TURNO.id]: EV_TURNO } };
    const s = applicaAzione(creaMissioneDiProva(), { tipo: "AVVIA_OPERAZIONI" }, contesto);
    const prima = applicaAzione(s, { tipo: "AVANZA_FINO", tempo: 9 * 60 + 59 }, contesto);
    expect(prima.eventi.accaduti.some((r) => r.id === "EV-TURNO")).toBe(false);
    const dopo = applicaAzione(prima, { tipo: "AVANZA_FINO", tempo: 10 * 60 + 1 }, contesto);
    expect(dopo.eventi.accaduti.some((r) => r.id === "EV-TURNO")).toBe(true);
  });
});

// ----------------------------------------------------------------------------
describe("disponibilità dei task", () => {
  const base = () => creaMissioneDiProva();

  it("un task già in coda a qualcuno non si può dare a un altro", () => {
    const s = conIstanza(base(), GIORNALIERO, { stato: "IN_CODA", fine: null, esito: null, responsabile: "mara" });
    expect(disponibilitaTask(s, CONTESTO, GIORNALIERO)).toEqual({ tipo: "IN_CORSO", chi: "mara" });
    const motivo = applicaAzioneSicura(s, "T-GIORNALIERO");
    expect(motivo).toMatch(/già assegnato a Mara/);
  });

  it("dopo il completamento va in ricarica per le ore indicate, poi torna", () => {
    const s = conIstanza(base(), GIORNALIERO, { fine: 500 });
    expect(disponibilitaTask(alMinuto(s, 600), CONTESTO, GIORNALIERO)).toEqual({ tipo: "IN_RICARICA", finoA: 500 + 24 * 60 });
    expect(disponibilitaTask(alMinuto(s, 500 + 24 * 60), CONTESTO, GIORNALIERO)).toEqual({ tipo: "DISPONIBILE" });
  });

  it("un task fallito si può ritentare subito", () => {
    const s = conIstanza(base(), GIORNALIERO, { stato: "FALLITO", esito: "FALLIMENTO" });
    expect(disponibilitaTask(alMinuto(s, 600), CONTESTO, GIORNALIERO).tipo).toBe("DISPONIBILE");
  });

  it("un task 'una volta sola' resta esaurito", () => {
    const s = conIstanza(base(), UNICO, {});
    expect(disponibilitaTask(alMinuto(s, 5000), CONTESTO, UNICO).tipo).toBe("ESAURITO");
  });

  it("si sblocca a catena, per giorno e da un evento recente", () => {
    const s = base();
    expect(disponibilitaTask(s, CONTESTO, CATENA).tipo).toBe("NASCOSTO");
    expect(disponibilitaTask(conIstanza(s, GIORNALIERO, {}), CONTESTO, CATENA).tipo).toBe("DISPONIBILE");

    expect(disponibilitaTask(s, CONTESTO, DAL_GIORNO_3).tipo).toBe("NASCOSTO");
    expect(disponibilitaTask(alMinuto(s, 2 * 1440 + 400), CONTESTO, DAL_GIORNO_3).tipo).toBe("DISPONIBILE");

    const conEvento: StatoMissione = {
      ...s,
      eventi: { ...s.eventi, accaduti: [{ id: "EV-OCCASIONE", tempo: 600, scelta: null }] },
    };
    expect(disponibilitaTask(alMinuto(conEvento, 700), CONTESTO, TEMPORANEO).tipo).toBe("DISPONIBILE");
    // Passate 6 ore l'occasione è persa.
    expect(disponibilitaTask(alMinuto(conEvento, 600 + 6 * 60), CONTESTO, TEMPORANEO).tipo).toBe("NASCOSTO");
  });
});

// ----------------------------------------------------------------------------
describe("resa dei task", () => {
  it("un task riuscito aggiunge le sue risorse (×1 o ×1,5 se perfetto)", () => {
    let s = applicaAzione(
      creaMissioneDiProva(),
      { tipo: "ASSEGNA_TASK", idDefinizione: "T-GIORNALIERO", responsabile: "sarah", supporto: null },
      CONTESTO,
    );
    s = applicaAzione(s, { tipo: "AVVIA_OPERAZIONI" }, CONTESTO);
    const acquaPrima = s.risorse.acqua;
    const istanza = Object.values(s.tasks).find((t) => t.idDefinizione === "T-GIORNALIERO")!;
    s = applicaAzione(s, { tipo: "AVANZA_FINO", tempo: istanza.fine! }, CONTESTO);
    const concluso = s.tasks[istanza.id]!;
    const atteso = { SUCCESSO_PERFETTO: 9, SUCCESSO: 6, SUCCESSO_PARZIALE: 3, FALLIMENTO: 0, FALLIMENTO_CRITICO: 0 }[concluso.esito!];
    expect(s.risorse.acqua - acquaPrima).toBe(atteso);
  });
});

/** Il messaggio d'errore dell'assegnazione a Sarah, o null se riesce. */
function applicaAzioneSicura(stato: StatoMissione, idDefinizione: string): string | null {
  try {
    applicaAzione(stato, { tipo: "ASSEGNA_TASK", idDefinizione, responsabile: "sarah", supporto: null }, CONTESTO);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
