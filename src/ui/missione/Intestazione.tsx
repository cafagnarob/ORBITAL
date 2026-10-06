/**
 * ============================================================================
 * Intestazione.tsx — La barra in alto: chi siamo, quando siamo, dove siamo
 * ============================================================================
 *
 * Mostra giorno, ora, fase della giornata e stato del gioco. Tutti i valori
 * sono CALCOLATI dallo stato (scomponiTempo, faseGiornata): l'intestazione
 * non conserva nulla di suo.
 * ============================================================================
 */

import { faseGiornata, scomponiTempo } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { E17_NOTO } from "../../content/pianeti/e17";
import { etichetta, formattaOra } from "../format";
import stili from "./Intestazione.module.css";

export function Intestazione({ stato }: { stato: StatoMissione }) {
  const { giorno } = scomponiTempo(stato.tempo);
  return (
    <header className={stili.intestazione}>
      <span className={stili.logo}>ORBITAL</span>
      <span className={stili.sistema}>VALE-OS 4.1 ▸ CONTROLLO MISSIONE</span>
      <span className={stili.tempo}>
        GIORNO {giorno} · <strong>{formattaOra(stato.tempo)}</strong>
      </span>
      <span className={stili.fase}>{etichetta(faseGiornata(stato.tempo))}</span>
      <span className={stili.statoGioco}>{etichetta(stato.statoGioco)}</span>
      <span className={stili.luogo}>{E17_NOTO.id} · ORBITA</span>
    </header>
  );
}
