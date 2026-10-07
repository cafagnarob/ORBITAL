/**
 * ============================================================================
 * missione.ts — La super-missione E-17: scaletta e obiettivi (v3.7)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6.
 *
 *   PARTE 1 · ANDATA (giorni 1–3)   sopravvivere al viaggio
 *   PARTE 2 · ORBITA (giorni 4–7)   la scaletta: calibra i sensori, correggi
 *                                   la traiettoria, ripara l'antenna, poi
 *                                   scansiona l'area d'interesse (10–16)
 *   PARTE 3 · RIENTRO (3 giorni)    tornare a casa con tutta la crew
 *
 * Qui ci sono solo DATI:
 *   - OBIETTIVI: principali e secondari (di contorno), con condizioni e
 *     ricompense nel linguaggio degli eventi (il motore li controlla dopo
 *     ogni azione: engine/storia/obiettivi.ts);
 *   - SCALETTA: i passi dell'obiettivo principale come li mostra il
 *     pannello Missione (quale task, quanto resta valido).
 * La logica vera della scaletta sta nello SBLOCCO dei task (content/tasks.ts):
 * la scansione esiste solo se i tre preparativi sono validi.
 * ============================================================================
 */

import type { DefinizioneObiettivo, IdDefinizioneTask } from "../engine/types";

export const OBIETTIVI_MISSIONE: readonly DefinizioneObiettivo[] = [
  // --- PRINCIPALI: la scaletta della missione --------------------------------
  {
    id: "P1",
    tipo: "PRINCIPALE",
    titolo: "Raggiungi E-17",
    descrizione: "Tre giorni di viaggio. Tieni in efficienza la nave e la crew.",
    visibile: [],
    completato: [{ tipo: "GIORNO_ALMENO", giorno: 4 }],
    ricompensa: [],
    testoRicompensa: "Inserimento orbitale completato. Cratere Settentrionale in vista, Capitano.",
  },
  {
    id: "P2",
    tipo: "PRINCIPALE",
    titolo: "Acquisisci l'area d'interesse del cratere",
    descrizione: "Calibra i sensori, correggi la traiettoria, ripara l'antenna. Poi scansiona, tra le 10 e le 16.",
    visibile: [],
    completato: [{ tipo: "SCOPERTA", id: "AREA_ACQUISITA" }],
    ricompensa: [{ tipo: "FIDUCIA", delta: 3 }],
    testoRicompensa: "Dati dell'area d'interesse archiviati. Obiettivo primario conseguito.",
  },
  {
    id: "P3",
    tipo: "PRINCIPALE",
    titolo: "Riporta a casa tutta la crew",
    descrizione: "Lascia l'orbita entro il giorno 8 con la riserva di carburante, e nessuno resti indietro.",
    visibile: [],
    // Si valuta solo all'arrivo (il finale lo racconta): durante la missione resta "in corso".
    completato: [],
    ricompensa: [],
    testoRicompensa: "",
  },

  // --- SECONDARI: di contorno -----------------------------------------------
  {
    id: "O-SR9",
    tipo: "SECONDARIO",
    titolo: "Recupera la sonda SR-9",
    descrizione: "La sonda che ha registrato le anomalie è in un'orbita vicina. Con il drone si può agganciare.",
    visibile: [{ tipo: "FASE", fasi: ["ORBITA", "RIENTRO"] }, { tipo: "TASK_COMPLETATO", task: "T-SCANSIONE-CRATERE" }],
    completato: [{ tipo: "TASK_COMPLETATO", task: "T-RECUPERO-SR9" }],
    ricompensa: [
      { tipo: "RISORSA", risorsa: "energia", delta: 12 },
      { tipo: "SISTEMA", sistema: "COMUNICAZIONI", delta: 10 },
    ],
    testoRicompensa: "Celle e ricetrasmettitore della SR-9 recuperati e integrati, Capitano.",
  },
  {
    id: "O-MAPPA",
    tipo: "SECONDARIO",
    titolo: "Mappa il cratere",
    descrizione: "Una mappa completa del Cratere Settentrionale, per chi tornerà.",
    visibile: [{ tipo: "TASK_COMPLETATO", task: "T-SCANSIONE-CRATERE" }],
    completato: [{ tipo: "TASK_COMPLETATO", task: "T-MAPPATURA" }],
    ricompensa: [
      { tipo: "LOG", fonte: "SISTEMA", testo: "MAPPA · SETTORE 7 · ANOMALIA GEOMETRICA SOTTO IL FONDO · RIF. VL-D7-X", codici: ["VL-D7-X"] },
    ],
    testoRicompensa: "Mappa completata. Il settore 7 presenta un'anomalia che non ho classificato.",
  },
  {
    id: "O-COMETA",
    tipo: "SECONDARIO",
    titolo: "Campiona la cometa",
    descrizione: "Raccogli il ghiaccio della cometa prima che si allontani.",
    visibile: [{ tipo: "EVENTO_ACCADUTO", id: "V09" }],
    completato: [{ tipo: "TASK_COMPLETATO", task: "T-RACCOLTA-GHIACCIO" }],
    ricompensa: [{ tipo: "SISTEMA", sistema: "SCIENZA", delta: 10 }],
    testoRicompensa: "Ghiaccio cometario catalogato. Età stimata: più antica del sistema solare interno.",
  },
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

/** Un passo della scaletta, come lo mostra il pannello Missione. */
export interface PassoScaletta {
  task: IdDefinizioneTask;
  titolo: string;
  /** Ore di validità dopo il completamento (null = resta valido). */
  validitaOre: number | null;
}

/** I preparativi della scansione (devono essere validi tutti insieme). */
export const SCALETTA: readonly PassoScaletta[] = [
  { task: "T-RICALIBRAZIONE", titolo: "Calibra i sensori", validitaOre: 24 },
  { task: "T-CORREZIONE-ORBITA", titolo: "Correggi la traiettoria", validitaOre: 12 },
  { task: "T-RIPARA-ANTENNA", titolo: "Ripara l'antenna del sensore", validitaOre: null },
];
/** Il passo finale. */
export const SCANSIONE_OBIETTIVO = { task: "T-SCANSIONE-OBIETTIVO", titolo: "Scansiona l'area d'interesse" } as const;

/** I task obbligatori: la loro attrezzatura è «indispensabile» (Preparazione). */
export const TASK_OBBLIGATORI: readonly IdDefinizioneTask[] = [...SCALETTA.map((p) => p.task), SCANSIONE_OBIETTIVO.task];
