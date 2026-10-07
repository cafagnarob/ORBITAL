/**
 * ============================================================================
 * Radar.tsx — Minigioco RADAR: trova il punto con lo scanner
 * ============================================================================
 *
 * Per: scansioni, mappatura, sondaggio profondo, crepe nello scafo, vene
 * del meteorite.
 *
 * COME SI GIOCA
 * Muovi il dito o il mouse sull'area: l'INTENSITÀ sale avvicinandosi al
 * bersaglio nascosto (con un po' di rumore). Tocca/clicca per AGGANCIARE.
 * Punteggio dalla distanza al momento dell'aggancio; se il tempo scade si
 * vale la metà. Al livello 1 il raggio del radar fa "lampeggiare" l'eco.
 *
 * LA DISTANZA
 * Teorema di Pitagora: d = √(dx² + dy²), in unità dell'area (0–100).
 * ============================================================================
 */

import type { PointerEvent } from "react";
import { suona } from "../../audio";
import { BarraTempo } from "./BarraTempo";
import { limita, tra, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const DURATA = 15;

interface Stato {
  t: number;
  x: number;
  y: number;
  agganciato: boolean;
}

/** Punteggio dalla distanza: pieno vicinissimo, poi a scalini. */
function punteggioDistanza(d: number, raggio: number): number {
  if (d <= raggio) return 1;
  if (d <= raggio * 2.5) return 0.6;
  if (d <= raggio * 5) return 0.3;
  return 0;
}

export function Radar({ difficolta, onFine }: PropsGioco) {
  const raggio = [10, 7, 5][difficolta - 1] ?? 7;
  const rumore = [0.04, 0.08, 0.13][difficolta - 1] ?? 0.08;

  const [stato, sim] = useSimulazione<Stato & { bx: number; by: number }, { x: number; y: number }>(() => {
    const bx = tra(15, 85);
    const by = tra(15, 85);
    const distanza = (s: { x: number; y: number }) => Math.hypot(s.x - bx, s.y - by);
    return {
      iniziale: { t: 0, x: 50, y: 50, agganciato: false, bx, by },
      comandi: { x: 50, y: 50 },
      passo: (s, dt, c) => ({ ...s, t: s.t + dt, x: c.x, y: c.y }),
      finito: (s) => s.t >= DURATA,
      alFine: (s) => onFine(punteggioDistanza(distanza(s), raggio) * (s.agganciato ? 1 : 0.5)),
    };
  });

  const d = Math.hypot(stato.x - stato.bx, stato.y - stato.by);
  // Intensità 0–1 con un rumore che "tremola" nel tempo.
  const intensita = limita(1 - d / 60 + rumore * Math.sin(stato.t * 9) * Math.sin(stato.t * 4.3 + 1));

  // Il raggio del radar ruota; al livello 1 l'eco si accende quando ci passa sopra.
  const angolo = (stato.t * 120) % 360;
  const angoloBersaglio = ((Math.atan2(stato.by - 50, stato.bx - 50) * 180) / Math.PI + 360) % 360;
  const differenza = Math.abs(((angolo - angoloBersaglio + 540) % 360) - 180);
  const eco = difficolta === 1 && differenza < 25 ? 1 - differenza / 25 : 0;

  /** Coordinate del puntatore in unità dell'area (0–100). */
  function posizione(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: limita(((e.clientX - r.left) / r.width) * 100, 0, 100), y: limita(((e.clientY - r.top) / r.height) * 100, 0, 100) };
  }

  return (
    <div className={stili.gioco}>
      <BarraTempo trascorso={stato.t} durata={DURATA} />
      <svg
        className={stili.area}
        viewBox="0 0 100 100"
        role="application"
        aria-label="Area dello scanner: muovi e tocca per agganciare"
        onPointerMove={(e) => sim.imposta(posizione(e))}
        onPointerDown={(e) => sim.imposta(posizione(e))}
        onPointerUp={(e) => {
          const p = posizione(e);
          suona("CONFERMA");
          sim.concludi((s) => ({ ...s, ...p, agganciato: true }));
        }}
      >
        {[12, 24, 36, 48].map((r) => (
          <circle key={r} cx={50} cy={50} r={r} className={stili.griglia} />
        ))}
        <line x1={0} y1={50} x2={100} y2={50} className={stili.griglia} />
        <line x1={50} y1={0} x2={50} y2={100} className={stili.griglia} />
        {/* Il raggio rotante del radar. */}
        <line
          x1={50}
          y1={50}
          x2={50 + 50 * Math.cos((angolo * Math.PI) / 180)}
          y2={50 + 50 * Math.sin((angolo * Math.PI) / 180)}
          className={stili.tracciaTenue}
        />
        {eco > 0 && <circle cx={stato.bx} cy={stato.by} r={3} fill="var(--c-vale)" opacity={eco * 0.6} />}
        {/* Lo scanner: il cerchio si accende con l'intensità. */}
        <circle cx={stato.x} cy={stato.y} r={4 + intensita * 6} className={stili.bersaglio} opacity={0.3 + intensita * 0.7} />
        <line x1={stato.x - 3} y1={stato.y} x2={stato.x + 3} y2={stato.y} className={stili.traccia} />
        <line x1={stato.x} y1={stato.y - 3} x2={stato.x} y2={stato.y + 3} className={stili.traccia} />
      </svg>
      <p className={stili.lettura}>
        INTENSITÀ <strong>{Math.round(intensita * 100)}%</strong>
      </p>
      <p className={stili.aiuto}>Mouse: muovi e clicca · Touch: trascina e solleva il dito</p>
    </div>
  );
}
