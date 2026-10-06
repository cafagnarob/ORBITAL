/**
 * ============================================================================
 * GloboOrbita.tsx — E-17 che ruota, con la nave ORB-1 in orbita
 * ============================================================================
 *
 * Un globo "wireframe" come quello del pannello Pianeta, ma vivo.
 *
 * COME RUOTA UN GLOBO DISEGNATO IN 2D
 * Un meridiano visto di fronte è un'ellisse: larga quando è di profilo
 * verso di noi, una riga verticale quando è di taglio. Facendo variare il
 * raggio orizzontale (rx) da 100 a 0 e di nuovo a 100, con meridiani
 * sfasati nel tempo, l'occhio vede una sfera che gira.
 * Lo facciamo con le animazioni native dell'SVG (<animate>, SMIL): girano
 * da sole nel browser, senza JavaScript e senza useEffect.
 *
 * La nave segue un'ellisse inclinata (<animateMotion>); quando passa
 * "dietro" al pianeta la sua opacità si abbassa.
 * ============================================================================
 */

const DURATA_ROTAZIONE = 18; // secondi per mezzo giro (poi i meridiani si ripetono)
const MERIDIANI = 6;
const ORBITA = "M 290 150 A 140 34 0 1 1 10 150 A 140 34 0 1 1 290 150";

export function GloboOrbita({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 300" aria-hidden="true">
      <g transform="rotate(-14 150 150)">
        {/* Il disco del pianeta: copre ciò che sta dietro. */}
        <circle cx="150" cy="150" r="100" className="disco" />

        {/* Paralleli (fissi). */}
        {[-70, -40, 0, 40, 70].map((y) => (
          <ellipse
            key={y}
            cx="150"
            cy={150 + y}
            rx={Math.sqrt(100 * 100 - y * y)}
            ry={Math.sqrt(100 * 100 - y * y) * 0.18}
            className="linea tenue"
          />
        ))}

        {/* Meridiani: il raggio orizzontale segue |cos| dell'angolo. */}
        {Array.from({ length: MERIDIANI }, (_, i) => (
          <ellipse key={i} cx="150" cy="150" rx="100" ry="100" className="linea">
            <animate
              attributeName="rx"
              values="100;71;0;71;100"
              keyTimes="0;0.25;0.5;0.75;1"
              dur={`${DURATA_ROTAZIONE}s`}
              begin={`${-(i * DURATA_ROTAZIONE) / MERIDIANI}s`}
              repeatCount="indefinite"
            />
          </ellipse>
        ))}

        {/* Il Cratere Settentrionale: un punto che attraversa la faccia visibile. */}
        <circle cx="150" cy="92" r="4" className="cratere">
          <animate
            attributeName="cx"
            values="80;150;220;220;80"
            keyTimes="0;0.25;0.5;0.51;1"
            dur={`${DURATA_ROTAZIONE * 2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;0;0;0"
            keyTimes="0;0.25;0.5;0.51;1"
            dur={`${DURATA_ROTAZIONE * 2}s`}
            repeatCount="indefinite"
          />
        </circle>

        {/* L'orbita e la nave. */}
        <path d={ORBITA} className="linea orbita" />
        <g className="nave">
          <path d="M -6 -3 L 6 0 L -6 3 Z" />
          <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" path={ORBITA} />
          <animate
            attributeName="opacity"
            values="1;1;0.15;0.15;1"
            keyTimes="0;0.48;0.56;0.94;1"
            dur="11s"
            repeatCount="indefinite"
          />
        </g>
      </g>
    </svg>
  );
}
