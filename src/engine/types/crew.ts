/**
 * ============================================================================
 * crew.ts — Tipi dei membri della crew
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.
 *
 * COSA NON C'È QUI, E PERCHÉ
 * La coda dei task di un membro NON sta in MembroCrew, ma in StatoMissione.
 * Motivo: il membro della crew sopravvive tra le missioni (campagna), la sua
 * coda di lavoro esiste solo durante una missione. Ogni dato va messo nel
 * livello che ha la sua stessa durata di vita.
 * ============================================================================
 */

import type { IdMembro, IdTratto, Percentuale } from "./comuni";
import type { Luogo } from "./nave";

// ----------------------------------------------------------------------------
// RUOLI E ABILITÀ
// ----------------------------------------------------------------------------

export const RUOLI = [
  "INGEGNERE",
  "SCIENZIATO",
  "PILOTA",
  "MEDICO",
  "SICUREZZA_EVA",
  "GENERALISTA",
] as const;
export type Ruolo = (typeof RUOLI)[number];

/**
 * Abilità TECNICHE: quelle che un task può richiedere come abilità
 * principale o secondaria (DESIGN §9).
 */
export const ABILITA_TECNICHE = ["INGEGNERIA", "SCIENZA", "PILOTAGGIO", "MEDICINA", "EVA"] as const;
export type AbilitaTecnica = (typeof ABILITA_TECNICHE)[number];

/**
 * Abilità GENERALI: non sono il "mestiere" richiesto da un task, ma
 * modificano qualunque task (velocità → durata, precisione → esito).
 * Tenerle separate impedisce di scrivere per errore un task la cui
 * abilità principale sia "VELOCITA".
 */
export const ABILITA_GENERALI = ["VELOCITA", "PRECISIONE"] as const;
export type AbilitaGenerale = (typeof ABILITA_GENERALI)[number];

/** Tutte le abilità di un membro. */
export type Abilita = AbilitaTecnica | AbilitaGenerale;

/** Valore di ogni abilità, da 0 a 10. */
export type ValoriAbilita = Record<Abilita, number>;

// ----------------------------------------------------------------------------
// PERSONALITÀ
// ----------------------------------------------------------------------------

/**
 * Tre assi indipendenti (DESIGN §7.3). Non sono modificatori numerici:
 * influenzano dialoghi, raccomandazioni ed eventi.
 */
export interface Personalita {
  approccio: "CAUTO" | "AMANTE_DEL_RISCHIO" | "PRAGMATICO";
  socialita: "LEALE" | "EMPATICO" | "INDIPENDENTE";
  mentalita: "CURIOSO" | "DISCIPLINATO" | "CALMO";
}

// ----------------------------------------------------------------------------
// STATO E MEMBRO
// ----------------------------------------------------------------------------

/**
 * Condizione del membro. Non coincide con la salute: DISPERSO non dipende
 * dalla salute, e MORTO è permanente anche se un bug alzasse la salute.
 */
export const STATI_MEMBRO = ["SANO", "FERITO", "CRITICO", "INCOSCIENTE", "DISPERSO", "MORTO"] as const;
export type StatoMembro = (typeof STATI_MEMBRO)[number];

/** Un membro della crew. */
export interface MembroCrew {
  id: IdMembro;
  /** Nome mostrato al giocatore, es. "Mara". */
  nome: string;
  ruolo: Ruolo;
  /** Peso in kg: conta nel carico operativo della nave (DESIGN §11.1). */
  peso: number;
  abilita: ValoriAbilita;
  tratto: IdTratto;
  personalita: Personalita;
  /** 0–100. */
  salute: Percentuale;
  /** 0–100. La fascia (BASSA, MODERATA...) si calcola, non si salva. */
  fatica: Percentuale;
  /** Fiducia personale in V.A.L.E., 0–100, iniziale 50 (DESIGN §7.5). */
  fiduciaVale: Percentuale;
  /**
   * FAME e SETE (v3.4), in punti 0–6: salgono con le razioni negate e
   * scendono con quelle piene. Il LIVELLO (0–3) si calcola, non si salva
   * (engine/crew/razioni.ts).
   */
  fame: number;
  sete: number;
  /** Dove si trova ora. */
  posizione: Luogo;
  stato: StatoMembro;
}
