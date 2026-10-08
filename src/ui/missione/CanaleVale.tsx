/**
 * ============================================================================
 * CanaleVale.tsx — Il dialogo tra il Capitano e V.A.L.E.
 * ============================================================================
 *
 * v3.9: il canale è SOLO la conversazione. Le battute del Capitano (a
 * destra, con il tono) e quelle di V.A.L.E. (in ciano, l'unico posto in cui
 * il ciano compare). Tutti i log tecnici, con i codici, stanno nella
 * finestra del terminale (TerminaleLog.tsx).
 *
 * IL TONO (v3.9)
 * In alto cinque pulsanti: CALMO · AMICHEVOLE · FERMO · ARRABBIATO ·
 * SOSPETTOSO. Il tono resta finché non lo cambi (stato.vale.tono, azione
 * IMPOSTA_TONO) e cambia le tue frasi, le risposte di V.A.L.E. e alcuni
 * numeri (engine/vale/domande.ts). La descrizione del tono attivo è sotto.
 *
 * DUE MODI DI "DUBITARE" sulle frasi di V.A.L.E.
 *   ◇ SEGNALA   → annotazione del Capitano; i codici nascosti finiscono tra
 *                 i frammenti del Terminale SVC-07 (anche dal terminale log).
 *   CONTESTA    → apre una contestazione che si risolve con il task
 *                 "Verifica dei dati grezzi". Lo stato resta visibile.
 *
 * SCORRIMENTO AUTOMATICO SENZA useEffect
 * Il contenitore ha `flex-direction: column-reverse` e riceve le voci al
 * contrario: a schermo l'ordine è cronologico, ma il punto di partenza dello
 * scorrimento è IN FONDO, quindi l'ultima voce resta visibile da sola.
 * ============================================================================
 */

import { CONTESTO_GIOCO } from "../../content/contesto";
import { useState, type FormEvent } from "react";
import {
  TONI_CAPITANO,
  type DomandaVale,
  type EsitoContestazione,
  type StatoMissione,
  type TonoCapitano,
  type VoceLog,
} from "../../engine/types";
import { suona } from "../audio";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { formattaOra } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./CanaleVale.module.css";

/** Testo e colore dello stato di una contestazione. */
const ETICHETTE_CONTESTAZIONE: Record<EsitoContestazione, { testo: string; classe: string }> = {
  APERTA: { testo: "CONTESTATA", classe: "aperta" },
  CONFERMATA: { testo: "CONFERMATA", classe: "confermata" },
  SMENTITA: { testo: "SMENTITA", classe: "smentita" },
};

/**
 * I pulsanti-domanda (v3.9: dieci). ACCUSA, MINACCIA, SALUTO, PASSATO,
 * SCUSA e GRAZIE non hanno pulsante: si raggiungono solo scrivendo.
 */
const PULSANTI_DOMANDA: [DomandaVale, string][] = [
  ["STATO", "Stato"],
  ["DANNI", "Danni"],
  ["EQUIPAGGIO", "Equipaggio"],
  ["RISORSE", "Scorte"],
  ["CONSIGLIO", "Consiglio"],
  ["MISSIONE", "Missione"],
  ["SEGNALE", "Segnale"],
  ["PERCHE", "Perché?"],
  ["TRACCE_BIO", "Tracce bio"],
  ["DIRETTIVA", "Direttiva?"],
];

/**
 * La scelta del tono: un gruppo di pulsanti "a interruttore" (aria-pressed).
 * Sotto, in una riga, cosa cambia il tono attivo.
 */
