/**
 * ============================================================================
 * motore.ts — Il "mixer" dell'audio: AudioContext e canali
 * ============================================================================
 *
 * WEB AUDIO API IN DUE RIGHE
 * Un AudioContext è un piccolo studio di registrazione: dentro si creano
 * "nodi" (oscillatori, rumore, filtri, volumi) e si collegano a catena
 * fino all'uscita (le casse). Noi non carichiamo file audio: generiamo
 * i suoni con oscillatori e rumore, come un sintetizzatore.
 *
 * LO SCHEMA DEL MIXER
 *   ambiente (ronzio, ventilazione…) ─┐
 *   effetti  (clic, innesti…)        ─┴→ master AMBIENTE ─┐
 *   bip di V.A.L.E.                   ──→ master VOCE     ─┴→ casse
 * Le due manopole regolano i due master.
 *
 * PERCHÉ "PIGRO"
 * I browser vietano di far partire l'audio finché l'utente non tocca la
 * pagina (autoplay policy). Per questo l'AudioContext si crea solo alla
 * prima interazione: una manopola girata, oppure il primo clic sulla
 * pagina se i volumi salvati erano già accesi.
 * L'ascoltatore del primo clic si registra QUI, a livello di modulo, una
 * volta sola: non serve un useEffect in un componente.
 * ============================================================================
 */

import { GUADAGNO_PER_LIVELLO, iscriviti, leggiVolumi } from "./impostazioni";

export interface Mixer {
  ctx: AudioContext;
  ambiente: GainNode;
  effetti: GainNode;
  voce: GainNode;
}

let mixer: Mixer | null = null;
/** Chi vuole sapere quando il mixer nasce (l'ambiente parte in quel momento). */
const allaNascita: ((m: Mixer) => void)[] = [];

export function quandoPronto(callback: (m: Mixer) => void): void {
  if (mixer) callback(mixer);
  else allaNascita.push(callback);
}

/** Il mixer, se esiste già (null finché l'utente non ha interagito). */
export function mixerAttivo(): Mixer | null {
  return mixer;
}

/** Porta i master al volume delle manopole, con una breve rampa (niente "click"). */
function applicaVolumi(m: Mixer): void {
  const v = leggiVolumi();
  const t = m.ctx.currentTime;
  m.ambiente.gain.setTargetAtTime(GUADAGNO_PER_LIVELLO[v.ambiente] ?? 0, t, 0.08);
  m.voce.gain.setTargetAtTime(GUADAGNO_PER_LIVELLO[v.voce] ?? 0, t, 0.08);
}

/**
 * Crea (la prima volta) o risveglia il mixer. Va chiamata DENTRO un gestore
 * di evento dell'utente (onClick…), altrimenti il browser la ignora.
 */
export function sbloccaAudio(): Mixer | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  if (!mixer) {
    const ctx = new AudioContext();
    const ambiente = ctx.createGain();
    const effetti = ctx.createGain();
    const voce = ctx.createGain();
    ambiente.gain.value = 0;
    voce.gain.value = 0;
    effetti.gain.value = 0.8;
    effetti.connect(ambiente);
    ambiente.connect(ctx.destination);
    voce.connect(ctx.destination);
    mixer = { ctx, ambiente, effetti, voce };
    applicaVolumi(mixer);
    allaNascita.splice(0).forEach((cb) => cb(mixer as Mixer));
  }
  if (mixer.ctx.state === "suspended") void mixer.ctx.resume();
  return mixer;
}

// Quando una manopola gira, il mixer segue.
iscriviti(() => {
  if (mixer) applicaVolumi(mixer);
});

// Se i volumi salvati sono accesi, l'audio riparte al primo tocco sulla pagina.
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    () => {
      const v = leggiVolumi();
      if (v.ambiente > 0 || v.voce > 0) sbloccaAudio();
    },
    { once: true },
  );
}
