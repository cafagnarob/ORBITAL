/**
 * ============================================================================
 * Finestra.tsx — Le tre finestre del design system
 * ============================================================================
 *
 *   sistema  → barra del titolo piena, angolo smussato in alto a destra.
 *              Per i pannelli operativi (crew, nave, risorse).
 *   console  → bordo arrotondato, titolo in una "pillola".
 *              Per i contenuti narrativi: il canale di V.A.L.E.
 *   cornice  → riquadro sottile con crocini agli angoli.
 *              Per dati secondari e annotazioni (scheda del pianeta).
 *
 * `useId` genera un ID unico per collegare la sezione al suo titolo
 * (aria-labelledby): chi usa uno screen reader sente "Equipaggio, sezione".
 * ============================================================================
 */

import { useId, type ReactNode } from "react";
import stili from "./Finestra.module.css";

interface FinestraProps {
  titolo: string;
  variante?: "sistema" | "console" | "cornice";
  /** Contenuto extra a destra del titolo (contatori, stato...). */
  destra?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Finestra({ titolo, variante = "sistema", destra, className = "", children }: FinestraProps) {
  const idTitolo = useId();
  return (
    <section className={`${stili.finestra} ${stili[variante]} ${className}`} aria-labelledby={idTitolo}>
      <header className={stili.barra}>
        {variante === "sistema" && <span className={stili.marcatore} aria-hidden="true">■■■</span>}
        <h2 id={idTitolo} className={stili.titolo}>
          {titolo}
        </h2>
        {destra !== undefined && <span className={stili.destra}>{destra}</span>}
      </header>
      <div className={stili.corpo}>{children}</div>
    </section>
  );
}
