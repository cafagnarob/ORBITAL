/**
 * ============================================================================
 * viaggio.ts — Andata, orbita, rientro: le tre fasi della super-missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6 (v3.7), §14.7 (v3.8).
 *
 * I giorni di ogni fase vengono dal PIANO della partita (stato.missione,
 * deciso dal seed): qui sotto A = giorni d'andata, O = giorni in orbita,
 * R = giorni di rientro.
 *
 *   ANDATA   giorni 1–A: si viaggia verso il bersaglio. Sopravvivenza:
 *            manutenzione della nave e della crew, imprevisti di viaggio.
 *   ORBITA   dal giorno A+1: si lavora vicino al bersaglio (la scaletta
 *            della supermissione: preparativi, poi il task finale).
 *   RIENTRO  dalla PARTENZA: R giorni di viaggio verso casa; all'arrivo
 *            la missione finisce (finale di RIENTRO).
 *
 * LA FASE SI CALCOLA
 * Nello stato c'è solo `partenza` (il minuto in cui si è lasciata l'orbita,
 * o null). La fase si ricava dal giorno e da quel valore: niente da tenere
 * "in sincrono".
 *
 * LA PARTENZA
 *   - la ordina il Capitano (RIENTRA, solo in orbita) o un evento (PARTENZA);
 *   - si apre da sola la finestra di rientro al risveglio del giorno A+O+1;
 *   - costa la RISERVA DI RIENTRO di carburante: se non c'è, la nave non
 *     riesce a uscire dall'orbita e resta ALLA DERIVA (fine della missione);
 *   - se V.A.L.E. comanda la nave (autonomia AUTONOMA, niente override),
 *     alla finestra la nave non parte: CONTROLLO_VALE.
 *
 * LA TRATTA (v3.7.1)
 * Per la Plancia (ui/missione/plancia) serve sapere QUANTO manca: la tratta
 * in corso va dal risveglio della partenza al risveglio del giorno d'arrivo.
 * È di nuovo un calcolo, non un dato salvato.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { ORARIO_RISVEGLIO, scomponiTempo } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { FaseViaggio, Minuti, StatoMissione } from "../types";
import { livelloAutonomia } from "../vale/comportamento";
import { scriviDiario } from "./diario";

const giorno = (t: number) => scomponiTempo(t).giorno;

/** In che fase del viaggio siamo. Le durate sono quelle del piano (v3.8). */
export function faseViaggio(stato: StatoMissione): FaseViaggio {
  if (stato.partenza !== null) return "RIENTRO";
  return giorno(stato.tempo) <= stato.missione.durate.andata ? "ANDATA" : "ORBITA";
}

/** Il giorno in cui si apre (da sola) la finestra di rientro. */
export function giornoFinestraRientro(stato: StatoMissione): number {
  const d = stato.missione.durate;
  return d.andata + d.orbita + 1;
}

/** Il giorno d'arrivo a casa (null se non si è ancora partiti). */
export function giornoArrivo(stato: StatoMissione): number | null {
  return stato.partenza === null ? null : giorno(stato.partenza) + stato.missione.durate.rientro;
}

/** Una tratta di viaggio: da dove a dove, e a che punto siamo. */
export interface Tratta {
  /** Verso il bersaglio della missione (andata) o verso casa (rientro). */
  destinazione: "BERSAGLIO" | "TERRA";
  /** Minuto di partenza e minuto d'arrivo previsto. */
  da: Minuti;
  a: Minuti;
  /** 0 = appena partiti, 1 = arrivati. */
  progresso: number;
  minutiAllArrivo: Minuti;
}

/** Il risveglio (06:00) di un giorno, in minuti dall'inizio della missione. */
const risveglioDel = (g: number): Minuti => (g - 1) * 1440 + ORARIO_RISVEGLIO;

/** La tratta in corso, o null se siamo in orbita. */
export function trattaInCorso(stato: StatoMissione): Tratta | null {
  const fase = faseViaggio(stato);
  if (fase === "ORBITA") return null;
  const [destinazione, da, a]: [Tratta["destinazione"], Minuti, Minuti] =
    fase === "ANDATA"
      ? ["BERSAGLIO", risveglioDel(1), risveglioDel(stato.missione.durate.andata + 1)]
      : ["TERRA", stato.partenza ?? stato.tempo, risveglioDel(giornoArrivo(stato) ?? 0)];
  const progresso = Math.min(1, Math.max(0, (stato.tempo - da) / Math.max(1, a - da)));
  return { destinazione, da, a, progresso, minutiAllArrivo: Math.max(0, a - stato.tempo) };
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
  scriviLog(bozza, "VALE", `Rotta per la Terra calcolata. Arrivo previsto tra ${bozza.missione.durate.rientro} giorni.`);
  const nome = contesto.missioni[bozza.missione.id]?.nome ?? "destinazione";
  scriviDiario(bozza, `Abbiamo lasciato ${nome}. Si torna a casa.`);
}
