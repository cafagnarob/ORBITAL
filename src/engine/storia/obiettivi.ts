/**
 * ============================================================================
 * obiettivi.ts — Obiettivi della missione: principali e di contorno (v3.7)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6.
 *
 * Un obiettivo è un DATO (v3.8: dentro ogni missione, content/missioni/): quando compare (visibile),
 * quando è raggiunto (completato), cosa si guadagna (ricompensa). Sono
 * condizioni ed effetti, lo stesso linguaggio degli eventi.
 *
 * Il motore, dopo ogni azione, controlla se qualche obiettivo visibile è
 * appena stato raggiunto: lo segna in `obiettiviCompletati` (così la
 * ricompensa arriva UNA volta sola), applica la ricompensa e lo racconta
 * nel log e nel giornale di bordo.
 * ============================================================================
 */

import { MOMENTO_VUOTO, verificaTutte } from "../eventi/condizioni";
import { AMBITO_VUOTO, applicaEffetti } from "../eventi/effetti";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { DefinizioneObiettivo, StatoMissione } from "../types";
import { scriviDiario } from "./diario";

/** Gli obiettivi che il Capitano vede in questo momento. */
export function obiettiviVisibili(stato: StatoMissione, contesto: ContestoMissione): DefinizioneObiettivo[] {
  // Gli obiettivi sono quelli della supermissione della partita (v3.8).
  const obiettivi = contesto.missioni[stato.missione.id]?.obiettivi ?? [];
  return obiettivi.filter(
    (o) => stato.obiettiviCompletati.includes(o.id) || verificaTutte(stato, contesto, o.visibile, MOMENTO_VUOTO),
  );
}

/** Ricompensa gli obiettivi appena raggiunti (sulla bozza). */
export function controllaObiettivi(bozza: StatoMissione, contesto: ContestoMissione): void {
  if (bozza.statoGioco === "CONCLUSA") return;
  for (const o of obiettiviVisibili(bozza, contesto)) {
    if (bozza.obiettiviCompletati.includes(o.id)) continue;
    if (o.completato.length === 0 || !verificaTutte(bozza, contesto, o.completato, MOMENTO_VUOTO)) continue;
    bozza.obiettiviCompletati.push(o.id);
    scriviLog(bozza, "SISTEMA", `OBIETTIVO ${o.tipo === "PRINCIPALE" ? "PRINCIPALE" : "SECONDARIO"} RAGGIUNTO · ${o.titolo.toUpperCase()}`);
    if (o.testoRicompensa) scriviLog(bozza, "VALE", o.testoRicompensa);
    scriviDiario(bozza, `Obiettivo raggiunto: ${o.titolo}.`);
    applicaEffetti(bozza, o.ricompensa, AMBITO_VUOTO, contesto);
  }
}
