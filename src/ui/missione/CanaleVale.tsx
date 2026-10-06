/**
 * ============================================================================
 * CanaleVale.tsx — Il registro della missione e la voce di V.A.L.E.
 * ============================================================================
 *
 * Mostra tutte le voci di log in ordine cronologico. Le voci di V.A.L.E.
 * sono in ciano (l'unico posto in cui il ciano compare); i log di sistema
 * sono righe tecniche; le voci della crew sono marcate CREW.
 *
 * TRE MODI DI "DUBITARE" (Fase 3)
 *   ◇ SEGNALA   → su ogni riga: annotazione del Capitano; i codici nascosti
 *                 finiscono tra i frammenti del Terminale SVC-07.
 *   CONTESTA    → solo sulle frasi di V.A.L.E.: apre una contestazione che
 *                 si risolve con il task "Verifica dei dati grezzi".
 *                 Lo stato (contestata / confermata / smentita) resta visibile.
 *   DOMANDE     → in fondo: STATO · PERCHÉ? · DIRETTIVA? (niente testo libero).
 * REGOLA DEL DESIGN: i codici non sono mai evidenziati e TUTTE le righe si
 * segnalano allo stesso modo; tutte le frasi di V.A.L.E. si possono contestare.
 * L'interfaccia non tradisce mai quali righe "contano".
 *
 * SCORRIMENTO AUTOMATICO SENZA useEffect
 * Il contenitore ha `flex-direction: column-reverse` e riceve le voci al
 * contrario: a schermo l'ordine è cronologico, ma il punto di partenza dello
 * scorrimento è IN FONDO, quindi l'ultima voce resta visibile da sola.
 * ============================================================================
 */

import { CONTESTO_GIOCO } from "../../content/contesto";
import { useState, type FormEvent } from "react";
import type { DomandaVale, EsitoContestazione, StatoMissione, VoceLog } from "../../engine/types";
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
 * I sei pulsanti-domanda del mockup. ACCUSA, MINACCIA e SALUTO non hanno
 * pulsante: si raggiungono solo scrivendo nel campo di testo.
 */
const PULSANTI_DOMANDA: [DomandaVale, string][] = [
  ["STATO", "Stato"],
  ["PERCHE", "Perché?"],
  ["DANNI", "Danni"],
  ["EQUIPAGGIO", "Equipaggio"],
  ["TRACCE_BIO", "Tracce bio"],
  ["DIRETTIVA", "Direttiva?"],
];

/**
 * Il campo "Scrivi a V.A.L.E." (v3.0). Il testo è stato dell'INTERFACCIA
 * (useState) finché non si preme INVIA: solo allora diventa un'azione di
 * gioco (SCRIVI_VALE) e il campo si svuota. Nessun useEffect.
 */
function CampoVale({ dispatch }: { dispatch: Dispatch }) {
  const [testo, setTesto] = useState("");
  function invia(evento: FormEvent) {
    evento.preventDefault(); // niente ricarica della pagina
    if (testo.trim() === "") return;
    dispatch({ tipo: "SCRIVI_VALE", testo });
    setTesto("");
  }
  return (
    <form className={stili.campo} onSubmit={invia}>
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
  if (voce.fonte === "VALE") {
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
  return (
    <li className={voce.fonte === "CREW" ? stili.crew : stili.sistema}>
      <time className={stili.ora}>{formattaOra(voce.tempo)}</time>
      <span className={stili.fonte}>{voce.fonte}</span>
      <span>{voce.testo}</span>
      <Segno {...props} />
    </li>
  );
}

export function CanaleVale({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  // Coppie [voce, indice originale], al contrario. (.reverse() sull'array
  // dello stato lo modificherebbe: prima si copia.)
  const vociInverse = stato.log.map((voce, indice) => ({ voce, indice })).reverse();
  const segnalate = new Set(stato.terminale.segnalate);
  const contestazioni = new Map(stato.vale.contestazioni.map((c) => [c.indice, c.stato]));

  return (
    <Finestra variante="console" titolo="V.A.L.E. // Canale diretto con il Capitano" className={stili.finestra}>
      <div className={stili.canale}>
        <ol className={stili.registro} aria-live="polite" aria-label="Registro della missione">
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
              title={CONTESTO_GIOCO.testiVale.domande[d].etichetta}
              onClick={() => dispatch({ tipo: "INTERROGA_VALE", domanda: d })}
            >
              {etichetta}
            </Pulsante>
          ))}
        </div>
        <CampoVale dispatch={dispatch} />
      </div>
    </Finestra>
  );
}
