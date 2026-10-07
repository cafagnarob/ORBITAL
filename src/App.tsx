/**
 * ============================================================================
 * App.tsx — Componente radice di ORBITAL: Ingresso → Preparazione → Missione
 * ============================================================================
 *
 * FLUSSO
 *   INGRESSO      la schermata del titolo: logo, seed, audio, INIZIA MISSIONE
 *   BRIEFING      l'ordine di missione: cosa si va a fare, obiettivo finale (v3.4)
 *   PREPARAZIONE  crew e loadout
 *   MISSIONE      in orbita attorno a E-17, fino all'epilogo
 * Dall'epilogo "Nuova missione" riporta all'INGRESSO con un seed nuovo.
 *
 * PERCHÉ NON UN ROUTER
 * Le schermate non sono "pagine" tra cui navigare avanti e indietro: sono
 * fasi della partita. Una volta partiti non si torna alla Preparazione
 * (la nave è già in orbita). Basta uno stato: quale fase stiamo giocando.
 *
 * MONITOR ACCESO O SPENTO
 * Ogni schermata spegne il monitor prima di cedere il posto alla
 * successiva, che quindi arriva "da spento" (daSpento) e si riaccende.
 * Solo la prima schermata, all'apertura del gioco, parte accendendosi.
 * `partite` conta le missioni giocate: entra nelle `key`, così React
 * ricrea le schermate da zero a ogni nuova partita.
 * ============================================================================
 */

import { useState } from "react";
import type { Preparazione } from "./engine/types";
import { impostaAtmosfera } from "./ui/audio";
import { SchermataBriefing } from "./ui/briefing/SchermataBriefing";
import { ProvaMinigiochi } from "./ui/minigiochi/ProvaMinigiochi";
import { ProvaPlancia } from "./ui/missione/plancia/ProvaPlancia";
import { SchermataIngresso } from "./ui/ingresso/SchermataIngresso";
import { SchermataMissione } from "./ui/missione/SchermataMissione";
import { SchermataPreparazione } from "./ui/preparazione/SchermataPreparazione";
import { seedCasuale, seedIniziale } from "./ui/seed";

type Fase = "INGRESSO" | "BRIEFING" | "PREPARAZIONE" | "MISSIONE";

/**
 * Banchi di prova (per chi sviluppa):
 *   ?prova=minigiochi → tutti i minigiochi;
 *   ?prova=plancia    → Plancia e strumenti della nave in ogni stato (v3.7.1).
 */
const PROVA = new URLSearchParams(window.location.search).get("prova");

export default function App() {
  if (PROVA === "minigiochi") return <ProvaMinigiochi />;
  if (PROVA === "plancia") return <ProvaPlancia />;
  return <Gioco />;
}

/** Il gioco vero: le fasi Ingresso → Briefing → Preparazione → Missione. */
function Gioco() {
  const [fase, setFase] = useState<Fase>("INGRESSO");
  const [seed, setSeed] = useState(seedIniziale);
  const [preparazione, setPreparazione] = useState<Preparazione | null>(null);
  const [partite, setPartite] = useState(0);

  function inizia(seedScelto: string) {
    setSeed(seedScelto);
    setFase("BRIEFING");
  }

  function avvia(prep: Preparazione) {
    setPreparazione(prep);
    setFase("MISSIONE");
  }

  /** Dall'epilogo: seed nuovo e di nuovo la schermata del titolo. */
  function nuovaPartita() {
    setSeed(seedCasuale());
    setPreparazione(null);
    setPartite((n) => n + 1);
    setFase("INGRESSO");
    impostaAtmosfera("INGRESSO");
  }

  switch (fase) {
    case "INGRESSO":
      return <SchermataIngresso key={partite} seed={seed} onInizia={inizia} daSpento={partite > 0} />;
    case "BRIEFING":
      return <SchermataBriefing key={`${partite}-${seed}`} seed={seed} onAccetta={() => setFase("PREPARAZIONE")} />;
    case "PREPARAZIONE":
      return <SchermataPreparazione key={`${partite}-${seed}`} seed={seed} onAvvia={avvia} daSpento />;
    case "MISSIONE":
      return preparazione ? (
        <SchermataMissione key={`${partite}-${seed}`} seed={seed} preparazione={preparazione} onNuovaPartita={nuovaPartita} />
      ) : null;
  }
}
