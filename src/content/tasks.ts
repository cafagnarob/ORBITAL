/**
 * ============================================================================
 * tasks.ts — Catalogo dei task di ORBITAL (v3.3: progressione)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9, §9.1.
 *
 * LA PROGRESSIONE (v3.3)
 * I task non sono più tutti disponibili dal primo minuto. Ognuno dice:
 *   - SBLOCCO     quando compare (lista di condizioni, lo stesso linguaggio
 *                 degli eventi):
 *                   · per GIORNO        dalGiorno(3)
 *                   · a CATENA          dopo(T-SCANSIONE-CRATERE)
 *                   · da un EVENTO      dopoEvento("V05", "AGGANCIA", 18)
 *                   · da una SCOPERTA   scoperteRichieste
 *                   · dall'ATTREZZATURA moduliRichiesti / equipaggiamentoRichiesto
 *   - RICARICA    dopo un completamento, quante ore prima che torni (null =
 *                 una volta sola, 0 = routine sempre disponibile);
 *   - RESA        cosa produce se riesce (risorse, riparazioni, cure).
 *   - MINIGIOCO   (v3.6) come il Capitano può aiutare: la meccanica (RADAR,
 *                 SINTONIA…) con titolo e istruzioni adatti al lavoro.
 *
 * I task "temporanei" (meteorite, relitto, soccorso...) si aprono con un
 * evento dei turni (content/eventiTurno.ts) e restano disponibili poche ore:
 * se nessuno li fa in tempo, l'occasione è persa.
 *
 * TAG: gli eventi reagiscono alla fine dei task con un certo tag (es. la
 * catena del Segnale ascolta SCANSIONE e SEGNALE). I tag dei task storici
 * NON vanno cambiati senza controllare gli eventi che li usano.
 *
 * NUMERI [PROVVISORIO]: si tarano giocando.
 * ============================================================================
 */

import type { Condizione, DefinizioneTask, IdDefinizioneTask, IdEvento } from "../engine/types";
import { TASK_MISSIONI } from "./missioni";

// --- Piccoli aiuti per leggere meglio le condizioni di sblocco --------------
const dalGiorno = (giorno: number): Condizione => ({ tipo: "GIORNO_ALMENO", giorno });
const dopo = (task: IdDefinizioneTask, volte = 1): Condizione => ({ tipo: "TASK_COMPLETATO", task, volte });
/** Aperto da un evento dei turni, per `ore` ore (eventualmente solo con una certa scelta). */
const dopoEvento = (id: IdEvento, scelta: string | undefined, ore: number): Condizione =>
  scelta === undefined ? { tipo: "EVENTO_RECENTE", id, ore } : { tipo: "EVENTO_RECENTE", id, scelta, ore };

/** Solo vicino al bersaglio (fase ORBITA): durante i viaggi non si può. */
const IN_ORBITA: Condizione = { tipo: "FASE", fasi: ["ORBITA"] };

/**
 * Valori di default: ogni task li sovrascrive dove serve. Lo "spread"
 * (`...BASE`) copia questi campi nell'oggetto; quelli scritti dopo vincono.
 */
const BASE = {
  abilitaSecondaria: null,
  supportoAmmesso: true,
  equipaggiamentoRichiesto: [],
  moduliRichiesti: [],
  scoperteRichieste: [],
  costoRisorse: {},
  sblocco: [],
} satisfies Partial<DefinizioneTask>;

