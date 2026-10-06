/**
 * ============================================================================
 * comuni.ts — Tipi di base condivisi da tutto il motore
 * ============================================================================
 *
 * COSA CONTIENE
 * Gli "alias" di tipo usati ovunque: unità di misura (minuti, percentuali)
 * e identificatori (ID) delle entità di gioco.
 *
 * PERCHÉ ESISTE UN FILE SEPARATO
 * Se crew.ts importasse da task.ts e task.ts da crew.ts si creerebbe una
 * dipendenza circolare. Mettendo i mattoni comuni qui, tutti gli altri file
 * importano da comuni.ts e mai l'uno dall'altro in cerchio.
 *
 * COSA SONO GLI ALIAS
 * `type Minuti = number` non crea un tipo nuovo: per TypeScript Minuti e
 * number sono la stessa cosa. Serve a chi legge: `durata: Minuti` dice
 * molto più di `durata: number`. È documentazione verificata dal compilatore.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// UNITÀ DI MISURA
// ----------------------------------------------------------------------------

/**
 * Tempo di gioco in minuti, contati dall'inizio della missione.
 * Convenzione: 0 = Giorno 1, ore 00:00. Quindi 360 = Giorno 1, ore 06:00
 * e 1440 = Giorno 2, ore 00:00. Giorno e ora si CALCOLANO da questo numero
 * (lo farà clock.ts), non si salvano separatamente.
 */
export type Minuti = number

/**
 * Valore intero da 0 a 100: salute, fatica, fiducia, integrità, rischio.
 * TypeScript non può vietare un 150: il controllo dei limiti spetta alle
 * funzioni del motore che modificano questi valori.
 */
export type Percentuale = number

/**
 * Etichetta interna con cui i sistemi comunicano (DESIGN §12.5),
 * es. "ALTA_RADIAZIONE", "SEGNALE". Mai mostrata al giocatore.
 */
export type Tag = string

// ----------------------------------------------------------------------------
// IDENTIFICATORI
// ----------------------------------------------------------------------------
// Ogni entità ha un ID testuale. Avere un alias per ognuno rende chiaro
// cosa si aspetta una funzione: `assegna(idMembro: IdMembro, ...)`.

/** Membro della crew, es. "mara". */
export type IdMembro = string

/** Tratto di un membro della crew, es. "ESPERTO_MECCANICA". */
export type IdTratto = string

/** Modulo della nave, es. "LABORATORIO_AVANZATO". */
export type IdModulo = string

/** Equipaggiamento, es. "SENSORE_PROFONDO". */
export type IdEquipaggiamento = string

/** Definizione di un task nel catalogo (content/), es. "T-DIAGNOSTICA". */
export type IdDefinizioneTask = string

/** Singolo task assegnato durante una missione, es. "task-7". */
export type IdIstanzaTask = string
