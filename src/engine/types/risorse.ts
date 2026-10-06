/**
 * ============================================================================
 * risorse.ts — Tipi delle risorse di missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.
 *
 * PERCHÉ SOLO TRE NUMERI
 * Il design parla di molte grandezze, ma quasi tutte si CALCOLANO:
 *   - generazione e consumo di energia → dai moduli installati e
 *     dall'integrità del sistema Potenza (con i valori di balance.ts);
 *   - ossigeno → è una condizione del Supporto Vitale, non una scorta;
 *   - riserva di rientro → la stima V.A.L.E. dalla posizione della nave;
 *   - scafo → sta già in Nave.
 * Nello stato restano solo le quantità che "si consumano" davvero.
 * ============================================================================
 */

/** Le quantità consumabili della missione. */
export interface Risorse {
  /** Cibo + acqua unificati (DESIGN §6.1). */
  scorte: number
  /** Carica attuale della batteria (la capacità massima si calcola). */
  energia: number
  /** Carburante a bordo (la riserva di rientro si calcola). */
  carburante: number
}

/**
 * Il costo in risorse di un'azione, es. { energia: 3 }.
 * `Partial<Risorse>` rende tutti i campi facoltativi: un task che consuma
 * solo energia non deve scrivere `scorte: 0, carburante: 0`.
 */
export type CostoRisorse = Partial<Risorse>
