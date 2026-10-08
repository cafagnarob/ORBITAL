/**
 * ============================================================================
 * index.ts — Punto di ingresso unico dei tipi del motore ("barrel file")
 * ============================================================================
 *
 * Riesporta tutto ciò che sta nella cartella types/. Così il resto del
 * codice scrive un solo import:
 *
 *   import type { StatoMissione, MembroCrew } from "../engine/types";
 *
 * invece di un import per ogni file. Se un giorno spostiamo un tipo da un
 * file all'altro dentro types/, chi lo usa non deve cambiare nulla.
 * ============================================================================
 */

export * from "./comuni";
export * from "./nave";
export * from "./risorse";
export * from "./crew";
export * from "./task";
export * from "./log";
export * from "./eventi";
export * from "./terminale";
export * from "./vale";
export * from "./missione";
export * from "./loadout";
export * from "./preparazione";
export * from "./storia";
export * from "./supermissione";
