/**
 * ============================================================================
 * casuale.ts — «Carica a caso»: una nave pronta per partire (v3.9)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.6 (v3.9).
 *
 * Il tasto del riepilogo riempie la nave per chi vuole partire subito:
 *   1. l'INDISPENSABILE della missione (come «Carica l'indispensabile»);
 *   2. una CREW di 4 tra i candidati proposti in questa partita, con un
 *      medico se ce n'è uno;
 *   3. MODULI ed EQUIPAGGIAMENTO a caso negli slot che restano;
 *   4. SCORTE: cibo e acqua per i giorni consigliati, una tanica, un po'
 *      d'ossigeno, poi a caso finché c'è posto;
 *   5. si RISPETTANO LE REGOLE: se il peso o la stiva sforano si tolgono
 *      pezzi NON indispensabili (prima le scorte extra, poi moduli ed
 *      equipaggiamento a caso) finché non c'è più nessun problema BLOCCANTE.
 * Il risultato si può sempre avviare (fattibilità POSSIBILE o RISCHIOSA).
 *
 * Funzione PURA: il caso arriva da fuori (un Rng). L'interfaccia ne crea
 * uno nuovo a ogni clic, così ogni clic dà una nave diversa; i test ne
 * passano uno fisso.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { parametriNave } from "../nave/parametri";
import type { Rng } from "../rng";
import type { CataloghiPreparazione, IdMembro, Preparazione } from "../types";
import { attrezzaturaIndispensabile } from "./indispensabile";
import { carico, spazioOccupato } from "./riepilogo";
import { giorniScorteConsigliati, problemiPreparazione } from "./verifica";

/** Una copia mescolata di una lista (Fisher–Yates con il nostro Rng). */
function mescola<T>(lista: readonly T[], rng: Rng): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Ci sono problemi che impediscono di partire? */
const bloccata = (prep: Preparazione, cat: CataloghiPreparazione) =>
  problemiPreparazione(prep, cat).some((p) => p.gravita === "BLOCCANTE");

export function preparazioneCasuale(cat: CataloghiPreparazione, proposti: readonly IdMembro[], rng: Rng): Preparazione {
  const p = BALANCE.preparazione;
  const ind = attrezzaturaIndispensabile(cat.taskObbligatori ?? [], cat);

  // --- 2. Crew: un medico (se c'è), poi a caso -------------------------------
  const candidati = mescola(proposti.filter((id) => cat.candidati[id]), rng);
  const medico = candidati.find((id) => cat.candidati[id]?.ruolo === "MEDICO");
  const crew = [...(medico ? [medico] : []), ...candidati.filter((id) => id !== medico)].slice(0, p.crewRichiesta);

  // --- 1 + 3. Indispensabile, poi il resto a caso ----------------------------
  const riempi = (primi: readonly string[], tutti: readonly string[], posti: number) => {
    const scelti = primi.slice(0, posti);
    for (const id of mescola(tutti, rng)) if (scelti.length < posti && !scelti.includes(id)) scelti.push(id);
    return scelti;
  };
  const moduli = riempi(ind.moduli, Object.keys(cat.moduli), p.slotModuli);
  const equipaggiamento = riempi(ind.equipaggiamento, Object.keys(cat.equipaggiamento), p.slotEquipaggiamento);

  // --- 4. Scorte ----------------------------------------------------------------
  const prep: Preparazione = { crew, moduli, equipaggiamento, scorte: {} };
  const par = parametriNave(moduli, cat.moduli);
  const giorni = giorniScorteConsigliati(cat);
  const casse = Object.values(cat.scorte);
  const metti = (id: string, n: number) => {
    const def = cat.scorte[id];
    if (!def) return;
    prep.scorte[id] = Math.min(def.massimo, (prep.scorte[id] ?? 0) + n);
  };
  for (const [risorsa, perMembro] of [
    ["cibo", par.ciboPerMembro],
    ["acqua", par.acquaPerMembro],
  ] as const) {
    const cassa = casse.find((s) => s.risorsa === risorsa);
    if (cassa) metti(cassa.id, Math.ceil((giorni * crew.length * perMembro) / cassa.quantita));
  }
  const tanica = casse.find((s) => s.risorsa === "carburante");
  if (tanica) metti(tanica.id, 1 + rng.int(0, 1));
  const bombola = casse.find((s) => s.risorsa === "ossigeno");
  if (bombola) metti(bombola.id, rng.int(0, 2));
  // Qualche cassa a caso finché c'è posto e peso (una alla volta).
  for (let i = 0; i < 12; i++) {
    const def = rng.pick(casse);
    const prima = prep.scorte[def.id] ?? 0;
    metti(def.id, 1);
    const sfora = spazioOccupato(prep, cat) > par.spazioScorte || carico(prep, cat).totale > p.caricoMassimo;
    if (sfora) prep.scorte[def.id] = prima;
  }

  // --- 5. Le regole: si toglie il superfluo finché non si può partire -------
  const indispensabili = new Set([...ind.moduli, ...ind.equipaggiamento]);
  for (let tentativi = 0; tentativi < 60 && bloccata(prep, cat); tentativi++) {
    // Prima le casse "non vitali" (non cibo né acqua), poi cibo e acqua oltre la prima.
    const extra = Object.entries(prep.scorte).filter(([id, n]) => {
      const r = cat.scorte[id]?.risorsa;
      return n > (r === "cibo" || r === "acqua" ? 1 : 0);
    });
    const nonVitali = extra.filter(([id]) => {
      const r = cat.scorte[id]?.risorsa;
      return r !== "cibo" && r !== "acqua";
    });
    const daTogliere = (nonVitali.length > 0 ? nonVitali : extra)[0];
    if (daTogliere) {
      prep.scorte[daTogliere[0]] = daTogliere[1] - 1;
      continue;
    }
    // Poi un modulo o un equipaggiamento non indispensabile.
    const togliModulo = prep.moduli.find((id) => !indispensabili.has(id));
    if (togliModulo) {
      prep.moduli = prep.moduli.filter((id) => id !== togliModulo);
      continue;
    }
    const togliEquip = prep.equipaggiamento.find((id) => !indispensabili.has(id));
    if (togliEquip) prep.equipaggiamento = prep.equipaggiamento.filter((id) => id !== togliEquip);
    else break;
  }

  // Le casse a zero non servono nell'oggetto.
  prep.scorte = Object.fromEntries(Object.entries(prep.scorte).filter(([, n]) => n > 0));
  return prep;
}
