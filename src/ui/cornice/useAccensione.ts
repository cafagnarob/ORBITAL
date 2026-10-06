/**
 * ============================================================================
 * useAccensione.ts — Accendere e spegnere il monitor (tubo catodico)
 * ============================================================================
 *
 * QUATTRO FASI
 *   ACCENSIONE   il tubo si scalda: un punto, una riga, poi l'immagine
 *   ACCESO       si gioca
 *   SPEGNIMENTO  l'immagine collassa in una riga, poi in un punto
 *   SPENTO       resta solo il bagliore del fosforo che si spegne
 *
 * CHI DECIDE QUANDO SI PASSA ALLA FASE DOPO? LE ANIMAZIONI CSS.
 * Ogni fase ha un'animazione CSS (Monitor.module.css). Quando finisce, il
 * browser lancia l'evento `animationend`, che Monitor ci passa chiamando
 * fineTransizione(): è un GESTORE DI EVENTO, quindi lì possiamo cambiare
 * fase, eseguire l'azione in attesa e suonare. Niente timer, niente
 * useEffect: la durata sta in un posto solo, il CSS.
 *
 * SPEGNI CON "COSA FARE AL BUIO"
 *   spegni(azione, riaccendi)
 *     azione     → eseguita a schermo spento (es. far passare la notte, o
 *                  cambiare schermata): il giocatore non vede il "salto".
 *     riaccendi  → dopo il bagliore il monitor si riaccende da solo
 *                  (buonanotte → buongiorno).
 *
 * useRef conserva l'azione in attesa: è un dato che serve ai gestori, non
 * al disegno, quindi cambiarlo non deve far ridisegnare nulla.
 * ============================================================================
 */

import { useRef, useState } from "react";
import { suona } from "../audio";

export type FaseSchermo = "ACCENSIONE" | "ACCESO" | "SPEGNIMENTO" | "SPENTO";

/**
 * @param daSpento true se la schermata arriva dopo che la precedente ha
 *   spento il monitor (es. Preparazione → Missione): si parte dal bagliore
 *   rimasto acceso e poi il tubo si riaccende, con il suo suono. false
 *   (all'avvio del gioco): si parte direttamente dall'accensione.
 */
export function useAccensione(daSpento = false) {
  const [fase, setFase] = useState<FaseSchermo>(daSpento ? "SPENTO" : "ACCENSIONE");
  const azioneAlBuio = useRef<(() => void) | null>(null);
  const riaccendiDopo = useRef(daSpento);

  /** Spegne il monitor; `azione` viene eseguita quando l'immagine è sparita. */
  function spegni(azione?: () => void, riaccendi = false): void {
    if (fase !== "ACCESO") return; // niente doppi clic durante una transizione
    azioneAlBuio.current = azione ?? null;
    riaccendiDopo.current = riaccendi;
    suona("SPEGNIMENTO_CRT");
    setFase("SPEGNIMENTO");
  }

  /** Chiamata da Monitor quando un'animazione di fase è finita. */
  function fineTransizione(): void {
    switch (fase) {
      case "ACCENSIONE":
        setFase("ACCESO");
        break;
      case "SPEGNIMENTO": {
        const azione = azioneAlBuio.current;
        azioneAlBuio.current = null;
        setFase("SPENTO");
        azione?.();
        break;
      }
      case "SPENTO":
        if (riaccendiDopo.current) {
          riaccendiDopo.current = false;
          suona("ACCENSIONE_CRT");
          setFase("ACCENSIONE");
        }
        break;
      case "ACCESO":
        break;
    }
  }

  return { fase, spegni, fineTransizione };
}
