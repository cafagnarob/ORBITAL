/**
 * ============================================================================
 * QuadranteScafo.tsx — L'integrità dello scafo come quadrante radar
 * ============================================================================
 *
 * Riferimento grafico: il radar dell'immagine di Roberto (cerchi
 * concentrici, tacche sul bordo, un fascio che gira).
 *
 *   - le TACCHE e i CERCHI sono fissi (decorazione);
 *   - l'ARCO esterno si riempie con il valore dello scafo (stroke-dasharray,
 *     vedi geometria.ts); il colore segue la fascia;
 *   - il FASCIO che gira è solo atmosfera (CSS, si ferma con
 *     prefers-reduced-motion);
 *   - al centro, in HTML, il numero e la fascia SCRITTA: il colore non è
 *     mai l'unica informazione (regola del design system).
 * ============================================================================
 */

import type { FasciaScafo } from "../../../engine/nave/integrita";
import type { Tono } from "../../format";
import { tacche, trattoArco } from "./geometria";
import stili from "./Strumenti.module.css";

const TACCHE = tacche(48, 50, 50, 44, 47);

export function QuadranteScafo({ valore, fascia, tono }: { valore: number; fascia: FasciaScafo; tono: Tono }) {
  return (
    <div
      className={`${stili.quadrante} ${stili[tono]}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valore}
      aria-label={`Integrità dello scafo: ${valore}, ${fascia}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {TACCHE.map((t, i) => (
          <line key={i} className={t.lunga ? stili.taccaLunga : stili.tacca} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
        <circle className={stili.cerchio} cx="50" cy="50" r="30" />
        <circle className={stili.cerchioTratteggio} cx="50" cy="50" r="20" />
        <circle className={stili.cerchio} cx="50" cy="50" r="9" />
        <line className={stili.croce} x1="50" y1="8" x2="50" y2="92" />
        <line className={stili.croce} x1="8" y1="50" x2="92" y2="50" />
        {/* Il fascio del radar: un settore che gira attorno al centro. */}
        <path className={stili.fascio} d="M 50 50 L 50 12 A 38 38 0 0 1 72.3 19.3 Z" />
        {/* Traccia e valore dell'arco esterno. */}
        <circle className={stili.traccia} cx="50" cy="50" r="40" />
        <circle
          className={stili.arco}
          cx="50"
          cy="50"
          r="40"
          strokeDasharray={trattoArco(40, valore / 100)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className={stili.centro}>
        <span className={stili.numero}>{valore}</span>
        <span className={stili.nomeQuadrante}>SCAFO</span>
      </div>
      <span className={stili.fascia}>{fascia}</span>
    </div>
  );
}
