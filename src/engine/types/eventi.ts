/**
 * ============================================================================
 * eventi.ts — Tipi del sistema di eventi: condizioni, effetti, scelte
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.
 *
 * L'IDEA: GLI EVENTI SONO DATI, NON CODICE
 * Un evento non è una funzione che "fa cose": è un oggetto che DESCRIVE
 * quando può accadere (condizioni), cosa cambia (effetti) e quali scelte
 * offre al Capitano. Il motore legge queste descrizioni e le applica.
 *
 * Perché così:
 *   - gli eventi si scrivono in content/ come semplici oggetti, senza
 *     toccare il motore (aggiungere E05 = aggiungere un oggetto);
 *   - sono serializzabili e testabili (si può controllare automaticamente
 *     che ogni evento citi solo scoperte che esistono);
 *   - il "linguaggio" è piccolo e chiuso: TypeScript segnala ogni errore.
 *
 * Le condizioni e gli effetti sono "union discriminate", come le azioni.
 * ============================================================================
 */

import type { IdEquipaggiamento, IdEvento, IdScoperta, Minuti, Tag } from "./comuni";
import type { FonteLog } from "./log";
import type { SistemaCore } from "./nave";
import type { Risorse } from "./risorse";
import type { EsitoTask } from "./task";

export const CATEGORIE_EVENTO = [
  "SISTEMA",
  "EQUIPAGGIO",
  "EVA",
  "SCIENTIFICO",
  "ESPLORAZIONE",
  "AMBIENTALE",
  "NARRATIVO",
  "VALE",
] as const;
export type CategoriaEvento = (typeof CATEGORIE_EVENTO)[number];

/** Dalla meno alla più importante: a parità di momento vince la più alta. */
export const PRIORITA_EVENTO = ["SFONDO", "NORMALE", "IMPORTANTE", "CRITICO"] as const;
export type PrioritaEvento = (typeof PRIORITA_EVENTO)[number];

// ----------------------------------------------------------------------------
// CONDIZIONI: "quando può accadere?"
// ----------------------------------------------------------------------------

export type Condizione =
  /**
   * In QUESTO momento si è appena concluso un task con questo tag.
   * esitoAlmeno: "SUCCESSO" vale per SUCCESSO e SUCCESSO_PERFETTO.
   * esitoAlPiu:  "FALLIMENTO" vale per FALLIMENTO e FALLIMENTO_CRITICO.
   */
  | { tipo: "TASK_CONCLUSO_ORA"; tag: Tag; esitoAlmeno?: EsitoTask; esitoAlPiu?: EsitoTask }
  /** Siamo al rapporto serale o al risveglio. */
  | { tipo: "MOMENTO"; momento: "RAPPORTO_SERALE" | "RISVEGLIO" }
  /** La crew sa / non sa ancora una certa cosa. */
  | { tipo: "SCOPERTA"; id: IdScoperta }
  | { tipo: "NON_SCOPERTA"; id: IdScoperta }
  /** Un evento è già accaduto (eventualmente con una certa scelta). */
  | { tipo: "EVENTO_ACCADUTO"; id: IdEvento; scelta?: string }
  /** Un equipaggiamento è a bordo (tipico requisito di una scelta). */
  | { tipo: "EQUIPAGGIAMENTO"; id: IdEquipaggiamento }
  /** Almeno UNA delle condizioni interne è vera (le liste normali sono "tutte"). */
  | { tipo: "UNO_TRA"; condizioni: Condizione[] };

// ----------------------------------------------------------------------------
// EFFETTI: "cosa cambia?"
// ----------------------------------------------------------------------------

export type Effetto =
  /** La crew scopre qualcosa: entra nella conoscenza. */
  | { tipo: "SCOPERTA"; id: IdScoperta }
  /** Variazione di una risorsa (negativa = costo). Mai sotto zero. */
  | { tipo: "RISORSA"; risorsa: keyof Risorse; delta: number }
  /** Variazione dell'integrità di un sistema, limitata a 0–100. */
  | { tipo: "SISTEMA"; sistema: SistemaCore; delta: number }
  /** Variazione dell'integrità dello scafo, limitata a 0–100. */
  | { tipo: "SCAFO"; delta: number }
  /** Variazione della fatica: del responsabile del task d'origine, o di tutti. */
  | { tipo: "FATICA"; chi: "RESPONSABILE" | "TUTTI"; delta: number }
  /** Una voce di log in più (con eventuali codici nascosti). */
  | { tipo: "LOG"; fonte: FonteLog; testo: string; codici?: string[] };

// ----------------------------------------------------------------------------
// SCELTE ED EVENTI
// ----------------------------------------------------------------------------

/** Un'opzione offerta al Capitano. */
export interface SceltaEvento {
  /** Breve e stabile, es. "INDAGA": viene salvata nel registro. */
  id: string;
  /** Testo del pulsante. */
  etichetta: string;
  /** Se non sono tutte vere, la scelta è visibile ma non selezionabile. */
  requisiti: Condizione[];
  effetti: Effetto[];
}

export interface DefinizioneEvento {
  id: IdEvento;
  titolo: string;
  categoria: CategoriaEvento;
  priorita: PrioritaEvento;

  /** Se true, accade al massimo una volta per missione. */
  unaVolta: boolean;
  /** Probabilità (0–1) che accada quando le condizioni sono vere. */
  probabilita: number;
  /** Peso nella scelta tra eventi della stessa priorità (> 0). */
  peso: number;
  /** Devono essere TUTTE vere. */
  condizioni: Condizione[];

  /** Chi "parla" quando l'evento accade, e cosa dice. */
  fonte: FonteLog;
  testo: string;
  /** Codici nascosti nel messaggio (DESIGN §4.3). */
  codici: string[];

  /** Effetti applicati subito, quando l'evento accade. */
  effetti: Effetto[];
  /** Scelte per il Capitano. Vuoto = evento solo informativo. */
  scelte: SceltaEvento[];
}

/** Traccia di un evento accaduto, conservata nello stato. */
export interface RegistroEvento {
  id: IdEvento;
  tempo: Minuti;
  /** ID della scelta fatta, o null per gli eventi informativi. */
  scelta: string | null;
}
