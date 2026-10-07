/**
 * ============================================================================
 * VistaOrbita.tsx — E-17 in orbita: globo wireframe, schede dati, aggancio
 * ============================================================================
 *
 * Riferimento grafico: il secondo video di Roberto (globo che ruota, schede
 * che compaiono collegate da una linea, poi un anello che "aggancia" un
 * punto della superficie e lo chiude in un mirino).
 *
 * COME RUOTA UN GLOBO DISEGNATO IN 2D
 * Un meridiano visto di fronte è un'ellisse: larga quanto il globo quando è
 * di profilo, una linea verticale quando passa davanti a noi. Basta quindi
 * "schiacciare" l'ellisse in orizzontale con scaleX da 1 a 0 a −1 e
 * ritorno: sei meridiani con l'animazione sfasata (animation-delay
 * negativo) danno l'illusione di un globo che gira. È tutto CSS.
 *
 * DUE DISPOSIZIONI, NESSUNA MISURA IN JAVASCRIPT
 * La Plancia può essere una striscia larga e bassa (tre colonne, telefono)
 * o un pannello quasi quadrato (quattro colonne). Invece di misurare il
 * pannello con JavaScript (servirebbero useEffect e ResizeObserver),
 * disegniamo la scena in DUE disposizioni (LARGA e ALTA, solo dati: vedi
 * sotto) e lasciamo scegliere al CSS con una container query sulla FORMA:
 *   @container (aspect-ratio > 2.1)  → si vede la LARGA, altrimenti l'ALTA.
 * Quella nascosta ha display: none, quindi non costa animazioni.
 *
 * LE TRE MODALITÀ (dalla Plancia, derivati.modoOrbita)
 *   OSSERVAZIONE  il globo ruota, le schede dei dati compaiono a turno;
 *   ACQUISIZIONE  una scansione del cratere è in corso: le schede spariscono,
 *                 due anelli tratteggiati girano in senso opposto, un fascio
 *                 spazza il globo e il mirino lampeggia sul cratere. Colore
 *                 AMBRA (non il rosso del video): nel design system di ORBITAL
 *                 il rosso è solo per i guasti, e l'ambra va sempre con un
 *                 testo ("ACQUISIZIONE IN CORSO");
 *   ACQUISITA     il mirino resta fisso sul cratere: obiettivo raggiunto.
 *
 * I dati delle schede sono la CONOSCENZA del pianeta (content/pianeti/e17),
 * mai la verità nascosta.
 * ============================================================================
 */

import { useId, type CSSProperties } from "react";
import { E17_NOTO } from "../../../content/pianeti/e17";
import { numeriDalSeed, type ModoOrbita } from "./derivati";
import stili from "./VistaOrbita.module.css";

// ----------------------------------------------------------------------------
// LE DUE DISPOSIZIONI (solo numeri: coordinate del viewBox)
// ----------------------------------------------------------------------------

type IdScheda = "a" | "b" | "c" | "d";

interface Disposizione {
  nome: "larga" | "alta";
  /** Dimensioni del viewBox (e rapporto del palco). */
  w: number;
  h: number;
  /** Centro e raggio del globo. */
  cx: number;
  cy: number;
  r: number;
  /** Semiassi dell'orbita della nave. */
  orbita: { rx: number; ry: number };
  /** Le schede visibili e da dove parte la loro linea (bordo della scheda). */
  schede: { id: IdScheda; x: number; y: number }[];
}

const LARGA: Disposizione = {
  nome: "larga",
  w: 400,
  h: 150,
  cx: 200,
  cy: 75,
  r: 52,
  orbita: { rx: 96, ry: 19 },
  // Striscia bassa: solo le due schede in alto (le altre non ci stanno).
  schede: [
    { id: "a", x: 112, y: 28 },
    { id: "b", x: 288, y: 28 },
  ],
};

const ALTA: Disposizione = {
  nome: "alta",
  w: 400,
  h: 280,
  cx: 200,
  cy: 140,
  r: 86,
  orbita: { rx: 160, ry: 30 },
  schede: [
    { id: "a", x: 112, y: 34 },
    { id: "b", x: 288, y: 34 },
    { id: "c", x: 112, y: 205 },
    { id: "d", x: 288, y: 205 },
  ],
};

