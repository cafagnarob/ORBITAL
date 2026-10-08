/**
 * ============================================================================
 * suggerimenti.ts — I "pezzi" che mancano alla nave, da disegnare sulla mappa
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.4 (fattibilità), §11.6 (v3.9).
 *
 * Il pop-up di avviso del pre-lancio non elenca più frasi in rosso: mostra
 * sulla MAPPA della nave (NaveSezione) i pezzi da aggiungere, come sagome
 * tratteggiate negli alloggi e nella stiva:
 *   MANCANTE    senza questo l'obiettivo principale è impossibile (la
 *               scaletta lo richiede) o non si parte (niente cibo/acqua):
 *               ROSSO, "danger";
 *   CONSIGLIATO non è obbligatorio ma serve: l'attrezzatura dei task che
 *               altrimenti non si potranno fare, le casse che mancano per
 *               coprire i giorni consigliati: AMBRA, "warning".
 *
 * Funzione PURA: riceve la preparazione e i cataloghi, restituisce cosa
 * manca. La UI decide come disegnarlo.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { parametriNave } from "../nave/parametri";
import type { CataloghiPreparazione, IdEquipaggiamento, IdModulo, IdScorta, Preparazione } from "../types";
import { attrezzaturaIndispensabile, indispensabileMancante } from "./indispensabile";
import { riepilogoPreparazione } from "./riepilogo";
import { giorniScorteConsigliati, taskNonDisponibili } from "./verifica";

export type LivelloSuggerimento = "MANCANTE" | "CONSIGLIATO";

export interface PezzoSuggerito<Id extends string> {
  id: Id;
  livello: LivelloSuggerimento;
}

export interface PezziSuggeriti {
  moduli: PezzoSuggerito<IdModulo>[];
  equipaggiamento: PezzoSuggerito<IdEquipaggiamento>[];
  /** Casse da aggiungere (quante) perché cibo e acqua coprano i giorni consigliati. */
  scorte: (PezzoSuggerito<IdScorta> & { quante: number })[];
}

/** Prima i MANCANTI, poi i CONSIGLIATI, senza doppioni, fino a `posti`. */
function ordina<Id extends string>(mancanti: readonly Id[], consigliati: readonly Id[], posti: number): PezzoSuggerito<Id>[] {
  const lista: PezzoSuggerito<Id>[] = [
    ...mancanti.map((id) => ({ id, livello: "MANCANTE" as const })),
    ...consigliati.filter((id) => !mancanti.includes(id)).map((id) => ({ id, livello: "CONSIGLIATO" as const })),
  ];
  return lista.slice(0, Math.max(0, posti));
}

export function pezziSuggeriti(prep: Preparazione, cat: CataloghiPreparazione): PezziSuggeriti {
  const p = BALANCE.preparazione;

  // Indispensabile (la scaletta della missione): MANCANTE.
  const ind = attrezzaturaIndispensabile(cat.taskObbligatori ?? [], cat);
  const mancanti = indispensabileMancante(prep, ind);
  const moduliMancanti = mancanti.filter((id) => Boolean(cat.moduli[id]));
  const equipMancanti = mancanti.filter((id) => Boolean(cat.equipaggiamento[id]));

  // L'attrezzatura dei task che altrimenti non si potranno fare: CONSIGLIATA.
  const bloccati = taskNonDisponibili(prep, cat);
  const moduliConsigliati = [...new Set(bloccati.flatMap((t) => t.moduliRichiesti))].filter((id) => !prep.moduli.includes(id));
  const equipConsigliati = [...new Set(bloccati.flatMap((t) => t.equipaggiamentoRichiesto))].filter(
    (id) => !prep.equipaggiamento.includes(id),
  );

  // Casse di cibo e acqua per arrivare ai giorni consigliati.
  const scorte: PezziSuggeriti["scorte"] = [];
  if (prep.crew.length > 0) {
    const r = riepilogoPreparazione(prep, cat);
    const par = parametriNave(prep.moduli, cat.moduli);
    const giorni = giorniScorteConsigliati(cat);
    for (const [risorsa, perMembro] of [
      ["cibo", par.ciboPerMembro],
      ["acqua", par.acquaPerMembro],
    ] as const) {
      const cassa = Object.values(cat.scorte).find((s) => s.risorsa === risorsa);
      if (!cassa) continue;
      const servono = giorni * prep.crew.length * perMembro - r.risorse[risorsa];
      const quante = Math.min(cassa.massimo - (prep.scorte[cassa.id] ?? 0), Math.ceil(servono / cassa.quantita));
      if (quante > 0) scorte.push({ id: cassa.id, quante, livello: r.risorse[risorsa] === 0 ? "MANCANTE" : "CONSIGLIATO" });
    }
  }

  return {
    moduli: ordina(moduliMancanti, moduliConsigliati, p.slotModuli - prep.moduli.length),
    equipaggiamento: ordina(equipMancanti, equipConsigliati, p.slotEquipaggiamento - prep.equipaggiamento.length),
    scorte,
  };
}
