/**
 * ============================================================================
 * PannelloRisorse.tsx — Scorte, energia, carburante
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6 — tre risorse consumabili.
 * Niente barre separate per cibo, acqua e ossigeno: le scorte sono unificate
 * e l'ossigeno è una condizione del Supporto Vitale (pannello Nave).
 *
 * Per le scorte mostriamo anche "quanti giorni bastano": è la domanda che
 * il giocatore si fa davvero, e la calcoliamo con gli stessi numeri del
 * rapporto serale (balance.ts).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { StatoMissione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Finestra } from "../components/Finestra";
import type { Tono } from "../format";
import stili from "./PannelloRisorse.module.css";

/** Giorni di autonomia sotto cui le scorte diventano un avviso. */
const GIORNI_ATTENZIONE = 5;
const GIORNI_CRITICI = 2;

export function PannelloRisorse({ stato }: { stato: StatoMissione }) {
  const g = BALANCE.giornata;
  const aBordo = Object.values(stato.crew).filter((m) => m.stato !== "MORTO" && m.stato !== "DISPERSO").length;
  const consumoGiornaliero = aBordo * g.scortePerMembro;
  const giorni = consumoGiornaliero > 0 ? Math.floor(stato.risorse.scorte / consumoGiornaliero) : Infinity;
  const tonoScorte: Tono = giorni <= GIORNI_CRITICI ? "critico" : giorni <= GIORNI_ATTENZIONE ? "attenzione" : "normale";

  return (
    <Finestra titolo="Risorse">
      <dl className={stili.lista}>
        <div className={stili.voce}>
          <dt>SCORTE</dt>
          <dd>
            {stato.risorse.scorte} <span className={stili.nota}>≈ {giorni} giorni</span>
          </dd>
          <BarraSegmentata valore={Math.min(giorni, 15)} massimo={15} etichetta="Giorni di scorte" tono={tonoScorte} />
        </div>

        <div className={stili.voce}>
          <dt>ENERGIA</dt>
          <dd>
            {stato.risorse.energia} <span className={stili.nota}>/ {g.capacitaBatteria}</span>
          </dd>
          <BarraSegmentata valore={stato.risorse.energia} massimo={g.capacitaBatteria} etichetta="Carica della batteria" />
        </div>

        <div className={stili.voce}>
          <dt>CARBURANTE</dt>
          <dd>{stato.risorse.carburante}</dd>
        </div>
      </dl>
    </Finestra>
  );
}
