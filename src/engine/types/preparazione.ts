/**
 * ============================================================================
 * preparazione.ts — Tipi della schermata di Preparazione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1 (selezione crew), §11 (loadout),
 * §14.4 (fattibilità).
 *
 * LA PREPARAZIONE È UNO STATO A SÉ
 * Prima della missione non esistono ancora orologio, task o log: c'è solo
 * una "lista della spesa" (chi parte, cosa si carica). Per questo non è un
 * pezzo di StatoMissione ma un oggetto piccolo e separato. Quando il
 * Capitano conferma, la lista diventa lo stato iniziale della missione
 * (content/missioneIniziale.ts).
 *
 * Anche qui salviamo SOLO le scelte: peso totale, slot liberi, energia al
 * giorno e fattibilità si calcolano (engine/preparazione/riepilogo.ts).
 * ============================================================================
 */

import type { IdDefinizioneTask, IdDirettiva, IdEquipaggiamento, IdMembro, IdModulo } from "./comuni";
import type { MembroCrew } from "./crew";
import type {
  DefinizioneEquipaggiamento,
  DefinizioneModulo,
  DefinizioneScorta,
  IdScorta,
} from "./loadout";
import type { DefinizioneDirettiva } from "./vale";
import type { DefinizioneTask } from "./task";

/** Le scelte del Capitano. */
export interface Preparazione {
  /** ID dei candidati scelti (4 su 10). */
  crew: IdMembro[];
  moduli: IdModulo[];
  equipaggiamento: IdEquipaggiamento[];
  /** Numero di casse per ogni tipo; un tipo assente vale 0. */
  scorte: Record<IdScorta, number>;
}

/** Tutto ciò che la Preparazione legge dal contenuto (iniezione di dipendenze). */
export interface CataloghiPreparazione {
  candidati: Readonly<Record<IdMembro, MembroCrew>>;
  moduli: Readonly<Record<IdModulo, DefinizioneModulo>>;
  equipaggiamento: Readonly<Record<IdEquipaggiamento, DefinizioneEquipaggiamento>>;
  scorte: Readonly<Record<IdScorta, DefinizioneScorta>>;
  /** Servono per mostrare cosa sblocca ogni oggetto. */
  task: Readonly<Record<IdDefinizioneTask, DefinizioneTask>>;
  direttive: Readonly<Record<IdDirettiva, DefinizioneDirettiva>>;
}

/** Le azioni della schermata di Preparazione. */
export type AzionePreparazione =
  | { tipo: "SCEGLI_CANDIDATO"; id: IdMembro }
  | { tipo: "SCEGLI_MODULO"; id: IdModulo }
  | { tipo: "SCEGLI_EQUIPAGGIAMENTO"; id: IdEquipaggiamento }
  | { tipo: "IMPOSTA_SCORTA"; id: IdScorta; quantita: number }
  /** Sostituisce tutte le scelte, es. "ripristina il loadout di riferimento". */
  | { tipo: "CARICA"; preparazione: Preparazione };

/** Fattibilità della missione (DESIGN §14.4). */
export const FATTIBILITA = ["POSSIBILE", "RISCHIOSA", "IMPOSSIBILE"] as const;
export type Fattibilita = (typeof FATTIBILITA)[number];

/**
 * Un problema della preparazione.
 * BLOCCANTE: non si può partire (es. carico oltre i 1000 kg).
 * AVVISO: si può partire, ma il Capitano deve saperlo (es. niente medico).
 */
export interface ProblemaPreparazione {
  gravita: "BLOCCANTE" | "AVVISO";
  testo: string;
}
