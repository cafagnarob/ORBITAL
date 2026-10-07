/**
 * ============================================================================
 * geometria.ts — Conti degli strumenti circolari (quadranti e lancette)
 * ============================================================================
 *
 * Funzioni pure: da un valore 0–100 agli angoli e alle lunghezze SVG.
 *
 * IL TRUCCO DELL'ARCO "CHE SI RIEMPIE"
 * Un cerchio SVG con `stroke-dasharray: pieno vuoto` disegna solo un pezzo
 * del bordo. Se la circonferenza è C, `dasharray = "C*0.4 C"` disegna il
 * 40% del cerchio. Ruotando il cerchio scegliamo da dove parte l'arco.
 * Per gli indicatori usiamo 270° (tre quarti di giro, come un tachimetro).
 * ============================================================================
 */

/** Ampiezza della scala degli indicatori: da −135° a +135°. */
export const AMPIEZZA = 270;

export const circonferenza = (r: number) => 2 * Math.PI * r;

/** Valore 0–100 → angolo della lancetta in gradi (0 = verso l'alto). */
export function angoloLancetta(valore: number): number {
  const v = Math.min(100, Math.max(0, valore));
  return -AMPIEZZA / 2 + (v / 100) * AMPIEZZA;
}

/**
 * Il `stroke-dasharray` di un arco che copre la frazione `parte` (0–1)
 * dell'ampiezza `gradi` su un cerchio di raggio r.
 */
export function trattoArco(r: number, parte: number, gradi = 360): string {
  const c = circonferenza(r);
  const lunghezza = c * (gradi / 360) * Math.min(1, Math.max(0, parte));
  return `${lunghezza.toFixed(2)} ${c.toFixed(2)}`;
}

/** Le tacche attorno a un quadrante: n segmenti radiali tra r1 e r2. */
export function tacche(n: number, cx: number, cy: number, r1: number, r2: number, gradi = 360, partenza = 0) {
  return Array.from({ length: n }, (_, i) => {
    const passo = gradi === 360 ? gradi / n : gradi / (n - 1);
    const a = ((partenza + i * passo - 90) * Math.PI) / 180;
    return {
      x1: cx + r1 * Math.cos(a),
      y1: cy + r1 * Math.sin(a),
      x2: cx + r2 * Math.cos(a),
      y2: cy + r2 * Math.sin(a),
      lunga: i % (n >= 24 ? 6 : 2) === 0,
    };
  });
}
