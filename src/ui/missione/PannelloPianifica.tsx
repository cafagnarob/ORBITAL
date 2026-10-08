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
 * valutaTask), ma il rischio mostrato passa da stimaRischio: con bassa
 * integrità dei dati può differire da quello vero (DESIGN §4.6).
 * Il rischio vero viene fissato all'avvio del task.
 *
 * QUALI TASK SI VEDONO (v3.3, v3.6)
 * La lista si DERIVA a ogni render da disponibilitaTask(): compaiono SOLO
 * i task DISPONIBILI adesso. Quelli già assegnati, in ricarica, non ancora
 * sbloccati o esauriti non si vedono (riappariranno quando si potranno fare).
 * Il task scelto è "effettivo": se nel frattempo diventa indisponibile
 * (lo ha preso un altro, è scaduto) si passa al primo disponibile.
 * ============================================================================
 */

import { useState, type FormEvent } from "react";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { CATALOGO_TASK, TASK_DISPONIBILI } from "../../content/tasks";
import { puoLavorare, stimaRischio, verificaAssegnazione } from "../../engine/mission";
import { disponibilitaTask, scadenzaTask } from "../../engine/tasks/disponibilita";
import { calcolaSoglie, probabilitaEsiti } from "../../engine/tasks/esito";
import { formattaTempo } from "../../engine/clock";
import { valutaTask } from "../../engine/tasks/valutazione";
import type { DefinizioneTask, ResaTask, StatoMissione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { etichetta, formattaDurata, tonoRischio } from "../format";
import type { Dispatch } from "../useMissione";
import { ConIcone } from "../components/icone/ConIcone";
import stili from "./PannelloPianifica.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

/** Valore della select "aiutante" che significa "nessuno". */
const NESSUNO = "";

/** «Ogni 24 h», «Una volta sola», «Sempre». */
function descriviRicarica(def: DefinizioneTask): string {
  if (def.ricaricaOre === null) return "una volta sola";
  if (def.ricaricaOre === 0) return "sempre";
  return `ogni ${def.ricaricaOre} h`;
}

/** «ACQUA +6 · SCAFO +15%» (valori per un successo normale). */
function descriviResa(resa: ResaTask | undefined): string {
  if (!resa) return "—";
  const voci = Object.entries(resa.risorse ?? {}).map(([r, q]) => `${etichetta(r).toUpperCase()} +${q}`);
  if (resa.sistema) voci.push(`${etichetta(resa.sistema.id).toUpperCase()} +${resa.sistema.delta}%`);
  if (resa.scafo !== undefined) voci.push(`SCAFO +${resa.scafo}%`);
  if (resa.cure !== undefined) voci.push(`CURE +${resa.cure}`);
  return voci.join(" · ") || "—";
}

export function PannelloPianifica({ stato, dispatch }: Props) {
  const membri = Object.values(stato.crew);
  // La lista dei task, divisa in "si può fare" e "non ora" (vedi intestazione).
  const elenco = TASK_DISPONIBILI.map((def) => ({ def, disp: disponibilitaTask(stato, CONTESTO_GIOCO, def) }));
  const pronti = elenco.filter((x) => x.disp.tipo === "DISPONIBILE");
  const [idScelto, setIdTask] = useState(TASK_DISPONIBILI[0]?.id ?? "");
  // Il task "effettivo": quello scelto, se si può ancora fare; altrimenti il primo disponibile.
  const idTask = pronti.some((x) => x.def.id === idScelto) ? idScelto : (pronti[0]?.def.id ?? "");
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
  const motivo = !def
    ? "Nessun task disponibile in questo momento"
    : faseValida
    ? verificaAssegnazione(stato, CONTESTO_GIOCO, idTask, idResponsabile, supportoEffettivo)
    : stato.statoGioco === "DECISIONE"
      ? "Prima serve una decisione del Capitano"
      : "Assegnazioni non disponibili durante il rapporto";

  // La stima si calcola solo se l'assegnazione è valida (altrimenti valutaTask
  // potrebbe giustamente lanciare un errore).
  const responsabile = stato.crew[idResponsabile];
  const supporto = supportoEffettivo !== null ? (stato.crew[supportoEffettivo] ?? null) : null;
  const valutazione = motivo === null && def && responsabile ? valutaTask(def, responsabile, supporto) : null;
  // Ciò che il Capitano VEDE è una STIMA: con bassa integrità dei dati può
  // essere sbagliata (DESIGN §4.6). Anche le probabilità si ricavano dalla
  // stima, altrimenti tradirebbero il rischio vero.
  const rischioStimato = valutazione && def ? stimaRischio(stato, CONTESTO_GIOCO, def.id, valutazione.rischio) : null;
  const stima =
    valutazione && rischioStimato !== null && responsabile
      ? {
          durata: valutazione.durata,
          rischio: rischioStimato,
          probabilita: probabilitaEsiti(calcolaSoglie(rischioStimato, responsabile.abilita.PRECISIONE)),
        }
      : null;

  function conferma(evento: FormEvent) {
    evento.preventDefault(); // un <form> ricaricherebbe la pagina
    if (motivo !== null) return;
    dispatch({
      tipo: "ASSEGNA_TASK",
      idDefinizione: idTask,
      responsabile: idResponsabile,
      supporto: supportoEffettivo,
    });
  }

  return (
    <Finestra titolo="Pianifica task">
      <form className={stili.modulo} onSubmit={conferma}>
        <label className={stili.campo}>
          <span>TASK</span>
          <select value={idTask} onChange={(e) => setIdTask(e.target.value)}>
            {pronti.map(({ def: t }) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {scadenzaTask(stato, t) !== null ? " ⏳" : ""}
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
            <select
              value={supportoEffettivo ?? NESSUNO}
              disabled={!ammetteSupporto}
              onChange={(e) => setIdSupporto(e.target.value)}
            >
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
                <ConIcone
                  testo={
                    Object.entries(def.costoRisorse)
                      .map(([r, q]) => `${etichetta(r).toUpperCase()} −${q}`)
                      .join(" · ") || "—"
                  }
                />
              </dd>
            </div>
            <div>
              <dt>RESA</dt>
              <dd>
                <ConIcone testo={descriviResa(def.resa)} />
              </dd>
            </div>
            <div>
              <dt>RIPETIBILE</dt>
              <dd>{descriviRicarica(def)}</dd>
            </div>
            {def.finestra && (
              <div className={stili.scade}>
                <dt>PARTE SOLO</dt>
                <dd>
                  {def.finestra.da}:00–{def.finestra.a}:00
                </dd>
              </div>
            )}
            {scadenzaTask(stato, def) !== null && (
              <div className={stili.scade}>
                <dt>SCADE</dt>
                <dd>{formattaTempo(scadenzaTask(stato, def) ?? 0)}</dd>
              </div>
            )}
            {def.equipaggiamentoRichiesto.length + def.moduliRichiesti.length > 0 && (
              <div>
                <dt>RICHIEDE</dt>
                <dd>{[...def.moduliRichiesti, ...def.equipaggiamentoRichiesto].map(etichetta).join(", ")}</dd>
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
              RISCHIO STIMATO <strong>{stima.rischio}%</strong>
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