function SceltaTono({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  const testi = CONTESTO_GIOCO.testiVale.toni;
  const attivo = stato.vale.tono;
  return (
    <div className={stili.toni}>
      <div className={stili.tonoPulsanti} role="group" aria-label="Tono del Capitano">
        <span className={stili.tonoEtichetta}>TONO</span>
        {TONI_CAPITANO.map((t) => (
          <button
            key={t}
            type="button"
            className={`${stili.tono} ${stili[`tono_${t}`] ?? ""}`}
            aria-pressed={t === attivo}
            title={testi[t].descrizione}
            onClick={() => {
              if (t === attivo) return;
              suona("CLIC");
              dispatch({ tipo: "IMPOSTA_TONO", tono: t });
            }}
          >
            {testi[t].nome}
          </button>
        ))}
      </div>
      <p className={stili.tonoDescrizione}>{testi[attivo].descrizione}</p>
    </div>
  );
}

/**
 * Il campo "Scrivi a V.A.L.E." (v3.0). Il testo è stato dell'INTERFACCIA
 * (useState) finché non si preme INVIA: solo allora diventa un'azione di
 * gioco (SCRIVI_VALE) e il campo si svuota. Nessun useEffect.
 */
function CampoVale({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  const [testo, setTesto] = useState("");
  function invia(evento: FormEvent) {
    evento.preventDefault(); // niente ricarica della pagina
    if (testo.trim() === "") return;
    dispatch({ tipo: "SCRIVI_VALE", testo });
    setTesto("");
  }
  return (
    <form className={stili.campo} onSubmit={invia}>
      {/* Il tono in versione compatta (un menu): lo mostra il CSS solo con
          tre colonne, dove i pulsanti dei toni non ci stanno in altezza. */}
      <select
        className={stili.tonoCompatto}
        aria-label="Tono del Capitano"
        value={stato.vale.tono}
        onChange={(e) => dispatch({ tipo: "IMPOSTA_TONO", tono: e.target.value as TonoCapitano })}
      >
        {TONI_CAPITANO.map((t) => (
          <option key={t} value={t}>
            {CONTESTO_GIOCO.testiVale.toni[t].nome}
          </option>
        ))}
      </select>
      <label className={stili.prompt} htmlFor="scrivi-vale">
        CAP ›
      </label>
      <input
        id="scrivi-vale"
        className={stili.input}
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Scrivi a V.A.L.E.…"
        maxLength={200}
        autoComplete="off"
      />
      <Pulsante type="submit" variante="primario" piccolo disabled={testo.trim() === ""}>
        Invia ▶
      </Pulsante>
    </form>
  );
}

interface VoceProps {
  voce: VoceLog;
  segnalata: boolean;
  onSegnala: () => void;
  contestazione: EsitoContestazione | null;
  onContesta: () => void;
}

function Segno({ voce, segnalata, onSegnala }: Pick<VoceProps, "voce" | "segnalata" | "onSegnala">) {
  return (
    <button
      type="button"
      className={`${stili.segno} ${segnalata ? stili.segnalata : ""}`}
      aria-pressed={segnalata}
      aria-label={`Segnala la riga delle ${formattaOra(voce.tempo)}`}
      onClick={onSegnala}
    >
      {segnalata ? "◆" : "◇"}
    </button>
  );
}

function Voce(props: VoceProps) {
  const { voce, contestazione, onContesta } = props;
  if (voce.fonte === "CAPITANO") {
    const tono = voce.tono ? CONTESTO_GIOCO.testiVale.toni[voce.tono].nome.toUpperCase() : null;
    return (
      <li className={`${stili.capitano} ${voce.tono ? (stili[`tono_${voce.tono}`] ?? "") : ""}`}>
        <span className={stili.mittenteCapitano}>
          CAPITANO · {formattaOra(voce.tempo)}
          {tono && tono !== "CALMO" && <span className={stili.tonoVoce}>{tono}</span>}
        </span>
        <p>{voce.testo}</p>
      </li>
    );
  }
  const etichetta = contestazione ? ETICHETTE_CONTESTAZIONE[contestazione] : null;
  return (
    <li className={stili.vale}>
      <span className={stili.mittente}>
        <span className={stili.occhio} aria-hidden="true" />
        V.A.L.E. · {formattaOra(voce.tempo)}
        {etichetta ? (
          <span className={`${stili.contestazione} ${stili[etichetta.classe]}`}>{etichetta.testo}</span>
        ) : (
          <button type="button" className={stili.contesta} onClick={onContesta}>
            Contesta
          </button>
        )}
        <Segno {...props} />
      </span>
      <p>{voce.testo}</p>
    </li>
  );
}

export function CanaleVale({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  // Solo il dialogo (v3.9): coppie [voce, indice originale], al contrario.
  // L'indice originale serve a segnalare e contestare la voce giusta del log.
  const vociInverse = stato.log
    .map((voce, indice) => ({ voce, indice }))
    .filter(({ voce }) => voce.fonte === "VALE" || voce.fonte === "CAPITANO")
    .reverse();
  const segnalate = new Set(stato.terminale.segnalate);
  const contestazioni = new Map(stato.vale.contestazioni.map((c) => [c.indice, c.stato]));

  return (
    <Finestra variante="console" titolo="V.A.L.E. // Canale diretto con il Capitano" className={stili.finestra}>
      <div className={stili.canale}>
        <SceltaTono stato={stato} dispatch={dispatch} />
        <ol className={stili.registro} aria-live="polite" aria-label="Dialogo con V.A.L.E.">
          {vociInverse.map(({ voce, indice }) => (
            // Il log cresce solo in coda: l'indice originale è una chiave stabile.
            <Voce
              key={indice}
              voce={voce}
              segnalata={segnalate.has(indice)}
              onSegnala={() => dispatch({ tipo: "SEGNALA_VOCE", indice })}
              contestazione={contestazioni.get(indice) ?? null}
              onContesta={() => dispatch({ tipo: "CONTESTA", indice })}
            />
          ))}
        </ol>

        <div className={stili.domande} role="group" aria-label="Domande a V.A.L.E.">
          {PULSANTI_DOMANDA.map(([d, etichetta]) => (
            <Pulsante
              key={d}
              piccolo
              // Il suggerimento è la frase che dirai, nel tono attivo.
              title={CONTESTO_GIOCO.testiVale.domande[d].capitano?.[stato.vale.tono] ?? CONTESTO_GIOCO.testiVale.domande[d].etichetta}
              onClick={() => dispatch({ tipo: "INTERROGA_VALE", domanda: d })}
            >
              {etichetta}
            </Pulsante>
          ))}
        </div>
        <CampoVale stato={stato} dispatch={dispatch} />
      </div>
    </Finestra>
  );
}
