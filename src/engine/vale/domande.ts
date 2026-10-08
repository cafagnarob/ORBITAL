/**
 * ============================================================================
 * domande.ts — Il Capitano parla con V.A.L.E. (pulsanti o testo libero)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3, §16.5, §3.6 (v3.9: toni e dialogo).
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
 * LA RISPOSTA dipende dal COMPORTAMENTO: più V.A.L.E. è in tensione, più
 * le sue risposte diventano evasive. Alcune domande (ACCUSA, MINACCIA)
 * fanno salire la tensione: accusarla di mentire non è gratis.
 *
 * IL TONO DEL CAPITANO (v3.9) — stato.vale.tono, numeri in balance.vale.toni
 *   CALMO        come prima.
 *   AMICHEVOLE   risposte di un livello più disponibili; la crew vede un
 *                Capitano che si fida e si fida un po' di più di lei.
 *   FERMO        sulle domande DI FATTO (stato, danni, equipaggio, scorte…)
 *                V.A.L.E. dà sempre i dati veri; chiederle di LEI con
 *                fermezza (perché, direttiva…) la irrita (+tensione).
 *   ARRABBIATO   risposte più evasive e +tensione; la crew diffida di lei.
 *                Ma a volte V.A.L.E. "si incrina": una riga con un codice.
 *   SOSPETTOSO   ogni risposta è seguita da una VERIFICA INCROCIATA: la
 *                concordanza scende quando V.A.L.E. è evasiva (un indizio
 *                per sapere quando contestarla). La crew diffida un po'.
 * Anche la battuta del Capitano cambia: ogni domanda ha una frase per tono.
 *
 * NIENTE CASO "VERO" QUI
 * Le probabilità (la crepa) usano un generatore derivato da seed + minuto +
 * lunghezza del log: stesse azioni → stesse risposte, senza consumare i
 * numeri casuali della partita.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { fasciaSistema } from "../nave/integrita";
import { parametriNave } from "../nave/parametri";
import { createRng, deriveSeed, hashSeed } from "../rng";
import { giornoDi } from "../storia/diario";
import { membriAttivi, modificaFiduciaCrew } from "../storia/fazioni";
import { conMissione, giorniTotali } from "../storia/piano";
import {
  DOMANDE_DI_FATTO,
  DOMANDE_VALE,
  SISTEMI_CORE,
  type DomandaVale,
  type RispostaVale,
  type StatoMissione,
  type TonoCapitano,
} from "../types";
import { livelloComportamento } from "./comportamento";

/** Minuscole e senza accenti: "Perché" → "perche". */
export function normalizzaTesto(testo: string): string {
  return testo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * La domanda riconosciuta nel testo libero, o null. La prima che
 * corrisponde vince: le più "forti" (minaccia, accusa, scuse) prima.
 */
export function interpretaTesto(testo: string, paroleChiave: Record<DomandaVale, string[]>): DomandaVale | null {
  const t = normalizzaTesto(testo);
  const prima: DomandaVale[] = ["MINACCIA", "ACCUSA", "SCUSA", "PASSATO", "SEGNALE"];
  const ordine: DomandaVale[] = [...prima, ...DOMANDE_VALE.filter((d) => !prima.includes(d))];
  return ordine.find((d) => paroleChiave[d].some((parola) => t.includes(parola))) ?? null;
}

// ----------------------------------------------------------------------------
// I DATI VERI DELLA NAVE (per i segnaposto)
// ----------------------------------------------------------------------------

/** Per quanti giorni bastano cibo, acqua e ossigeno con la crew a bordo. */
export function giorniDiScorte(stato: StatoMissione, contesto: ContestoMissione) {
  const p = parametriNave(stato.nave.moduli, contesto.catalogoModuli);
  const n = Math.max(1, membriAttivi(stato).length);
  const giorni = (q: number, perMembro: number) => Math.floor(q / Math.max(1, n * perMembro));
  return {
    cibo: giorni(stato.risorse.cibo, p.ciboPerMembro),
    acqua: giorni(stato.risorse.acqua, p.acquaPerMembro),
    ossigeno: giorni(stato.risorse.ossigeno, BALANCE.giornata.ossigenoPerMembro),
  };
}

/**
 * Lo stato di un membro come lo dice V.A.L.E. (v3.9): con la salute in
 * percentuale, così un ferito non sembra mai "sano" (era il bug: lo stato
 * cambiava solo sotto il 60%).
 */
function descriviMembro(m: StatoMissione["crew"][string]): string {
  return `${m.nome} ${m.stato.toLowerCase()} (${m.salute}%)`;
}

/** Il nome di un task del catalogo, o un ripiego. */
function nomeTask(contesto: ContestoMissione, id: string, ripiego: string): string {
  return contesto.catalogoTask[id]?.nome.toLowerCase() ?? ripiego;
}

/**
 * Il CONSIGLIO di V.A.L.E. (v3.9): le due cose più urgenti, in ordine.
 * Prima le scorte che stanno finendo, poi i feriti, i sistemi rotti, la fatica.
 */
export function consiglio(stato: StatoMissione, contesto: ContestoMissione): string {
  const g = giorniDiScorte(stato, contesto);
  const voci: string[] = [];
  if (g.acqua <= 3) voci.push(`${nomeTask(contesto, "T-RICICLO-ACQUA", "recuperare l'acqua")} (acqua per ${g.acqua} giorni)`);
  if (g.ossigeno <= 3) voci.push(`${nomeTask(contesto, "T-ELETTROLISI", "produrre ossigeno")} (ossigeno per ${g.ossigeno} giorni)`);
  if (g.cibo <= 3) voci.push(`${nomeTask(contesto, "T-COLTURA", "produrre cibo")} (cibo per ${g.cibo} giorni)`);
  const feriti = membriAttivi(stato).filter((m) => m.salute < 100 && m.stato !== "SANO");
  if (feriti.length > 0) voci.push(`cure per ${feriti.map((m) => m.nome).join(" e ")}`);
  const guasto = SISTEMI_CORE.filter((s) => stato.nave.sistemi[s] < 60).sort((a, b) => stato.nave.sistemi[a] - stato.nave.sistemi[b])[0];
  if (guasto) voci.push(`riparare ${guasto.replaceAll("_", " ").toLowerCase()} (${stato.nave.sistemi[guasto]}%)`);
  const stanco = membriAttivi(stato).find((m) => m.fatica >= 70);
  if (stanco) voci.push(`riposo per ${stanco.nome}`);
  return voci.length > 0 ? voci.slice(0, 2).join("; poi ") : "mantenere il programma attuale";
}

/** Sostituisce i segnaposto delle risposte con i dati veri della nave. */
function riempi(stato: StatoMissione, contesto: ContestoMissione, testo: string): string {
  const danni = SISTEMI_CORE.filter((s) => fasciaSistema(stato.nave.sistemi[s]) !== "NOMINALE" && stato.nave.sistemi[s] < 85)
    .map((s) => `${s.replaceAll("_", " ").toLowerCase()} ${stato.nave.sistemi[s]}%`)
    .join(", ");
  const crew = membriAttivi(stato).map(descriviMembro).join(", ");
  const feriti = membriAttivi(stato).filter((m) => m.stato !== "SANO");
  const g = giorniDiScorte(stato, contesto);
  return conMissione(testo, stato, contesto)
    .replaceAll("{DANNI}", danni || "nessuno")
    .replaceAll("{CREW}", crew || "nessuno a bordo")
    .replaceAll("{FERITI}", feriti.length === 0 ? "nessun ferito" : `feriti: ${feriti.map(descriviMembro).join(", ")}`)
    .replaceAll("{OSSIGENO}", String(g.ossigeno))
    .replaceAll("{GIORNI_CIBO}", String(g.cibo))
    .replaceAll("{GIORNI_ACQUA}", String(g.acqua))
    .replaceAll("{CONSIGLIO}", consiglio(stato, contesto))
    .replaceAll("{MISSIONE}", contesto.missioni[stato.missione.id]?.titolo ?? "la missione")
    .replaceAll("{GIORNO}", String(giornoDi(stato)))
    .replaceAll("{DURATA}", String(giorniTotali(stato.missione)));
}

// ----------------------------------------------------------------------------
// LA RISPOSTA
// ----------------------------------------------------------------------------

/** Una risposta vale ora? (livello e scoperte) */
function ammessa(stato: StatoMissione, r: RispostaVale, livello: number): boolean {
  if (r.daComportamento > livello) return false;
  if (r.seScoperta && !stato.conoscenza.scoperte.includes(r.seScoperta)) return false;
  if (r.senzaScoperta && stato.conoscenza.scoperte.includes(r.senzaScoperta)) return false;
  return true;
}

/** Il livello a cui V.A.L.E. risponde, tenuto conto del tono (0–5). */
function livelloRisposta(bozza: StatoMissione, contesto: ContestoMissione, domanda: DomandaVale): number {
  const effetto = BALANCE.vale.toni[bozza.vale.tono];
  // FERMO sulle domande di fatto: i dati veri, sempre (livello 0).
  if (effetto.datiVeri && DOMANDE_DI_FATTO.includes(domanda)) return 0;
  return Math.min(5, Math.max(0, livelloComportamento(bozza, contesto) + effetto.spostamento));
}

/** Le scuse del Capitano (v3.9): tolgono tensione, una volta al giorno. */
function scuse(bozza: StatoMissione, contesto: ContestoMissione): void {
  const t = contesto.testiVale.scusa;
  const b = BALANCE.vale;
  if (bozza.vale.ultimaScusa !== null && bozza.tempo - bozza.vale.ultimaScusa < b.scusaOgniOre * 60) {
    scriviLog(bozza, "VALE", t.troppoPresto);
    return;
  }
  if (bozza.vale.tensione <= 0) {
    scriviLog(bozza, "VALE", t.inutile);
    return;
  }
  bozza.vale.tensione = Math.max(0, bozza.vale.tensione - b.scusaTensione);
  bozza.vale.ultimaScusa = bozza.tempo;
  scriviLog(bozza, "VALE", t.accettata);
}

/** La risposta di V.A.L.E. a una domanda (la battuta del Capitano è già nel log). */
function rispondi(bozza: StatoMissione, contesto: ContestoMissione, domanda: DomandaVale): void {
  if (domanda === "SCUSA") {
    scuse(bozza, contesto);
    return;
  }

  const voce = contesto.testiVale.domande[domanda];
  const tono = bozza.vale.tono;
  const effetto = BALANCE.vale.toni[tono];
  // Il livello si legge PRIMA di aggiungere la tensione di questa domanda.
  const livello = livelloRisposta(bozza, contesto, domanda);
  const livelloVero = livelloComportamento(bozza, contesto);

  // La risposta del livello più alto non superiore a quello attuale (fra quelle ammesse).
  const risposta = [...voce.risposte]
    .sort((a, b) => a.daComportamento - b.daComportamento)
    .filter((r) => ammessa(bozza, r, livello))
    .at(-1);

  // Il prezzo della domanda e del tono.
  const suDiLei = !DOMANDE_DI_FATTO.includes(domanda);
  bozza.vale.tensione += (voce.tensione ?? 0) + effetto.tensione + (suDiLei ? effetto.suDiLei : 0);
  modificaFiduciaCrew(bozza, contesto, effetto.fiduciaCrew);
  if (!risposta) return;

  // La "cornice": come V.A.L.E. apre la risposta a quel tono.
  const rng = createRng(deriveSeed(bozza.seed, `vale:${bozza.tempo}:${bozza.log.length}`));
  const cornici = contesto.testiVale.toni[tono].cornice[livelloVero <= 2 ? "disponibile" : "fredda"];
  const apertura = cornici.length > 0 ? `${rng.pick(cornici)} ` : "";
  scriviLog(bozza, "VALE", apertura + riempi(bozza, contesto, risposta.testo));
  if (risposta.log) scriviLog(bozza, "SISTEMA", risposta.log.testo, risposta.log.codici);

  // SOSPETTOSO: la verifica incrociata. Più V.A.L.E. è evasiva, meno i dati concordano.
  if (effetto.verifica) {
    const concordanza = Math.max(12, 100 - livelloVero * 16 - (hashSeed(`${bozza.seed}:${bozza.log.length}`) % 6));
    scriviLog(bozza, "SISTEMA", contesto.testiVale.verificaIncrociata.replaceAll("{N}", String(concordanza)));
  }

  // ARRABBIATO: a volte la facciata si incrina e sfugge un codice.
  const codici = Object.keys(contesto.catalogoCodici);
  if (effetto.crepa > 0 && codici.length > 0 && rng.chance(effetto.crepa)) {
    const codice = rng.pick(codici);
    scriviLog(bozza, "SISTEMA", contesto.testiVale.crepa.replaceAll("{CODICE}", codice), [codice]);
  }
}

/** La battuta del Capitano, nel suo tono. */
function battutaCapitano(bozza: StatoMissione, testo: string): void {
  bozza.log.push({ tempo: bozza.tempo, fonte: "CAPITANO", testo, codici: [], tono: bozza.vale.tono });
}

/** Domanda da pulsante: la frase cambia con il tono (manca → l'etichetta). */
export function interrogaVale(bozza: StatoMissione, contesto: ContestoMissione, domanda: DomandaVale): void {
  const voce = contesto.testiVale.domande[domanda];
  battutaCapitano(bozza, voce.capitano?.[bozza.vale.tono] ?? voce.etichetta);
  rispondi(bozza, contesto, domanda);
}

/** Testo libero: si scrive così com'è; il tono conta lo stesso. */
export function scriviAVale(bozza: StatoMissione, contesto: ContestoMissione, testo: string): void {
  const pulito = testo.trim().slice(0, 200);
  if (pulito.length === 0) return;
  battutaCapitano(bozza, pulito);
  const domanda = interpretaTesto(pulito, contesto.testiVale.paroleChiave);
  if (domanda === null) {
    scriviLog(bozza, "VALE", contesto.testiVale.nonCapito);
    return;
  }
  rispondi(bozza, contesto, domanda);
}

/** Il Capitano cambia tono (v3.9). Nessun effetto finché non parla. */
export function impostaTono(bozza: StatoMissione, tono: TonoCapitano): void {
  bozza.vale.tono = tono;
}
