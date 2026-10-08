/**
 * ============================================================================
 * useFinestre.ts — Lo stato delle finestre a comparsa (aperte, ridotte, posizione)
 * ============================================================================
 *
 * Usato dalla Preparazione (v3.7.4) per Candidati e Loadout, ma generico:
 * qualsiasi schermata può avere le sue finestre mobili.
 *
 * PER OGNI FINESTRA SALVIAMO
 *   fase  APERTA     si vede;
 *         RIDUCENDO  sta facendo l'animazione di spegnimento verso l'icona;
 *         RIDOTTA    è solo un'icona nel dock (resta montata ma nascosta:
 *                    così non perde il suo stato interno, es. il cassetto
 *                    aperto del Loadout);
 *   pos   dove l'ha trascinata il Capitano (null = posizione di partenza,
 *         decisa dal CSS);
 *   z     l'ordine di sovrapposizione: chi è stata toccata per ultima sta
 *         sopra le altre.
 *
 * È stato dell'INTERFACCIA (useState), non della partita: non entra nel
 * motore e non si salva.
 *
 * NIENTE useEffect
 * Ogni cambio parte da un gestore di evento (clic, trascinamento, fine di
 * un'animazione). L'unica "domanda al browser" (preferisce meno movimento?)
 * si fa DENTRO il gestore, quando serve.
 * ============================================================================
 */

import { useState } from "react";

export type FaseFinestra = "APERTA" | "RIDUCENDO" | "RIDOTTA";

export interface StatoFinestra {
  fase: FaseFinestra;
  pos: { x: number; y: number } | null;
  z: number;
}

/** Il sistema chiede animazioni ridotte? (Senza animazione si salta RIDUCENDO.) */
function menoMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useFinestre<Id extends string>(ids: readonly Id[], apertaAllInizio: (id: Id) => boolean) {
  // Inizializzatore "pigro": si calcola una volta sola, al primo disegno.
  const [stato, setStato] = useState<Record<Id, StatoFinestra>>(
    () =>
      Object.fromEntries(ids.map((id, i) => [id, { fase: apertaAllInizio(id) ? "APERTA" : "RIDOTTA", pos: null, z: i + 1 }])) as Record<
        Id,
        StatoFinestra
      >,
  );

  /** Aggiorna una finestra sola, lasciando le altre come sono. */
  const cambia = (id: Id, f: (s: StatoFinestra, tutte: Record<Id, StatoFinestra>) => Partial<StatoFinestra>) =>
    setStato((tutte) => ({ ...tutte, [id]: { ...tutte[id], ...f(tutte[id], tutte) } }));

  /** Lo z più alto + 1: la finestra va sopra tutte. */
  const zInCima = (tutte: Record<Id, StatoFinestra>) => Math.max(...Object.values<StatoFinestra>(tutte).map((s) => s.z)) + 1;

  return {
    stato,
    /** Porta in primo piano (se non è già lei la più alta). */
    primoPiano(id: Id) {
      cambia(id, (s, tutte) => (s.z === zInCima(tutte) - 1 ? {} : { z: zInCima(tutte) }));
    },
    /** Il tasto "—": parte lo spegnimento (o, con meno movimento, si riduce subito). */
    riduci(id: Id) {
      cambia(id, () => ({ fase: menoMovimento() ? "RIDOTTA" : "RIDUCENDO" }));
    },
    /** Fine dell'animazione di spegnimento: ora è solo un'icona. */
    fineRiduzione(id: Id) {
      cambia(id, (s) => (s.fase === "RIDUCENDO" ? { fase: "RIDOTTA" } : {}));
    },
    /** Clic sull'icona del dock: si riaccende, sopra tutte. */
    ripristina(id: Id) {
      cambia(id, (_, tutte) => ({ fase: "APERTA", z: zInCima(tutte) }));
    },
    /** Trascinamento: nuova posizione in px dentro l'area. */
    sposta(id: Id, x: number, y: number) {
      cambia(id, () => ({ pos: { x, y } }));
    },
  };
}
