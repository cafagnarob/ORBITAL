/**
 * ============================================================================
 * ambiente.ts — Il suono di fondo della nave, che cambia con la situazione
 * ============================================================================
 *
 * CINQUE ATMOSFERE
 *   INGRESSO      la schermata del titolo: un ronzio basso, quasi silenzio,
 *                 qualche segnale lontano
 *   PREPARAZIONE  hangar: ronzio basso, qualche colpo metallico lontano,
 *                 sibili pneumatici (si sta caricando la nave)
 *   MISSIONE      in orbita: ronzio dei sistemi, ventilazione, piccoli
 *                 cinguettii di dati del terminale
 *   ALLERTA       come MISSIONE, più un impulso grave e regolare:
 *                 una decisione attende il Capitano
 *   NOTTE         il rapporto serale: tutto più basso e rado
 *
 * COME È FATTO
 * Tre strati sempre accesi, di cui cambiamo solo i parametri:
 *   ronzio       → oscillatore a dente di sega molto grave + filtro passa-basso
 *   ventilazione → rumore "marrone" (morbido, grave) in loop + filtro, con un
 *                  LFO (oscillatore lentissimo) che lo fa "respirare"
 *   allarme      → un tono grave il cui volume pulsa (solo in ALLERTA)
 * Più gli EVENTI: suoni brevi a intervalli casuali (3–9 s), scelti in base
 * all'atmosfera. Il caso rende l'ambiente vivo: un loop si riconosce subito.
 *
 * I cambi di atmosfera usano setTargetAtTime: i valori scivolano in un
 * paio di secondi invece di saltare, come una nave che cambia regime.
 * ============================================================================
 */

import { quandoPronto, type Mixer } from "./motore";
import { rumore } from "./suoni";

export type Atmosfera = "INGRESSO" | "PREPARAZIONE" | "MISSIONE" | "ALLERTA" | "NOTTE";

interface Parametri {
  ronzio: number; // volume del ronzio
  freqRonzio: number; // Hz: più basso = più "grande"
  vento: number; // volume della ventilazione
  filtroVento: number; // Hz: più alto = più "aria"
  allarme: number; // volume dell'impulso d'allerta
  eventiOgni: [number, number]; // secondi tra un evento e l'altro (min, max)
}

const ATMOSFERE: Record<Atmosfera, Parametri> = {
  INGRESSO: { ronzio: 0.06, freqRonzio: 38, vento: 0.035, filtroVento: 180, allarme: 0, eventiOgni: [5, 11] },
  PREPARAZIONE: { ronzio: 0.11, freqRonzio: 42, vento: 0.05, filtroVento: 220, allarme: 0, eventiOgni: [3, 8] },
  MISSIONE: { ronzio: 0.08, freqRonzio: 55, vento: 0.09, filtroVento: 380, allarme: 0, eventiOgni: [4, 9] },
  ALLERTA: { ronzio: 0.1, freqRonzio: 58, vento: 0.07, filtroVento: 420, allarme: 0.09, eventiOgni: [3, 6] },
  NOTTE: { ronzio: 0.05, freqRonzio: 48, vento: 0.05, filtroVento: 260, allarme: 0, eventiOgni: [8, 16] },
};

let atmosfera: Atmosfera = "INGRESSO";

/** I nodi che restano accesi per tutta la partita. */
interface Strati {
  ronzio: OscillatorNode;
  armonica: OscillatorNode;
  filtroRonzio: BiquadFilterNode;
  volRonzio: GainNode;
  filtroVento: BiquadFilterNode;
  volVento: GainNode;
  volAllarme: GainNode;
}
let strati: Strati | null = null;

/** 4 secondi di rumore marrone: il rumore bianco "addolcito" (integrato). */
function rumoreMarrone(ctx: AudioContext): AudioBuffer {
  const n = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < n; i++) {
    ultimo = (ultimo + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = ultimo * 3.5;
  }
  return buffer;
}

