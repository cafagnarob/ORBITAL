/**
 * ============================================================================
 * FinestraMobile.tsx — Una finestra a comparsa: si trascina e si riduce a icona
 * ============================================================================
 *
 * Aspetto: come la finestra "sistema" del design system (barra piena,
 * angolo smussato), più il tasto "—" per ridurla a icona nel dock.
 *
 * TRASCINARE SENZA useEffect (Pointer Events)
 * Si prende la finestra dalla BARRA DEL TITOLO:
 *   pointerdown  → setPointerCapture: da ora TUTTI i movimenti del
 *                  puntatore arrivano a questa barra, anche se il mouse
 *                  esce dalla finestra o va veloce. Ci annotiamo dove
 *                  l'abbiamo presa (scarto tra puntatore e angolo);
 *   pointermove  → nuova posizione = puntatore − scarto, tenuta dentro
 *                  l'area (la finestra non può sparire fuori schermo);
 *   pointerup    → fine (la cattura si rilascia da sola).
 * Le misure si leggono nei gestori, non durante il disegno: per questo
 * vanno in un useRef (che non fa ridisegnare) e non in useState.
 * Funziona con mouse, penna e dito allo stesso modo.
 *
 * SCALA
 * Se un antenato è scalato con transform (es. l'effetto del tubo), i px
 * dello schermo non sono px CSS: dividiamo per il fattore di scala
 * (larghezza vista / larghezza CSS dell'area).
 *
 * TELEFONO (< 1100px)
 * Niente trascinamento: la finestra si apre a tutto schermo (CSS) e il
 * tasto "—" la rimette nel dock.
 *
 * SPEGNIMENTO VERSO L'ICONA
 * In fase RIDUCENDO il CSS fa l'animazione da tubo catodico; quando finisce
 * (onAnimationEnd) avvisiamo il genitore, che la segna RIDOTTA.
 * ============================================================================
 */

import { useId, useRef, type PointerEvent, type ReactNode } from "react";
import type { StatoFinestra } from "./useFinestre";
import stili from "./FinestraMobile.module.css";

interface Props {
  titolo: string;
  /** Testo a destra nella barra (contatori). */
  destra?: ReactNode;
  stato: StatoFinestra;
  /** Classe con la posizione e la misura di partenza (dal CSS di chi la usa). */
  className?: string;
  onPrimoPiano: () => void;
  onRiduci: () => void;
  onFineRiduzione: () => void;
  onSposta: (x: number, y: number) => void;
  children: ReactNode;
}

/** Sotto i 1100px le finestre sono a tutto schermo e non si trascinano. */
const suTelefono = () => window.matchMedia("(max-width: 1099px)").matches;

export function FinestraMobile({
  titolo,
  destra,
  stato,
  className = "",
  onPrimoPiano,
  onRiduci,
  onFineRiduzione,
  onSposta,
  children,
}: Props) {
  const idTitolo = useId();
  const finestra = useRef<HTMLElement>(null);
  // Dati del trascinamento in corso (null = fermo). Letti solo nei gestori.
  const presa = useRef<{ dx: number; dy: number; area: DOMRect; scala: number; w: number; h: number } | null>(null);

  function inizia(e: PointerEvent<HTMLElement>) {
    // I pulsanti della barra (es. "—") non avviano il trascinamento.
    if ((e.target as HTMLElement).closest("button") || suTelefono()) return;
    const el = finestra.current;
    const area = el?.offsetParent;
    if (!el || !(area instanceof HTMLElement)) return;
    const r = el.getBoundingClientRect();
    const a = area.getBoundingClientRect();
    const scala = a.width / area.offsetWidth || 1;
    presa.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, area: a, scala, w: el.offsetWidth, h: el.offsetHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault(); // niente selezione del testo mentre si trascina
  }

  function muovi(e: PointerEvent<HTMLElement>) {
    const p = presa.current;
    if (!p) return;
    const larghezza = p.area.width / p.scala;
    const altezza = p.area.height / p.scala;
    const x = (e.clientX - p.area.left - p.dx) / p.scala;
    const y = (e.clientY - p.area.top - p.dy) / p.scala;
    // Dentro l'area: almeno la barra del titolo resta sempre afferrabile.
    onSposta(
      Math.round(Math.min(Math.max(0, x), Math.max(0, larghezza - p.w))),
      Math.round(Math.min(Math.max(0, y), Math.max(0, altezza - 40))),
    );
  }

  function finisci() {
    presa.current = null;
  }

  const posizione = stato.pos ? { left: stato.pos.x, top: stato.pos.y, right: "auto", bottom: "auto" } : {};

  return (
    <section
      ref={finestra}
      className={`${stili.finestra} ${stili[stato.fase.toLowerCase()]} ${className}`}
      style={{ ...posizione, zIndex: 10 + stato.z }}
      aria-labelledby={idTitolo}
      hidden={stato.fase === "RIDOTTA"}
      onPointerDown={onPrimoPiano}
      onAnimationEnd={(e) => {
        // Solo l'animazione della finestra stessa, non quelle dei figli.
        if (e.target === e.currentTarget && stato.fase === "RIDUCENDO") onFineRiduzione();
      }}
    >
      <header className={stili.barra} onPointerDown={inizia} onPointerMove={muovi} onPointerUp={finisci} onPointerCancel={finisci}>
        <span className={stili.marcatore} aria-hidden="true">
          ■■■
        </span>
        <h2 id={idTitolo} className={stili.titolo}>
          {titolo}
        </h2>
        {destra !== undefined && <span className={stili.destra}>{destra}</span>}
        <button type="button" className={stili.riduci} onClick={onRiduci} aria-label={`Riduci ${titolo} a icona`} title="Riduci a icona">
          —
        </button>
      </header>
      <div className={stili.corpo}>{children}</div>
    </section>
  );
}
