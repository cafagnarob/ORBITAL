/**
 * ============================================================================
 * Pulsante.tsx — I pulsanti del design system
 * ============================================================================
 *
 *   primario   → pieno (AVVIA LANCIO ▶): l'azione principale della schermata
 *   secondario → contorno (INDAGA)
 *   pericolo   → contorno rosso (ANNULLA)
 *   disattivato→ tratteggiato e tenue (BLOCCATO)
 *
 * È un vero <button>: funziona con tastiera e screen reader senza lavoro
 * extra. Tutte le altre proprietà di un button (onClick, aria-label...)
 * passano attraverso con `...resto`.
 * ============================================================================
 */

import type { ButtonHTMLAttributes } from "react";
import stili from "./Pulsante.module.css";

interface PulsanteProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secondario" | "pericolo";
  /** Versione compatta, per le azioni dentro le liste. */
  piccolo?: boolean;
}

export function Pulsante({ variante = "secondario", piccolo = false, className = "", type = "button", ...resto }: PulsanteProps) {
  return (
    <button
      type={type}
      className={`${stili.pulsante} ${stili[variante]} ${piccolo ? stili.piccolo : ""} ${className}`}
      {...resto}
    />
  );
}
