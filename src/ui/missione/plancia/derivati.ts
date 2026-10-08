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
import type { FormaBersaglio, StatoMissione } from "../../../engine/types";

/** In orbita: stiamo osservando, acquisendo, o abbiamo già acquisito? */
export type ModoOrbita = "OSSERVAZIONE" | "ACQUISIZIONE" | "ACQUISITA";

/**
 * I tag dei task che puntano i sensori sul bersaglio: OBIETTIVO è il task
 * finale di ogni supermissione (v3.8), CRATERE le scansioni di E-17.
 */
const TAG_SCANSIONE = ["OBIETTIVO", "CRATERE"];

export function modoOrbita(stato: StatoMissione): ModoOrbita {
  const inCorso = Object.values(stato.tasks).some(
    (t) => t.stato === "IN_CORSO" && CONTESTO_GIOCO.catalogoTask[t.idDefinizione]?.tag.some((tag) => TAG_SCANSIONE.includes(tag)),
  );
  if (inCorso) return "ACQUISIZIONE";
  // v3.8: ogni supermissione, quando riesce, registra OBIETTIVO_PRIMARIO.
  if (stato.conoscenza.scoperte.includes("OBIETTIVO_PRIMARIO")) return "ACQUISITA";
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

/**
 * Dove sta il PUNTO D'INTERESSE sulla sagoma del bersaglio (v3.8), in
 * frazioni del raggio rispetto al centro: lì si posano il bersaglio
 * luminoso e il mirino. Deve combaciare con SagomaBersaglio.tsx.
 */
export function puntoInteresse(forma: FormaBersaglio): { kx: number; ky: number } {
  switch (forma) {
    case "PIANETA":
      return { kx: 0.37, ky: -0.5 }; // il Cratere Settentrionale, in alto a destra
    case "STAZIONE":
      return { kx: 0, ky: -0.2 }; // il boccaporto sul mozzo
    case "ASTEROIDE":
      return { kx: 0.25, ky: -0.3 }; // la zona regolare (la "cicatrice")
    case "COMETA":
      return { kx: 0.2, ky: 0.2 }; // il nucleo
    case "RELITTO":
      return { kx: 0.3, ky: -0.05 }; // il vano del nucleo di memoria
  }
}

/**
 * La riga di coordinate sotto la vista d'orbita. Per un pianeta latitudine
 * e longitudine; per gli altri bersagli, piccoli e vicini, la distanza in
 * metri (un numero stabile ricavato dal seed).
 */
export function rigaCoordinate(forma: FormaBersaglio, seed: string): string {
  if (forma === "PIANETA") return "LAT 71.4°N · LON 012.8°E · QUOTA 412 km";
  const [distanza = 0, deriva = 0] = numeriDalSeed(seed, 2, 100);
  return `DIST ${200 + distanza * 3} m · DERIVA ${(deriva / 40).toFixed(2)} m/s`;
}
