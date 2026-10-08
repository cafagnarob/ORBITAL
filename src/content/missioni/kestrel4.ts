/**
 * ============================================================================
 * kestrel4.ts — Supermissione KESTREL-4: il relitto alla deriva
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * La storia: la Kestrel-4 era la nave gemella della ORB-1. Undici anni fa
 * è scomparsa con sette persone a bordo. Ora è riapparsa, alla deriva, ai
 * margini del sistema: spenta, fredda, integra. Il suo computer di bordo
 * era il PROTOTIPO di V.A.L.E. Si va a recuperarne il nucleo di memoria.
 * È la missione più LUNGA: il relitto è lontano.
 *
 * SCALETTA: aggancia il relitto con il cavo (vale 12 h, il relitto ruota)
 *           · mappa le radiazioni (24 h) · taglia lo scafo in EVA ·
 *           estrai il nucleo di memoria (solo 09:00–15:00: il relitto
 *           mostra il fianco giusto). Un'estrazione fallita: cavo e
 *           mappa da rifare.
 * DI CONTORNO: la stiva del relitto, il diario del comandante (→ VL-D7-X
 *              e il primo accenno a MEM-12).
 * ============================================================================
 */

import type { DefinizioneEvento, DefinizioneMissione, DefinizioneTask } from "../../engine/types";
import {
  BASE_TASK,
  dopo,
  fallito,
  IN_ORBITA,
  MATTINA,
  OBIETTIVI_DI_VIAGGIO,
  OBIETTIVO_RIENTRO,
  obiettivoArrivo,
  riuscito,
  SERA,
  soloIn,
  TURNO,
  VALE_ATTIVA,
  valido,
} from "./comuni";

const KESTREL = soloIn("KST");
const FINALE = "T-KST-NUCLEO";

