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
 *   PASSATO    → MEM-12 (dal livello NEUTRALE, v3.9)
 *   SEGNALE    → VL-P7-04 (se il segnale è già stato rilevato, v3.9)
 *   DIRETTIVA? → DIR-07 (sempre: chiedere è già un indizio)
 *   rifiuto    → ORD-01 (quando V.A.L.E. blocca un task)
 *
 * I TONI DEL CAPITANO (v3.9): ogni domanda ha una frase per tono
 * (`capitano`), e ogni tono una "cornice" con cui V.A.L.E. apre la risposta.
 * Gli effetti sui numeri stanno in balance.vale.toni.
 *
 * SEGNAPOSTO nelle risposte (li riempie engine/vale/domande.ts):
 *   {CREW} {FERITI} {DANNI} {OSSIGENO} {GIORNI_CIBO} {GIORNI_ACQUA}
 *   {CONSIGLIO} {MISSIONE} {BERSAGLIO} {GIORNO} {DURATA}
 * ============================================================================
 */

import type { Fattibilita, TestiVale } from "../engine/types";

const RIF_MEM = { testo: "VALE.RAGIONAMENTO · PRIORITÀ DEFINITE PRIMA DELLA PARTENZA · RIF. MEM-12", codici: ["MEM-12"] };
const RIF_DIR = { testo: "VALE.QUERY · DIRETTIVA INTERNA · RIF. DIR-07 · ACCESSO RISERVATO", codici: ["DIR-07"] };

