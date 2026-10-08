/**
 * ============================================================================
 * hk7.ts — Supermissione HK-7: il carotaggio dell'asteroide
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * La storia: HK-7 è un asteroide metallico di 900 metri. Il radar a terra
 * vede, sotto la crosta, una zona "troppo regolare" per essere naturale.
 * L'agenzia vuole tre metri di nucleo. Nessuno deve scendere: si perfora
 * dalla nave, ancorata all'asteroide.
 *
 * SCALETTA: misura la rotazione (vale 24 h) · prepara la trivella (12 h,
 *           serve il Modulo Minerario) · ancora la nave in EVA · carotaggio
 *           del nucleo (solo 12:00–18:00: la faccia metallica è in luce).
 *           Un carotaggio fallito spezza la punta: rotazione e trivella da
 *           rifare.
 * DI CONTORNO: analisi della carota (→ VL-D7-X), ghiaccio nelle fratture,
 *              detriti metallici.
 * ============================================================================
 */

import type { DefinizioneEvento, DefinizioneMissione, DefinizioneTask } from "../../engine/types";
import {
  BASE_TASK,
  dopo,
  fallito,
  IN_ORBITA,
  MATTINA,
  nonDiRecente,
  OBIETTIVI_DI_VIAGGIO,
  OBIETTIVO_RIENTRO,
  obiettivoArrivo,
  riuscito,
  soloIn,
  TURNO,
  valido,
} from "./comuni";

const HK7 = soloIn("HK7");
const FINALE = "T-HK7-CAROTAGGIO";

export const MISSIONE_HK7: DefinizioneMissione = {
  id: "HK7",
  sigla: "HK7",
  nome: "HK-7",
  titolo: "Carotaggio dell'asteroide HK-7",
  bersaglio: { forma: "ASTEROIDE", luogo: "HK-7 · STAZIONAMENTO", puntoInteresse: "ZONA REGOLARE" },
  durate: { andata: { min: 3, max: 5 }, orbita: { min: 3, max: 4 }, rientro: { min: 3, max: 5 } },
  scaletta: {
    passi: [
      { task: "T-HK7-ROTAZIONE", titolo: "Misura la rotazione", validitaOre: 24 },
      { task: "T-HK7-TRIVELLA", titolo: "Prepara la trivella", validitaOre: 12 },
      { task: "T-HK7-ANCORAGGIO", titolo: "Ancora la nave (EVA)", validitaOre: null },
    ],
    finale: { task: FINALE, titolo: "Carotaggio del nucleo" },
  },
  obiettivi: [
    obiettivoArrivo("Raggiungi HK-7", "HK-7 a trecento metri, Capitano. Ruota ogni sei ore e quaranta."),
    {
      id: "P2",
      tipo: "PRINCIPALE",
      titolo: "Preleva tre metri di nucleo",
      descrizione: "Misura la rotazione, prepara la trivella, ancora la nave. Poi perfora, tra le 12 e le 18.",
      visibile: [],
      completato: [{ tipo: "SCOPERTA", id: "CAROTA_HK7" }],
      ricompensa: [{ tipo: "FIDUCIA", delta: 3 }],
      testoRicompensa: "Carota del nucleo stivata e sigillata. Obiettivo primario conseguito.",
    },
    OBIETTIVO_RIENTRO,
    {
      id: "O-ANALISI",
      tipo: "SECONDARIO",
      titolo: "Analizza la carota",
      descrizione: "Prima di sigillarla per il viaggio, uno sguardo al laboratorio.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: FINALE }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-HK7-ANALISI" }],
      ricompensa: [{ tipo: "SISTEMA", sistema: "SCIENZA", delta: 8 }],
      testoRicompensa: "Analisi completata. La lega del nucleo non ha corrispondenze nei miei archivi.",
    },
    {
      id: "O-GHIACCIO",
      tipo: "SECONDARIO",
      titolo: "Estrai il ghiaccio dalle fratture",
      descrizione: "Le fratture di HK-7 trattengono ghiaccio d'acqua. Acqua e ossigeno in più per il ritorno.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: "T-HK7-ANCORAGGIO" }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-HK7-GHIACCIO" }],
      ricompensa: [{ tipo: "RISORSA", risorsa: "acqua", delta: 6 }],
      testoRicompensa: "Ghiaccio fuso e filtrato. Serbatoi in salita.",
    },
    ...OBIETTIVI_DI_VIAGGIO,
  ],
  briefing: {
    protocollo: "ORDINE DI MISSIONE N. 0631 · RIF. ORB-1 / HK-7",
    scheda: [
      { etichetta: "TIPO", valore: "Scientifica · prelievo" },
      { etichetta: "ASTEROIDE", valore: "HK-7 · metallico, 900 m, rotazione 6 h 40 min" },
      { etichetta: "POSIZIONE", valore: "Fascia esterna · stazionamento a 300 m" },
      { etichetta: "RISCHIO STIMATO", valore: "Alto · superficie instabile" },
    ],
    contesto: [
      "Il radar profondo vede, sotto la crosta di HK-7, una zona di trenta metri con densità perfettamente uniforme. In natura non succede.",
      "L'agenzia vuole un campione: tre metri di nucleo, prelevati dalla nave. Niente atterraggi: vi ancorerete e perforerete. Serve il Modulo Minerario.",
    ],
    parti: {
      andata: "Viaggia fino alla fascia esterna e raggiungi HK-7.",
      orbita: "Misura la rotazione, prepara la trivella, ancora la nave in EVA, poi perfora il nucleo (solo tra le 12 e le 18, quando la zona è in luce).",
      rientro: "Torna a casa con la carota sigillata e tutto l'equipaggio.",
    },
    obiettivoFinale: "Riportare a terra il primo campione della zona regolare di HK-7. Qualunque cosa sia, deve arrivare intatta. Come voi.",
  },
  risultato: "tre metri del nucleo di HK-7, e dentro una lega che non dovrebbe esistere",
  dati: [
    [
      ["DIAMETRO", "900 m"],
      ["ROTAZIONE", "6 h 40 min"],
    ],
    [
      ["COMPOSIZIONE", "FERRO-NICHEL"],
      ["GRAVITÀ", "QUASI NULLA"],
    ],
    [
      ["ZONA REGOLARE", "30 m"],
      ["SISMICITÀ", "LIEVE"],
    ],
  ],
};

