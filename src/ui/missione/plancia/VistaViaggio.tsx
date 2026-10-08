/**
 * ============================================================================
 * VistaViaggio.tsx — La rotta: griglia in prospettiva e bersaglio all'orizzonte
 * ============================================================================
 *
 * Riferimento grafico: il primo video di Roberto (griglia che corre verso
 * un pianeta sull'orizzonte, etichette che compaiono accanto al bersaglio).
 *
 * I TRE STRATI (dal fondo)
 *   1. CIELO: stelle (sfondo CSS) e il pianeta di destinazione (SVG). Il
 *      raggio del pianeta viene dal progresso della tratta: più ci si
 *      avvicina, più è grande (derivati.raggioDestinazione).
 *   2. PAVIMENTO: un <div> con una griglia disegnata da due gradienti CSS,
 *      inclinato in 3D con `perspective() rotateX()`. L'animazione sposta lo
 *      sfondo verso chi guarda: sembra di avanzare. Copre la metà bassa del
 *      pianeta, come un tramonto.
 *   3. HUD: testi in HTML sopra tutto (velocità, conto alla rovescia,
 *      etichetta del bersaglio, barra del viaggio). In HTML e non in SVG
 *      perché il testo deve restare leggibile (mai sotto i 12px).
 *
 * DOVE STANNO LE COSE
 * La vista occupa tutta la larghezza (sfondo, griglia, HUD agli angoli).
 * Al centro c'è il PALCO, con rapporto fisso 400×150 (aspect-ratio): dentro
 * il palco le coordinate dell'SVG (viewBox 0 0 400 150) e le percentuali
 * dell'HTML (l'etichetta) puntano sempre allo stesso punto. Su desktop la
 * vista ha un'altezza fissa (non cresce con la colonna); su telefono ha lo
 * stesso rapporto del palco, che quindi la riempie.
 *
 * v3.8 · SUPERMISSIONI: all'andata l'orizzonte mostra il bersaglio della
 * missione con la sua forma (pianeta, stazione, asteroide, cometa,
 * relitto: SagomaBersaglio); al rientro, sempre la Terra.
 * ============================================================================
 */

import { useId, type CSSProperties } from "react";
import type { Tratta } from "../../../engine/storia/viaggio";
import type { FormaBersaglio } from "../../../engine/types";
import { contoAllaRovescia, distanzaUA, raggioDestinazione } from "./derivati";
import { SagomaBersaglio } from "./SagomaBersaglio";
import stili from "./VistaViaggio.module.css";

/** La linea dell'orizzonte nel viewBox (y), condivisa con il CSS (64%). */
const ORIZZONTE = 96;

interface Props {
  tratta: Tratta;
  seed: string;
  /** Il bersaglio della missione: nome ("Argo-3") e forma. */
  bersaglio: { nome: string; forma: FormaBersaglio };
}

