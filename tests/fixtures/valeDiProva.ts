/**
 * ============================================================================
 * valeDiProva.ts — Frasi di V.A.L.E. per i test, brevi e riconoscibili
 * ============================================================================
 *
 * Indipendenti da content/vale.ts: i test controllano QUALE risposta viene
 * scelta (per livello di comportamento), non la scrittura delle frasi.
 * ============================================================================
 */

import type { TestiVale } from "../../src/engine/types";

export const TESTI_VALE_DI_PROVA: TestiVale = {
  domande: {
    STATO: { etichetta: "Stato?", risposte: [{ daComportamento: 0, testo: "STATO-0" }] },
    PERCHE: {
      etichetta: "Perché?",
      risposte: [
        { daComportamento: 0, testo: "PERCHE-0" },
        { daComportamento: 3, testo: "PERCHE-3", log: { testo: "RIF. MEM-T", codici: ["MEM-T"] } },
      ],
    },
    DIRETTIVA: {
      etichetta: "Direttiva?",
      risposte: [{ daComportamento: 0, testo: "DIRETTIVA-0", log: { testo: "RIF. DIR-T", codici: ["DIR-T"] } }],
    },
    DANNI: { etichetta: "Danni?", risposte: [{ daComportamento: 0, testo: "DANNI: {DANNI}" }] },
    EQUIPAGGIO: { etichetta: "Equipaggio?", risposte: [{ daComportamento: 0, testo: "CREW: {CREW}" }] },
    TRACCE_BIO: { etichetta: "Bio?", risposte: [{ daComportamento: 0, testo: "BIO-0" }] },
    ACCUSA: { etichetta: "Menti.", tensione: 1, risposte: [{ daComportamento: 0, testo: "ACCUSA-0" }] },
    MINACCIA: { etichetta: "Ti spengo.", tensione: 2, risposte: [{ daComportamento: 0, testo: "MINACCIA-0" }] },
    SALUTO: { etichetta: "Ciao.", risposte: [{ daComportamento: 0, testo: "SALUTO-0" }] },
  },
  paroleChiave: {
    STATO: ["stato"],
    PERCHE: ["perche"],
    DANNI: ["dann"],
    EQUIPAGGIO: ["equipaggio"],
    TRACCE_BIO: ["bio"],
    DIRETTIVA: ["direttiva"],
    ACCUSA: ["ment"],
    MINACCIA: ["spegn"],
    SALUTO: ["ciao"],
  },
  nonCapito: "NON-CAPITO",
  rifiuto: { vale: "RIFIUTO", sistema: "TASK RIFIUTATO", codici: ["ORD-T"] },
  contestazione: [{ daComportamento: 0, testo: "CONTESTAZIONE-0" }],
  verifica: { smentita: "SMENTITA", confermata: "CONFERMATA", inconclusiva: "INCONCLUSIVA" },
  override: ["OVERRIDE-1", "Capitano: domanda", "OVERRIDE-2"],
};
