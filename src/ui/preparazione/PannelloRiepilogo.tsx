/**
 * ============================================================================
 * PannelloRiepilogo.tsx — Il conto della Preparazione: si può partire?
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.1, §6, §14.4 (fattibilità).
 *
 * DISPOSIZIONE (v3.7.4) — blocchi in ordine di importanza:
 *   1. FATTIBILITÀ grande + la frase di V.A.L.E.
 *   2. CREW: i 4 posti, pieni (nome, ruolo) o vuoti
 *   3. CARICO: barra e ripartizione
 *   4. SCORTE e ENERGIA: piccole schede "valore grande + nota"
 *   5. (v3.9) i PROBLEMI non sono più qui: c'è il pop-up WARNING / DANGER
 *      sulla mappa della nave (AvvisoPreparazione.tsx)
 *   6. azioni rapide (indispensabile, svuota)
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
import { PREPARAZIONE_VUOTA } from "../../content/missioneIniziale";
import { CATALOGO_CANDIDATI } from "../../content/candidati";
import { CATALOGO_EQUIPAGGIAMENTO, CATALOGO_MODULI } from "../../content/loadout";
import { attrezzaturaIndispensabile, giorniScorteConsigliati, indispensabileMancante } from "../../engine/preparazione";
import { FRASI_FATTIBILITA } from "../../content/vale";
import type { Riepilogo } from "../../engine/preparazione";
import type { CataloghiPreparazione, Fattibilita, Preparazione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Icona } from "../components/icone/Icona";
import type { TipoIcona } from "../components/icone/disegni";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { conSegno, etichetta, tonoFattibilita, type Tono } from "../format";
import type { DispatchPreparazione } from "../usePreparazione";
import stili from "./PannelloRiepilogo.module.css";

interface Props {
  prep: Preparazione;
  riepilogo: Riepilogo;
  fattibilita: Fattibilita;
  dispatch: DispatchPreparazione;
  /** I cataloghi di questa partita (v3.8: dipendono dalla missione del seed). */
  cataloghi: CataloghiPreparazione;
  /** «Carica a caso» (v3.9): lo gestisce la schermata, che conosce seed e candidati. */
  onCaricaCaso: () => void;
}

/** Una piccola scheda: icona ed etichetta, valore grande, nota. Il tono colora il valore. */
function Dato({
  nome,
  valore,
  nota,
  tono = "normale",
  icona,
}: {
  nome: string;
  valore: string | number;
  nota?: string;
  tono?: Tono;
  icona?: TipoIcona;
}) {
  return (
    <div className={stili.dato}>
      <dt>
        {icona && <Icona tipo={icona} />} {nome}
      </dt>
      <dd className={stili[tono]}>{valore}</dd>
      {nota && <dd className={stili.nota}>{nota}</dd>}
    </div>
  );
}

