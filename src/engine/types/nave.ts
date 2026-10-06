/**
 * ============================================================================
 * nave.ts — Tipi della nave: compartimenti, sistemi, accessi, integrità
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §5.
 *
 * IL PATTERN "LISTA COSTANTE → TIPO" (usato in tutti i file dei tipi)
 *
 *   export const SISTEMI_CORE = ["SUPPORTO_VITALE", "POTENZA", ...] as const;
 *   export type SistemaCore = (typeof SISTEMI_CORE)[number];
 *
 * - `as const` dice a TypeScript che l'array non cambierà mai, quindi i suoi
 *   elementi hanno tipo esatto ("POTENZA") invece del generico string.
 * - `(typeof SISTEMI_CORE)[number]` significa "il tipo di un qualsiasi
 *   elemento dell'array", cioè "SUPPORTO_VITALE" | "POTENZA" | ...
 * Così i valori si scrivono UNA volta sola, e abbiamo sia il tipo (per il
 * compilatore) sia la lista (per ciclare: mostrare tutti i sistemi nella UI).
 *
 * PERCHÉ NON USIAMO `enum`
 * Il template Vite attiva `erasableSyntaxOnly`, che vieta gli enum:
 * generano codice JavaScript nascosto. Le liste `as const` sono JavaScript
 * normale e si serializzano in JSON senza sorprese.
 * ============================================================================
 */

import type { IdEquipaggiamento, IdModulo, Percentuale } from "./comuni";

// ----------------------------------------------------------------------------
// COMPARTIMENTI E LUOGHI
// ----------------------------------------------------------------------------

/** I 9 compartimenti interni della nave. */
export const COMPARTIMENTI = [
  "COMANDO",
  "HABITAT",
  "INGEGNERIA",
  "SUPPORTO_VITALE",
  "LABORATORIO",
  "INFERMERIA",
  "STOCCAGGIO",
  "AIRLOCK",
  "PROPULSIONE",
] as const;
export type Compartimento = (typeof COMPARTIMENTI)[number];

/**
 * Dove può trovarsi un membro della crew o svolgersi un task:
 * un compartimento, l'esterno della nave (EVA in orbita) o la superficie.
 * `|` significa "oppure": un Luogo è uno qualsiasi di questi valori.
 */
export type Luogo = Compartimento | "ESTERNO_NAVE" | "SUPERFICIE";

/** Stato di accesso di un compartimento (V.A.L.E. può modificarlo). */
export const STATI_ACCESSO = ["APERTO", "LIMITATO", "IN_SICUREZZA", "BLOCCATO"] as const;
export type StatoAccesso = (typeof STATI_ACCESSO)[number];

// ----------------------------------------------------------------------------
// SISTEMI CORE
// ----------------------------------------------------------------------------

/** Gli 8 sistemi core. Il Comando NON è un sistema: è il centro di controllo. */
export const SISTEMI_CORE = [
  "SUPPORTO_VITALE",
  "POTENZA",
  "PROPULSIONE",
  "NAVIGAZIONE",
  "COMUNICAZIONI",
  "SCIENZA",
  "MEDICINA",
  "OPERAZIONI_ESTERNE",
] as const;
export type SistemaCore = (typeof SISTEMI_CORE)[number];

// ----------------------------------------------------------------------------
// NAVE
// ----------------------------------------------------------------------------

/**
 * Lo stato fisico della nave.
 *
 * REGOLA: SALVIAMO SOLO CIÒ CHE NON SI PUÒ CALCOLARE
 * Salviamo `scafo: 63`, ma NON la fascia "DANNEGGIATO": quella si ricava
 * dal numero. Se le salvassimo entrambe, prima o poi un bug aggiornerebbe
 * il numero dimenticando la fascia, e lo stato direbbe due cose diverse.
 * Una sola fonte di verità → nessuna contraddizione possibile.
 * Le funzioni che calcolano le fasce arriveranno nel motore.
 */
export interface Nave {
  /** Integrità dello scafo, 0–100 (0 = nave distrutta). */
  scafo: Percentuale;

  /**
   * Integrità di ogni sistema, 0–100.
   * `Record<SistemaCore, Percentuale>` è un oggetto che deve avere
   * ESATTAMENTE una chiave per ogni sistema: se ne manca una, errore.
   */
  sistemi: Record<SistemaCore, Percentuale>;

  /** Stato di accesso di ogni compartimento. */
  accessi: Record<Compartimento, StatoAccesso>;

  /** Moduli installati (massimo 4 slot, DESIGN §11.1). */
  moduli: IdModulo[];

  /** Equipaggiamento a bordo per questa missione (massimo 6 slot). */
  equipaggiamento: IdEquipaggiamento[];
}
