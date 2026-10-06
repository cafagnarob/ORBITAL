/**
 * ============================================================================
 * integritaDati.ts — Quanto sono affidabili i dati della nave
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.6.
 *
 * INTEGRITÀ DEI DATI (0–100) = media pesata dell'integrità di Scienza,
 * Navigazione e Comunicazioni (pesi in balance.ts). È indipendente da
 * V.A.L.E.: se i sensori sono danneggiati i dati sono sbagliati, ma
 * nessuno sta mentendo.
 *
 * STIMA DEL RISCHIO
 * Il rischio VERO di un task (quello che decide l'esito) non cambia. Cambia
 * quello MOSTRATO al Capitano: rischio vero ± errore, con
 *   errore massimo = (100 − integrità) × 0,5
 * A 95 di integrità l'errore è al massimo ±2; a 60 arriva a ±20.
 *
 * L'errore è DETERMINISTICO: dipende dal seed, dal task e dal giorno.
 * Stessa partita → stessa stima; e la stima vista in pianificazione è la
 * stessa che compare nel log all'avvio del task, nello stesso giorno.
 * Non consuma l'Rng della partita: guardare una stima non cambia il futuro.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { minutoDelGiorno } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { parametriNave } from "../nave/parametri";
import { hashSeed } from "../rng";
import { limita } from "../tasks/rischio";
import type { IdDefinizioneTask, Percentuale, StatoMissione } from "../types";

export function integritaDati(stato: StatoMissione, contesto: ContestoMissione): Percentuale {
  const pesi = BALANCE.vale.pesoIntegrita;
  const s = stato.nave.sistemi;
  const daiSistemi = s.SCIENZA * pesi.SCIENZA + s.NAVIGAZIONE * pesi.NAVIGAZIONE + s.COMUNICAZIONI * pesi.COMUNICAZIONI;
  // Alcuni moduli (Array di Navigazione, Scanner Profondo…) rendono i dati
  // più affidabili: è un bonus fisso, ma non si va mai oltre 100.
  const bonus = parametriNave(stato.nave.moduli, contesto.catalogoModuli).integritaDati;
  return Math.min(100, Math.round(daiSistemi + bonus));
}

/** Il rischio come appare al Capitano (può essere sbagliato). */
export function stimaRischio(
  stato: StatoMissione,
  contesto: ContestoMissione,
  idDefinizione: IdDefinizioneTask,
  rischioVero: Percentuale,
): Percentuale {
  const erroreMassimo = (100 - integritaDati(stato, contesto)) * BALANCE.vale.erroreStimaPerPunto;
  const giorno = Math.floor((stato.tempo - minutoDelGiorno(stato.tempo)) / 1440);
  // Un numero "casuale ma fisso" in [-1, 1], dallo stesso hash usato per i seed.
  const caso = (hashSeed(`${stato.seed}:stima:${idDefinizione}:${giorno}`) / 0xffffffff) * 2 - 1;
  return Math.round(limita(rischioVero + caso * erroreMassimo, 0, 100));
}
