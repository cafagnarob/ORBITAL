/**
 * ============================================================================
 * contesto.ts — Il contesto "vero" del gioco da passare al reducer
 * ============================================================================
 *
 * È l'altra metà dell'iniezione delle dipendenze vista in
 * engine/mission/contesto.ts: i test passano il catalogo di prova,
 * il gioco passa questo.
 * ============================================================================
 */

import type { ContestoMissione } from "../engine/mission"
import { CATALOGO_TASK } from "./tasks"

export const CONTESTO_GIOCO: ContestoMissione = {
  catalogoTask: CATALOGO_TASK,
}
