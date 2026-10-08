/**
 * ============================================================================
 * PannelloRisorse.tsx — Cibo, acqua, ossigeno, energia, carburante
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6 (v3.0: cibo, acqua e ossigeno separati,
 * come nel mockup della Missione).
 *
 * Ogni riga mostra la quantità e la VARIAZIONE prevista al prossimo
 * rapporto serale (es. "−8/g"), calcolata con gli stessi numeri del motore:
 * parametriNave() = balance.ts + moduli installati. Per cibo e acqua anche
 * "quanti giorni bastano", la domanda che il giocatore si fa davvero.
 *
 * L'ossigeno è speciale: il Supporto Vitale ne rigenera una parte ogni
 * sera, in proporzione alla sua integrità. Finché il sistema è sano il
 * bilancio è ±0; se si guasta, la riga diventa rossa e il conto alla
 * rovescia è il problema più urgente della nave.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { CATALOGO_MODULI } from "../../content/loadout";
import { membriABordo } from "../../engine/mission/disponibilita";
import { parametriNave } from "../../engine/nave/parametri";
import type { StatoMissione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Finestra } from "../components/Finestra";
import { Icona } from "../components/icone/Icona";
import type { TipoIcona } from "../components/icone/disegni";
import { conSegno, type Tono } from "../format";
import stili from "./PannelloRisorse.module.css";

/** Giorni di autonomia sotto cui una risorsa diventa un avviso. */
const GIORNI_ATTENZIONE = 5;
const GIORNI_CRITICI = 2;

function tonoGiorni(giorni: number): Tono {
  if (giorni <= GIORNI_CRITICI) return "critico";
  if (giorni <= GIORNI_ATTENZIONE) return "attenzione";
  return "normale";
}

interface Riga {
  nome: string;
  /** L'icona della risorsa, la stessa di tutto il gioco (v3.7.5). */
  icona: TipoIcona;
  valore: number;
  massimo: number;
  delta: number;
  /** Testo dopo il valore, es. "≈ 12 g". */
  nota: string;
  tono: Tono;
}

export function PannelloRisorse({ stato }: { stato: StatoMissione }) {
  const g = BALANCE.giornata;
  const p = parametriNave(stato.nave.moduli, CATALOGO_MODULI);
  const n = membriABordo(stato).length;
  const r = stato.risorse;

  const giorni = (quantita: number, consumo: number) => (consumo > 0 ? Math.floor(quantita / consumo) : 99);
  const consumoCibo = n * p.ciboPerMembro;
  const consumoAcqua = n * p.acquaPerMembro;
  const rigenerato = Math.round((p.produzioneOssigeno * stato.nave.sistemi.SUPPORTO_VITALE) / 100);
  const deltaOssigeno = rigenerato - n * g.ossigenoPerMembro;
  const giorniOssigeno = deltaOssigeno >= 0 ? 99 : giorni(r.ossigeno, -deltaOssigeno);

  const righe: Riga[] = [
    {
      nome: "CIBO",
      icona: "cibo",
      valore: r.cibo,
      massimo: 120,
      delta: -consumoCibo,
      nota: `≈ ${giorni(r.cibo, consumoCibo)} g`,
      tono: tonoGiorni(giorni(r.cibo, consumoCibo)),
    },
    {
      nome: "ACQUA",
      icona: "acqua",
      valore: r.acqua,
      massimo: 120,
      delta: -consumoAcqua,
      nota: `≈ ${giorni(r.acqua, consumoAcqua)} g`,
      tono: tonoGiorni(giorni(r.acqua, consumoAcqua)),
    },
    {
      nome: "OSSIGENO",
      icona: "ossigeno",
      valore: r.ossigeno,
      massimo: g.capacitaOssigeno,
      delta: deltaOssigeno,
      nota: giorniOssigeno >= 99 ? "stabile" : `≈ ${giorniOssigeno} g`,
      tono: tonoGiorni(giorniOssigeno),
    },
    {
      nome: "ENERGIA",
      icona: "energia",
      valore: r.energia,
      massimo: p.capacitaBatteria,
      delta: p.generazioneEnergia - p.consumoEnergia,
      nota: `/ ${p.capacitaBatteria}`,
      tono: r.energia < 20 ? "critico" : r.energia < 50 ? "attenzione" : "normale",
    },
    {
      nome: "CARBURANTE",
      icona: "carburante",
      valore: r.carburante,
      massimo: BALANCE.preparazione.serbatoio + 24,
      delta: 0,
      nota: `riserva ${BALANCE.preparazione.riservaRientro}`,
      tono: r.carburante <= BALANCE.preparazione.riservaRientro ? "attenzione" : "normale",
    },
  ];

  return (
    <Finestra titolo="Risorse" destra="/GIORNO">
      <dl className={stili.lista}>
        {righe.map((riga) => (
          <div key={riga.nome} className={stili.voce}>
            <dt>
              <Icona tipo={riga.icona} /> {riga.nome}
            </dt>
            <dd>
              {riga.valore}{" "}
              <span className={riga.delta < 0 ? stili.calo : stili.nota}>
                {riga.delta === 0 ? "±0" : conSegno(riga.delta)}
              </span>{" "}
              <span className={stili.nota}>{riga.nota}</span>
            </dd>
            <BarraSegmentata
              valore={Math.min(riga.valore, riga.massimo)}
              massimo={riga.massimo}
              etichetta={riga.nome}
              tono={riga.tono}
            />
          </div>
        ))}
      </dl>
    </Finestra>
  );
}
