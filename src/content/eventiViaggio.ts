/**
 * ============================================================================
 * eventiViaggio.ts — Gli imprevisti di viaggio, comuni a tutte le missioni
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6 (v3.7), §14.7 (v3.8).
 *
 * Fino alla v3.7 si chiamava eventiMissione.ts e conteneva anche gli eventi
 * della scaletta di E-17 (M-…): dalla v3.8 stanno in content/missioni/e17.ts,
 * accanto a quelli delle altre supermissioni.
 *
 *   VG…   gli IMPREVISTI DI VIAGGIO: compaiono ai cambi turno solo durante
 *         l'andata o il rientro, quando la nave è sola nello spazio
 *         profondo e la sopravvivenza è tutto.
 * ============================================================================
 */

import type { Condizione, DefinizioneEvento } from "../engine/types";

const TURNO: Condizione = { tipo: "MOMENTO", momento: "TURNO" };
const IN_VIAGGIO: Condizione = { tipo: "FASE", fasi: ["ANDATA", "RIENTRO"] };
/** Non di nuovo entro `ore` ore (per gli imprevisti che possono ripetersi). */
const nonDiRecente = (id: string, ore: number): Condizione => ({ tipo: "NON", condizione: { tipo: "EVENTO_RECENTE", id, ore } });

