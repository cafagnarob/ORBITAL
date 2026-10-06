/**
 * ============================================================================
 * PannelloNave.tsx — Scafo, 8 sistemi core e loadout a bordo
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §5, §11.
 * L'integrità è un numero nello stato; la fascia ("DEGRADATO") e il colore
 * si calcolano con engine/nave/integrita.ts e format.ts.
 * ============================================================================
 */

import { fasciaScafo, fasciaSistema } from "../../engine/nave/integrita";
import { SISTEMI_CORE, type StatoMissione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Finestra } from "../components/Finestra";
import { etichetta, tonoScafo, tonoSistema } from "../format";
import stili from "./PannelloNave.module.css";

export function PannelloNave({ stato }: { stato: StatoMissione }) {
  const { nave } = stato;
  const fScafo = fasciaScafo(nave.scafo);

  return (
    <Finestra titolo="Nave · Sistemi" destra="ORB-1">
      <div className={stili.scafo}>
        <span>SCAFO</span>
        <span className={stili[tonoScafo(fScafo)]}>
          {nave.scafo} · {fScafo}
        </span>
        <BarraSegmentata valore={nave.scafo} massimo={100} etichetta="Integrità dello scafo" tono={tonoScafo(fScafo)} />
      </div>

      <ul className={stili.sistemi}>
        {SISTEMI_CORE.map((s) => {
          const valore = nave.sistemi[s];
          const fascia = fasciaSistema(valore);
          const tono = tonoSistema(fascia);
          return (
            <li key={s}>
              <span className={stili.nome}>{etichetta(s)}</span>
              <span className={`${stili.valore} ${stili[tono]}`}>
                {valore} · {etichetta(fascia)}
              </span>
              <BarraSegmentata valore={valore} massimo={100} etichetta={`Integrità ${etichetta(s)}`} tono={tono} segmenti={12} />
            </li>
          );
        })}
      </ul>

      <h3 className={stili.sottotitolo}>LOADOUT</h3>
      <ul className={stili.chip} aria-label="Moduli installati">
        {nave.moduli.map((m) => (
          <li key={m} className={stili.modulo}>
            {etichetta(m)}
          </li>
        ))}
      </ul>
      <ul className={stili.chip} aria-label="Equipaggiamento a bordo">
        {nave.equipaggiamento.map((e) => (
          <li key={e}>{etichetta(e)}</li>
        ))}
      </ul>
    </Finestra>
  );
}