// ----------------------------------------------------------------------------
// TASK DI HK-7
// ----------------------------------------------------------------------------

export const TASK_HK7: DefinizioneTask[] = [
  {
    ...BASE_TASK,
    id: "T-HK7-ROTAZIONE",
    minigioco: { tipo: "SINTONIA", titolo: "Curva di luce", istruzioni: "Sovrapponi la tua curva a quella della luce riflessa da HK-7: il periodo di rotazione è lì." },
    nome: "Misura della rotazione",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 90,
    rischioBase: 25,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["HK7", "CALCOLO"],
    ricaricaOre: 12,
    sblocco: [HK7, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-HK7-TRIVELLA",
    minigioco: { tipo: "PRESSIONE", titolo: "Fluido di perforazione", istruzioni: "Tieni la pressione del circuito della trivella nella fascia verde mentre si carica." },
    nome: "Preparazione della trivella",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "INGEGNERIA",
    moduliRichiesti: ["MODULO_MINERARIO"],
    costoRisorse: { energia: 3 },
    costoFatica: 12,
    tag: ["HK7", "MINERARIO"],
    ricaricaOre: 12,
    sblocco: [HK7, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-HK7-ANCORAGGIO",
    minigioco: { tipo: "TEMPISMO", titolo: "Arpioni d'ancoraggio", istruzioni: "Spara l'arpione quando la roccia buona passa sotto il mirino: tre ancore." },
    nome: "Ancoraggio all'asteroide",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 45,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 2 },
    costoFatica: 22,
    tag: ["EVA", "HK7"],
    ricaricaOre: null, // ancorati una volta, si resta ancorati
    sblocco: [HK7, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: FINALE,
    minigioco: { tipo: "RADAR", titolo: "La zona regolare", istruzioni: "Muovi la sonda della trivella e aggancia il punto dove la densità è perfettamente uniforme." },
    nome: "Carotaggio del nucleo",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 180,
    rischioBase: 40,
    luogo: "INGEGNERIA",
    moduliRichiesti: ["MODULO_MINERARIO"],
    equipaggiamentoRichiesto: ["CONTENITORE_CAMPIONI"],
    costoRisorse: { energia: 5 },
    costoFatica: 16,
    tag: ["OBIETTIVO", "HK7"],
    ricaricaOre: null,
    finestra: { da: 12, a: 18 },
    sblocco: [HK7, IN_ORBITA, valido("T-HK7-ROTAZIONE", 24, FINALE), valido("T-HK7-TRIVELLA", 12, FINALE), dopo("T-HK7-ANCORAGGIO")],
  },
  {
    ...BASE_TASK,
    id: "T-HK7-ANALISI",
    minigioco: { tipo: "CONFRONTO", titolo: "Spettro della lega", istruzioni: "Trova lo spettro identico a quello del campione: gli altri sono leghe note." },
    nome: "Analisi della carota",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    durataBase: 120,
    rischioBase: 25,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["HK7", "ANALISI"],
    ricaricaOre: null,
    sblocco: [HK7, IN_ORBITA, dopo(FINALE)],
  },
  {
    ...BASE_TASK,
    id: "T-HK7-GHIACCIO",
    minigioco: { tipo: "RICERCA", titolo: "Fratture con ghiaccio", istruzioni: "Trova le sacche segnate dallo spettrometro prima che il turno di luce finisca." },
    nome: "Estrazione del ghiaccio dalle fratture",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 1 },
    costoFatica: 18,
    tag: ["EVA", "HK7", "ACQUA"],
    ricaricaOre: 24,
    resa: { risorse: { acqua: 14, ossigeno: 6 } },
    sblocco: [HK7, IN_ORBITA, dopo("T-HK7-ANCORAGGIO")],
  },
];

// ----------------------------------------------------------------------------
// EVENTI DI HK-7
// ----------------------------------------------------------------------------

export const EVENTI_HK7: DefinizioneEvento[] = [
  {
    id: "H-ARRIVO",
    titolo: "HK-7",
    categoria: "NARRATIVO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HK7, MATTINA, IN_ORBITA],
    fonte: "SISTEMA",
    testo: "HK-7 · STAZIONAMENTO A 300 m · ROTAZIONE 6 h 40 min · ZONA REGOLARE ALLINEATA ALLE 12:00",
    codici: [],
    diario: "HK-7 è un sasso nero grande come un quartiere. Ruota piano, e ogni giorno a mezzogiorno ci mostra la sua cicatrice.",
    effetti: [
      { tipo: "LOG", fonte: "VALE", testo: "Capitano. Per perforare servono la rotazione misurata, la trivella in pressione e la nave ancorata dall'esterno." },
    ],
    scelte: [],
  },
  {
    id: "H-OBIETTIVO",
    titolo: "Tre metri di nucleo",
    categoria: "SCIENTIFICO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HK7, riuscito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "CAROTAGGIO COMPLETATO · 3,2 m DI NUCLEO · RISONANZA DELLA LEGA: 1.42 GHz · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "La carota è a bordo. Quando l'abbiamo toccata, i ricevitori hanno fischiato.",
    effetti: [
      { tipo: "SCOPERTA", id: "CAROTA_HK7" },
      { tipo: "SCOPERTA", id: "OBIETTIVO_PRIMARIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
    ],
    scelte: [],
  },
  {
    id: "H-OBIETTIVO-X",
    titolo: "La punta si spezza",
    categoria: "SISTEMA",
    priorita: "CRITICO",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [HK7, fallito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "TRIVELLA · PUNTA SPEZZATA A 1,1 m · LA NAVE HA RUOTATO SULL'ANCORA · ROTAZIONE E TRIVELLA DA RIFARE",
    codici: [],
    diario: "La punta della trivella si è spezzata. Si ricomincia: misure e preparazione.",
    effetti: [{ tipo: "SCAFO", delta: -4 }],
    scelte: [],
  },
  {
    id: "H-ANALISI",
    titolo: "La lega impossibile",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HK7, riuscito("ANALISI")],
    fonte: "SISTEMA",
    testo: "ANALISI · LAMINA DI LEGA IGNOTA A 2,7 m · INCISIONI REGOLARI · PASSO 7,3 µm · RIF. VL-D7-X",
    codici: ["VL-D7-X"],
    diario: "Nel nucleo di HK-7 c'è una lamina incisa. Qualcuno l'ha messa lì.",
    effetti: [
      { tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" },
      { tipo: "FIDUCIA", delta: -2 },
    ],
    scelte: [],
  },
  {
    id: "H-SISMA",
    titolo: "Microsisma",
    categoria: "AMBIENTALE",
    priorita: "IMPORTANTE",
    unaVolta: false,
    probabilita: 0.25,
    peso: 3,
    condizioni: [HK7, TURNO, IN_ORBITA, dopo("T-HK7-ANCORAGGIO"), nonDiRecente("H-SISMA", 48)],
    fonte: "VALE",
    testo: "Capitano. HK-7 si sta assestando: le ancore sono sotto sforzo.",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "MOLLA",
        etichetta: "Molla i cavi e riposizionati",
        requisiti: [],
        effetti: [
          { tipo: "RISORSA", risorsa: "carburante", delta: -1 },
          { tipo: "FATICA", chi: "TUTTI", delta: 6 },
        ],
      },
      {
        id: "TIENI",
        etichetta: "Le ancore reggeranno",
        requisiti: [],
        effetti: [],
        esiti: [
          { id: "REGGE", peso: 2, requisiti: [], testo: "Le ancore tengono. Il sisma passa.", effetti: [] },
          {
            id: "STRAPPO",
            peso: 1,
            requisiti: [],
            testo: "SCAFO · ANCORA 2 STRAPPATA · LESIONE NEL VANO DI POPPA",
            effetti: [{ tipo: "SCAFO", delta: -10 }],
            diario: "Un'ancora ha strappato un pezzo di scafo. HK-7 non vuole ospiti.",
          },
        ],
      },
    ],
  },
  {
    id: "H-POLVERE",
    titolo: "Polvere sui sensori",
    categoria: "SISTEMA",
    priorita: "SFONDO",
    unaVolta: true,
    probabilita: 0.3,
    peso: 1,
    condizioni: [HK7, TURNO, IN_ORBITA, dopo("T-HK7-ANCORAGGIO")],
    fonte: "SISTEMA",
    testo: "SENSORI ESTERNI · POLVERE METALLICA IN SOSPENSIONE · SENSIBILITÀ −8%",
    codici: [],
    effetti: [{ tipo: "SISTEMA", sistema: "SCIENZA", delta: -8 }],
    scelte: [],
  },
];