export const EVENTI_VIAGGIO: DefinizioneEvento[] = [
  // ==========================================================================
  // IMPREVISTI DI VIAGGIO (andata e rientro)
  // ==========================================================================
  {
    id: "VG1",
    titolo: "Sbalzo di potenza",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: false,
    probabilita: 0.12,
    peso: 2,
    condizioni: [TURNO, IN_VIAGGIO, nonDiRecente("VG1", 48)],
    fonte: "SISTEMA",
    testo: "PWR · SBALZO SUL BUS PRINCIPALE · REGOLATORE 2 IN PROTEZIONE",
    codici: [],
    effetti: [{ tipo: "SISTEMA", sistema: "POTENZA", delta: -12 }],
    scelte: [
      {
        id: "DEVIA",
        etichetta: "Devia l'energia dei laboratori sul bus",
        requisiti: [],
        effetti: [{ tipo: "RISORSA", risorsa: "energia", delta: -6 }, { tipo: "SISTEMA", sistema: "POTENZA", delta: 8 }],
      },
      { id: "DOPO", etichetta: "Si ripara con la prossima diagnostica", requisiti: [], effetti: [] },
    ],
  },
  {
    id: "VG2",
    titolo: "Il carico si è spostato",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 0.12,
    peso: 2,
    condizioni: [TURNO, IN_VIAGGIO],
    protagonista: {},
    fonte: "SISTEMA",
    testo: "STOCCAGGIO · CASSA D'ACQUA SGANCIATA · PERDITA IN CORSO",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "FISSA",
        etichetta: "{P} va a fissarla",
        requisiti: [],
        effetti: [{ tipo: "FATICA", chi: "PROTAGONISTA", delta: 15 }, { tipo: "RISORSA", risorsa: "acqua", delta: -2 }],
        esiti: [
          { id: "SALVATA", peso: 3, requisiti: [], testo: "{P} blocca la cassa con le cinghie. Perso poco.", effetti: [] },
          {
            id: "FERITO",
            peso: 1,
            requisiti: [],
            testo: "La cassa scivola e schiaccia una mano a {P}.",
            effetti: [{ tipo: "SALUTE", chi: "PROTAGONISTA", delta: -15 }],
            diario: "{P} si è ferito nella stiva per salvare una cassa d'acqua.",
          },
        ],
      },
      {
        id: "LASCIA",
        etichetta: "Lasciala perdere",
        requisiti: [],
        effetti: [{ tipo: "RISORSA", risorsa: "acqua", delta: -10 }],
        diario: "Abbiamo lasciato andare una cassa d'acqua. Ce ne pentiremo.",
      },
    ],
  },
  {
    id: "VG3",
    titolo: "Tempesta di particelle",
    categoria: "AMBIENTALE",
    priorita: "IMPORTANTE",
    unaVolta: true,
    probabilita: 0.1,
    peso: 2,
    condizioni: [TURNO, IN_VIAGGIO],
    fonte: "VALE",
    testo: "Capitano. Una tempesta di protoni attraversa la rotta per sei ore. Consiglio il rifugio schermato.",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "RIFUGIO",
        etichetta: "Tutti nel rifugio schermato",
        requisiti: [],
        effetti: [{ tipo: "FATICA", chi: "TUTTI", delta: 10 }],
        diario: "Sei ore stretti nel rifugio, ad ascoltare i contatori.",
      },
      {
        id: "LAVORA",
        etichetta: "Si continua a lavorare",
        requisiti: [],
        effetti: [],
        esiti: [
          { id: "LIEVE", peso: 2, requisiti: [], testo: "DOSIMETRI · ESPOSIZIONE ENTRO I LIMITI", effetti: [] },
          {
            id: "DOSE",
            peso: 2,
            requisiti: [],
            testo: "DOSIMETRI · ESPOSIZIONE OLTRE SOGLIA · TUTTA LA CREW",
            effetti: [{ tipo: "SALUTE", chi: "TUTTI", delta: -12 }],
            diario: "La tempesta ci ha presi in pieno. Nausea e mal di testa per tutti.",
          },
        ],
      },
    ],
  },
  {
    id: "VG4",
    titolo: "Deriva di rotta",
    categoria: "SISTEMA",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 0.15,
    peso: 2,
    condizioni: [TURNO, { tipo: "FASE", fasi: ["ANDATA"] }],
    fonte: "VALE",
    testo: "Capitano. La rotta devia di 0,2°. Se non correggiamo ora, l'inserimento in orbita costerà più carburante.",
    codici: [],
    effetti: [],
    scelte: [
      { id: "CORREGGI", etichetta: "Correggi subito", requisiti: [], effetti: [{ tipo: "RISORSA", risorsa: "carburante", delta: -1 }] },
      {
        id: "VALE",
        etichetta: "Lascia la correzione a V.A.L.E.",
        requisiti: [],
        effetti: [],
        esiti: [
          { id: "BENE", peso: 2, requisiti: [], testo: "V.A.L.E.: «Correzione completata. Consumo ottimale.»", effetti: [{ tipo: "FIDUCIA", delta: 2 }] },
          {
            id: "SPRECO",
            peso: 1,
            requisiti: [],
            testo: "NAV · CORREZIONE ESEGUITA · CONSUMO 3× IL PREVISTO · MOTIVO: NON SPECIFICATO",
            effetti: [{ tipo: "RISORSA", risorsa: "carburante", delta: -3 }, { tipo: "TENSIONE", delta: 1 }],
            diario: "V.A.L.E. ha bruciato tre volte il carburante previsto per una correzione da nulla.",
          },
        ],
      },
      { id: "ASPETTA", etichetta: "Correggeremo all'arrivo", requisiti: [], effetti: [{ tipo: "RISORSA", risorsa: "carburante", delta: -2 }] },
    ],
  },
  {
    id: "VG5",
    titolo: "Silenzio radio",
    categoria: "EQUIPAGGIO",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 0.15,
    peso: 2,
    condizioni: [TURNO, { tipo: "FASE", fasi: ["RIENTRO"] }],
    fonte: "CREW",
    testo: "«Trenta ore senza un segnale dalla Terra. Qualcuno comincia a chiedersi se ci aspettano ancora.»",
    codici: [],
    effetti: [],
    scelte: [
      {
        id: "CENA",
        etichetta: "Organizza una cena tutti insieme",
        requisiti: [{ tipo: "NON", condizione: { tipo: "RISORSA_SOTTO", risorsa: "cibo", valore: 4 } }],
        effetti: [{ tipo: "RISORSA", risorsa: "cibo", delta: -4 }, { tipo: "FATICA", chi: "TUTTI", delta: -12 }],
        diario: "Stasera abbiamo cenato tutti insieme. Per un'ora casa è sembrata vicina.",
      },
      {
        id: "VALE",
        etichetta: "Chiedi a V.A.L.E. di riprovare il contatto",
        requisiti: [{ tipo: "NON", condizione: { tipo: "OVERRIDE" } }],
        effetti: [],
        esiti: [
          { id: "CONTATTO", peso: 2, requisiti: [], testo: "Una voce dalla Terra, disturbata: «ORB-1, vi riceviamo. Bentornati presto.»", effetti: [{ tipo: "FIDUCIA", delta: 3 }] },
          {
            id: "NIENTE",
            peso: 1,
            requisiti: [],
            testo: "V.A.L.E.: «Nessuna risposta, Capitano.» Il registro mostra che non ha trasmesso nulla.",
            effetti: [{ tipo: "FIDUCIA", delta: -4 }, { tipo: "TENSIONE", delta: 1 }],
            diario: "V.A.L.E. ha detto di aver chiamato la Terra. Il registro dice di no.",
          },
        ],
      },
    ],
  },
];
