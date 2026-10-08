/**
 * ============================================================================
 * SagomaBersaglio.tsx — Come si disegna il bersaglio, per ogni forma (v3.8)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7 (supermissioni).
 *
 * Le supermissioni non vanno tutte verso un pianeta: c'è una STAZIONE, un
 * ASTEROIDE, una COMETA, un RELITTO. Il PIANETA resta disegnato dalle due
 * viste (il globo che ruota è il loro pezzo forte); questo componente
 * disegna le altre quattro forme, con lo stesso stile a fosforo, dentro lo
 * stesso SVG della vista che lo usa (è un <g>, non un <svg>).
 *
 * UN SOLO SISTEMA DI MISURA
 * Tutto è in funzione di centro (cx, cy) e "raggio" r: la sagoma occupa
 * più o meno il cerchio di raggio r. Così la vista di viaggio può farla
 * crescere avvicinandosi (r cambia), e quella d'orbita la mette al posto
 * del globo senza altri calcoli.
 *
 * MOVIMENTO SOLO CSS
 * L'anello della stazione gira, l'asteroide e il relitto ruotano piano, i
 * getti della cometa pulsano: tutte @keyframes (Sagoma.module.css). Il
 * centro di rotazione si passa con style.transformOrigin in pixel del
 * viewBox (transform-box: view-box nel CSS).
 * ============================================================================
 */

import type { CSSProperties } from "react";
import type { FormaBersaglio } from "../../../engine/types";
import stili from "./Sagoma.module.css";

interface Props {
  /** Qualunque forma tranne PIANETA (quello lo disegnano le viste). */
  forma: Exclude<FormaBersaglio, "PIANETA">;
  cx: number;
  cy: number;
  r: number;
}

/**
 * Il profilo dell'asteroide: 12 raggi "a mano" (frazioni di r), uno ogni
 * 30°. Fissi: l'asteroide ha sempre la stessa sagoma, in ogni partita.
 */
const PROFILO_ASTEROIDE = [0.92, 0.78, 0.88, 1, 0.84, 0.7, 0.8, 0.95, 0.74, 0.86, 0.66, 0.82];

