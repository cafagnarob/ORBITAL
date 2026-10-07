/**
 * ============================================================================
 * minigiochi.ts — Quando compare un minigioco e cosa vale il risultato
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9.2 (minigiochi, v3.6).
 *
 * L'IDEA
 * Quando un task parte, il Capitano può "dare una mano" alla crew con un
 * minigioco coerente col lavoro (radar per le scansioni, valvole per il
 * supporto vitale…). Il motore non sa come si gioca: sa solo
 *   1. QUANDO proporlo (proponiMinigioco, all'avvio del task);
 *   2. quanto VALE il punteggio 0–1 che l'interfaccia gli restituisce
 *      (risolviMinigioco): toglie punti di rischio al task, fino a
 *      balance.minigiochi.bonusMassimo. Giocare male non peggiora nulla.
 *
 * QUANDO COMPARE
 *   - mai se il task non ha un minigioco o il rischio è già bassissimo;
 *   - sempre se il rischio è alto (≥ sogliaRischio);
 *   - altrimenti con una certa probabilità. Il "dado" è un hash del seed e
 *     dell'ID del task: deterministico (stessa partita, stessi minigiochi)
 *     senza dover passare il generatore casuale fino a avviaTask.
 *   - uno alla volta: se ce n'è già uno in attesa, gli altri si saltano.
 *
 * Finché un minigioco è in attesa il tempo non scorre (reducer: AVANZA e
 * AVANZA_FINO si fermano), come per una decisione.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { scriviLog } from "../mission/log";
import { hashSeed } from "../rng";
import type { DefinizioneTask, IstanzaTask, StatoMissione } from "../types";

/** Il livello di difficoltà dal rischio del task. */
export function difficoltaDaRischio(rischio: number): 1 | 2 | 3 {
  const m = BALANCE.minigiochi;
  if (rischio >= m.difficoltaAlta) return 3;
  if (rischio >= m.difficoltaMedia) return 2;
  return 1;
}

/** Punti di rischio tolti da un punteggio 0–1. */
export function bonusMinigioco(punteggio: number): number {
  const p = Math.min(1, Math.max(0, punteggio));
  return Math.round(BALANCE.minigiochi.bonusMassimo * p);
}

/** Il minigioco va proposto per questo task appena avviato? (Pura.) */
export function vaProposto(stato: StatoMissione, def: DefinizioneTask, task: IstanzaTask): boolean {
  const m = BALANCE.minigiochi;
  if (!def.minigioco || task.rischio === null || stato.minigioco !== null) return false;
  if (task.rischio < m.rischioMinimo) return false;
  if (task.rischio >= m.sogliaRischio) return true;
  // Un "dado" deterministico tra 0 e 1, diverso per ogni task della partita.
  const dado = hashSeed(`${stato.seed}:minigioco:${task.id}`) / 0x1_0000_0000;
  return dado < m.probabilita;
}

/** Chiamata da avviaTask, sulla bozza: propone il minigioco se è il caso. */
export function proponiMinigioco(bozza: StatoMissione, def: DefinizioneTask, task: IstanzaTask): void {
  if (!def.minigioco || task.rischio === null || !vaProposto(bozza, def, task)) return;
  bozza.minigioco = { idTask: task.id, tipo: def.minigioco.tipo, difficolta: difficoltaDaRischio(task.rischio) };
}

/** Applica il punteggio (0 = il Capitano lascia fare alla crew). */
export function risolviMinigioco(bozza: StatoMissione, punteggio: number): void {
  const attesa = bozza.minigioco;
  if (!attesa) throw new Error("Nessun minigioco in attesa");
  bozza.minigioco = null;

  const task = bozza.tasks[attesa.idTask];
  if (!task || task.stato !== "IN_CORSO" || task.rischio === null) return;
  const nome = bozza.crew[task.responsabile]?.nome ?? "?";
  const bonus = bonusMinigioco(punteggio);
  if (bonus === 0) {
    scriviLog(bozza, "SISTEMA", punteggio <= 0 ? `${nome} procede da solo.` : `Assistenza del Capitano a ${nome}: nessun effetto.`);
    return;
  }
  task.rischio = Math.max(2, task.rischio - bonus);
  scriviLog(bozza, "SISTEMA", `Assistenza del Capitano a ${nome}: rischio −${bonus} punti.`);
}
