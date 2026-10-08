/**
 * ============================================================================
 * usePreparazione.ts — Lo stato della schermata di Preparazione
 * ============================================================================
 *
 * Gemello di useMissione: lo stato vive in useState, ogni azione passa dal
 * reducer puro del motore (engine/preparazione) e, nello stesso gestore,
 * si sceglie il suono (montato, tolto, rifiutato) confrontando prima e dopo.
 * Dalla v3.7 si parte dalla nave VUOTA: è il Capitano a riempirla. Il
 * tasto «Carica l'indispensabile» aggiunge solo l'attrezzatura senza cui
 * la scaletta della missione è impossibile.
 *
 * Il RIEPILOGO (peso, energia, fattibilità…) NON è stato: si ricalcola a
 * ogni render da `prep`. Sono poche somme, e così non può mai essere
 * "indietro" rispetto alle scelte.
 *
 * v3.8 · SUPERMISSIONI: i cataloghi dipendono dalla missione estratta dal
 * SEED (attrezzatura indispensabile, task che esistono, giorni di scorte).
 * Si ricalcolano dal seed a ogni render: è una funzione pura e veloce, e
 * il seed non cambia mentre la schermata è aperta (App le dà una key).
 * ============================================================================
 */

import { useRef, useState } from "react";
import { cataloghiPreparazionePer } from "../content/contesto";
import { pianoPartita } from "../content/missioni";
import { PREPARAZIONE_VUOTA } from "../content/missioneIniziale";
import { applicaPreparazione, fattibilita, problemiPreparazione, riepilogoPreparazione } from "../engine/preparazione";
import type { AzionePreparazione, Preparazione } from "../engine/types";
import { suona, suonoPreparazione } from "./audio";

export function usePreparazione(seed: string) {
  const piano = pianoPartita(seed);
  const cataloghi = cataloghiPreparazionePer(piano);
  const [prep, setPrep] = useState<Preparazione>(() => structuredClone(PREPARAZIONE_VUOTA));
  const ultimo = useRef(prep);

  function dispatch(azione: AzionePreparazione): void {
    const prima = ultimo.current;
    const dopo = applicaPreparazione(prima, azione, cataloghi);
    ultimo.current = dopo;
    setPrep(dopo);
    suona(suonoPreparazione(prima, dopo, azione));
  }

  const riepilogo = riepilogoPreparazione(prep, cataloghi);
  const problemi = problemiPreparazione(prep, cataloghi);
  return { prep, dispatch, riepilogo, problemi, fattibilita: fattibilita(problemi), piano, cataloghi };
}

export type DispatchPreparazione = (azione: AzionePreparazione) => void;