/** Da una lista di raggi a un poligono chiuso attorno al centro. */
function poligono(cx: number, cy: number, r: number, raggi: readonly number[], scalaY = 1): string {
  return (
    raggi
      .map((k, i) => {
        const a = (i / raggi.length) * Math.PI * 2;
        return `${i === 0 ? "M" : "L"} ${(cx + Math.cos(a) * r * k).toFixed(1)} ${(cy + Math.sin(a) * r * k * scalaY).toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

export function SagomaBersaglio({ forma, cx, cy, r }: Props) {
  // Il centro di rotazione per le animazioni CSS (in unità del viewBox).
  const perno = { transformOrigin: `${cx}px ${cy}px` } as CSSProperties;

  switch (forma) {
    // --- STAZIONE: anello rotante, mozzo, raggi, pannelli solari -------------
    case "STAZIONE":
      return (
        <g className={stili.sagoma}>
          {/* Pannelli solari: fissi, sull'asse orizzontale. */}
          <rect className={stili.pannello} x={cx - r * 1.45} y={cy - r * 0.12} width={r * 0.38} height={r * 0.24} />
          <rect className={stili.pannello} x={cx + r * 1.07} y={cy - r * 0.12} width={r * 0.38} height={r * 0.24} />
          <line x1={cx - r * 1.07} y1={cy} x2={cx - r * 0.2} y2={cy} />
          <line x1={cx + r * 0.2} y1={cy} x2={cx + r * 1.07} y2={cy} />
          {/* L'anello abitato: ruota per dare gravità (e senza assetto, storto). */}
          <g className={stili.ruota} style={perno}>
            <circle className={stili.pieno} cx={cx} cy={cy} r={r} />
            <circle cx={cx} cy={cy} r={r * 0.8} />
            {[0, 1, 2, 3].map((i) => {
              const a = (i * Math.PI) / 2 + Math.PI / 4;
              return (
                <line
                  key={i}
                  x1={cx + Math.cos(a) * r * 0.2}
                  y1={cy + Math.sin(a) * r * 0.2}
                  x2={cx + Math.cos(a) * r * 0.8}
                  y2={cy + Math.sin(a) * r * 0.8}
                />
              );
            })}
            {/* Il modulo 7: un blocco sull'anello, spento. */}
            <rect className={stili.modulo} x={cx - r * 0.12} y={cy + r * 0.78} width={r * 0.24} height={r * 0.24} />
          </g>
          <circle className={stili.pieno} cx={cx} cy={cy} r={r * 0.2} />
        </g>
      );

    // --- ASTEROIDE: un sasso irregolare che ruota lentamente ----------------
    case "ASTEROIDE":
      return (
        <g className={`${stili.sagoma} ${stili.lento}`} style={perno}>
          <path className={stili.pieno} d={poligono(cx, cy, r, PROFILO_ASTEROIDE, 0.78)} />
          {/* Crateri e la "cicatrice" della zona regolare. */}
          <ellipse cx={cx - r * 0.35} cy={cy + r * 0.2} rx={r * 0.16} ry={r * 0.09} />
          <ellipse cx={cx + r * 0.1} cy={cy + r * 0.42} rx={r * 0.1} ry={r * 0.06} />
          <ellipse cx={cx - r * 0.5} cy={cy - r * 0.22} rx={r * 0.08} ry={r * 0.05} />
          <path className={stili.cicatrice} d={`M ${cx + r * 0.05} ${cy - r * 0.4} L ${cx + r * 0.45} ${cy - r * 0.2}`} />
        </g>
      );

    // --- COMETA: nucleo, chioma, coda e getti ---------------------------------
    case "COMETA": {
      // Il nucleo sta in basso a destra; la coda va verso l'alto a sinistra.
      const nx = cx + r * 0.2;
      const ny = cy + r * 0.2;
      return (
        <g className={stili.sagoma}>
          {/* La coda: tre linee che si allargano, sempre più tenui. */}
          {[-0.18, 0, 0.18].map((k, i) => (
            <path
              key={k}
              className={stili.coda}
              style={{ opacity: 0.55 - i * 0.12 } as CSSProperties}
              d={`M ${nx} ${ny} Q ${nx - r * 0.9} ${ny - r * (0.8 + k)} ${nx - r * 2.2} ${ny - r * (1.6 + k * 3)}`}
            />
          ))}
          <circle className={stili.chioma} cx={nx} cy={ny} r={r * 0.62} />
          <path className={stili.pieno} d={poligono(nx, ny, r * 0.32, PROFILO_ASTEROIDE)} />
          {/* I getti: brevi tratti che pulsano a turno. */}
          {[0.3, 1.9, 3.6].map((a, i) => (
            <line
              key={a}
              className={stili.getto}
              style={{ animationDelay: `${i * 0.7}s` } as CSSProperties}
              x1={nx + Math.cos(a) * r * 0.3}
              y1={ny + Math.sin(a) * r * 0.3}
              x2={nx + Math.cos(a) * r * 0.55}
              y2={ny + Math.sin(a) * r * 0.55}
            />
          ))}
        </g>
      );
    }

    // --- RELITTO: lo scafo di una nave, spento, che deriva ruotando -----------
    case "RELITTO": {
      const lx = r * 1.1; // mezza lunghezza dello scafo
      const ly = r * 0.28; // mezza altezza
      return (
        <g className={`${stili.sagoma} ${stili.deriva}`} style={perno}>
          {/* Scafo a esagono allungato (la stessa classe della ORB-1). */}
          <path
            className={stili.pieno}
            d={`M ${cx - lx} ${cy} L ${cx - lx * 0.75} ${cy - ly} L ${cx + lx * 0.6} ${cy - ly} L ${cx + lx} ${cy} L ${cx + lx * 0.6} ${cy + ly} L ${cx - lx * 0.75} ${cy + ly} Z`}
          />
          {/* Le sezioni dello scafo. */}
          {[-0.35, 0.05, 0.4].map((k) => (
            <line key={k} x1={cx + lx * k} y1={cy - ly} x2={cx + lx * k} y2={cy + ly} />
          ))}
          {/* Antenna piegata e una falla. */}
          <path d={`M ${cx - lx * 0.2} ${cy - ly} L ${cx - lx * 0.25} ${cy - ly * 2.2} L ${cx - lx * 0.05} ${cy - ly * 2.6}`} />
          <path className={stili.falla} d={`M ${cx + lx * 0.15} ${cy + ly} l ${r * 0.06} ${-ly * 0.6} l ${r * 0.06} ${ly * 0.4} l ${r * 0.05} ${-ly * 0.5}`} />
          {/* Motori, a poppa. */}
          <rect x={cx - lx - r * 0.18} y={cy - ly * 0.6} width={r * 0.18} height={ly * 1.2} />
        </g>
      );
    }
  }
}
