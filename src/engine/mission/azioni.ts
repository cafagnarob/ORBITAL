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
 *   AVANZA_FINO       → in IN_ESECUZIONE (tempo reale, v3.3: porta l'orologio
 *                       fino al minuto indicato, gestendo i momenti incontrati;
 *                       si ferma prima se serve il Capitano)
 *   CHIUDI_RAPPORTO   → in RAPPORTO: si distribuiscono le razioni (v3.4; se
 *                       mancano, quelle predefinite) e si passa alla notte
 *   RISOLVI_MINIGIOCO → con un minigioco in attesa (v3.6): punteggio 0–1,
 *                       0 = lascia fare alla crew
 *   PARLA             → il Capitano parla con un membro (v3.4): una volta al
 *                       giorno per persona, non fa scorrere il tempo
 *   RISOLVI_EVENTO    → in DECISIONE (il Capitano sceglie un'opzione)
 *   SEGNALA_VOCE      → sempre (segna una riga del log nel Terminale SVC-07)
 *   INSERISCI_CODICE  → sempre (prova un codice nel Terminale SVC-07)
 *   CONTESTA          → sempre (contesta un'affermazione di V.A.L.E.)
 *   INTERROGA_VALE    → sempre (pulsanti-domanda: STATO · PERCHÉ? · DIRETTIVA?…)
 *   IMPOSTA_TONO      → sempre (v3.9: il tono con cui il Capitano parla a V.A.L.E.)
 * ============================================================================
 */

import type { RazioniSerali } from "../crew/razioni";
import type { Discorso } from "../storia/colloqui";
import type { DomandaVale, IdDefinizioneTask, IdIstanzaTask, IdMembro, Minuti, TonoCapitano } from "../types";

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
  | { tipo: "AVANZA_FINO"; tempo: Minuti }
  | { tipo: "CHIUDI_RAPPORTO"; razioni?: RazioniSerali }
  | { tipo: "PARLA"; membro: IdMembro; discorso: Discorso }
  | { tipo: "RISOLVI_MINIGIOCO"; punteggio: number }
  | { tipo: "RISOLVI_EVENTO"; idScelta: string }
  | { tipo: "SEGNALA_VOCE"; indice: number }
  | { tipo: "INSERISCI_CODICE"; codice: string }
  | { tipo: "CONTESTA"; indice: number }
  | { tipo: "INTERROGA_VALE"; domanda: DomandaVale }
  /** Testo libero verso V.A.L.E. (v3.0): riconosce parole chiave. */
  | { tipo: "SCRIVI_VALE"; testo: string }
  /** Il tono del Capitano (v3.9): cambia come parla e come V.A.L.E. risponde. */
  | { tipo: "IMPOSTA_TONO"; tono: TonoCapitano }
  /** Il Capitano ordina il rientro sulla Terra (v3.0): può chiudere la missione. */
  | { tipo: "RIENTRA" };
