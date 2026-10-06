/**
 * ============================================================================
 * BarraSegmentata.tsx — L'indicatore a segmenti del design system
 * ============================================================================
 *
 * Mostra un valore come una fila di segmenti accesi e spenti
 * (▮▮▮▮▮▮▯▯▯▯). Il colore dei segmenti accesi segue il TONO.
 *
 * ACCESSIBILITÀ
 * role="meter" con aria-valuenow/min/max dice agli screen reader
 * "Fatica, 40 su 100". I segmenti sono solo decorazione (aria-hidden).
 * ============================================================================
 */

import type { Tono } from "../format";
import stili from "./BarraSegmentata.module.css";

interface BarraSegmentataProps {
  valore: number;
  massimo: number;
  /** Nome letto dagli screen reader. */
  etichetta: string;
  tono?: Tono;
  segmenti?: number;
}

export function BarraSegmentata({ valore, massimo, etichetta, tono = "normale", segmenti = 20 }: BarraSegmentataProps) {
  // Quanti segmenti accendere: proporzione arrotondata, tra 0 e segmenti.
  const accesi = Math.max(0, Math.min(segmenti, Math.round((valore / massimo) * segmenti)));

  return (
    <div
      className={`${stili.barra} ${stili[tono]}`}
      role="meter"
      aria-label={etichetta}
      aria-valuenow={valore}
      aria-valuemin={0}
      aria-valuemax={massimo}
    >
      {Array.from({ length: segmenti }, (_, i) => (
        <span key={i} className={i < accesi ? stili.acceso : stili.spento} aria-hidden="true" />
      ))}
    </div>
  );
}
