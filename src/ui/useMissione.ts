/**
 * ============================================================================
 * useMissione.ts — Il ponte tra React e il motore di gioco
 * ============================================================================
 *
 * COME FUNZIONA
 * useReducer di React vuole una funzione (stato, azione) → nuovoStato.
 * È esattamente la forma di applicaAzione: ci basta "fissare" il terzo
 * parametro (il contesto con il catalogo vero) e il motore diventa lo
 * stato di React. Nessuna logica di gioco vive nei componenti.
 *
 * PERCHÉ NIENTE useEffect
 * Ogni cambiamento nasce da un'azione inviata in un gestore di evento
 * (onClick → dispatch). Non c'è nulla da "sincronizzare" dopo il render:
 * lo stato nuovo è già completo quando React ridisegna.
 *
 * NOTA SU StrictMode
 * In sviluppo React chiama il reducer DUE volte per scovare effetti
 * collaterali nascosti. Il nostro reducer è puro (copia lo stato e non
 * tocca l'originale), quindi chiamarlo due volte dà lo stesso risultato.
 * È un'altra prova, gratuita, che l'architettura regge.
 * ============================================================================
 */

import { useReducer } from "react";
import { CONTESTO_GIOCO } from "../content/contesto";
import { creaMissioneIniziale } from "../content/missioneIniziale";
import { applicaAzione, type Azione } from "../engine/mission";
import type { StatoMissione } from "../engine/types";

function reducerGioco(stato: StatoMissione, azione: Azione): StatoMissione {
  return applicaAzione(stato, azione, CONTESTO_GIOCO);
}

export function useMissione(seed = "E17-73A9") {
  // Terzo argomento = "inizializzazione pigra": creaMissioneIniziale(seed)
  // viene chiamata una sola volta, al primo render, non a ogni render.
  const [stato, dispatch] = useReducer(reducerGioco, seed, creaMissioneIniziale);
  return { stato, dispatch };
}

/** Il tipo di dispatch, da passare ai componenti che inviano azioni. */
export type Dispatch = (azione: Azione) => void;
