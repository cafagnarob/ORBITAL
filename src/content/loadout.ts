/**
 * ============================================================================
 * loadout.ts — Catalogo di moduli, equipaggiamento e scorte
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.3 (15 moduli · 15 equipaggiamenti ·
 * 7 scorte), §11.2 (le sei domande di ogni oggetto), §6 (risorse).
 *
 * COME LEGGERE UNA VOCE
 *   peso       kg nel carico operativo (massimo 1000, crew compresa)
 *   effetti    (solo moduli) cosa cambia nei parametri della nave, ogni giorno
 *   sigla      3 lettere per lo schema della nave (es. "LAB")
 *   compartimento (solo moduli) quale parte della nave potenzia: nello
 *              schema della Preparazione quel compartimento si accende
 *   tag        capacità portate a bordo: decidono quali direttive di
 *              V.A.L.E. sono possibili (content/direttive.ts → richiede)
 *   inArrivo   l'effetto previsto dal DESIGN che il motore non usa ANCORA.
 *              La UI lo mostra come "IN ARRIVO": il giocatore sa che oggi
 *              l'oggetto conta solo per peso, tag e (se c'è) task sbloccati.
 *
 * Cosa SBLOCCA un oggetto non è scritto qui: si ricava dai task che lo
 * richiedono (content/tasks.ts), così le due liste non possono divergere.
 *
 * NUMERI [PROVVISORIO]: il loadout di riferimento (DESIGN §13.8) pesa
 * circa 970 kg su 1000 e consuma 8 di energia al giorno, come nel DESIGN.
 * Dalla v3.0 cibo, acqua e ossigeno hanno casse separate.
 * ============================================================================
 */

import type {
  DefinizioneEquipaggiamento,
  DefinizioneModulo,
  DefinizioneScorta,
  IdEquipaggiamento,
  IdModulo,
  IdScorta,
} from "../engine/types";

// ----------------------------------------------------------------------------
// MODULI (4 slot)
// ----------------------------------------------------------------------------

