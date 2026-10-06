/**
 * ============================================================================
 * missione.ts — Lo stato completo di una missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §2, §8, §16.
 *
 * COS'È StatoMissione
 * È l'unico oggetto che descrive TUTTA la partita in un dato istante.
 * Il motore lavora così:  (StatoMissione, Azione) → nuovo StatoMissione.
 * Salvare la partita = JSON.stringify(stato). Caricarla = JSON.parse.
 *
 * REGOLE PER TUTTO CIÒ CHE ENTRA QUI DENTRO
 *   1. Solo dati semplici: numeri, stringhe, booleani, null, array, oggetti.
 *      Niente classi, funzioni, Date, Map o Set (non sopravvivono a JSON).
 *   2. Solo ciò che non si può calcolare (vedi nave.ts).
 *   3. Nessuna copia dei dati di catalogo: solo i loro ID.
 *
 * COSA ARRIVERÀ PIÙ AVANTI
 *   - Fase 2–4: pianeta e `verita` nascosta (DESIGN §16.2)
 *   - Fase 5: crew e nave si sposteranno in StatoCampagna, perché
 *     sopravvivono alla singola missione.
 * Aggiungere campi solo quando servono evita di progettare "al buio".
 * ============================================================================
 */

import type { IdEvento, IdIstanzaTask, IdMembro, IdScoperta, Minuti } from "./comuni";
import type { MembroCrew } from "./crew";
import type { RegistroEvento } from "./eventi";
import type { StatoTerminale } from "./terminale";
import type { StatoVale } from "./vale";
import type { EsitoMissione, VoceDiario } from "./storia";
import type { VoceLog } from "./log";
import type { Nave } from "./nave";
import type { Risorse } from "./risorse";
import type { IstanzaTask } from "./task";

/** In quale momento del ciclo di gioco ci troviamo (DESIGN §8). */
export const STATI_GIOCO = ["PIANIFICAZIONE", "IN_ESECUZIONE", "DECISIONE", "RAPPORTO", "CONCLUSA"] as const;
export type StatoGioco = (typeof STATI_GIOCO)[number];

/** Un evento che aspetta la decisione del Capitano (statoGioco = DECISIONE). */
export interface EventoInAttesa {
  id: IdEvento;
  /** Lo stato di gioco a cui tornare dopo la decisione. */
  ritorno: StatoGioco;
  /** Il task che ha fatto scattare l'evento, se c'è (serve agli effetti "RESPONSABILE"). */
  idTaskOrigine: IdIstanzaTask | null;
  /** Chi vive l'evento (v3.0): i nomi al posto di {P} e {S}. */
  protagonista: IdMembro | null;
  secondo: IdMembro | null;
}

export interface StatoEventi {
  /** Tutti gli eventi accaduti, in ordine. */
  accaduti: RegistroEvento[];
  inAttesa: EventoInAttesa | null;
}

/**
 * La CONOSCENZA della crew (DESIGN §4.1, §16.2): ciò che il giocatore sa.
 * La UI legge solo questo. La VERITÀ del pianeta starà in un campo separato.
 */
export interface Conoscenza {
  /** Scoperte in ordine di acquisizione, senza ripetizioni. */
  scoperte: IdScoperta[];
}

export interface StatoMissione {
  // --- Casualità -------------------------------------------------------------
  /** Seed testuale della partita, es. "E17-73A9". Non cambia mai. */
  seed: string;
  /** Stato attuale del generatore (rng.getState()), aggiornato a ogni azione. */
  rngState: number;

  // --- Tempo -----------------------------------------------------------------
  /** Minuti dall'inizio della missione (vedi comuni.ts). */
  tempo: Minuti;
  statoGioco: StatoGioco;

  // --- Entità ----------------------------------------------------------------
  /**
   * La crew, indicizzata per ID: `crew["mara"]` è immediato, mentre con un
   * array dovremmo cercare ogni volta. I membri morti NON vengono rimossi:
   * restano con stato "MORTO", perché la loro storia conta ancora.
   */
  crew: Record<IdMembro, MembroCrew>;
  nave: Nave;
  risorse: Risorse;

  // --- Task ------------------------------------------------------------------
  /** Tutte le istanze della missione (attive e concluse), per ID. */
  tasks: Record<IdIstanzaTask, IstanzaTask>;
  /**
   * La coda di ogni membro: gli ID dei task che eseguirà, in ordine.
   * Il primo è quello attuale. Un membro senza lavoro ha coda vuota [].
   */
  code: Record<IdMembro, IdIstanzaTask[]>;

  // --- Conoscenza ed eventi ------------------------------------------------
  conoscenza: Conoscenza;
  eventi: StatoEventi;
  /** Terminale di manutenzione SVC-07: accesso, frammenti, tentativi. */
  terminale: StatoTerminale;
  /** V.A.L.E.: direttiva NASCOSTA e tensione. La UI non mostra mai la direttiva finché non è rivelata. */
  vale: StatoVale;

  // --- Registro --------------------------------------------------------------
  log: VoceLog[];

  // --- Storia (v3.0) ---------------------------------------------------------
  /** Il giornale di bordo: le righe di ogni giorno, in ordine. */
  diario: VoceDiario[];
  /** L'imprevisto di partenza estratto dal seed (null = nessuno). */
  imprevisto: string | null;
  /** Com'è finita la missione: null finché è in corso (statoGioco ≠ CONCLUSA). */
  esito: EsitoMissione | null;

  /**
   * Contatore per creare nuovi ID ("task-1", "task-2"...).
   * Non usiamo crypto.randomUUID(): è casuale e romperebbe il determinismo.
   * Un contatore nello stato dà sempre gli stessi ID nella stessa partita.
   */
  contatoreId: number;
}
