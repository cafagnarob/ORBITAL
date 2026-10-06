/**
 * ============================================================================
 * PannelloRiepilogo.tsx — Il conto della Preparazione: si può partire?
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.1, §6, §14.4 (fattibilità).
 *
 * Mostra SOLO valori calcolati (riepilogo, problemi, fattibilità arrivano
 * già pronti da usePreparazione): il pannello non fa conti, li impagina.
 *
 * V.A.L.E. E LA FATTIBILITÀ
 * Per POSSIBILE e RISCHIOSA V.A.L.E. dice la STESSA frase
 * (content/vale.ts → FRASI_FATTIBILITA):
 *   «La missione è operativamente possibile.»
 * È voluto (§14.4): «Possibile non significa prudente». I rischi sono
 * elencati sotto, ma V.A.L.E. non li sottolinea. Il giocatore impara presto
 * a leggere le righe che V.A.L.E. non legge ad alta voce.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { PREPARAZIONE_DI_RIFERIMENTO } from "../../content/missioneIniziale";
import { FRASI_FATTIBILITA } from "../../content/vale";
import type { Riepilogo } from "../../engine/preparazione";
import type { Fattibilita, Preparazione, ProblemaPreparazione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { conSegno, tonoFattibilita, type Tono } from "../format";
import type { DispatchPreparazione } from "../usePreparazione";
import stili from "./PannelloRiepilogo.module.css";

interface Props {
  prep: Preparazione;
  riepilogo: Riepilogo;
  problemi: ProblemaPreparazione[];
  fattibilita: Fattibilita;
  dispatch: DispatchPreparazione;
}

export function PannelloRiepilogo({ prep, riepilogo: r, problemi, fattibilita, dispatch }: Props) {
  const p = BALANCE.preparazione;
  const tonoCarico: Tono =
    r.carico.totale > p.caricoMassimo ? "critico" : r.carico.totale > p.caricoMassimo * 0.95 ? "attenzione" : "normale";
  const tono = tonoFattibilita(fattibilita);

  return (
    <Finestra titolo="Riepilogo">
      {/* La fattibilità sta nel corpo, non nella barra del titolo: sul verde
          pieno della barra l'ambra e il rosso non si leggerebbero. */}
      <p className={stili.fattibilita}>
        <span>FATTIBILITÀ</span>
        <strong className={stili[tono]}>{fattibilita}</strong>
      </p>

      {/* --- Carico ---------------------------------------------------------- */}
      <div className={stili.carico}>
        <span>CARICO</span>
        <span className={stili[tonoCarico]}>
          {r.carico.totale} / {p.caricoMassimo} KG
        </span>
        <BarraSegmentata
          valore={Math.min(r.carico.totale, p.caricoMassimo)}
          massimo={p.caricoMassimo}
          etichetta="Carico operativo"
          tono={tonoCarico}
        />
      </div>
      <dl className={stili.dettaglio}>
        <div>
          <dt>Crew</dt>
          <dd>{r.carico.crew} kg</dd>
        </div>
        <div>
          <dt>Moduli</dt>
          <dd>{r.carico.moduli} kg</dd>
        </div>
        <div>
          <dt>Equipagg.</dt>
          <dd>{r.carico.equipaggiamento} kg</dd>
        </div>
        <div>
          <dt>Stiva</dt>
          <dd>{r.carico.scorte} kg</dd>
        </div>
      </dl>

      {/* --- La nave in missione -------------------------------------------- */}
      <h3 className={stili.sottotitolo}>IN MISSIONE</h3>
      <dl className={stili.valori}>
        <div>
          <dt>CREW</dt>
          <dd>
            {prep.crew.length}/{p.crewRichiesta}
          </dd>
        </div>
        <div>
          <dt>ENERGIA AL GIORNO</dt>
          <dd className={r.bilancioEnergia < 0 ? stili.critico : ""}>
            {conSegno(r.bilancioEnergia)}
            <small>
              {" "}
              ({r.parametri.generazioneEnergia} − {r.parametri.consumoEnergia})
            </small>
          </dd>
        </div>
        <div>
          <dt>BATTERIA</dt>
          <dd>{r.parametri.capacitaBatteria}</dd>
        </div>
        <div>
          <dt>CIBO</dt>
          <dd className={r.giorniCibo < p.giorniScorteConsigliati ? stili.attenzione : ""}>
            {r.risorse.cibo} <small>≈ {r.giorniCibo} giorni</small>
          </dd>
        </div>
        <div>
          <dt>ACQUA</dt>
          <dd className={r.giorniAcqua < p.giorniScorteConsigliati ? stili.attenzione : ""}>
            {r.risorse.acqua} <small>≈ {r.giorniAcqua} giorni</small>
          </dd>
        </div>
        <div>
          <dt>OSSIGENO</dt>
          <dd>
            {r.risorse.ossigeno} <small>+{r.parametri.produzioneOssigeno}/g</small>
          </dd>
        </div>
        <div>
          <dt>CARBURANTE</dt>
          <dd className={r.carburanteOperativo <= 0 ? stili.attenzione : ""}>
            {r.risorse.carburante} <small>operativo {r.carburanteOperativo}</small>
          </dd>
        </div>
        <div>
          <dt>RIPOSO NOTTURNO</dt>
          <dd>−{r.parametri.recuperoFatica} fatica</dd>
        </div>
        {r.parametri.integritaDati > 0 && (
          <div>
            <dt>INTEGRITÀ DATI</dt>
            <dd>{conSegno(r.parametri.integritaDati)}</dd>
          </div>
        )}
      </dl>

      {/* --- V.A.L.E. e problemi --------------------------------------------- */}
      <p className={stili.vale}>
        <span className={stili.voce}>◉ V.A.L.E.</span> «{FRASI_FATTIBILITA[fattibilita]}»
      </p>

      {problemi.length > 0 && (
        <ul className={stili.problemi}>
          {problemi.map((pr) => (
            <li key={pr.testo} className={pr.gravita === "BLOCCANTE" ? stili.critico : stili.attenzione}>
              <span aria-hidden="true">{pr.gravita === "BLOCCANTE" ? "▲" : "△"}</span> {pr.testo}
            </li>
          ))}
        </ul>
      )}

      <Pulsante
        piccolo
        className={stili.ripristina}
        onClick={() => dispatch({ tipo: "CARICA", preparazione: PREPARAZIONE_DI_RIFERIMENTO })}
      >
        Loadout di riferimento
      </Pulsante>
    </Finestra>
  );
}
