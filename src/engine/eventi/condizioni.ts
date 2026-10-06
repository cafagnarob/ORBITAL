/**
 * ============================================================================
 * condizioni.ts — Valutare se una condizione di un evento è vera
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.
 *
 * COS'È IL "MOMENTO"
 * Gli eventi non si controllano a ogni minuto, ma in punti precisi: dopo
 * ogni AVANZA. Il MomentoEventi descrive cosa è appena successo in quel
 * passo: quali task si sono conclusi, se c'è stato il rapporto serale o il
 * risveglio. Le condizioni "TASK_CONCLUSO_ORA" e "MOMENTO" lo leggono.
 *
 * Funzioni pure: leggono lo stato, non modificano nulla.
 * ============================================================================
 */

import { scomponiTempo } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { contaFazione, membriAttivi } from "../storia/fazioni";
import { livelloAutonomia } from "../vale/comportamento";
import { ESITI_TASK, type Condizione, type EsitoTask, type IdIstanzaTask, type StatoMissione } from "../types";

export interface MomentoEventi {
  rapportoSerale: boolean;
  risveglio: boolean;
  /** Task conclusi in questo passo, in ordine. */
  tasksConclusi: IdIstanzaTask[];
}

/** Un momento "vuoto": usato per i requisiti delle scelte. */
export const MOMENTO_VUOTO: MomentoEventi = { rapportoSerale: false, risveglio: false, tasksConclusi: [] };

/**
 * Posizione di un esito nella scala, 0 = SUCCESSO_PERFETTO (il migliore).
 * "Almeno SUCCESSO" significa: posizione ≤ posizione di SUCCESSO.
 */
function rango(esito: EsitoTask): number {
  return ESITI_TASK.indexOf(esito);
}

/** Il task concluso rispetta tag ed esiti richiesti? */
function taskCorrisponde(
  stato: StatoMissione,
  contesto: ContestoMissione,
  idTask: IdIstanzaTask,
  c: Extract<Condizione, { tipo: "TASK_CONCLUSO_ORA" }>,
): boolean {
  const task = stato.tasks[idTask];
  if (!task || task.esito === null) return false;
  const def = contesto.catalogoTask[task.idDefinizione];
  if (!def || !def.tag.includes(c.tag)) return false;
  if (c.esitoAlmeno !== undefined && rango(task.esito) > rango(c.esitoAlmeno)) return false;
  if (c.esitoAlPiu !== undefined && rango(task.esito) < rango(c.esitoAlPiu)) return false;
  return true;
}

export function verificaCondizione(
  stato: StatoMissione,
  contesto: ContestoMissione,
  c: Condizione,
  momento: MomentoEventi,
): boolean {
  switch (c.tipo) {
    case "TASK_CONCLUSO_ORA":
      return momento.tasksConclusi.some((id) => taskCorrisponde(stato, contesto, id, c));
    case "MOMENTO":
      return c.momento === "RAPPORTO_SERALE" ? momento.rapportoSerale : momento.risveglio;
    case "SCOPERTA":
      return stato.conoscenza.scoperte.includes(c.id);
    case "NON_SCOPERTA":
      return !stato.conoscenza.scoperte.includes(c.id);
    case "EVENTO_ACCADUTO":
      return stato.eventi.accaduti.some((r) => r.id === c.id && (c.scelta === undefined || r.scelta === c.scelta));
    case "EQUIPAGGIAMENTO":
      return stato.nave.equipaggiamento.includes(c.id);
    case "UNO_TRA":
      return c.condizioni.some((interna) => verificaCondizione(stato, contesto, interna, momento));
    case "NON":
      return !verificaCondizione(stato, contesto, c.condizione, momento);

    // --- Storia emergente (v3.0) -------------------------------------------
    case "GIORNO_ALMENO":
      return scomponiTempo(stato.tempo).giorno >= c.giorno;
    case "TENSIONE_ALMENO":
      return stato.vale.tensione >= c.valore;
    case "AUTONOMIA_ALMENO":
      return livelloAutonomia(stato, contesto) >= c.livello;
    case "FAZIONE":
      return contaFazione(stato, c.fazione) >= c.almeno;
    case "RISORSA_SOTTO":
      return stato.risorse[c.risorsa] < c.valore;
    case "SISTEMA_SOTTO":
      return stato.nave.sistemi[c.sistema] < c.valore;
    case "CLASSE_DIRETTIVA": {
      const classe = contesto.catalogoDirettive[stato.vale.direttiva]?.classe;
      return classe !== undefined && c.classi.includes(classe);
    }
    case "RUOLO_A_BORDO":
      return membriAttivi(stato).some((m) => m.ruolo === c.ruolo);
    case "MEMBRO_IN_STATO":
      return Object.values(stato.crew).some((m) => m.stato === c.stato);
    case "SMENTITE_ALMENO":
      return stato.vale.contestazioni.filter((x) => x.stato === "SMENTITA").length >= c.n;
    case "OVERRIDE":
      return stato.vale.override;
    case "IMPREVISTO":
      return stato.imprevisto === c.id;
    case "COMPARTIMENTO_BLOCCATO":
      return Object.values(stato.nave.accessi).includes("BLOCCATO");
  }
}

/** Tutte le condizioni sono vere? (Una lista vuota è sempre vera.) */
export function verificaTutte(
  stato: StatoMissione,
  contesto: ContestoMissione,
  condizioni: readonly Condizione[],
  momento: MomentoEventi,
): boolean {
  return condizioni.every((c) => verificaCondizione(stato, contesto, c, momento));
}

/**
 * Il task che ha fatto scattare un evento: il primo task concluso ora che
 * soddisfa una condizione TASK_CONCLUSO_ORA dell'evento (anche dentro UNO_TRA).
 * Serve agli effetti che colpiscono "il RESPONSABILE".
 */
export function trovaTaskOrigine(
  stato: StatoMissione,
  contesto: ContestoMissione,
  condizioni: readonly Condizione[],
  momento: MomentoEventi,
): IdIstanzaTask | null {
  for (const c of condizioni) {
    if (c.tipo === "TASK_CONCLUSO_ORA") {
      const id = momento.tasksConclusi.find((idTask) => taskCorrisponde(stato, contesto, idTask, c));
      if (id !== undefined) return id;
    }
    if (c.tipo === "UNO_TRA") {
      const id = trovaTaskOrigine(stato, contesto, c.condizioni, momento);
      if (id !== null) return id;
    }
  }
  return null;
}
