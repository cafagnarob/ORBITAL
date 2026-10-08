/**
 * ============================================================================
 * e17.ts — Supermissione E-17: ricognizione orbitale del Cratere Settentrionale
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6 (la prima supermissione, v3.7) e §14.7.
 *
 * La storia: la sonda SR-9 ha registrato anomalie sopra il Cratere
 * Settentrionale di E-17, poi ha smesso di trasmettere. Da lì parte il
 * segnale a 1,42 GHz che lega tutte le missioni (e la direttiva di V.A.L.E.).
 *
 * SCALETTA: calibra i sensori (vale 24 h) · correggi la traiettoria (12 h)
 *           · ripara l'antenna in EVA · scansiona l'area d'interesse
 *           (solo 10:00–16:00). Una scansione fallita fa derivare la nave.
 *
 * In questo file: la definizione, i task e gli eventi che esistono solo qui.
 * La catena del segnale "storica" (E01, E04, E06) sta in content/eventi.ts,
 * anch'essa limitata a E-17 con soloIn("E17").
 * ============================================================================
 */

import type { DefinizioneEvento, DefinizioneMissione, DefinizioneTask } from "../../engine/types";
import { E17_NOTO } from "../pianeti/e17";
import {
  BASE_TASK,
  dalGiorno,
  dopo,
  fallito,
  IN_ORBITA,
  MATTINA,
  OBIETTIVI_DI_VIAGGIO,
  OBIETTIVO_RIENTRO,
  obiettivoArrivo,
  riuscito,
  soloIn,
  valido,
} from "./comuni";

const E17 = soloIn("E17");
/** Il task finale: se fallisce, i preparativi a tempo vanno rifatti. */
const FINALE = "T-SCANSIONE-OBIETTIVO";

export const MISSIONE_E17: DefinizioneMissione = {
  id: "E17",
  sigla: "E17",
  nome: "E-17",
  titolo: "Ricognizione orbitale di E-17",
  bersaglio: { forma: "PIANETA", luogo: "E-17 · ORBITA", puntoInteresse: "CRATERE SETTENTRIONALE" },
  durate: { andata: { min: 2, max: 4 }, orbita: { min: 3, max: 5 }, rientro: { min: 2, max: 4 } },
  scaletta: {
    passi: [
      { task: "T-RICALIBRAZIONE", titolo: "Calibra i sensori", validitaOre: 24 },
      { task: "T-CORREZIONE-ORBITA", titolo: "Correggi la traiettoria", validitaOre: 12 },
      { task: "T-RIPARA-ANTENNA", titolo: "Ripara l'antenna del sensore", validitaOre: null },
    ],
    finale: { task: FINALE, titolo: "Scansiona l'area d'interesse" },
  },
  obiettivi: [
    // --- PRINCIPALI: la scaletta della missione --------------------------------
    obiettivoArrivo("Raggiungi E-17", "Inserimento orbitale completato. Cratere Settentrionale in vista, Capitano."),
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
    OBIETTIVO_RIENTRO,

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
    ...OBIETTIVI_DI_VIAGGIO,
  ],
  briefing: {
    protocollo: "ORDINE DI MISSIONE N. 0417 · RIF. ORB-1 / E-17",
    scheda: [
      { etichetta: "TIPO", valore: "Scientifica · ricognizione" },
      { etichetta: "PIANETA", valore: "E-17 · arido, atmosfera sottile, radiazioni moderate" },
      { etichetta: "POSIZIONE", valore: "Orbita bassa sopra il Cratere Settentrionale" },
      { etichetta: "RISCHIO STIMATO", valore: "Moderato" },
    ],
    contesto: [
      "Novanta giorni fa la sonda automatica SR-9 ha registrato anomalie elettromagnetiche sopra il Cratere Settentrionale di E-17. Undici ore dopo ha smesso di trasmettere.",
      "Siete il primo equipaggio umano inviato a capire cosa succede laggiù. Non atterrerete: lavorerete dall'orbita, con quello che porterete a bordo.",
    ],
    parti: {
      andata: "Viaggia fino a E-17.",
      orbita: "Calibra i sensori, correggi la traiettoria, ripara l'antenna, poi scansiona l'area d'interesse del cratere (solo tra le 10 e le 16).",
      rientro: "Torna a casa con tutto l'equipaggio.",
    },
    obiettivoFinale:
      "Tornare sulla Terra con delle risposte. Più verità riporterete a casa, migliore sarà l'esito della missione. Ma tornare vivi viene prima di tutto.",
  },
  risultato: "l'area d'interesse del Cratere Settentrionale, il punto esatto da cui parte il segnale",
  dati: [
    [
      ["ATMOSFERA", "SOTTILE"],
      ["TEMP.", E17_NOTO.temperatura],
    ],
    [
      ["RADIAZIONI", E17_NOTO.radiazioni],
      ["GRAVITÀ", E17_NOTO.gravita],
    ],
    [
      ["BIOLOGIA", E17_NOTO.biologia],
      ["VENTO", E17_NOTO.vento],
    ],
  ],
};

