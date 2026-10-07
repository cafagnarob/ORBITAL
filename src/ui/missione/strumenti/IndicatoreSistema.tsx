/**
 * ============================================================================
 * IndicatoreSistema.tsx — Un sistema della nave come strumento a lancetta
 * ============================================================================
 *
 * Riferimento grafico: i tre quadranti piccoli accanto al radar
 * nell'immagine di Roberto.
 *
 *   - scala di 270° (da −135° a +135°) con tacche;
 *   - l'arco colorato arriva fino al valore;
 *   - la LANCETTA ruota con `transform: rotate()`. Ha una transizione CSS:
 *     quando un guasto o una riparazione cambiano il valore, React aggiorna
 *     l'angolo e il browser fa scorrere la lancetta fino al nuovo punto
 *     (nessun codice di animazione: solo `transition` nel CSS);
 *   - sotto: sigla, valore e, se non è in buono stato, la fascia scritta.
 * ============================================================================
 */

import type { CSSProperties } from "react";
import type { FasciaSistema } from "../../../engine/nave/integrita";
import { etichetta, type Tono } from "../../format";
import { AMPIEZZA, angoloLancetta, tacche, trattoArco } from "./geometria";
import stili from "./Strumenti.module.css";

const TACCHE = tacche(11, 30, 30, 22, 25, AMPIEZZA, -AMPIEZZA / 2);

interface Props {
  sigla: string;
  nome: string;
  valore: number;
  fascia: FasciaSistema;
  tono: Tono;
}

export function IndicatoreSistema({ sigla, nome, valore, fascia, tono }: Props) {
  const inOrdine = fascia === "NOMINALE" || fascia === "BUONO";
  return (
    // <li> per la lista, il <div> con role="meter" per lo screen reader
    // (un elemento di lista non deve perdere il suo ruolo).
    <li className={`${stili.indicatore} ${stili[tono]}`}>
      <div
        className={stili.contenutoIndicatore}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valore}
        aria-label={`${nome}: ${valore}, ${etichetta(fascia)}`}
        title={`${nome} · ${valore} · ${etichetta(fascia)}`}
      >
        <svg viewBox="0 0 60 60" aria-hidden="true">
          {TACCHE.map((t, i) => (
            <line key={i} className={t.lunga ? stili.taccaLunga : stili.tacca} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
          ))}
          {/* Traccia (270°) e arco del valore: partono da −135° (in basso a sinistra). */}
          <circle
            className={stili.traccia}
            cx="30"
            cy="30"
            r="18"
            strokeDasharray={trattoArco(18, 1, AMPIEZZA)}
            transform="rotate(135 30 30)"
          />
          <circle
            className={stili.arco}
            cx="30"
            cy="30"
            r="18"
            strokeDasharray={trattoArco(18, valore / 100, AMPIEZZA)}
            transform="rotate(135 30 30)"
          />
          <g className={stili.lancetta} style={{ "--angolo": `${angoloLancetta(valore)}deg` } as CSSProperties}>
            <line x1="30" y1="33" x2="30" y2="11" />
          </g>
          <circle className={stili.perno} cx="30" cy="30" r="2.5" />
        </svg>
        <span className={stili.sigla}>{sigla}</span>
        <span className={stili.valoreIndicatore}>
          {valore}
          {!inOrdine && <span className={stili.avviso}> ▲</span>}
        </span>
      </div>
    </li>
  );
}
