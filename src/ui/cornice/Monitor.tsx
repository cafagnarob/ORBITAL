/**
 * ============================================================================
 * Monitor.tsx — La cornice retro-futurista del "Terminale V.A.L.E. Modello 7"
 * ============================================================================
 *
 * Riferimento: il render del prototipo Missione di Roberto.
 *
 * STRUTTURA (dall'esterno verso l'interno)
 *   .monitor   → la scrivania: sfondo scuro su cui poggia l'apparecchio
 *   .corpo     → il guscio del monitor (plastica scura, bordi molto arrotondati)
 *   .alloggio  → l'incavo in cui è montato il tubo catodico
 *   .schermo   → il vetro: fosfori, linee di scansione, vignettatura, riflesso
 *   frontale   → la fascia in basso con targhetta, griglia, SVC, manopole, LED
 *
 * Il componente non conosce il gioco: riceve il contenuto dello schermo
 * (children) e la fascia frontale già pronta. È "solo" una cornice, e si
 * potrà riusare per le schermate Preparazione e Terra.
 *
 * MOBILE: la cornice resta, ma sottile; la fascia frontale si fissa in fondo
 * allo schermo, così SVC è sempre raggiungibile col pollice.
 * ============================================================================
 */

import type { ReactNode } from "react";
import stili from "./Monitor.module.css";

interface MonitorProps {
  children: ReactNode;
  frontale: ReactNode;
}

export function Monitor({ children, frontale }: MonitorProps) {
  return (
    <div className={stili.monitor}>
      <div className={stili.corpo}>
        <div className={stili.alloggio}>
          <div className={stili.schermo}>{children}</div>
        </div>
        {frontale}
      </div>
    </div>
  );
}
