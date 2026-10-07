/**
 * ============================================================================
 * Confronto.tsx — Minigioco CONFRONTO: trova il tracciato identico
 * ============================================================================
 *
 * Per: visita medica, coltura, analisi dei campioni, bonifica della
 * dispensa, verifica dei dati di V.A.L.E.
 *
 * COME SI GIOCA
 * In alto c'è il tracciato di RIFERIMENTO. Sotto, quattro tracciati: uno
 * solo è identico, gli altri hanno due o tre valori diversi (più piccole
 * le differenze, più alto il livello). Tre turni; punteggio = giusti / 3.
 *
 * NIENTE TEMPO REALE
 * Qui non serve un ciclo a 60 fps: il gioco cambia solo quando il
 * giocatore sceglie. Basta useState (con inizializzazione pigra per
 * generare i tre turni una volta sola).
 * ============================================================================
 */

import { useState } from "react";
import { suona } from "../../audio";
import { limita, tra, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const TURNI = 3;
const PUNTI = 10;

interface Turno {
  riferimento: number[];
  candidati: number[][];
  giusto: number;
}

/** Un turno: il riferimento, una copia esatta e tre copie "ritoccate". */
function creaTurno(differenza: number): Turno {
  const riferimento = Array.from({ length: PUNTI }, () => tra(0.15, 0.95));
  const giusto = Math.floor(Math.random() * 4);
  const candidati = Array.from({ length: 4 }, (_, i) => {
    if (i === giusto) return [...riferimento];
    const copia = [...riferimento];
    const quanti = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < quanti; k++) {
      const j = Math.floor(Math.random() * PUNTI);
      copia[j] = limita((copia[j] ?? 0.5) + (Math.random() < 0.5 ? -1 : 1) * differenza, 0.05, 1);
    }
    return copia;
  });
  return { riferimento, candidati, giusto };
}

/** Il tracciato come linea spezzata in un riquadro 100×40. */
function Tracciato({ valori, evidenzia = false }: { valori: number[]; evidenzia?: boolean }) {
  const d = valori.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / (PUNTI - 1)) * 96 + 2} ${38 - v * 34}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" aria-hidden="true">
      <line x1={0} y1={38} x2={100} y2={38} className={stili.griglia} />
      <path d={d} className={evidenzia ? stili.bersaglio : stili.traccia} />
    </svg>
  );
}

export function Confronto({ difficolta, onFine }: PropsGioco) {
  const differenza = [0.32, 0.22, 0.14][difficolta - 1] ?? 0.22;
  const [turni] = useState(() => Array.from({ length: TURNI }, () => creaTurno(differenza)));
  const [risposte, setRisposte] = useState<boolean[]>([]);
  const turno = turni[risposte.length];
  if (!turno) return null;

  function scegli(i: number) {
    if (!turno) return;
    const giusta = i === turno.giusto;
    suona(giusta ? "CONFERMA" : "ERRORE");
    const nuove = [...risposte, giusta];
    setRisposte(nuove);
    // Dentro un gestore di evento: si può avvisare il genitore subito.
    if (nuove.length === TURNI) onFine(nuove.filter(Boolean).length / TURNI);
  }

  return (
    <div className={stili.gioco}>
      <p className={stili.lettura}>
        TURNO <strong>{risposte.length + 1}</strong>/{TURNI} · RIFERIMENTO
      </p>
      <div className={stili.scelte} style={{ gridTemplateColumns: "1fr" }}>
        <div style={{ border: "1.5px solid var(--c-vale)", padding: 4 }}>
          <Tracciato valori={turno.riferimento} evidenzia />
        </div>
      </div>
      <div className={stili.scelte}>
        {turno.candidati.map((c, i) => (
          <button key={i} type="button" aria-label={`Tracciato ${i + 1}`} onClick={() => scegli(i)}>
            <Tracciato valori={c} />
          </button>
        ))}
      </div>
    </div>
  );
}
