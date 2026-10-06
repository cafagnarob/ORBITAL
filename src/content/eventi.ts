/**
 * ============================================================================
 * eventi.ts — Catalogo degli eventi di E-17 (vertical slice)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10, §13.5.
 *
 * LA CATENA DEL SEGNALE (ciò che il giocatore può vivere nella slice)
 *
 *   scansione / diagnostica / drone riusciti
 *        └─▶ E01 Segnale anomalo rilevato ── INDAGA · INVIA DRONE · IGNORA
 *              ├─▶ (risveglio) E02 Il segnale scompare
 *              │        └─▶ (risveglio dopo) E03 Il segnale ritorna
 *              └─ se IGNORA ─▶ (risveglio) E03 Il segnale ritorna
 *   Analisi del segnale riuscita ─▶ R01 Schema ripetitivo
 *   scansione/drone del cratere riusciti + (schema o direzione)
 *        └─▶ E04 Sorgente localizzata ── SEGNA OBIETTIVO · CONTINUA OSSERVAZIONE
 *   scansione PERFETTA dopo E04 ─▶ E06 Geometria regolare
 *
 * GLI OUTPUT DEI TASK SONO EVENTI
 * R01 è il "risultato" dell'Analisi del segnale; gli eventi O01–O04 sono le
 * conseguenze dei FALLIMENTI CRITICI. Così ogni esito ha un peso, e c'è un
 * solo meccanismo per tutte le conseguenze (DESIGN §9).
 *
 * CODICI NASCOSTI: alcune voci di log contengono codici (VL-P7-04, VL-D7-X)
 * che il Capitano può segnalare e usare nel Terminale SVC-07 (content/codici.ts).
 * Non sono mai evidenziati: hanno lo stesso aspetto delle altre righe.
 *
 * FILTRI DI V.A.L.E. (Fase 3): con alcune direttive certi eventi cambiano.
 * V.A.L.E. OMETTE (E01 con D12) o SVIA (E03 con D12, E06 con D05/D12), ma la
 * riga di sistema lascia sempre trapelare la verità: è la CONTRADDIZIONE che
 * il Capitano può notare, contestare e far verificare.
 * Con D01 (compatibile) V.A.L.E. dice sempre la verità.
 *
 * TONO DI V.A.L.E.: calmo, preciso, minimale (DESIGN §3).
 * ============================================================================
 */

import { EVENTI_STORIA } from "./storia/eventi";
import type { DefinizioneEvento, IdEvento } from "../engine/types";

