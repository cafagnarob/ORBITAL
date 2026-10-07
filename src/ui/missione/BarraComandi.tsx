/**
 * ============================================================================
 * BarraComandi.tsx — Avvio della giornata, pausa del tempo, rapporto
 * ============================================================================
 *
 * Mostra l'azione giusta per lo stato del gioco:
 *   PIANIFICAZIONE → AVVIA OPERAZIONI (da qui il tempo scorre da solo)
 *   IN_ESECUZIONE  → PAUSA / RIPRENDI e ⏭ SALTA (v3.5): il salto porta
 *                    l'orologio dritto al prossimo momento importante (fine di
 *                    un task, cambio turno, rapporto) con l'azione AVANZA del
 *                    motore: la stessa che usava il vecchio pulsante Avanza.
 *   RAPPORTO       → CHIUDI RAPPORTO
 *   CONCLUSA       → niente: c'è l'epilogo
 *
 * TEMPO REALE (v3.3): non c'è più il pulsante AVANZA. Durante le operazioni
 * la giornata dura 5 minuti reali; la LINEA DEL GIORNO mostra dove
 * siamo tra le 07:00 e le 22:00, con le tacche dei cambi turno.
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
import { faseGiornata, minutoDelGiorno, ORARI_TURNO, ORARIO_OPERAZIONI, ORARIO_RAPPORTO, prossimoMomento, type MotivoSosta } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import { formattaOra } from "../format";
import type { Dispatch, TempoReale } from "../useMissione";
import stili from "./BarraComandi.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
  /** Chiudere il rapporto = buonanotte: spegne il monitor (SchermataMissione). */
  onChiudiRapporto: () => void;
  /** L'orologio reale: pausa manuale, scheda nascosta, tempo che scorre. */
  tempo: TempoReale;
}

/** Posizione (0–100%) di un orario sulla linea del giorno 07:00–22:00. */
function percentuale(minutoDelGiorno: number): number {
  const p = ((minutoDelGiorno - ORARIO_OPERAZIONI) / (ORARIO_RAPPORTO - ORARIO_OPERAZIONI)) * 100;
  return Math.min(100, Math.max(0, p));
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
    case "TURNO":
      return "Cambio turno";
  }
}

export function BarraComandi({ stato, dispatch, onChiudiRapporto, tempo }: Props) {
  const [rientroArmato, setRientroArmato] = useState(false);
  const rientroPossibile = stato.statoGioco === "PIANIFICAZIONE" || stato.statoGioco === "RAPPORTO";
  let testo: string;
  let comando: { etichetta: string; azione: () => void } | null;
  /** Il salto al prossimo momento: solo durante le operazioni. */
  let salto: { etichetta: string; titolo: string } | null = null;

  switch (stato.statoGioco) {
    case "PIANIFICAZIONE":
      testo = "Pianificazione. Assegna i task, poi avvia le operazioni.";
      comando = { etichetta: "Avvia operazioni ▶", azione: () => dispatch({ tipo: "AVVIA_OPERAZIONI" }) };
      break;
    case "IN_ESECUZIONE": {
      const prossimo = prossimoMomento(stato);
      const cosa = prossimo.motivi.map((m) => descriviMotivo(stato, m)).join(" · ");
      const etichettaTempo = tempo.nascosto ? "IN PAUSA (scheda nascosta)" : tempo.pausa ? "IN PAUSA" : "▶ IN CORSO";
      testo = `${etichettaTempo} · prossimo: ${formattaOra(prossimo.tempo)} — ${cosa}`;
      comando = tempo.pausa
        ? { etichetta: "▶ Riprendi", azione: () => tempo.impostaPausa(false) }
        : { etichetta: "❚❚ Pausa", azione: () => tempo.impostaPausa(true) };
      salto = { etichetta: `⏭ ${formattaOra(prossimo.tempo)}`, titolo: `Salta a ${formattaOra(prossimo.tempo)}: ${cosa}` };
      break;
    }
    case "RAPPORTO":
      testo = "Rapporto serale ricevuto. La crew si prepara al riposo.";
      comando = { etichetta: "Chiudi rapporto ▶", azione: onChiudiRapporto };
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

  // La linea del giorno ha senso solo dall'avvio delle operazioni al rapporto.
  const mostraLinea =
    (stato.statoGioco === "IN_ESECUZIONE" || stato.statoGioco === "DECISIONE") && faseGiornata(stato.tempo) === "OPERAZIONI";
  const ora = minutoDelGiorno(stato.tempo);

  return (
    <footer className={stili.barra}>
      <div className={stili.sinistra}>
        {/* aria-live solo sulle parti che cambiano poco: l'ora cambia ogni secondo. */}
        <p className={stili.testo}>{testo}</p>
        {mostraLinea && (
          <div
            className={`${stili.linea} ${tempo.scorre ? stili.scorre : ""}`}
            role="progressbar"
            aria-label="Giornata operativa, dalle 07:00 alle 22:00"
            aria-valuemin={ORARIO_OPERAZIONI}
            aria-valuemax={ORARIO_RAPPORTO}
            aria-valuenow={ora}
            aria-valuetext={formattaOra(stato.tempo)}
          >
            <span className={stili.riempimento} style={{ width: `${percentuale(ora)}%` }} />
            {ORARI_TURNO.map((t) => (
              <span key={t} className={stili.tacca} style={{ left: `${percentuale(t)}%` }} title={`Cambio turno ${formattaOra(t)}`} />
            ))}
          </div>
        )}
      </div>
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
      {salto && (
        <Pulsante
          className={stili.salta}
          title={salto.titolo}
          aria-label={salto.titolo}
          onClick={() => dispatch({ tipo: "AVANZA" })}
        >
          {salto.etichetta}
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
