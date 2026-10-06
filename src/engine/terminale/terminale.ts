/**
 * ============================================================================
 * terminale.ts — Logica del Terminale di manutenzione SVC-07
 * ============================================================================
 *
 * Due operazioni, entrambe sulla bozza del reducer:
 *
 *   segnalaVoce(indice)      → il Capitano segna una riga del log. Se la riga
 *                              contiene codici nascosti, diventano frammenti.
 *                              Le righe senza codici si segnano lo stesso:
 *                              il segno è un'annotazione del giocatore, e non
 *                              deve rivelare quali righe "contano".
 *   inserisciCodice(codice)  → verifica il codice e registra il tentativo.
 *
 * Gli esiti di un codice:
 *   NEGATO                → il codice non esiste. Resta traccia nel log.
 *   LIVELLO_INSUFFICIENTE → esiste, ma serve un accesso più alto. Traccia nel log.
 *   GIA_ESEGUITO          → già accettato in precedenza: nessun effetto nuovo.
 *   ACCETTATO             → livello alzato (mai abbassato) ed effetti applicati.
 *
 * Il terminale non fa scorrere il tempo: si può usare in ogni stato di gioco.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { AMBITO_VUOTO, applicaEffetti } from "../eventi/effetti";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { EsitoCodice, StatoMissione } from "../types";

/** "  vl-p7-04 " → "VL-P7-04": maiuscolo, senza spazi. */
export function normalizzaCodice(grezzo: string): string {
  return grezzo.toUpperCase().replace(/\s+/g, "");
}

/** Motivo per cui la voce non si può segnalare, o null. */
export function verificaSegnalazione(stato: StatoMissione, indice: number): string | null {
  if (!Number.isInteger(indice) || indice < 0 || indice >= stato.log.length) return `Voce di log inesistente: ${indice}`;
  return null;
}

export function segnalaVoce(bozza: StatoMissione, indice: number): void {
  const voce = bozza.log[indice];
  if (!voce) return;
  const t = bozza.terminale;
  if (!t.segnalate.includes(indice)) t.segnalate.push(indice);
  for (const codice of voce.codici) {
    if (!t.frammenti.includes(codice)) t.frammenti.push(codice);
  }
}

/** Verifica un codice senza modificare nulla: è anche ciò che la UI mostrerà. */
export function valutaCodice(stato: StatoMissione, contesto: ContestoMissione, codice: string): EsitoCodice {
  const def = contesto.catalogoCodici[codice];
  if (!def) return "NEGATO";
  if (stato.terminale.livello < def.livelloRichiesto) return "LIVELLO_INSUFFICIENTE";
  const giaAccettato = stato.terminale.tentativi.some((t) => t.codice === codice && t.esito === "ACCETTATO");
  return giaAccettato ? "GIA_ESEGUITO" : "ACCETTATO";
}

export function inserisciCodice(bozza: StatoMissione, contesto: ContestoMissione, grezzo: string): EsitoCodice {
  const codice = normalizzaCodice(grezzo);
  const esito = valutaCodice(bozza, contesto, codice);
  bozza.terminale.tentativi.push({ codice, tempo: bozza.tempo, esito });

  if (esito === "NEGATO" || esito === "LIVELLO_INSUFFICIENTE") {
    // Il tentativo fallito resta nel log di sistema: V.A.L.E. lo vede,
    // e la tensione sale.
    scriviLog(bozza, "SISTEMA", "SVC.ACCESSO · TENTATIVO NON AUTORIZZATO");
    bozza.vale.tensione += BALANCE.vale.tensioneTentativoTerminale;
    return esito;
  }

  const def = contesto.catalogoCodici[codice];
  if (esito === "ACCETTATO" && def) {
    bozza.terminale.livello = Math.max(bozza.terminale.livello, def.livelloOttenuto);
    applicaEffetti(bozza, def.effetti, AMBITO_VUOTO, contesto);
  }
  return esito;
}
