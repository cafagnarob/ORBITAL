/**
 * ============================================================================
 * Pressione.tsx — Minigioco PRESSIONE: tieni l'ago nella fascia verde
 * ============================================================================
 *
 * Per: supporto vitale, riciclo dell'acqua, elettrolisi, airlock del soccorso.
 *
 * COME SI GIOCA
 * Tieni premuto APRI VALVOLA (o la barra spaziatrice): la pressione sale.
 * Lascia: scende. Il circuito ha i suoi sbalzi (rumore). Il punteggio è la
 * parte di tempo passata nella fascia verde (80% del tempo = pieno).
 *
 * LA FISICA (semplificata)
 * Ogni fotogramma: pressione += (premuto ? salita : −discesa) × dt + sbalzo.
 * dt = secondi dall'ultimo fotogramma: così la velocità è la stessa su uno
 * schermo a 60 Hz e su uno a 120 Hz.
 * ============================================================================
 */

import { BarraTempo } from "./BarraTempo";
import { limita, tra, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const DURATA = 12;

/** Un punto sull'arco del manometro (da 180° a 0°, valore 0–1). */
function puntoArco(valore: number, raggio: number) {
  const a = Math.PI * (1 - valore);
  return { x: 50 + raggio * Math.cos(a), y: 60 - raggio * Math.sin(a) };
}
function arco(da: number, a: number, raggio: number): string {
  const p1 = puntoArco(da, raggio);
  const p2 = puntoArco(a, raggio);
  return `M ${p1.x} ${p1.y} A ${raggio} ${raggio} 0 0 1 ${p2.x} ${p2.y}`;
}

export function Pressione({ difficolta, onFine }: PropsGioco) {
  const larghezza = [0.26, 0.19, 0.13][difficolta - 1] ?? 0.19;
  const sbalzi = [0.15, 0.3, 0.45][difficolta - 1] ?? 0.3;

  const [stato, sim] = useSimulazione(() => {
    const centro = tra(0.45, 0.7);
    const zona = { da: centro - larghezza / 2, a: centro + larghezza / 2 };
    return {
      iniziale: { t: 0, p: 0.2, dentro: 0, zona, premuto: false },
      comandi: { premuto: false },
      passo: (s, dt, c) => {
        const sbalzo = sbalzi * (Math.sin(s.t * 2.3) + Math.sin(s.t * 5.1 + 2)) * 0.5;
        const p = limita(s.p + ((c.premuto ? 0.5 : -0.38) + sbalzo) * dt);
        const inZona = p >= s.zona.da && p <= s.zona.a;
        return { ...s, t: s.t + dt, p, dentro: s.dentro + (inZona ? dt : 0), premuto: c.premuto };
      },
      finito: (s) => s.t >= DURATA,
      alFine: (s) => onFine(limita(s.dentro / (DURATA * 0.8))),
    };
  });

  const ago = puntoArco(stato.p, 38);
  const inZona = stato.p >= stato.zona.da && stato.p <= stato.zona.a;
  const premi = (premuto: boolean) => sim.imposta({ premuto });

  return (
    <div className={stili.gioco}>
      <BarraTempo trascorso={stato.t} durata={DURATA} />
      <svg className={stili.areaLarga} viewBox="0 0 100 70" aria-hidden="true">
        <path d={arco(0, 1, 40)} className={stili.griglia} strokeWidth={6} />
        <path d={arco(0.86, 1, 40)} fill="none" stroke="var(--c-critico)" strokeWidth={6} opacity={0.4} />
        <path d={arco(stato.zona.da, stato.zona.a, 40)} fill="none" stroke="var(--c-fosforo)" strokeWidth={6} opacity={0.7} />
        <line x1={50} y1={60} x2={ago.x} y2={ago.y} className={stili.traccia} strokeWidth={1.6} />
        <circle cx={50} cy={60} r={2.5} fill="var(--c-fosforo)" />
      </svg>
      <p className={stili.lettura}>
        PRESSIONE <strong>{Math.round(stato.p * 100)}</strong> · {inZona ? "NOMINALE" : stato.p > stato.zona.a ? "ALTA" : "BASSA"}
      </p>
      <div className={stili.tasti}>
        <button
          type="button"
          className={stili.tasto}
          aria-pressed={stato.premuto}
          onPointerDown={() => premi(true)}
          onPointerUp={() => premi(false)}
          onPointerLeave={() => premi(false)}
          onPointerCancel={() => premi(false)}
          onKeyDown={(e) => e.key === " " && (e.preventDefault(), premi(true))}
          onKeyUp={(e) => e.key === " " && premi(false)}
          onContextMenu={(e) => e.preventDefault()}
          autoFocus
        >
          APRI VALVOLA
        </button>
      </div>
      <p className={stili.aiuto}>Tieni premuto (o la barra spaziatrice) per far salire la pressione</p>
    </div>
  );
}
