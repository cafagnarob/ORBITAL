/**
 * ============================================================================
 * riepilogo.ts — I numeri della Preparazione: peso, spazio, energia, risorse
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.1 (capacità), §6 (risorse).
 *
 * Tutte funzioni PURE: ricevono le scelte (Preparazione) e i cataloghi,
 * restituiscono numeri. La UI le chiama a ogni render per il pannello di
 * riepilogo; la creazione della missione le usa per le risorse iniziali.
 * Così l'anteprima e la partita vera non possono mai dire cose diverse.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { parametriNave } from "../nave/parametri";
import type { CataloghiPreparazione, ParametriNave, Preparazione, Risorse, TagLoadout } from "../types";

/** Le capacità portate a bordo da moduli ed equipaggiamento, senza doppioni. */
export function tagABordo(prep: Preparazione, cat: CataloghiPreparazione): TagLoadout[] {
  const tag = new Set<TagLoadout>();
  for (const id of prep.moduli) cat.moduli[id]?.tag.forEach((t) => tag.add(t));
  for (const id of prep.equipaggiamento) cat.equipaggiamento[id]?.tag.forEach((t) => tag.add(t));
  return [...tag];
}

/** Peso di ogni categoria e totale, in kg. */
export function carico(prep: Preparazione, cat: CataloghiPreparazione) {
  // `?.peso ?? 0`: un ID sconosciuto pesa zero invece di far crollare tutto.
  const crew = prep.crew.reduce((s, id) => s + (cat.candidati[id]?.peso ?? 0), 0);
  const moduli = prep.moduli.reduce((s, id) => s + (cat.moduli[id]?.peso ?? 0), 0);
  const equipaggiamento = prep.equipaggiamento.reduce((s, id) => s + (cat.equipaggiamento[id]?.peso ?? 0), 0);
  const scorte = Object.entries(prep.scorte).reduce((s, [id, n]) => s + (cat.scorte[id]?.peso ?? 0) * n, 0);
  return { crew, moduli, equipaggiamento, scorte, totale: crew + moduli + equipaggiamento + scorte };
}

/** Unità di spazio scorte occupate dalle casse. */
export function spazioOccupato(prep: Preparazione, cat: CataloghiPreparazione): number {
  return Object.entries(prep.scorte).reduce((s, [id, n]) => s + (cat.scorte[id]?.spazio ?? 0) * n, 0);
}

/**
 * Con cosa parte la missione: casse → cibo, acqua, ossigeno extra e
 * carburante; serbatoi d'ossigeno e batteria pieni.
 */
export function risorseIniziali(prep: Preparazione, cat: CataloghiPreparazione): Risorse {
  const risorse: Risorse = {
    cibo: 0,
    acqua: 0,
    ossigeno: BALANCE.giornata.capacitaOssigeno,
    energia: parametriNave(prep.moduli, cat.moduli).capacitaBatteria,
    carburante: BALANCE.preparazione.serbatoio,
  };
  for (const [id, n] of Object.entries(prep.scorte)) {
    const def = cat.scorte[id];
    if (def?.risorsa) risorse[def.risorsa] += def.quantita * n;
  }
  return risorse;
}

/** Tutto ciò che il pannello di riepilogo mostra, in un solo oggetto. */
export interface Riepilogo {
  carico: ReturnType<typeof carico>;
  spazio: { occupato: number; massimo: number };
  parametri: ParametriNave;
  /** Energia netta al giorno (può essere negativa). */
  bilancioEnergia: number;
  risorse: Risorse;
  /** Giorni di cibo e di acqua con la crew scelta. */
  giorniCibo: number;
  giorniAcqua: number;
  /** Il minore dei due: quanto dura davvero la missione senza rifornimenti. */
  giorniScorte: number;
  /** Carburante oltre la riserva di rientro (DESIGN §6.3). */
  carburanteOperativo: number;
  tag: TagLoadout[];
}

export function riepilogoPreparazione(prep: Preparazione, cat: CataloghiPreparazione): Riepilogo {
  const parametri = parametriNave(prep.moduli, cat.moduli);
  const risorse = risorseIniziali(prep, cat);
  const giorni = (quantita: number, perMembro: number) => {
    const consumo = prep.crew.length * perMembro;
    return consumo > 0 ? Math.floor(quantita / consumo) : 99;
  };
  const giorniCibo = giorni(risorse.cibo, parametri.ciboPerMembro);
  const giorniAcqua = giorni(risorse.acqua, parametri.acquaPerMembro);
  return {
    carico: carico(prep, cat),
    spazio: { occupato: spazioOccupato(prep, cat), massimo: parametri.spazioScorte },
    parametri,
    bilancioEnergia: parametri.generazioneEnergia - parametri.consumoEnergia,
    risorse,
    giorniCibo,
    giorniAcqua,
    giorniScorte: Math.min(giorniCibo, giorniAcqua),
    carburanteOperativo: risorse.carburante - BALANCE.preparazione.riservaRientro,
    tag: tagABordo(prep, cat),
  };
}
