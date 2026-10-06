/**
 * ============================================================================
 * SchermataMissione.tsx — La schermata di gioco: compone tutti i pannelli
 * ============================================================================
 *
 * LAYOUT RESPONSIVE
 *   Desktop (≥ 1100px): tre colonne a tutta altezza, ogni pannello scorre
 *     al suo interno, come la console del prototipo.
 *       sinistra: Equipaggio · centro: V.A.L.E. · destra: Pianifica, Nave, Pianeta
 *   Tablet e mobile (< 1100px): una colonna sola con SCHEDE in alto
 *     (Crew · V.A.L.E. · Task · Nave). Si vede una scheda alla volta e la
 *     barra dei comandi resta sempre in fondo allo schermo.
 *
 * COME FUNZIONANO LE SCHEDE
 * Ogni pannello sa a quale scheda appartiene. Quelli delle altre schede
 * ricevono la classe `nascostoMobile`, che li nasconde SOLO sotto i 1100px
 * (media query nel CSS). Su desktop la classe non ha effetto e si vede tutto.
 * Così c'è un solo albero di componenti per entrambi i layout.
 * ============================================================================
 */

import { useState } from "react";
import { useMissione } from "../useMissione";
import { BarraComandi } from "./BarraComandi";
import { CanaleVale } from "./CanaleVale";
import { Intestazione } from "./Intestazione";
import { PannelloCrew } from "./PannelloCrew";
import { PannelloNave } from "./PannelloNave";
import { PannelloPianeta } from "./PannelloPianeta";
import { PannelloPianifica } from "./PannelloPianifica";
import { PannelloRisorse } from "./PannelloRisorse";
import stili from "./SchermataMissione.module.css";

const SCHEDE = [
  { id: "crew", nome: "Crew" },
  { id: "vale", nome: "V.A.L.E." },
  { id: "task", nome: "Task" },
  { id: "nave", nome: "Nave" },
] as const;
type IdScheda = (typeof SCHEDE)[number]["id"];

export function SchermataMissione() {
  const { stato, dispatch } = useMissione();
  const [scheda, setScheda] = useState<IdScheda>("vale");

  /** Classe per un blocco: nascosto su mobile se non è della scheda attiva. */
  const blocco = (di: IdScheda, extra = "") =>
    `${stili.blocco} ${extra} ${di === scheda ? "" : stili.nascostoMobile}`;

  return (
    <div className={stili.schermo}>
      <Intestazione stato={stato} />

      <nav className={stili.schede} aria-label="Sezioni">
        {SCHEDE.map((s) => (
          <button
            key={s.id}
            type="button"
            className={stili.scheda}
            aria-pressed={s.id === scheda}
            onClick={() => setScheda(s.id)}
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
            <CanaleVale stato={stato} />
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
            <PannelloPianeta />
          </div>
        </div>
      </main>

      <BarraComandi stato={stato} dispatch={dispatch} />
    </div>
  );
}
