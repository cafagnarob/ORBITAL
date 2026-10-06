/**
 * ============================================================================
 * risorse.ts — Tipi delle risorse di missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.
 *
 * CINQUE NUMERI (v3.0: cibo, acqua e ossigeno tornano separati)
 * Nello stato restano solo le quantità che "si consumano" davvero:
 *   cibo, acqua    → dalle casse caricate nella Preparazione;
 *   ossigeno       → la riserva nei serbatoi: ogni sera il Supporto Vitale
 *                    ne rigenera una parte, IN PROPORZIONE alla sua
 *                    integrità. Se il Supporto Vitale si guasta, l'ossigeno
 *                    diventa il problema più urgente della nave;
 *   energia, carburante.
 * Il resto si CALCOLA: generazione e consumo (dai moduli, balance.ts),
 * riserva di rientro, scafo (sta già in Nave).
 * ============================================================================
 */

/** Le quantità consumabili della missione. */
export interface Risorse {
  /** Razioni di cibo. */
  cibo: number;
  /** Litri d'acqua (unità di gioco). */
  acqua: number;
  /** Riserva d'ossigeno nei serbatoi. */
  ossigeno: number;
  /** Carica attuale della batteria (la capacità massima si calcola). */
  energia: number;
  /** Carburante a bordo (la riserva di rientro si calcola). */
  carburante: number;
}

/**
 * Il costo in risorse di un'azione, es. { energia: 3 }.
 * `Partial<Risorse>` rende tutti i campi facoltativi: un task che consuma
 * solo energia non deve scrivere `cibo: 0, acqua: 0…`.
 */
export type CostoRisorse = Partial<Risorse>;
