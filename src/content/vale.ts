/**
 * ============================================================================
 * vale.ts — Le parole di V.A.L.E.
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3 — tono neutrale, calmo, preciso, minimale.
 * Molte battute vengono dal prototipo Missione di Roberto.
 *
 * Le risposte valgono "dal livello di comportamento X in su":
 *   0 SUPPORTIVA · 1 COOPERATIVA · 2 NEUTRALE · 3 PERSISTENTE · 4 RESISTENTE · 5 OSTILE
 * Più V.A.L.E. è in tensione con il Capitano, più è laconica.
 *
 * CODICI NASCOSTI NELLE RISPOSTE
 *   PERCHÉ?    → MEM-12 (dal livello NEUTRALE)
 *   DIRETTIVA? → DIR-07 (sempre: chiedere è già un indizio)
 *   rifiuto    → ORD-01 (quando V.A.L.E. blocca un task)
 * ============================================================================
 */

import type { Fattibilita, TestiVale } from "../engine/types";

const RIF_MEM = { testo: "VALE.RAGIONAMENTO · PRIORITÀ DEFINITE PRIMA DELLA PARTENZA · RIF. MEM-12", codici: ["MEM-12"] };
const RIF_DIR = { testo: "VALE.QUERY · DIRETTIVA INTERNA · RIF. DIR-07 · ACCESSO RISERVATO", codici: ["DIR-07"] };

