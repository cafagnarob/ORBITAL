/**
 * ============================================================================
 * giornata.ts — I tre appuntamenti fissi del giorno
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6 (risorse), §8 (tempo).
 *
 *   07:00  avviaOperazioni  → partono i task in coda
 *   22:00  rapportoSerale   → consumi del giorno, il gioco si ferma
 *   06:00  risveglio        → recupero della fatica, nuova pianificazione
 *
 * REGOLE [PROVVISORIO]
 * - Consumi di cibo, acqua, ossigeno ed energia applicati una volta al
 *   giorno, al rapporto. L'ossigeno prima si consuma, poi il Supporto
 *   Vitale ne rigenera una parte (proporzionale alla sua integrità), senza
 *   superare la capienza dei serbatoi.
 * - Chi resta senza cibo, acqua o ossigeno perde salute ogni sera (come in
 *   60 Seconds: le scorte finite non sono un "game over" immediato, ma una
 *   discesa che lascia il tempo di reagire… o di disperarsi).
 * - Il sonno toglie una quantità fissa di fatica a chi è a bordo.
 * - I numeri (energia, scorte per membro, recupero) sono quelli della nave
 *   CON i suoi moduli: parametriNave() somma base + moduli installati.
 * ============================================================================
 */

import { minutoDelGiorno, ORARIO_OPERAZIONI, scomponiTempo } from "../clock";
import type { StatoMissione } from "../types";
import type { ContestoMissione } from "./contesto";
import { membriABordo } from "./disponibilita";
import { avviaTaskPronti } from "./esecuzione";
import { parametriNave } from "../nave/parametri";
import { modificaSalute } from "../crew/salute";
import { diarioSerale, scriviDiario } from "../storia/diario";
import { BALANCE } from "../../content/balance";
import { scriviLog } from "./log";

/** Fine della pianificazione: si passa alle 07:00 e partono i task. */
export function avviaOperazioni(bozza: StatoMissione, contesto: ContestoMissione): void {
  // Se la pianificazione è finita prima delle 07:00, si attende le 07:00.
  const m = minutoDelGiorno(bozza.tempo);
  if (m < ORARIO_OPERAZIONI) bozza.tempo += ORARIO_OPERAZIONI - m;

  bozza.statoGioco = "IN_ESECUZIONE";
  scriviLog(bozza, "VALE", "Capitano. Operazioni avviate.");
  avviaTaskPronti(bozza, contesto);
}

/** 22:00 — si applicano i consumi del giorno e il gioco si ferma. */
export function rapportoSerale(bozza: StatoMissione, contesto: ContestoMissione): void {
  const p = parametriNave(bozza.nave.moduli, contesto.catalogoModuli);
  const g = BALANCE.giornata;
  const membri = membriABordo(bozza);
  const aBordo = membri.length;
  const r = bozza.risorse;

  // Chi resta senza: lo sappiamo PRIMA di sottrarre (servono le quantità intere).
  const senzaCibo = r.cibo < aBordo * p.ciboPerMembro;
  const senzaAcqua = r.acqua < aBordo * p.acquaPerMembro;
  r.cibo = Math.max(0, r.cibo - aBordo * p.ciboPerMembro);
  r.acqua = Math.max(0, r.acqua - aBordo * p.acquaPerMembro);

  // Ossigeno: consumo, poi rigenerazione del Supporto Vitale fino alla capienza.
  const senzaOssigeno = r.ossigeno < aBordo * g.ossigenoPerMembro;
  r.ossigeno = Math.max(0, r.ossigeno - aBordo * g.ossigenoPerMembro);
  const rigenerato = Math.round((p.produzioneOssigeno * bozza.nave.sistemi.SUPPORTO_VITALE) / 100);
  if (r.ossigeno < g.capacitaOssigeno) r.ossigeno = Math.min(g.capacitaOssigeno, r.ossigeno + rigenerato);

  const bilancioEnergia = p.generazioneEnergia - p.consumoEnergia;
  r.energia = Math.min(p.capacitaBatteria, Math.max(0, r.energia + bilancioEnergia));

  // Le privazioni pesano sulla salute di tutti quelli a bordo.
  const danno =
    (senzaCibo ? g.dannoSenzaCibo : 0) + (senzaAcqua ? g.dannoSenzaAcqua : 0) + (senzaOssigeno ? g.dannoSenzaOssigeno : 0);
  if (danno > 0) {
    for (const m of membri) {
      if (modificaSalute(m, -danno)) {
        scriviLog(bozza, "SISTEMA", `${m.nome.toUpperCase()} · SEGNI VITALI ASSENTI`);
        scriviDiario(bozza, `Abbiamo perso ${m.nome}.`);
      }
    }
  }

  bozza.statoGioco = "RAPPORTO";
  const { giorno } = scomponiTempo(bozza.tempo);
  scriviLog(
    bozza,
    "VALE",
    `Rapporto serale, giorno ${giorno}. Cibo ${r.cibo} · Acqua ${r.acqua} · Ossigeno ${r.ossigeno} · Energia ${r.energia} · Carburante ${r.carburante}.`,
  );
  if (senzaCibo) scriviLog(bozza, "VALE", "Capitano. Il cibo è esaurito.");
  if (senzaAcqua) scriviLog(bozza, "VALE", "Capitano. L'acqua è esaurita.");
  if (senzaOssigeno) scriviLog(bozza, "VALE", "Capitano. Riserva d'ossigeno insufficiente.");

  // Il giornale di bordo: il bilancio della giornata (v3.0).
  diarioSerale(bozza, contesto);
}

/** 06:00 — la crew ha dormito: recupera fatica e si torna a pianificare. */
export function risveglio(bozza: StatoMissione, contesto: ContestoMissione): void {
  const { recuperoFatica } = parametriNave(bozza.nave.moduli, contesto.catalogoModuli);
  for (const membro of membriABordo(bozza)) {
    membro.fatica = Math.max(0, membro.fatica - recuperoFatica);
  }
  bozza.statoGioco = "PIANIFICAZIONE";
  const { giorno } = scomponiTempo(bozza.tempo);
  scriviLog(bozza, "VALE", `Giorno ${giorno}. Buongiorno, Capitano. In attesa di istruzioni.`);
}
