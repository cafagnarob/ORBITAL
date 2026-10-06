/**
 * ============================================================================
 * attivazione.ts — Far accadere un evento e risolvere la decisione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §8 (stato DECISIONE), §10.
 *
 *   controllaEventi  → chiamata dal reducer dopo ogni AVANZA:
 *                      sceglie al massimo un evento e lo fa accadere.
 *     - evento INFORMATIVO (senza scelte): log + effetti, e il gioco continua.
 *     - evento con SCELTE: log + effetti immediati, poi il gioco si ferma
 *       in DECISIONE finché il Capitano non sceglie.
 *
 *   verificaScelta / risolviEvento → l'azione RISOLVI_EVENTO.
 *     Dopo la decisione si torna allo stato in cui eravamo (di solito
 *     IN_ESECUZIONE, ma anche RAPPORTO se l'evento è arrivato alle 22:00).
 *
 * Le funzioni "verifica" non modificano nulla; le altre lavorano sulla bozza.
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { Rng } from "../rng";
import type { StatoMissione } from "../types";
import { MOMENTO_VUOTO, trovaTaskOrigine, verificaTutte, type MomentoEventi } from "./condizioni";
import { applicaEffetti } from "./effetti";
import { eventiIdonei, scegliEvento } from "./selezione";

export function controllaEventi(bozza: StatoMissione, contesto: ContestoMissione, rng: Rng, momento: MomentoEventi): void {
  // Una decisione alla volta.
  if (bozza.eventi.inAttesa !== null) return;

  const evento = scegliEvento(eventiIdonei(bozza, contesto, momento), rng);
  if (evento === null) return;

  const origine = trovaTaskOrigine(bozza, contesto, evento.condizioni, momento);
  scriviLog(bozza, evento.fonte, evento.testo, evento.codici);
  applicaEffetti(bozza, evento.effetti, origine);

  if (evento.scelte.length === 0) {
    bozza.eventi.accaduti.push({ id: evento.id, tempo: bozza.tempo, scelta: null });
    return;
  }

  // Serve una decisione: si registra l'evento quando il Capitano avrà scelto.
  bozza.eventi.inAttesa = { id: evento.id, ritorno: bozza.statoGioco, idTaskOrigine: origine };
  bozza.statoGioco = "DECISIONE";
}

/** Motivo per cui una scelta non è possibile, o null se lo è. */
export function verificaScelta(stato: StatoMissione, contesto: ContestoMissione, idScelta: string): string | null {
  const attesa = stato.eventi.inAttesa;
  if (attesa === null) return "Nessuna decisione in attesa";
  const evento = contesto.catalogoEventi[attesa.id];
  if (!evento) return `Evento sconosciuto: ${attesa.id}`;
  const scelta = evento.scelte.find((s) => s.id === idScelta);
  if (!scelta) return `Scelta sconosciuta: ${idScelta}`;
  if (!verificaTutte(stato, contesto, scelta.requisiti, MOMENTO_VUOTO)) return "Requisiti non soddisfatti";
  return null;
}

/** Applica la scelta del Capitano e riporta il gioco dove si trovava. */
export function risolviEvento(bozza: StatoMissione, contesto: ContestoMissione, idScelta: string): void {
  const attesa = bozza.eventi.inAttesa;
  const evento = attesa ? contesto.catalogoEventi[attesa.id] : undefined;
  const scelta = evento?.scelte.find((s) => s.id === idScelta);
  if (!attesa || !evento || !scelta) throw new Error("risolviEvento: chiamata senza una scelta valida");

  scriviLog(bozza, "SISTEMA", `Decisione del Capitano: ${scelta.etichetta}`);
  applicaEffetti(bozza, scelta.effetti, attesa.idTaskOrigine);

  bozza.eventi.accaduti.push({ id: evento.id, tempo: bozza.tempo, scelta: scelta.id });
  bozza.eventi.inAttesa = null;
  bozza.statoGioco = attesa.ritorno;
}
