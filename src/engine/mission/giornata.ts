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
 * - Ossigeno ed energia si consumano al rapporto. L'ossigeno prima si
 *   consuma, poi il Supporto Vitale ne rigenera una parte (proporzionale
 *   alla sua integrità), senza superare la capienza dei serbatoi.
 * - Cibo e acqua (v3.4) li distribuisce il Capitano chiudendo il rapporto:
 *   razioni piene, mezze o niente per ognuno (engine/crew/razioni.ts).
 * - Senza ossigeno si perde salute ogni sera; fame e sete pesano a parte.
 * - Il sonno toglie fatica a chi è a bordo, meno a chi ha fame o sete.
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
import { caricoBisogni } from "../crew/razioni";

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

  // Cibo e acqua NON si consumano qui: li distribuisce il Capitano
  // chiudendo il rapporto (razioni, engine/crew/razioni.ts — v3.4).

  // Ossigeno: consumo, poi rigenerazione del Supporto Vitale fino alla capienza.
  const senzaOssigeno = r.ossigeno < aBordo * g.ossigenoPerMembro;
  r.ossigeno = Math.max(0, r.ossigeno - aBordo * g.ossigenoPerMembro);
  const rigenerato = Math.round((p.produzioneOssigeno * bozza.nave.sistemi.SUPPORTO_VITALE) / 100);
  if (r.ossigeno < g.capacitaOssigeno) r.ossigeno = Math.min(g.capacitaOssigeno, r.ossigeno + rigenerato);

  const bilancioEnergia = p.generazioneEnergia - p.consumoEnergia;
  r.energia = Math.min(p.capacitaBatteria, Math.max(0, r.energia + bilancioEnergia));

  // L'aria che manca pesa sulla salute di tutti quelli a bordo.
  if (senzaOssigeno) {
    for (const m of membri) {
      if (modificaSalute(m, -g.dannoSenzaOssigeno)) {
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
  scriviLog(bozza, "VALE", "Capitano. Attendo le razioni della sera per l'equipaggio.");
  if (senzaOssigeno) scriviLog(bozza, "VALE", "Capitano. Riserva d'ossigeno insufficiente.");

  // Il giornale di bordo: il bilancio della giornata (v3.0).
  diarioSerale(bozza, contesto);
}

/** 06:00 — la crew ha dormito: recupera fatica e si torna a pianificare. */
export function risveglio(bozza: StatoMissione, contesto: ContestoMissione): void {
  const { recuperoFatica } = parametriNave(bozza.nave.moduli, contesto.catalogoModuli);
  for (const membro of membriABordo(bozza)) {
    // Chi ha fame o sete dorme male: recupera meno (v3.4).
    const recupero = Math.max(0, recuperoFatica - caricoBisogni(membro) * BALANCE.razioni.recuperoPerso);
    membro.fatica = Math.max(0, membro.fatica - recupero);
  }
  bozza.statoGioco = "PIANIFICAZIONE";
  const { giorno } = scomponiTempo(bozza.tempo);
  scriviLog(bozza, "VALE", `Giorno ${giorno}. Buongiorno, Capitano. In attesa di istruzioni.`);
}
