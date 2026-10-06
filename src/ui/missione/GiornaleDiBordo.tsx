/**
 * ============================================================================
 * GiornaleDiBordo.tsx — La pagina di diario del rapporto serale
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.2 (come il diario di 60 Seconds).
 *
 * Compare da sola quando il gioco è in RAPPORTO (22:00), sopra la
 * schermata: è il momento in cui la giornata diventa RACCONTO. Le righe
 * le ha scritte il motore (engine/storia/diario.ts): eventi, scelte, chi ha
 * cambiato idea su V.A.L.E., risorse che finiscono.
 * Chiudendola si chiude il rapporto e la notte scorre.
 *
 * Come la FinestraEvento, si "deriva" dallo stato: nessun useState per
 * aprirla o chiuderla, nessun useEffect.
 * ============================================================================
 */

import { useId } from "react";
import { paginaDiario } from "../../engine/storia/diario";
import { scomponiTempo } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import type { Dispatch } from "../useMissione";
import stili from "./GiornaleDiBordo.module.css";

export function GiornaleDiBordo({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  const idTitolo = useId();
  if (stato.statoGioco !== "RAPPORTO") return null;

  const { giorno } = scomponiTempo(stato.tempo);
  const righe = paginaDiario(stato, giorno);
  const r = stato.risorse;

  return (
    <div className={stili.sfondo}>
      <article className={stili.pagina} role="dialog" aria-modal="true" aria-labelledby={idTitolo}>
        <header className={stili.barra}>
          <h2 id={idTitolo}>GIORNALE DI BORDO</h2>
          <span>GIORNO {String(giorno).padStart(2, "0")}</span>
        </header>

        <ol className={stili.righe}>
          {righe.map((v, i) => (
            // Ogni riga compare con un piccolo ritardo, come battuta a macchina.
            <li key={i} style={{ animationDelay: `${i * 0.25}s` }}>
              {v.testo}
            </li>
          ))}
        </ol>

        <p className={stili.bilancio}>
          CIBO {r.cibo} · ACQUA {r.acqua} · O₂ {r.ossigeno} · ENERGIA {r.energia} · CARBURANTE {r.carburante}
        </p>

        <footer className={stili.piede}>
          <Pulsante variante="primario" onClick={() => dispatch({ tipo: "CHIUDI_RAPPORTO" })}>
            Buonanotte ▶
          </Pulsante>
        </footer>
      </article>
    </div>
  );
}
