/**
 * ============================================================================
 * loadout.ts — Tipi del catalogo: moduli, equipaggiamento, scorte
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11 (Loadout), §6 (Risorse).
 *
 * COSA SONO
 * Le DEFINIZIONI degli oggetti che si possono caricare sulla nave durante
 * la Preparazione. Vivono in content/loadout.ts; nello stato della missione
 * restano solo gli ID (nave.moduli, nave.equipaggiamento): i numeri si
 * leggono sempre dal catalogo, così un ritocco di bilanciamento vale anche
 * per le partite già salvate.
 *
 * EFFETTI "NUMERICI" DEI MODULI
 * Un modulo cambia i PARAMETRI della nave (quanta energia genera, quanto
 * pesa il consumo di scorte...). Li descriviamo con una mappa parziale:
 *   effetti: { generazioneEnergia: 6, consumoEnergia: 2 }
 * `Partial<Record<K, number>>` = "un oggetto che PUÒ avere queste chiavi,
 * tutte numeriche". Le chiavi mancanti valgono 0. La somma la fa
 * engine/nave/parametri.ts.
 *
 * EFFETTI NON ANCORA IMPLEMENTATI
 * Il catalogo è completo (15 + 15 + 7, DESIGN §11.3) ma il motore non usa
 * ancora tutto. Quando un oggetto ha un effetto che arriverà più avanti,
 * `inArrivo` lo descrive a parole e la UI lo segnala come "IN ARRIVO".
 * Meglio dirlo che lasciare il giocatore a chiedersi perché non succede nulla.
 * ============================================================================
 */

import type { IdEquipaggiamento, IdModulo } from "./comuni";
import type { Compartimento } from "./nave";

// ----------------------------------------------------------------------------
// TAG DEL LOADOUT — le "capacità" che un oggetto porta a bordo
// ----------------------------------------------------------------------------

/**
 * Usati per decidere quali direttive di V.A.L.E. sono possibili (DESIGN §11.4):
 * se a bordo non c'è niente che sappia scansionare, una direttiva che
 * riguarda "osservare" il segnale non ha senso.
 */
export const TAG_LOADOUT = [
  "SCANSIONE",
  "ANALISI",
  "BIOLOGIA",
  "DRONE",
  "EVA",
  "RIPARAZIONE",
  "ESTRAZIONE",
  "COMUNICAZIONE",
  "NAVIGAZIONE",
  "MEDICINA",
  "ENERGIA",
  "LOGISTICA",
] as const;
export type TagLoadout = (typeof TAG_LOADOUT)[number];

// ----------------------------------------------------------------------------
// PARAMETRI DELLA NAVE — ciò che i moduli possono modificare
// ----------------------------------------------------------------------------

export const PARAMETRI_NAVE = [
  "generazioneEnergia", // energia prodotta al giorno
  "consumoEnergia", // energia consumata al giorno
  "capacitaBatteria", // carica massima
  "spazioScorte", // unità di spazio nella stiva
  "recuperoFatica", // fatica tolta dal sonno
  "ciboPerMembro", // cibo consumato da ogni membro al giorno
  "acquaPerMembro", // acqua consumata da ogni membro al giorno
  "produzioneOssigeno", // ossigeno rigenerato al giorno (con Supporto Vitale al 100%)
  "integritaDati", // bonus all'integrità dei dati (DESIGN §4.6)
] as const;
export type ParametroNave = (typeof PARAMETRI_NAVE)[number];

/** I valori finali, già sommati (base + moduli). */
export type ParametriNave = Record<ParametroNave, number>;

// ----------------------------------------------------------------------------
// DEFINIZIONI
// ----------------------------------------------------------------------------

/** Campi comuni a moduli ed equipaggiamento. */
interface OggettoBase {
  nome: string;
  /** Sigla di 3 lettere per gli spazi stretti (schema della nave, chip), es. "LAB". */
  sigla: string;
  /** kg: conta nel carico operativo (DESIGN §11.1). */
  peso: number;
  /** Cosa permette di fare / quale problema risolve (DESIGN §11.2). */
  descrizione: string;
  tag: TagLoadout[];
  /** Effetto previsto ma non ancora nel motore; null = tutto già attivo. */
  inArrivo: string | null;
}

export interface DefinizioneModulo extends OggettoBase {
  id: IdModulo;
  effetti: Partial<Record<ParametroNave, number>>;
  /**
   * Il compartimento che il modulo potenzia (es. il Laboratorio Avanzato
   * → LABORATORIO). Nello schema della nave quel compartimento si "accende".
   * null = modulo esterno, non legato a un compartimento.
   */
  compartimento: Compartimento | null;
}

export interface DefinizioneEquipaggiamento extends OggettoBase {
  id: IdEquipaggiamento;
}

/** Tipo di cassa nella stiva, es. "CASSA_SCORTE". */
export type IdScorta = string;

/** Una cassa di scorte (DESIGN §11.3: 8 tipologie dalla v3.0). */
export interface DefinizioneScorta {
  id: IdScorta;
  nome: string;
  descrizione: string;
  /** kg per ogni cassa. */
  peso: number;
  /** Unità di spazio scorte per ogni cassa. */
  spazio: number;
  /** Quante casse se ne possono caricare al massimo. */
  massimo: number;
  /** Quale risorsa di missione riempie (null = nessuna, per ora). */
  risorsa: "cibo" | "acqua" | "ossigeno" | "carburante" | null;
  /** Quanto aggiunge alla risorsa, per cassa. */
  quantita: number;
  inArrivo: string | null;
}
