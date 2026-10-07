/**
 * ============================================================================
 * Manovra.tsx — Minigioco MANOVRA: resta nel corridoio
 * ============================================================================
 *
 * Per: correzione d'orbita, drone, raccolta di detriti e di ghiaccio.
 *
 * COME SI GIOCA
 * Il corridoio scorre verso il basso e serpeggia; la nave deriva per conto
 * suo. Tieni premuto ◀ o ▶ (o le frecce della tastiera) per spingerla.
 * Punteggio: la parte di tempo passata dentro il corridoio (80% = pieno).
 *
 * LA FISICA (semplificata)
 *   velocità += (spinta + deriva) × dt      la spinta accelera, non sposta
 *   velocità × smorzamento                  l'inerzia si smorza piano
 *   posizione += velocità × dt
 * Il corridoio è una funzione del tempo: centro(t) = A · sin(0,7 t), e le
 * righe più in alto mostrano il corridoio "futuro": centro(t + anticipo).
 * ============================================================================
 */

import { BarraTempo } from "./BarraTempo";
import { limita, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const DURATA = 12;
type Direzione = -1 | 0 | 1;

export function Manovra({ difficolta, onFine }: PropsGioco) {
  const ampiezza = [0.35, 0.5, 0.6][difficolta - 1] ?? 0.5;
  const larghezza = [0.55, 0.42, 0.32][difficolta - 1] ?? 0.42;
  const deriva = [0.6, 1, 1.4][difficolta - 1] ?? 1;
  /** Il centro del corridoio (−1…1) all'istante t. */
  const centro = (t: number) => ampiezza * Math.sin(t * 0.7) * Math.cos(t * 0.23);

  const [stato, sim] = useSimulazione(() => ({
    iniziale: { t: 0, x: 0, v: 0, dentro: 0, spinta: 0 as Direzione },
    comandi: { spinta: 0 as Direzione },
    passo: (s: { t: number; x: number; v: number; dentro: number; spinta: Direzione }, dt: number, c: { spinta: Direzione }) => {
      const disturbo = deriva * (Math.sin(s.t * 1.3) + Math.sin(s.t * 2.1 + 1)) * 0.5;
      const v = (s.v + (c.spinta * 2.4 + disturbo) * dt) * 0.985;
      const x = limita(s.x + v * dt, -1, 1);
      const dentro = Math.abs(x - centro(s.t)) < larghezza / 2;
      return { t: s.t + dt, x, v: x === -1 || x === 1 ? 0 : v, dentro: s.dentro + (dentro ? dt : 0), spinta: c.spinta };
    },
    finito: (s) => s.t >= DURATA,
    alFine: (s) => onFine(limita(s.dentro / (DURATA * 0.8))),
  }));

  /** Da −1…1 alla coordinata x dell'SVG (0–100). */
  const sx = (v: number) => 50 + v * 45;
  // Il corridoio: righe dal basso (ora) all'alto (fra 2 secondi).
  const righe = Array.from({ length: 21 }, (_, i) => {
    const y = 90 - i * 4.5;
    const c = centro(stato.t + i * 0.1);
    return { y, sinistra: sx(c - larghezza / 2), destra: sx(c + larghezza / 2) };
  });
  const bordo = (lato: "sinistra" | "destra") => righe.map((r, i) => `${i === 0 ? "M" : "L"} ${r[lato].toFixed(1)} ${r.y}`).join(" ");
  const dentro = Math.abs(stato.x - centro(stato.t)) < larghezza / 2;
  const spingi = (spinta: Direzione) => sim.imposta({ spinta });

  /** Tasto tenuto premuto: con il mouse, il dito o la tastiera. */
  const tasto = (dir: Direzione, testo: string) => (
    <button
      type="button"
      autoFocus={dir < 0} // il primo tasto prende il focus: le frecce funzionano subito
      className={stili.tasto}
      aria-pressed={stato.spinta === dir}
      aria-label={dir < 0 ? "Spinta a sinistra" : "Spinta a destra"}
      onPointerDown={() => spingi(dir)}
      onPointerUp={() => spingi(0)}
      onPointerLeave={() => spingi(0)}
      onPointerCancel={() => spingi(0)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {testo}
    </button>
  );

  return (
    <div
      className={stili.gioco}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") spingi(-1);
        if (e.key === "ArrowRight") spingi(1);
      }}
      onKeyUp={(e) => (e.key === "ArrowLeft" || e.key === "ArrowRight") && spingi(0)}
    >
      <BarraTempo trascorso={stato.t} durata={DURATA} />
      <svg className={stili.area} viewBox="0 0 100 100" aria-hidden="true">
        <path d={bordo("sinistra")} className={stili.traccia} />
        <path d={bordo("destra")} className={stili.traccia} />
        {/* La nave: un triangolo, rosso se è fuori dal corridoio. */}
        <polygon
          points={`${sx(stato.x)},84 ${sx(stato.x) - 4},94 ${sx(stato.x) + 4},94`}
          fill={dentro ? "var(--c-vale)" : "var(--c-critico)"}
        />
      </svg>
      <p className={stili.lettura}>
        TRAIETTORIA <strong>{dentro ? "NEL CORRIDOIO" : "FUORI ROTTA"}</strong>
      </p>
      <div className={stili.tasti}>
        {tasto(-1, "◀")}
        {tasto(1, "▶")}
      </div>
    </div>
  );
}
