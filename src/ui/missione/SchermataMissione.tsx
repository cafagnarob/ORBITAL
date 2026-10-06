/**
 * ============================================================================
 * SchermataMissione.tsx — La schermata di gioco: compone tutti i pannelli
 * ============================================================================
 *
 * LAYOUT RESPONSIVE
 *   Desktop (≥ 1100px): tre colonne a tutta altezza, ogni pannello scorre
 *     al suo interno, come la console del prototipo.
 *       sinistra: Equipaggio, Risorse · centro: V.A.L.E., Scoperte
 *       destra: Pianifica, Nave, Pianeta
 *   Tablet e mobile (< 1100px): una colonna sola con SCHEDE in alto
 *     (Crew · V.A.L.E. · Task · Nave). Si vede una scheda alla volta e la
 *     barra dei comandi resta sempre in fondo allo schermo.
 *
 * COME FUNZIONANO LE SCHEDE
 * Ogni pannello sa a quale scheda appartiene. Quelli delle altre schede
 * ricevono la classe `nascostoMobile`, che li nasconde SOLO sotto i 1100px
 * (media query nel CSS). Su desktop la classe non ha effetto e si vede tutto.
 * Così c'è un solo albero di componenti per entrambi i layout.
 *
 * La FinestraEvento sta sopra a tutto e compare da sola quando il motore
 * è in DECISIONE: la schermata non deve "aprirla", la deriva dallo stato.
 *
 * ACCENSIONE DEL MONITOR (useAccensione)
 * Il tubo si accende quando arriva la schermata (dopo il lancio) e si
 * spegne/riaccende alla BUONANOTTE: al buio passa la notte, e ci si
 * risveglia con "GIORNO 03 · 06:00 · BUONGIORNO, CAPITANO".
 *
 * CORNICE E TERMINALE
 * Tutto è montato dentro <Monitor>, la cornice retro-futurista. Il pulsante
 * SVC sulla sua fascia frontale apre il Terminale SVC-07: aperto/chiuso è
 * stato dell'INTERFACCIA (useState), mentre ciò che si fa nel terminale
 * (frammenti, codici, livello) è stato della PARTITA (reducer).
 * ============================================================================
 */

import { useState } from "react";
import { minutoDelGiorno, ORARIO_RISVEGLIO, scomponiTempo } from "../../engine/clock";
import { useAccensione } from "../cornice/useAccensione";
import { suona } from "../audio";
import type { Preparazione } from "../../engine/types";
import { Monitor } from "../cornice/Monitor";
import { PannelloFrontale } from "../cornice/PannelloFrontale";
import { TerminaleSvc } from "../terminale/TerminaleSvc";
import { useMissione } from "../useMissione";
import { BarraComandi } from "./BarraComandi";
import { CanaleVale } from "./CanaleVale";
import { FinestraEvento } from "./FinestraEvento";
import { GiornaleDiBordo } from "./GiornaleDiBordo";
import { SchermataEpilogo } from "./SchermataEpilogo";
import { Intestazione } from "./Intestazione";
import { PannelloCrew } from "./PannelloCrew";
import { PannelloNave } from "./PannelloNave";
import { PannelloPianeta } from "./PannelloPianeta";
import { PannelloPianifica } from "./PannelloPianifica";
import { PannelloRisorse } from "./PannelloRisorse";
import { PannelloScoperte } from "./PannelloScoperte";
import stili from "./SchermataMissione.module.css";

const SCHEDE = [
  { id: "crew", nome: "Crew" },
  { id: "vale", nome: "V.A.L.E." },
  { id: "task", nome: "Task" },
  { id: "nave", nome: "Nave" },
] as const;
type IdScheda = (typeof SCHEDE)[number]["id"];

interface Props {
  seed: string;
  /** Le scelte fatte nella schermata di Preparazione. */
  preparazione: Preparazione;
  /** Dall'epilogo: si torna alla Preparazione con un seed nuovo. */
  onNuovaPartita: () => void;
}

