/**
 * ============================================================================
 * derivati.ts — I numeri che la Plancia mostra, calcolati dallo stato
 * ============================================================================
 *
 * Funzioni pure (niente React): si testano da sole (tests/ui/plancia.test.ts)
 * e tengono i componenti puliti, solo "disegno".
 *
 * PERCHÉ UN FILE A PARTE
 * Vite ricarica al volo i file dei componenti (Fast Refresh) solo se
 * esportano SOLO componenti. Le funzioni di supporto vivono quindi qui.
 * ============================================================================
 */

import { CONTESTO_GIOCO } from "../../../content/contesto";
import type { Tratta } from "../../../engine/storia/viaggio";
import type { StatoMissione } from "../../../engine/types";

/** In orbita: stiamo osservando, acquisendo, o abbiamo già acquisito? */
export type ModoOrbita = "OSSERVAZIONE" | "ACQUISIZIONE" | "ACQUISITA";

/** I tag dei task che puntano i sensori sul cratere. */
const TAG_SCANSIONE = ["OBIETTIVO", "CRATERE"];

export function modoOrbita(stato: StatoMissione): ModoOrbita {
  const inCorso = Object.values(stato.tasks).some(
    (t) => t.stato === "IN_CORSO" && CONTESTO_GIOCO.catalogoTask[t.idDefinizione]?.tag.some((tag) => TAG_SCANSIONE.includes(tag)),
  );
  if (inCorso) return "ACQUISIZIONE";
  if (stato.conoscenza.scoperte.includes("AREA_ACQUISITA")) return "ACQUISITA";
  return "OSSERVAZIONE";
}

/**
 * Distanza "di scena" dalla destinazione, in unità astronomiche (UA).
 * Il gioco non simula l'astronomia: è un numero credibile che scende col
 * progresso, così il giocatore SENTE l'avvicinamento.
 */
const DISTANZA_TOTALE_UA = 1.84;
export function distanzaUA(tratta: Tratta): string {
  return ((1 - tratta.progresso) * DISTANZA_TOTALE_UA).toFixed(2);
}

/** 2590 minuti → "T−43:10" (ore:minuti all'arrivo). */
export function contoAllaRovescia(minuti: number): string {
  const h = Math.floor(minuti / 60);
  const m = Math.round(minuti % 60);
  return `T−${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Il raggio del pianeta di destinazione nella vista (unità SVG): piccolo
 * alla partenza, grande all'arrivo. La radice quadrata fa crescere il
 * pianeta più in fretta all'inizio, come una vera prospettiva.
 */
export function raggioDestinazione(progresso: number): number {
  return 7 + Math.sqrt(progresso) * 41;
}

/**
 * Numeri "finti ma stabili" per le piccole decorazioni (barre dello spettro,
 * coordinate): derivati dal seed della partita, quindi uguali a ogni
 * ridisegno ma diversi tra una partita e l'altra.
 */
export function numeriDalSeed(seed: string, quanti: number, max: number): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: quanti }, () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return Math.abs(h % max);
  });
}
