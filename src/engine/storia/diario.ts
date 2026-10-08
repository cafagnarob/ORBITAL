/**
 * ============================================================================
 * diario.ts — Il giornale di bordo
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.2 (come il diario di 60 Seconds).
 *
 * Durante il giorno, eventi, scelte e reazioni della crew aggiungono righe
 * (scriviDiario). Al rapporto serale diarioSerale() aggiunge il "bilancio":
 * risorse che stanno finendo, feriti, come si divide la crew su V.A.L.E.
 * Se la giornata è stata vuota, una frase di riempimento dal contenuto
 * («Giornata tranquilla. Troppo tranquilla.»).
 *
 * Il diario è il RACCONTO della partita: il log dice cosa è successo
 * minuto per minuto, il diario cosa ha significato.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { scomponiTempo } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { parametriNave } from "../nave/parametri";
import { hashSeed } from "../rng";
import type { StatoMissione, VoceDiario } from "../types";
import { fazioneDi, membriAttivi } from "./fazioni";
import { conMissione } from "./piano";

export function giornoDi(stato: StatoMissione): number {
  return scomponiTempo(stato.tempo).giorno;
}

/** Aggiunge una riga al giornale del giorno corrente (senza doppioni identici). */
export function scriviDiario(bozza: StatoMissione, testo: string): void {
  const giorno = giornoDi(bozza);
  if (bozza.diario.some((v) => v.giorno === giorno && v.testo === testo)) return;
  bozza.diario.push({ giorno, testo });
}

/** Le righe di un giorno. */
export function paginaDiario(stato: StatoMissione, giorno: number): VoceDiario[] {
  return stato.diario.filter((v) => v.giorno === giorno);
}

/** Inizi delle frasi sulle fazioni (per non ripeterle uguali ogni sera). */
const FRASI_FAZIONI = ["La crew è divisa", "Nessuno a bordo si fida", "Tutti a bordo si fidano"];

/** "Mara", "Mara e Sarah", "Mara, Nadia e Sarah". */
export function elenco(nomi: readonly string[]): string {
  if (nomi.length <= 1) return nomi[0] ?? "";
  return `${nomi.slice(0, -1).join(", ")} e ${nomi.at(-1)}`;
}

/** Il bilancio della sera: risorse, salute, fazioni, eventuale riempitivo. */
export function diarioSerale(bozza: StatoMissione, contesto: ContestoMissione): void {
  const giorno = giornoDi(bozza);
  const vuota = paginaDiario(bozza, giorno).length === 0;
  const membri = membriAttivi(bozza);
  const n = membri.length;
  const p = parametriNave(bozza.nave.moduli, contesto.catalogoModuli);
  const r = bozza.risorse;

  // --- Risorse che stanno finendo -----------------------------------------
  const giorni = (quantita: number, consumo: number) => (consumo > 0 ? Math.floor(quantita / consumo) : 99);
  const gCibo = giorni(r.cibo, n * p.ciboPerMembro);
  const gAcqua = giorni(r.acqua, n * p.acquaPerMembro);
  if (n > 0 && gCibo <= 3) scriviDiario(bozza, gCibo === 0 ? "Il cibo è finito." : `Il cibo basterà per ${gCibo} giorni, forse.`);
  if (n > 0 && gAcqua <= 3) scriviDiario(bozza, gAcqua === 0 ? "Non c'è più acqua." : `Restano ${gAcqua} giorni d'acqua.`);
  if (r.ossigeno < BALANCE.giornata.capacitaOssigeno / 2) {
    scriviDiario(bozza, "L'aria è più pesante. Nessuno lo dice ad alta voce.");
  }

  // --- Salute ----------------------------------------------------------------
  const feriti = membri.filter((m) => m.stato === "FERITO").map((m) => m.nome);
  const critici = membri.filter((m) => m.stato === "CRITICO").map((m) => m.nome);
  if (feriti.length > 0) scriviDiario(bozza, `${elenco(feriti)}: ferite da curare.`);
  if (critici.length > 0) scriviDiario(bozza, `${elenco(critici)}: condizioni critiche.`);

  // --- La crew e V.A.L.E. (dal giorno 2) ---------------------------------------
  // Si scrive solo quando la situazione CAMBIA: ripeterla ogni sera
  // sarebbe rumore, e il diario deve raccontare, non elencare.
  if (giorno >= 2 && n > 1) {
    const con = membri.filter((m) => fazioneDi(m) === "CON_VALE").map((m) => m.nome);
    const contro = membri.filter((m) => fazioneDi(m) === "CONTRO_VALE").map((m) => m.nome);
    let frase: string | null = null;
    if (con.length > 0 && contro.length > 0) {
      frase = `La crew è divisa: ${elenco(con)} ${con.length > 1 ? "si fidano" : "si fida"} di V.A.L.E., ${elenco(contro)} no.`;
    } else if (contro.length === n) {
      frase = "Nessuno a bordo si fida più di V.A.L.E.";
    } else if (con.length === n) {
      frase = "Tutti a bordo si fidano di V.A.L.E. Anche troppo, forse.";
    }
    const precedente = [...bozza.diario]
      .reverse()
      .find((v) => v.giorno < giorno && FRASI_FAZIONI.some((f) => v.testo.startsWith(f)));
    if (frase && frase !== precedente?.testo) scriviDiario(bozza, frase);
  }

  // --- Giornata vuota: una frase di riempimento ---------------------------------
  if (vuota && paginaDiario(bozza, giorno).length === 0) {
    const frasi = contesto.storia.diarioVuoto;
    const frase = frasi[hashSeed(`${bozza.seed}:diario:${giorno}`) % Math.max(1, frasi.length)];
    if (frase) scriviDiario(bozza, conMissione(frase, bozza, contesto));
  }
}
