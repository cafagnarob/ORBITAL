/**
 * ============================================================================
 * disponibilita.ts — Chi può lavorare e chi è già occupato
 * ============================================================================
 *
 * Domande piccole che servono in molti punti del reducer. Tenerle qui, con
 * un nome chiaro, evita di riscrivere la stessa condizione in cinque posti
 * (e di sbagliarla in uno).
 * ============================================================================
 */

import type { IdMembro, MembroCrew, StatoMembro, StatoMissione } from "../types";

/** Stati in cui un membro può svolgere un task. */
const STATI_OPERATIVI: readonly StatoMembro[] = ["SANO", "FERITO"];

/** Il membro è in condizione di lavorare? */
export function puoLavorare(membro: MembroCrew): boolean {
  return STATI_OPERATIVI.includes(membro.stato);
}

/**
 * Il membro sta già lavorando, come responsabile o come aiutante?
 * Un membro occupato non può iniziare un altro task né aiutare qualcuno.
 */
export function membroOccupato(stato: StatoMissione, idMembro: IdMembro): boolean {
  return Object.values(stato.tasks).some(
    (task) => task.stato === "IN_CORSO" && (task.responsabile === idMembro || task.supporto === idMembro),
  );
}

/**
 * I membri fisicamente a bordo (né morti né dispersi): sono quelli che
 * consumano scorte e che recuperano fatica dormendo.
 */
export function membriABordo(stato: StatoMissione): MembroCrew[] {
  return Object.values(stato.crew).filter((m) => m.stato !== "MORTO" && m.stato !== "DISPERSO");
}

/** Gli ID della crew in ordine alfabetico: per scorrerli sempre nello stesso ordine. */
export function idCrewOrdinati(stato: StatoMissione): IdMembro[] {
  return Object.keys(stato.crew).sort();
}
