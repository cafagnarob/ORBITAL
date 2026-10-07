/**
 * ============================================================================
 * ColloquioMembro.tsx — «Parla con…»: il Capitano parla a un membro (v3.4)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.8.
 *
 * Un pulsante PARLA apre tre discorsi. Accanto a ognuno c'è la probabilità
 * di convincere, calcolata dal motore (probabilitaColloquio): il giocatore
 * sa quanto rischia, come per i task. Un colloquio al giorno per persona:
 * dopo, il pulsante dice «Già parlato oggi».
 *
 * `aperto` è stato dell'interfaccia (useState): mostrare o no il menu non
 * cambia la partita. Il colloquio vero passa dal motore con l'azione PARLA,
 * e la risposta della persona compare nel canale del log.
 * ============================================================================
 */

import { useState } from "react";
import { probabilitaColloquio, verificaColloquio } from "../../engine/storia/colloqui";
import type { Discorso, MembroCrew, StatoMissione } from "../../engine/types";
import { suona } from "../audio";
import type { Dispatch } from "../useMissione";
import stili from "./ColloquioMembro.module.css";

const DISCORSI: { id: Discorso; testo: string; effetto: string }[] = [
  { id: "DIFENDI_VALE", testo: "«Fidati di V.A.L.E.»", effetto: "fiducia in V.A.L.E. ↑" },
  { id: "DUBITA_VALE", testo: "«Non fidarti di V.A.L.E.»", effetto: "fiducia in V.A.L.E. ↓" },
  { id: "INCORAGGIA", testo: "«Tieni duro»", effetto: "fatica ↓" },
];

interface Props {
  stato: StatoMissione;
  membro: MembroCrew;
  dispatch: Dispatch;
}

export function ColloquioMembro({ stato, membro, dispatch }: Props) {
  const [aperto, setAperto] = useState(false);
  const faseValida = stato.statoGioco === "PIANIFICAZIONE" || stato.statoGioco === "IN_ESECUZIONE";
  const motivo = verificaColloquio(stato, membro.id);
  if (motivo !== null && motivo.startsWith("Hai già parlato")) {
    return <p className={stili.fatto}>Già parlato con {membro.nome} oggi</p>;
  }
  if (motivo !== null || !faseValida) return null;

  function scegli(discorso: Discorso) {
    setAperto(false);
    dispatch({ tipo: "PARLA", membro: membro.id, discorso });
  }

  return (
    <div className={stili.colloquio}>
      <button
        type="button"
        className={stili.apri}
        aria-expanded={aperto}
        onClick={() => {
          suona("CLIC");
          setAperto(!aperto);
        }}
      >
        PARLA CON {membro.nome.toUpperCase()} {aperto ? "▴" : "▾"}
      </button>
      {aperto && (
        <ul className={stili.discorsi}>
          {DISCORSI.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => scegli(d.id)}>
                <span>{d.testo}</span>
                <span className={stili.dettaglio}>
                  {d.effetto} · {Math.round(probabilitaColloquio(membro, d.id) * 100)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
