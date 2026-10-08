/**
 * ============================================================================
 * AvvisoPreparazione.tsx — Il pop-up WARNING / DANGER del pre-lancio (v3.9)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.4 (fattibilità), §11.6 (v3.9).
 *
 * Prende il posto della lista «DA SISTEMARE» del riepilogo. È SEMPRE
 * VISIBILE finché c'è qualcosa che non va, appoggiato sulla mappa della
 * nave (su telefono, subito sotto):
 *   DANGER   (rosso)  c'è un problema BLOCCANTE: non si parte;
 *   WARNING  (ambra)  si parte, ma è rischioso.
 * Sparisce da solo quando la nave è a posto (fattibilità POSSIBILE).
 *
 * Il pop-up dice COSA manca in poche righe e rimanda alla MAPPA: lì i pezzi
 * da aggiungere sono disegnati come sagome tratteggiate (rosse = mancanti,
 * ambra = consigliati: NaveSezione + engine/preparazione/suggerimenti.ts).
 *
 * RIDUCIBILE: il tasto "—" lo stringe a una sola riga (stato dell'interfaccia,
 * useState). «Perché?» nella barra in fondo lo riapre e gli dà il fuoco:
 * per questo il componente riceve `espanso` dal genitore (stato "sollevato").
 * ============================================================================
 */

import type { Fattibilita, ProblemaPreparazione } from "../../engine/types";
import stili from "./AvvisoPreparazione.module.css";

interface Props {
  problemi: readonly ProblemaPreparazione[];
  fattibilita: Fattibilita;
  espanso: boolean;
  onEspandi: (espanso: boolean) => void;
}

export function AvvisoPreparazione({ problemi, fattibilita, espanso, onEspandi }: Props) {
  if (problemi.length === 0 || fattibilita === "POSSIBILE") return null;
  const pericolo = fattibilita === "IMPOSSIBILE";
  // I bloccanti prima: sono quelli che impediscono di partire.
  const ordinati = [...problemi].sort((a, b) => (a.gravita === b.gravita ? 0 : a.gravita === "BLOCCANTE" ? -1 : 1));

  return (
    <aside
      id="avviso-preparazione"
      tabIndex={-1}
      className={`${stili.avviso} ${pericolo ? stili.danger : stili.warning} ${espanso ? "" : stili.ridotto}`}
      role={pericolo ? "alert" : "status"}
      aria-label={pericolo ? "Pericolo: la missione non può partire" : "Attenzione: partenza rischiosa"}
    >
      <header className={stili.barra}>
        <span className={stili.simbolo} aria-hidden="true">
          {pericolo ? "✖" : "⚠"}
        </span>
        <strong>{pericolo ? "DANGER" : "WARNING"}</strong>
        <span className={stili.sottotitolo}>
          {pericolo ? "PARTENZA IMPOSSIBILE" : "PARTENZA RISCHIOSA"} · {problemi.length}
        </span>
        <button
          type="button"
          className={stili.riduci}
          aria-expanded={espanso}
          aria-controls="avviso-preparazione-lista"
          aria-label={espanso ? "Riduci l'avviso" : "Espandi l'avviso"}
          onClick={() => onEspandi(!espanso)}
        >
          {espanso ? "—" : "+"}
        </button>
      </header>

      {espanso && (
        <div className={stili.corpo} id="avviso-preparazione-lista">
          <ul className={stili.lista}>
            {ordinati.map((pr) => (
              <li key={pr.testo} className={pr.gravita === "BLOCCANTE" ? stili.bloccante : stili.rischio}>
                <span aria-hidden="true">{pr.gravita === "BLOCCANTE" ? "■" : "□"}</span> {pr.testo}
              </li>
            ))}
          </ul>
          <p className={stili.legenda}>
            Sulla mappa: <span className={stili.legMancante}>▭ rosso</span> = da aggiungere ·{" "}
            <span className={stili.legConsigliato}>▭ ambra</span> = consigliato
          </p>
        </div>
      )}
    </aside>
  );
}
