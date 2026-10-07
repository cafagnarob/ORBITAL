/**
 * ============================================================================
 * Sequenza.tsx — Minigioco SEQUENZA: memorizza e ripeti
 * ============================================================================
 *
 * Per: diagnostica, propulsori, codice di bypass delle porte.
 *
 * COME SI GIOCA
 * I moduli si accendono uno alla volta: guarda l'ordine. Poi tocca a te:
 * ripetilo. Un errore chiude il gioco; il punteggio è la parte di
 * sequenza ripetuta giusta. Livello 1: 4 moduli, 3 passi · 2: 4 e 4 · 3: 6 e 5.
 *
 * DUE FASI, UN SOLO OROLOGIO
 * La fase "MOSTRA" dipende solo dal tempo: al secondo t è acceso il passo
 * floor(t / durataPasso). Nessun timer per ogni luce: si CALCOLA cosa è
 * acceso dal tempo trascorso, a ogni fotogramma.
 * ============================================================================
 */

import type { CSSProperties } from "react";
import { suona } from "../../audio";
import { BarraTempo } from "./BarraTempo";
import { useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const PASSO = 0.8; // secondi per ogni luce (0,6 accesa + 0,2 spenta)
const ACCESA = 0.6;
const TEMPO_RISPOSTA = 15;
const NOMI = ["PWR", "NAV", "COM", "SV", "SCI", "EVA"];

interface Stato {
  t: number;
  inseriti: number[];
  sequenza: number[];
}

export function Sequenza({ difficolta, onFine }: PropsGioco) {
  const moduli = difficolta === 3 ? 6 : 4;
  const lunghezza = difficolta + 2;

  const [stato, sim] = useSimulazione<Stato, { inseriti: number[] }>(() => {
    const sequenza = Array.from({ length: lunghezza }, () => Math.floor(Math.random() * moduli));
    const fineMostra = lunghezza * PASSO + 0.4;
    /** Quanti passi giusti dall'inizio (fino al primo errore). */
    const giusti = (s: Stato) => {
      let n = 0;
      while (n < s.inseriti.length && s.inseriti[n] === s.sequenza[n]) n++;
      return n;
    };
    return {
      iniziale: { t: 0, inseriti: [], sequenza },
      comandi: { inseriti: [] },
      passo: (s, dt, c) => ({ ...s, t: s.t + dt, inseriti: c.inseriti }),
      finito: (s) => s.t >= fineMostra + TEMPO_RISPOSTA,
      alFine: (s) => onFine(giusti(s) / lunghezza),
    };
  });

  const fineMostra = lunghezza * PASSO + 0.4;
  const mostra = stato.t < fineMostra;
  const indicePasso = Math.floor(stato.t / PASSO);
  const acceso = mostra && stato.t - indicePasso * PASSO < ACCESA ? stato.sequenza[indicePasso] : undefined;

  function premi(modulo: number) {
    if (mostra) return;
    suona("CLIC");
    // Dai comandi, non dallo stato: due tocchi rapidissimi nello stesso fotogramma contano entrambi.
    const inseriti = [...sim.comandi().inseriti, modulo];
    const sbagliato = inseriti[inseriti.length - 1] !== stato.sequenza[inseriti.length - 1];
    if (sbagliato || inseriti.length === lunghezza) {
      if (sbagliato) suona("ERRORE");
      sim.concludi((s) => ({ ...s, inseriti }));
    } else {
      sim.imposta({ inseriti });
    }
  }

  return (
    <div className={stili.gioco}>
      {mostra ? (
        <p className={stili.lettura}>
          OSSERVA · <strong>{Math.min(indicePasso + 1, lunghezza)}</strong>/{lunghezza}
        </p>
      ) : (
        <>
          <BarraTempo trascorso={stato.t - fineMostra} durata={TEMPO_RISPOSTA} />
          <p className={stili.lettura}>
            RIPETI · <strong>{stato.inseriti.length}</strong>/{lunghezza}
          </p>
        </>
      )}
      <div className={stili.pad} style={{ "--colonne": moduli === 6 ? 3 : 2 } as CSSProperties}>
        {Array.from({ length: moduli }, (_, i) => (
          <button
            key={i}
            type="button"
            className={acceso === i ? stili.acceso : ""}
            disabled={mostra}
            onClick={() => premi(i)}
          >
            {NOMI[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
