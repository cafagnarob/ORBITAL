/**
 * ============================================================================
 * suoni.ts — I suoni brevi dell'interfaccia, generati al momento
 * ============================================================================
 *
 * Ogni suono è una ricetta di pochi nodi Web Audio che vivono una frazione
 * di secondo e poi si spengono da soli (stop programmato).
 *
 * I DUE MATTONI
 *   tono(freq, durata, forma)  → un oscillatore con un inviluppo:
 *                                attacco rapido, poi discesa esponenziale.
 *                                Senza inviluppo si sentirebbe un "clic"
 *                                secco all'inizio e alla fine.
 *   rumore(durata, filtro)     → un breve soffio di rumore bianco filtrato:
 *                                metallo, aria, pneumatica.
 *
 * L'ELENCO DEI SUONI è un tipo (IdSuono): chi chiama suona("INESISTENTE")
 * riceve un errore dal compilatore, non un silenzio misterioso.
 * ============================================================================
 */

import { mixerAttivo, type Mixer } from "./motore";

export const SUONI = [
  "CLIC", // pulsante qualunque
  "INNESTO", // modulo o equipaggiamento montato
  "CASSA", // cassa caricata in stiva
  "RIMUOVI", // qualcosa tolto
  "ERRORE", // azione rifiutata
  "CONFERMA", // azione accettata
  "AVVIO", // missione avviata, operazioni avviate
  "ACCESSO", // codice accettato nel terminale
  "TERMINALE", // apertura del Terminale SVC-07
  "CONTESTA", // il Capitano contesta V.A.L.E.
  "ALLARME", // una decisione attende il Capitano
  "BIP_VALE", // V.A.L.E. sta per parlare
  "ACCENSIONE_CRT", // il tubo catodico si accende
  "SPEGNIMENTO_CRT", // il tubo catodico si spegne
] as const;
export type IdSuono = (typeof SUONI)[number];

/** Un tono con inviluppo. `uscita` = il canale del mixer (effetti o voce). */
function tono(
  m: Mixer,
  uscita: AudioNode,
  freq: number,
  inizio: number,
  durata: number,
  forma: OscillatorType = "sine",
  volume = 0.25,
  freqFinale?: number,
): void {
  const t = m.ctx.currentTime + inizio;
  const osc = m.ctx.createOscillator();
  const g = m.ctx.createGain();
  osc.type = forma;
  osc.frequency.setValueAtTime(freq, t);
  if (freqFinale !== undefined) osc.frequency.exponentialRampToValueAtTime(freqFinale, t + durata);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  osc.connect(g).connect(uscita);
  osc.start(t);
  osc.stop(t + durata + 0.05);
}

/** Un soffio di rumore filtrato (passa-banda): metallo, aria, sibili. */
export function rumore(
  m: Mixer,
  uscita: AudioNode,
  inizio: number,
  durata: number,
  freqFiltro: number,
  q: number,
  volume = 0.3,
): void {
  const t = m.ctx.currentTime + inizio;
  const campioni = Math.max(1, Math.floor(m.ctx.sampleRate * durata));
  const buffer = m.ctx.createBuffer(1, campioni, m.ctx.sampleRate);
  const dati = buffer.getChannelData(0);
  for (let i = 0; i < campioni; i++) dati[i] = Math.random() * 2 - 1;
  const sorgente = m.ctx.createBufferSource();
  sorgente.buffer = buffer;
  const filtro = m.ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = freqFiltro;
  filtro.Q.value = q;
  const g = m.ctx.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  sorgente.connect(filtro).connect(g).connect(uscita);
  sorgente.start(t);
}

/** Suona un effetto. Se l'audio non è ancora sbloccato, non fa nulla. */
export function suona(id: IdSuono): void {
  const m = mixerAttivo();
  if (!m) return;
  const e = m.effetti;
  switch (id) {
    case "CLIC":
      tono(m, e, 1900, 0, 0.03, "square", 0.05);
      break;
    case "INNESTO":
      // Due bip che salgono + il "tunk" metallico dell'aggancio.
      tono(m, e, 660, 0, 0.07, "triangle", 0.18);
      tono(m, e, 990, 0.07, 0.09, "triangle", 0.18);
      rumore(m, e, 0.16, 0.25, 420, 6, 0.5);
      tono(m, e, 90, 0.16, 0.22, "sine", 0.35);
      break;
    case "CASSA":
      rumore(m, e, 0, 0.18, 260, 3, 0.45);
      tono(m, e, 140, 0, 0.12, "sine", 0.25);
      break;
    case "RIMUOVI":
      tono(m, e, 880, 0, 0.12, "triangle", 0.16, 440);
      rumore(m, e, 0.05, 0.12, 2500, 1, 0.12);
      break;
    case "ERRORE":
      tono(m, e, 140, 0, 0.18, "square", 0.08);
      tono(m, e, 110, 0.2, 0.22, "square", 0.08);
      break;
    case "CONFERMA":
      tono(m, e, 1320, 0, 0.06, "sine", 0.14);
      tono(m, e, 1760, 0.06, 0.08, "sine", 0.12);
      break;
    case "AVVIO":
      // Una spazzata che sale e un rombo che cresce: i motori si avviano.
      tono(m, e, 120, 0, 1.4, "sawtooth", 0.08, 480);
      tono(m, e, 60, 0, 1.6, "sine", 0.3, 90);
      rumore(m, e, 0.2, 1.2, 600, 0.8, 0.25);
      break;
    case "ACCESSO":
      [523, 659, 784, 1046].forEach((f, i) => tono(m, e, f, i * 0.07, 0.12, "square", 0.06));
      break;
    case "TERMINALE":
      tono(m, e, 2400, 0, 0.02, "square", 0.05);
      tono(m, e, 15600, 0.02, 0.5, "sine", 0.012); // il fischio del tubo catodico
      rumore(m, e, 0.02, 0.3, 4000, 0.7, 0.08);
      break;
    case "CONTESTA":
      tono(m, e, 520, 0, 0.1, "triangle", 0.15);
      tono(m, e, 390, 0.1, 0.16, "triangle", 0.15);
      break;
    case "ALLARME":
      for (let i = 0; i < 3; i++) tono(m, e, 740, i * 0.32, 0.18, "square", 0.07);
      break;
    case "ACCENSIONE_CRT":
      // Il "tunk" del relè, la smagnetizzazione (un ronzio grave che pulsa e
      // cala) e il crepitio statico del vetro che si carica.
      rumore(m, e, 0, 0.06, 1800, 1, 0.4);
      tono(m, e, 55, 0.02, 0.9, "sine", 0.35, 45);
      tono(m, e, 110, 0.05, 0.7, "triangle", 0.08, 70);
      rumore(m, e, 0.15, 0.6, 6000, 0.6, 0.12);
      tono(m, e, 15600, 0.2, 1.2, "sine", 0.008);
      break;
    case "SPEGNIMENTO_CRT":
      // Lo "schiocco" e un fischio che scende mentre il punto si spegne.
      rumore(m, e, 0, 0.05, 2500, 1, 0.35);
      tono(m, e, 900, 0.02, 0.5, "sine", 0.06, 60);
      tono(m, e, 70, 0, 0.25, "sine", 0.25, 40);
      break;
    case "BIP_VALE":
      // Passa dal canale VOCE: se la voce è spenta, anche il bip tace.
      tono(m, m.voce, 1175, 0, 0.09, "sine", 0.18);
      tono(m, m.voce, 1568, 0.1, 0.12, "sine", 0.14);
      break;
  }
}
