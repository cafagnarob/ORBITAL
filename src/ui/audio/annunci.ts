/**
 * ============================================================================
 * annunci.ts — COSA deve suonare e COSA deve dire V.A.L.E. (funzioni pure)
 * ============================================================================
 *
 * Separiamo il "cosa" dal "come":
 *   qui      → confrontando lo stato PRIMA e DOPO un'azione decidiamo quali
 *              suoni e quali frasi servono. Sono funzioni pure: si testano
 *              senza casse né browser (tests/ui/audio.test.ts).
 *   suoni.ts, voce.ts, ambiente.ts → il "come": producono davvero il suono.
 *
 * PERCHÉ PRIMA/DOPO E NON L'AZIONE SOLA
 * L'azione dice cosa il Capitano ha CHIESTO; il confronto dice cosa è
 * SUCCESSO. Un ASSEGNA_TASK rifiutato non deve fare il suono di conferma:
 * se il numero di task non è cambiato, suoniamo ERRORE.
 * ============================================================================
 */

import type { Azione } from "../../engine/mission";
import type { AzionePreparazione, Preparazione, StatoMissione } from "../../engine/types";
import type { Atmosfera } from "./ambiente";
import type { IdSuono } from "./suoni";

// ----------------------------------------------------------------------------
// MISSIONE
// ----------------------------------------------------------------------------

/** Le frasi che V.A.L.E. ha appena aggiunto al log (in ordine). */
export function frasiNuoveDiVale(prima: StatoMissione, dopo: StatoMissione): string[] {
  return dopo.log
    .slice(prima.log.length)
    .filter((r) => r.fonte === "VALE")
    .map((r) => r.testo);
}

/** I suoni che accompagnano un'azione della missione. */
export function suoniMissione(prima: StatoMissione, dopo: StatoMissione, azione: Azione): IdSuono[] {
  const suoni: IdSuono[] = [];
  const nTask = (s: StatoMissione) => Object.keys(s.tasks).length;

  switch (azione.tipo) {
    case "ASSEGNA_TASK":
      suoni.push(nTask(dopo) > nTask(prima) ? "CONFERMA" : "ERRORE");
      break;
    case "RIMUOVI_TASK":
      suoni.push("RIMUOVI");
      break;
    case "AVVIA_OPERAZIONI":
      suoni.push("AVVIO");
      break;
    case "INSERISCI_CODICE":
      suoni.push(dopo.terminale.livello > prima.terminale.livello ? "ACCESSO" : "ERRORE");
      break;
    case "CONTESTA":
      suoni.push("CONTESTA");
      break;
    case "RISOLVI_EVENTO":
      suoni.push("CONFERMA");
      break;
    case "RIENTRA":
      suoni.push(dopo.statoGioco === "CONCLUSA" ? "AVVIO" : "ERRORE");
      break;
    default:
      suoni.push("CLIC");
  }
  // Una decisione è appena comparsa: l'allarme ha la precedenza su tutto.
  if (dopo.statoGioco === "DECISIONE" && prima.statoGioco !== "DECISIONE") suoni.push("ALLARME");
  return suoni;
}

/** L'atmosfera sonora che corrisponde allo stato del gioco. */
export function atmosferaDi(stato: StatoMissione): Atmosfera {
  if (stato.statoGioco === "DECISIONE") return "ALLERTA";
  if (stato.statoGioco === "RAPPORTO" || stato.statoGioco === "CONCLUSA") return "NOTTE";
  return "MISSIONE";
}

// ----------------------------------------------------------------------------
// PREPARAZIONE
// ----------------------------------------------------------------------------

/** Il suono di una scelta nella Preparazione: montato, tolto o rifiutato. */
export function suonoPreparazione(prima: Preparazione, dopo: Preparazione, azione: AzionePreparazione): IdSuono {
  const lista = (p: Preparazione): readonly string[] | null => {
    if (azione.tipo === "SCEGLI_CANDIDATO") return p.crew;
    if (azione.tipo === "SCEGLI_MODULO") return p.moduli;
    if (azione.tipo === "SCEGLI_EQUIPAGGIAMENTO") return p.equipaggiamento;
    return null;
  };
  const a = lista(prima);
  const b = lista(dopo);
  if (a && b) {
    if (b.length > a.length) return azione.tipo === "SCEGLI_CANDIDATO" ? "CONFERMA" : "INNESTO";
    if (b.length < a.length) return "RIMUOVI";
    return "ERRORE"; // slot pieni: niente è cambiato
  }
  if (azione.tipo === "IMPOSTA_SCORTA") {
    const n = (p: Preparazione) => p.scorte[azione.id] ?? 0;
    if (n(dopo) > n(prima)) return "CASSA";
    if (n(dopo) < n(prima)) return "RIMUOVI";
    return "ERRORE";
  }
  return "CONFERMA"; // CARICA
}

// ----------------------------------------------------------------------------
// TESTO → VOCE
// ----------------------------------------------------------------------------

/**
 * Adatta un testo del log alla lettura ad alta voce:
 *   "V.A.L.E." → "Vale"    (altrimenti si sente "vi, a, elle, e")
 *   «…»        → tolte     (le virgolette non si pronunciano)
 *   " · "      → ", "      (il separatore diventa una pausa)
 *   "E-17"     → "E 17"
 */
export function testoPerVoce(testo: string): string {
  return testo
    .replaceAll("V.A.L.E.", "Vale")
    .replace(/[«»"]/g, "")
    .replaceAll(" · ", ", ")
    .replace(/\bE-(\d+)/g, "E $1")
    .trim();
}
