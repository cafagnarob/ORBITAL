/**
 * ============================================================================
 * App.tsx — Componente radice di ORBITAL: Preparazione → Missione
 * ============================================================================
 *
 * FLUSSO
 *   1. Il seed della partita si sceglie una volta sola, all'avvio
 *      (useState con funzione: viene chiamata solo al primo render).
 *   2. Finché `preparazione` è null si mostra la schermata di Preparazione.
 *   3. AVVIA MISSIONE consegna le scelte del Capitano: da quel momento si
 *      mostra la Missione, che crea il suo stato a partire da quelle scelte.
 *
 * PERCHÉ NON UN ROUTER
 * Le schermate non sono "pagine" tra cui navigare avanti e indietro: sono
 * fasi della partita. Una volta partiti non si torna alla Preparazione
 * (la nave è già in orbita). Basta uno stato: quale fase stiamo giocando.
 * Dall'epilogo (missione conclusa) si torna alla Preparazione con un seed
 * nuovo: la `key` cambia, quindi React ricrea le schermate da zero.
 * Quando arriveranno Terra e Campagna (Fase 5), qui ci sarà la fase della
 * campagna.
 * ============================================================================
 */

import { useState } from "react";
import type { Preparazione } from "./engine/types";
import { SchermataMissione } from "./ui/missione/SchermataMissione";
import { SchermataPreparazione } from "./ui/preparazione/SchermataPreparazione";
import { impostaAtmosfera } from "./ui/audio";
import { seedCasuale, seedIniziale } from "./ui/seed";

export default function App() {
  const [seed, setSeed] = useState(seedIniziale);
  const [preparazione, setPreparazione] = useState<Preparazione | null>(null);

  /** Dall'epilogo: seed nuovo (casuale, si ignora ?seed=) e di nuovo la Preparazione. */
  function nuovaPartita() {
    setSeed(seedCasuale());
    setPreparazione(null);
    impostaAtmosfera("PREPARAZIONE");
  }

  if (preparazione === null) {
    // key={seed}: con un seed nuovo la Preparazione riparte da zero.
    return <SchermataPreparazione key={seed} seed={seed} onAvvia={setPreparazione} />;
  }
  return <SchermataMissione key={seed} seed={seed} preparazione={preparazione} onNuovaPartita={nuovaPartita} />;
}
