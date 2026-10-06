/**
 * ============================================================================
 * PannelloPianifica.tsx — Assegnare un task: chi, cosa, con chi
 * ============================================================================
 *
 * Il giocatore sceglie task, responsabile e aiutante facoltativo, e PRIMA
 * di confermare vede la stima: durata, rischio, probabilità degli esiti.
 *
 * STATO LOCALE CON useState (e perché qui va bene)
 * Le tre scelte del modulo sono "bozze" dell'interfaccia: non fanno parte
 * della partita, e non vanno salvate. Per questo stanno in useState del
 * componente, mentre la partita sta nel reducer.
 *
 * VALORI DERIVATI, NON SINCRONIZZATI
 * Il motivo di blocco, l'aiutante "effettivo" e la stima si CALCOLANO a ogni
 * render dalle scelte attuali. Non serve un useEffect che li aggiorni quando
 * cambia una scelta: se si calcola, non si memorizza (la stessa regola dello
 * stato di gioco, applicata a React).
 *
 * La stima usa le stesse funzioni del motore (verificaAssegnazione,
 * valutaTask): ciò che vedi è ciò che il motore farà, con i valori attuali.
 * Il rischio vero viene fissato all'avvio del task.
 * ============================================================================
 */

import { useState, type FormEvent } from "react";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { CATALOGO_TASK, TASK_DISPONIBILI } from "../../content/tasks";
import { puoLavorare, scoperteMancanti, verificaAssegnazione } from "../../engine/mission";
import { valutaTask } from "../../engine/tasks/valutazione";
import type { StatoMissione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { etichetta, formattaDurata, tonoRischio } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./PannelloPianifica.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

/** Valore della select "aiutante" che significa "nessuno". */
const NESSUNO = "";

export function PannelloPianifica({ stato, dispatch }: Props) {
  const membri = Object.values(stato.crew);
  // Solo i task che la crew "sa" di poter fare: quelli bloccati da scoperte
  // non ancora fatte non compaiono (comparirebbero come spoiler).
  const disponibili = TASK_DISPONIBILI.filter((t) => scoperteMancanti(stato, t).length === 0);
  const [idTask, setIdTask] = useState(TASK_DISPONIBILI[0]?.id ?? "");
  const [idResponsabile, setIdResponsabile] = useState(membri[0]?.id ?? "");
  const [idSupporto, setIdSupporto] = useState(NESSUNO);

  const def = CATALOGO_TASK[idTask];
  const ammetteSupporto = def?.supportoAmmesso ?? false;
  // L'aiutante "effettivo" si DERIVA dalle scelte: viene ignorato se il task
  // si svolge da soli, o se nel frattempo è stato scelto come responsabile.
  // (Senza questo controllo la select mostrerebbe "nessuno" mentre lo stato
  // interno vale ancora "sarah": interfaccia e dati direbbero cose diverse.)
  const supportoEffettivo =
    ammetteSupporto && idSupporto !== NESSUNO && idSupporto !== idResponsabile ? idSupporto : null;

  const faseValida = stato.statoGioco === "PIANIFICAZIONE" || stato.statoGioco === "IN_ESECUZIONE";
  const motivo = faseValida
    ? verificaAssegnazione(stato, CONTESTO_GIOCO, idTask, idResponsabile, supportoEffettivo)
    : stato.statoGioco === "DECISIONE"
      ? "Prima serve una decisione del Capitano"
      : "Assegnazioni non disponibili durante il rapporto";

  // La stima si calcola solo se l'assegnazione è valida (altrimenti valutaTask
  // potrebbe giustamente lanciare un errore).
  const responsabile = stato.crew[idResponsabile];
  const supporto = supportoEffettivo !== null ? (stato.crew[supportoEffettivo] ?? null) : null;
  const stima = motivo === null && def && responsabile ? valutaTask(def, responsabile, supporto) : null;

  function conferma(evento: FormEvent) {
    evento.preventDefault(); // un <form> ricaricherebbe la pagina
    if (motivo !== null) return;
    dispatch({ tipo: "ASSEGNA_TASK", idDefinizione: idTask, responsabile: idResponsabile, supporto: supportoEffettivo });
  }

  return (
    <Finestra titolo="Pianifica task">
      <form className={stili.modulo} onSubmit={conferma}>
        <label className={stili.campo}>
          <span>TASK</span>
          <select value={idTask} onChange={(e) => setIdTask(e.target.value)}>
            {disponibili.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>

        <div className={stili.coppia}>
          <label className={stili.campo}>
            <span>RESPONSABILE</span>
            <select value={idResponsabile} onChange={(e) => setIdResponsabile(e.target.value)}>
              {membri.map((m) => (
                <option key={m.id} value={m.id} disabled={!puoLavorare(m)}>
                  {m.nome} · {etichetta(m.ruolo)}
                </option>
              ))}
            </select>
          </label>

          <label className={stili.campo}>
            <span>AIUTANTE</span>
            <select value={supportoEffettivo ?? NESSUNO} disabled={!ammetteSupporto} onChange={(e) => setIdSupporto(e.target.value)}>
              <option value={NESSUNO}>{ammetteSupporto ? "— nessuno —" : "— da soli —"}</option>
              {membri
                .filter((m) => m.id !== idResponsabile)
                .map((m) => (
                  <option key={m.id} value={m.id} disabled={!puoLavorare(m)}>
                    {m.nome}
                  </option>
                ))}
            </select>
          </label>
        </div>

        {def && (
          <dl className={stili.requisiti}>
            <div>
              <dt>LUOGO</dt>
              <dd>{etichetta(def.luogo)}</dd>
            </div>
            <div>
              <dt>ABILITÀ</dt>
              <dd>
                {etichetta(def.abilitaPrincipale)}
                {def.abilitaSecondaria && ` + ${etichetta(def.abilitaSecondaria)}`}
              </dd>
            </div>
            <div>
              <dt>COSTO</dt>
              <dd>
                {Object.entries(def.costoRisorse)
                  .map(([r, q]) => `${etichetta(r).toUpperCase()} −${q}`)
                  .join(" · ") || "—"}
              </dd>
            </div>
            {def.equipaggiamentoRichiesto.length > 0 && (
              <div>
                <dt>RICHIEDE</dt>
                <dd>{def.equipaggiamentoRichiesto.map(etichetta).join(", ")}</dd>
              </div>
            )}
          </dl>
        )}

        {stima && (
          <div className={stili.stima}>
            <span>
              DURATA <strong>{formattaDurata(stima.durata)}</strong>
            </span>
            <span className={stili[tonoRischio(stima.rischio)]}>
              RISCHIO <strong>{stima.rischio}%</strong>
            </span>
            <span className={stili.dettaglio}>
              successo {100 - stima.rischio}% · perfetto {stima.probabilita.SUCCESSO_PERFETTO}% · critico{" "}
              {stima.probabilita.FALLIMENTO_CRITICO}%
            </span>
          </div>
        )}

        {/* Il motivo è testo visibile, non solo un tooltip: si legge anche al tocco. */}
        {motivo !== null && <p className={stili.motivo}>▲ {motivo}</p>}

        <Pulsante type="submit" variante="primario" disabled={motivo !== null}>
          Assegna ▶
        </Pulsante>
      </form>
    </Finestra>
  );
}
