/**
 * ============================================================================
 * PannelloCrew.tsx — Lo stato di ogni membro: fatica, attività, coda
 * ============================================================================
 *
 * Per ogni membro della crew mostra:
 *   - nome, ruolo e condizione (SANO, FERITO...);
 *   - fatica con la sua fascia;
 *   - cosa sta facendo ora (task in corso, aiuto a un collega, o libero);
 *   - la sua CODA di task, con la possibilità di rimuovere quelli non avviati;
 *   - fame, sete e task ancora possibili oggi (v3.4);
 *   - PARLA CON…: i discorsi del Capitano (ColloquioMembro, v3.4).
 *
 * Tutto è ricavato dallo stato: per sapere se Nadia sta aiutando qualcuno
 * cerchiamo un task IN_CORSO con supporto === "nadia".
 * ============================================================================
 */

import { CATALOGO_TASK } from "../../content/tasks";
import { fasciaFatica } from "../../engine/crew/fatica";
import type { IstanzaTask, MembroCrew, StatoMissione } from "../../engine/types";
import { BarraSegmentata } from "../components/BarraSegmentata";
import { Finestra } from "../components/Finestra";
import { Pulsante } from "../components/Pulsante";
import { fazioneDi } from "../../engine/storia/fazioni";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { capacitaGiornaliera, livelloBisogno, NOMI_FAME, NOMI_SETE, taskDiOggi } from "../../engine/crew/razioni";
import { ColloquioMembro } from "./ColloquioMembro";
import { etichetta, formattaOra, NOMI_FAZIONE, tonoFatica, tonoFazione, tonoStatoMembro } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./PannelloCrew.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

/** Livello di fame o sete 0–3 → tono del testo. */
function tonoBisogno(livello: number): "normale" | "attenzione" | "critico" {
  return livello >= 3 ? "critico" : livello >= 2 ? "attenzione" : "normale";
}

/** Nome leggibile di un'istanza di task. */
function nomeTask(task: IstanzaTask): string {
  return CATALOGO_TASK[task.idDefinizione]?.nome ?? task.idDefinizione;
}

/** Descrive in una riga cosa sta facendo un membro in questo momento. */
function attivitaAttuale(stato: StatoMissione, membro: MembroCrew): string {
  const inCorso = Object.values(stato.tasks).filter((t) => t.stato === "IN_CORSO");
  const proprio = inCorso.find((t) => t.responsabile === membro.id);
  if (proprio) return `${nomeTask(proprio)} · fine ${formattaOra(proprio.fine ?? stato.tempo)}`;
  const aiuto = inCorso.find((t) => t.supporto === membro.id);
  if (aiuto) return `Aiuta ${stato.crew[aiuto.responsabile]?.nome ?? "?"} · ${nomeTask(aiuto)}`;
  return "Libero";
}

export function PannelloCrew({ stato, dispatch }: Props) {
  const membri = Object.values(stato.crew);
  const modificabile = stato.statoGioco === "PIANIFICAZIONE" || stato.statoGioco === "IN_ESECUZIONE";

  return (
    <Finestra titolo="Equipaggio" destra={`${membri.length} A BORDO`}>
      <ul className={stili.lista}>
        {membri.map((m) => {
          const fascia = fasciaFatica(m.fatica);
          const inCoda = (stato.code[m.id] ?? [])
            .map((id) => stato.tasks[id])
            .filter((t): t is IstanzaTask => t !== undefined && t.stato === "IN_CODA");

          return (
            <li key={m.id} className={stili.scheda}>
              <div className={stili.riga}>
                <span className={stili.nome}>{m.nome}</span>
                <span className={stili.ruolo}>{etichetta(m.ruolo)}</span>
                <span className={`${stili.condizione} ${stili[tonoStatoMembro(m.stato)]}`}>{m.stato}</span>
              </div>

              <div className={stili.fatica}>
                <span>
                  FATICA {m.fatica} · {fascia}
                </span>
                <BarraSegmentata
                  valore={m.fatica}
                  massimo={100}
                  etichetta={`Fatica di ${m.nome}`}
                  tono={tonoFatica(fascia)}
                />
              </div>

              {/* La fiducia della crew è della crew: si può mostrare (lo stato di V.A.L.E. no). */}
              <p className={stili.fiducia}>
                FIDUCIA IN V.A.L.E. {m.fiduciaVale}
                {/* La fazione si ricava dalla fiducia (engine/storia/fazioni.ts). */}
                <span className={`${stili.fazione} ${stili[tonoFazione(fazioneDi(m))]}`}>
                  {NOMI_FAZIONE[fazioneDi(m)]}
                </span>
              </p>

              {/* Fame e sete (v3.4): pesano sui task possibili oggi. */}
              <p className={stili.bisogni}>
                <span className={stili[tonoBisogno(livelloBisogno(m.fame))]}>{NOMI_FAME[livelloBisogno(m.fame)]}</span>
                {" · "}
                <span className={stili[tonoBisogno(livelloBisogno(m.sete))]}>{NOMI_SETE[livelloBisogno(m.sete)]}</span>
                {" · "}TASK OGGI {taskDiOggi(stato, CONTESTO_GIOCO, m.id)}/{capacitaGiornaliera(m)}
              </p>

              <p className={stili.attivita}>
                <span className={stili.posizione}>{etichetta(m.posizione)}</span> ▸ {attivitaAttuale(stato, m)}
              </p>

              {inCoda.length > 0 && (
                <ol className={stili.coda} aria-label={`Coda di ${m.nome}`}>
                  {inCoda.map((t) => (
                    <li key={t.id}>
                      <span>
                        {nomeTask(t)}
                        {t.supporto !== null && ` + ${stato.crew[t.supporto]?.nome ?? "?"}`}
                      </span>
                      <Pulsante
                        piccolo
                        variante="pericolo"
                        disabled={!modificabile}
                        aria-label={`Rimuovi ${nomeTask(t)} dalla coda di ${m.nome}`}
                        onClick={() => dispatch({ tipo: "RIMUOVI_TASK", idTask: t.id })}
                      >
                        ✕
                      </Pulsante>
                    </li>
                  ))}
                </ol>
              )}

              <ColloquioMembro stato={stato} membro={m} dispatch={dispatch} />
            </li>
          );
        })}
      </ul>
    </Finestra>
  );
}
