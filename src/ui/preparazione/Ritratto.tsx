/**
 * ============================================================================
 * Ritratto.tsx — L'immagine di un candidato, o il suo segnaposto
 * ============================================================================
 *
 * Se in src/assets/ritratti/ c'è un file con l'id del candidato (ritratti.ts),
 * mostra quello, tinto di verde fosforo dal CSS. Altrimenti disegna il
 * SEGNAPOSTO: una sagoma (testa e spalle) su una griglia, come una scheda
 * d'archivio senza foto, con la scritta "NESSUN RITRATTO".
 *
 * Il ritratto è decorativo per chi usa uno screen reader: nome e ruolo sono
 * già scritti nella scheda, quindi alt="" e aria-hidden.
 * ============================================================================
 */

import type { IdMembro } from "../../engine/types";
import { ritrattoDi } from "./ritratti";
import stili from "./Ritratto.module.css";

export function Ritratto({ id }: { id: IdMembro }) {
  const url = ritrattoDi(id);

  if (url) return <img className={stili.immagine} src={url} alt="" aria-hidden="true" loading="lazy" />;

  return (
    <svg className={stili.segnaposto} viewBox="0 0 120 160" aria-hidden="true">
      {/* Griglia di fondo */}
      {[20, 40, 60, 80, 100].map((x) => (
        <line key={`v${x}`} className={stili.griglia} x1={x} y1="0" x2={x} y2="160" />
      ))}
      {[20, 40, 60, 80, 100, 120, 140].map((y) => (
        <line key={`h${y}`} className={stili.griglia} x1="0" y1={y} x2="120" y2={y} />
      ))}
      {/* Sagoma: spalle e testa */}
      <path className={stili.sagoma} d="M 14 160 C 16 122 34 110 60 110 C 86 110 104 122 106 160 Z" />
      <ellipse className={stili.sagoma} cx="60" cy="72" rx="23" ry="27" />
      {/* Mirino di "riconoscimento" sul volto */}
      <g className={stili.mirino}>
        <path d="M 32 44 v -8 h 8 M 80 36 h 8 v 8 M 88 100 v 8 h -8 M 40 108 h -8 v -8" />
      </g>
      <text className={stili.scritta} x="60" y="18" textAnchor="middle">
        NESSUN RITRATTO
      </text>
    </svg>
  );
}
