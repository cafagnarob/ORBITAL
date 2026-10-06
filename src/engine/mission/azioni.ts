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
 * ============================================================================
 */

import type { IdDefinizioneTask, IdIstanzaTask, IdMembro } from "../types"

export type Azione =
  | {
      tipo: "ASSEGNA_TASK"
      idDefinizione: IdDefinizioneTask
      responsabile: IdMembro
      supporto: IdMembro | null
    }
  | { tipo: "RIMUOVI_TASK"; idTask: IdIstanzaTask }
  | { tipo: "AVVIA_OPERAZIONI" }
  | { tipo: "AVANZA" }
  | { tipo: "CHIUDI_RAPPORTO" }