export const LISTA_MODULI: readonly DefinizioneModulo[] = [
  {
    id: "LABORATORIO_AVANZATO",
    sigla: "LAB",
    compartimento: "LABORATORIO",
    nome: "Laboratorio Avanzato",
    peso: 90,
    descrizione: "Strumenti di analisi a bordo: senza, segnali e campioni restano dati grezzi.",
    effetti: { consumoEnergia: 1 },
    tag: ["ANALISI", "BIOLOGIA"],
    inArrivo: null,
  },
  {
    id: "POTENZIAMENTO_INFERMERIA",
    sigla: "MED",
    compartimento: "INFERMERIA",
    nome: "Potenziamento Infermeria",
    peso: 70,
    descrizione: "Sala di cura attrezzata per traumi e radiazioni.",
    effetti: { consumoEnergia: 1 },
    tag: ["MEDICINA"],
    inArrivo: "Cure più rapide per i feriti",
  },
  {
    id: "MODULO_POTENZA",
    sigla: "PWR",
    compartimento: "INGEGNERIA",
    nome: "Modulo di Potenza",
    peso: 80,
    descrizione: "Generatore supplementare: più energia, ma anche più consumi.",
    effetti: { generazioneEnergia: 6, consumoEnergia: 2 },
    tag: ["ENERGIA"],
    inArrivo: null,
  },
  {
    id: "POTENZIAMENTO_SUPPORTO_VITALE",
    sigla: "SV+",
    compartimento: "SUPPORTO_VITALE",
    nome: "Potenziamento Supporto Vitale",
    peso: 60,
    descrizione: "Rigenera più ossigeno e l'aria è più pulita: la crew dorme meglio.",
    effetti: { consumoEnergia: 1, recuperoFatica: 5 },
    tag: ["LOGISTICA"],
    inArrivo: "Riserva d'ossigeno nelle emergenze",
  },
  {
    id: "ARRAY_NAVIGAZIONE",
    sigla: "NAV",
    compartimento: "COMANDO",
    nome: "Array di Navigazione",
    peso: 50,
    descrizione: "Riferimenti di posizione ridondanti: dati di bordo più affidabili.",
    effetti: { integritaDati: 4 },
    tag: ["NAVIGAZIONE"],
    inArrivo: null,
  },
  {
    id: "ARRAY_COMUNICAZIONE_SECONDARIO",
    sigla: "COM",
    compartimento: "COMANDO",
    nome: "Array di Comunicazione Secondario",
    peso: 45,
    descrizione: "Un secondo canale verso la Terra, indipendente dal principale.",
    effetti: { consumoEnergia: 1, integritaDati: 4 },
    tag: ["COMUNICAZIONE"],
    inArrivo: "Contatto con la Terra se il canale principale cade",
  },
  {
    id: "SCANNER_SPAZIALE_PROFONDO",
    sigla: "SCN",
    compartimento: null,
    nome: "Scanner Spaziale Profondo",
    peso: 110,
    descrizione: "Osservazione avanzata dall'orbita: vede ciò che i sensori portatili non vedono.",
    effetti: { consumoEnergia: 2, integritaDati: 6 },
    tag: ["SCANSIONE"],
    inArrivo: "Scansioni orbitali di livello avanzato",
  },
  {
    id: "MODULO_MINERARIO",
    sigla: "MIN",
    compartimento: null,
    nome: "Modulo Minerario",
    peso: 120,
    descrizione: "Trivelle e contenitori per estrarre materiale dalla superficie.",
    effetti: { consumoEnergia: 2 },
    tag: ["ESTRAZIONE"],
    inArrivo: "Task di estrazione",
  },
  {
    id: "ESTENSIONE_HABITAT",
    sigla: "HAB",
    compartimento: "HABITAT",
    nome: "Estensione Habitat",
    peso: 100,
    descrizione: "Più spazio vitale: il riposo diventa vero riposo.",
    effetti: { consumoEnergia: 1, recuperoFatica: 10 },
    tag: ["LOGISTICA"],
    inArrivo: null,
  },
  {
    id: "ESPANSIONE_STOCCAGGIO",
    sigla: "STO",
    compartimento: "STOCCAGGIO",
    nome: "Espansione Stoccaggio",
    peso: 60,
    descrizione: "Stiva ampliata: più casse di scorte a bordo.",
    effetti: { spazioScorte: 100 },
    tag: ["LOGISTICA"],
    inArrivo: null,
  },
  {
    id: "ASSISTENZA_PROPULSIONE",
    sigla: "PRP",
    compartimento: "PROPULSIONE",
    nome: "Assistenza alla Propulsione",
    peso: 70,
    descrizione: "Ottimizza le manovre orbitali.",
    effetti: { consumoEnergia: 1 },
    tag: ["NAVIGAZIONE"],
    inArrivo: "Manovre con meno carburante",
  },
  {
    id: "MODULO_OPERAZIONI_ESTERNE",
    sigla: "EVA",
    compartimento: "AIRLOCK",
    nome: "Modulo Operazioni Esterne",
    peso: 80,
    descrizione: "Airlock attrezzato e supporto alle uscite in superficie.",
    effetti: { consumoEnergia: 1 },
    tag: ["EVA"],
    inArrivo: "EVA più rapide e sicure",
  },
  {
    id: "HANGAR_DRONI",
    sigla: "DRN",
    compartimento: null,
    nome: "Hangar Droni",
    peso: 90,
    descrizione: "Ricarica e riparazione dei droni a bordo.",
    effetti: { consumoEnergia: 1 },
    tag: ["DRONE"],
    inArrivo: "Droni riparabili e ricognizioni più lunghe",
  },
  {
    id: "POTENZIAMENTO_RICICLO_ACQUA",
    sigla: "H2O",
    compartimento: "SUPPORTO_VITALE",
    nome: "Potenziamento Riciclo dell'Acqua",
    peso: 55,
    descrizione: "Recupera acqua dai sistemi: l'acqua dura il doppio.",
    effetti: { consumoEnergia: 1, acquaPerMembro: -1 },
    tag: ["LOGISTICA"],
    inArrivo: null,
  },
  {
    id: "RISERVA_ENERGIA_EMERGENZA",
    sigla: "BAT",
    compartimento: "INGEGNERIA",
    nome: "Riserva di Energia d'Emergenza",
    peso: 70,
    descrizione: "Batterie supplementari: più margine nei giorni difficili.",
    effetti: { capacitaBatteria: 60 },
    tag: ["ENERGIA"],
    inArrivo: null,
  },
];

// ----------------------------------------------------------------------------
// EQUIPAGGIAMENTO (6 slot)
// ----------------------------------------------------------------------------