/** Solo la prima parte di un valore lungo: "SOTTILE · NON RESPIRABILE" → "SOTTILE". */
const breve = (v: string) => v.split(" · ")[0] ?? v;

const RIGHE: Record<IdScheda, readonly (readonly [string, string])[]> = {
  a: [
    ["ATMOSFERA", breve(E17_NOTO.atmosfera)],
    ["TEMP.", E17_NOTO.temperatura],
  ],
  b: [
    ["RADIAZIONI", E17_NOTO.radiazioni],
    ["GRAVITÀ", E17_NOTO.gravita],
  ],
  c: [["SPETTRO", ""]],
  d: [
    ["BIOLOGIA", E17_NOTO.biologia],
    ["VENTO", E17_NOTO.vento],
  ],
};

const PARALLELI = [-0.72, -0.4, 0, 0.4, 0.72];
const MERIDIANI = 6;
/** Durata di un giro del globo, in secondi (stessa del CSS). */
const GIRO = 18;

// ----------------------------------------------------------------------------
// LA VISTA
// ----------------------------------------------------------------------------

export function VistaOrbita({ modo, seed }: { modo: ModoOrbita; seed: string }) {
  const testoModo =
    modo === "ACQUISIZIONE"
      ? "▲ ACQUISIZIONE IN CORSO"
      : modo === "ACQUISITA"
        ? "✓ AREA D'INTERESSE ACQUISITA"
        : "CRATERE SETTENTRIONALE · IN VISTA";

  return (
    <div className={`${stili.vista} ${stili[modo.toLowerCase()]}`} role="img" aria-label={`Pianeta E-17 in orbita. ${testoModo}.`}>
      <Scena d={LARGA} seed={seed} testoModo={testoModo} />
      <Scena d={ALTA} seed={seed} testoModo={testoModo} />
    </div>
  );
}

