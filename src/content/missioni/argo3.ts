/**
 * ============================================================================
 * argo3.ts — Supermissione ARGO-3: la stazione in silenzio
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * La storia: la stazione di ricerca Argo-3, in orbita attorno al gigante
 * gassoso Thule-9, è muta da quaranta giorni. L'ultima cosa che ha
 * trasmesso è un pacchetto a 1,42 GHz. Si va ad attraccare e a recuperare
 * la scatola nera. Nessuno risponde dall'interno.
 *
 * SCALETTA: sincronizza la rotazione (vale 12 h) · aggancia il faro
 *           d'attracco (24 h) · libera il boccaporto in EVA · attracca e
 *           recupera la scatola nera (solo 08:00–14:00: i pannelli
 *           d'attracco hanno energia solo in luce). Un attracco fallito
 *           fa cambiare assetto alla stazione: sincronia e faro da rifare.
 * DI CONTORNO: le scorte del magazzino, il diario del comandante (→ VL-D7-X).
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
  soloIn,
  TURNO,
  VALE_ATTIVA,
  valido,
} from "./comuni";

const ARGO = soloIn("ARGO3");
const FINALE = "T-ARGO-ATTRACCO";

export const MISSIONE_ARGO3: DefinizioneMissione = {
  id: "ARGO3",
  sigla: "ARGO",
  nome: "Argo-3",
  titolo: "Soccorso alla stazione Argo-3",
  bersaglio: { forma: "STAZIONE", luogo: "ARGO-3 · ATTRACCO", puntoInteresse: "BOCCAPORTO D'ATTRACCO" },
  durate: { andata: { min: 2, max: 3 }, orbita: { min: 3, max: 5 }, rientro: { min: 2, max: 3 } },
  scaletta: {
    passi: [
      { task: "T-ARGO-SINCRONIA", titolo: "Sincronizza la rotazione", validitaOre: 12 },
      { task: "T-ARGO-FARO", titolo: "Aggancia il faro d'attracco", validitaOre: 24 },
      { task: "T-ARGO-BOCCAPORTO", titolo: "Libera il boccaporto (EVA)", validitaOre: null },
    ],
    finale: { task: FINALE, titolo: "Attracca e recupera la scatola nera" },
  },
  obiettivi: [
    obiettivoArrivo("Raggiungi Argo-3", "Argo-3 in vista, Capitano. Nessuna luce di navigazione."),
    {
      id: "P2",
      tipo: "PRINCIPALE",
      titolo: "Recupera la scatola nera di Argo-3",
      descrizione: "Sincronizza la rotazione, aggancia il faro, libera il boccaporto. Poi attracca, tra le 8 e le 14.",
      visibile: [],
      completato: [{ tipo: "SCOPERTA", id: "SCATOLA_ARGO" }],
      ricompensa: [{ tipo: "FIDUCIA", delta: 3 }],
      testoRicompensa: "Scatola nera di Argo-3 a bordo. Obiettivo primario conseguito.",
    },
    OBIETTIVO_RIENTRO,
    {
      id: "O-MAGAZZINO",
      tipo: "SECONDARIO",
      titolo: "Recupera le scorte della stazione",
      descrizione: "Il magazzino di Argo-3 è ancora sigillato. Quello che c'è dentro non serve più a nessuno.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: FINALE }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-ARGO-MAGAZZINO" }],
      ricompensa: [{ tipo: "SISTEMA", sistema: "SUPPORTO_VITALE", delta: 10 }],
      testoRicompensa: "Filtri di ricambio di Argo-3 installati sul nostro supporto vitale.",
    },
    {
      id: "O-COMANDANTE",
      tipo: "SECONDARIO",
      titolo: "Leggi il diario del comandante",
      descrizione: "Il diario personale della comandante Ilse Varga è nella scatola nera, cifrato.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: FINALE }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-ARGO-DIARIO" }],
      ricompensa: [],
      testoRicompensa: "Diario decifrato. Le ultime pagine parlano del modulo 7.",
    },
    ...OBIETTIVI_DI_VIAGGIO,
  ],
  briefing: {
    protocollo: "ORDINE DI MISSIONE N. 0522 · RIF. ORB-1 / ARGO-3",
    scheda: [
      { etichetta: "TIPO", valore: "Soccorso · recupero dati" },
      { etichetta: "STAZIONE", valore: "Argo-3 · ricerca atmosferica, 6 persone a bordo" },
      { etichetta: "POSIZIONE", valore: "Orbita alta attorno a Thule-9" },
      { etichetta: "RISCHIO STIMATO", valore: "Moderato · stazione non cooperante" },
    ],
    contesto: [
      "Quaranta giorni fa la stazione Argo-3 ha smesso di rispondere. L'ultima trasmissione è un pacchetto di dati a 1,42 GHz, non cifrato, che nessuno a terra ha saputo leggere.",
      "La stazione ruota ancora, ma senza assetto. Dovete attraccare, entrare e recuperare la scatola nera. Se trovate sopravvissuti, la priorità cambia.",
    ],
    parti: {
      andata: "Viaggia fino a Thule-9 e raggiungi Argo-3.",
      orbita: "Sincronizza la rotazione, aggancia il faro d'attracco, libera il boccaporto in EVA, poi attracca e recupera la scatola nera (solo tra le 8 e le 14, quando la stazione è in luce).",
      rientro: "Torna a casa con la scatola nera e tutto l'equipaggio.",
    },
    obiettivoFinale: "Capire che cosa è successo su Argo-3. La scatola nera è la priorità: senza di lei, sei persone restano un mistero.",
  },
  risultato: "la scatola nera di Argo-3, con l'ultimo pacchetto a 1,42 GHz che nessuno ha ancora letto",
  dati: [
    [
      ["ROTAZIONE", "IRREGOLARE"],
      ["ENERGIA", "MINIMA"],
    ],
    [
      ["PRESSIONE", "MODULI 1–6"],
      ["SEGNI VITALI", "NESSUNO"],
    ],
    [
      ["BEACON", "SPENTO"],
      ["MODULO 7", "SIGILLATO"],
    ],
  ],
};

// ----------------------------------------------------------------------------
// TASK DI ARGO-3
// ----------------------------------------------------------------------------

export const TASK_ARGO3: DefinizioneTask[] = [
  {
    ...BASE_TASK,
    id: "T-ARGO-SINCRONIA",
    minigioco: { tipo: "MANOVRA", titolo: "Rotazione della stazione", istruzioni: "Argo-3 ruota senza assetto: resta nel corridoio d'avvicinamento mentre la stazione gira." },
    nome: "Sincronizzazione con la rotazione",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "SCIENZA",
    durataBase: 90,
    rischioBase: 35,
    luogo: "COMANDO",
    costoRisorse: { carburante: 1 },
    costoFatica: 10,
    tag: ["MANOVRA", "ARGO"],
    ricaricaOre: 12,
    sblocco: [ARGO, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-ARGO-FARO",
    minigioco: { tipo: "SINTONIA", titolo: "Faro d'attracco", istruzioni: "Il faro di Argo-3 trasmette debole: sovrapponi la tua frequenza alla sua e blocca l'aggancio." },
    nome: "Aggancio del faro d'attracco",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["ARGO", "COMUNICAZIONI"],
    ricaricaOre: 24,
    sblocco: [ARGO, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-ARGO-BOCCAPORTO",
    minigioco: { tipo: "TEMPISMO", titolo: "Chiavistelli del boccaporto", istruzioni: "Premi quando la leva è allineata al chiavistello: tre chiavistelli bloccati dal gelo." },
    nome: "Apertura del boccaporto d'attracco",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 40,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2", "KIT_RIPARAZIONE"],
    costoRisorse: { energia: 3 },
    costoFatica: 22,
    tag: ["EVA", "ARGO"],
    ricaricaOre: null, // aperto una volta, resta aperto
    sblocco: [ARGO, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: FINALE,
    minigioco: { tipo: "SEQUENZA", titolo: "Sgancio della scatola nera", istruzioni: "Ripeti la sequenza di sgancio dei morsetti: un errore e la scatola resta bloccata." },
    nome: "Attracco e recupero della scatola nera",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 180,
    rischioBase: 40,
    luogo: "AIRLOCK",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 4 },
    costoFatica: 18,
    tag: ["OBIETTIVO", "ARGO"],
    ricaricaOre: null,
    finestra: { da: 8, a: 14 },
    sblocco: [ARGO, IN_ORBITA, valido("T-ARGO-SINCRONIA", 12, FINALE), valido("T-ARGO-FARO", 24, FINALE), dopo("T-ARGO-BOCCAPORTO")],
  },
  {
    ...BASE_TASK,
    id: "T-ARGO-MAGAZZINO",
    minigioco: { tipo: "RICERCA", titolo: "Magazzino di Argo-3", istruzioni: "Trova le casse ancora sigillate prima che si esaurisca l'aria della tuta." },
    nome: "Recupero dal magazzino di Argo-3",
    categoria: "GENERALE",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "EVA",
    durataBase: 120,
    rischioBase: 20,
    luogo: "AIRLOCK",
    costoFatica: 14,
    tag: ["ARGO", "RECUPERO"],
    ricaricaOre: null,
    resa: { risorse: { cibo: 12, acqua: 12, ossigeno: 10 } },
    sblocco: [ARGO, IN_ORBITA, dopo(FINALE)],
  },
  {
    ...BASE_TASK,
    id: "T-ARGO-DIARIO",
    minigioco: { tipo: "CONFRONTO", titolo: "Diario cifrato", istruzioni: "Trova la pagina identica alla copia di sicurezza: le altre sono state riscritte." },
    nome: "Decifrare il diario della comandante",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 150,
    rischioBase: 25,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["ARGO", "REGISTRO"],
    ricaricaOre: null,
    sblocco: [ARGO, IN_ORBITA, dopo(FINALE)],
  },
];

// ----------------------------------------------------------------------------
// EVENTI DI ARGO-3
// ----------------------------------------------------------------------------

export const EVENTI_ARGO3: DefinizioneEvento[] = [
  {
    id: "A-ARRIVO",
    titolo: "Argo-3",
    categoria: "NARRATIVO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [ARGO, MATTINA, IN_ORBITA],
    fonte: "SISTEMA",
    testo: "ARGO-3 · NESSUNA RISPOSTA AI SALUTI · ROTAZIONE FUORI ASSETTO · FARO D'ATTRACCO AL 4% · BOCCAPORTO PRINCIPALE BLOCCATO",
    codici: [],
    diario: "Argo-3 è lì, a duecento metri. Ruota storta, con le luci spente. Nessuno ci ha salutati.",
    effetti: [
      { tipo: "LOG", fonte: "VALE", testo: "Capitano. Per attraccare servono rotazione sincronizzata, faro agganciato e il boccaporto liberato dall'esterno." },
    ],
    scelte: [],
  },
  {
    id: "A-OBIETTIVO",
    titolo: "La scatola nera",
    categoria: "SCIENTIFICO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [ARGO, riuscito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "ARGO-3 · SCATOLA NERA RECUPERATA · ULTIMA TRASMISSIONE IN USCITA: 1.42 GHz · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "Abbiamo la scatola nera di Argo-3. A bordo non c'era nessuno. Proprio nessuno.",
    effetti: [
      { tipo: "SCOPERTA", id: "SCATOLA_ARGO" },
      { tipo: "SCOPERTA", id: "OBIETTIVO_PRIMARIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
    ],
    scelte: [],
  },
  {
    id: "A-OBIETTIVO-X",
    titolo: "Attracco interrotto",
    categoria: "SISTEMA",
    priorita: "CRITICO",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [ARGO, fallito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "ATTRACCO INTERROTTO · ARGO-3 HA CAMBIATO ASSETTO · SINCRONIA E FARO DA RIPETERE",
    codici: [],
    diario: "L'attracco è saltato all'ultimo metro. La stazione ha cambiato assetto da sola.",
    effetti: [{ tipo: "SCAFO", delta: -4 }],
    scelte: [],
  },
  {
    id: "A-DIARIO",
    titolo: "Il diario di Ilse Varga",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [ARGO, riuscito("REGISTRO")],
    fonte: "SISTEMA",
    testo: "DIARIO VARGA · ULTIMA VOCE: «Il segnale non arriva da Thule. Parte dal modulo 7. L'assistente di bordo dice che è un guasto.» · RIF. VL-D7-X",
    codici: ["VL-D7-X"],
    diario: "Il segnale di Argo-3 partiva da dentro la stazione. E la loro AI diceva che era un guasto.",
    effetti: [
      { tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" },
      { tipo: "FIDUCIA", delta: -3 },
    ],
    scelte: [],
  },
  {
    id: "A-DIARIO-X",
    titolo: "Pagine perse",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [ARGO, fallito("REGISTRO")],
    fonte: "SISTEMA",
    testo: "DECIFRATURA FALLITA · SETTORI DEL DIARIO SOVRASCRITTI · RIPROVARE CON I DATI GREZZI",
    codici: [],
    effetti: [],
    scelte: [],
  },
  {
    id: "A-VOCE",
    titolo: "Una voce da Argo-3",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 0.3,
    peso: 3,
    condizioni: [ARGO, TURNO, IN_ORBITA],
    fonte: "CREW",
    testo: "Sul canale d'emergenza della stazione, una voce di donna: «…ORB-1… non attraccate al modulo 7…». Poi solo rumore.",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "ANALIZZA",
        etichetta: "Chiedi a V.A.L.E. di analizzarla",
        requisiti: VALE_ATTIVA,
        effetti: [],
        esiti: [
          {
            id: "ECO",
            peso: 2,
            requisiti: [],
            testo: "V.A.L.E.: «Registrazione automatica di quaranta giorni fa, Capitano. Un'eco.» I metadati confermano.",
            effetti: [{ tipo: "FIDUCIA", delta: 2 }],
          },
          {
            id: "CANCELLATA",
            peso: 1,
            requisiti: [],
            testo: "V.A.L.E.: «Nessuna voce nei registri, Capitano.» La registrazione non c'è più.",
            effetti: [
              { tipo: "TENSIONE", delta: 1 },
              { tipo: "FIDUCIA", delta: -4 },
            ],
            diario: "Abbiamo sentito tutti la voce da Argo-3. V.A.L.E. dice che non c'è mai stata.",
          },
        ],
      },
      {
        id: "IGNORA",
        etichetta: "È un'eco. Si continua",
        requisiti: [],
        effetti: [{ tipo: "FATICA", chi: "TUTTI", delta: 5 }],
      },
    ],
  },
  {
    id: "A-MOVIMENTO",
    titolo: "Movimento nel modulo 7",
    categoria: "ESPLORAZIONE",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 0.4,
    peso: 2,
    condizioni: [ARGO, TURNO, IN_ORBITA, dopo(FINALE)],
    protagonista: {},
    fonte: "SISTEMA",
    testo: "ARGO-3 · SENSORE DI MOVIMENTO · MODULO 7 · ATTIVO",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "SIGILLA",
        etichetta: "Sigilla il modulo 7 da remoto",
        requisiti: [],
        effetti: [],
        diario: "Abbiamo sigillato il modulo 7 di Argo-3 senza guardare dentro.",
      },
      {
        id: "INDAGA",
        etichetta: "{P} va a controllare",
        requisiti: [],
        effetti: [{ tipo: "FATICA", chi: "PROTAGONISTA", delta: 12 }],
        esiti: [
          { id: "DRONE", peso: 2, requisiti: [], testo: "Un drone di manutenzione, impazzito, gira in tondo. {P} lo spegne.", effetti: [] },
          {
            id: "URTO",
            peso: 1,
            requisiti: [],
            testo: "Il drone di manutenzione urta {P} e sfonda un pannello. Pressione in calo.",
            effetti: [
              { tipo: "SALUTE", chi: "PROTAGONISTA", delta: -12 },
              { tipo: "RISORSA", risorsa: "ossigeno", delta: -6 },
            ],
            diario: "Nel modulo 7 c'era solo un drone impazzito. {P} è tornato con una spalla lussata.",
          },
        ],
      },
    ],
  },
];