export const LISTA_EQUIPAGGIAMENTO: readonly DefinizioneEquipaggiamento[] = [
  {
    id: "SCANNER_MANUALE",
    sigla: "SCM",
    nome: "Scanner Manuale",
    peso: 8,
    descrizione: "Letture locali, a portata di mano.",
    tag: ["SCANSIONE"],
    inArrivo: "Scansioni locali in superficie",
  },
  {
    id: "SENSORE_PROFONDO",
    sigla: "SNP",
    nome: "Sensore Profondo Portatile",
    peso: 18,
    descrizione: "Letture dettagliate di suolo e segnali.",
    tag: ["SCANSIONE"],
    inArrivo: null,
  },
  {
    id: "KIT_RIPARAZIONE",
    sigla: "KIT",
    nome: "Kit di Riparazione",
    peso: 15,
    descrizione: "Attrezzi e ricambi per la manutenzione dei sistemi.",
    tag: ["RIPARAZIONE"],
    inArrivo: null,
  },
  {
    id: "SET_STRUMENTI_INGEGNERISTICI",
    sigla: "STR",
    nome: "Set di Strumenti Ingegneristici",
    peso: 22,
    descrizione: "Per riparazioni pesanti allo scafo e alla propulsione.",
    tag: ["RIPARAZIONE"],
    inArrivo: "Riparazioni dello scafo",
  },
  {
    id: "TABLET_DIAGNOSTICO",
    sigla: "TDG",
    nome: "Tablet Diagnostico",
    peso: 4,
    descrizione: "Legge i sistemi senza passare da V.A.L.E.",
    tag: ["ANALISI"],
    inArrivo: "Diagnosi indipendenti da V.A.L.E.",
  },
  {
    id: "DRONE_RICOGNIZIONE",
    sigla: "DRN",
    nome: "Drone da Ricognizione",
    peso: 25,
    descrizione: "Osservazione remota, senza rischiare la crew.",
    tag: ["DRONE"],
    inArrivo: null,
  },
  {
    id: "CONTENITORE_CAMPIONI",
    sigla: "CMP",
    nome: "Contenitore per Campioni",
    peso: 12,
    descrizione: "Trasporto sicuro di campioni biologici e minerali.",
    tag: ["BIOLOGIA"],
    inArrivo: "Prelievo di campioni",
  },
  {
    id: "LABORATORIO_PORTATILE",
    sigla: "LBP",
    nome: "Laboratorio Portatile",
    peso: 30,
    descrizione: "Analisi di base direttamente sul campo.",
    tag: ["ANALISI", "BIOLOGIA"],
    inArrivo: "Analisi in superficie",
  },
  {
    id: "IMPIANTO_RIPARAZIONE_EVA",
    sigla: "IRE",
    nome: "Impianto di Riparazione EVA",
    peso: 20,
    descrizione: "Ripara tute e attrezzature durante le uscite.",
    tag: ["EVA", "RIPARAZIONE"],
    inArrivo: "Riparazioni durante le EVA",
  },
  {
    id: "TUTA_EVA_MK2",
    sigla: "EVA",
    nome: "Tuta EVA Mk II",
    peso: 35,
    descrizione: "Uscite fuori dalla nave e in superficie.",
    tag: ["EVA"],
    inArrivo: null,
  },
  {
    id: "FARO_EMERGENZA",
    sigla: "FAR",
    nome: "Faro di Emergenza",
    peso: 6,
    descrizione: "Localizza la crew dispersa.",
    tag: ["COMUNICAZIONE"],
    inArrivo: "Ricerca dei dispersi",
  },
  {
    id: "TABLET_NAVIGAZIONE",
    sigla: "TNV",
    nome: "Tablet di Navigazione",
    peso: 4,
    descrizione: "Mappe e rotte per gli spostamenti in superficie.",
    tag: ["NAVIGAZIONE"],
    inArrivo: "Spostamenti in superficie più rapidi",
  },
  {
    id: "KIT_MEDICO_CAMPO",
    sigla: "MED",
    nome: "Kit Medico da Campo",
    peso: 10,
    descrizione: "Primo soccorso lontano dall'infermeria.",
    tag: ["MEDICINA"],
    inArrivo: "Cure sul campo",
  },
  {
    id: "RILEVATORE_RADIAZIONI",
    sigla: "RAD",
    nome: "Rilevatore di Radiazioni",
    peso: 5,
    descrizione: "Avvisa delle sacche di radiazione prima che sia tardi.",
    tag: ["SCANSIONE"],
    inArrivo: "Allarme radiazioni",
  },
  {
    id: "CELLA_POTENZA_PORTATILE",
    sigla: "CEL",
    nome: "Cella di Potenza Portatile",
    peso: 14,
    descrizione: "Energia per gli strumenti lontano dalla nave.",
    tag: ["ENERGIA"],
    inArrivo: "Strumenti alimentati in superficie",
  },
];

