/**
 * ============================================================================
 * TerminaleLog.tsx — La finestrella del terminale: TUTTI i log di bordo (v3.9)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.2–4.3 (log e codici), §3.7 (v3.9).
 *
 * Il canale di V.A.L.E. ora contiene solo il dialogo. Qui finisce tutto il
 * resto, in ordine cronologico e in formato "terminale" compatto: righe di
 * SISTEMA, voci della CREW, le battute del Capitano e di V.A.L.E. Anche i
 * CODICI segreti: quelli della storia e quelli che affiorano a caso nel
 * rumore dei sistemi (engine/terminale/codiciCasuali.ts).
 *
 * Ogni riga ha il segno ◇ per SEGNALARLA: i codici che contiene finiscono
 * tra i frammenti del Terminale SVC-07 (che resta com'era: lì si inseriscono).
 * Regola del DESIGN: le righe con un codice NON sono evidenziate.
 *
 * FILTRO: "tutto" o "solo sistema" (stato dell'interfaccia, useState: non
 * cambia la partita). Lo scorrimento resta in fondo con column-reverse,
 * come nel canale: nessun useEffect.
 * ============================================================================
 */

import { useState } from "react";
import type { StatoMissione, VoceLog } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { formattaOra } from "../format";
import type { Dispatch } from "../useMissione";
import stili from "./TerminaleLog.module.css";

type Filtro = "TUTTO" | "SISTEMA";

/** L'etichetta breve della fonte, in colonna. */
const FONTE: Record<VoceLog["fonte"], string> = { SISTEMA: "SYS", CREW: "CREW", VALE: "VALE", CAPITANO: "CAP" };

export function TerminaleLog({ stato, dispatch }: { stato: StatoMissione; dispatch: Dispatch }) {
  const [filtro, setFiltro] = useState<Filtro>("TUTTO");
  const segnalate = new Set(stato.terminale.segnalate);
  const righe = stato.log
    .map((voce, indice) => ({ voce, indice }))
    .filter(({ voce }) => filtro === "TUTTO" || voce.fonte === "SISTEMA")
    .reverse();

  const pulsanteFiltro = (f: Filtro, testo: string) => (
    <button type="button" className={stili.filtro} aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
      {testo}
    </button>
  );

  return (
    <Finestra
      variante="console"
      titolo="Terminale // Log di bordo"
      className={stili.finestra}
      destra={
        <span className={stili.destra}>
          {pulsanteFiltro("TUTTO", "TUTTO")}
          {pulsanteFiltro("SISTEMA", "SYS")}
          <span className={stili.contatore} title="Righe segnalate: i codici vanno nel Terminale SVC-07">
            ◆ {segnalate.size}
          </span>
        </span>
      }
    >
      <ol className={stili.righe} aria-label="Log di bordo">
        {righe.map(({ voce, indice }) => {
          const segnalata = segnalate.has(indice);
          return (
            <li key={indice} className={`${stili.riga} ${stili[voce.fonte.toLowerCase()] ?? ""}`}>
              <time className={stili.ora}>{formattaOra(voce.tempo)}</time>
              <span className={stili.fonte}>{FONTE[voce.fonte]}</span>
              <span className={stili.testo}>{voce.testo}</span>
              <button
                type="button"
                className={`${stili.segno} ${segnalata ? stili.segnalata : ""}`}
                aria-pressed={segnalata}
                aria-label={`Segnala la riga delle ${formattaOra(voce.tempo)}`}
                onClick={() => dispatch({ tipo: "SEGNALA_VOCE", indice })}
              >
                {segnalata ? "◆" : "◇"}
              </button>
            </li>
          );
        })}
      </ol>
    </Finestra>
  );
}
