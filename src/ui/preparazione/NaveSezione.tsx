/**
 * ============================================================================
 * NaveSezione.tsx — La nave ORB-1 vista di lato, mentre la si prepara
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §5 (nave), §11 (loadout).
 *
 * COSA DISEGNA (SVG, stile wireframe a fosfori)
 *   ┌───────────── 2 alloggi moduli in alto ─────────────┐
 *   ◁ PRP │ ING │ SV │ STIVA (rastrelliera + casse) │ LAB │ INF │ HAB │ CMD ▷
 *   └──── 2 alloggi in basso ──── AIRLOCK ──────────────┘
 * - i 4 ALLOGGI dei moduli: tratteggiati se vuoti, pieni con la sigla del
 *   modulo quando lo installi;
 * - il compartimento POTENZIATO da un modulo (es. Laboratorio Avanzato →
 *   LAB) si illumina;
 * - la RASTRELLIERA con 6 posti per l'equipaggiamento;
 * - la STIVA a celle da 10 unità, colorate per tipo di cassa;
 * - il SERBATOIO del carburante, con la linea della riserva di rientro;
 * - la CREW, piccole figure al loro posto di lavoro.
 *
 * ANIMAZIONI SENZA useEffect
 * Ogni elemento che compare ha una `key` legata a ciò che rappresenta
 * (l'ID del modulo, il membro, la cella). Quando aggiungi un modulo React
 * crea un elemento NUOVO, e un elemento nuovo parte con la sua animazione
 * CSS (`innesto`, `accensione`). Togliendolo, l'elemento sparisce.
 * Nessuno "stato precedente" da ricordare: decide tutto la key.
 *
 * Il disegno è in coordinate fisse (viewBox 724×210) e si adatta alla
 * larghezza disponibile: su mobile diventa più piccolo, non si deforma.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { CATALOGO_CANDIDATI } from "../../content/candidati";
import { CATALOGO_EQUIPAGGIAMENTO, CATALOGO_MODULI, LISTA_SCORTE } from "../../content/loadout";
import type { Riepilogo } from "../../engine/preparazione";
import type { Compartimento, Luogo, Preparazione } from "../../engine/types";
import stili from "./NaveSezione.module.css";

// ----------------------------------------------------------------------------
// GEOMETRIA (in unità del viewBox)
// ----------------------------------------------------------------------------

const SCAFO = { alto: 72, basso: 178 };

/** Compartimenti da poppa (sinistra) a prua (destra): x iniziale e finale. */
const COMPARTI: { id: Compartimento; sigla: string; da: number; a: number }[] = [
  { id: "PROPULSIONE", sigla: "PRP", da: 70, a: 140 },
  { id: "INGEGNERIA", sigla: "ING", da: 140, a: 220 },
  { id: "SUPPORTO_VITALE", sigla: "SV", da: 220, a: 290 },
  { id: "STOCCAGGIO", sigla: "STIVA", da: 290, a: 440 },
  { id: "LABORATORIO", sigla: "LAB", da: 440, a: 520 },
  { id: "INFERMERIA", sigla: "INF", da: 520, a: 585 },
  { id: "HABITAT", sigla: "HAB", da: 585, a: 650 },
  { id: "COMANDO", sigla: "CMD", da: 650, a: 705 },
];
const AIRLOCK = { x: 345, y: SCAFO.basso, l: 40, h: 36 };

/** I 4 alloggi dei moduli: due sopra lo scafo, due sotto. */
const ALLOGGI = [
  { x: 150, y: 30, sopra: true },
  { x: 455, y: 30, sopra: true },
  { x: 200, y: 192, sopra: false },
  { x: 480, y: 192, sopra: false },
];
const POD = { l: 92, h: 34 };

/** Rastrelliera dell'equipaggiamento: 6 posti nella parte alta della stiva. */
const RASTRELLIERA = { x: 298, y: 90, cella: 22, alt: 16, passo: 23.5 };
/** Griglia della stiva: celle da 10 unità sotto la rastrelliera. */
const STIVA = { x: 298, y: 114, colonne: 10, cella: 12.4, alt: 9, passo: 13.6, passoY: 11.5 };

/** Dove stanno le figure della crew, per luogo di partenza. */
function xDelLuogo(luogo: Luogo): number {
  if (luogo === "AIRLOCK") return AIRLOCK.x + AIRLOCK.l / 2;
  const c = COMPARTI.find((k) => k.id === luogo);
  return c ? (c.da + c.a) / 2 : 600;
}

// ----------------------------------------------------------------------------
// CALCOLI DI PRESENTAZIONE
// ----------------------------------------------------------------------------

type TipoCella = "cibo" | "acqua" | "ossigeno" | "carburante" | "altro" | "vuota" | "eccesso";

/**
 * Trasforma le casse in celle da 10 unità. Per ogni cella guardiamo quale
 * cassa occupa il suo punto centrale: così una cassa da 8 unità e una da
 * 10 si "dividono" le celle in proporzione, senza buchi né doppioni.
 */
