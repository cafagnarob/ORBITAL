/**
 * ============================================================================
 * iniziative.ts — La crew agisce da sola; V.A.L.E. agisce sulla nave
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3.3 (controllo della nave), §10.2.
 *
 * TRE COMPORTAMENTI "AUTONOMI"
 *
 * 1. CHI NON SI FIDA CONTESTA DA SOLO (ogni mattina, con una certa
 *    probabilità): un membro CONTRO_VALE riprende l'ultima affermazione di
 *    V.A.L.E. non ancora contestata, la contesta e si mette in coda la
 *    verifica dei dati grezzi. Il Capitano lo scopre dal log.
 *
 * 2. CHI SI FIDA RIFIUTA (all'avvio di un task): se V.A.L.E. è almeno
 *    PERSISTENTE e il task va contro la sua direttiva, un membro CON_VALE
 *    si rifiuta di farlo. Non è V.A.L.E. a bloccarlo: è la persona.
 *
 * 3. V.A.L.E. BLOCCA I COMPARTIMENTI (autonomia AUTONOMA): un task contrario
 *    fa chiudere il compartimento dove si svolge. Ci si rientra con lo
 *    "Sblocco manuale" (Ingegneria) o con l'override ORD-01.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { assegnaTask, verificaAssegnazione } from "../mission/assegnazione";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { Rng } from "../rng";
import { COMPARTIMENTI, type Compartimento, type DefinizioneTask, type Luogo, type MembroCrew, type StatoMissione } from "../types";
import { livelloAutonomia, livelloComportamento } from "../vale/comportamento";
import { contesta, contestazioneAperta, TAG_VERIFICA } from "../vale/contestazioni";
import { contrastaDirettiva } from "../vale/direttiva";
import { battuta } from "./battute";
import { scriviDiario } from "./diario";
import { fazioneDi, membriAttivi } from "./fazioni";

// ----------------------------------------------------------------------------
// 1. Contestazioni spontanee
// ----------------------------------------------------------------------------

/** L'ultima voce di V.A.L.E. che nessuno ha ancora contestato (indice nel log). */
function ultimaAffermazioneLibera(stato: StatoMissione): number | null {
  for (let i = stato.log.length - 1; i >= 0; i--) {
    if (stato.log[i]?.fonte === "VALE" && !stato.vale.contestazioni.some((c) => c.indice === i)) return i;
  }
  return null;
}

/** Al risveglio: al massimo UNA iniziativa per mattina. */
export function iniziativeMattino(bozza: StatoMissione, contesto: ContestoMissione, rng: Rng): void {
  if (contestazioneAperta(bozza)) return;
  const diffidenti = membriAttivi(bozza).filter((m) => fazioneDi(m) === "CONTRO_VALE");
  for (const membro of diffidenti) {
    if (!rng.chance(BALANCE.storia.probabilitaIniziativa)) continue;
    const indice = ultimaAffermazioneLibera(bozza);
    if (indice === null) return;

    scriviLog(bozza, "CREW", `${membro.nome}: «${battuta(bozza, contesto, membro, "CONTESTA_DA_SOLO")}»`);
    contesta(bozza, contesto, indice, membro.nome);
    scriviDiario(bozza, `${membro.nome} ha contestato V.A.L.E. di sua iniziativa.`);

    // …e si mette in coda la verifica, se esiste ed è possibile.
    const verifica = Object.values(contesto.catalogoTask).find((t) => t.tag.includes(TAG_VERIFICA));
    if (verifica && verificaAssegnazione(bozza, contesto, verifica.id, membro.id, null) === null) {
      assegnaTask(bozza, verifica.id, membro.id, null);
      scriviLog(bozza, "SISTEMA", `${membro.nome} si assegna: ${verifica.nome}`);
    }
    return;
  }
}

// ----------------------------------------------------------------------------
// 2. Chi si fida di V.A.L.E. rifiuta i task che lei sconsiglia
// ----------------------------------------------------------------------------

/** Restituisce true se il membro si rifiuta (e lo scrive nel log). */
export function rifiutoCrew(bozza: StatoMissione, contesto: ContestoMissione, membro: MembroCrew, def: DefinizioneTask): boolean {
  if (fazioneDi(membro) !== "CON_VALE") return false;
  if (!contrastaDirettiva(bozza, contesto, def)) return false;
  if (livelloComportamento(bozza, contesto) < BALANCE.storia.comportamentoRifiutoCrew) return false;
  scriviLog(bozza, "CREW", `${membro.nome}: «${battuta(bozza, contesto, membro, "RIFIUTA_TASK")}»`);
  scriviLog(bozza, "SISTEMA", `${def.nome} annullato: ${membro.nome} si rifiuta`);
  scriviDiario(bozza, `${membro.nome} ha detto no a "${def.nome}". V.A.L.E. lo sconsigliava.`);
  return true;
}

// ----------------------------------------------------------------------------
// 3. V.A.L.E. blocca i compartimenti
// ----------------------------------------------------------------------------

function eCompartimento(luogo: Luogo): luogo is Compartimento {
  return (COMPARTIMENTI as readonly string[]).includes(luogo);
}

/** Il luogo è chiuso da V.A.L.E.? (L'esterno e la superficie non si chiudono.) */
export function luogoBloccato(stato: StatoMissione, luogo: Luogo): boolean {
  return eCompartimento(luogo) && stato.nave.accessi[luogo] === "BLOCCATO";
}

/**
 * All'avvio di un task contrario: con autonomia AUTONOMA (e senza override)
 * V.A.L.E. chiude il compartimento. Restituisce true se l'ha fatto.
 */
export function bloccoVale(bozza: StatoMissione, contesto: ContestoMissione, def: DefinizioneTask): boolean {
  if (bozza.vale.override || !eCompartimento(def.luogo)) return false;
  if (!contrastaDirettiva(bozza, contesto, def)) return false;
  if (livelloAutonomia(bozza, contesto) < BALANCE.storia.autonomiaBlocco) return false;
  bozza.nave.accessi[def.luogo] = "BLOCCATO";
  if (!bozza.conoscenza.scoperte.includes("BLOCCO_VALE")) bozza.conoscenza.scoperte.push("BLOCCO_VALE");
  scriviLog(bozza, "VALE", "Accesso sospeso per ragioni di sicurezza, Capitano.");
  scriviLog(bozza, "SISTEMA", `ACCESSO ${def.luogo.replaceAll("_", " ")} · BLOCCATO DA V.A.L.E. · RIF. ORD-01`, ["ORD-01"]);
  scriviDiario(bozza, `V.A.L.E. ha chiuso ${def.luogo.toLowerCase().replaceAll("_", " ")}. Nessuno ha toccato quella porta.`);
  return true;
}

/** Riapre tutto (sblocco manuale riuscito, override, eventi). */
export function sbloccaTutto(bozza: StatoMissione): boolean {
  let qualcosa = false;
  for (const c of COMPARTIMENTI) {
    if (bozza.nave.accessi[c] === "BLOCCATO") {
      bozza.nave.accessi[c] = "APERTO";
      qualcosa = true;
    }
  }
  return qualcosa;
}
