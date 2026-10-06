/**
 * ============================================================================
 * contestazioni.ts — Il Capitano contesta, la verifica decide
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.4 (Tavola del Capitano, primo nucleo).
 *
 *   1. CONTESTA: il Capitano marca una voce di V.A.L.E. come contestata.
 *      V.A.L.E. se ne accorge (tensione +1) e risponde.
 *   2. Si sblocca il task "Verifica dei dati grezzi" (tag VERIFICA).
 *   3. Alla fine della verifica, la contestazione aperta più vecchia si chiude:
 *        - SMENTITA   → l'affermazione era filtrata: si scopre la verità
 *                       e la fiducia della crew crolla;
 *        - CONFERMATA → V.A.L.E. aveva detto il vero: la fiducia sale
 *                       (dubitare a torto ha un costo: tempo, fatica, tensione);
 *        - con un FALLIMENTO la verifica è inconclusiva e resta aperta.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { AMBITO_VUOTO, applicaEffetti } from "../eventi/effetti";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { EsitoTask, StatoMissione } from "../types";
import { livelloComportamento } from "./comportamento";
import { modificaFiduciaCrew } from "../storia/fazioni";

/** Il tag che identifica i task di verifica. */
export const TAG_VERIFICA = "VERIFICA";

export function contestazioneAperta(stato: StatoMissione): boolean {
  return stato.vale.contestazioni.some((c) => c.stato === "APERTA");
}

/** Motivo per cui la voce non si può contestare, o null. */
export function verificaContestazione(stato: StatoMissione, indice: number): string | null {
  const voce = stato.log[indice];
  if (!voce) return `Voce di log inesistente: ${indice}`;
  if (voce.fonte !== "VALE") return "Si possono contestare solo le affermazioni di V.A.L.E.";
  if (stato.vale.contestazioni.some((c) => c.indice === indice)) return "Affermazione già contestata";
  return null;
}

/**
 * Apre una contestazione. `chi` = il nome di chi contesta: di solito il
 * Capitano, ma dalla v3.0 anche un membro della crew di sua iniziativa.
 */
export function contesta(bozza: StatoMissione, contesto: ContestoMissione, indice: number, chi = "Il Capitano"): void {
  bozza.vale.contestazioni.push({ indice, tempo: bozza.tempo, stato: "APERTA" });
  bozza.vale.tensione += BALANCE.vale.tensioneContestazione;

  const livello = livelloComportamento(bozza, contesto);
  const risposta = [...contesto.testiVale.contestazione].reverse().find((r) => r.daComportamento <= livello);
  scriviLog(bozza, "SISTEMA", `${chi} contesta un'affermazione di V.A.L.E.`);
  if (risposta) scriviLog(bozza, "VALE", risposta.testo);
}

/** Chiamata alla fine di un task di verifica. */
export function risolviVerifica(bozza: StatoMissione, contesto: ContestoMissione, esito: EsitoTask): void {
  const aperta = bozza.vale.contestazioni.find((c) => c.stato === "APERTA");
  if (!aperta) return;
  const testi = contesto.testiVale.verifica;

  if (esito === "FALLIMENTO" || esito === "FALLIMENTO_CRITICO") {
    scriviLog(bozza, "SISTEMA", testi.inconclusiva);
    return;
  }

  const affermazione = bozza.vale.affermazioni.find((a) => a.indice === aperta.indice);
  const filtro = affermazione
    ? contesto.catalogoEventi[affermazione.idEvento]?.filtri?.find((f) => f.id === affermazione.idFiltro)
    : undefined;

  if (filtro) {
    aperta.stato = "SMENTITA";
    scriviLog(bozza, "SISTEMA", testi.smentita);
    applicaEffetti(bozza, filtro.verita, AMBITO_VUOTO, contesto);
    modificaFiduciaCrew(bozza, contesto, BALANCE.vale.fiduciaSmentita);
  } else {
    aperta.stato = "CONFERMATA";
    scriviLog(bozza, "SISTEMA", testi.confermata);
    modificaFiduciaCrew(bozza, contesto, BALANCE.vale.fiduciaConfermata);
  }
}
