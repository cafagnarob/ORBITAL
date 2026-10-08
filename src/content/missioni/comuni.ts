/**
 * ============================================================================
 * comuni.ts — Gli "attrezzi" comuni per scrivere una supermissione
 * ============================================================================
 *
 * Ogni file di missione (e17.ts, argo3.ts…) contiene tre cose:
 *   MISSIONE_…  la definizione: briefing, durate, scaletta, obiettivi, dati;
 *   TASK_…      i task che esistono SOLO in quella missione;
 *   EVENTI_…    gli eventi che succedono SOLO in quella missione.
 * Task ed eventi vanno nei cataloghi comuni (content/tasks.ts,
 * content/eventi.ts), ma con la condizione `soloIn(id)`: così compaiono
 * solo nella partita giusta.
 *
 * Qui ci sono le abbreviazioni per scriverli in modo leggibile.
 * ============================================================================
 */

import type { Condizione, DefinizioneObiettivo, DefinizioneTask, IdDefinizioneTask, IdMissione } from "../../engine/types";

/** Solo nella supermissione indicata. */
export const soloIn = (...missioni: IdMissione[]): Condizione => ({ tipo: "MISSIONE", missioni });

/** Vicino al bersaglio (fase ORBITA): durante i viaggi non si può. */
export const IN_ORBITA: Condizione = { tipo: "FASE", fasi: ["ORBITA"] };
export const MATTINA: Condizione = { tipo: "MOMENTO", momento: "RISVEGLIO" };
export const SERA: Condizione = { tipo: "MOMENTO", momento: "RAPPORTO_SERALE" };
export const TURNO: Condizione = { tipo: "MOMENTO", momento: "TURNO" };

/** Un task appena concluso con quel tag è riuscito (anche solo in parte). */
export const riuscito = (tag: string): Condizione => ({ tipo: "TASK_CONCLUSO_ORA", tag, esitoAlmeno: "SUCCESSO_PARZIALE" });
/** Un task appena concluso con quel tag è fallito. */
export const fallito = (tag: string): Condizione => ({ tipo: "TASK_CONCLUSO_ORA", tag, esitoAlPiu: "FALLIMENTO" });

/** Dal giorno indicato in poi. */
export const dalGiorno = (giorno: number): Condizione => ({ tipo: "GIORNO_ALMENO", giorno });

/** Il task è stato completato almeno `volte` volte. */
export const dopo = (task: IdDefinizioneTask, volte = 1): Condizione => ({ tipo: "TASK_COMPLETATO", task, volte });

/**
 * Un preparativo che SCADE: completato da meno di `ore` ore e non annullato
 * da un fallimento del task finale (`finale`) avvenuto dopo.
 */
export const valido = (task: IdDefinizioneTask, ore: number, finale: IdDefinizioneTask): Condizione => ({
  tipo: "TASK_VALIDO",
  task,
  ore,
  invalidatoDa: finale,
});

/** V.A.L.E. è accesa e non sotto override: può rispondere. */
export const VALE_ATTIVA: Condizione[] = [
  { tipo: "NON", condizione: { tipo: "OVERRIDE" } },
  { tipo: "NON_SCOPERTA", id: "VALE_SPENTA" },
];

/** Non di nuovo entro `ore` ore (per eventi che possono ripetersi). */
export const nonDiRecente = (id: string, ore: number): Condizione => ({ tipo: "NON", condizione: { tipo: "EVENTO_RECENTE", id, ore } });

/** Valori di default dei task: ogni task li sovrascrive dove serve. */
export const BASE_TASK = {
  abilitaSecondaria: null,
  supportoAmmesso: true,
  equipaggiamentoRichiesto: [],
  moduliRichiesti: [],
  scoperteRichieste: [],
  costoRisorse: {},
  sblocco: [],
} satisfies Partial<DefinizioneTask>;

// ----------------------------------------------------------------------------
// OBIETTIVI COMUNI
// ----------------------------------------------------------------------------

/** P1 · arrivare: si completa entrando in fase ORBITA. */
export function obiettivoArrivo(titolo: string, testoRicompensa: string): DefinizioneObiettivo {
  return {
    id: "P1",
    tipo: "PRINCIPALE",
    titolo,
    descrizione: "Il viaggio d'andata. Tieni in efficienza la nave e la crew.",
    visibile: [],
    completato: [{ tipo: "FASE", fasi: ["ORBITA", "RIENTRO"] }],
    ricompensa: [],
    testoRicompensa,
  };
}

/** P3 · tutti a casa: si valuta all'arrivo (lo racconta il finale). */
export const OBIETTIVO_RIENTRO: DefinizioneObiettivo = {
  id: "P3",
  tipo: "PRINCIPALE",
  titolo: "Riporta a casa tutta la crew",
  descrizione: "Riparti entro la finestra di rientro, con la riserva di carburante, e nessuno resti indietro.",
  visibile: [],
  completato: [],
  ricompensa: [],
  testoRicompensa: "",
};

/** Di contorno, possibili in ogni missione: nascono dagli eventi di viaggio. */
export const OBIETTIVI_DI_VIAGGIO: readonly DefinizioneObiettivo[] = [
  {
    id: "O-CALLIOPE",
    tipo: "SECONDARIO",
    titolo: "Rispondi al mayday della Calliope",
    descrizione: "Una nave mineraria in avaria ha chiesto aiuto.",
    visibile: [{ tipo: "EVENTO_ACCADUTO", id: "V02" }],
    completato: [
      { tipo: "UNO_TRA", condizioni: [{ tipo: "EVENTO_ACCADUTO", id: "R02A" }, { tipo: "EVENTO_ACCADUTO", id: "V18" }] },
    ],
    ricompensa: [{ tipo: "FIDUCIA", delta: 3 }],
    testoRicompensa: "La Calliope è salva. L'equipaggio ne parla con orgoglio.",
  },
  {
    id: "O-TERRA",
    tipo: "SECONDARIO",
    titolo: "Due rapporti alla Terra",
    descrizione: "Apri due finestre di contatto: l'agenzia vuole notizie.",
    visibile: [{ tipo: "GIORNO_ALMENO", giorno: 2 }],
    completato: [{ tipo: "TASK_COMPLETATO", task: "T-CONTATTO-TERRA", volte: 2 }],
    ricompensa: [
      { tipo: "RISORSA", risorsa: "cibo", delta: 8 },
      { tipo: "RISORSA", risorsa: "acqua", delta: 8 },
    ],
    testoRicompensa: "L'agenzia autorizza le scorte d'emergenza sigillate nella stiva B.",
  },
];
