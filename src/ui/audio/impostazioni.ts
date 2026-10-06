/**
 * ============================================================================
 * impostazioni.ts — Volumi dell'audio (le due manopole della cornice)
 * ============================================================================
 *
 * Due canali, ognuno con 4 livelli (0 = spento … 3 = massimo):
 *   ambiente → ronzio della nave, ventilazione, suoni dell'interfaccia
 *   voce     → la voce di V.A.L.E. (e il suo "bip" prima di parlare)
 *
 * UN PICCOLO "STORE" FUORI DA REACT
 * I volumi servono a più componenti (le manopole) e al motore audio, che
 * non è React. Li teniamo in un modulo con tre funzioni:
 *   leggiVolumi()        → il valore attuale
 *   iscriviti(callback)  → avvisami quando cambia
 *   impostaVolume(…)     → cambia e avvisa tutti
 * React li legge con useSyncExternalStore: è l'hook ufficiale per
 * "stato che vive fuori da React", e NON richiede useEffect.
 *
 * IMMUTABILITÀ: a ogni cambio creiamo un oggetto NUOVO. useSyncExternalStore
 * confronta gli oggetti con ===: se modificassimo quello vecchio, React non
 * si accorgerebbe del cambio.
 *
 * I volumi si ricordano tra una visita e l'altra (localStorage). Se il
 * browser lo blocca (navigazione privata), si riparte da spento: per
 * questo ogni accesso è dentro try/catch.
 * ============================================================================
 */

import { useSyncExternalStore } from "react";

export type Canale = "ambiente" | "voce";
export type Volumi = Readonly<Record<Canale, number>>;

export const LIVELLO_MASSIMO = 3;
/** Guadagno (0–1) per ogni livello: la percezione del volume non è lineare. */
export const GUADAGNO_PER_LIVELLO = [0, 0.35, 0.65, 1] as const;

const CHIAVE = "orbital.audio";
const SPENTO: Volumi = { ambiente: 0, voce: 0 };

function carica(): Volumi {
  try {
    const salvato = JSON.parse(localStorage.getItem(CHIAVE) ?? "null") as Partial<Volumi> | null;
    if (!salvato) return SPENTO;
    return {
      ambiente: limita(salvato.ambiente ?? 0),
      voce: limita(salvato.voce ?? 0),
    };
  } catch {
    return SPENTO;
  }
}

/** Qualunque numero → un livello valido 0…3. */
export function limita(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(LIVELLO_MASSIMO, Math.round(n))) : 0;
}

/** Il livello successivo girando la manopola: 0 → 1 → 2 → 3 → 0. */
export function livelloSuccessivo(n: number): number {
  return (limita(n) + 1) % (LIVELLO_MASSIMO + 1);
}

let volumi: Volumi = carica();
const ascoltatori = new Set<() => void>();

export function leggiVolumi(): Volumi {
  return volumi;
}

export function iscriviti(callback: () => void): () => void {
  ascoltatori.add(callback);
  return () => ascoltatori.delete(callback);
}

export function impostaVolume(canale: Canale, livello: number): void {
  volumi = { ...volumi, [canale]: limita(livello) };
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(volumi));
  } catch {
    // Salvataggio non disponibile: pazienza, vale solo per questa visita.
  }
  ascoltatori.forEach((a) => a());
}

/** Hook React: i volumi attuali, aggiornati quando una manopola gira. */
export function useVolumi(): Volumi {
  return useSyncExternalStore(iscriviti, leggiVolumi);
}
