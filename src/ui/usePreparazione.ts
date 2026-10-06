/**
 * ============================================================================
 * usePreparazione.ts — Lo stato della schermata di Preparazione
 * ============================================================================
 *
 * Gemello di useMissione: lo stato vive in useState, ogni azione passa dal
 * reducer puro del motore (engine/preparazione) e, nello stesso gestore,
 * si sceglie il suono (montato, tolto, rifiutato) confrontando prima e dopo.
 * Si parte dal loadout di riferimento (DESIGN §13.8): chi vuole solo
 * giocare preme AVVIA.
 *
 * Il RIEPILOGO (peso, energia, fattibilità…) NON è stato: si ricalcola a
 * ogni render da `prep`. Sono poche somme, e così non può mai essere
 * "indietro" rispetto alle scelte.
 * ============================================================================
 */

import { useRef, useState } from "react";
import { CATALOGHI_PREPARAZIONE } from "../content/contesto";
import { PREPARAZIONE_DI_RIFERIMENTO } from "../content/missioneIniziale";
import { applicaPreparazione, fattibilita, problemiPreparazione, riepilogoPreparazione } from "../engine/preparazione";
import type { AzionePreparazione, Preparazione } from "../engine/types";
import { suona, suonoPreparazione } from "./audio";

export function usePreparazione() {
  const [prep, setPrep] = useState<Preparazione>(() => structuredClone(PREPARAZIONE_DI_RIFERIMENTO));
  const ultimo = useRef(prep);

  function dispatch(azione: AzionePreparazione): void {
    const prima = ultimo.current;
    const dopo = applicaPreparazione(prima, azione, CATALOGHI_PREPARAZIONE);
    ultimo.current = dopo;
    setPrep(dopo);
    suona(suonoPreparazione(prima, dopo, azione));
  }

  const riepilogo = riepilogoPreparazione(prep, CATALOGHI_PREPARAZIONE);
  const problemi = problemiPreparazione(prep, CATALOGHI_PREPARAZIONE);
  return { prep, dispatch, riepilogo, problemi, fattibilita: fattibilita(problemi) };
}

export type DispatchPreparazione = (azione: AzionePreparazione) => void;
