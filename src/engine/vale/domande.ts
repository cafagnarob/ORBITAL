/**
 * ============================================================================
 * domande.ts — Il Capitano interroga V.A.L.E. (pulsanti o testo libero)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3, §16.5.
 *
 * PULSANTI (INTERROGA_VALE): la domanda è già nota.
 *
 * TESTO LIBERO (SCRIVI_VALE, v3.0): il Capitano scrive ciò che vuole.
 * V.A.L.E. NON capisce il linguaggio naturale: cerca PAROLE CHIAVE
 * (content/vale.ts → paroleChiave). "Quali danni ha la nave?" contiene
 * "dann" → domanda DANNI. Se nessuna parola corrisponde, risponde che non
 * ha capito. È un limite voluto: V.A.L.E. è una macchina, e a volte ascolta
 * solo ciò che le conviene.
 *
 * La risposta dipende dal COMPORTAMENTO: più V.A.L.E. è in tensione, più
 * le sue risposte diventano evasive. Alcune domande (ACCUSA, MINACCIA)
 * fanno salire la tensione: accusarla di mentire non è gratis.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { fasciaSistema } from "../nave/integrita";
import { membriAttivi } from "../storia/fazioni";
import { DOMANDE_VALE, SISTEMI_CORE, type DomandaVale, type StatoMissione } from "../types";
import { livelloComportamento } from "./comportamento";

/** Minuscole e senza accenti: "Perché" → "perche". */
export function normalizzaTesto(testo: string): string {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** La domanda riconosciuta nel testo libero, o null. La prima che corrisponde vince. */
export function interpretaTesto(testo: string, paroleChiave: Record<DomandaVale, string[]>): DomandaVale | null {
  const t = normalizzaTesto(testo);
  // ACCUSA e MINACCIA hanno la precedenza: "perché menti?" è un'accusa.
  const ordine: DomandaVale[] = ["MINACCIA", "ACCUSA", ...DOMANDE_VALE.filter((d) => d !== "MINACCIA" && d !== "ACCUSA")];
  return ordine.find((d) => paroleChiave[d].some((parola) => t.includes(parola))) ?? null;
}

/** Sostituisce {DANNI}, {CREW}, {OSSIGENO} con i dati veri della nave. */
function riempi(stato: StatoMissione, testo: string): string {
  const danni = SISTEMI_CORE.filter((s) => fasciaSistema(stato.nave.sistemi[s]) !== "NOMINALE" && stato.nave.sistemi[s] < 85)
    .map((s) => `${s.replaceAll("_", " ").toLowerCase()} ${stato.nave.sistemi[s]}%`)
    .join(", ");
  const crew = membriAttivi(stato)
    .map((m) => `${m.nome} ${m.stato.toLowerCase()}`)
    .join(", ");
  const giorni = Math.floor(stato.risorse.ossigeno / Math.max(1, membriAttivi(stato).length * BALANCE.giornata.ossigenoPerMembro));
  return testo
    .replaceAll("{DANNI}", danni || "nessuno")
    .replaceAll("{CREW}", crew || "nessuno a bordo")
    .replaceAll("{OSSIGENO}", String(giorni));
}

/** La risposta di V.A.L.E. a una domanda (senza scrivere la domanda nel log). */
function rispondi(bozza: StatoMissione, contesto: ContestoMissione, domanda: DomandaVale): void {
  const voce = contesto.testiVale.domande[domanda];
  const livello = livelloComportamento(bozza, contesto);
  // La risposta del livello più alto non superiore a quello attuale.
  const risposta = [...voce.risposte]
    .sort((a, b) => a.daComportamento - b.daComportamento)
    .filter((r) => r.daComportamento <= livello)
    .at(-1);
  if (voce.tensione) bozza.vale.tensione += voce.tensione;
  if (!risposta) return;
  scriviLog(bozza, "VALE", riempi(bozza, risposta.testo));
  if (risposta.log) scriviLog(bozza, "SISTEMA", risposta.log.testo, risposta.log.codici);
}

/** Domanda da pulsante. */
export function interrogaVale(bozza: StatoMissione, contesto: ContestoMissione, domanda: DomandaVale): void {
  scriviLog(bozza, "SISTEMA", `Capitano: ${contesto.testiVale.domande[domanda].etichetta}`);
  rispondi(bozza, contesto, domanda);
}

/** Testo libero. */
export function scriviAVale(bozza: StatoMissione, contesto: ContestoMissione, testo: string): void {
  const pulito = testo.trim().slice(0, 200);
  if (pulito.length === 0) return;
  scriviLog(bozza, "SISTEMA", `Capitano: ${pulito}`);
  const domanda = interpretaTesto(pulito, contesto.testiVale.paroleChiave);
  if (domanda === null) {
    scriviLog(bozza, "VALE", contesto.testiVale.nonCapito);
    return;
  }
  rispondi(bozza, contesto, domanda);
}