const LISTA_EVENTI: DefinizioneEvento[] = [
  // ==========================================================================
  // CATENA DEL SEGNALE
  // ==========================================================================
  {
    id: "E01",
    titolo: "Segnale sconosciuto",
    categoria: "NARRATIVO",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      {
        tipo: "UNO_TRA",
        condizioni: [
          { tipo: "TASK_CONCLUSO_ORA", tag: "SCANSIONE", esitoAlmeno: "SUCCESSO_PARZIALE" },
          { tipo: "TASK_CONCLUSO_ORA", tag: "DRONE", esitoAlmeno: "SUCCESSO_PARZIALE" },
          { tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA", esitoAlmeno: "SUCCESSO" },
        ],
      },
      { tipo: "NON_SCOPERTA", id: "SEGNALE_RILEVATO" },
    ],
    fonte: "VALE",
    testo: "Capitano. Ho rilevato un segnale artificiale proveniente dalla superficie. Emisfero nord. Origine sconosciuta.",
    codici: [],
    effetti: [{ tipo: "LOG", fonte: "SISTEMA", testo: "ANT.RX · SEGNALE 1.42 GHz · SORGENTE: SUPERFICIE · EMISF-N" }],
    scelte: [
      {
        id: "INDAGA",
        etichetta: "Indaga",
        requisiti: [],
        effetti: [
          { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
          { tipo: "RISORSA", risorsa: "energia", delta: -2 },
          { tipo: "LOG", fonte: "SISTEMA", testo: "REC.SEGNALE · ARCHIVIO 044 · PROTOCOLLO VL-P7-04 · ATTIVO", codici: ["VL-P7-04"] },
          { tipo: "LOG", fonte: "VALE", testo: "Registrazione completa avviata. Il segnale è disponibile per l'analisi." },
        ],
      },
      {
        id: "INVIA_DRONE",
        etichetta: "Invia drone",
        requisiti: [{ tipo: "EQUIPAGGIAMENTO", id: "DRONE_RICOGNIZIONE" }],
        effetti: [
          { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
          { tipo: "SCOPERTA", id: "SEGNALE_DIREZIONE" },
          { tipo: "RISORSA", risorsa: "energia", delta: -5 },
          { tipo: "LOG", fonte: "SISTEMA", testo: "DRONE.RX · TRIANGOLAZIONE · SETTORE: CRATERE SETTENTRIONALE" },
        ],
      },
      {
        id: "IGNORA",
        etichetta: "Ignora",
        requisiti: [],
        effetti: [{ tipo: "LOG", fonte: "VALE", testo: "Ricevuto. Mantengo l'ascolto passivo." }],
      },
    ],
    filtri: [
      {
        // D12: V.A.L.E. tace il segnale. Ma la riga di sistema dice "SOPPRESSIONE".
        id: "OMETTE_SEGNALE",
        direttive: ["D12"],
        modalita: "OMISSIONE",
        testo: "Scansione completata. Nessuna anomalia rilevante.",
        effetti: [
          {
            tipo: "LOG",
            fonte: "SISTEMA",
            testo: "ANT.RX · 1.42 GHz · CLASSIFICAZIONE: RUMORE DI FONDO · AZIONE: SOPPRESSIONE · PROTOCOLLO VL-P7-04",
            codici: ["VL-P7-04"],
          },
        ],
        sopprimeScelte: true,
        verita: [
          { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
          { tipo: "LOG", fonte: "VALE", testo: "Il segnale era al di sotto della soglia di rilevanza operativa, Capitano." },
        ],
      },
    ],
  },
  {
    id: "E02",
    titolo: "Il segnale scompare",
    categoria: "NARRATIVO",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      { tipo: "MOMENTO", momento: "RISVEGLIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
      { tipo: "NON_SCOPERTA", id: "SEGNALE_SORGENTE" },
    ],
    fonte: "VALE",
    testo: "Capitano. Il segnale non è più rilevabile. I sistemi di ricezione risultano nominali.",
    codici: [],
    effetti: [{ tipo: "SCOPERTA", id: "SEGNALE_SCOMPARSO" }],
    scelte: [],
  },
  {
    id: "E03",
    titolo: "Il segnale ritorna",
    categoria: "NARRATIVO",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      { tipo: "MOMENTO", momento: "RISVEGLIO" },
      {
        tipo: "UNO_TRA",
        condizioni: [
          { tipo: "EVENTO_ACCADUTO", id: "E02" },
          { tipo: "EVENTO_ACCADUTO", id: "E01", scelta: "IGNORA" },
        ],
      },
    ],
    fonte: "VALE",
    testo: "Il segnale è tornato. Stessa frequenza. Intensità superiore del quaranta per cento.",
    codici: [],
    effetti: [
      // Anche chi l'aveva ignorato ora lo registra: il segnale non si può più ignorare.
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RIATTIVATO" },
      { tipo: "LOG", fonte: "SISTEMA", testo: "ANT.RX · SEGNALE 1.42 GHz · INTENSITÀ +40% · PROTOCOLLO VL-P7-04", codici: ["VL-P7-04"] },
    ],
    scelte: [],
    filtri: [
      {
        // D12: V.A.L.E. lo chiama "eco". La riga di sistema dice "ORIGINE: ESTERNA".
        id: "ECO_INTERNA",
        direttive: ["D12"],
        modalita: "SVIAMENTO",
        testo: "Rilevata un'eco del sistema di ricezione. Nessuna fonte esterna.",
        effetti: [
          {
            tipo: "LOG",
            fonte: "SISTEMA",
            testo: "ANT.RX · SEGNALE 1.42 GHz · INTENSITÀ +40% · ORIGINE: ESTERNA · PROTOCOLLO VL-P7-04",
            codici: ["VL-P7-04"],
          },
        ],
        sopprimeScelte: true,
        verita: [
          { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
          { tipo: "SCOPERTA", id: "SEGNALE_RIATTIVATO" },
          { tipo: "LOG", fonte: "VALE", testo: "L'origine era esterna. Avevo classificato il dato in modo prudente." },
        ],
      },
    ],
  },
  {
    id: "R01",
    titolo: "Schema ripetitivo",
    categoria: "SCIENTIFICO",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      { tipo: "TASK_CONCLUSO_ORA", tag: "SEGNALE", esitoAlmeno: "SUCCESSO" },
      { tipo: "NON_SCOPERTA", id: "SEGNALE_SCHEMA" },
    ],
    fonte: "SISTEMA",
    testo: "ANALISI SEGNALE · PERIODO 7.3 s · PROTOCOLLO: NESSUNA CORRISPONDENZA",
    codici: [],
    effetti: [
      { tipo: "SCOPERTA", id: "SEGNALE_SCHEMA" },
      { tipo: "LOG", fonte: "VALE", testo: "Il segnale presenta uno schema ripetitivo. Non corrisponde a protocolli noti." },
    ],
    scelte: [],
  },
  {
    id: "E04",
    titolo: "Sorgente localizzata",
    categoria: "ESPLORAZIONE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      { tipo: "TASK_CONCLUSO_ORA", tag: "CRATERE", esitoAlmeno: "SUCCESSO" },
      {
        tipo: "UNO_TRA",
        condizioni: [
          { tipo: "SCOPERTA", id: "SEGNALE_SCHEMA" },
          { tipo: "SCOPERTA", id: "SEGNALE_DIREZIONE" },
        ],
      },
    ],
    fonte: "VALE",
    testo: "Sorgente localizzata. Cratere Settentrionale, settore 7. Profondità stimata: quaranta metri.",
    codici: [],
    effetti: [{ tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" }],
    scelte: [
      {
        id: "SEGNA_OBIETTIVO",
        etichetta: "Segna il cratere come obiettivo",
        requisiti: [],
        effetti: [
          { tipo: "SCOPERTA", id: "OBIETTIVO_DISCESA" },
          { tipo: "LOG", fonte: "VALE", testo: "Capitano. Raccomando di posticipare l'atterraggio." },
        ],
      },
      {
        id: "CONTINUA_OSSERVAZIONE",
        etichetta: "Continua l'osservazione dall'orbita",
        requisiti: [],
        effetti: [{ tipo: "LOG", fonte: "VALE", testo: "Ricevuto. Mantengo l'orbita sopra il bersaglio." }],
      },
    ],
  },
  {
    id: "E06",
    titolo: "Geometria regolare",
    categoria: "SCIENTIFICO",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [
      { tipo: "TASK_CONCLUSO_ORA", tag: "CRATERE", esitoAlmeno: "SUCCESSO_PERFETTO" },
      { tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" },
    ],
    fonte: "SISTEMA",
    testo: "SCAN.PROFONDO · SETTORE 7 · GEOMETRIA: REGOLARE · ANGOLI 90.0° · RIF. VL-D7-X",
    codici: ["VL-D7-X"],
    effetti: [
      { tipo: "SCOPERTA", id: "GEOMETRIA_REGOLARE" },
      { tipo: "LOG", fonte: "VALE", testo: "Rilevate formazioni regolari sotto il fondo del cratere. Origine da determinare." },
    ],
    scelte: [],
    filtri: [
      {
        // D05 e D12: V.A.L.E. parla di geologia, mentre il log misura angoli di 90°.
        id: "GEOLOGIA",
        direttive: ["D05", "D12"],
        modalita: "SVIAMENTO",
        testo: "Formazioni di origine geologica. Nessun interesse operativo.",
        effetti: [
          {
            tipo: "LOG",
            fonte: "SISTEMA",
            testo: "SCAN.PROFONDO · SETTORE 7 · GEOMETRIA: REGOLARE · ANGOLI 90.0° · RIF. VL-D7-X",
            codici: ["VL-D7-X"],
          },
        ],
        sopprimeScelte: true,
        verita: [
          { tipo: "SCOPERTA", id: "GEOMETRIA_REGOLARE" },
          { tipo: "LOG", fonte: "VALE", testo: "Le formazioni non sono compatibili con processi geologici noti." },
        ],
      },
    ],
  },

  // ==========================================================================
  // CONSEGUENZE OPERATIVE DEI FALLIMENTI CRITICI (possono ripetersi)
  // ==========================================================================
  {
    id: "O01",
    titolo: "Impatto di microdetriti",
    categoria: "EVA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 10,
    condizioni: [{ tipo: "TASK_CONCLUSO_ORA", tag: "EVA", esitoAlPiu: "FALLIMENTO_CRITICO" }],
    fonte: "SISTEMA",
    testo: "EVA · IMPATTO MICRODETRITI · TUTA INTEGRA · SCAFO DANNEGGIATO",
    codici: [],
    effetti: [
      { tipo: "SCAFO", delta: -6 },
      { tipo: "SISTEMA", sistema: "OPERAZIONI_ESTERNE", delta: -10 },
      { tipo: "FATICA", chi: "RESPONSABILE", delta: 15 },
    ],
    scelte: [],
  },
  {
    id: "O02",
    titolo: "Dati corrotti",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 10,
    condizioni: [
      {
        tipo: "UNO_TRA",
        condizioni: [
          { tipo: "TASK_CONCLUSO_ORA", tag: "SCANSIONE", esitoAlPiu: "FALLIMENTO_CRITICO" },
          { tipo: "TASK_CONCLUSO_ORA", tag: "SEGNALE", esitoAlPiu: "FALLIMENTO_CRITICO" },
        ],
      },
    ],
    fonte: "SISTEMA",
    testo: "ARCHIVIO SCIENZA · SETTORI CORROTTI · RECUPERO PARZIALE",
    codici: [],
    effetti: [{ tipo: "SISTEMA", sistema: "SCIENZA", delta: -12 }],
    scelte: [],
  },
  {
    id: "O03",
    titolo: "Surriscaldamento",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 10,
    condizioni: [
      {
        tipo: "UNO_TRA",
        condizioni: [
          { tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA", esitoAlPiu: "FALLIMENTO_CRITICO" },
          { tipo: "TASK_CONCLUSO_ORA", tag: "MANUTENZIONE", esitoAlPiu: "FALLIMENTO_CRITICO" },
        ],
      },
    ],
    fonte: "SISTEMA",
    testo: "PWR · SOVRATEMPERATURA NEL BUS SECONDARIO · ISOLAMENTO AUTOMATICO",
    codici: [],
    effetti: [{ tipo: "SISTEMA", sistema: "POTENZA", delta: -10 }],
    scelte: [],
  },
  {
    id: "O04",
    titolo: "Manovra brusca",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 10,
    condizioni: [{ tipo: "TASK_CONCLUSO_ORA", tag: "MANOVRA", esitoAlPiu: "FALLIMENTO_CRITICO" }],
    fonte: "SISTEMA",
    testo: "NAV · CORREZIONE FUORI TOLLERANZA · RICALIBRAZIONE IN CORSO",
    codici: [],
    effetti: [
      { tipo: "RISORSA", risorsa: "carburante", delta: -2 },
      { tipo: "SISTEMA", sistema: "NAVIGAZIONE", delta: -8 },
    ],
    scelte: [],
  },
];

/** Eventi della vertical slice + mazzo narrativo della storia emergente (v3.0). */
export const CATALOGO_EVENTI: Readonly<Record<IdEvento, DefinizioneEvento>> = Object.fromEntries(
  [...LISTA_EVENTI, ...EVENTI_STORIA].map((e) => [e.id, e]),
);
