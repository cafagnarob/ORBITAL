/**
 * ============================================================================
 * imprevisti.ts — L'imprevisto di partenza: ogni partita comincia diversa
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.2 (varietà tra partite, come 60 Seconds).
 *
 * Al momento dell'inserimento in orbita il seed estrae UN imprevisto
 * (in base al peso): una cassa rotta, un'antenna colpita, qualcuno con il
 * mal di spazio… o niente di niente. Piccole differenze che cambiano le
 * prime decisioni e, a catena, la storia. Si applica in missioneIniziale.ts
 * e resta nello stato (imprevisto), così gli eventi possono ricordarlo.
 * ============================================================================
 */

import type { DefinizioneImprevisto } from "../../engine/types";

export const LISTA_IMPREVISTI: readonly DefinizioneImprevisto[] = [
  {
    id: "NESSUNO",
    peso: 3,
    log: { fonte: "VALE", testo: "Inserimento orbitale perfetto. Nessuna anomalia." },
    diario: "Partenza perfetta. Fin troppo.",
    effetti: [],
  },
  {
    id: "CASSA_ROTTA",
    peso: 2,
    log: { fonte: "SISTEMA", testo: "STIVA · CASSA ACQUA 03 · PERDITA RILEVATA · −15" },
    diario: "Una cassa d'acqua si è rotta durante il lancio. Primo giorno, prima perdita.",
    effetti: [{ tipo: "RISORSA", risorsa: "acqua", delta: -15 }],
  },
  {
    id: "MICROMETEORITE",
    peso: 2,
    log: { fonte: "SISTEMA", testo: "IMPATTO · ANTENNA PRINCIPALE · COMUNICAZIONI DEGRADATE" },
    diario: "Un micrometeorite ha colpito l'antenna. La Terra ci sente a metà.",
    effetti: [{ tipo: "SISTEMA", sistema: "COMUNICAZIONI", delta: -25 }],
  },
  {
    id: "MAL_DI_SPAZIO",
    peso: 2,
    protagonista: {},
    log: { fonte: "CREW", testo: "{P}: «Sto bene. Davvero. Datemi solo un'ora.»" },
    diario: "{P} ha passato tutto il viaggio con il mal di spazio.",
    effetti: [{ tipo: "FATICA", chi: "PROTAGONISTA", delta: 35 }],
  },
  {
    id: "NAVIGAZIONE_STARATA",
    peso: 2,
    log: { fonte: "SISTEMA", testo: "NAV · DERIVA DEI GIROSCOPI · CALIBRAZIONE RICHIESTA" },
    diario: "La navigazione è starata. I dati di bordo saranno meno affidabili.",
    effetti: [{ tipo: "SISTEMA", sistema: "NAVIGAZIONE", delta: -20 }],
  },
  {
    id: "VALVOLA_SV",
    peso: 1,
    log: { fonte: "SISTEMA", testo: "SUPPORTO VITALE · VALVOLA 2B · PERDITA LENTA" },
    diario: "Una valvola del Supporto Vitale perde. L'ossigeno andrà tenuto d'occhio.",
    effetti: [{ tipo: "SISTEMA", sistema: "SUPPORTO_VITALE", delta: -30 }],
  },
  {
    id: "DIFFIDENZA",
    peso: 2,
    protagonista: { preferisci: "MENO_FIDUCIOSO" },
    log: { fonte: "CREW", testo: "{P}: «Non mi è piaciuto come V.A.L.E. ha gestito il lancio. Per niente.»" },
    diario: "{P} ha cominciato il viaggio diffidando di V.A.L.E.",
    effetti: [{ tipo: "FIDUCIA_MEMBRO", chi: "PROTAGONISTA", delta: -12 }],
  },
  {
    id: "BENVENUTO",
    peso: 1,
    log: { fonte: "VALE", testo: "Benvenuti in orbita. Ho preparato la vostra prima giornata. Riposate, se potete." },
    diario: "V.A.L.E. ci ha accolti con una premura quasi umana.",
    effetti: [{ tipo: "FIDUCIA", delta: 6 }],
  },
];
