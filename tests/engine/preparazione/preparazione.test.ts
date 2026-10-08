/**
 * ============================================================================
 * preparazione.test.ts — Parametri della nave, Preparazione, direttive possibili
 * ============================================================================
 *
 * Usa un catalogo PICCOLO costruito qui: i test del motore non dipendono
 * dal catalogo vero (content/), che cambierà con il bilanciamento.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { parametriNave } from "../../../src/engine/nave/parametri";
import {
  applicaPreparazione,
  fattibilita,
  problemiPreparazione,
  riepilogoPreparazione,
  risorseIniziali,
  tagABordo,
  taskNonDisponibili,
} from "../../../src/engine/preparazione";
import type {
  CataloghiPreparazione,
  DefinizioneDirettiva,
  DefinizioneModulo,
  MembroCrew,
  Preparazione,
} from "../../../src/engine/types";
import { direttiveEleggibili, scegliDirettiva } from "../../../src/engine/vale/direttiva";
import { avanzaFinoAPausa, esegui } from "../../fixtures/simulazione";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { CONTESTO_DI_PROVA, DIAGNOSTICA, ISPEZIONE_ESTERNA } from "../../fixtures/taskDiProva";

// ----------------------------------------------------------------------------
// Catalogo di prova
// ----------------------------------------------------------------------------

function candidato(id: string, ruolo: MembroCrew["ruolo"], peso = 70): MembroCrew {
  return {
    id,
    nome: id.toUpperCase(),
    ruolo,
    peso,
    abilita: { INGEGNERIA: 5, SCIENZA: 5, PILOTAGGIO: 5, MEDICINA: 5, EVA: 5, VELOCITA: 5, PRECISIONE: 5 },
    tratto: "ADATTABILE",
    personalita: { approccio: "CAUTO", socialita: "LEALE", mentalita: "CALMO" },
    salute: 100,
    fatica: 0,
    fame: 0,
    sete: 0,
    fiduciaVale: 50,
    posizione: "HABITAT",
    stato: "SANO",
  };
}

const POTENZA: DefinizioneModulo = {
  id: "POTENZA",
  nome: "Potenza",
  peso: 80,
  sigla: "PWR",
  compartimento: "INGEGNERIA",
  descrizione: "",
  effetti: { generazioneEnergia: 6, consumoEnergia: 2 },
  tag: ["ENERGIA"],
  inArrivo: null,
};
const RICICLO: DefinizioneModulo = { ...POTENZA, id: "RICICLO", effetti: { acquaPerMembro: -20 }, tag: [] };
const ARRAY: DefinizioneModulo = { ...POTENZA, id: "ARRAY", effetti: { integritaDati: 50 }, tag: [] };
const ESTENSIONE: DefinizioneModulo = { ...POTENZA, id: "ESTENSIONE", effetti: { spazioScorte: 100 }, tag: [] };

const CAT: CataloghiPreparazione = {
  candidati: Object.fromEntries(
    [
      candidato("a", "INGEGNERE"),
      candidato("b", "PILOTA"),
      candidato("c", "SCIENZIATO"),
      candidato("d", "MEDICO"),
      candidato("e", "GENERALISTA", 700),
    ].map((m) => [m.id, m]),
  ),
  moduli: { POTENZA, RICICLO, ARRAY, ESTENSIONE, M5: { ...POTENZA, id: "M5", effetti: {} } },
  equipaggiamento: {
    TUTA_EVA_MK2: { id: "TUTA_EVA_MK2", nome: "Tuta", sigla: "EVA", peso: 35, descrizione: "", tag: ["EVA"], inArrivo: null },
    SCANNER: { id: "SCANNER", nome: "Scanner", sigla: "SCN", peso: 10, descrizione: "", tag: ["SCANSIONE"], inArrivo: null },
  },
  scorte: {
    CASSA: {
      id: "CASSA",
      nome: "Cassa",
      descrizione: "",
      peso: 15,
      spazio: 10,
      massimo: 30,
      risorsa: "cibo",
      quantita: 8,
      inArrivo: null,
    },
    BOTTE: {
      id: "BOTTE",
      nome: "Botte",
      descrizione: "",
      peso: 10,
      spazio: 5,
      massimo: 30,
      risorsa: "acqua",
      quantita: 8,
      inArrivo: null,
    },
    TANICA: {
      id: "TANICA",
      nome: "Tanica",
      descrizione: "",
      peso: 20,
      spazio: 10,
      massimo: 6,
      risorsa: "carburante",
      quantita: 4,
      inArrivo: null,
    },
  },
  task: { [DIAGNOSTICA.id]: DIAGNOSTICA, [ISPEZIONE_ESTERNA.id]: ISPEZIONE_ESTERNA },
  direttive: {},
};

/** Una preparazione valida: 4 crew, 12 giorni di cibo e acqua, 2 taniche, la tuta. */
function prepValida(): Preparazione {
  return {
    crew: ["a", "b", "c", "d"],
    moduli: [],
    equipaggiamento: ["TUTA_EVA_MK2"],
    scorte: { CASSA: 12, BOTTE: 12, TANICA: 2 },
  };
}