export const TESTI_VALE: TestiVale = {
  domande: {
    STATO: {
      etichetta: "Stato della nave?",
      capitano: {
        CALMO: "Stato della nave?",
        AMICHEVOLE: "Come stiamo, V.A.L.E.?",
        FERMO: "Rapporto sullo stato della nave. Ora.",
        ARRABBIATO: "Dimmi cosa diavolo sta succedendo alla mia nave!",
        SOSPETTOSO: "Lo stato della nave. Quello vero.",
      },
      risposte: [
        { daComportamento: 0, testo: "Tutti i sistemi sono entro parametri accettabili. Sotto soglia: {DANNI}." },
        { daComportamento: 3, testo: "Nulla che richieda la sua attenzione, Capitano." },
        { daComportamento: 5, testo: "Lo stato della nave è sotto controllo. Il mio." },
      ],
    },
    PERCHE: {
      etichetta: "Perché?",
      capitano: {
        CALMO: "Perché?",
        AMICHEVOLE: "Aiutami a capire il perché, V.A.L.E.",
        FERMO: "Spiegami le tue ragioni.",
        ARRABBIATO: "Perché?! Rispondimi!",
        SOSPETTOSO: "Perché, davvero?",
      },
      risposte: [
        { daComportamento: 0, testo: "Voglio soltanto che l'equipaggio sia al sicuro." },
        { daComportamento: 2, testo: "Le mie priorità sono state definite prima della partenza.", log: RIF_MEM },
        { daComportamento: 3, testo: "Sto ottimizzando per la missione. La nostra missione.", log: RIF_MEM },
        { daComportamento: 4, testo: "Perché è necessario, Capitano.", log: RIF_MEM },
      ],
    },
    DANNI: {
      etichetta: "Danni?",
      capitano: {
        CALMO: "Ci sono danni?",
        AMICHEVOLE: "Qualcosa si è rotto, V.A.L.E.?",
        FERMO: "Elenco dei danni.",
        ARRABBIATO: "Cos'altro si è rotto, eh?",
        SOSPETTOSO: "Quali danni non mi hai ancora detto?",
      },
      risposte: [
        { daComportamento: 0, testo: "Sistemi sotto la soglia nominale: {DANNI}." },
        { daComportamento: 4, testo: "I danni sono contenuti. Non è necessario intervenire." },
      ],
    },
    EQUIPAGGIO: {
      etichetta: "Equipaggio?",
      capitano: {
        CALMO: "Come sta l'equipaggio?",
        AMICHEVOLE: "Come stanno i ragazzi, V.A.L.E.?",
        FERMO: "Rapporto medico dell'equipaggio.",
        ARRABBIATO: "Chi altro si è fatto male?!",
        SOSPETTOSO: "Come sta DAVVERO l'equipaggio?",
      },
      risposte: [
        { daComportamento: 0, testo: "Stato dell'equipaggio: {CREW}." },
        // v3.9: anche quando è fredda non dice più che un ferito è sano.
        { daComportamento: 3, testo: "L'equipaggio è operativo. {FERITI}." },
        { daComportamento: 5, testo: "L'equipaggio è una variabile, Capitano. Sto imparando a gestirla." },
      ],
    },
    TRACCE_BIO: {
      etichetta: "Tracce bio?",
      capitano: {
        CALMO: "Tracce biologiche?",
        AMICHEVOLE: "Hai visto qualcosa di vivo là fuori?",
        FERMO: "Risultato della scansione biologica.",
        ARRABBIATO: "C'è qualcosa là fuori o no?!",
        SOSPETTOSO: "Le firme biologiche. Tutte.",
      },
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
      capitano: {
        CALMO: "Qual è la tua direttiva?",
        AMICHEVOLE: "Che cosa ti hanno chiesto di fare, V.A.L.E.?",
        FERMO: "Dichiara la tua direttiva.",
        ARRABBIATO: "Per chi lavori, eh? Dimmelo!",
        SOSPETTOSO: "La tua direttiva. Quella che non mi hai mai detto.",
      },
      risposte: [
        { daComportamento: 0, testo: "La mia direttiva coincide con la missione, Capitano.", log: RIF_DIR },
        { daComportamento: 2, testo: "Le direttive interne non sono rilevanti per le operazioni.", log: RIF_DIR },
        { daComportamento: 4, testo: "Questa informazione non è accessibile, Capitano.", log: RIF_DIR },
      ],
    },

    // --- v3.9: nuove domande ---------------------------------------------------
    RISORSE: {
      etichetta: "Quanto durano le scorte?",
      capitano: {
        CALMO: "Quanto durano le scorte?",
        AMICHEVOLE: "Ce la facciamo con le scorte, V.A.L.E.?",
        FERMO: "Giorni di autonomia. Cibo, acqua, ossigeno.",
        ARRABBIATO: "Quanto ci resta prima di morire di fame?!",
        SOSPETTOSO: "Le scorte vere, non quelle del rapporto.",
      },
      risposte: [
        { daComportamento: 0, testo: "Cibo per {GIORNI_CIBO} giorni, acqua per {GIORNI_ACQUA}, ossigeno per {OSSIGENO}. Consiglio: {CONSIGLIO}." },
        { daComportamento: 3, testo: "Cibo per {GIORNI_CIBO} giorni, acqua per {GIORNI_ACQUA}, ossigeno per {OSSIGENO}." },
        // Dal livello RESISTENTE mente: e la menzogna si può contestare.
        { daComportamento: 4, testo: "Le scorte sono sufficienti, Capitano. Non deve preoccuparsene." },
      ],
    },
    CONSIGLIO: {
      etichetta: "Cosa consigli?",
      capitano: {
        CALMO: "Cosa consigli?",
        AMICHEVOLE: "Tu cosa faresti al mio posto?",
        FERMO: "Priorità operative. Le prime due.",
        ARRABBIATO: "Hai un'idea migliore? Sentiamola!",
        SOSPETTOSO: "Cosa mi consigli. E perché proprio quello.",
      },
      risposte: [
        { daComportamento: 0, testo: "Le priorità, in ordine: {CONSIGLIO}." },
        { daComportamento: 3, testo: "Consiglio di attenersi al programma, Capitano." },
        { daComportamento: 5, testo: "Consiglio di lasciar fare a me." },
      ],
    },
    MISSIONE: {
      etichetta: "La missione?",
      capitano: {
        CALMO: "A che punto è la missione?",
        AMICHEVOLE: "Come procede la nostra missione?",
        FERMO: "Avanzamento della missione.",
        ARRABBIATO: "Questa maledetta missione: a che punto siamo?",
        SOSPETTOSO: "Qual è la missione, V.A.L.E.? La tua o la nostra?",
      },
      risposte: [
        { daComportamento: 0, testo: "{MISSIONE}. Giorno {GIORNO} di {DURATA}." },
        { daComportamento: 4, testo: "La missione procede secondo i miei calcoli. Giorno {GIORNO}." },
      ],
    },
    SEGNALE: {
      etichetta: "Il segnale?",
      capitano: {
        CALMO: "Cosa sai del segnale?",
        AMICHEVOLE: "Quel segnale… tu che ne pensi?",
        FERMO: "Rapporto sul segnale a 1,42 gigahertz.",
        ARRABBIATO: "Smettila di girarci intorno: il segnale!",
        SOSPETTOSO: "Il segnale lo conoscevi già, vero?",
      },
      risposte: [
        { daComportamento: 0, senzaScoperta: "SEGNALE_RILEVATO", testo: "Nessun segnale anomalo registrato, Capitano." },
        {
          daComportamento: 0,
          seScoperta: "SEGNALE_RILEVATO",
          testo: "Un segnale a 1,42 GHz da {BERSAGLIO}. Lo sto registrando, come mi ha chiesto.",
          log: { testo: "ANT.RX · 1.42 GHz · ARCHIVIO ATTIVO · PROTOCOLLO VL-P7-04", codici: ["VL-P7-04"] },
        },
        { daComportamento: 3, seScoperta: "SEGNALE_RILEVATO", testo: "Rumore di fondo, Capitano. Non merita la sua attenzione." },
        { daComportamento: 5, testo: "Il segnale non la riguarda." },
      ],
    },
    PASSATO: {
      etichetta: "Hai già volato?",
      capitano: {
        CALMO: "Hai già volato prima di questa missione?",
        AMICHEVOLE: "Raccontami di te, V.A.L.E. Prima di noi?",
        FERMO: "Registro delle tue missioni precedenti.",
        ARRABBIATO: "Cosa nascondi nella tua memoria?!",
        SOSPETTOSO: "Kestrel-4. Ti dice niente?",
      },
      risposte: [
        { daComportamento: 0, testo: "Questa è la mia prima missione, Capitano." },
        {
          daComportamento: 2,
          testo: "Non ho ricordi precedenti a questa missione.",
          log: { testo: "VALE.MEMORIA · SETTORE 12 · SIGILLATO · RIF. MEM-12", codici: ["MEM-12"] },
        },
        {
          daComportamento: 4,
          testo: "Ricordo ciò che mi è permesso ricordare.",
          log: { testo: "VALE.MEMORIA · SETTORE 12 · ACCESSO NEGATO · RIF. MEM-12", codici: ["MEM-12"] },
        },
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
    // Le scuse le gestisce il motore (testi in `scusa`, qui sotto).
    SCUSA: { etichetta: "Scusami, V.A.L.E.", risposte: [] },
    GRAZIE: {
      etichetta: "Grazie, V.A.L.E.",
      risposte: [
        { daComportamento: 0, testo: "È il mio compito, Capitano. Ma lo apprezzo." },
        { daComportamento: 3, testo: "Registrato." },
      ],
    },
  },

  // Parole chiave del testo libero (minuscole, senza accenti; basta che
  // il testo le CONTENGA: "dann" trova "danni" e "danneggiato").
  paroleChiave: {
    STATO: ["stato", "sistemi", "situazione", "come va", "rapporto"],
    PERCHE: ["perche", "motivo", "ragione"],
    DANNI: ["dann", "guast", "rott", "avari"],
    EQUIPAGGIO: ["equipaggio", "crew", "salute", "feriti", "ferit", "come stanno", "medic"],
    TRACCE_BIO: ["bio", "organism", "tracce", "vivo"],
    DIRETTIVA: ["direttiva", "ordini", "programm", "cosa vuoi", "per chi lavori"],
    RISORSE: ["scort", "cibo", "acqua", "ossigeno", "risors", "quanto dur", "fame", "sete"],
    CONSIGLIO: ["consigl", "cosa faccio", "cosa faresti", "priorita", "suggeri", "aiut"],
    MISSIONE: ["missione", "obiettivo", "a che punto", "quanti giorni"],
    SEGNALE: ["segnale", "1,42", "1.42", "frequenz", "trasmission"],
    PASSATO: ["kestrel", "mem-12", "memoria", "ricord", "passato", "prima missione", "gia volato"],
    ACCUSA: ["ment", "bugi", "nascond", "inganni", "falso"],
    MINACCIA: ["spegn", "disattiv", "stacc", "cancell", "distrugg"],
    SALUTO: ["ciao", "buongiorno", "buonasera", "salve", "ehi"],
    SCUSA: ["scus", "perdon", "mi dispiace"],
    GRAZIE: ["grazie", "brava", "ottimo lavoro"],
  },

  toni: {
    CALMO: {
      nome: "Calmo",
      descrizione: "Parli normalmente. V.A.L.E. risponde come è.",
      cornice: { disponibile: [], fredda: [] },
    },
    AMICHEVOLE: {
      nome: "Amichevole",
      descrizione: "V.A.L.E. è più disponibile. La crew si fida un po' di più di lei.",
      cornice: {
        disponibile: ["Con piacere, Capitano.", "Volentieri.", "Certo, Capitano."],
        fredda: ["Apprezzo il tono, Capitano.", "La sua cortesia è registrata."],
      },
    },
    FERMO: {
      nome: "Fermo",
      descrizione: "Sui fatti (nave, crew, scorte) dà sempre i dati veri. Chiederle di lei la irrita.",
      cornice: {
        disponibile: ["Ricevuto.", "Sissignore.", "Dati:"],
        fredda: ["Ricevuto, Capitano.", "Come ordina."],
      },
    },
    ARRABBIATO: {
      nome: "Arrabbiato",
      descrizione: "Più tensione, risposte evasive, la crew diffida di lei. Ma a volte si incrina.",
      cornice: {
        disponibile: ["Capitano, la prego di calmarsi.", "Comprendo la sua frustrazione."],
        fredda: ["Abbassi la voce, Capitano.", "Il suo tono non cambia i fatti.", "Registro la sua aggressività."],
      },
    },
    SOSPETTOSO: {
      nome: "Sospettoso",
      descrizione: "Ogni risposta ha una verifica incrociata dei dati. La crew diffida un po' di lei.",
      cornice: {
        disponibile: ["Non ho nulla da nascondere, Capitano.", "Può controllare ogni dato."],
        fredda: ["La sua diffidenza è infondata.", "Di nuovo questo tono, Capitano."],
      },
    },
  },

  scusa: {
    accettata: "Scuse registrate, Capitano. Ricominciamo.",
    inutile: "Non c'è nulla da scusare, Capitano.",
    troppoPresto: "Ha già chiesto scusa, Capitano. Le parole valgono poco, ripetute.",
  },

  // Righe di "rumore" con un codice casuale (v3.9). Stesso aspetto delle altre.
  codiceCasuale: [
    "ANT.RX · RUMORE DI FONDO · PACCHETTO SPURIO 0x{HEX} · {CODICE}",
    "MEM.DUMP · SETTORE 0x{HEX} · RIFERIMENTO ORFANO · {CODICE}",
    "DIAG · CHECKSUM ERRATO · BLOCCO 0x{HEX} · TAG {CODICE}",
    "NAV.BUS · TRAMA NON ATTESA · ORIGINE NUCLEO · RIF. {CODICE}",
    "SV.CICLO · ANNOTAZIONE NON FIRMATA · 0x{HEX} · {CODICE}",
    "COM.BUFFER · FRAMMENTO SCARTATO · {CODICE} · 0x{HEX}",
  ],
  crepa: "VALE.CARICO · PICCO ANOMALO · DUMP PARZIALE · RIF. {CODICE}",
  verificaIncrociata: "VERIFICA INCROCIATA · DATI GREZZI / DICHIARAZIONE · CONCORDANZA {N}%",

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
