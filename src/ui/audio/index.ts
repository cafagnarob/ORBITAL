/**
 * ============================================================================
 * audio/index.ts — Ciò che il resto dell'interfaccia usa dell'audio
 * ============================================================================
 *
 *   useVolumi()            le posizioni delle manopole (hook React)
 *   giraManopola(canale)   una manopola avanza di uno scatto (e sblocca l'audio)
 *   suona(id)              un effetto breve
 *   parla(frasi)           V.A.L.E. dice qualcosa
 *   impostaAtmosfera(a)    il suono di fondo cambia
 *   annunciaMissione(…)    tutto ciò che deve suonare dopo un'azione di gioco
 *
 * REGOLA: queste funzioni si chiamano dai GESTORI DI EVENTO (onClick…),
 * mai durante il render. Il render deve solo descrivere lo schermo; i
 * suoni sono "effetti collaterali" e il posto giusto per loro è il gestore
 * dell'azione che li provoca. Così non serve nessun useEffect.
 * ============================================================================
 */

import type { Azione } from "../../engine/mission";
import type { StatoMissione } from "../../engine/types";
import { impostaAtmosfera } from "./ambiente";
import { atmosferaDi, frasiNuoveDiVale, suoniMissione } from "./annunci";
import { impostaVolume, leggiVolumi, livelloSuccessivo, type Canale } from "./impostazioni";
import { sbloccaAudio } from "./motore";
import { suona } from "./suoni";
import { parla, zittisci } from "./voce";

export { impostaAtmosfera } from "./ambiente";
export { suonoPreparazione } from "./annunci";
export { LIVELLO_MASSIMO, useVolumi, type Canale } from "./impostazioni";
export { suona, type IdSuono } from "./suoni";
export { parla } from "./voce";
export { sbloccaAudio } from "./motore";

/** Frase di prova quando si accende la voce: conferma che il canale funziona. */
const FRASE_CANALE_VOCE = "Canale vocale attivo, Capitano.";

export function giraManopola(canale: Canale): void {
  sbloccaAudio(); // siamo dentro un clic: il browser ci lascia partire
  const prima = leggiVolumi()[canale];
  const dopo = livelloSuccessivo(prima);
  impostaVolume(canale, dopo);
  suona("CLIC");
  if (canale === "voce") {
    if (dopo === 0) zittisci();
    else if (prima === 0) parla([FRASE_CANALE_VOCE]);
  }
}

/**
 * L'interruttore AUDIO della schermata d'ingresso: se tutto è spento accende
 * ambiente e voce a metà (livello 2); altrimenti spegne entrambi. È dentro
 * un clic, quindi è anche il momento buono per sbloccare l'audio.
 */
export function interruttoreAudio(): void {
  sbloccaAudio();
  const v = leggiVolumi();
  const acceso = v.ambiente > 0 || v.voce > 0;
  impostaVolume("ambiente", acceso ? 0 : 2);
  impostaVolume("voce", acceso ? 0 : 2);
  if (acceso) zittisci();
  else {
    suona("CLIC");
    parla([FRASE_CANALE_VOCE]);
  }
}

/** Dopo ogni azione di gioco: suoni, voce di V.A.L.E. e atmosfera. */
export function annunciaMissione(prima: StatoMissione, dopo: StatoMissione, azione: Azione): void {
  suoniMissione(prima, dopo, azione).forEach(suona);
  parla(frasiNuoveDiVale(prima, dopo));
  impostaAtmosfera(atmosferaDi(dopo));
}
