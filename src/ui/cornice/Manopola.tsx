/**
 * ============================================================================
 * Manopola.tsx — Una manopola della cornice che regola un canale audio
 * ============================================================================
 *
 * Quattro scatti: SPENTO → 1 → 2 → 3 → di nuovo SPENTO. Ogni clic (o tocco)
 * gira la manopola di uno scatto; la tacca bianca ruota per mostrarne la
 * posizione, e un piccolo LED sotto si accende quando il canale è attivo.
 *
 * È un vero <button>: funziona con mouse, dito e tastiera (Invio/Spazio),
 * e lo screen reader legge "Volume voce di V.A.L.E.: 2 su 3".
 *
 * Il primo giro è anche il momento in cui il browser ci permette di
 * avviare l'audio (giraManopola chiama sbloccaAudio dentro il clic).
 * ============================================================================
 */

import { giraManopola, LIVELLO_MASSIMO, useVolumi, type Canale } from "../audio";
import stili from "./Manopola.module.css";

/** Angolo della tacca per ogni livello: da −135° (spento) a +135° (massimo). */
const ANGOLI = [-135, -45, 45, 135] as const;

interface Props {
  canale: Canale;
  /** Sigla incisa sotto la manopola, es. "AMB". */
  sigla: string;
  /** Nome completo per screen reader e tooltip. */
  nome: string;
}

export function Manopola({ canale, sigla, nome }: Props) {
  const livello = useVolumi()[canale];
  const descrizione = livello === 0 ? `${nome}: spento` : `${nome}: ${livello} su ${LIVELLO_MASSIMO}`;

  return (
    <button
      type="button"
      className={stili.manopola}
      onClick={() => giraManopola(canale)}
      aria-label={descrizione}
      title={`${descrizione} — clic per girare`}
    >
      <span className={stili.pomello} style={{ transform: `rotate(${ANGOLI[livello] ?? -135}deg)` }} aria-hidden="true">
        <span className={stili.tacca} />
      </span>
      <span className={stili.sigla} aria-hidden="true">
        <span className={`${stili.spia} ${livello > 0 ? stili.accesa : ""}`} />
        {sigla}
      </span>
    </button>
  );
}
