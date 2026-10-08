/**
 * ============================================================================
 * piano.ts — Dal seed alla supermissione: quale, e quanto dura (v3.8)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.7.
 *
 * QUALE MISSIONE
 *   1. Se il seed comincia con la SIGLA di una missione seguita da "-"
 *      (es. "ARGO-0042", "HK7-x"), è quella: il giocatore può scegliere.
 *      Anche il seed uguale alla sola sigla vale ("KST").
 *   2. Altrimenti decide il caso: un generatore nato dal seed
 *      (deriveSeed(seed, "missione")) pesca una missione, tutte con la
 *      stessa probabilità.
 *
 * QUANTO DURA
 * Ogni missione ha un intervallo di giorni per fase (es. andata 2–4). Un
 * secondo generatore (deriveSeed(seed, "durata")) sceglie un numero in ogni
 * intervallo. Generatori SEPARATI: cambiare la lista delle missioni non
 * cambia le durate, e nessuno dei due tocca i numeri casuali della partita.
 *
 * Stesso seed → sempre la stessa missione con le stesse durate.
 * Funzione pura: riceve il catalogo, non lo importa (il motore non dipende
 * dal contenuto).
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { createRng, deriveSeed } from "../rng";
import type { DefinizioneMissione, PianoMissione, StatoMissione } from "../types";

/** La missione indicata dalla sigla in testa al seed, se c'è. */
function missioneDallaSigla(seed: string, missioni: readonly DefinizioneMissione[]): DefinizioneMissione | undefined {
  const s = seed.trim().toUpperCase();
  return missioni.find((m) => s === m.sigla || s.startsWith(`${m.sigla}-`));
}

export function pianoDalSeed(seed: string, missioni: readonly DefinizioneMissione[]): PianoMissione {
  if (missioni.length === 0) throw new Error("Nessuna missione nel catalogo");
  const missione = missioneDallaSigla(seed, missioni) ?? createRng(deriveSeed(seed, "missione")).pick(missioni);

  const rng = createRng(deriveSeed(seed, "durata"));
  const { andata, orbita, rientro } = missione.durate;
  return {
    id: missione.id,
    durate: {
      andata: rng.int(andata.min, andata.max),
      orbita: rng.int(orbita.min, orbita.max),
      rientro: rng.int(rientro.min, rientro.max),
    },
  };
}

/** Giorni totali di una partita (andata + orbita + rientro). */
export function giorniTotali(piano: PianoMissione): number {
  return piano.durate.andata + piano.durate.orbita + piano.durate.rientro;
}

/**
 * I segnaposto della missione nei testi comuni (finali, diario, epiloghi):
 *   {BERSAGLIO}  il nome del bersaglio ("E-17", "Argo-3"…)
 *   {RISULTATO}  cosa si riporta a casa (DefinizioneMissione.risultato)
 * Così un solo finale «Missione compiuta» vale per tutte le missioni.
 */
export function conMissione(testo: string, stato: StatoMissione, contesto: ContestoMissione): string {
  const m = contesto.missioni[stato.missione.id];
  return testo.replaceAll("{BERSAGLIO}", m?.nome ?? "il bersaglio").replaceAll("{RISULTATO}", m?.risultato ?? "i dati della missione");
}
