/**
 * ============================================================================
 * Tempismo.tsx — Minigioco TEMPISMO: premi quando il cursore è nella zona
 * ============================================================================
 *
 * Per: saldature (scafo, serbatoio), rivetti della blindatura, agganci EVA,
 * il respiro della pausa.
 *
 * COME SI GIOCA
 * Il cursore corre avanti e indietro sulla barra. Premi ORA! (o la barra
 * spaziatrice) quando è sulla zona luminosa. Tre colpi: dentro = 1, vicino
 * = mezzo punto, fuori = 0. Ogni colpo sposta la zona.
 *
 * IL CURSORE "A PING-PONG"
 * Un'onda triangolare: f = frazione del ciclo (0–1); posizione = f < 0,5 ?
 * 2f : 2 − 2f. Va da 0 a 1 e torna indietro, all'infinito, solo dal tempo.
 * ============================================================================
 */

import { suona } from "../../audio";
import { BarraTempo } from "./BarraTempo";
import { tra, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const COLPI = 3;
const DURATA = 25; // tempo massimo di sicurezza: i colpi mancanti valgono 0

/** Posizione 0–1 del cursore all'istante t. */
function cursore(t: number, velocita: number): number {
  const f = (t * velocita) % 1;
  return f < 0.5 ? 2 * f : 2 - 2 * f;
}

export function Tempismo({ difficolta, onFine }: PropsGioco) {
  const velocita = [0.55, 0.8, 1.05][difficolta - 1] ?? 0.8;
  const larghezza = [0.16, 0.12, 0.08][difficolta - 1] ?? 0.12;

  const [stato, sim] = useSimulazione(() => ({
    iniziale: { t: 0, colpi: [] as number[], zona: tra(0.2, 0.8) },
    comandi: { colpi: [] as number[], zona: 0 },
    passo: (s: { t: number; colpi: number[]; zona: number }, dt: number, c: { colpi: number[]; zona: number }) => ({
      t: s.t + dt,
      colpi: c.colpi,
      zona: c.zona || s.zona,
    }),
    finito: (s) => s.t >= DURATA,
    alFine: (s) => onFine(s.colpi.reduce((a, b) => a + b, 0) / COLPI),
  }));

  const pos = cursore(stato.t, velocita);

  function colpisci() {
    const distanza = Math.abs(pos - stato.zona);
    const valore = distanza <= larghezza / 2 ? 1 : distanza <= larghezza * 1.2 ? 0.5 : 0;
    suona(valore === 1 ? "CONFERMA" : valore > 0 ? "CLIC" : "ERRORE");
    const colpi = [...sim.comandi().colpi, valore];
    if (colpi.length >= COLPI) sim.concludi((s) => ({ ...s, colpi }));
    else sim.imposta({ colpi, zona: tra(0.15, 0.85) });
  }

  return (
    <div className={stili.gioco}>
      <BarraTempo trascorso={stato.t} durata={DURATA} />
      <svg className={stili.areaLarga} viewBox="0 0 200 60" aria-hidden="true">
        <rect x={10} y={22} width={180} height={16} className={stili.griglia} strokeWidth={1} />
        <rect x={10 + (stato.zona - larghezza * 1.2) * 180} y={22} width={larghezza * 2.4 * 180} height={16} fill="rgba(242,193,78,0.15)" />
        <rect x={10 + (stato.zona - larghezza / 2) * 180} y={22} width={larghezza * 180} height={16} className={stili.zona} />
        <line x1={10 + pos * 180} y1={14} x2={10 + pos * 180} y2={46} stroke="var(--c-vale)" strokeWidth={2.5} />
      </svg>
      <p className={stili.lettura}>
        COLPI{" "}
        <strong>
          {stato.colpi.map((c) => (c === 1 ? "●" : c > 0 ? "◐" : "○")).join(" ") || "—"}
        </strong>{" "}
        · {stato.colpi.length}/{COLPI}
      </p>
      <div className={stili.tasti}>
        <button
          type="button"
          className={`${stili.tasto} ${stili.primario}`}
          onClick={colpisci}
          autoFocus
        >
          ORA!
        </button>
      </div>
    </div>
  );
}
