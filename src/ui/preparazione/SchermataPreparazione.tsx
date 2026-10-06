/**
 * ============================================================================
 * SchermataPreparazione.tsx — Prima di partire: crew, moduli, equipaggiamento, stiva
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1 (selezione crew), §11 (loadout),
 * §14.4 (fattibilità).
 *
 * COSA FA
 * Compone i tre pannelli della Preparazione dentro la stessa cornice del
 * monitor della Missione, e la barra di avvio in fondo. Lo stato (le scelte)
 * vive in usePreparazione; questa schermata decide solo DOVE mostrare cosa.
 *
 * LAYOUT RESPONSIVE (stesso schema della Missione)
 *   Desktop (≥ 1100px): tre colonne a tutta altezza
 *     Candidati │ Nave + Loadout (moduli · equipaggiamento · stiva) │ Riepilogo
 *   La nave (NaveSezione) sta sopra il catalogo: ogni scelta si vede subito
 *   "montata" sullo schema.
 *   Tablet e mobile: una colonna, SCHEDE in alto (Crew · Loadout ·
 *     Riepilogo) e la barra AVVIA MISSIONE sempre visibile in fondo.
 *
 * AUDIO
 * L'atmosfera di partenza è "PREPARAZIONE" (hangar). Premendo AVVIA, nello
 * stesso gestore del clic: rombo dei motori, V.A.L.E. conferma la
 * fattibilità e l'inserimento in orbita, l'ambiente passa a "MISSIONE".
 *
 * AVVIO
 * onAvvia riceve le scelte e App.tsx passa alla Missione. Il seed della
 * partita arriva da App: si mostra qui perché è già deciso, e la direttiva
 * di V.A.L.E. verrà sorteggiata con questo seed TRA quelle possibili con il
 * loadout scelto (DESIGN §11.4). Il giocatore non lo sa: vede solo che
 * "cosa porti" cambia "cosa può succedere".
 * ============================================================================
 */

import { useState } from "react";
import type { Preparazione } from "../../engine/types";
import { Monitor } from "../cornice/Monitor";
import { PannelloFrontale } from "../cornice/PannelloFrontale";
import { FRASI_APERTURA } from "../../content/missioneIniziale";
import { FRASI_FATTIBILITA } from "../../content/vale";
import { impostaAtmosfera, parla, suona } from "../audio";
import { usePreparazione } from "../usePreparazione";
import { Finestra } from "../components/Finestra";
import { BarraAvvio } from "./BarraAvvio";
import { NaveSezione } from "./NaveSezione";
import { PannelloRiepilogo } from "./PannelloRiepilogo";
import stili from "./SchermataPreparazione.module.css";
import { SelezioneCrew } from "./SelezioneCrew";
import { SelezioneLoadout } from "./SelezioneLoadout";

const SCHEDE = [
  { id: "crew", nome: "Crew" },
  { id: "loadout", nome: "Loadout" },
  { id: "riepilogo", nome: "Riepilogo" },
] as const;
type IdScheda = (typeof SCHEDE)[number]["id"];

interface Props {
  seed: string;
  onAvvia: (preparazione: Preparazione) => void;
}

export function SchermataPreparazione({ seed, onAvvia }: Props) {
  const { prep, dispatch, riepilogo, problemi, fattibilita } = usePreparazione();
  const [scheda, setScheda] = useState<IdScheda>("crew");

  /** Partenza: rombo dei motori, V.A.L.E. conferma, e si passa alla Missione. */
  function avvia() {
    suona("AVVIO");
    parla([FRASI_FATTIBILITA[fattibilita], FRASI_APERTURA[0]]);
    impostaAtmosfera("MISSIONE");
    onAvvia(prep);
  }

  function cambiaScheda(id: IdScheda) {
    suona("CLIC");
    setScheda(id);
  }

  /** Su mobile si vede solo il pannello della scheda attiva. */
  const blocco = (di: IdScheda) => `${stili.blocco} ${di === scheda ? "" : stili.nascostoMobile}`;

  return (
    <Monitor frontale={<PannelloFrontale onApriTerminale={null} allerta={false} />}>
      <div className={stili.schermo}>
        <header className={stili.intestazione}>
          <span className={stili.logo}>ORBITAL</span>
          <span className={stili.sistema}>VALE-OS 4.1 ▸ PREPARAZIONE</span>
          <span className={stili.fase}>PRE-LANCIO</span>
          <span className={stili.destinazione}>DESTINAZIONE E-17 · CRATERE SETTENTRIONALE</span>
          <span className={stili.seed}>PARTITA {seed}</span>
        </header>

        <nav className={stili.schede} aria-label="Sezioni">
          {SCHEDE.map((s) => (
            <button
              key={s.id}
              type="button"
              className={stili.scheda}
              aria-pressed={s.id === scheda}
              onClick={() => cambiaScheda(s.id)}
            >
              {s.nome}
            </button>
          ))}
        </nav>

        <main className={stili.griglia}>
          <div className={blocco("crew")}>
            <SelezioneCrew prep={prep} dispatch={dispatch} />
          </div>
          <div className={`${blocco("loadout")} ${stili.colonnaNave}`}>
            {/* La nave che si riempie mentre scegli, sopra il catalogo. */}
            <Finestra titolo="ORB-1 · Configurazione" variante="cornice" destra={`${prep.crew.length} A BORDO`}>
              <NaveSezione prep={prep} riepilogo={riepilogo} />
            </Finestra>
            <SelezioneLoadout prep={prep} riepilogo={riepilogo} dispatch={dispatch} />
          </div>
          <div className={blocco("riepilogo")}>
            <PannelloRiepilogo
              prep={prep}
              riepilogo={riepilogo}
              problemi={problemi}
              fattibilita={fattibilita}
              dispatch={dispatch}
            />
          </div>
        </main>

        <BarraAvvio
          prep={prep}
          riepilogo={riepilogo}
          fattibilita={fattibilita}
          onAvvia={avvia}
          onMostraProblemi={() => cambiaScheda("riepilogo")}
        />
      </div>
    </Monitor>
  );
}