function celleStiva(prep: Preparazione, massimo: number): TipoCella[] {
  const tratti: { fine: number; tipo: TipoCella }[] = [];
  let fine = 0;
  for (const s of LISTA_SCORTE) {
    const n = prep.scorte[s.id] ?? 0;
    if (n === 0) continue;
    fine += n * s.spazio;
    tratti.push({ fine, tipo: s.risorsa ?? "altro" });
  }
  const celle = Math.ceil(Math.max(massimo, fine) / 10);
  return Array.from({ length: celle }, (_, i) => {
    const centro = i * 10 + 5;
    if (centro > fine) return "vuota";
    if (centro > massimo) return "eccesso";
    return tratti.find((t) => centro <= t.fine)?.tipo ?? "vuota";
  });
}

// ----------------------------------------------------------------------------
// COMPONENTE
// ----------------------------------------------------------------------------

interface Props {
  prep: Preparazione;
  riepilogo: Riepilogo;
}

export function NaveSezione({ prep, riepilogo }: Props) {
  const p = BALANCE.preparazione;
  const potenziati = new Set(prep.moduli.map((id) => CATALOGO_MODULI[id]?.compartimento).filter(Boolean));
  const celle = celleStiva(prep, riepilogo.spazio.massimo);

  // Serbatoio: pieno = serbatoio principale + tutte le taniche possibili.
  const tanica = LISTA_SCORTE.find((s) => s.risorsa === "carburante");
  const carburanteMax = p.serbatoio + (tanica ? tanica.massimo * tanica.quantita : 0);
  const livello = Math.min(1, riepilogo.risorse.carburante / carburanteMax);
  const riserva = p.riservaRientro / carburanteMax;
  const SERB = { x: 82, y: 86, l: 14, h: 78 };

  // Crew: se due membri partono dallo stesso posto, li affianchiamo.
  const contati = new Map<Luogo, number>();
  const figure = prep.crew.flatMap((id) => {
    const m = CATALOGO_CANDIDATI[id];
    if (!m) return [];
    const quanti = contati.get(m.posizione) ?? 0;
    contati.set(m.posizione, quanti + 1);
    // Chi parte dall'airlock sta nella camera sotto lo scafo, non nella stiva.
    const dy = m.posizione === "AIRLOCK" ? 46 : 0;
    return [{ id, sigla: m.nome.slice(0, 3).toUpperCase(), x: xDelLuogo(m.posizione) + quanti * 16 - 8, dy }];
  });

  return (
    <svg
      className={stili.nave}
      viewBox="28 22 724 210"
      role="img"
      aria-label={`Nave ORB-1: ${prep.moduli.length} moduli, ${prep.equipaggiamento.length} equipaggiamenti, stiva ${riepilogo.spazio.occupato} su ${riepilogo.spazio.massimo}, crew ${prep.crew.length}`}
    >
      {/* --- Griglia di sfondo, come un progetto tecnico ------------------- */}
      <g className={stili.griglia}>
        {Array.from({ length: 19 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40 + 20} y1={8} x2={i * 40 + 20} y2={252} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`o${i}`} x1={10} y1={i * 45 + 17} x2={750} y2={i * 45 + 17} />
        ))}
      </g>

      {/* --- Ugelli dei motori a poppa ------------------------------------- */}
      <path className={stili.linea} d="M70 92 L40 84 L40 112 L70 106 Z M70 144 L40 138 L40 166 L70 158 Z" />

      {/* --- Alloggi dei moduli (pilone + capsula) -------------------------- */}
      {ALLOGGI.map((a, i) => {
        const id = prep.moduli[i];
        const def = id ? CATALOGO_MODULI[id] : undefined;
        const yPilone1 = a.sopra ? a.y + POD.h : SCAFO.basso;
        const yPilone2 = a.sopra ? SCAFO.alto : a.y;
        return (
          <g key={`alloggio-${i}`}>
            <line className={stili.pilone} x1={a.x + 30} y1={yPilone1} x2={a.x + 30} y2={yPilone2} />
            <line className={stili.pilone} x1={a.x + 62} y1={yPilone1} x2={a.x + 62} y2={yPilone2} />
            {def ? (
              // key = ID del modulo: cambiando modulo, la capsula "si innesta" di nuovo.
              <g key={def.id} className={`${stili.pod} ${a.sopra ? stili.daSopra : stili.daSotto}`}>
                <rect className={stili.podPieno} x={a.x} y={a.y} width={POD.l} height={POD.h} rx={8} />
                <text className={stili.podSigla} x={a.x + 10} y={a.y + 25}>
                  {def.sigla}
                </text>
                <text className={stili.podNome} x={a.x + POD.l - 8} y={a.y + 22} textAnchor="end">
                  {def.peso}KG
                </text>
                {/* Il nome completo compare passando sopra (tooltip nativo dell'SVG). */}
                <title>{def.nome}</title>
              </g>
            ) : (
              <g>
                <rect className={stili.podVuoto} x={a.x} y={a.y} width={POD.l} height={POD.h} rx={8} />
                <text className={stili.podNome} x={a.x + POD.l / 2} y={a.y + 21} textAnchor="middle">
                  SLOT {i + 1}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* --- Scafo e compartimenti ------------------------------------------- */}
      {COMPARTI.map((c) => (
        <g key={c.id}>
          {potenziati.has(c.id) && (
            // key con il compartimento: si "accende" quando arriva il primo modulo.
            <rect
              key={`luce-${c.id}`}
              className={stili.potenziato}
              x={c.da + 2}
              y={SCAFO.alto + 2}
              width={c.a - c.da - 4}
              height={SCAFO.basso - SCAFO.alto - 4}
            />
          )}
          <text className={stili.sigla} x={(c.da + c.a) / 2} y={SCAFO.alto + 13} textAnchor="middle">
            {c.sigla}
          </text>
          {c.id !== "COMANDO" && (
            <line className={stili.paratia} x1={c.a} y1={SCAFO.alto} x2={c.a} y2={SCAFO.basso} />
          )}
        </g>
      ))}
      {/* Il profilo dello scafo, con la prua rastremata a destra. */}
      <path
        className={stili.scafo}
        d={`M70 ${SCAFO.alto} L650 ${SCAFO.alto} Q712 ${SCAFO.alto} 742 125 Q712 ${SCAFO.basso} 650 ${SCAFO.basso} L70 ${SCAFO.basso} Z`}
      />
      {/* Oblò di prua. */}
      <path className={stili.linea} d="M690 102 Q716 106 724 125 Q716 144 690 148" />

      {/* --- Airlock sotto la stiva ----------------------------------------- */}
      <rect className={stili.linea} x={AIRLOCK.x} y={AIRLOCK.y} width={AIRLOCK.l} height={AIRLOCK.h} />
      <text className={stili.piccolo} x={AIRLOCK.x + AIRLOCK.l + 4} y={AIRLOCK.y + 12}>
        A/L
      </text>

      {/* --- Serbatoio del carburante (in propulsione) ---------------------- */}
      <rect className={stili.linea} x={SERB.x} y={SERB.y} width={SERB.l} height={SERB.h} />
      <rect
        className={riepilogo.carburanteOperativo > 0 ? stili.carburante : stili.carburanteBasso}
        x={SERB.x + 2}
        y={SERB.y + SERB.h - (SERB.h - 4) * livello - 2}
        width={SERB.l - 4}
        height={(SERB.h - 4) * livello}
      />
      {/* La linea della riserva di rientro: sotto questa, non si torna a casa. */}
      <line
        className={stili.riserva}
        x1={SERB.x - 4}
        x2={SERB.x + SERB.l + 4}
        y1={SERB.y + SERB.h - SERB.h * riserva}
        y2={SERB.y + SERB.h - SERB.h * riserva}
      />
      <text className={stili.piccolo} x={SERB.x + SERB.l + 6} y={SERB.y + 8}>
        {riepilogo.risorse.carburante}
      </text>

      {/* --- Rastrelliera dell'equipaggiamento ------------------------------ */}
      {Array.from({ length: p.slotEquipaggiamento }, (_, i) => {
        const id = prep.equipaggiamento[i];
        const def = id ? CATALOGO_EQUIPAGGIAMENTO[id] : undefined;
        const x = RASTRELLIERA.x + i * RASTRELLIERA.passo;
        return def ? (
          <g key={def.id} className={stili.innesto}>
            <rect className={stili.equipPieno} x={x} y={RASTRELLIERA.y} width={RASTRELLIERA.cella} height={RASTRELLIERA.alt} />
            <text className={stili.equipSigla} x={x + RASTRELLIERA.cella / 2} y={RASTRELLIERA.y + 12} textAnchor="middle">
              {def.sigla}
            </text>
          </g>
        ) : (
          <rect
            key={`vuoto-${i}`}
            className={stili.equipVuoto}
            x={x}
            y={RASTRELLIERA.y}
            width={RASTRELLIERA.cella}
            height={RASTRELLIERA.alt}
          />
        );
      })}

      {/* --- Celle della stiva ---------------------------------------------- */}
      {celle.map((tipo, i) => {
        const col = i % STIVA.colonne;
        const riga = Math.floor(i / STIVA.colonne);
        return (
          <rect
            // key con il tipo: quando una cella cambia contenuto si riaccende.
            key={`${i}-${tipo}`}
            className={`${stili.cella} ${stili[tipo]}`}
            x={STIVA.x + col * STIVA.passo}
            y={STIVA.y + riga * STIVA.passoY}
            width={STIVA.cella}
            height={STIVA.alt}
          />
        );
      })}

      {/* --- Crew ------------------------------------------------------------ */}
      {figure.map((f) => (
        <g key={f.id} className={stili.figura} transform={`translate(0 ${f.dy})`}>
          <circle cx={f.x} cy={142} r={4} />
          <path d={`M${f.x - 5} 162 L${f.x - 4} 149 Q${f.x} 146 ${f.x + 4} 149 L${f.x + 5} 162 Z`} />
          {f.dy === 0 && (
            <text className={stili.piccolo} x={f.x} y={172} textAnchor="middle">
              {f.sigla}
            </text>
          )}
        </g>
      ))}

    </svg>
  );
}
