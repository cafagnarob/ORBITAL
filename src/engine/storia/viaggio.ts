/**
 * ============================================================================
 * viaggio.ts — Andata, orbita, rientro: le tre fasi della super-missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6 (v3.7).
 *
 *   ANDATA   giorni 1–3: si viaggia verso E-17. Sopravvivenza: manutenzione
 *            della nave e della crew, imprevisti di viaggio.
 *   ORBITA   dal giorno 4: si lavora sul Cratere Settentrionale (la
 *            scaletta: calibra, correggi, ripara, scansiona).
 *   RIENTRO  dalla PARTENZA: tre giorni di viaggio verso casa; all'arrivo
 *            la missione finisce (finale di RIENTRO).
 *
 * LA FASE SI CALCOLA
 * Nello stato c'è solo `partenza` (il minuto in cui si è lasciata l'orbita,
 * o null). La fase si ricava dal giorno e da quel valore: niente da tenere
 * "in sincrono".
 *
 * LA PARTENZA
 *   - la ordina il Capitano (RIENTRA, solo in orbita) o un evento (PARTENZA);
 *   - si apre da sola la finestra di rientro al risveglio del giorno 8;
 *   - costa la RISERVA DI RIENTRO di carburante: se non c'è, la nave non
 *     riesce a uscire dall'orbita e resta ALLA DERIVA (fine della missione);
 *   - se V.A.L.E. comanda la nave (autonomia AUTONOMA, niente override),
 *     alla finestra la nave non parte: CONTROLLO_VALE.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { scomponiTempo } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { FaseViaggio, StatoMissione } from "../types";
import { livelloAutonomia } from "../vale/comportamento";
import { scriviDiario } from "./diario";

const giorno = (t: number) => scomponiTempo(t).giorno;

/** In che fase del viaggio siamo. */
export function faseViaggio(stato: StatoMissione): FaseViaggio {
  if (stato.partenza !== null) return "RIENTRO";
  return giorno(stato.tempo) <= BALANCE.missione.giorniAndata ? "ANDATA" : "ORBITA";
}

/** Il giorno in cui si apre (da sola) la finestra di rientro. */
export function giornoFinestraRientro(): number {
  const m = BALANCE.missione;
  return m.giorniAndata + m.giorniOrbita + 1;
}

/** Il giorno d'arrivo a casa (null se non si è ancora partiti). */
export function giornoArrivo(stato: StatoMissione): number | null {
  return stato.partenza === null ? null : giorno(stato.partenza) + BALANCE.missione.giorniRientro;
}

/** V.A.L.E. ha il comando della nave? */
export function valeComanda(stato: StatoMissione, contesto: ContestoMissione): boolean {
  return !stato.vale.override && livelloAutonomia(stato, contesto) >= BALANCE.storia.autonomiaBlocco;
}

/**
 * La nave lascia l'orbita (sulla bozza). Se manca la riserva di carburante
 * la missione finisce alla deriva. `concludi` arriva da fine.ts (passata
 * come parametro per evitare un import circolare tra i due file).
 */
export function avviaRientro(
  bozza: StatoMissione,
  contesto: ContestoMissione,
  concludi: (bozza: StatoMissione, contesto: ContestoMissione, causa: "DERIVA") => void,
): void {
  if (faseViaggio(bozza) !== "ORBITA" || bozza.statoGioco === "CONCLUSA") return;
  const riserva = BALANCE.preparazione.riservaRientro;
  if (bozza.risorse.carburante < riserva) {
    scriviLog(bozza, "VALE", "Carburante insufficiente per la traiettoria di rientro.");
    concludi(bozza, contesto, "DERIVA");
    return;
  }
  bozza.risorse.carburante -= riserva;
  bozza.partenza = bozza.tempo;
  scriviLog(bozza, "SISTEMA", `PROPULSIONE · ACCENSIONE DI USCITA DALL'ORBITA · CARBURANTE −${riserva}`);
  scriviLog(bozza, "VALE", `Rotta per la Terra calcolata. Arrivo previsto tra ${BALANCE.missione.giorniRientro} giorni.`);
  scriviDiario(bozza, "Abbiamo lasciato l'orbita di E-17. Si torna a casa.");
}
