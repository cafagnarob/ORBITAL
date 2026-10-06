/**
 * ============================================================================
 * reducer.ts — Il cuore del motore: (stato, azione) → nuovo stato
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §16.1.
 *
 * COME FUNZIONA applicaAzione
 *   1. Copia profonda dello stato  →  la "bozza".
 *   2. Crea l'Rng partendo da bozza.rngState.
 *   3. Esegue l'azione modificando LIBERAMENTE la bozza.
 *   4. Salva lo stato dell'Rng nella bozza e la restituisce.
 *
 * "MUTABILE DENTRO, PURO FUORI" (lo stesso schema di rng.ts)
 * Scrivere ogni modifica in modo immutabile, con spread annidati
 * ({ ...stato, crew: { ...stato.crew, mara: { ...mara, fatica: 30 } } }),
 * diventa illeggibile in fretta. Allora copiamo tutto una volta con
 * structuredClone e poi modifichiamo la copia con assegnamenti normali.
 * Lo stato ricevuto NON viene mai toccato: per chi chiama, applicaAzione è
 * una funzione pura. È la stessa idea della libreria Immer, usata da
 * Redux Toolkit, ma senza dipendenze.
 * Il costo (copiare qualche KB a ogni azione) è irrilevante per un gioco a
 * turni come ORBITAL.
 *
 * AZIONI NON VALIDE
 * Un'azione impossibile (stato di gioco sbagliato, task sconosciuto...)
 * lancia un errore. La UI deve usare le funzioni di verifica per non
 * inviarle mai: se succede, è un bug, e vogliamo vederlo subito.
 * ============================================================================
 */

import { avanzaTempo, prossimoMomento } from "../clock";
import { controllaEventi, risolviEvento, verificaScelta } from "../eventi/attivazione";
import type { MomentoEventi } from "../eventi/condizioni";
import { createRng } from "../rng";
import type { StatoGioco, StatoMissione } from "../types";
import { assegnaTask, rimuoviDallaCoda, verificaAssegnazione, verificaRimozione } from "./assegnazione";
import type { Azione } from "./azioni";
import type { ContestoMissione } from "./contesto";
import { avviaTaskPronti, concludiTask } from "./esecuzione";
import { avviaOperazioni, rapportoSerale, risveglio } from "./giornata";

/** Lancia un errore se l'azione arriva nello stato di gioco sbagliato. */
function richiediStato(stato: StatoMissione, ammessi: readonly StatoGioco[], azione: Azione): void {
  if (!ammessi.includes(stato.statoGioco)) {
    throw new Error(`Azione ${azione.tipo} non permessa in ${stato.statoGioco}`);
  }
}

/**
 * Controllo di completezza: se un giorno aggiungi un'azione in azioni.ts
 * e dimentichi di gestirla nello switch, `azione` qui non sarà più di tipo
 * `never` e il COMPILATORE darà errore. Un bug trovato prima di eseguire.
 */
function azioneNonGestita(azione: never): never {
  throw new Error(`Azione non gestita: ${JSON.stringify(azione)}`);
}

export function applicaAzione(stato: StatoMissione, azione: Azione, contesto: ContestoMissione): StatoMissione {
  const bozza = structuredClone(stato);
  const rng = createRng(bozza.rngState);

  switch (azione.tipo) {
    case "ASSEGNA_TASK": {
      richiediStato(bozza, ["PIANIFICAZIONE", "IN_ESECUZIONE"], azione);
      const errore = verificaAssegnazione(bozza, contesto, azione.idDefinizione, azione.responsabile, azione.supporto);
      if (errore !== null) throw new Error(errore);
      assegnaTask(bozza, azione.idDefinizione, azione.responsabile, azione.supporto);
      // Durante le operazioni, un membro libero inizia subito.
      if (bozza.statoGioco === "IN_ESECUZIONE") avviaTaskPronti(bozza, contesto);
      break;
    }

    case "RIMUOVI_TASK": {
      richiediStato(bozza, ["PIANIFICAZIONE", "IN_ESECUZIONE"], azione);
      const errore = verificaRimozione(bozza, azione.idTask);
      if (errore !== null) throw new Error(errore);
      rimuoviDallaCoda(bozza, azione.idTask);
      break;
    }

    case "AVVIA_OPERAZIONI": {
      richiediStato(bozza, ["PIANIFICAZIONE"], azione);
      avviaOperazioni(bozza, contesto);
      break;
    }

    case "AVANZA": {
      richiediStato(bozza, ["IN_ESECUZIONE"], azione);
      const momento = prossimoMomento(bozza);
      // avanzaTempo controlla che il tempo non torni indietro; ne prendiamo
      // solo il nuovo valore, perché stiamo lavorando sulla bozza.
      bozza.tempo = avanzaTempo(bozza, momento.tempo).tempo;

      // Raccogliamo cosa succede in questo passo: servirà agli eventi.
      const perEventi: MomentoEventi = { rapportoSerale: false, risveglio: false, tasksConclusi: [] };

      // I motivi arrivano già in ordine: prima le fine dei task, poi gli
      // appuntamenti fissi (vedi clock.ts).
      for (const motivo of momento.motivi) {
        switch (motivo.tipo) {
          case "FINE_TASK":
            concludiTask(bozza, contesto, rng, motivo.idTask);
            perEventi.tasksConclusi.push(motivo.idTask);
            break;
          case "RAPPORTO_SERALE":
            rapportoSerale(bozza);
            perEventi.rapportoSerale = true;
            break;
          case "RISVEGLIO":
            risveglio(bozza);
            perEventi.risveglio = true;
            break;
        }
      }

      // Può accadere un evento; se chiede una decisione, il gioco si ferma
      // in DECISIONE e i task in coda partiranno dopo la scelta.
      controllaEventi(bozza, contesto, rng, perEventi);

      // Chi si è liberato inizia il task successivo (se siamo ancora operativi).
      if (bozza.statoGioco === "IN_ESECUZIONE") avviaTaskPronti(bozza, contesto);
      break;
    }

    case "CHIUDI_RAPPORTO": {
      richiediStato(bozza, ["RAPPORTO"], azione);
      bozza.statoGioco = "IN_ESECUZIONE"; // la notte scorre fino al risveglio
      break;
    }

    case "RISOLVI_EVENTO": {
      richiediStato(bozza, ["DECISIONE"], azione);
      const errore = verificaScelta(bozza, contesto, azione.idScelta);
      if (errore !== null) throw new Error(errore);
      risolviEvento(bozza, contesto, azione.idScelta);
      if (bozza.statoGioco === "IN_ESECUZIONE") avviaTaskPronti(bozza, contesto);
      break;
    }

    default:
      return azioneNonGestita(azione);
  }

  bozza.rngState = rng.getState();
  return bozza;
}
