/**
 * ============================================================================
 * StivaScorte.tsx — Le 7 casse della stiva, con quantità − / +
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.1 (risorse), §6.3 (carburante),
 * §11.1 (200 unità di spazio scorte).
 *
 * Ogni riga ha un piccolo "contatore": − e + inviano IMPOSTA_SCORTA con la
 * quantità nuova; il reducer la tiene tra 0 e il massimo. In cima, la barra
 * dello spazio occupato: la stiva è il vincolo che si sente di più quando
 * si vuole partire con tante scorte.
 * ============================================================================
 */

import { LISTA_SCORTE } from "../../content/loadout";
import type { Riepilogo } from "../../engine/preparazione";
import type { Preparazione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import type { DispatchPreparazione } from "../usePreparazione";
import stili from "./StivaScorte.module.css";

interface Props {
  prep: Preparazione;
  riepilogo: Riepilogo;
  dispatch: DispatchPreparazione;
}

export function StivaScorte({ prep, riepilogo, dispatch }: Props) {
  const { occupato, massimo } = riepilogo.spazio;
  const pieno = occupato >= massimo;

  return (
    <div>
      <div className={stili.spazio}>
        <span>SPAZIO</span>
        <span className={occupato > massimo ? stili.critico : ""}>
          {occupato} / {massimo} unità
        </span>
        <BarraSegmentata
          valore={Math.min(occupato, massimo)}
          massimo={massimo}
          etichetta="Spazio scorte occupato"
          tono={occupato > massimo ? "critico" : pieno ? "attenzione" : "normale"}
        />
      </div>

      <ul className={stili.lista}>
        {LISTA_SCORTE.map((s) => {
          const n = prep.scorte[s.id] ?? 0;
          // Il + si spegne se la cassa successiva non entra più in stiva.
          const nonEntra = occupato + s.spazio > massimo;
          return (
            <li key={s.id} className={stili.riga}>
              <div className={stili.info}>
                <span className={stili.nome}>{s.nome}</span>
                <span className={stili.descrizione}>{s.descrizione}</span>
                <span className={stili.dati}>
                  {s.peso} kg · {s.spazio} unità
                  {s.risorsa !== null && (
                    <span className={stili.resa}>
                      {" "}
                      · +{s.quantita} {s.risorsa}
                    </span>
                  )}
                </span>
                {s.inArrivo !== null && <span className={stili.inArrivo}>IN ARRIVO ▸ {s.inArrivo}</span>}
              </div>

              <div className={stili.contatore}>
                <button
                  type="button"
                  aria-label={`Togli una ${s.nome}`}
                  disabled={n === 0}
                  onClick={() => dispatch({ tipo: "IMPOSTA_SCORTA", id: s.id, quantita: n - 1 })}
                >
                  −
                </button>
                <output aria-label={`${s.nome}: quantità`}>
                  {n}
                  <small>/{s.massimo}</small>
                </output>
                <button
                  type="button"
                  aria-label={`Aggiungi una ${s.nome}`}
                  disabled={n >= s.massimo || nonEntra}
                  onClick={() => dispatch({ tipo: "IMPOSTA_SCORTA", id: s.id, quantita: n + 1 })}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
