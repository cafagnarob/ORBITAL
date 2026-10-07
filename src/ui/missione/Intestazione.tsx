/**
 * ============================================================================
 * Intestazione.tsx — La barra in alto: chi siamo, quando siamo, dove siamo
 * ============================================================================
 *
 * Mostra giorno, ora, fase della giornata, stato del gioco e INTEGRITÀ DEI
 * DATI (DESIGN §4.6: quanto ci si può fidare delle letture della nave).
 * Tutti i valori sono CALCOLATI dallo stato: l'intestazione non conserva
 * nulla di suo.
 * ============================================================================
 */

import { faseGiornata, scomponiTempo } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { E17_NOTO } from "../../content/pianeti/e17";
import { faseViaggio } from "../../engine/storia/viaggio";
import type { FaseViaggio } from "../../engine/types";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { integritaDati } from "../../engine/mission";
import { etichetta, formattaOra, tonoIntegrita } from "../format";
import stili from "./Intestazione.module.css";

const LUOGO: Record<FaseViaggio, string> = {
  ANDATA: `IN VIAGGIO → ${E17_NOTO.id}`,
  ORBITA: `${E17_NOTO.id} · ORBITA`,
  RIENTRO: "RIENTRO → TERRA",
};

export function Intestazione({ stato }: { stato: StatoMissione }) {
  const { giorno } = scomponiTempo(stato.tempo);
  const fase = etichetta(faseGiornata(stato.tempo));
  const statoGioco = etichetta(stato.statoGioco);
  const integrita = integritaDati(stato, CONTESTO_GIOCO);
  return (
    <header className={stili.intestazione}>
      <span className={stili.logo}>ORBITAL</span>
      <span className={stili.sistema}>VALE-OS 4.1 ▸ CONTROLLO MISSIONE</span>
      <span className={stili.tempo}>
        GIORNO {giorno} · <strong>{formattaOra(stato.tempo)}</strong>
      </span>
      {/* Alle 06:00 fase e stato coincidono ("PIANIFICAZIONE"): si mostra una volta sola. */}
      {fase !== statoGioco && <span className={stili.fase}>{fase}</span>}
      <span className={stili.statoGioco}>{statoGioco}</span>
      <span className={stili.integrita}>
        INTEGRITÀ DATI <strong className={stili[tonoIntegrita(integrita)]}>{integrita}%</strong>
      </span>
      {/* Dove siamo nel viaggio (v3.7): andata, orbita o rientro. */}
      <span className={stili.luogo}>{LUOGO[faseViaggio(stato)]}</span>
    </header>
  );
}
