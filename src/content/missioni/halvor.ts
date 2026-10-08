/**
 * ============================================================================
 * halvor.ts — Supermissione HALVOR: in formazione con la cometa
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * La storia: la cometa Halvor torna dopo 312 anni. Al passaggio precedente
 * gli astronomi annotarono un "battito" nella coda. Quest'anno il battito
 * c'è ancora, ed è a 1,42 GHz. Si vola in formazione con il nucleo e si
 * spara un penetratore per misurare cosa c'è sotto il ghiaccio.
 *
 * SCALETTA: rinforza gli scudi anti-polvere (vale 24 h) · mappa i getti di
 *           gas (12 h) · entra in formazione col nucleo (12 h) · lancia il
 *           penetratore (solo 14:00–20:00: il nucleo è tra due getti).
 *           Un lancio fallito: getti e formazione da rifare.
 * DI CONTORNO: acqua dalla coda, telemetria del penetratore (→ VL-D7-X).
 * È la missione più CORTA in orbita (2–3 giorni): la cometa non aspetta.
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

const HALVOR = soloIn("HAL");
const FINALE = "T-HAL-PENETRATORE";

export const MISSIONE_HALVOR: DefinizioneMissione = {
  id: "HAL",
  sigla: "HAL",
  nome: "Halvor",
  titolo: "Inseguimento della cometa Halvor",
  bersaglio: { forma: "COMETA", luogo: "HALVOR · FORMAZIONE", puntoInteresse: "NUCLEO" },
  durate: { andata: { min: 2, max: 4 }, orbita: { min: 2, max: 3 }, rientro: { min: 3, max: 4 } },
  scaletta: {
    passi: [
      { task: "T-HAL-SCUDI", titolo: "Rinforza gli scudi anti-polvere", validitaOre: 24 },
      { task: "T-HAL-GETTI", titolo: "Mappa i getti di gas", validitaOre: 12 },
      { task: "T-HAL-FORMAZIONE", titolo: "Entra in formazione col nucleo", validitaOre: 12 },
    ],
    finale: { task: FINALE, titolo: "Lancia il penetratore" },
  },
  obiettivi: [
    obiettivoArrivo("Raggiungi la cometa Halvor", "Halvor davanti a noi, Capitano. La coda è lunga quattro milioni di chilometri."),
    {
      id: "P2",
      tipo: "PRINCIPALE",
      titolo: "Pianta un penetratore nel nucleo",
      descrizione: "Scudi, mappa dei getti, formazione. Poi il lancio, tra le 14 e le 20.",
      visibile: [],
      completato: [{ tipo: "SCOPERTA", id: "PENETRATORE_HALVOR" }],
      ricompensa: [{ tipo: "FIDUCIA", delta: 3 }],
      testoRicompensa: "Penetratore nel nucleo, telemetria in arrivo. Obiettivo primario conseguito.",
    },
    OBIETTIVO_RIENTRO,
    {
      id: "O-CODA",
      tipo: "SECONDARIO",
      titolo: "Raccogli acqua dalla coda",
      descrizione: "La coda di Halvor è vapore e ghiaccio: basta aprire i collettori.",
      visibile: [{ tipo: "FASE", fasi: ["ORBITA", "RIENTRO"] }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-HAL-CODA" }],
      ricompensa: [{ tipo: "RISORSA", risorsa: "acqua", delta: 6 }],
      testoRicompensa: "Collettori pieni. Acqua della cometa nei serbatoi.",
    },
    {
      id: "O-TELEMETRIA",
      tipo: "SECONDARIO",
      titolo: "Decodifica la telemetria del penetratore",
      descrizione: "Il penetratore trasmette da sotto il ghiaccio. I dati arrivano sporchi.",
      visibile: [{ tipo: "TASK_COMPLETATO", task: FINALE }],
      completato: [{ tipo: "TASK_COMPLETATO", task: "T-HAL-TELEMETRIA" }],
      ricompensa: [{ tipo: "SISTEMA", sistema: "SCIENZA", delta: 8 }],
      testoRicompensa: "Telemetria pulita. C'è una cavità, sotto il ghiaccio.",
    },
    ...OBIETTIVI_DI_VIAGGIO,
  ],
  briefing: {
    protocollo: "ORDINE DI MISSIONE N. 0587 · RIF. ORB-1 / HALVOR",
    scheda: [
      { etichetta: "TIPO", valore: "Scientifica · inseguimento" },
      { etichetta: "COMETA", valore: "Halvor · periodo 312 anni, nucleo di 4 km" },
      { etichetta: "POSIZIONE", valore: "Vicino al perielio · formazione a 2 km" },
      { etichetta: "RISCHIO STIMATO", valore: "Alto · getti di gas e polvere" },
    ],
    contesto: [
      "Nel 1714 un astronomo di Uppsala scrisse che la coda di Halvor «pulsava come un cuore». Nessuno gli credette. Quest'anno i radiotelescopi hanno misurato quel battito: 1,42 GHz.",
      "Avete pochi giorni: la cometa accelera verso il Sole. Volate in formazione col nucleo e piantateci un penetratore. Serve il Drone di Ricognizione.",
    ],
    parti: {
      andata: "Viaggia fino al perielio e intercetta Halvor.",
      orbita: "Rinforza gli scudi, mappa i getti, entra in formazione, poi lancia il penetratore (solo tra le 14 e le 20, nella pausa tra due getti). Pochi giorni: la cometa non aspetta.",
      rientro: "Torna a casa prima che la polvere vi consumi gli scudi.",
    },
    obiettivoFinale: "Misurare la sorgente del battito di Halvor. Un penetratore nel nucleo, e tutti a casa.",
  },
  risultato: "la telemetria del penetratore di Halvor, che batte a 1,42 GHz da sotto il ghiaccio",
  dati: [
    [
      ["NUCLEO", "4 km"],
      ["PERIODO", "312 ANNI"],
    ],
    [
      ["GETTI ATTIVI", "7"],
      ["POLVERE", "ALTA"],
    ],
    [
      ["CODA", "4 Mkm"],
      ["BATTITO", "1.42 GHz"],
    ],
  ],
};

// ----------------------------------------------------------------------------
// TASK DI HALVOR
// ----------------------------------------------------------------------------

export const TASK_HALVOR: DefinizioneTask[] = [
  {
    ...BASE_TASK,
    id: "T-HAL-SCUDI",
    minigioco: { tipo: "TEMPISMO", titolo: "Piastre anti-polvere", istruzioni: "Fissa ogni piastra quando il foro passa sotto il rivettatore." },
    nome: "Rinforzo degli scudi anti-polvere",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "INGEGNERIA",
    equipaggiamentoRichiesto: ["KIT_RIPARAZIONE"],
    costoRisorse: { energia: 2 },
    costoFatica: 14,
    tag: ["HALVOR", "MANUTENZIONE"],
    ricaricaOre: 12,
    sblocco: [HALVOR, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-HAL-GETTI",
    minigioco: { tipo: "RADAR", titolo: "Mappa dei getti", istruzioni: "Muovi il sensore sulla superficie del nucleo e trova la zona quieta tra i getti." },
    nome: "Mappatura dei getti di gas",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    durataBase: 90,
    rischioBase: 25,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["SENSORE_PROFONDO"],
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["HALVOR", "SCANSIONE"],
    ricaricaOre: 6,
    sblocco: [HALVOR, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-HAL-FORMAZIONE",
    minigioco: { tipo: "MANOVRA", titolo: "Volo in formazione", istruzioni: "Resta nel corridoio tra i getti mentre il nucleo ruota sotto di te." },
    nome: "Volo in formazione col nucleo",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "SCIENZA",
    durataBase: 90,
    rischioBase: 40,
    luogo: "COMANDO",
    costoRisorse: { carburante: 1 },
    costoFatica: 12,
    tag: ["MANOVRA", "HALVOR"],
    ricaricaOre: 6,
    sblocco: [HALVOR, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: FINALE,
    minigioco: { tipo: "SINTONIA", titolo: "Guida del penetratore", istruzioni: "Allinea il segnale di guida a quello del nucleo: il penetratore segue la tua onda." },
    nome: "Lancio del penetratore",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 150,
    rischioBase: 40,
    luogo: "COMANDO",
    equipaggiamentoRichiesto: ["DRONE_RICOGNIZIONE"],
    costoRisorse: { energia: 4 },
    costoFatica: 14,
    tag: ["OBIETTIVO", "HALVOR"],
    ricaricaOre: null,
    finestra: { da: 14, a: 20 },
    sblocco: [HALVOR, IN_ORBITA, valido("T-HAL-SCUDI", 24, FINALE), valido("T-HAL-GETTI", 12, FINALE), valido("T-HAL-FORMAZIONE", 12, FINALE)],
  },
  {
    ...BASE_TASK,
    id: "T-HAL-CODA",
    minigioco: { tipo: "PRESSIONE", titolo: "Collettori della coda", istruzioni: "Tieni la pressione dei collettori nella fascia verde mentre il vapore entra." },
    nome: "Raccolta di acqua dalla coda",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 90,
    rischioBase: 20,
    luogo: "SUPPORTO_VITALE",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["HALVOR", "ACQUA"],
    ricaricaOre: 24,
    resa: { risorse: { acqua: 14, ossigeno: 8 } },
    sblocco: [HALVOR, IN_ORBITA],
  },
  {
    ...BASE_TASK,
    id: "T-HAL-TELEMETRIA",
    minigioco: { tipo: "CONFRONTO", titolo: "Pacchetti del penetratore", istruzioni: "Trova il pacchetto identico al riferimento: gli altri sono stati alterati dal rumore." },
    nome: "Decodifica della telemetria",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    durataBase: 120,
    rischioBase: 25,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["HALVOR", "TELEMETRIA"],
    ricaricaOre: null,
    sblocco: [HALVOR, IN_ORBITA, dopo(FINALE)],
  },
];

// ----------------------------------------------------------------------------
// EVENTI DI HALVOR
// ----------------------------------------------------------------------------

export const EVENTI_HALVOR: DefinizioneEvento[] = [
  {
    id: "C-ARRIVO",
    titolo: "Halvor",
    categoria: "NARRATIVO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HALVOR, MATTINA, IN_ORBITA],
    fonte: "SISTEMA",
    testo: "HALVOR · FORMAZIONE A 2 km DAL NUCLEO · 7 GETTI ATTIVI · POLVERE SUGLI SCUDI: 3 IMPATTI/MIN",
    codici: [],
    diario: "Halvor è un sasso di ghiaccio sporco che sputa gas da sette ferite. La coda copre metà del cielo.",
    effetti: [
      { tipo: "LOG", fonte: "VALE", testo: "Capitano. Per il lancio servono scudi rinforzati, la mappa dei getti e la formazione stabile. I getti cambiano in fretta: le mappe scadono." },
    ],
    scelte: [],
  },
  {
    id: "C-OBIETTIVO",
    titolo: "Il penetratore è dentro",
    categoria: "SCIENTIFICO",
    priorita: "CRITICO",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HALVOR, riuscito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "PENETRATORE A 41 m DI PROFONDITÀ · PRIMA TELEMETRIA · PORTANTE: 1.42 GHz · PROTOCOLLO VL-P7-04",
    codici: ["VL-P7-04"],
    diario: "Il penetratore è nel nucleo. Il battito di Halvor ora lo sentiamo da dentro.",
    effetti: [
      { tipo: "SCOPERTA", id: "PENETRATORE_HALVOR" },
      { tipo: "SCOPERTA", id: "OBIETTIVO_PRIMARIO" },
      { tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" },
    ],
    scelte: [],
  },
  {
    id: "C-OBIETTIVO-X",
    titolo: "Penetratore deviato",
    categoria: "SISTEMA",
    priorita: "CRITICO",
    unaVolta: false,
    probabilita: 1,
    peso: 1,
    condizioni: [HALVOR, fallito("OBIETTIVO")],
    fonte: "SISTEMA",
    testo: "PENETRATORE DEVIATO DA UN GETTO · PERSO · RIPETERE MAPPA DEI GETTI E FORMAZIONE",
    codici: [],
    diario: "Un getto ha spazzato via il penetratore. Ne resta uno di riserva.",
    effetti: [{ tipo: "SCAFO", delta: -3 }],
    scelte: [],
  },
  {
    id: "C-TELEMETRIA",
    titolo: "La cavità",
    categoria: "VALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 1,
    peso: 1,
    condizioni: [HALVOR, riuscito("TELEMETRIA")],
    fonte: "SISTEMA",
    testo: "TELEMETRIA · CAVITÀ SFERICA A 60 m · PARETI LISCE · EMISSIONE DAL CENTRO · STESSA FIRMA DEL NOSTRO NUCLEO V.A.L.E. · RIF. VL-D7-X",
    codici: ["VL-D7-X"],
    diario: "Nel cuore di Halvor c'è una cavità. Quello che trasmette ha la stessa firma della nostra V.A.L.E.",
    effetti: [
      { tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" },
      { tipo: "FIDUCIA", delta: -3 },
      { tipo: "TENSIONE", delta: 1 },
    ],
    scelte: [],
  },
  {
    id: "C-GETTO",
    titolo: "Getto improvviso",
    categoria: "AMBIENTALE",
    priorita: "IMPORTANTE",
    unaVolta: false,
    probabilita: 0.3,
    peso: 3,
    condizioni: [HALVOR, TURNO, IN_ORBITA, nonDiRecente("C-GETTO", 24)],
    fonte: "VALE",
    testo: "Capitano. Un getto nuovo si sta aprendo sotto di noi. Dieci secondi.",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "SCARTA",
        etichetta: "Scarta subito",
        requisiti: [],
        effetti: [
          { tipo: "RISORSA", risorsa: "carburante", delta: -2 },
          { tipo: "FATICA", chi: "TUTTI", delta: 4 },
        ],
      },
      {
        id: "SCUDI",
        etichetta: "Tieni la posizione, scudi in avanti",
        requisiti: [],
        effetti: [],
        esiti: [
          { id: "TENGONO", peso: 2, requisiti: [], testo: "Gli scudi assorbono la raffica. Un concerto di grandine sullo scafo, poi silenzio.", effetti: [{ tipo: "SCAFO", delta: -3 }] },
          {
            id: "FALLA",
            peso: 1,
            requisiti: [],
            testo: "SCAFO · MICROFALLA NEL VANO SENSORI · SCIENZA −12%",
            effetti: [
              { tipo: "SCAFO", delta: -8 },
              { tipo: "SISTEMA", sistema: "SCIENZA", delta: -12 },
            ],
            diario: "Il getto ci ha bucato il vano sensori. Halvor non ama essere osservata.",
          },
        ],
      },
    ],
  },
  {
    id: "C-CODA",
    titolo: "Dentro la coda",
    categoria: "NARRATIVO",
    priorita: "SFONDO",
    unaVolta: true,
    probabilita: 0.35,
    peso: 1,
    condizioni: [HALVOR, TURNO, IN_ORBITA],
    protagonista: {},
    fonte: "CREW",
    testo: "{P} guarda dall'oblò la coda illuminata dal Sole. «Trecento anni per tornare qui. E noi ci siamo.»",
    codici: [],
    diario: "{P} è rimasto un'ora all'oblò a guardare la coda. Nessuno ha avuto il coraggio di chiamarlo.",
    effetti: [{ tipo: "FATICA", chi: "PROTAGONISTA", delta: -8 }],
    scelte: [],
  },
];
