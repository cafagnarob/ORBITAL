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
import { CATALOGO_MISSIONI, definizioneMissione, taskObbligatori } from "./missioni";
import { giorniTotali } from "../engine/storia/piano";
import type { PianoMissione } from "../engine/types";
import { CONTENUTI_STORIA } from "./storia";

export const CONTESTO_GIOCO: ContestoMissione = {
  catalogoTask: CATALOGO_TASK,
  catalogoEventi: CATALOGO_EVENTI,
  catalogoCodici: CATALOGO_CODICI,
  catalogoDirettive: CATALOGO_DIRETTIVE,
  testiVale: TESTI_VALE,
  catalogoModuli: CATALOGO_MODULI,
  storia: CONTENUTI_STORIA,
  missioni: CATALOGO_MISSIONI,
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

/**
 * I cataloghi della Preparazione PER UNA PARTITA (v3.8): gli stessi, più ciò
 * che dipende dalla missione estratta dal seed — l'attrezzatura
 * indispensabile della sua scaletta, quali task esistono, quanti giorni
 * devono coprire le scorte.
 */
export function cataloghiPreparazionePer(piano: PianoMissione): CataloghiPreparazione {
  return {
    ...CATALOGHI_PREPARAZIONE,
    taskObbligatori: taskObbligatori(definizioneMissione(piano.id)),
    missione: piano.id,
    giorniMissione: giorniTotali(piano),
  };
}
