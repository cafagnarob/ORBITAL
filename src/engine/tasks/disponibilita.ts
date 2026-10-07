/**
 * ============================================================================
 * disponibilita.ts — Un task si può assegnare adesso? E se no, perché?
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9.1 (progressione dei task, v3.3).
 *
 * I QUATTRO CASI
 *   NASCOSTO      il task non esiste ancora per la crew: mancano lo sblocco
 *                 (giorno, catena, evento), una scoperta, un modulo o
 *                 l'attrezzatura. Non si mostra: sarebbe uno spoiler.
 *   ESAURITO      era da fare una volta sola ed è stato fatto.
 *   IN_CORSO      qualcuno ce l'ha già in coda o lo sta facendo: assegnarlo
 *                 a un secondo membro sarebbe lavoro doppio.
 *   IN_RICARICA   è stato appena completato: torna disponibile tra un po'
 *                 (la diagnostica di stamattina vale per tutto il giorno).
 *   DISPONIBILE   si può assegnare.
 *
 * TUTTO DERIVATO
 * Nello stato non c'è nessun elenco "task sbloccati" o "in ricarica": si
 * ricava ogni volta dalla storia dei task e degli eventi (stato.tasks,
 * stato.eventi.accaduti). Un dato calcolato non può andare fuori sincrono.
 *
 * RICARICA 0
 * `ricaricaOre: 0` significa "routine": sempre disponibile, anche a più
 * persone insieme (es. la pausa di riposo, ognuno ha la sua).
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { MOMENTO_VUOTO, verificaTutte } from "../eventi/condizioni";
import type { DefinizioneTask, IdMembro, Minuti, StatoMissione } from "../types";
import { contestazioneAperta, TAG_VERIFICA } from "../vale/contestazioni";

export type Disponibilita =
  | { tipo: "DISPONIBILE" }
  | { tipo: "NASCOSTO" }
  | { tipo: "ESAURITO" }
  | { tipo: "IN_CORSO"; chi: IdMembro }
  | { tipo: "IN_RICARICA"; finoA: Minuti };

/** Stati in cui un'istanza "occupa" il task. */
const STATI_ATTIVI = ["IN_CODA", "PRONTO", "IN_CORSO", "IN_PAUSA"] as const;

/** Il task esiste per la crew? (sblocco, scoperte, modulo, attrezzatura) */
export function taskSbloccato(stato: StatoMissione, contesto: ContestoMissione, def: DefinizioneTask): boolean {
  if (def.scoperteRichieste.some((id) => !stato.conoscenza.scoperte.includes(id))) return false;
  if (def.equipaggiamentoRichiesto.some((id) => !stato.nave.equipaggiamento.includes(id))) return false;
  if (def.moduliRichiesti.some((id) => !stato.nave.moduli.includes(id))) return false;
  if (def.tag.includes(TAG_VERIFICA) && !contestazioneAperta(stato)) return false;
  return verificaTutte(stato, contesto, def.sblocco, MOMENTO_VUOTO);
}

export function disponibilitaTask(stato: StatoMissione, contesto: ContestoMissione, def: DefinizioneTask): Disponibilita {
  if (!taskSbloccato(stato, contesto, def)) return { tipo: "NASCOSTO" };
  if (def.ricaricaOre === 0) return { tipo: "DISPONIBILE" };

  const istanze = Object.values(stato.tasks).filter((t) => t.idDefinizione === def.id);

  const attiva = istanze.find((t) => (STATI_ATTIVI as readonly string[]).includes(t.stato));
  if (attiva) return { tipo: "IN_CORSO", chi: attiva.responsabile };

  const completate = istanze.filter((t) => t.stato === "COMPLETATO" && t.fine !== null);
  if (completate.length === 0) return { tipo: "DISPONIBILE" };
  if (def.ricaricaOre === null) return { tipo: "ESAURITO" };

  // La ricarica parte dall'ultimo completamento.
  const ultima = Math.max(...completate.map((t) => t.fine ?? 0));
  const finoA = ultima + def.ricaricaOre * 60;
  return stato.tempo < finoA ? { tipo: "IN_RICARICA", finoA } : { tipo: "DISPONIBILE" };
}

/**
 * Il moltiplicatore della RESA in base all'esito (DESIGN §9.1).
 * Tenuto qui, accanto alla disponibilità: è l'altra regola nuova dei task.
 */
export const MOLTIPLICATORE_RESA = {
  SUCCESSO_PERFETTO: 1.5,
  SUCCESSO: 1,
  SUCCESSO_PARZIALE: 0.5,
  FALLIMENTO: 0,
  FALLIMENTO_CRITICO: 0,
} as const;

/**
 * Per i task TEMPORANEI (sblocco EVENTO_RECENTE): il minuto in cui
 * l'occasione scade, o null se il task non scade. L'interfaccia lo mostra
 * («SCADE G3 · 14:00») perché il Capitano possa decidere in tempo.
 */
export function scadenzaTask(stato: StatoMissione, def: DefinizioneTask): Minuti | null {
  let scadenza: Minuti | null = null;
  for (const c of def.sblocco) {
    if (c.tipo !== "EVENTO_RECENTE") continue;
    for (const r of stato.eventi.accaduti) {
      if (r.id !== c.id || (c.scelta !== undefined && r.scelta !== c.scelta)) continue;
      const fine = r.tempo + c.ore * 60;
      if (scadenza === null || fine > scadenza) scadenza = fine;
    }
  }
  return scadenza;
}