// ----------------------------------------------------------------------------
// Parametri della nave
// ----------------------------------------------------------------------------

describe("parametriNave", () => {
  it("senza moduli restituisce i valori base di balance.ts", () => {
    const p = parametriNave([], CAT.moduli);
    expect(p.generazioneEnergia).toBe(BALANCE.giornata.generazioneEnergia);
    expect(p.spazioScorte).toBe(BALANCE.preparazione.spazioScorte);
    expect(p.integritaDati).toBe(0);
  });

  it("somma gli effetti dei moduli e ignora gli ID sconosciuti", () => {
    const p = parametriNave(["POTENZA", "SCONOSCIUTO"], CAT.moduli);
    expect(p.generazioneEnergia).toBe(BALANCE.giornata.generazioneEnergia + 6);
    expect(p.consumoEnergia).toBe(BALANCE.giornata.consumoEnergia + 2);
  });

  it("nessun parametro scende sotto zero", () => {
    expect(parametriNave(["RICICLO"], CAT.moduli).acquaPerMembro).toBe(0);
  });

  it("il rapporto serale usa i moduli installati", () => {
    const contesto = { ...CONTESTO_DI_PROVA, catalogoModuli: CAT.moduli };
    const base = creaMissioneDiProva();
    base.risorse.energia = 50;
    const conModulo = structuredClone(base);
    conModulo.nave.moduli = ["POTENZA"];

    const sera = (s: typeof base) => avanzaFinoAPausa(esegui(s, [{ tipo: "AVVIA_OPERAZIONI" }], contesto), contesto);
    // Il modulo dà +6 e consuma +2: a fine giornata 4 di energia in più.
    expect(sera(conModulo).risorse.energia - sera(base).risorse.energia).toBe(4);
  });
});

// ----------------------------------------------------------------------------
// Reducer della Preparazione
// ----------------------------------------------------------------------------

describe("applicaPreparazione", () => {
  const vuota: Preparazione = { crew: [], moduli: [], equipaggiamento: [], scorte: {} };

  it("SCEGLI_* aggiunge e, alla seconda volta, toglie", () => {
    const una = applicaPreparazione(vuota, { tipo: "SCEGLI_MODULO", id: "POTENZA" }, CAT);
    expect(una.moduli).toEqual(["POTENZA"]);
    expect(applicaPreparazione(una, { tipo: "SCEGLI_MODULO", id: "POTENZA" }, CAT).moduli).toEqual([]);
  });

  it("non supera gli slot e non modifica lo stato originale", () => {
    let p = vuota;
    for (const id of ["POTENZA", "RICICLO", "ARRAY", "ESTENSIONE", "M5"]) {
      p = applicaPreparazione(p, { tipo: "SCEGLI_MODULO", id }, CAT);
    }
    expect(p.moduli).toHaveLength(BALANCE.preparazione.slotModuli);
    expect(vuota.moduli).toEqual([]);
  });

  it("la crew si ferma a 4 membri", () => {
    let p = vuota;
    for (const id of ["a", "b", "c", "d", "e"]) p = applicaPreparazione(p, { tipo: "SCEGLI_CANDIDATO", id }, CAT);
    expect(p.crew).toEqual(["a", "b", "c", "d"]);
  });

  it("le casse restano tra 0 e il massimo", () => {
    const troppe = applicaPreparazione(vuota, { tipo: "IMPOSTA_SCORTA", id: "TANICA", quantita: 99 }, CAT);
    expect(troppe.scorte.TANICA).toBe(6);
    const negative = applicaPreparazione(vuota, { tipo: "IMPOSTA_SCORTA", id: "TANICA", quantita: -3 }, CAT);
    expect(negative.scorte.TANICA).toBe(0);
  });

  it("ignora gli ID che il catalogo non conosce", () => {
    expect(applicaPreparazione(vuota, { tipo: "SCEGLI_CANDIDATO", id: "fantasma" }, CAT)).toBe(vuota);
  });
});

// ----------------------------------------------------------------------------
// Riepilogo, problemi e fattibilità
// ----------------------------------------------------------------------------

