/**
 * ============================================================================
 * BarraAvvio.tsx — La barra in fondo: stato in breve + AVVIA MISSIONE
 * ============================================================================
 *
 * Gemella della BarraComandi della Missione: stessa posizione, stesso
 * comportamento su mobile (resta incollata in fondo, sopra la fascia del
 * monitor), così il pulsante principale è sempre sotto il pollice.
 *
 * Se la missione è IMPOSSIBILE il pulsante è disattivato e accanto compare
 * "Perché?", che riapre il pop-up DANGER sulla mappa della nave (v3.9):
 * un pulsante spento senza spiegazione è frustrante.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { Riepilogo } from "../../engine/preparazione";
import type { Fattibilita, Preparazione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import { tonoFattibilita } from "../format";
import stili from "./BarraAvvio.module.css";

interface Props {
  prep: Preparazione;
  riepilogo: Riepilogo;
  fattibilita: Fattibilita;
  onAvvia: () => void;
  onMostraProblemi: () => void;
}

export function BarraAvvio({ prep, riepilogo, fattibilita, onAvvia, onMostraProblemi }: Props) {
  const p = BALANCE.preparazione;
  const impossibile = fattibilita === "IMPOSSIBILE";

  return (
    <footer className={stili.barra}>
      <p className={stili.testo}>
        CREW {prep.crew.length}/{p.crewRichiesta} · CARICO {riepilogo.carico.totale}/{p.caricoMassimo} KG ·{" "}
        <span className={stili[tonoFattibilita(fattibilita)]}>{fattibilita}</span>
      </p>
      {impossibile && (
        <Pulsante className={stili.perche} onClick={onMostraProblemi}>
          Perché?
        </Pulsante>
      )}
      <Pulsante variante="primario" className={stili.pulsante} disabled={impossibile} onClick={onAvvia}>
        Avvia missione ▶
      </Pulsante>
    </footer>
  );
}
