/**
 * ============================================================================
 * e17.ts — Ciò che la crew SA del pianeta E-17 all'arrivo in orbita
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §13.1.
 *
 * ATTENZIONE: questa è la CONOSCENZA, non la VERITÀ (DESIGN §16.2).
 * Sono i dati che gli strumenti di bordo forniscono all'arrivo. La verità
 * nascosta del pianeta (la rete sotterranea, KESTREL-4, le tre verità
 * possibili) arriverà in un file separato che la UI non leggerà mai.
 * Per questo "biologia" qui vale SCONOSCIUTA.
 * ============================================================================
 */

export interface SchedaPianetaNota {
  id: string;
  seed: string;
  tipo: string;
  gravita: string;
  atmosfera: string;
  temperatura: string;
  radiazioni: string;
  vento: string;
  biologia: string;
  /** Dove si trova la nave in questa fase della missione. */
  posizione: string;
}

export const E17_NOTO: SchedaPianetaNota = {
  id: "E-17",
  seed: "E17-73A9",
  tipo: "ARIDO",
  gravita: "NORMALE",
  atmosfera: "SOTTILE · NON RESPIRABILE",
  temperatura: "CALDA",
  radiazioni: "MODERATE",
  vento: "MODERATO",
  biologia: "SCONOSCIUTA",
  posizione: "ORBITA · CRATERE SETTENTRIONALE",
};
