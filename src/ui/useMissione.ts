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
 *
 * IL TEMPO REALE (v3.3)
 * L'orologio reale (tempo/orologioReale.ts) batte un colpo a ogni minuto di
 * gioco. Ad ogni battito leggiamo l'ULTIMO stato dal ref: se la crew è in
 * operazioni (IN_ESECUZIONE, tra le 07:00 e le 22:00) chiediamo al motore
 * AVANZA_FINO dei minuti trascorsi. In ogni altro stato (pianificazione, decisione,
 * rapporto, missione finita) il battito si ignora: è il motore a decidere
 * quando il tempo si ferma, non l'orologio.
 * useSyncExternalStore collega l'orologio a React: lo accende quando la
 * schermata compare e lo spegne quando sparisce (vedi orologioReale.ts).
 * Il battito si collega dentro dispatch (un gestore di evento): il tempo
 * comincia a scorrere solo dopo la prima azione, «Avvia operazioni».
 * ============================================================================
 */

import { useRef, useState, useSyncExternalStore } from "react";
import { faseGiornata } from "../engine/clock";
import { CONTESTO_GIOCO } from "../content/contesto";
import { creaMissioneIniziale } from "../content/missioneIniziale";
import { applicaAzione, type Azione } from "../engine/mission";
import type { Preparazione, StatoMissione } from "../engine/types";
import { annunciaMissione } from "./audio";
import { creaOrologioReale, velocitaDiProva } from "./tempo/orologioReale";

export function useMissione(seed: string, preparazione: Preparazione) {
  // Inizializzazione pigra: la missione si crea una volta sola, al primo render.
  const [stato, setStato] = useState<StatoMissione>(() => creaMissioneIniziale(seed, preparazione));
  const ultimo = useRef(stato);

  // L'orologio si crea una volta sola (inizializzazione pigra di useState).
  const [orologio] = useState(() => creaOrologioReale(velocitaDiProva()));
  const tempoReale = useSyncExternalStore(orologio.iscriviti, orologio.leggi);

  /** Applica un'azione e restituisce lo stato nuovo (utile a chi deve proseguire). */
  function dispatch(azione: Azione): StatoMissione {
    orologio.collega(battito); // siamo in un gestore di evento: fuori dal render
    const prima = ultimo.current;
    const dopo = applicaAzione(prima, azione, CONTESTO_GIOCO);
    ultimo.current = dopo;
    setStato(dopo);
    annunciaMissione(prima, dopo, azione);
    return dopo;
  }

  /** Un battito dell'orologio reale: il tempo avanza solo durante le operazioni. */
  function battito(minuti: number): void {
    const s = ultimo.current;
    if (s.statoGioco !== "IN_ESECUZIONE" || faseGiornata(s.tempo) !== "OPERAZIONI") return;
    dispatch({ tipo: "AVANZA_FINO", tempo: s.tempo + minuti });
  }

  /** Il tempo sta scorrendo davvero in questo momento? */
  const scorre =
    stato.statoGioco === "IN_ESECUZIONE" &&
    faseGiornata(stato.tempo) === "OPERAZIONI" &&
    !tempoReale.pausa &&
    !tempoReale.nascosto;

  return {
    stato,
    dispatch,
    tempo: { ...tempoReale, scorre, impostaPausa: orologio.impostaPausa },
  };
}

/** Ciò che l'interfaccia sa dell'orologio reale (pausa, scheda nascosta…). */
export type TempoReale = ReturnType<typeof useMissione>["tempo"];

/** Il tipo di dispatch, da passare ai componenti che inviano azioni. */
export type Dispatch = (azione: Azione) => void;
