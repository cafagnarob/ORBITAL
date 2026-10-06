/**
 * ============================================================================
 * useMissione.ts — Il ponte tra React e il motore di gioco
 * ============================================================================
 *
 * COME FUNZIONA
 * Lo stato della missione vive in React (useState); ogni azione passa dal
 * motore: applicaAzione(stato, azione, contesto) → stato nuovo. Nessuna
 * logica di gioco vive nei componenti.
 *
 * PERCHÉ NON PIÙ useReducer
 * Con useReducer non si vede mai "prima e dopo" nello stesso punto: il
 * reducer gira dentro React e non deve fare altro che calcolare. Ma ora,
 * dopo ogni azione, dobbiamo anche SUONARE e far PARLARE V.A.L.E. (le sue
 * frasi nuove nel log). Sono effetti collaterali: il loro posto è il
 * gestore dell'evento, non il render e non il reducer (che deve restare
 * puro, React lo chiama anche due volte in sviluppo).
 * Quindi la nostra `dispatch`:
 *   1. legge lo stato attuale (dal ref: sempre il più recente, anche con
 *      due clic rapidissimi prima che React ridisegni);
 *   2. calcola il nuovo stato con il motore;
 *   3. lo salva (ref + setState → React ridisegna);
 *   4. annuncia le novità all'audio (suoni, voce, atmosfera).
 * Tutto dentro un gestore di evento: niente useEffect.
 *
 * useRef = una "scatola" che sopravvive ai render ma, se cambia, non
 * fa ridisegnare. Perfetta per "l'ultimo stato calcolato".
 * ============================================================================
 */

import { useRef, useState } from "react";
import { CONTESTO_GIOCO } from "../content/contesto";
import { creaMissioneIniziale } from "../content/missioneIniziale";
import { applicaAzione, type Azione } from "../engine/mission";
import type { Preparazione, StatoMissione } from "../engine/types";
import { annunciaMissione } from "./audio";

export function useMissione(seed: string, preparazione: Preparazione) {
  // Inizializzazione pigra: la missione si crea una volta sola, al primo render.
  const [stato, setStato] = useState<StatoMissione>(() => creaMissioneIniziale(seed, preparazione));
  const ultimo = useRef(stato);

  function dispatch(azione: Azione): void {
    const prima = ultimo.current;
    const dopo = applicaAzione(prima, azione, CONTESTO_GIOCO);
    ultimo.current = dopo;
    setStato(dopo);
    annunciaMissione(prima, dopo, azione);
  }

  return { stato, dispatch };
}

/** Il tipo di dispatch, da passare ai componenti che inviano azioni. */
export type Dispatch = (azione: Azione) => void;
