/**
 * ============================================================================
 * PannelloPianeta.tsx — Ciò che la crew sa di E-17
 * ============================================================================
 *
 * Usa solo la CONOSCENZA (content/pianeti/e17.ts), mai la verità nascosta.
 * Il globo è un piccolo SVG "wireframe" nello stile dei riferimenti
 * grafici: un cerchio, due meridiani ellittici e qualche parallelo.
 * ============================================================================
 */

import { E17_NOTO } from "../../content/pianeti/e17";
import { Finestra } from "../components/Finestra";
import stili from "./PannelloPianeta.module.css";

export function PannelloPianeta({ seedPartita }: { seedPartita: string }) {
  const p = E17_NOTO;
  const righe: [string, string][] = [
    ["TIPO", p.tipo],
    ["GRAVITÀ", p.gravita],
    ["ATMOSFERA", p.atmosfera],
    ["TEMPERATURA", p.temperatura],
    ["RADIAZIONI", p.radiazioni],
    ["VENTO", p.vento],
    ["BIOLOGIA", p.biologia],
  ];

  return (
    <Finestra variante="cornice" titolo={`Pianeta ${p.id}`} destra={p.seed}>
      <div className={stili.contenuto}>
        <svg className={stili.globo} viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="40" />
          <ellipse cx="50" cy="50" rx="16" ry="40" />
          <ellipse cx="50" cy="50" rx="30" ry="40" />
          <line x1="10" y1="50" x2="90" y2="50" />
          <ellipse cx="50" cy="50" rx="40" ry="14" />
          {/* Il cratere settentrionale: il punto di interesse attuale. */}
          <circle className={stili.bersaglio} cx="58" cy="26" r="3" />
        </svg>
        <dl className={stili.dati}>
          {righe.map(([chiave, valore]) => (
            <div key={chiave}>
              <dt>{chiave}</dt>
              <dd>{valore}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className={stili.posizione}>▸ {p.posizione}</p>
      {/* Il seed della PARTITA (diverso da quello del pianeta): serve per rigiocarla. */}
      <p className={stili.seed}>PARTITA {seedPartita}</p>
    </Finestra>
  );
}