/** Una disposizione della scena: globo, orbita, schede, anelli, testi. */
function Scena({ d, seed, testoModo }: { d: Disposizione; seed: string; testoModo: string }) {
  // Un id unico per il clipPath: con più scene nella stessa pagina un id
  // fisso farebbe usare a tutte il ritaglio della prima. useId dà valori
  // tipo «r1» o :r1:, che in url(#…) non sono validi: si puliscono.
  const idClip = `clip-globo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const barre = numeriDalSeed(seed, 7, 100);
  const { cx, cy, r } = d;
  // Il Cratere Settentrionale: in alto a destra del centro.
  const cratere = { x: cx + r * 0.37, y: cy - r * 0.5 };
  // Dove le linee delle schede toccano il globo (a 45° nei quattro quadranti).
  const tocca = (id: IdScheda) => {
    const sx = id === "a" || id === "c" ? -1 : 1;
    const sy = id === "a" || id === "b" ? -1 : 1;
    return { x: cx + sx * r * 0.72, y: cy + sy * r * 0.62 };
  };
  const s = r / 52; // scala rispetto alla disposizione larga (anelli, mirino)
  const fascio = 72 * s;

  return (
    <div className={`${stili.palco} ${stili[d.nome]}`}>
      <svg className={stili.disegno} viewBox={`0 0 ${d.w} ${d.h}`} aria-hidden="true">
        <defs>
          <clipPath id={idClip}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>

        {/* L'orbita della nave: la metà dietro passa sotto il globo. */}
        <g transform={`rotate(-10 ${cx} ${cy})`}>
          <ellipse className={stili.orbita} cx={cx} cy={cy} rx={d.orbita.rx} ry={d.orbita.ry} />
        </g>

        {/* Il globo */}
        <circle className={stili.disco} cx={cx} cy={cy} r={r} />
        <g className={stili.reticolo} clipPath={`url(#${idClip})`}>
          {PARALLELI.map((k) => {
            const rx = r * Math.sqrt(1 - k * k);
            return <ellipse key={k} cx={cx} cy={cy + k * r} rx={rx} ry={rx * 0.16} />;
          })}
          {Array.from({ length: MERIDIANI }, (_, i) => (
            <ellipse
              key={i}
              className={stili.meridiano}
              cx={cx}
              cy={cy}
              rx={r}
              ry={r}
              style={{ animationDelay: `${-(i * GIRO) / MERIDIANI}s` } as CSSProperties}
            />
          ))}
          {/* Crateri minori: dettagli fissi della superficie. */}
          <ellipse className={stili.crateri} cx={cx - r * 0.35} cy={cy + r * 0.25} rx={7 * s} ry={4 * s} />
          <ellipse className={stili.crateri} cx={cx + r * 0.1} cy={cy + r * 0.56} rx={5 * s} ry={2.6 * s} />
          <ellipse className={stili.crateri} cx={cx - r * 0.54} cy={cy - r * 0.25} rx={4 * s} ry={2.4 * s} />
        </g>
        <circle className={stili.bordo} cx={cx} cy={cy} r={r} />

        {/* La metà davanti dell'orbita, sopra il globo. */}
        <g transform={`rotate(-10 ${cx} ${cy})`}>
          <path
            className={stili.orbita}
            d={`M ${cx - d.orbita.rx} ${cy} A ${d.orbita.rx} ${d.orbita.ry} 0 0 0 ${cx + d.orbita.rx} ${cy}`}
          />
        </g>

        {/* Il bersaglio: il Cratere Settentrionale. */}
        <circle className={stili.bersaglio} cx={cratere.x} cy={cratere.y} r={3.5 * s} />
        <circle className={stili.impulso} cx={cratere.x} cy={cratere.y} r={3.5 * s} />

        {/* Linee verso le schede (solo in osservazione). */}
        <g className={stili.linee}>
          {d.schede.map((sc) => {
            const t = tocca(sc.id);
            const gomito = sc.x + (sc.x < cx ? 10 : -10);
            return <polyline key={sc.id} className={stili[`linea_${sc.id}`]} points={`${sc.x},${sc.y} ${gomito},${sc.y} ${t.x},${t.y}`} />;
          })}
        </g>

        {/* Acquisizione: anelli, fascio, mirino. */}
        <g className={stili.aggancio}>
          <circle className={stili.anello1} cx={cx} cy={cy} r={r + 10 * s} />
          <circle className={stili.anello2} cx={cx} cy={cy} r={r + 18 * s} />
          <path
            className={stili.fascio}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            d={`M ${cx} ${cy} L ${cx} ${cy - fascio} A ${fascio} ${fascio} 0 0 1 ${cx + fascio * Math.sin(0.35)} ${cy - fascio * Math.cos(0.35)} Z`}
          />
        </g>
        <g className={stili.mirino}>
          <rect x={cratere.x - 9 * s} y={cratere.y - 9 * s} width={18 * s} height={18 * s} />
          <line x1={cratere.x - 14 * s} y1={cratere.y} x2={cratere.x - 5 * s} y2={cratere.y} />
          <line x1={cratere.x + 5 * s} y1={cratere.y} x2={cratere.x + 14 * s} y2={cratere.y} />
          <line x1={cratere.x} y1={cratere.y - 14 * s} x2={cratere.x} y2={cratere.y - 5 * s} />
          <line x1={cratere.x} y1={cratere.y + 5 * s} x2={cratere.x} y2={cratere.y + 14 * s} />
        </g>
      </svg>

      {/* --- Schede dei dati (HTML: testo sempre leggibile) ------------------- */}
      {d.schede.map(({ id }) => (
        <dl key={id} className={`${stili.scheda} ${stili[`scheda_${id}`]}`} aria-hidden="true">
          {RIGHE[id].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              {v && <dd>{v}</dd>}
            </div>
          ))}
          {id === "c" && (
            <div className={stili.spettro}>
              {barre.map((b, i) => (
                <span key={i} style={{ height: `${25 + (b * 75) / 100}%`, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          )}
        </dl>
      ))}

      <p className={stili.modo}>{testoModo}</p>
      <p className={stili.coordinate} aria-hidden="true">
        LAT 71.4°N · LON 012.8°E · QUOTA 412 km
      </p>
    </div>
  );
}
