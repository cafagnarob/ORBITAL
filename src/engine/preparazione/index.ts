/**
 * ============================================================================
 * preparazione/index.ts — Punto d'ingresso del modulo Preparazione
 * ============================================================================
 *
 * La UI importa da qui, non dai singoli file: se un domani spostiamo una
 * funzione da un file all'altro, cambia solo questo elenco.
 * ============================================================================
 */

export { applicaPreparazione } from "./reducer";
export { carico, riepilogoPreparazione, risorseIniziali, spazioOccupato, tagABordo, type Riepilogo } from "./riepilogo";
export { fattibilita, problemiPreparazione, taskNonDisponibili } from "./verifica";
export { attrezzaturaIndispensabile, indispensabileMancante, type Indispensabile } from "./indispensabile";
