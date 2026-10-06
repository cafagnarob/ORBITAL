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

import type { ContestoMissione } from "../engine/mission";
import type { CataloghiPreparazione } from "../engine/types";
import { CATALOGO_CANDIDATI } from "./candidati";
import { CATALOGO_CODICI } from "./codici";
import { CATALOGO_DIRETTIVE } from "./direttive";
import { CATALOGO_EVENTI } from "./eventi";
import { CATALOGO_EQUIPAGGIAMENTO, CATALOGO_MODULI, CATALOGO_SCORTE } from "./loadout";
import { CATALOGO_TASK } from "./tasks";
import { TESTI_VALE } from "./vale";
import { CONTENUTI_STORIA } from "./storia";

export const CONTESTO_GIOCO: ContestoMissione = {
  catalogoTask: CATALOGO_TASK,
  catalogoEventi: CATALOGO_EVENTI,
  catalogoCodici: CATALOGO_CODICI,
  catalogoDirettive: CATALOGO_DIRETTIVE,
  testiVale: TESTI_VALE,
  catalogoModuli: CATALOGO_MODULI,
  storia: CONTENUTI_STORIA,
};

/** Ciò che serve alla schermata di Preparazione (crew, loadout, task, direttive). */
export const CATALOGHI_PREPARAZIONE: CataloghiPreparazione = {
  candidati: CATALOGO_CANDIDATI,
  moduli: CATALOGO_MODULI,
  equipaggiamento: CATALOGO_EQUIPAGGIAMENTO,
  scorte: CATALOGO_SCORTE,
  task: CATALOGO_TASK,
  direttive: CATALOGO_DIRETTIVE,
};