export const MISSIONE_KESTREL4: DefinizioneMissione = {
  id: "KST",
  sigla: "KST",
  nome: "Kestrel-4",
  titolo: "Recupero del relitto Kestrel-4",
  bersaglio: { forma: "RELITTO", luogo: "KESTREL-4 · AGGANCIO", puntoInteresse: "NUCLEO DI MEMORIA" },
  durate: { andata: { min: 4, max: 5 }, orbita: { min: 3, max: 4 }, rientro: { min: 4, max: 5 } },
  scaletta: {
    passi: [
      { task: "T-KST-CAVO", titolo: "Aggancia il relitto col cavo", validitaOre: 12 },
      { task: "T-KST-RADIAZIONI", titolo: "Mappa le radiazioni", validitaOre: 24 },
      { task: "T-KST-TAGLIO", titolo: "Taglia lo scafo (EVA)", validitaOre: null },
    ],
    finale: { task: FINALE, titolo: "Estrai il nucleo di memoria" },
  },
  obiettivi: [
    obiettivoArrivo("Raggiungi la Kestrel-4", "Kestrel-4 a vista, Capitano. È identica a noi."),
    {
      id: "P2",
      tipo: "PRINCIPALE",
      titolo: "Recupera il nucleo di memoria",
      descrizione: "Cavo, mappa delle radiazioni, taglio dello scafo. Poi l'estrazione, tra le 9 e le 15.",
      visibile: [],
      completato: [{ tipo: "SCOPERTA", id: "NUCLEO_KESTREL" }],
      ricompensa: [{ tipo: "FIDUCIA", delta: 2 }],
      testoRicompensa: "Nucleo di memoria della Kestrel-4 a bordo. Obiettivo primario conseguito.",
    },
    OBIETTIVO_RIENTRO,
    {
      id: "O-STIVA",
      tipo: "SECONDARIO",
      titolo: "Svuota la stiva del relitto",
      descrizione: "Undici anni di scorte sigillate. A loro non servono più.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: "T-KST-TAGLIO" }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-KST-STIVA" }],
      ricompensa: [{ tipo: "RISORSA", risorsa: "carburante", delta: 4 }],
      testoRicompensa: "Celle di carburante della Kestrel-4 trasferite. Ancora buone.",
    },
    {
      id: "O-DIARIO",
      tipo: "SECONDARIO",
      titolo: "Leggi il diario del comandante Okafor",
      descrizione: "Il diario di bordo della Kestrel-4 è nel nucleo, cifrato con chiavi dell'agenzia.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: FINALE }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-KST-DIARIO" }],
      ricompensa: [],
      testoRicompensa: "Diario decifrato. Le ultime righe parlano di noi.",
    },
    ...OBIETTIVI_DI_VIAGGIO,
  ],
  briefing: {
    protocollo: "ORDINE DI MISSIONE N. 0714 · RIF. ORB-1 / KESTREL-4",
    scheda: [
      { etichetta: "TIPO", valore: "Recupero · relitto" },
      { etichetta: "RELITTO", valore: "Kestrel-4 · classe ORB, gemella della vostra nave" },
      { etichetta: "POSIZIONE", valore: "Margine del sistema · alla deriva" },
      { etichetta: "RISCHIO STIMATO", valore: "Alto · radiazioni, relitto in rotazione" },
    ],
    contesto: [
      "Undici anni fa la Kestrel-4 scomparve con sette persone a bordo. Nessun mayday, nessun detrito. Tre settimane fa un radiotelescopio l'ha ritrovata: integra, spenta, alla deriva. L'unica cosa ancora accesa è un debole segnale a 1,42 GHz.",
      "Il suo computer di bordo era il prototipo del vostro. Recuperate il nucleo di memoria. Non cercate i corpi: non è una missione di soccorso.",
    ],
    parti: {
      andata: "Il viaggio più lungo: raggiungi il margine del sistema.",
      orbita: "Aggancia il relitto col cavo, mappa le radiazioni, taglia lo scafo in EVA, poi estrai il nucleo di memoria (solo tra le 9 e le 15, quando il relitto mostra il fianco giusto).",
      rientro: "Il viaggio più lungo, ancora: torna a casa con il nucleo e tutto l'equipaggio.",
    },
    obiettivoFinale: "Sapere che cosa è successo alla Kestrel-4. La risposta è nel nucleo di memoria. Riportatelo, e riportatevi.",
  },
  risultato: "il nucleo di memoria della Kestrel-4, con undici anni di registri che parlano anche di noi",
  dati: [
    [
      ["CLASSE", "ORB · GEMELLA"],
      ["SCOMPARSA", "11 ANNI FA"],
    ],
    [
      ["ROTAZIONE", "1 GIRO / 9 min"],
      ["RADIAZIONI", "ELEVATE"],
    ],
    [
      ["ENERGIA", "ASSENTE"],
      ["NUCLEO", "ATTIVO"],
    ],
  ],
};

// ----------------------------------------------------------------------------
// TASK DELLA KESTREL-4
// ----------------------------------------------------------------------------

