/**
 * ============================================================================
 * SelezioneLoadout.tsx — Moduli (4 slot), equipaggiamento (6 slot), stiva
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.1 (capacità), §11.3 (catalogo).
 *
 * Tre "cassetti" in un pannello solo, scelti con le linguette in alto.
 * Ogni linguetta mostra lo stato degli slot (es. MODULI 3/4): si vede cosa
 * manca senza aprire il cassetto. Quale cassetto è aperto è stato
 * dell'INTERFACCIA (useState), non della partita.
 *
 * La cornice (titolo, peso del carico, tasto "riduci") la dà la finestra
 * mobile della Preparazione (v3.7.4): qui solo il contenuto.
 *
 * "SBLOCCA" NON È SCRITTO NEL CATALOGO
 * Lo ricaviamo dai task (content/tasks.ts): un oggetto sblocca i task che lo
 * richiedono. Se domani un task richiede il Drone, la scheda del Drone lo
 * dirà da sola, senza toccare il catalogo del loadout.
 * ============================================================================
 */

import { useState } from "react"
import { BALANCE } from "../../content/balance"
import { LISTA_EQUIPAGGIAMENTO, LISTA_MODULI } from "../../content/loadout"
import { TASK_DISPONIBILI } from "../../content/tasks"
import type { Riepilogo } from "../../engine/preparazione"
import type { Preparazione } from "../../engine/types"
import { descriviEffettiModulo } from "../format"
import type { DispatchPreparazione } from "../usePreparazione"
import { SchedaOggetto } from "./SchedaOggetto"
import stili from "./SelezioneLoadout.module.css"
import { StivaScorte } from "./StivaScorte"

type Cassetto = "moduli" | "equipaggiamento" | "stiva"

/** Nomi dei task che richiedono questo modulo o equipaggiamento. */
function taskSbloccati(id: string): string[] {
  return TASK_DISPONIBILI.filter(
    (t) =>
      t.moduliRichiesti.includes(id) || t.equipaggiamentoRichiesto.includes(id),
  ).map((t) => t.nome)
}

interface Props {
  prep: Preparazione
  riepilogo: Riepilogo
  dispatch: DispatchPreparazione
}

export function SelezioneLoadout({ prep, riepilogo, dispatch }: Props) {
  const [cassetto, setCassetto] = useState<Cassetto>("moduli")
  const p = BALANCE.preparazione
  const moduliPieni = prep.moduli.length >= p.slotModuli
  const equipPieno = prep.equipaggiamento.length >= p.slotEquipaggiamento

  const linguette: { id: Cassetto; nome: string; conteggio: string }[] = [
    {
      id: "moduli",
      nome: "Moduli",
      conteggio: `${prep.moduli.length}/${p.slotModuli}`,
    },
    {
      id: "equipaggiamento",
      nome: "Equipagg.",
      conteggio: `${prep.equipaggiamento.length}/${p.slotEquipaggiamento}`,
    },
    {
      id: "stiva",
      nome: "Stiva",
      conteggio: `${riepilogo.spazio.occupato}/${riepilogo.spazio.massimo}`,
    },
  ]

  return (
    <>
      <div
        className={stili.linguette}
        role="tablist"
        aria-label="Parti del loadout"
      >
        {linguette.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={cassetto === l.id}
            className={stili.linguetta}
            onClick={() => setCassetto(l.id)}
          >
            {l.nome} <span className={stili.conteggio}>{l.conteggio}</span>
          </button>
        ))}
      </div>

      {cassetto === "moduli" && (
        <>
          <p className={stili.nota}>
            Installati sulla nave: cambiano energia, stiva, riposo e
            affidabilità dei dati.
          </p>
          <ul className={stili.griglia}>
            {LISTA_MODULI.map((m) => {
              const scelto = prep.moduli.includes(m.id)
              return (
                <li key={m.id}>
                  <SchedaOggetto
                    nome={m.nome}
                    peso={m.peso}
                    descrizione={m.descrizione}
                    effetti={descriviEffettiModulo(m.effetti)}
                    sblocca={taskSbloccati(m.id)}
                    tag={m.tag}
                    inArrivo={m.inArrivo}
                    scelto={scelto}
                    disattivato={!scelto && moduliPieni}
                    onClick={() =>
                      dispatch({ tipo: "SCEGLI_MODULO", id: m.id })
                    }
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      {cassetto === "equipaggiamento" && (
        <>
          <p className={stili.nota}>
            Strumenti portatili: senza quello giusto, alcuni task non si possono
            fare.
          </p>
          <ul className={stili.griglia}>
            {LISTA_EQUIPAGGIAMENTO.map((e) => {
              const scelto = prep.equipaggiamento.includes(e.id)
              return (
                <li key={e.id}>
                  <SchedaOggetto
                    nome={e.nome}
                    peso={e.peso}
                    descrizione={e.descrizione}
                    effetti={[]}
                    sblocca={taskSbloccati(e.id)}
                    tag={e.tag}
                    inArrivo={e.inArrivo}
                    scelto={scelto}
                    disattivato={!scelto && equipPieno}
                    onClick={() =>
                      dispatch({ tipo: "SCEGLI_EQUIPAGGIAMENTO", id: e.id })
                    }
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      {cassetto === "stiva" && (
        <StivaScorte prep={prep} riepilogo={riepilogo} dispatch={dispatch} />
      )}
    </>
  )
}
