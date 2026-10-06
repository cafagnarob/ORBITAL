/**
 * ============================================================================
 * Monitor.tsx — La cornice retro-futurista del "Terminale V.A.L.E. Modello 7"
 * ============================================================================
 *
 * Riferimento: il render del prototipo Missione di Roberto.
 *
 * STRUTTURA (dall'esterno verso l'interno)
 *   .monitor    → la scrivania: sfondo scuro su cui poggia l'apparecchio
 *   .corpo      → il guscio del monitor (plastica scura, bordi molto arrotondati)
 *   .alloggio   → l'incavo in cui è montato il tubo catodico
 *   .schermo    → il vetro: fosfori, linee di scansione, vignettatura, riflesso
 *     .immagine → ciò che il tubo "disegna": è questa che si accende e si spegne
 *   frontale    → la fascia in basso con targhetta, griglia, SVC, manopole, LED
 *
 * ACCENSIONE E SPEGNIMENTO (useAccensione.ts)
 * La fase arriva da fuori (`fase`). Ogni fase ha un'animazione CSS:
 *   ACCENSIONE  → punto → riga → immagine sovraesposta che si assesta
 *   SPEGNIMENTO → l'immagine si schiaccia in una riga, la riga in un punto
 *   SPENTO      → resta il bagliore del punto, che svanisce
 * Quando l'animazione finisce, il browser lancia `animationend` e noi
 * avvisiamo chi comanda (onFineTransizione). Attenzione: animationend
 * "risale" (bubbling) anche dalle animazioni dei figli (le capsule della
 * nave, le righe del diario…). Per questo controlliamo che l'evento sia
 * nato proprio sull'elemento della fase (e.target === e.currentTarget).
 *
 * MOBILE: la cornice resta, ma sottile; la fascia frontale si fissa in fondo
 * allo schermo, così SVC è sempre raggiungibile col pollice.
 * ============================================================================
 */

import type { AnimationEvent, ReactNode } from "react";
import stili from "./Monitor.module.css";
import type { FaseSchermo } from "./useAccensione";

interface MonitorProps {
  children: ReactNode;
  frontale: ReactNode;
  /** Fase del tubo; senza, il monitor è semplicemente acceso. */
  fase?: FaseSchermo;
  onFineTransizione?: () => void;
  /** Scritta che compare mentre il tubo si accende, es. "GIORNO 03 · 06:00". */
  didascalia?: string;
}

const CLASSI_FASE: Record<FaseSchermo, string> = {
  ACCENSIONE: "accensione",
  ACCESO: "acceso",
  SPEGNIMENTO: "spegnimento",
  SPENTO: "spento",
};

export function Monitor({ children, frontale, fase = "ACCESO", onFineTransizione, didascalia }: MonitorProps) {
  /** Solo le animazioni dell'elemento stesso, non quelle dei figli. */
  function fine(e: AnimationEvent<HTMLElement>) {
    if (e.target === e.currentTarget) onFineTransizione?.();
  }

  return (
    <div className={stili.monitor}>
      <div className={stili.corpo}>
        <div className={stili.alloggio}>
          <div className={stili.schermo}>
            <div className={`${stili.immagine} ${stili[CLASSI_FASE[fase]]}`} onAnimationEnd={fine}>
              {children}
            </div>

            {/* Il bagliore del fosforo a monitor spento (è lui a far "passare la notte"). */}
            {fase === "SPENTO" && <div className={stili.bagliore} onAnimationEnd={fine} aria-hidden="true" />}

            {/* Le prime righe del sistema mentre il tubo si scalda. */}
            {fase === "ACCENSIONE" && didascalia && (
              <p className={stili.didascalia} aria-hidden="true">
                {didascalia}
              </p>
            )}
          </div>
        </div>
        {frontale}
      </div>
    </div>
  );
}
