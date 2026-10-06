/**
 * ============================================================================
 * BarraComandi.tsx — L'unico pulsante che fa scorrere il tempo
 * ============================================================================
 *
 * Mostra l'azione giusta per lo stato del gioco:
 *   PIANIFICAZIONE → AVVIA OPERAZIONI
 *   IN_ESECUZIONE  → AVANZA (e dice COSA succederà e QUANDO)
 *   RAPPORTO       → CHIUDI RAPPORTO
 *   CONCLUSA       → niente: c'è l'epilogo
 *
 * ORDINA IL RIENTRO (v3.0): in pianificazione e al rapporto c'è anche il
 * pulsante per tornare a casa, che chiude la missione. È irreversibile,
 * quindi chiede conferma: il primo clic "arma" il pulsante (useState),
 * il secondo ordina davvero il rientro.
 *
 * L'anteprima "prossimo momento" usa prossimoMomento() del motore: la UI
 * non indovina, chiede all'orologio la stessa cosa che chiederà il reducer.
 * ============================================================================
 */

import { useState } from "react";
import { CATALOGO_TASK } from "../../content/tasks";
import { prossimoMomento, type MotivoSosta } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import { formattaOra } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./BarraComandi.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

function descriviMotivo(stato: StatoMissione, motivo: MotivoSosta): string {
  switch (motivo.tipo) {
    case "FINE_TASK": {
      const task = stato.tasks[motivo.idTask];
      const nome = task ? (stato.crew[task.responsabile]?.nome ?? "?") : "?";
      const def = task ? CATALOGO_TASK[task.idDefinizione] : undefined;
      return `${nome} termina ${def?.nome ?? "un task"}`;
    }
    case "RAPPORTO_SERALE":
      return "Rapporto serale";
    case "RISVEGLIO":
      return "Risveglio della crew";
  }
}

export function BarraComandi({ stato, dispatch }: Props) {
  const [rientroArmato, setRientroArmato] = useState(false);
  const rientroPossibile = stato.statoGioco === "PIANIFICAZIONE" || stato.statoGioco === "RAPPORTO";
  let testo: string;
  let comando: { etichetta: string; azione: () => void } | null;

  switch (stato.statoGioco) {
    case "PIANIFICAZIONE":
      testo = "Pianificazione. Assegna i task, poi avvia le operazioni.";
      comando = { etichetta: "Avvia operazioni ▶", azione: () => dispatch({ tipo: "AVVIA_OPERAZIONI" }) };
      break;
    case "IN_ESECUZIONE": {
      const prossimo = prossimoMomento(stato);
      const cosa = prossimo.motivi.map((m) => descriviMotivo(stato, m)).join(" · ");
      testo = `Prossimo: ${formattaOra(prossimo.tempo)} — ${cosa}`;
      comando = { etichetta: "Avanza ▶", azione: () => dispatch({ tipo: "AVANZA" }) };
      break;
    }
    case "RAPPORTO":
      testo = "Rapporto serale ricevuto. La crew si prepara al riposo.";
      comando = { etichetta: "Chiudi rapporto ▶", azione: () => dispatch({ tipo: "CHIUDI_RAPPORTO" }) };
      break;
    case "DECISIONE":
      testo = "V.A.L.E. attende una decisione del Capitano.";
      comando = null;
      break;
    case "CONCLUSA":
      testo = "Missione conclusa.";
      comando = null;
      break;
  }

  return (
    <footer className={stili.barra}>
      <p className={stili.testo} aria-live="polite">
        {testo}
      </p>
      {rientroPossibile && (
        <Pulsante
          variante={rientroArmato ? "pericolo" : "secondario"}
          className={stili.rientro}
          onClick={() => {
            if (!rientroArmato) {
              setRientroArmato(true);
              return;
            }
            setRientroArmato(false);
            dispatch({ tipo: "RIENTRA" });
          }}
          onBlur={() => setRientroArmato(false)}
        >
          {rientroArmato ? "Confermi il rientro?" : "Ordina il rientro"}
        </Pulsante>
      )}
      {comando && (
        <Pulsante
          variante="primario"
          onClick={() => {
            setRientroArmato(false);
            comando.azione();
          }}
          className={stili.pulsante}
        >
          {comando.etichetta}
        </Pulsante>
      )}
    </footer>
  );
}
