/**
 * ============================================================================
 * index.ts — Ciò che il resto del gioco può usare della missione
 * ============================================================================
 *
 * Esporta SOLO l'interfaccia pubblica: il reducer, le azioni, il contesto
 * e le funzioni di verifica che servono alla UI. Le funzioni interne che
 * modificano la bozza (avviaTask, concludiTask...) restano private alla
 * cartella: nessuno fuori dal reducer deve poter modificare lo stato.
 * ============================================================================
 */

export { applicaAzione } from "./reducer";
export type { Azione } from "./azioni";
export type { ContestoMissione } from "./contesto";
export { scoperteMancanti, verificaAssegnazione, verificaRimozione } from "./assegnazione";
export { verificaScelta } from "../eventi/attivazione";
export { normalizzaCodice, valutaCodice } from "../terminale/terminale";
export { comportamento, autonomia, livelloComportamento } from "../vale/comportamento";
export { contestazioneAperta, verificaContestazione } from "../vale/contestazioni";
export { integritaDati, stimaRischio } from "../vale/integritaDati";
export { direttiveEleggibili, scegliDirettiva } from "../vale/direttiva";
export { parametriNave } from "../nave/parametri";
export { membroOccupato, puoLavorare } from "./disponibilita";