describe("riepilogo della preparazione", () => {
  it("calcola peso, spazio e risorse dalle scelte", () => {
    const r = riepilogoPreparazione(prepValida(), CAT);
    expect(r.carico.crew).toBe(280);
    expect(r.carico.scorte).toBe(12 * 15 + 12 * 10 + 2 * 20);
    expect(r.carico.totale).toBe(280 + 35 + 340);
    expect(r.spazio).toEqual({ occupato: 200, massimo: 200 });
    expect(r.risorse.cibo).toBe(96);
    expect(r.risorse.acqua).toBe(96);
    expect(r.risorse.ossigeno).toBe(BALANCE.giornata.capacitaOssigeno);
    expect(r.risorse.carburante).toBe(BALANCE.preparazione.serbatoio + 8);
    expect(r.carburanteOperativo).toBe(8);
    expect(r.giorniScorte).toBe(8); // 96 / (4 membri × 3 al giorno, v3.9)
  });

  it("la batteria parte piena, anche con la riserva d'emergenza", () => {
    const prep = { ...prepValida(), moduli: ["ESTENSIONE"] };
    expect(risorseIniziali(prep, CAT).energia).toBe(BALANCE.giornata.capacitaBatteria);
  });

  it("i tag a bordo non hanno doppioni", () => {
    const prep = { ...prepValida(), moduli: ["POTENZA"], equipaggiamento: ["TUTA_EVA_MK2", "SCANNER"] };
    expect(tagABordo(prep, CAT).sort()).toEqual(["ENERGIA", "EVA", "SCANSIONE"]);
  });

  it("una preparazione completa è POSSIBILE", () => {
    const problemi = problemiPreparazione(prepValida(), CAT);
    expect(problemi).toEqual([]);
    expect(fattibilita(problemi)).toBe("POSSIBILE");
  });

  it("crew incompleta e carico eccessivo sono BLOCCANTI → IMPOSSIBILE", () => {
    const prep = { ...prepValida(), crew: ["a", "b", "e"] }; // e pesa 700 kg
    const problemi = problemiPreparazione(prep, CAT);
    expect(problemi.filter((p) => p.gravita === "BLOCCANTE")).toHaveLength(2);
    expect(fattibilita(problemi)).toBe("IMPOSSIBILE");
  });

  it("la stiva piena blocca; l'Espansione la allarga", () => {
    const piena = { ...prepValida(), scorte: { CASSA: 22 } };
    expect(problemiPreparazione(piena, CAT).some((p) => p.testo.startsWith("Stiva piena"))).toBe(true);
    const allargata = { ...piena, moduli: ["ESTENSIONE"] };
    expect(problemiPreparazione(allargata, CAT).some((p) => p.testo.startsWith("Stiva piena"))).toBe(false);
  });

  it("niente medico, niente carburante, task impossibili → avvisi, RISCHIOSA", () => {
    const prep: Preparazione = { crew: ["a", "b", "c", "e"], moduli: [], equipaggiamento: [], scorte: { CASSA: 12, BOTTE: 12 } };
    const cat = { ...CAT, candidati: { ...CAT.candidati, e: candidato("e", "GENERALISTA") } };
    const testi = problemiPreparazione(prep, cat).map((p) => p.testo);
    expect(testi).toContain("Nessun medico a bordo.");
    expect(testi.some((t) => t.startsWith("Nessun carburante operativo"))).toBe(true);
    expect(testi.some((t) => t.includes(ISPEZIONE_ESTERNA.nome))).toBe(true);
    expect(fattibilita(problemiPreparazione(prep, cat))).toBe("RISCHIOSA");
  });

  it("taskNonDisponibili guarda equipaggiamento e moduli", () => {
    const conModulo = { ...DIAGNOSTICA, id: "T-LAB", moduliRichiesti: ["LAB"] };
    const cat = { ...CAT, task: { ...CAT.task, [conModulo.id]: conModulo } };
    const ids = taskNonDisponibili(prepValida(), cat).map((t) => t.id);
    expect(ids).toEqual(["T-LAB"]);
  });
});

// ----------------------------------------------------------------------------
// Il loadout decide quali direttive sono possibili (DESIGN §11.4)
// ----------------------------------------------------------------------------

describe("direttive eleggibili", () => {
  const dir = (id: string, richiede: DefinizioneDirettiva["richiede"]): DefinizioneDirettiva => ({
    id,
    nome: id,
    classe: "NEUTRALE",
    peso: 1,
    tagContrari: [],
    richiede,
  });
  const LISTA = [dir("D-SCAN", ["SCANSIONE"]), dir("D-DRONE", ["DRONE"]), dir("D-ENTRAMBI", ["SCANSIONE", "DRONE"])];

  it("tiene solo le direttive con TUTTI i tag richiesti a bordo", () => {
    expect(direttiveEleggibili(LISTA, ["SCANSIONE"]).map((d) => d.id)).toEqual(["D-SCAN"]);
    expect(direttiveEleggibili(LISTA, ["SCANSIONE", "DRONE"]).map((d) => d.id)).toHaveLength(3);
  });

  it("se nessuna è possibile, si sceglie tra tutte", () => {
    expect(direttiveEleggibili(LISTA, [])).toHaveLength(3);
  });

  it("senza drone a bordo la direttiva sul drone non esce mai", () => {
    const eleggibili = direttiveEleggibili(LISTA, ["SCANSIONE"]);
    const uscite = new Set(Array.from({ length: 30 }, (_, i) => scegliDirettiva(`S-${i}`, eleggibili)));
    expect([...uscite]).toEqual(["D-SCAN"]);
  });
});
