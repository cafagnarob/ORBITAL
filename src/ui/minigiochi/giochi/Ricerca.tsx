/**
 * ============================================================================
 * Ricerca.tsx — Minigioco RICERCA: trova le casse con i codici richiesti
 * ============================================================================
 *
 * Per: inventario della stiva, razionamento, recupero dal relitto.
 *
 * COME SI GIOCA
 * In alto i codici da trovare; sotto la stiva (16 casse). Tocca le casse
 * giuste prima che scada il tempo. Ogni errore toglie 15 punti su 100.
 * Più alto il livello, più codici simili tra loro (stessa lettera).
 * ============================================================================
 */

import { suona } from "../../audio";
import { BarraTempo } from "./BarraTempo";
import { limita, useSimulazione, type PropsGioco } from "../simulazione";
import stili from "./giochi.module.css";

const CASSE = 16;
const DA_TROVARE = 3;

/** Codici unici tipo "C-17". Al livello alto si usano meno lettere: si confondono di più. */
function creaCodici(lettere: string): string[] {
  const codici = new Set<string>();
  while (codici.size < CASSE) {
    const l = lettere[Math.floor(Math.random() * lettere.length)] ?? "A";
    codici.add(`${l}-${10 + Math.floor(Math.random() * 90)}`);
  }
  return [...codici];
}

interface Comandi {
  trovati: string[];
  errori: number;
  sbagliata: string | null;
}

export function Ricerca({ difficolta, onFine }: PropsGioco) {
  const durata = [18, 15, 12][difficolta - 1] ?? 15;
  const lettere = ["ABCDEF", "ABCD", "AB"][difficolta - 1] ?? "ABCD";
  const punteggio = (c: Comandi) => limita(c.trovati.length / DA_TROVARE - 0.15 * c.errori);

  const [stato, sim] = useSimulazione(() => {
    const codici = creaCodici(lettere);
    const richiesti = [...codici].sort(() => Math.random() - 0.5).slice(0, DA_TROVARE);
    const comandi: Comandi = { trovati: [], errori: 0, sbagliata: null };
    return {
      iniziale: { t: 0, codici, richiesti, ...comandi },
      comandi,
      passo: (s: { t: number; codici: string[]; richiesti: string[] } & Comandi, dt: number, c: Comandi) => ({ ...s, ...c, t: s.t + dt }),
      finito: (s) => s.t >= durata,
      alFine: (s) => onFine(punteggio(s)),
    };
  });

  function apri(codice: string) {
    const c = sim.comandi();
    if (c.trovati.includes(codice)) return;
    if (stato.richiesti.includes(codice)) {
      suona("CASSA");
      const trovati = [...c.trovati, codice];
      if (trovati.length === DA_TROVARE) sim.concludi((s) => ({ ...s, ...c, trovati }));
      else sim.imposta({ trovati, sbagliata: null });
    } else {
      suona("ERRORE");
      sim.imposta({ errori: c.errori + 1, sbagliata: codice });
    }
  }

  return (
    <div className={stili.gioco}>
      <BarraTempo trascorso={stato.t} durata={durata} />
      <p className={stili.richiesti}>
        {stato.richiesti.map((r) => (
          <span key={r} className={stato.trovati.includes(r) ? stili.fatto : ""}>
            {r}
          </span>
        ))}
      </p>
      <div className={stili.casse}>
        {stato.codici.map((c) => (
          <button
            key={c}
            type="button"
            className={stato.trovati.includes(c) ? stili.trovata : stato.sbagliata === c ? stili.sbagliata : ""}
            onClick={() => apri(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <p className={stili.aiuto}>Errori: {stato.errori} (ognuno costa 15 punti)</p>
    </div>
  );
}