// ----------------------------------------------------------------------------
// TASK DI E-17 (spostati qui da content/tasks.ts nella v3.8)
// ----------------------------------------------------------------------------

export const TASK_E17: DefinizioneTask[] = [
  {
    ...BASE_TASK,
    id: "T-SCANSIONE-CRATERE",
    minigioco: { tipo: "RADAR", titolo: "Scansione del cratere", istruzioni: "Muovi lo scanner sul cratere, segui il segnale e aggancia il punto più intenso." },
    nome: "Scansione orbitale del cratere",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 150,
    rischioBase: 25,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["SENSORE_PROFONDO"],
    costoRisorse: { energia: 4 },
    costoFatica: 12,
    sblocco: [E17, IN_ORBITA],
    tag: ["SCANSIONE", "CRATERE"],
    ricaricaOre: 24,
  },
  {
    ...BASE_TASK,
    id: "T-RICOGNIZIONE-DRONE",
    minigioco: { tipo: "MANOVRA", titolo: "Pilotaggio del drone", istruzioni: "Guida il drone nel canyon: resta nel corridoio mentre il vento lo spinge." },
    nome: "Ricognizione con drone",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "SCIENZA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "COMANDO",
    equipaggiamentoRichiesto: ["DRONE_RICOGNIZIONE"],
    costoRisorse: { energia: 5 },
    costoFatica: 8,
    tag: ["DRONE", "CRATERE"],
    ricaricaOre: 24,
    // Prima si guarda il cratere dall'orbita, poi si manda il drone.
    sblocco: [E17, IN_ORBITA, dopo("T-SCANSIONE-CRATERE")],
  },
  {
    ...BASE_TASK,
    id: "T-MAPPATURA",
    minigioco: { tipo: "RADAR", titolo: "Punto di riferimento", istruzioni: "Cerca con lo scanner il punto di riferimento della mappa e aggancialo." },
    nome: "Mappatura completa del cratere",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 210,
    rischioBase: 25,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["SENSORE_PROFONDO"],
    costoRisorse: { energia: 5 },
    costoFatica: 15,
    tag: ["CRATERE", "MAPPATURA"],
    ricaricaOre: null, // una mappa si fa una volta
    resa: { sistema: { id: "NAVIGAZIONE", delta: 12 } },
    sblocco: [E17, IN_ORBITA, dopo("T-SCANSIONE-CRATERE", 2), dalGiorno(3)],
  },
  {
    ...BASE_TASK,
    id: "T-RIPARA-ANTENNA",
    minigioco: { tipo: "TEMPISMO", titolo: "Saldatura dell'antenna", istruzioni: "Premi quando la torcia è sul giunto rotto: tre punti di saldatura sull'antenna del sensore." },
    nome: "Riparazione dell'antenna del sensore",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 40,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2", "KIT_RIPARAZIONE"],
    costoRisorse: { energia: 3 },
    costoFatica: 22,
    tag: ["EVA", "RIPARAZIONE", "ANTENNA"],
    ricaricaOre: null, // riparata una volta, resta riparata
    resa: { sistema: { id: "SCIENZA", delta: 15 } },
    sblocco: [E17, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-SCANSIONE-OBIETTIVO",
    minigioco: { tipo: "RADAR", titolo: "L'area d'interesse", istruzioni: "Muovi lo scanner profondo sul cratere e aggancia il punto da cui partono le anomalie." },
    nome: "Scansione dell'area d'interesse",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 180,
    rischioBase: 35,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["SENSORE_PROFONDO"],
    costoRisorse: { energia: 6 },
    costoFatica: 15,
    tag: ["SCANSIONE", "CRATERE", "OBIETTIVO"],
    ricaricaOre: null, // riuscita una volta, l'obiettivo è raggiunto
    finestra: { da: 10, a: 16 },
    sblocco: [
      E17,
      IN_ORBITA,
      valido("T-RICALIBRAZIONE", 24, FINALE),
      valido("T-CORREZIONE-ORBITA", 12, FINALE),
      dopo("T-RIPARA-ANTENNA"),
    ],
  },
  {
    ...BASE_TASK,
    id: "T-RECUPERO-SR9",
    minigioco: { tipo: "MANOVRA", titolo: "Aggancio della sonda", istruzioni: "Guida il drone verso la sonda alla deriva: resta nel corridoio di avvicinamento." },
    nome: "Recupero della sonda SR-9",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 35,
    luogo: "COMANDO",
    equipaggiamentoRichiesto: ["DRONE_RICOGNIZIONE"],
    costoRisorse: { energia: 4, carburante: 1 },
    costoFatica: 12,
    tag: ["DRONE", "SR9"],
    ricaricaOre: null,
    bonus: true,
    sblocco: [E17, IN_ORBITA, dopo("T-SCANSIONE-CRATERE")],
  },
];

// ----------------------------------------------------------------------------
// EVENTI DI E-17 (spostati qui da content/eventiMissione.ts nella v3.8)
// ----------------------------------------------------------------------------

export const EVENTI_E17: DefinizioneEvento[] = [
  {
    id: "M-ARRIVO",
    titolo: "In orbita attorno a E-17",
    categoria: "NARRATIVO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [E17, MATTINA, IN_ORBITA],
    fonte: "SISTEMA",
    testo: "SENSORE PRINCIPALE · ANTENNA ESTERNA DANNEGGIATA DURANTE IL VIAGGIO · RIPARAZIONE EVA NECESSARIA",
    codici: [],
    diario: "Siamo in orbita attorno a E-17. Il cratere è laggiù, ma l'antenna del sensore è rotta.",
    effetti: [
      { tipo: "LOG", fonte: "VALE", testo: "Capitano. Per acquisire l'area d'interesse servono sensori calibrati, traiettoria corretta e l'antenna riparata." },
    ],
    scelte: [],
  },
  {
    id: "M-OBIETTIVO",
    titolo: "Area d'interesse acquisita",
    categoria: "SCIENTIFICO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [E17, riuscito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "SCAN.PROFONDO · AREA D'INTERESSE ACQUISITA · SORGENTE EM PUNTIFORME · 1.42 GHz · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "Abbiamo acquisito l'area d'interesse. Da quel punto parte un segnale.",
    effetti: [
      { tipo: "SCOPERTA", id: "AREA_ACQUISITA" },
      { tipo: "SCOPERTA", id: "OBIETTIVO_PRIMARIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
    ],
    scelte: [],
  },
  {
    id: "M-OBIETTIVO-X",
    titolo: "Acquisizione fallita",
    categoria: "SISTEMA",
    priorita: "CRITICO",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [E17, fallito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "SCAN.PROFONDO · ACQUISIZIONE FALLITA · DERIVA ORBITALE 0,4° · TRAIETTORIA E CALIBRAZIONE DA RIPETERE",
    codici: [],
    diario: "La scansione è fallita e la nave è derivata. Si ricomincia: traiettoria e calibrazione.",
    effetti: [],
    scelte: [],
  },
  {
    id: "M-SR9",
    titolo: "Il registro della SR-9",
    categoria: "ESPLORAZIONE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [E17, riuscito("SR9")],
    fonte: "SISTEMA",
    testo: "SR-9 · ULTIMO PACCHETTO · RICHIESTA DI HANDSHAKE · ORIGINE: SUPERFICIE · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "La SR-9 non si è guastata: qualcosa, dalla superficie, le ha chiesto di identificarsi.",
    effetti: [{ tipo: "SCOPERTA", id: "REGISTRO_SR9" }, { tipo: "FIDUCIA", delta: -2 }],
    scelte: [],
  },
  {
    id: "M-SR9-X",
    titolo: "La sonda sfugge",
    categoria: "ESPLORAZIONE",
    priorita: "IMPORTANTE",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [E17, fallito("SR9")],
    fonte: "SISTEMA",
    testo: "DRONE · AGGANCIO FALLITO · URTO CON LA SONDA · BRACCIO DANNEGGIATO",
    codici: [],
    effetti: [{ tipo: "SISTEMA", sistema: "OPERAZIONI_ESTERNE", delta: -10 }],
    scelte: [],
  },
];