const LISTA_TASK: DefinizioneTask[] = [
  // ==========================================================================
  // DAL PRIMO GIORNO: la routine di bordo
  // ==========================================================================
  {
    ...BASE,
    id: "T-DIAGNOSTICA",
    minigioco: { tipo: "SEQUENZA", titolo: "Sequenza diagnostica", istruzioni: "Memorizza l'ordine dei test dei moduli e ripetilo." },
    nome: "Diagnostica dei sistemi",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "INGEGNERIA",
    costoRisorse: { energia: 2 },
    costoFatica: 10,
    tag: ["DIAGNOSTICA"],
    ricaricaOre: 24,
    resa: { sistema: { id: "POTENZA", delta: 4 } },
  },
  {
    ...BASE,
    id: "T-MANUTENZIONE-SV",
    minigioco: { tipo: "PRESSIONE", titolo: "Pressione del circuito", istruzioni: "Tieni la pressione dell'impianto nella fascia verde mentre si sostituiscono i filtri." },
    nome: "Manutenzione del supporto vitale",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 100,
    rischioBase: 20,
    luogo: "SUPPORTO_VITALE",
    equipaggiamentoRichiesto: ["KIT_RIPARAZIONE"],
    costoRisorse: { energia: 1 },
    costoFatica: 10,
    tag: ["MANUTENZIONE", "SUPPORTO_VITALE"],
    ricaricaOre: 24,
    resa: { sistema: { id: "SUPPORTO_VITALE", delta: 10 } },
  },
  {
    ...BASE,
    id: "T-CORREZIONE-ORBITA",
    minigioco: { tipo: "MANOVRA", titolo: "Finestra di accensione", istruzioni: "Con i propulsori laterali tieni la nave dentro il corridoio di traiettoria." },
    nome: "Correzione di traiettoria",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    supportoAmmesso: false,
    durataBase: 45,
    rischioBase: 35,
    luogo: "COMANDO",
    costoRisorse: { carburante: 1 }, // v3.7: piccole correzioni, da ripetere (la traiettoria «scade»)
    costoFatica: 8,
    tag: ["MANOVRA"],
    ricaricaOre: 12,
    resa: { sistema: { id: "NAVIGAZIONE", delta: 6 } },
  },
  {
    ...BASE,
    id: "T-ISPEZIONE-ESTERNA",
    minigioco: { tipo: "RADAR", titolo: "Trova la crepa", istruzioni: "Passa il rilevatore sullo scafo: dove il segnale sale c'è la microfrattura." },
    nome: "Ispezione esterna dello scafo",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 90,
    rischioBase: 40,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 3 },
    costoFatica: 20,
    tag: ["EVA", "SCAFO"],
    ricaricaOre: 36,
    resa: { scafo: 6 },
  },
  {
    ...BASE,
    id: "T-INVENTARIO",
    minigioco: { tipo: "RICERCA", titolo: "Conta le casse", istruzioni: "Trova nella stiva le casse con i codici richiesti prima che scada il tempo." },
    nome: "Inventario della stiva",
    categoria: "GENERALE",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 60,
    rischioBase: 10,
    luogo: "STOCCAGGIO",
    costoFatica: 6,
    tag: ["INVENTARIO"],
    ricaricaOre: 48,
    // Contando bene si trova sempre qualcosa che si credeva perso.
    resa: { risorse: { cibo: 2, acqua: 2 } },
  },
  {
    ...BASE,
    id: "T-VISITA-MEDICA",
    minigioco: { tipo: "CONFRONTO", titolo: "Tracciati vitali", istruzioni: "Riconosci il tracciato identico a quello di riferimento: gli altri nascondono un'anomalia." },
    nome: "Controllo medico della crew",
    categoria: "MEDICINA",
    abilitaPrincipale: "MEDICINA",
    durataBase: 60,
    rischioBase: 10,
    luogo: "INFERMERIA",
    costoRisorse: { energia: 1 },
    costoFatica: 6,
    tag: ["MEDICINA"],
    ricaricaOre: 24,
    resa: { cure: 10 },
  },
  {
    ...BASE,
    id: "T-PAUSA",
    minigioco: { tipo: "TEMPISMO", titolo: "Respira a tempo", istruzioni: "Premi quando l'indicatore entra nella fascia del respiro: tre respiri lenti." },
    nome: "Pausa in habitat",
    categoria: "GENERALE",
    abilitaPrincipale: "MEDICINA",
    supportoAmmesso: false,
    durataBase: 60,
    rischioBase: 0,
    luogo: "HABITAT",
    costoFatica: -20, // negativa: riposare RIDUCE la fatica
    tag: ["RIPOSO"],
    ricaricaOre: 0, // routine: ognuno può fare la sua pausa
  },
  {
    ...BASE,
    id: "T-PANNELLI",
    minigioco: { tipo: "SINTONIA", titolo: "Angolo dei pannelli", istruzioni: "Ruota i pannelli finché la curva di potenza coincide con quella del picco." },
    nome: "Orientamento dei pannelli solari",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 90,
    rischioBase: 20,
    luogo: "INGEGNERIA",
    costoFatica: 8,
    tag: ["ENERGIA"],
    ricaricaOre: 24,
    resa: { risorse: { energia: 8 } },
  },
  {
    ...BASE,
    id: "T-RICICLO-ACQUA",
    minigioco: { tipo: "PRESSIONE", titolo: "Ciclo di filtraggio", istruzioni: "Regola la valvola: troppa pressione rompe le membrane, troppo poca non filtra." },
    nome: "Ciclo di recupero dell'acqua",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 120,
    rischioBase: 15,
    luogo: "SUPPORTO_VITALE",
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["ACQUA"],
    ricaricaOre: 24,
    // v3.9: la fonte d'acqua principale del viaggio (era 6).
    resa: { risorse: { acqua: 10 } },
  },

  // ==========================================================================
  // A CATENA E PER GIORNO: la missione si apre
  // ==========================================================================
  {
    ...BASE,
    id: "T-ANALISI-SEGNALE",
    minigioco: { tipo: "SINTONIA", titolo: "Sintonizza il segnale", istruzioni: "Sposta la frequenza finché la tua onda si sovrappone a quella ricevuta." },
    nome: "Analisi del segnale",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 180,
    rischioBase: 20,
    luogo: "LABORATORIO",
    moduliRichiesti: ["LABORATORIO_AVANZATO"], // l'analisi si fa nel laboratorio di bordo
    scoperteRichieste: ["SEGNALE_RILEVATO"], // si analizza solo ciò che si è rilevato
    costoRisorse: { energia: 3 },
    costoFatica: 15,
    tag: ["SEGNALE"],
    ricaricaOre: 24,
  },
  {
    ...BASE,
    id: "T-ELETTROLISI",
    minigioco: { tipo: "PRESSIONE", titolo: "Cella elettrolitica", istruzioni: "Mantieni la pressione dell'idrogeno nella fascia sicura." },
    nome: "Elettrolisi d'emergenza",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 25,
    luogo: "SUPPORTO_VITALE",
    costoRisorse: { energia: 4, acqua: 3 },
    costoFatica: 10,
    tag: ["OSSIGENO"],
    ricaricaOre: 24,
    resa: { risorse: { ossigeno: 12 } }, // v3.9: era 10
    // Si sa farla solo dopo aver messo le mani nel supporto vitale.
    sblocco: [dopo("T-MANUTENZIONE-SV")],
  },
  {
    ...BASE,
    id: "T-COLTURA",
    minigioco: { tipo: "CONFRONTO", titolo: "Campioni sani", istruzioni: "Trova la coltura con lo stesso spettro di quella sana." },
    nome: "Coltura idroponica",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 150,
    rischioBase: 15,
    luogo: "HABITAT",
    costoRisorse: { acqua: 2, energia: 1 },
    costoFatica: 8,
    tag: ["CIBO"],
    ricaricaOre: 24,
    resa: { risorse: { cibo: 9 } }, // v3.9: era 6
    sblocco: [dalGiorno(2)],
  },
  {
    ...BASE,
    id: "T-RAZIONAMENTO",
    minigioco: { tipo: "RICERCA", titolo: "Lotti in scadenza", istruzioni: "Trova i lotti da consumare per primi prima che scada il tempo." },
    nome: "Piano di razionamento",
    categoria: "MEDICINA",
    abilitaPrincipale: "MEDICINA",
    durataBase: 90,
    rischioBase: 10,
    luogo: "HABITAT",
    costoFatica: 6,
    tag: ["CIBO"],
    ricaricaOre: null, // si scrive una volta: poi è il piano
    resa: { risorse: { cibo: 5, acqua: 5 } },
    sblocco: [dopo("T-INVENTARIO")],
  },
  {
    ...BASE,
    id: "T-RICALIBRAZIONE",
    minigioco: { tipo: "SINTONIA", titolo: "Taratura dei sensori", istruzioni: "Allinea la risposta del sensore alla curva campione." },
    nome: "Calibrazione dei sensori",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 90,
    rischioBase: 20,
    luogo: "COMANDO",
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["CALIBRAZIONE"],
    ricaricaOre: 12, // v3.7: la calibrazione «scade» (24 h) e va rifatta
    resa: { sistema: { id: "SCIENZA", delta: 10 } },
    sblocco: [], // v3.7: fa parte della scaletta della missione
  },
  {
    ...BASE,
    id: "T-CONTATTO-TERRA",
    minigioco: { tipo: "SINTONIA", titolo: "Finestra di contatto", istruzioni: "Sintonizza l'antenna sulla portante della Terra prima che la finestra si chiuda." },
    nome: "Finestra di contatto con la Terra",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "SCIENZA",
    durataBase: 60,
    rischioBase: 15,
    luogo: "COMANDO",
    costoRisorse: { energia: 3 },
    costoFatica: 5,
    tag: ["COMUNICAZIONI"],
    ricaricaOre: 48,
    resa: { sistema: { id: "COMUNICAZIONI", delta: 8 } },
    sblocco: [dalGiorno(2)],
  },
  {
    ...BASE,
    id: "T-ESERCITAZIONE-EVA",
    minigioco: { tipo: "TEMPISMO", titolo: "Agganci di sicurezza", istruzioni: "Aggancia il moschettone quando il punto d'ancoraggio passa nella zona." },
    nome: "Esercitazione in airlock",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    durataBase: 60,
    rischioBase: 15,
    luogo: "AIRLOCK",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoFatica: 12,
    tag: ["ADDESTRAMENTO"],
    ricaricaOre: 48,
    resa: { sistema: { id: "OPERAZIONI_ESTERNE", delta: 8 } },
    sblocco: [dalGiorno(2)],
  },
  {
    ...BASE,
    id: "T-RIPARAZIONE-SCAFO",
    minigioco: { tipo: "TEMPISMO", titolo: "Saldatura", istruzioni: "Premi quando la torcia è sulla fessura: tre punti di saldatura." },
    nome: "Riparazione dello scafo",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 40,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 3 },
    costoFatica: 22,
    tag: ["EVA", "RIPARAZIONE"],
    ricaricaOre: 48,
    resa: { scafo: 15 },
    // Si ripara ciò che si è visto: prima l'ispezione.
    sblocco: [dopo("T-ISPEZIONE-ESTERNA")],
  },
  {
    ...BASE,
    id: "T-MANUTENZIONE-PROPULSORI",
    minigioco: { tipo: "SEQUENZA", titolo: "Sequenza di accensione", istruzioni: "Ripeti la sequenza di prova degli ugelli nell'ordine giusto." },
    nome: "Manutenzione dei propulsori",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "PILOTAGGIO",
    durataBase: 120,
    rischioBase: 30,
    luogo: "PROPULSIONE",
    costoRisorse: { energia: 2 },
    costoFatica: 12,
    tag: ["MANUTENZIONE", "PROPULSIONE"],
    ricaricaOre: 48,
    resa: { sistema: { id: "PROPULSIONE", delta: 10 } },
    sblocco: [dalGiorno(3)],
  },
  {
    ...BASE,
    id: "T-RICICLO-POTENZIATO",
    minigioco: { tipo: "PRESSIONE", titolo: "Osmosi inversa", istruzioni: "Tieni la pressione delle membrane nella fascia verde." },
    bonus: true,
    nome: "Riciclo idrico potenziato",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 15,
    luogo: "SUPPORTO_VITALE",
    moduliRichiesti: ["POTENZIAMENTO_RICICLO_ACQUA"],
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["ACQUA"],
    ricaricaOre: 24,
    resa: { risorse: { acqua: 10 } },
    sblocco: [dopo("T-RICICLO-ACQUA")],
  },
  {
    ...BASE,
    id: "T-RACCOLTA-DETRITI",
    minigioco: { tipo: "MANOVRA", titolo: "Raccolta dei detriti", istruzioni: "Segui la scia dei detriti restando nel corridoio di raccolta." },
    bonus: true,
    nome: "Raccolta di detriti orbitali",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 180,
    rischioBase: 35,
    luogo: "COMANDO",
    moduliRichiesti: ["MODULO_MINERARIO"],
    costoRisorse: { energia: 3 },
    costoFatica: 12,
    tag: ["MINERARIO"],
    ricaricaOre: 48,
    // Dai detriti metallici si ricava propellente per i motori ionici.
    resa: { risorse: { carburante: 4 } },
    sblocco: [IN_ORBITA, dalGiorno(3)],
  },
  {
    ...BASE,
    id: "T-SONDAGGIO-PROFONDO",
    minigioco: { tipo: "RADAR", titolo: "Sorgente profonda", istruzioni: "Muovi lo scanner profondo e aggancia l'origine dell'eco." },
    bonus: true,
    nome: "Sondaggio profondo della sorgente",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 180,
    rischioBase: 30,
    luogo: "LABORATORIO",
    moduliRichiesti: ["SCANNER_SPAZIALE_PROFONDO"],
    costoRisorse: { energia: 5 },
    costoFatica: 14,
    tag: ["SEGNALE", "SONDAGGIO"],
    ricaricaOre: 48,
    sblocco: [IN_ORBITA, dopo("T-ANALISI-SEGNALE")],
  },
  {
    ...BASE,
    id: "T-ANALISI-CAMPIONI",
    minigioco: { tipo: "CONFRONTO", titolo: "Spettrometria", istruzioni: "Trova il campione con lo stesso spettro di quello di riferimento." },
    bonus: true,
    nome: "Analisi dei campioni raccolti",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    durataBase: 120,
    rischioBase: 15,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["CONTENITORE_CAMPIONI"],
    costoRisorse: { energia: 2 },
    costoFatica: 8,
    tag: ["CAMPIONI"],
    ricaricaOre: 24,
    resa: { sistema: { id: "SCIENZA", delta: 6 } },
    // I campioni arrivano dal drone, dal meteorite o dal relitto.
    sblocco: [
      {
        tipo: "UNO_TRA",
        condizioni: [dopo("T-RICOGNIZIONE-DRONE"), dopo("T-ESPLORA-METEORITE"), dopo("T-RECUPERO-RELITTO")],
      },
    ],
  },

  // ==========================================================================
  // TEMPORANEI: aperti da un evento dei turni, per poche ore
  // ==========================================================================
  {
    ...BASE,
    id: "T-ESPLORA-METEORITE",
    minigioco: { tipo: "RADAR", titolo: "Trova la vena", istruzioni: "Passa il rilevatore sulla roccia e aggancia la vena più ricca." },
    bonus: true,
    nome: "Esplorazione del meteorite",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 180,
    rischioBase: 45,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 3 },
    costoFatica: 22,
    tag: ["EVA", "METEORITE"],
    ricaricaOre: null,
    resa: { risorse: { acqua: 6 } }, // ghiaccio nelle fratture; il resto lo decide l'evento
    sblocco: [dopoEvento("V05", "AGGANCIA", 18)],
  },
  {
    ...BASE,
    id: "T-RECUPERO-RELITTO",
    minigioco: { tipo: "RICERCA", titolo: "Inventario del relitto", istruzioni: "Nella stiva del relitto trova le casse ancora integre prima che finisca l'ossigeno della tuta." },
    bonus: true,
    nome: "Recupero dal relitto",
    categoria: "EVA",
    abilitaPrincipale: "EVA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 180,
    rischioBase: 40,
    luogo: "ESTERNO_NAVE",
    equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
    costoRisorse: { energia: 2 },
    costoFatica: 20,
    tag: ["EVA", "RELITTO"],
    ricaricaOre: null,
    sblocco: [dopoEvento("V06", "AVVICINATI", 24)],
  },
  {
    ...BASE,
    id: "T-RACCOLTA-GHIACCIO",
    minigioco: { tipo: "MANOVRA", titolo: "Nella coda della cometa", istruzioni: "Resta nel corridoio della coda: fuori, i frammenti colpiscono lo scafo." },
    nome: "Raccolta di ghiaccio cometario",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "EVA",
    durataBase: 120,
    rischioBase: 30,
    luogo: "COMANDO",
    costoRisorse: { carburante: 1 },
    costoFatica: 10,
    tag: ["ACQUA", "COMETA"],
    ricaricaOre: null,
    resa: { risorse: { acqua: 14, ossigeno: 4 } },
    sblocco: [dopoEvento("V09", "INSEGUI", 10)],
  },
  {
    ...BASE,
    id: "T-RIPARA-SERBATOIO",
    minigioco: { tipo: "TEMPISMO", titolo: "Saldatura del serbatoio", istruzioni: "Premi quando la torcia è sulla perdita: tre punti di saldatura." },
    nome: "Riparazione del serbatoio idrico",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 90,
    rischioBase: 25,
    luogo: "SUPPORTO_VITALE",
    costoFatica: 10,
    tag: ["RIPARAZIONE", "ACQUA"],
    ricaricaOre: null,
    resa: { risorse: { acqua: 6 } }, // si recupera parte di ciò che era uscito
    sblocco: [dopoEvento("V15", undefined, 12)],
  },
  {
    ...BASE,
    id: "T-BONIFICA-DISPENSA",
    minigioco: { tipo: "CONFRONTO", titolo: "Lotti contaminati", istruzioni: "Trova il lotto con lo stesso profilo di quello sano." },
    nome: "Bonifica della dispensa",
    categoria: "MEDICINA",
    abilitaPrincipale: "MEDICINA",
    abilitaSecondaria: "SCIENZA",
    durataBase: 90,
    rischioBase: 15,
    luogo: "STOCCAGGIO",
    costoFatica: 8,
    tag: ["CIBO"],
    ricaricaOre: null,
    resa: { risorse: { cibo: 6 } }, // le razioni salvate dalla muffa
    sblocco: [dopoEvento("V14", undefined, 12)],
  },
  {
    ...BASE,
    id: "T-SOCCORSO",
    minigioco: { tipo: "PRESSIONE", titolo: "Equalizza l'airlock", istruzioni: "Tieni la pressione tra le due navi nella fascia verde durante il passaggio." },
    nome: "Assistenza alla nave in avaria",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "MEDICINA",
    durataBase: 150,
    rischioBase: 35,
    luogo: "AIRLOCK",
    costoRisorse: { energia: 2 },
    costoFatica: 15,
    tag: ["SOCCORSO"],
    ricaricaOre: null,
    sblocco: [dopoEvento("V02", "AIUTA", 12)],
  },
  {
    ...BASE,
    id: "T-BLINDATURA",
    minigioco: { tipo: "TEMPISMO", titolo: "Rivetti", istruzioni: "Premi quando il rivettatore è sul foro: tre rivetti." },
    nome: "Blindatura dei boccaporti",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    durataBase: 120,
    rischioBase: 20,
    luogo: "STOCCAGGIO",
    costoRisorse: { energia: 2 },
    costoFatica: 12,
    tag: ["DIFESA"],
    ricaricaOre: null,
    // Dopo la visita dei predoni: se tornano, trovano le porte sigillate.
    sblocco: [{ tipo: "EVENTO_ACCADUTO", id: "V03" }],
  },



  // ==========================================================================
  // LEGATI A V.A.L.E.
  // ==========================================================================
  {
    // Compare solo quando il Capitano ha contestato un'affermazione di V.A.L.E.
    ...BASE,
    id: "T-VERIFICA-DATI",
    minigioco: { tipo: "CONFRONTO", titolo: "Dati grezzi", istruzioni: "Trova tra i dati grezzi quelli identici al rapporto di V.A.L.E.: gli altri sono stati modificati." },
    nome: "Verifica dei dati grezzi",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    durataBase: 150,
    rischioBase: 30,
    luogo: "LABORATORIO",
    costoRisorse: { energia: 2 },
    costoFatica: 12,
    tag: ["VERIFICA"],
    ricaricaOre: 4, // si può tornare a verificare una contestazione nuova
  },
  {
    // Compare solo dopo che V.A.L.E. ha chiuso un compartimento (v3.0).
    // Riapre tutto, ma lei registra l'intervento: tensione +2.
    ...BASE,
    id: "T-SBLOCCO-MANUALE",
    minigioco: { tipo: "SEQUENZA", titolo: "Codice di bypass", istruzioni: "Memorizza e ripeti la sequenza di bypass delle porte." },
    nome: "Sblocco manuale delle porte",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    supportoAmmesso: false,
    durataBase: 90,
    rischioBase: 35,
    luogo: "INGEGNERIA",
    scoperteRichieste: ["BLOCCO_VALE"],
    costoRisorse: { energia: 2 },
    costoFatica: 15,
    tag: ["SBLOCCO"],
    ricaricaOre: 12,
  },
];

/** Il catalogo indicizzato per ID, come lo vuole il reducer. */
export const CATALOGO_TASK: Readonly<Record<IdDefinizioneTask, DefinizioneTask>> = Object.fromEntries(
  [...LISTA_TASK, ...TASK_MISSIONI].map((t) => [t.id, t]),
);

/** La stessa lista in ordine, per mostrarla nei menu. */
export const TASK_DISPONIBILI: readonly DefinizioneTask[] = [...LISTA_TASK, ...TASK_MISSIONI];