function costruisci(m: Mixer): Strati {
  const { ctx } = m;
  const uscita = m.ambiente;

  // --- Ronzio -----------------------------------------------------------------
  const ronzio = ctx.createOscillator();
  ronzio.type = "sawtooth";
  const filtroRonzio = ctx.createBiquadFilter();
  filtroRonzio.type = "lowpass";
  filtroRonzio.frequency.value = 160;
  const volRonzio = ctx.createGain();
  volRonzio.gain.value = 0;
  ronzio.connect(filtroRonzio).connect(volRonzio).connect(uscita);
  // Un'armonica pulita un'ottava sopra dà "corpo" al ronzio.
  const armonica = ctx.createOscillator();
  armonica.type = "sine";
  const volArmonica = ctx.createGain();
  volArmonica.gain.value = 0.35;
  armonica.connect(volArmonica).connect(volRonzio);

  // --- Ventilazione -------------------------------------------------------------
  const vento = ctx.createBufferSource();
  vento.buffer = rumoreMarrone(ctx);
  vento.loop = true;
  const filtroVento = ctx.createBiquadFilter();
  filtroVento.type = "bandpass";
  filtroVento.Q.value = 0.6;
  const volVento = ctx.createGain();
  volVento.gain.value = 0;
  vento.connect(filtroVento).connect(volVento).connect(uscita);
  // LFO: un oscillatore a 0.07 Hz (un ciclo ogni ~14 s) muove il filtro.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const profondita = ctx.createGain();
  profondita.gain.value = 90;
  lfo.connect(profondita).connect(filtroVento.frequency);

  // --- Allarme (pulsante) -------------------------------------------------------
  const allarme = ctx.createOscillator();
  allarme.type = "sine";
  allarme.frequency.value = 98;
  const pulsazione = ctx.createGain();
  pulsazione.gain.value = 0;
  const lfoAllarme = ctx.createOscillator();
  lfoAllarme.type = "sine";
  lfoAllarme.frequency.value = 0.6;
  lfoAllarme.connect(pulsazione.gain); // il volume oscilla tra −1 e +1…
  const volAllarme = ctx.createGain();
  volAllarme.gain.value = 0;
  allarme.connect(pulsazione).connect(volAllarme).connect(uscita);

  // L'armonica segue sempre il ronzio: frequenza doppia.
  ronzio.frequency.value = ATMOSFERE[atmosfera].freqRonzio;
  armonica.frequency.value = ATMOSFERE[atmosfera].freqRonzio * 2;
  for (const o of [ronzio, armonica, vento, lfo, allarme, lfoAllarme]) o.start();
  return { ronzio, armonica, filtroRonzio, volRonzio, filtroVento, volVento, volAllarme };
}

/** Porta i tre strati ai valori dell'atmosfera attuale, dolcemente. */
function applica(m: Mixer): void {
  if (!strati) return;
  const p = ATMOSFERE[atmosfera];
  const t = m.ctx.currentTime;
  const morbido = 1.2; // secondi (costante di tempo della rampa)
  strati.volRonzio.gain.setTargetAtTime(p.ronzio, t, morbido);
  strati.ronzio.frequency.setTargetAtTime(p.freqRonzio, t, morbido);
  strati.armonica.frequency.setTargetAtTime(p.freqRonzio * 2, t, morbido);
  strati.volVento.gain.setTargetAtTime(p.vento, t, morbido);
  strati.filtroVento.frequency.setTargetAtTime(p.filtroVento, t, morbido);
  strati.volAllarme.gain.setTargetAtTime(p.allarme, t, 0.4);
}

/** Un piccolo suono casuale, adatto all'atmosfera. */
function evento(m: Mixer): void {
  const e = m.ambiente;
  const caso = Math.random();
  if (atmosfera === "PREPARAZIONE") {
    if (caso < 0.5) rumore(m, e, 0, 0.9, 600 + Math.random() * 700, 14, 0.18); // colpo metallico lontano
    else rumore(m, e, 0, 0.6, 5000, 0.8, 0.05); // sibilo pneumatico
    return;
  }
  if (atmosfera === "INGRESSO") {
    // Un segnale lontano: tre impulsi deboli. (Lo stesso ritmo del segnale di E-17.)
    for (let i = 0; i < 3; i++) {
      const osc = m.ctx.createOscillator();
      const g = m.ctx.createGain();
      osc.frequency.value = 1420;
      const t = m.ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.02, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(g).connect(e);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    return;
  }
  if (atmosfera === "NOTTE") {
    rumore(m, e, 0, 0.4, 900, 10, 0.06);
    return;
  }
  // MISSIONE e ALLERTA: cinguettii di dati o lo scatto di un relè.
  if (caso < 0.6) {
    const t0 = m.ctx.currentTime;
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const osc = m.ctx.createOscillator();
      const g = m.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1700 + Math.random() * 1100;
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.025, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(g).connect(e);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  } else {
    rumore(m, e, 0, 0.05, 3000, 2, 0.12);
  }
}

/** Programma il prossimo evento: un setTimeout che richiama sé stesso. */
function programmaEventi(m: Mixer): void {
  const [min, max] = ATMOSFERE[atmosfera].eventiOgni;
  const attesa = (min + Math.random() * (max - min)) * 1000;
  setTimeout(() => {
    // Con la scheda del browser nascosta o il contesto sospeso non suoniamo.
    if (m.ctx.state === "running" && document.visibilityState === "visible") evento(m);
    programmaEventi(m);
  }, attesa);
}

// L'ambiente nasce insieme al mixer (alla prima interazione dell'utente).
quandoPronto((m) => {
  strati = costruisci(m);
  applica(m);
  programmaEventi(m);
});

/** Cambia atmosfera. Si può chiamare anche prima che l'audio sia sbloccato. */
export function impostaAtmosfera(nuova: Atmosfera): void {
  if (nuova === atmosfera) return;
  atmosfera = nuova;
  quandoPronto(applica);
}
