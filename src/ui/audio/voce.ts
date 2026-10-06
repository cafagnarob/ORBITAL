/**
 * ============================================================================
 * voce.ts — La voce di V.A.L.E. (sintesi vocale del browser)
 * ============================================================================
 *
 * SPEECH SYNTHESIS
 * Il browser sa leggere un testo ad alta voce con le voci installate nel
 * sistema (Windows, Android, macOS ne hanno di italiane). Si crea un
 * SpeechSynthesisUtterance (la frase), si scelgono voce, velocità e tono,
 * e la si mette in coda con speechSynthesis.speak().
 *
 * IL CARATTERE DI V.A.L.E. (DESIGN §3)
 * «Neutrale, calma, precisa… parla poco». Quindi:
 *   velocità 0.9 (un po' lenta), tono 0.75 (più grave e piatto);
 *   un "bip" prima di parlare, come un canale radio che si apre;
 *   al massimo poche frasi per volta: se il Capitano fa avanzare il tempo
 *   e V.A.L.E. ha detto cinque cose, sentiamo solo le ultime. Il resto è
 *   nel log, che è sempre la fonte completa.
 *
 * LE VOCI ARRIVANO IN RITARDO
 * In molti browser getVoices() all'inizio è vuoto e si riempie poco dopo
 * (evento "voiceschanged"). Registriamo l'ascoltatore qui, a livello di
 * modulo, una volta sola.
 * ============================================================================
 */

import { leggiVolumi, GUADAGNO_PER_LIVELLO } from "./impostazioni";
import { suona } from "./suoni";
import { testoPerVoce } from "./annunci";

/** Voci italiane preferite, se presenti (Windows, Google, Apple). */
const PREFERITE = ["Elsa", "Isabella", "Google italiano", "Alice", "Federica", "Paola"];
/** Quante frasi al massimo per ogni "turno" di parola. */
export const FRASI_PER_TURNO = 2;

let voceScelta: SpeechSynthesisVoice | null = null;

function disponibile(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function scegliVoce(): void {
  const italiane = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("it"));
  voceScelta =
    PREFERITE.map((nome) => italiane.find((v) => v.name.includes(nome))).find((v) => v !== undefined) ??
    italiane[0] ??
    null;
}

if (disponibile()) {
  scegliVoce();
  speechSynthesis.addEventListener("voiceschanged", scegliVoce);
}

/**
 * V.A.L.E. dice queste frasi (solo le ultime FRASI_PER_TURNO).
 * Interrompe ciò che stava dicendo: conta l'informazione più recente.
 */
export function parla(frasi: readonly string[]): void {
  if (!disponibile() || frasi.length === 0) return;
  const livello = leggiVolumi().voce;
  if (livello === 0) return;

  speechSynthesis.cancel();
  suona("BIP_VALE");
  const daDire = frasi.slice(-FRASI_PER_TURNO);
  // Un attimo di pausa dopo il bip, poi le frasi in coda.
  setTimeout(() => {
    for (const frase of daDire) {
      const u = new SpeechSynthesisUtterance(testoPerVoce(frase));
      u.lang = "it-IT";
      if (voceScelta) u.voice = voceScelta;
      u.rate = 0.9;
      u.pitch = 0.75;
      u.volume = GUADAGNO_PER_LIVELLO[livello] ?? 1;
      speechSynthesis.speak(u);
    }
  }, 260);
}

/** Zittisce V.A.L.E. (manopola della voce a zero). */
export function zittisci(): void {
  if (disponibile()) speechSynthesis.cancel();
}
