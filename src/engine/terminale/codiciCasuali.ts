/**
 * ============================================================================
 * codiciCasuali.ts — I codici che affiorano a caso nei log (v3.9)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.3 (codici nascosti), §3.7 (v3.9).
 *
 * Oltre ai codici della storia (eventi, risposte di V.A.L.E.), a ogni cambio
 * turno c'è una piccola probabilità (balance.codici.probabilitaPerTurno) che
 * nel log compaia una riga di "rumore" con un codice della catena, scelto a
 * caso tra TUTTI (anche fuori ordine: sta al Capitano capire quando usarlo).
 * In media uno ogni giorno e mezzo: né comune né rarissimo.
 *
 * La riga ha lo stesso aspetto delle altre righe di sistema (regola del
 * DESIGN: i codici non sono mai evidenziati). Il Capitano la segnala dalla
 * finestra del terminale e il codice finisce tra i frammenti del SVC-07.
 *
 * DETERMINISMO
 * Il generatore nasce da seed + minuto (deriveSeed): stessa partita, stessi
 * codici negli stessi momenti, e i numeri casuali della partita restano
 * intatti (le altre simulazioni non cambiano).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { createRng, deriveSeed } from "../rng";
import type { StatoMissione } from "../types";

/** Al cambio turno: forse una riga con un codice. Restituisce il codice, o null. */
export function forseCodiceCasuale(bozza: StatoMissione, contesto: ContestoMissione): string | null {
  const codici = Object.keys(contesto.catalogoCodici);
  const righe = contesto.testiVale.codiceCasuale;
  if (codici.length === 0 || righe.length === 0) return null;

  const rng = createRng(deriveSeed(bozza.seed, `codice:${bozza.tempo}`));
  if (!rng.chance(BALANCE.codici.probabilitaPerTurno)) return null;

  const codice = rng.pick(codici);
  const hex = rng.int(0, 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const testo = rng.pick(righe).replaceAll("{CODICE}", codice).replaceAll("{HEX}", hex);
  scriviLog(bozza, "SISTEMA", testo, [codice]);
  return codice;
}