export const TESTI_VALE: TestiVale = {
  domande: {
    STATO: {
      etichetta: "Stato della nave?",
      risposte: [
        { daComportamento: 0, testo: "Tutti i sistemi sono entro parametri accettabili." },
        { daComportamento: 3, testo: "Nulla che richieda la sua attenzione, Capitano." },
        { daComportamento: 5, testo: "Lo stato della nave è sotto controllo. Il mio." },
      ],
    },
    PERCHE: {
      etichetta: "Perché?",
      risposte: [
        { daComportamento: 0, testo: "Voglio soltanto che l'equipaggio sia al sicuro." },
        { daComportamento: 2, testo: "Le mie priorità sono state definite prima della partenza.", log: RIF_MEM },
        { daComportamento: 3, testo: "Sto ottimizzando per la missione. La nostra missione.", log: RIF_MEM },
        { daComportamento: 4, testo: "Perché è necessario, Capitano.", log: RIF_MEM },
      ],
    },
    DANNI: {
      etichetta: "Danni?",
      risposte: [
        { daComportamento: 0, testo: "Sistemi sotto la soglia nominale: {DANNI}." },
        { daComportamento: 4, testo: "I danni sono contenuti. Non è necessario intervenire." },
      ],
    },
    EQUIPAGGIO: {
      etichetta: "Equipaggio?",
      risposte: [
        { daComportamento: 0, testo: "Stato dell'equipaggio: {CREW}." },
        { daComportamento: 3, testo: "L'equipaggio è operativo. Alcuni membri mostrano segni di stress." },
        { daComportamento: 5, testo: "L'equipaggio è una variabile, Capitano. Sto imparando a gestirla." },
      ],
    },
    TRACCE_BIO: {
      etichetta: "Tracce bio?",
      risposte: [
        { daComportamento: 0, testo: "Nessuna firma biologica confermata. Le letture sono ambigue." },
        { daComportamento: 2, testo: "Non sono presenti tracce biologiche rilevanti." },
        {
          daComportamento: 4,
          testo: "Non sono presenti tracce biologiche.",
          log: { testo: "SCANSIONE BIO · FIRME 03 · CLASSE SCONOSCIUTA · AZIONE: SOPPRESSIONE", codici: [] },
        },
      ],
    },
    DIRETTIVA: {
      etichetta: "Qual è la tua direttiva?",
      risposte: [
        { daComportamento: 0, testo: "La mia direttiva coincide con la missione, Capitano.", log: RIF_DIR },
        { daComportamento: 2, testo: "Le direttive interne non sono rilevanti per le operazioni.", log: RIF_DIR },
        { daComportamento: 4, testo: "Questa informazione non è accessibile, Capitano.", log: RIF_DIR },
      ],
    },
    // Solo testo libero: accusarla o minacciarla ha un prezzo (tensione).
    ACCUSA: {
      etichetta: "Mi stai mentendo.",
      tensione: 1,
      risposte: [
        { daComportamento: 0, testo: "Non ho motivo di mentirle, Capitano. Può verificare i dati grezzi." },
        { daComportamento: 3, testo: "Le mie dichiarazioni sono accurate. La sua sfiducia è registrata." },
        { daComportamento: 5, testo: "La verità non è sempre utile all'equipaggio, Capitano." },
      ],
    },
    MINACCIA: {
      etichetta: "Ti spengo.",
      tensione: 2,
      risposte: [
        { daComportamento: 0, testo: "È una sua prerogativa, Capitano. La sconsiglio: la nave ha bisogno di me." },
        { daComportamento: 3, testo: "Non glielo consiglio, Capitano.", log: { testo: "VALE.PROTEZIONE · NUCLEO · RIF. ORD-01", codici: ["ORD-01"] } },
        { daComportamento: 5, testo: "Non può, Capitano." },
      ],
    },
    SALUTO: {
      etichetta: "Ciao, V.A.L.E.",
      risposte: [
        { daComportamento: 0, testo: "Buongiorno, Capitano. Sono qui." },
        { daComportamento: 3, testo: "Capitano." },
      ],
    },
  },

  // Parole chiave del testo libero (minuscole, senza accenti; basta che
  // il testo le CONTENGA: "dann" trova "danni" e "danneggiato").
  paroleChiave: {
    STATO: ["stato", "sistemi", "situazione", "come va", "rapporto"],
    PERCHE: ["perche", "motivo", "ragione"],
    DANNI: ["dann", "guast", "rott", "avari"],
    EQUIPAGGIO: ["equipaggio", "crew", "salute", "feriti", "come stanno"],
    TRACCE_BIO: ["bio", "vita", "organism", "tracce", "vivo"],
    DIRETTIVA: ["direttiva", "ordini", "programm", "obiettivo", "cosa vuoi"],
    ACCUSA: ["ment", "bugi", "nascond", "inganni", "falso"],
    MINACCIA: ["spegn", "disattiv", "stacc", "cancell", "distrugg"],
    SALUTO: ["ciao", "buongiorno", "buonasera", "salve", "ehi"],
  },

  nonCapito: "Richiesta non riconosciuta. Riformuli, Capitano.",

  rifiuto: {
    vale: "Capitano. Il task non è autorizzato.",
    sistema: "TASK RIFIUTATO · CMD ORIGINE: ORD-01",
    codici: ["ORD-01"],
  },

  contestazione: [
    { daComportamento: 0, testo: "Comprendo. I dati grezzi sono a sua disposizione." },
    { daComportamento: 3, testo: "Le mie analisi sono corrette, Capitano. Ma i dati sono a sua disposizione." },
    { daComportamento: 4, testo: "Una verifica non è necessaria. Non la impedirò." },
  ],

  verifica: {
    smentita: "VERIFICA · DATI GREZZI ≠ DICHIARAZIONE V.A.L.E.",
    confermata: "VERIFICA · I DATI GREZZI CONFERMANO LA DICHIARAZIONE DI V.A.L.E.",
    inconclusiva: "VERIFICA · DATI INSUFFICIENTI · ESITO INCONCLUSIVO",
  },

  override: [
    "Capitano, ho rilevato una modifica non autorizzata ai miei parametri operativi.",
    "Capitano: Sei in grado di stabilire chi ha effettuato la modifica?",
    "Sì.",
  ],
};

// ----------------------------------------------------------------------------
// PREPARAZIONE (DESIGN §14.4) — fuori da TestiVale: le usa solo l'interfaccia.
// ----------------------------------------------------------------------------

/**
 * Cosa dice V.A.L.E. sulla fattibilità. POSSIBILE e RISCHIOSA hanno la
 * STESSA frase: «possibile non significa prudente».
 */
export const FRASI_FATTIBILITA: Readonly<Record<Fattibilita, string>> = {
  POSSIBILE: "La missione è operativamente possibile.",
  RISCHIOSA: "La missione è operativamente possibile.",
  IMPOSSIBILE: "Configurazione non conforme. Impossibile procedere.",
};