// ----------------------------------------------------------------------------
// SCORTE (stiva: 200 unità di spazio, 300 con Espansione Stoccaggio) — 8 tipi
// ----------------------------------------------------------------------------

export const LISTA_SCORTE: readonly DefinizioneScorta[] = [
  {
    id: "CASSA_CIBO",
    nome: "Cassa di Cibo",
    descrizione: "Razioni sigillate. Ogni membro ne consuma 2 al giorno.",
    peso: 12,
    spazio: 8,
    massimo: 20,
    risorsa: "cibo",
    quantita: 12,
    inArrivo: null,
  },
  {
    id: "CASSA_ACQUA",
    nome: "Cassa d'Acqua",
    descrizione: "Acqua potabile. Ogni membro ne consuma 2 al giorno (meno con il Riciclo).",
    peso: 15,
    spazio: 10,
    massimo: 16,
    risorsa: "acqua",
    quantita: 15,
    inArrivo: null,
  },
  {
    id: "BOMBOLA_OSSIGENO",
    nome: "Bombola d'Ossigeno",
    descrizione: "Riserva oltre i serbatoi: tiene in vita la crew se il Supporto Vitale si guasta.",
    peso: 12,
    spazio: 6,
    massimo: 4,
    risorsa: "ossigeno",
    quantita: 10,
    inArrivo: null,
  },
  {
    id: "TANICA_CARBURANTE",
    nome: "Tanica di Carburante",
    descrizione: "Carburante operativo, oltre la riserva di rientro del serbatoio.",
    peso: 20,
    spazio: 10,
    massimo: 6,
    risorsa: "carburante",
    quantita: 4,
    inArrivo: null,
  },
  {
    id: "CASSA_SCORTE_MEDICHE",
    nome: "Cassa di Scorte Mediche",
    descrizione: "Farmaci e materiale per le cure.",
    peso: 10,
    spazio: 8,
    massimo: 4,
    risorsa: null,
    quantita: 0,
    inArrivo: "Cure dei feriti",
  },
  {
    id: "CASSA_PEZZI_RICAMBIO",
    nome: "Cassa di Pezzi di Ricambio",
    descrizione: "Componenti per riparare i sistemi danneggiati.",
    peso: 25,
    spazio: 10,
    massimo: 4,
    risorsa: null,
    quantita: 0,
    inArrivo: "Riparazioni dei sistemi",
  },
  {
    id: "CASSA_CELLE_BATTERIA",
    nome: "Cassa di Celle Batteria",
    descrizione: "Ricariche d'emergenza per la batteria.",
    peso: 18,
    spazio: 8,
    massimo: 4,
    risorsa: null,
    quantita: 0,
    inArrivo: "Ricarica d'emergenza",
  },
  {
    id: "CASSA_CONSUMABILI_RICERCA",
    nome: "Cassa di Consumabili di Ricerca",
    descrizione: "Reagenti e supporti per le analisi.",
    peso: 10,
    spazio: 8,
    massimo: 4,
    risorsa: null,
    quantita: 0,
    inArrivo: "Analisi aggiuntive",
  },
];

// ----------------------------------------------------------------------------
// CATALOGHI INDICIZZATI PER ID (per le ricerche veloci del motore)
// ----------------------------------------------------------------------------

/** Trasforma una lista in un oggetto { id: voce }. */
function perId<T extends { id: string }>(lista: readonly T[]): Readonly<Record<string, T>> {
  return Object.fromEntries(lista.map((voce) => [voce.id, voce]));
}

export const CATALOGO_MODULI: Readonly<Record<IdModulo, DefinizioneModulo>> = perId(LISTA_MODULI);
export const CATALOGO_EQUIPAGGIAMENTO: Readonly<Record<IdEquipaggiamento, DefinizioneEquipaggiamento>> =
  perId(LISTA_EQUIPAGGIAMENTO);
export const CATALOGO_SCORTE: Readonly<Record<IdScorta, DefinizioneScorta>> = perId(LISTA_SCORTE);
