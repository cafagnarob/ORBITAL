/**
 * ============================================================================
 * Icona.tsx — Disegna un'icona del gioco (cibo, acqua, ossigeno…)
 * ============================================================================
 *
 * <Icona tipo="cibo" />            decorativa (accanto c'è già la parola)
 * <Icona tipo="cibo" titolo="Cibo" />  da sola: lo screen reader dice "Cibo"
 *
 * Misura: 1em × 1em, cioè quanto il testo intorno. Si ingrandisce con
 * font-size o con una classe. Colore: currentColor (quello del testo).
 * I disegni stanno in disegni.ts.
 * ============================================================================
 */

import { DISEGNI, type TipoIcona } from "./disegni";
import stili from "./Icona.module.css";

interface Props {
  tipo: TipoIcona;
  /** Se c'è, l'icona "parla" (role="img"); se no è decorativa. */
  titolo?: string;
  className?: string;
}

export function Icona({ tipo, titolo, className = "" }: Props) {
  return (
    <svg
      className={`${stili.icona} ${className}`}
      viewBox="0 0 24 24"
      role={titolo ? "img" : undefined}
      aria-label={titolo}
      aria-hidden={titolo ? undefined : true}
    >
      {DISEGNI[tipo].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
