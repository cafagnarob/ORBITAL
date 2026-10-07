/**
 * ============================================================================
 * PannelloNave.tsx — Scafo e 8 sistemi core come strumenti di bordo
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §5, §11. Grafica v3.7.1: radar e quadranti
 * a lancetta (riferimenti di Roberto), al posto delle barre.
 *
 * Il pannello è solo "montaggio": i disegni stanno in strumenti/.
 *   - a sinistra il QUADRANTE dello scafo (radar);
 *   - a destra 8 INDICATORI a lancetta, uno per sistema (griglia 4×2);
 *   - in fondo il LOADOUT, chiuso in un <details> (si apre con un clic,
 *     senza useState: è un elemento HTML nativo).
 * Fasce e toni si calcolano (engine/nave/integrita.ts, format.ts).
 * ============================================================================
 */

import { CATALOGO_EQUIPAGGIAMENTO, CATALOGO_MODULI } from "../../content/loadout";
import { fasciaScafo, fasciaSistema } from "../../engine/nave/integrita";
import { SISTEMI_CORE, type SistemaCore, type StatoMissione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { etichetta, tonoScafo, tonoSistema } from "../format";
import { IndicatoreSistema } from "./strumenti/IndicatoreSistema";
import { QuadranteScafo } from "./strumenti/QuadranteScafo";
import stili from "./PannelloNave.module.css";

/** Sigle corte per stare sotto un quadrante piccolo. */
const SIGLE: Record<SistemaCore, string> = {
  SUPPORTO_VITALE: "VITA",
  POTENZA: "POT",
  PROPULSIONE: "PROP",
  NAVIGAZIONE: "NAV",
  COMUNICAZIONI: "COM",
  SCIENZA: "SCI",
  MEDICINA: "MED",
  OPERAZIONI_ESTERNE: "EVA",
};

export function PannelloNave({ stato }: { stato: StatoMissione }) {
  const { nave } = stato;
  const fScafo = fasciaScafo(nave.scafo);
  const guasti = SISTEMI_CORE.filter((s) => tonoSistema(fasciaSistema(nave.sistemi[s])) !== "normale").length;

  return (
    <Finestra titolo="Nave · Sistemi" destra={guasti > 0 ? `${guasti} ▲` : "ORB-1"}>
      <div className={stili.contenitore}>
        <div className={stili.strumenti}>
          <QuadranteScafo valore={nave.scafo} fascia={fScafo} tono={tonoScafo(fScafo)} />
          <ul className={stili.indicatori}>
            {SISTEMI_CORE.map((s) => {
              const fascia = fasciaSistema(nave.sistemi[s]);
              return (
                <IndicatoreSistema
                  key={s}
                  sigla={SIGLE[s]}
                  nome={etichetta(s)}
                  valore={nave.sistemi[s]}
                  fascia={fascia}
                  tono={tonoSistema(fascia)}
                />
              );
            })}
          </ul>
        </div>
      </div>

      <details className={stili.loadout}>
        <summary>
          LOADOUT · {nave.moduli.length} MODULI · {nave.equipaggiamento.length} OGGETTI
        </summary>
        <ul className={stili.chip} aria-label="Moduli installati">
          {nave.moduli.map((m) => (
            <li key={m} className={stili.modulo}>
              {CATALOGO_MODULI[m]?.nome ?? etichetta(m)}
            </li>
          ))}
        </ul>
        <ul className={stili.chip} aria-label="Equipaggiamento a bordo">
          {nave.equipaggiamento.map((e) => (
            <li key={e}>{CATALOGO_EQUIPAGGIAMENTO[e]?.nome ?? etichetta(e)}</li>
          ))}
        </ul>
      </details>
    </Finestra>
  );
}
