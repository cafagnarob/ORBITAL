/**
 * ============================================================================
 * reducer.ts — Le scelte della Preparazione
 * ============================================================================
 *
 * Stessa forma del reducer della missione: (stato, azione, cataloghi) →
 * nuovo stato, senza toccare l'originale. Qui lo stato è piccolo, quindi
 * invece di structuredClone usiamo lo "spread" ({ ...prep, crew: [...] }):
 * copiamo solo la parte che cambia.
 *
 * REGOLE
 * - SCEGLI_* funziona come un interruttore: se l'oggetto è già scelto lo
 *   toglie, altrimenti lo aggiunge.
 * - Gli SLOT sono un limite rigido: se sono pieni l'aggiunta viene ignorata
 *   (la UI disattiva già il pulsante; il reducer è la seconda difesa).
 * - Il PESO invece NON blocca la scelta: il Capitano può superare i 1000 kg
 *   e vedere il problema nel riepilogo, poi decidere cosa togliere.
 *   Bloccare il clic senza spiegare il perché sarebbe frustrante.
 * - Le quantità delle casse restano tra 0 e il massimo del catalogo.
 * - CARICA sostituisce tutto (pulsante "Loadout di riferimento").
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { AzionePreparazione, CataloghiPreparazione, Preparazione } from "../types";

/** Aggiunge o toglie `id` da una lista, rispettando il limite di slot. */
function interruttore(lista: readonly string[], id: string, limite: number): string[] {
  if (lista.includes(id)) return lista.filter((x) => x !== id);
  if (lista.length >= limite) return [...lista];
  return [...lista, id];
}

export function applicaPreparazione(
  prep: Preparazione,
  azione: AzionePreparazione,
  cat: CataloghiPreparazione,
): Preparazione {
  const p = BALANCE.preparazione;
  switch (azione.tipo) {
    case "SCEGLI_CANDIDATO":
      if (!cat.candidati[azione.id]) return prep;
      return { ...prep, crew: interruttore(prep.crew, azione.id, p.crewRichiesta) };

    case "SCEGLI_MODULO":
      if (!cat.moduli[azione.id]) return prep;
      return { ...prep, moduli: interruttore(prep.moduli, azione.id, p.slotModuli) };

    case "SCEGLI_EQUIPAGGIAMENTO":
      if (!cat.equipaggiamento[azione.id]) return prep;
      return { ...prep, equipaggiamento: interruttore(prep.equipaggiamento, azione.id, p.slotEquipaggiamento) };

    case "CARICA":
      // Una copia: chi ha passato l'oggetto non deve poterlo cambiare dopo.
      return structuredClone(azione.preparazione);

    case "IMPOSTA_SCORTA": {
      const def = cat.scorte[azione.id];
      if (!def) return prep;
      const quantita = Math.max(0, Math.min(def.massimo, Math.round(azione.quantita)));
      return { ...prep, scorte: { ...prep.scorte, [azione.id]: quantita } };
    }
  }
}
