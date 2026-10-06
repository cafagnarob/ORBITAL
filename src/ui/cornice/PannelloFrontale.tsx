/**
 * ============================================================================
 * PannelloFrontale.tsx — La fascia in basso del monitor
 * ============================================================================
 *
 * Targhetta "TERMINALE V.A.L.E. · MODELLO 7 · FOSFORI P1", griglia
 * dell'altoparlante, pulsante SVC, due manopole e due LED (dal prototipo).
 *
 * CONTROLLI VERI
 *   SVC        apre il Terminale di manutenzione;
 *   2 manopole AMB (ambiente) e VOCE (V.A.L.E.): il volume dell'audio,
 *              a scatti (vedi Manopola.tsx).
 * SVC è volutamente discreto (piccolo, grigio, sulla plastica e non sullo
 * schermo): chi non lo nota non lo usa, ed è parte del gioco.
 * Nella Preparazione non c'è ancora nulla da manutenere: si passa null e
 * il pulsante resta lì, fisicamente uguale, ma non risponde.
 *
 * I LED hanno un significato:
 *   ambra lampeggiante → il gioco attende una DECISIONE
 *   ambra fisso tenue  → nessuna urgenza
 *   verde              → terminale acceso (sempre)
 * ============================================================================
 */

import { suona } from "../audio";
import { Manopola } from "./Manopola";
import stili from "./PannelloFrontale.module.css";

interface Props {
  /** null = terminale non disponibile (es. durante la Preparazione). */
  onApriTerminale: (() => void) | null;
  /** Accende il LED ambra lampeggiante. */
  allerta: boolean;
}

export function PannelloFrontale({ onApriTerminale, allerta }: Props) {
  return (
    <div className={stili.frontale}>
      <div className={stili.targhetta}>
        <span className={stili.marca}>TERMINALE V.A.L.E.</span>
        <span className={stili.modello}>MODELLO 7 · FOSFORI P1</span>
      </div>

      <div className={stili.griglia} aria-hidden="true">
        <span />
        <span />
      </div>

      <div className={stili.controlli}>
        <button
          type="button"
          className={stili.svc}
          onClick={
            onApriTerminale
              ? () => {
                  suona("TERMINALE");
                  onApriTerminale();
                }
              : undefined
          }
          disabled={onApriTerminale === null}
          aria-label="SVC · terminale di servizio"
        >
          SVC
        </button>
        <Manopola canale="ambiente" sigla="AMB" nome="Volume ambiente" />
        <Manopola canale="voce" sigla="VOCE" nome="Volume voce di V.A.L.E." />
        <span className={`${stili.led} ${stili.ambra} ${allerta ? stili.lampeggia : ""}`} aria-hidden="true" />
        <span className={`${stili.led} ${stili.verde}`} aria-hidden="true" />
      </div>
    </div>
  );
}
