/**
 * ============================================================================
 * Sintonia.tsx — Minigioco SINTONIA: sovrapponi la tua onda a quella bersaglio
 * ============================================================================
 *
 * Per: analisi del segnale, contatto con la Terra, ricalibrazione dei
 * sensori, orientamento dei pannelli solari.
 *
 * COME SI GIOCA
 * L'onda tratteggiata è il bersaglio; quella piena è la tua. Il cursore
 * cambia la tua frequenza: quando le due onde coincidono l'ALLINEAMENTO
 * arriva al 100%. Premi BLOCCA. Al livello 3 il bersaglio "scivola" piano.
 *
 * LE ONDE
 * y = sin(2π · cicli · x + fase): più cicli = frequenza più alta. Il
 * percorso SVG si costruisce campionando 60 punti lungo l'asse x.
 * ============================================================================
 */

import { suona } from "../../audio";
import { BarraTempo } from "./BarraTempo";
import { limita, tra, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const DURATA = 15;

/** Il percorso SVG di un'onda (area 200×100). */
function onda(cicli: number, fase: number): string {
  const punti: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = (i / 60) * 200;
    const y = 50 - 32 * Math.sin(2 * Math.PI * cicli * (i / 60) + fase);
    punti.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return punti.join(" ");
}

/** Da un valore 0–1 al numero di cicli mostrati (1–6). */
const cicli = (v: number) => 1 + v * 5;

export function Sintonia({ difficolta, onFine }: PropsGioco) {
  const scivola = difficolta === 3 ? 0.07 : 0;
  const tolleranza = [4, 5, 6.5][difficolta - 1] ?? 5; // più alta = più severa

  const [stato, sim] = useSimulazione(() => {
    const base = tra(0.15, 0.85);
    const bersaglio = (t: number) => limita(base + scivola * Math.sin(t * 0.6), 0.05, 0.95);
    const allineamento = (v: number, t: number) => limita(1 - Math.abs(v - bersaglio(t)) * tolleranza);
    return {
      iniziale: { t: 0, v: base > 0.5 ? 0.1 : 0.9, bloccato: false, bersaglio },
      comandi: { v: base > 0.5 ? 0.1 : 0.9 },
      passo: (s, dt, c) => ({ ...s, t: s.t + dt, v: c.v }),
      finito: (s) => s.t >= DURATA,
      alFine: (s) => onFine(allineamento(s.v, s.t) * (s.bloccato ? 1 : 0.5)),
    };
  });

  const b = stato.bersaglio(stato.t);
  const allineamento = limita(1 - Math.abs(stato.v - b) * tolleranza);

  return (
    <div className={stili.gioco}>
      <BarraTempo trascorso={stato.t} durata={DURATA} />
      <svg className={stili.areaLarga} viewBox="0 0 200 100" aria-hidden="true">
        <line x1={0} y1={50} x2={200} y2={50} className={stili.griglia} />
        <path d={onda(cicli(b), stato.t * 2)} className={stili.tracciaTenue} />
        <path d={onda(cicli(stato.v), stato.t * 2)} className={stili.traccia} opacity={0.5 + allineamento * 0.5} />
      </svg>
      <p className={stili.lettura}>
        ALLINEAMENTO <strong>{Math.round(allineamento * 100)}%</strong>
      </p>
      <input
        className={stili.cursore}
        type="range"
        min={0}
        max={1000}
        value={Math.round(stato.v * 1000)}
        aria-label="Frequenza"
        onChange={(e) => sim.imposta({ v: Number(e.target.value) / 1000 })}
      />
      <div className={stili.tasti}>
        <button
          type="button"
          className={`${stili.tasto} ${stili.primario}`}
          onClick={() => {
            suona("CONFERMA");
            sim.concludi((s) => ({ ...s, bloccato: true }));
          }}
        >
          BLOCCA
        </button>
      </div>
    </div>
  );
}
