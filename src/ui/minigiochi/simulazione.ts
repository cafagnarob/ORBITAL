/**
 * ============================================================================
 * simulazione.ts — Il "motore" dei minigiochi in tempo reale (60 fps)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9.2.
 *
 * IL PROBLEMA
 * Un ago che oscilla, una nave che deriva, un cursore che corre: cambiano
 * ogni fotogramma. Serve un ciclo (requestAnimationFrame) che parta quando
 * il minigioco compare e si fermi quando sparisce, SENZA useEffect.
 *
 * LA SOLUZIONE (la stessa dell'orologio reale)
 * Una piccola "simulazione" fuori da React:
 *   - `stato`   i numeri del gioco (posizione, tempo trascorso…);
 *   - `passo`   una funzione PURA: (stato, dt, comandi) → stato nuovo;
 *   - `comandi` ciò che il giocatore sta facendo (tasto premuto, cursore):
 *               i gestori di evento li cambiano con `imposta(...)`.
 * React la legge con useSyncExternalStore: quando il componente compare,
 * React chiama `iscriviti` → parte il ciclo; quando sparisce, la funzione
 * restituita lo ferma. A ogni fotogramma lo stato nuovo fa ridisegnare.
 *
 * FINE
 * `finito(stato)` dice quando il gioco è concluso (tempo scaduto…): il
 * ciclo si ferma e `alFine(stato)` viene chiamata UNA volta, fuori dal
 * render (siamo dentro requestAnimationFrame), quindi può avvisare il
 * genitore senza problemi.
 * ============================================================================
 */

import { useState, useSyncExternalStore } from "react";

export interface OpzioniSimulazione<S, C> {
  iniziale: S;
  comandi: C;
  /** (stato, secondi trascorsi dall'ultimo fotogramma, comandi) → stato nuovo. Pura. */
  passo: (stato: S, dt: number, comandi: C) => S;
  finito?: (stato: S) => boolean;
  alFine?: (stato: S) => void;
}

export interface Simulazione<S, C> {
  iscriviti: (avvisa: () => void) => () => void;
  leggi: () => S;
  /** Cambia (in parte) i comandi del giocatore: si chiama dai gestori di evento. */
  imposta: (parziali: Partial<C>) => void;
  /** I comandi attuali (più recenti dello stato, che si aggiorna al fotogramma). */
  comandi: () => C;
  /** Ferma il gioco subito (es. il giocatore ha "agganciato" il bersaglio). */
  concludi: (modifica?: (stato: S) => S) => void;
}

export function creaSimulazione<S, C>(opz: OpzioniSimulazione<S, C>): Simulazione<S, C> {
  let stato = opz.iniziale;
  let comandi = opz.comandi;
  let concluso = false;
  let richiesta: number | null = null;
  let ultimo = 0;
  const ascoltatori = new Set<() => void>();
  const avvisa = () => ascoltatori.forEach((a) => a());

  function termina() {
    if (concluso) return;
    concluso = true;
    ferma();
    opz.alFine?.(stato);
  }

  function fotogramma(adesso: number) {
    // dt in secondi, limitato: se la scheda era nascosta non si "salta" avanti.
    const dt = Math.min(0.1, (adesso - ultimo) / 1000);
    ultimo = adesso;
    stato = opz.passo(stato, dt, comandi);
    avvisa();
    if (opz.finito?.(stato)) termina();
    else richiesta = requestAnimationFrame(fotogramma);
  }

  function avvia() {
    if (concluso) return;
    ultimo = performance.now();
    richiesta = requestAnimationFrame(fotogramma);
  }
  function ferma() {
    if (richiesta !== null) cancelAnimationFrame(richiesta);
    richiesta = null;
  }

  return {
    iscriviti(a) {
      ascoltatori.add(a);
      if (ascoltatori.size === 1) avvia();
      return () => {
        ascoltatori.delete(a);
        if (ascoltatori.size === 0) ferma();
      };
    },
    leggi: () => stato,
    comandi: () => comandi,
    imposta(parziali) {
      comandi = { ...comandi, ...parziali };
    },
    concludi(modifica) {
      if (concluso) return;
      if (modifica) stato = modifica(stato);
      avvisa();
      termina();
    },
  };
}

/**
 * L'hook: crea la simulazione UNA volta (inizializzazione pigra di
 * useState) e la collega a React. Restituisce lo stato attuale e la
 * simulazione (per imposta/concludi nei gestori di evento).
 */
export function useSimulazione<S, C>(crea: () => OpzioniSimulazione<S, C>): [S, Simulazione<S, C>] {
  const [sim] = useState(() => creaSimulazione(crea()));
  const stato = useSyncExternalStore(sim.iscriviti, sim.leggi);
  return [stato, sim];
}

/** Un numero casuale tra a e b (i minigiochi non toccano il determinismo della partita). */
export function tra(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

/** Limita tra min e max. */
export function limita(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

/** Le props comuni a tutti i minigiochi. */
export interface PropsGioco {
  difficolta: 1 | 2 | 3;
  /** Chiamata una volta, a gioco finito, con il punteggio 0–1. */
  onFine: (punteggio: number) => void;
}