export function PannelloRiepilogo({ prep, riepilogo: r, fattibilita, dispatch, cataloghi, onCaricaCaso }: Props) {
  // L'attrezzatura indispensabile alla missione, e quanta ne manca (v3.7;
  // v3.8: quella della scaletta della missione estratta dal seed).
  const indispensabile = attrezzaturaIndispensabile(cataloghi.taskObbligatori ?? [], cataloghi);
  const mancanti = indispensabileMancante(prep, indispensabile);
  const p = BALANCE.preparazione;
  const tonoCarico: Tono =
    r.carico.totale > p.caricoMassimo ? "critico" : r.carico.totale > p.caricoMassimo * 0.95 ? "attenzione" : "normale";
  const tono = tonoFattibilita(fattibilita);
  const pochiGiorni = (g: number): Tono => (g < giorniScorteConsigliati(cataloghi) ? "attenzione" : "normale");
  // I 4 posti della crew: pieni nell'ordine di scelta, poi vuoti.
  const posti = Array.from({ length: p.crewRichiesta }, (_, i) => prep.crew[i]);

  return (
    <Finestra titolo="Riepilogo">
      {/* --- 1. Fattibilità ------------------------------------------------- */}
      {/* Sta nel corpo, non nella barra del titolo: sul verde pieno della
          barra l'ambra e il rosso non si leggerebbero. */}
      <section className={stili.blocco}>
        <p className={stili.fattibilita}>
          <span>FATTIBILITÀ</span>
          <strong className={stili[tono]}>{fattibilita}</strong>
        </p>
        <p className={stili.vale}>
          <span className={stili.voce}>◉ V.A.L.E.</span> «{FRASI_FATTIBILITA[fattibilita]}»
        </p>
      </section>

      {/* --- 2. Crew -------------------------------------------------------- */}
      <section className={stili.blocco}>
        <h3 className={stili.sottotitolo}>
          CREW{" "}
          <span>
            {prep.crew.length}/{p.crewRichiesta}
          </span>
        </h3>
        <ol className={stili.posti}>
          {posti.map((id, i) => {
            const m = id ? CATALOGO_CANDIDATI[id] : undefined;
            return (
              <li key={i} className={m ? stili.pieno : stili.vuoto}>
                {m ? (
                  <>
                    <strong>{m.nome}</strong> <span>{etichetta(m.ruolo)}</span>
                  </>
                ) : (
                  "— posto libero —"
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* --- 3. Carico ------------------------------------------------------ */}
      <section className={stili.blocco}>
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
        <dl className={stili.ripartizione}>
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
      </section>

      {/* --- 4. Scorte ed energia ------------------------------------------- */}
      <section className={stili.blocco}>
        <h3 className={stili.sottotitolo}>SCORTE</h3>
        <dl className={stili.dati}>
          <Dato nome="CIBO" icona="cibo" valore={r.risorse.cibo} nota={`≈ ${r.giorniCibo} giorni`} tono={pochiGiorni(r.giorniCibo)} />
          <Dato nome="ACQUA" icona="acqua" valore={r.risorse.acqua} nota={`≈ ${r.giorniAcqua} giorni`} tono={pochiGiorni(r.giorniAcqua)} />
          <Dato nome="OSSIGENO" icona="ossigeno" valore={r.risorse.ossigeno} nota={`+${r.parametri.produzioneOssigeno} al giorno`} />
          <Dato
            nome="CARBURANTE" icona="carburante"
            valore={r.risorse.carburante}
            nota={`operativo ${r.carburanteOperativo} · riserva ${p.riservaRientro}`}
            tono={r.carburanteOperativo <= 0 ? "attenzione" : "normale"}
          />
        </dl>
        <h3 className={stili.sottotitolo}>ENERGIA</h3>
        <dl className={stili.dati}>
          <Dato
            nome="AL GIORNO" icona="energia"
            valore={conSegno(r.bilancioEnergia)}
            nota={`${r.parametri.generazioneEnergia} prodotta − ${r.parametri.consumoEnergia} usata`}
            tono={r.bilancioEnergia < 0 ? "critico" : "normale"}
          />
          <Dato nome="BATTERIA" icona="batteria" valore={r.parametri.capacitaBatteria} nota="capacità" />
          <Dato nome="RIPOSO" valore={`−${r.parametri.recuperoFatica}`} nota="fatica a notte" />
          {r.parametri.integritaDati > 0 && <Dato nome="DATI" valore={conSegno(r.parametri.integritaDati)} nota="integrità" />}
        </dl>
      </section>

      {/* --- 5. Problemi: dalla v3.9 non più qui. Stanno nel pop-up WARNING /
          DANGER sulla mappa della nave (AvvisoPreparazione.tsx). --- */}

      {/* --- 6. Azioni rapide ----------------------------------------------- */}
      {/* v3.7: «Carica l'indispensabile» o ricominciare da zero.
          v3.9: «Carica a caso» riempie tutta la nave rispettando le regole
          (engine/preparazione/casuale.ts): si può partire subito. */}
      <div className={stili.azioniRapide}>
        <Pulsante
          piccolo
          variante={mancanti.length > 0 ? "primario" : "secondario"}
          disabled={mancanti.length === 0}
          onClick={() => dispatch({ tipo: "AGGIUNGI_INDISPENSABILE", ...indispensabile })}
        >
          {mancanti.length > 0 ? "Carica l'indispensabile" : "Indispensabile a bordo ✓"}
        </Pulsante>
        <Pulsante piccolo onClick={onCaricaCaso} title="Indispensabile + crew, moduli, attrezzatura e scorte a caso, nel rispetto delle regole">
          Carica a caso ⚄
        </Pulsante>
        <Pulsante piccolo variante="pericolo" onClick={() => dispatch({ tipo: "CARICA", preparazione: PREPARAZIONE_VUOTA })}>
          Svuota la nave
        </Pulsante>
      </div>
      {mancanti.length > 0 && (
        <p className={stili.notaIndispensabile}>
          Indispensabile per la scaletta:{" "}
          {mancanti.map((id) => CATALOGO_EQUIPAGGIAMENTO[id]?.nome ?? CATALOGO_MODULI[id]?.nome ?? id).join(", ")}. Crew e scorte le scegli
          tu.
        </p>
      )}
    </Finestra>
  );
}