export function SchermataMissione({ seed, preparazione, onNuovaPartita }: Props) {
  const { stato, dispatch } = useMissione(seed, preparazione);
  const [scheda, setScheda] = useState<IdScheda>("vale");
  // Apertura del Terminale SVC-07: stato dell'interfaccia, non della partita.
  const [terminaleAperto, setTerminaleAperto] = useState(false);
  // Il tubo del monitor: si accende all'arrivo in orbita e ogni mattina.
  // Arriva sempre a monitor spento (dalla Preparazione): bagliore, poi accensione.
  const tubo = useAccensione(true);

  /**
   * BUONANOTTE: il monitor si spegne; al buio si chiude il rapporto e la
   * notte scorre fino al risveglio (06:00); poi il monitor si riaccende sul
   * nuovo giorno. Il giocatore non vede il "salto" di otto ore: lo vive.
   */
  function buonanotte() {
    tubo.spegni(() => {
      dispatch({ tipo: "CHIUDI_RAPPORTO" });
      dispatch({ tipo: "AVANZA" });
    }, true);
  }

  /** Dall'epilogo: il monitor si spegne, poi si torna alla Preparazione. */
  function nuovaPartita() {
    tubo.spegni(onNuovaPartita);
  }

  // La scritta che appare mentre il tubo si scalda: il giorno e l'ora.
  const { giorno } = scomponiTempo(stato.tempo);
  const didascalia =
    minutoDelGiorno(stato.tempo) === ORARIO_RISVEGLIO
      ? `GIORNO ${String(giorno).padStart(2, "0")} · 06:00 · BUONGIORNO, CAPITANO`
      : `ORBITA E-17 · GIORNO ${String(giorno).padStart(2, "0")}`;

  /** Classe per un blocco: nascosto su mobile se non è della scheda attiva. */
  const blocco = (di: IdScheda, extra = "") => `${stili.blocco} ${extra} ${di === scheda ? "" : stili.nascostoMobile}`;

  const frontale = (
    <PannelloFrontale
      onApriTerminale={() => setTerminaleAperto(true)}
      allerta={stato.statoGioco === "DECISIONE"}
      standby={tubo.fase === "SPENTO" || tubo.fase === "SPEGNIMENTO"}
    />
  );

  return (
    <Monitor frontale={frontale} fase={tubo.fase} onFineTransizione={tubo.fineTransizione} didascalia={didascalia}>
      <div className={stili.schermo}>
        <Intestazione stato={stato} />

        <nav className={stili.schede} aria-label="Sezioni">
          {SCHEDE.map((s) => (
            <button
              key={s.id}
              type="button"
              className={stili.scheda}
              aria-pressed={s.id === scheda}
              onClick={() => {
                suona("CLIC");
                setScheda(s.id);
              }}
            >
              {s.nome}
            </button>
          ))}
        </nav>

        <main className={stili.griglia}>
          <div className={stili.colonna}>
            <div className={blocco("crew", stili.cresce)}>
              <PannelloCrew stato={stato} dispatch={dispatch} />
            </div>
            <div className={blocco("nave")}>
              <PannelloRisorse stato={stato} />
            </div>
          </div>

          <div className={stili.colonna}>
            <div className={blocco("vale", stili.cresce)}>
              <CanaleVale stato={stato} dispatch={dispatch} />
            </div>
            <div className={blocco("vale")}>
              <PannelloScoperte stato={stato} />
            </div>
          </div>

          <div className={stili.colonna}>
            <div className={blocco("task")}>
              <PannelloPianifica stato={stato} dispatch={dispatch} />
            </div>
            <div className={blocco("nave", stili.cresce)}>
              <PannelloNave stato={stato} />
            </div>
            <div className={blocco("nave")}>
              <PannelloPianeta seedPartita={stato.seed} />
            </div>
          </div>
        </main>

        <BarraComandi stato={stato} dispatch={dispatch} onChiudiRapporto={buonanotte} />

        {/* Compare solo quando c'è una decisione in attesa (stato DECISIONE). */}
        <FinestraEvento stato={stato} dispatch={dispatch} />

        {/* Al rapporto serale: la pagina del giornale di bordo (v3.0). */}
        <GiornaleDiBordo stato={stato} onBuonanotte={buonanotte} />

        {/* A missione conclusa: finale, crew, direttiva, diario (v3.0). */}
        <SchermataEpilogo stato={stato} onNuovaPartita={nuovaPartita} />

        {terminaleAperto && (
          <TerminaleSvc stato={stato} dispatch={dispatch} onChiudi={() => setTerminaleAperto(false)} />
        )}
      </div>
    </Monitor>
  );
}
