/**
 * ============================================================================
 * azioni.ts — Tutto ciò che il giocatore può chiedere al motore
 * ============================================================================
 *
 * COS'È UN'AZIONE
 * Un oggetto semplice che descrive un'intenzione: "assegna questo task a
 * Mara", "vai avanti". Non fa nulla da solo: è il reducer che lo legge e
 * produce il nuovo stato. La UI non modifica MAI lo stato direttamente,
 * invia solo azioni (con dispatch, quando arriveremo a React).
 *
 * È una "union discriminata", come MotivoSosta in clock.ts: il campo `tipo`
 * dice quale azione è, e TypeScript sa quali altri campi esistono.
 *
 * QUANDO SI PUÒ USARE OGNI AZIONE
 *   ASSEGNA_TASK      → in PIANIFICAZIONE o IN_ESECUZIONE
 *   RIMUOVI_TASK      → in PIANIFICAZIONE o IN_ESECUZIONE (solo task in coda)
 *   AVVIA_OPERAZIONI  → in PIANIFICAZIONE (porta l'orologio alle 07:00)
 *   AVANZA            → in IN_ESECUZIONE (salta al prossimo momento importante)
 *   CHIUDI_RAPPORTO   → in RAPPORTO (si passa alla notte)
 *   RISOLVI_EVENTO    → in DECISIONE (il Capitano sceglie un'opzione)
 *   SEGNALA_VOCE      → sempre (segna una riga del log nel Terminale SVC-07)
 *   INSERISCI_CODICE  → sempre (prova un codice nel Terminale SVC-07)
 *   CONTESTA          → sempre (contesta un'affermazione di V.A.L.E.)
 *   INTERROGA_VALE    → sempre (pulsanti-domanda: STATO · PERCHÉ? · DIRETTIVA?)
 * ============================================================================
 */

import type { DomandaVale, IdDefinizioneTask, IdIstanzaTask, IdMembro } from "../types";

export type Azione =
  | {
      tipo: "ASSEGNA_TASK";
      idDefinizione: IdDefinizioneTask;
      responsabile: IdMembro;
      supporto: IdMembro | null;
    }
  | { tipo: "RIMUOVI_TASK"; idTask: IdIstanzaTask }
  | { tipo: "AVVIA_OPERAZIONI" }
  | { tipo: "AVANZA" }
  | { tipo: "CHIUDI_RAPPORTO" }
  | { tipo: "RISOLVI_EVENTO"; idScelta: string }
  | { tipo: "SEGNALA_VOCE"; indice: number }
  | { tipo: "INSERISCI_CODICE"; codice: string }
  | { tipo: "CONTESTA"; indice: number }
  | { tipo: "INTERROGA_VALE"; domanda: DomandaVale }
  /** Testo libero verso V.A.L.E. (v3.0): riconosce parole chiave. */
  | { tipo: "SCRIVI_VALE"; testo: string }
  /** Il Capitano ordina il rientro sulla Terra (v3.0): può chiudere la missione. */
  | { tipo: "RIENTRA" };
