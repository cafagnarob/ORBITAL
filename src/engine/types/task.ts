/**
 * ============================================================================
 * task.ts — Tipi dei task: definizione (catalogo) e istanza (in partita)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9.
 *
 * IL CONCETTO CHIAVE: DEFINIZIONE ≠ ISTANZA
 * È la stessa differenza che c'è tra una ricetta e un piatto cucinato.
 *
 *   DefinizioneTask  → la "ricetta": cosa serve, quanto dura, quanto rischia.
 *                      Vive in src/content/, è fissa, non cambia mai.
 *   IstanzaTask      → il "piatto": QUESTA diagnostica, assegnata a Mara,
 *                      iniziata alle 07:40, in corso. Vive nello stato.
 *
 * La stessa definizione può generare molte istanze nella stessa missione.
 * L'istanza conserva solo l'ID della definizione, non una sua copia:
 * così i salvataggi restano leggeri e, se correggi un numero nel catalogo,
 * la correzione vale anche per le partite salvate.
 *
 * CONDIZIONI E OUTPUT (DESIGN §9)
 *   - condizioni: `equipaggiamentoRichiesto` e `scoperteRichieste`;
 *   - output: NON stanno nel task. Sono EVENTI che reagiscono alla fine di
 *     un task con un certo tag ed esito (vedi types/eventi.ts). Così c'è un
 *     solo meccanismo per tutte le conseguenze del gioco.
 * ============================================================================
 */

import type {
  IdDefinizioneTask,
  IdEquipaggiamento,
  IdIstanzaTask,
  IdMembro,
  IdModulo,
  IdScoperta,
  Minuti,
  Percentuale,
  Tag,
} from "./comuni";
import type { AbilitaTecnica } from "./crew";
import type { Luogo } from "./nave";
import type { CostoRisorse } from "./risorse";

// ----------------------------------------------------------------------------
// VALORI POSSIBILI
// ----------------------------------------------------------------------------

export const CATEGORIE_TASK = [
  "INGEGNERIA",
  "SCIENZA",
  "PILOTAGGIO",
  "MEDICINA",
  "EVA",
  "GENERALE",
] as const;
export type CategoriaTask = (typeof CATEGORIE_TASK)[number];

/** Ciclo di vita di un'istanza (DESIGN §9). */
export const STATI_TASK = [
  "IN_CODA",
  "PRONTO",
  "IN_CORSO",
  "IN_PAUSA",
  "INTERROTTO",
  "COMPLETATO",
  "FALLITO",
  "ANNULLATO",
] as const;
export type StatoTask = (typeof STATI_TASK)[number];

/** Esiti possibili, dal migliore al peggiore. */
export const ESITI_TASK = [
  "SUCCESSO_PERFETTO",
  "SUCCESSO",
  "SUCCESSO_PARZIALE",
  "FALLIMENTO",
  "FALLIMENTO_CRITICO",
] as const;
export type EsitoTask = (typeof ESITI_TASK)[number];

// ----------------------------------------------------------------------------
// DEFINIZIONE (catalogo, in content/)
// ----------------------------------------------------------------------------

export interface DefinizioneTask {
  id: IdDefinizioneTask;
  /** Nome mostrato al giocatore. */
  nome: string;
  categoria: CategoriaTask;

  /** Abilità del RESPONSABILE che conta di più. */
  abilitaPrincipale: AbilitaTecnica;
  /**
   * Abilità che conta in secondo piano. Se c'è un AIUTANTE, si usa la sua;
   * altrimenti quella del responsabile. `null` = il task non ne ha.
   */
  abilitaSecondaria: AbilitaTecnica | null;
  /** Se false, il task si svolge sempre da soli (es. pilotaggio). */
  supportoAmmesso: boolean;

  /** Durata prima dei modificatori (fatica, velocità...). */
  durataBase: Minuti;
  /** Rischio prima dei modificatori, 0–100. La formula è ancora [APERTO]. */
  rischioBase: Percentuale;
  /** Dove si svolge: determina gli spostamenti automatici (DESIGN §7.6). */
  luogo: Luogo;

  equipaggiamentoRichiesto: IdEquipaggiamento[];
  /** Moduli che devono essere installati, es. il Laboratorio per le analisi. */
  moduliRichiesti: IdModulo[];
  /**
   * Scoperte necessarie perché il task esista per il giocatore, es. non si
   * può analizzare un segnale prima di averlo rilevato. [] = sempre disponibile.
   */
  scoperteRichieste: IdScoperta[];
  costoRisorse: CostoRisorse;
  /** Fatica aggiunta al responsabile (e in parte all'aiutante). */
  costoFatica: number;
  tag: Tag[];
}

// ----------------------------------------------------------------------------
// ISTANZA (in partita, nello stato)
// ----------------------------------------------------------------------------

/**
 * Un task assegnato durante la missione.
 *
 * PERCHÉ `| null` E NON CAMPI FACOLTATIVI (`?`)
 * Nello stato di gioco ogni campo esiste sempre: `esito: null` dice
 * esplicitamente "non c'è ancora un esito". Inoltre JSON.stringify elimina
 * i campi che valgono undefined, mentre null sopravvive al salvataggio:
 * un oggetto salvato e ricaricato resta identico all'originale.
 */
export interface IstanzaTask {
  id: IdIstanzaTask;
  /** Riferimento alla "ricetta" nel catalogo. */
  idDefinizione: IdDefinizioneTask;

  /** Chi esegue il task: usa l'abilità principale. */
  responsabile: IdMembro;
  /** Aiutante facoltativo: usa l'abilità secondaria. */
  supporto: IdMembro | null;

  stato: StatoTask;
  /** Minuto in cui è iniziato (null finché è in coda). */
  inizio: Minuti | null;
  /** Minuto in cui finirà o è finito (calcolato all'avvio). */
  fine: Minuti | null;
  /**
   * Rischio calcolato AL MOMENTO DELL'AVVIO (null finché è in coda).
   * Lo salviamo invece di ricalcolarlo alla fine perché è il rischio che
   * il giocatore ha visto e accettato: se nel frattempo cambiasse qualcosa,
   * l'esito non deve "tradire" la stima su cui ha deciso.
   */
  rischio: Percentuale | null;
  /** Esito, noto solo quando il task si conclude. */
  esito: EsitoTask | null;
}