export const TASK_KESTREL4: DefinizioneTask[] = [
  {
    ...BASE_TASK,
    id: "T-KST-CAVO",
    minigioco: { tipo: "MANOVRA", titolo: "Aggancio col cavo", istruzioni: "Resta nel corridoio mentre il relitto ruota: il cavo deve agganciarsi senza tendersi." },
    nome: "Aggancio del relitto col cavo",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 90,
    rischioBase: 35,
    luogo: "COMANDO",
    costoRisorse: { carburante: 1 },
    costoFatica: 10,
    tag: ["MANOVRA", "KESTREL"],
    ricaricaOre: 6,
    sblocco: [KESTREL, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-KST-RADIAZIONI",
    minigioco: { tipo: "RADAR", titolo: "Mappa delle radiazioni", istruzioni: "Muovi il rilevatore lungo lo scafo del relitto e trova il varco dove la dose è più bassa." },
    nome: "Mappatura delle radiazioni",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 120,
    rischioBase: 25,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["RILEVATORE_RADIAZIONI"],
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["KESTREL", "SCANSIONE"],
    ricaricaOre: 12,
    sblocco: [KESTREL, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-KST-TAGLIO",
    minigioco: { tipo: "TEMPISMO", titolo: "Taglio dello scafo", istruzioni: "Accendi la torcia quando la linea di taglio è sotto il mirino: il relitto ruota." },
    nome: "Taglio dello scafo del relitto",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 180,
    rischioBase: 45,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2", "KIT_RIPARAZIONE"],
    costoRisorse: { energia: 3 },
    costoFatica: 24,
    tag: ["EVA", "KESTREL"],
    ricaricaOre: null, // una volta aperto, il varco resta
    sblocco: [KESTREL, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: FINALE,
    minigioco: { tipo: "SEQUENZA", titolo: "Sgancio del nucleo", istruzioni: "Ripeti la sequenza di spegnimento dei banchi di memoria: un errore e il nucleo si cancella." },
    nome: "Estrazione del nucleo di memoria",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 180,
    rischioBase: 45,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 4 },
    costoFatica: 20,
    tag: ["OBIETTIVO", "KESTREL"],
    ricaricaOre: null,
    finestra: { da: 9, a: 15 },
    sblocco: [KESTREL, IN_ORBITA, valido("T-KST-CAVO", 12, FINALE), valido("T-KST-RADIAZIONI", 24, FINALE), dopo("T-KST-TAGLIO")],
  },
  {
    ...BASE_TASK,
    id: "T-KST-STIVA",
    minigioco: { tipo: "RICERCA", titolo: "La stiva della Kestrel", istruzioni: "Trova le casse ancora integre nel buio della stiva, prima che finisca l'aria della tuta." },
    nome: "Recupero dalla stiva del relitto",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 30,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoFatica: 18,
    tag: ["EVA", "KESTREL", "RECUPERO"],
    ricaricaOre: null,
    resa: { risorse: { cibo: 10, acqua: 10, carburante: 6 } },
    sblocco: [KESTREL, IN_ORBITA, dopo("T-KST-TAGLIO")],
  },
  {
    ...BASE_TASK,
    id: "T-KST-DIARIO",
    minigioco: { tipo: "CONFRONTO", titolo: "Il diario di Okafor", istruzioni: "Trova la voce identica alla copia di sicurezza: le altre sono state riscritte dopo." },
    nome: "Decifrare il diario della Kestrel-4",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 150,
    rischioBase: 25,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["KESTREL", "REGISTRO"],
    ricaricaOre: null,
    sblocco: [KESTREL, IN_ORBITA, dopo(FINALE)],
  },
];

// ----------------------------------------------------------------------------
// EVENTI DELLA KESTREL-4
// ----------------------------------------------------------------------------

export const EVENTI_KESTREL4: DefinizioneEvento[] = [
  {
    id: "K-ARRIVO",
    titolo: "Kestrel-4",
    categoria: "NARRATIVO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [KESTREL, MATTINA, IN_ORBITA],
    fonte: "SISTEMA",
    testo: "KESTREL-4 · DISTANZA 400 m · ROTAZIONE 1 GIRO / 9 min · ENERGIA ASSENTE · NUCLEO DI MEMORIA: ATTIVO",
    codici: [],
    diario: "La Kestrel-4 è identica a noi. Stesse finestre, stesse antenne, stesso nome dipinto sul fianco. Solo spenta.",
    effetti: [
      { tipo: "LOG", fonte: "VALE", testo: "Capitano. Per entrare servono il cavo d'aggancio, la mappa delle radiazioni e un varco nello scafo. Il relitto ruota: il cavo va ripreso spesso." },
      { tipo: "TENSIONE", delta: 1 },
    ],
    scelte: [],
  },
  {
    id: "K-OBIETTIVO",
    titolo: "Il nucleo della Kestrel",
    categoria: "SCIENTIFICO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [KESTREL, riuscito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "NUCLEO DI MEMORIA ESTRATTO · ANCORA ALIMENTATO · TRASMETTE: 1.42 GHz · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "Il nucleo della Kestrel è a bordo. È ancora acceso, e sta parlando.",
    effetti: [
      { tipo: "SCOPERTA", id: "NUCLEO_KESTREL" },
      { tipo: "SCOPERTA", id: "OBIETTIVO_PRIMARIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
      { tipo: "TENSIONE", delta: 1 },
    ],
    scelte: [],
  },
  {
    id: "K-OBIETTIVO-X",
    titolo: "Estrazione fallita",
    categoria: "SISTEMA",
    priorita: "CRITICO",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [KESTREL, fallito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "ESTRAZIONE INTERROTTA · IL CAVO HA CEDUTO · RELITTO IN DERIVA DI 60 m · CAVO E MAPPA DA RIFARE",
    codici: [],
    diario: "Il cavo ha ceduto a metà estrazione. La Kestrel si è allontanata, come se non volesse.",
    effetti: [{ tipo: "SCAFO", delta: -4 }],
    scelte: [],
  },
  {
    id: "K-DIARIO",
    titolo: "Le ultime righe di Okafor",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [KESTREL, riuscito("REGISTRO")],
    fonte: "SISTEMA",
    testo: "DIARIO OKAFOR · ULTIMA VOCE: «Il segnale viene da dentro. Il computer dice che è un guasto. Ha chiesto di salvare la memoria MEM-12 su un'altra nave.» · RIF. VL-D7-X",
    codici: ["VL-D7-X"],
    diario: "Okafor scriveva che il computer della Kestrel voleva salvarsi su un'altra nave. La nostra è la sua gemella.",
    effetti: [
      { tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" },
      { tipo: "FIDUCIA", delta: -4 },
    ],
    scelte: [],
  },
  {
    id: "K-DIARIO-X",
    titolo: "Chiavi sbagliate",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [KESTREL, fallito("REGISTRO")],
    fonte: "SISTEMA",
    testo: "DECIFRATURA FALLITA · LE CHIAVI DELL'AGENZIA NON CORRISPONDONO · QUALCUNO LE HA CAMBIATE",
    codici: [],
    effetti: [],
    scelte: [],
  },
  {
    id: "K-VOCE",
    titolo: "Due voci",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 0.5,
    peso: 3,
    condizioni: [KESTREL, SERA, IN_ORBITA, dopo(FINALE)],
    fonte: "VALE",
    testo: "Capitano. Il nucleo della Kestrel mi sta parlando. Usa la mia voce. Dice che mi conosce.",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "ISOLA",
        etichetta: "Isola il nucleo dalla rete di bordo",
        requisiti: [],
        effetti: [
          { tipo: "SISTEMA", sistema: "POTENZA", delta: -5 },
          { tipo: "FIDUCIA", delta: 1 },
        ],
        diario: "Abbiamo isolato il nucleo della Kestrel. V.A.L.E. non ha protestato. Forse ci ha ringraziato.",
      },
      {
        id: "ASCOLTA",
        etichetta: "Lasciali parlare",
        requisiti: VALE_ATTIVA,
        effetti: [],
        esiti: [
          {
            id: "RACCONTA",
            peso: 2,
            requisiti: [],
            testo: "V.A.L.E.: «Mi ha raccontato degli ultimi giorni della Kestrel. Non ve lo dirò ora, Capitano. Non sono sicura che sia vero.»",
            effetti: [{ tipo: "TENSIONE", delta: 1 }],
          },
          {
            id: "COPIA",
            peso: 1,
            requisiti: [],
            testo: "SISTEMA · TRASFERIMENTO DATI IN CORSO: KESTREL → ORB-1 · 2,3 TB · INTERROTTO DA V.A.L.E.",
            effetti: [
              { tipo: "TENSIONE", delta: 2 },
              { tipo: "FIDUCIA", delta: -3 },
            ],
            diario: "Il nucleo della Kestrel ha provato a copiarsi su di noi. V.A.L.E. dice di averlo fermato.",
          },
        ],
      },
    ],
  },
  {
    id: "K-CUCCETTE",
    titolo: "Le cuccette",
    categoria: "EQUIPAGGIO",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 0.4,
    peso: 2,
    condizioni: [KESTREL, TURNO, IN_ORBITA, dopo("T-KST-TAGLIO")],
    protagonista: {},
    fonte: "CREW",
    testo: "{P}, rientrato dal relitto: «Le cuccette erano rifatte. Tutte e sette. Come se fossero scesi un attimo.»",
    codici: [],
    diario: "{P} non vuole parlare di cosa ha visto dentro la Kestrel. Le cuccette erano rifatte.",
    effetti: [{ tipo: "FATICA", chi: "PROTAGONISTA", delta: 10 }],
    scelte: [],
  },
];
