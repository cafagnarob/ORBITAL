/**
 * ============================================================================
 * FinestraEvento.tsx — La carta evento: il Capitano deve decidere
 * ============================================================================
 *
 * Riferimento: la carta "EVENTO 03 · SEGNALE SCONOSCIUTO" del prototipo
 * Missione di Roberto, e DESIGN.md §8 (stato DECISIONE).
 *
 * Compare sopra la schermata quando lo stato di gioco è DECISIONE.
 * Il Capitano SELEZIONA una scelta e poi CONFERMA (due passi, come nel
 * prototipo: SELEZIONA ▲▼ · CONFERMA ▶), così un clic distratto non
 * decide il destino della missione.
 *
 * RESET DELLA SELEZIONE CON LA PROP `key`
 * La selezione è stato locale (useState). Quando arriva un evento NUOVO,
 * deve ripartire da capo. Invece di un useEffect che "azzera quando cambia
 * l'evento", diamo al componente interno `key={evento.id}`: per React un
 * componente con una key diversa è un componente NUOVO, quindi il suo stato
 * riparte dal valore iniziale. Zero sincronizzazioni manuali.
 *
 * Il costo mostrato accanto a ogni scelta è DERIVATO dagli effetti
 * (descriviCosto): non esiste un testo del costo scritto a mano che possa
 * andare fuori sincrono con ciò che la scelta fa davvero.
 * Le scoperte che una scelta produce NON vengono mostrate: sarebbe uno spoiler.
 * ============================================================================
 */

import { useId, useState } from "react";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { CATALOGO_EVENTI } from "../../content/eventi";
import { formattaTempo } from "../../engine/clock";
import { verificaScelta } from "../../engine/mission";
import { conNomi } from "../../engine/storia/attori";
import type { DefinizioneEvento, StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import { descriviCosto, descriviRequisiti, etichetta } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./FinestraEvento.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

export function FinestraEvento({ stato, dispatch }: Props) {
  const attesa = stato.eventi.inAttesa;
  const evento = attesa ? CATALOGO_EVENTI[attesa.id] : undefined;
  if (!evento) return null;
  return <SchedaEvento key={evento.id} evento={evento} stato={stato} dispatch={dispatch} />;
}

function SchedaEvento({ evento, stato, dispatch }: Props & { evento: DefinizioneEvento }) {
  const idTitolo = useId();
  const scelte = evento.scelte.map((scelta) => ({
    scelta,
    disponibile: verificaScelta(stato, CONTESTO_GIOCO, scelta.id) === null,
  }));
  const [selezionata, setSelezionata] = useState(scelte.find((s) => s.disponibile)?.scelta.id ?? null);

  // {P} e {S} diventano i nomi di chi vive l'evento (storia emergente, v3.0).
  const attori = { protagonista: stato.eventi.inAttesa?.protagonista ?? null, secondo: stato.eventi.inAttesa?.secondo ?? null };
  const nomi = (testo: string) => conNomi(stato, testo, attori);

  // Numero progressivo dell'evento nella missione, es. "EVENTO 03".
  const numero = String(stato.eventi.accaduti.length + 1).padStart(2, "0");

  return (
    <div className={stili.sfondo}>
      <div className={stili.carta} role="dialog" aria-modal="true" aria-labelledby={idTitolo}>
        <header className={stili.barra}>
          <span aria-hidden="true">⚠</span> EVENTO {numero} · PRIORITÀ {evento.priorita}
        </header>

        <div className={stili.corpo}>
          <div className={stili.intestazione}>
            <h2 id={idTitolo} className={stili.titolo}>
              {nomi(evento.titolo)}
            </h2>
            <span className={stili.quando}>{formattaTempo(stato.tempo)}</span>
          </div>

          <blockquote className={evento.fonte === "VALE" ? stili.vale : stili.sistema}>
            {evento.fonte === "VALE" && <span className={stili.occhio} aria-hidden="true" />}
            <p>{evento.fonte === "VALE" ? `“${nomi(evento.testo)}”` : nomi(evento.testo)}</p>
          </blockquote>

          <ul className={stili.scelte} aria-label="Scelte disponibili">
            {scelte.map(({ scelta, disponibile }) => {
              const attiva = scelta.id === selezionata;
              const nota = disponibile ? descriviCosto(scelta.effetti) : descriviRequisiti(scelta.requisiti);
              return (
                <li key={scelta.id}>
                  <button
                    type="button"
                    className={`${stili.scelta} ${attiva ? stili.attiva : ""}`}
                    aria-pressed={attiva}
                    disabled={!disponibile}
                    autoFocus={attiva}
                    onClick={() => setSelezionata(scelta.id)}
                  >
                    <span className={stili.cursore} aria-hidden="true">
                      {attiva ? "▶" : ""}
                    </span>
                    <span className={stili.etichetta}>{etichetta(nomi(scelta.etichetta))}</span>
                    <span className={stili.nota}>{nota}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <footer className={stili.piede}>
          <span className={stili.aiuto}>SELEZIONA · CONFERMA</span>
          <Pulsante
            variante="primario"
            disabled={selezionata === null}
            onClick={() => selezionata !== null && dispatch({ tipo: "RISOLVI_EVENTO", idScelta: selezionata })}
          >
            Conferma ▶
          </Pulsante>
        </footer>
      </div>
    </div>
  );
}
