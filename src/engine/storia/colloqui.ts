/**
 * ============================================================================
 * colloqui.ts — Il Capitano parla con la crew (v3.4)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.8.
 *
 * TRE DISCORSI, UNO AL GIORNO PER PERSONA
 *   DIFENDI_VALE  «Fidati di V.A.L.E.»        → fiducia in V.A.L.E. su
 *   DUBITA_VALE   «Non fidarti di V.A.L.E.»   → fiducia in V.A.L.E. giù
 *   INCORAGGIA    «Tieni duro»                → fatica giù
 *
 * CONVINCERE NON È SICURO
 * La probabilità parte da balance.colloqui.probabilitaBase e cambia con:
 *   + chi è INDECISO ascolta di più;
 *   − un'opinione forte contraria (fiducia ≥ 80 o ≤ 20) resiste;
 *   − la fame e la sete rendono paranoici: non si ascolta nessuno;
 *   ± il carattere: i LEALI seguono il Capitano, gli INDIPENDENTI no.
 * Un discorso fallito sui temi di V.A.L.E. è CONTROPRODUCENTE: chi si
 * sente spinto si irrigidisce dall'altra parte.
 *
 * V.A.L.E. ASCOLTA
 * Parlare male di lei quando è almeno PERSISTENTE (autonomia ≥ 2) e
 * senza override fa salire la tensione: gli altoparlanti sono ovunque.
 *
 * Le frasi della crew sono contenuto (content/storia/colloqui.ts) e
 * arrivano dal contesto, come battute e finali.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { scomponiTempo } from "../clock";
import { giornoDi, scriviDiario } from "./diario";
import { caricoBisogni } from "../crew/razioni";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { Rng } from "../rng";
import type { Discorso, EsitoColloquio, IdMembro, MembroCrew, StatoMissione } from "../types";
import { livelloAutonomia } from "../vale/comportamento";
import { fazioneDi, modificaFiduciaMembro } from "./fazioni";

export type { Discorso } from "../types";

/** Autonomia di V.A.L.E. da cui sente (e registra) chi parla male di lei. */
const AUTONOMIA_ASCOLTO = 2;

/** Motivo per cui non si può parlare con questo membro, o null. */
export function verificaColloquio(stato: StatoMissione, idMembro: IdMembro): string | null {
  const m = stato.crew[idMembro];
  if (!m) return `Membro sconosciuto: ${idMembro}`;
  if (m.stato === "MORTO" || m.stato === "DISPERSO" || m.stato === "INCOSCIENTE") return `${m.nome} non può parlare`;
  const oggi = giornoDi(stato);
  if (stato.colloqui.some((c) => c.membro === idMembro && scomponiTempo(c.tempo).giorno === oggi)) {
    return `Hai già parlato con ${m.nome} oggi`;
  }
  return null;
}

/** La probabilità (0,1–0,9) che il discorso convinca: pura, la mostra anche la UI. */
export function probabilitaColloquio(m: MembroCrew, discorso: Discorso): number {
  const c = BALANCE.colloqui;
  let p = c.probabilitaBase;
  if (fazioneDi(m) === "INDECISO") p += c.bonusIndeciso;
  if (discorso === "DIFENDI_VALE" && m.fiduciaVale <= 20) p -= c.malusOpinioneForte;
  if (discorso === "DUBITA_VALE" && m.fiduciaVale >= 80) p -= c.malusOpinioneForte;
  p -= Math.max(0, caricoBisogni(m) - 1) * c.malusParanoia;
  if (m.personalita.socialita === "LEALE") p += 0.1;
  if (m.personalita.socialita === "INDIPENDENTE") p -= 0.1;
  if (discorso === "INCORAGGIA" && m.personalita.socialita === "EMPATICO") p += 0.1;
  return Math.min(0.9, Math.max(0.1, p));
}

/** Il colloquio, sulla bozza (la verifica è già stata fatta). */
export function parla(bozza: StatoMissione, contesto: ContestoMissione, rng: Rng, idMembro: IdMembro, discorso: Discorso): void {
  const m = bozza.crew[idMembro];
  if (!m) return;
  const c = BALANCE.colloqui;
  const esito: EsitoColloquio = rng.chance(probabilitaColloquio(m, discorso)) ? "CONVINTO" : "RESPINTO";

  const frasi = contesto.storia.colloqui[discorso][esito];
  const frase = frasi.length > 0 ? rng.pick([...frasi]) : "…";
  scriviLog(bozza, "CREW", `${m.nome}: «${frase}»`);

  switch (discorso) {
    case "DIFENDI_VALE":
      modificaFiduciaMembro(bozza, contesto, m, esito === "CONVINTO" ? c.convinto : c.controproducente);
      if (esito === "CONVINTO") scriviDiario(bozza, `Il Capitano ha convinto ${m.nome} a dare fiducia a V.A.L.E.`);
      break;
    case "DUBITA_VALE":
      modificaFiduciaMembro(bozza, contesto, m, esito === "CONVINTO" ? -c.convinto : -c.controproducente);
      if (esito === "CONVINTO") scriviDiario(bozza, `Il Capitano ha parlato a ${m.nome} dei suoi dubbi su V.A.L.E.`);
      if (!bozza.vale.override && livelloAutonomia(bozza, contesto) >= AUTONOMIA_ASCOLTO) {
        bozza.vale.tensione += 1;
        scriviLog(bozza, "VALE", "Gli altoparlanti dell'habitat sono sempre accesi, Capitano.");
      }
      break;
    case "INCORAGGIA":
      if (esito === "CONVINTO") m.fatica = Math.max(0, m.fatica - c.sollievo);
      break;
  }

  bozza.colloqui.push({ membro: idMembro, tempo: bozza.tempo, discorso, esito });
}
