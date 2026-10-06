/**
 * ============================================================================
 * effetti.ts — Applicare gli effetti di eventi e scelte alla bozza
 * ============================================================================
 *
 * Ogni effetto è un piccolo cambiamento descritto come dato (types/eventi.ts).
 * Qui c'è l'unico punto in cui quei dati diventano modifiche allo stato,
 * sempre con i limiti giusti: le risorse non scendono sotto zero,
 * integrità e fatica restano tra 0 e 100.
 * ============================================================================
 */

import { limita } from "../tasks/rischio";
import type { Effetto, IdIstanzaTask, StatoMissione } from "../types";
import { scriviLog } from "../mission/log";

function applicaEffetto(bozza: StatoMissione, effetto: Effetto, idTaskOrigine: IdIstanzaTask | null): void {
  switch (effetto.tipo) {
    case "SCOPERTA":
      // Nessuna ripetizione: una cosa si scopre una volta sola.
      if (!bozza.conoscenza.scoperte.includes(effetto.id)) bozza.conoscenza.scoperte.push(effetto.id);
      break;

    case "RISORSA":
      bozza.risorse[effetto.risorsa] = Math.max(0, bozza.risorse[effetto.risorsa] + effetto.delta);
      break;

    case "SISTEMA":
      bozza.nave.sistemi[effetto.sistema] = limita(bozza.nave.sistemi[effetto.sistema] + effetto.delta, 0, 100);
      break;

    case "SCAFO":
      bozza.nave.scafo = limita(bozza.nave.scafo + effetto.delta, 0, 100);
      break;

    case "FATICA": {
      const bersagli =
        effetto.chi === "TUTTI"
          ? Object.values(bozza.crew)
          : [idTaskOrigine !== null ? bozza.crew[bozza.tasks[idTaskOrigine]?.responsabile ?? ""] : undefined];
      for (const membro of bersagli) {
        if (membro) membro.fatica = limita(membro.fatica + effetto.delta, 0, 100);
      }
      break;
    }

    case "LOG":
      scriviLog(bozza, effetto.fonte, effetto.testo, effetto.codici ?? []);
      break;
  }
}

/** Applica una lista di effetti, nell'ordine in cui sono scritti. */
export function applicaEffetti(bozza: StatoMissione, effetti: readonly Effetto[], idTaskOrigine: IdIstanzaTask | null): void {
  for (const effetto of effetti) applicaEffetto(bozza, effetto, idTaskOrigine);
}