export function VistaViaggio({ tratta, seed, bersaglio }: Props) {
  // Un id unico per il clipPath: con due viste nella stessa pagina (es. il
  // banco di prova) un id fisso farebbe usare a tutte il ritaglio della prima.
  // useId dà valori tipo «r1» o :r1:, che in url(#…) non sono validi: si puliscono.
  const idClip = `clip-destinazione-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const r = raggioDestinazione(tratta.progresso);
  // Il centro sta un po' sopra l'orizzonte: il pavimento ne copre la base.
  const cy = ORIZZONTE - r * 0.45;
  const percento = Math.round(tratta.progresso * 100);
  const versoTerra = tratta.destinazione === "TERRA";
  const nome = versoTerra ? "TERRA" : bersaglio.nome.toUpperCase();
  // La Terra è un pianeta; all'andata si disegna la forma del bersaglio.
  const forma: FormaBersaglio = versoTerra ? "PIANETA" : bersaglio.forma;

  // L'etichetta del bersaglio si aggancia al bordo destro del pianeta.
  // Le percentuali vengono dalle coordinate SVG (400 di larghezza, 150 di altezza).
  const posEtichetta = {
    left: `${((200 + r * 0.75 + 8) / 400) * 100}%`,
    // Sempre sopra l'orizzonte (sotto c'è il pavimento che la coprirebbe).
    top: `${(Math.max(8, Math.min(cy - r * 0.8, ORIZZONTE - 34)) / 150) * 100}%`,
  } as CSSProperties;

  // Le "staffe" di aggancio attorno al pianeta (4 angoli a L).
  const m = r + 6;
  const l = Math.min(10, r * 0.6);
  const angoli = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const;

  return (
    <div
      className={stili.vista}
      role="img"
      aria-label={`Rotta verso ${nome}: ${percento}% del viaggio, distanza ${distanzaUA(tratta)} UA, arrivo tra ${contoAllaRovescia(tratta.minutiAllArrivo)}.`}
    >
      <div className={stili.stelle} aria-hidden="true" />

      {/* Il pavimento a griglia che corre verso chi guarda (tutta la larghezza). */}
      <div className={stili.pavimento} aria-hidden="true" />

      {/* Il "palco": proporzioni fisse 400×150, centrato. Dentro, le coordinate
          SVG e le percentuali HTML coincidono sempre. */}
      <div className={stili.palco}>
        <svg className={stili.cielo} viewBox="0 0 400 150" aria-hidden="true">
          <defs>
            <clipPath id={idClip}>
              <circle cx="200" cy={cy} r={r} />
            </clipPath>
          </defs>
          {/* Alone del bersaglio */}
          <circle className={stili.alone} cx="200" cy={cy} r={r + 10} />
          {forma === "PIANETA" ? (
            <g className={stili.pianeta}>
              <circle cx="200" cy={cy} r={r} />
              {/* Paralleli e un meridiano, tagliati dentro il disco (clipPath). */}
              <g clipPath={`url(#${idClip})`}>
                {[-0.6, -0.3, 0, 0.3, 0.6].map((k) => (
                  <line key={k} x1={200 - r} x2={200 + r} y1={cy + k * r} y2={cy + k * r} />
                ))}
                <ellipse cx="200" cy={cy} rx={r * 0.45} ry={r} />
                {/* Il cratere: solo sul pianeta della missione, non sulla Terra. */}
                {!versoTerra && <circle className={stili.cratere} cx={200 + r * 0.25} cy={cy - r * 0.5} r={Math.max(1.5, r * 0.12)} />}
              </g>
            </g>
          ) : (
            <SagomaBersaglio forma={forma} cx={200} cy={cy} r={r * 0.8} />
          )}
          {/* Staffe di aggancio: lampeggiano, il bersaglio è "agganciato". */}
          <g className={stili.staffe}>
            {angoli.map(([sx, sy]) => (
              <path key={`${sx}${sy}`} d={`M ${200 + sx * m} ${cy + sy * (m - l)} V ${cy + sy * m} H ${200 + sx * (m - l)}`} />
            ))}
          </g>
        </svg>

        <div className={stili.etichetta} style={posEtichetta} aria-hidden="true">
          <span>BERSAGLIO · {nome}</span>
          <span className={stili.tenue}>{distanzaUA(tratta)} UA</span>
        </div>
      </div>

      <div className={stili.orizzonte} aria-hidden="true" />

      {/* --- HUD --------------------------------------------------------- */}
      <div className={`${stili.hud} ${stili.alto} ${stili.sinistra}`} aria-hidden="true">
        <span>VEL 41.6 km/s</span>
        <span className={stili.tenue}>ORB-1 · {seed}</span>
        {/* Su telefono l'etichetta accanto al pianeta sparisce: la distanza sta qui. */}
        <span className={stili.soloMobile}>DIST {distanzaUA(tratta)} UA</span>
      </div>
      <div className={`${stili.hud} ${stili.alto} ${stili.destra}`} aria-hidden="true">
        <span className={stili.tenue}>ARRIVO</span>
        <span className={stili.grande}>{contoAllaRovescia(tratta.minutiAllArrivo)}</span>
      </div>

      <div className={stili.tratta} aria-hidden="true">
        <span>{versoTerra ? bersaglio.nome.toUpperCase() : "TERRA"}</span>
        <div className={stili.linea}>
          <div className={stili.fatto} style={{ width: `${percento}%` }} />
          <div className={stili.nave} style={{ left: `${percento}%` }} />
        </div>
        <span>{nome}</span>
        <span className={stili.percento}>{percento}%</span>
      </div>
    </div>
  );
}
