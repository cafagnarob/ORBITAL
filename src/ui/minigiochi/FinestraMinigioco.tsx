/**
 * ============================================================================
 * FinestraMinigioco.tsx — La finestra che propone e ospita un minigioco
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9.2 (minigiochi, v3.6).
 *
 * Compare quando lo stato ha un minigioco in attesa (il motore l'ha
 * proposto all'avvio di un task). Il tempo è fermo finché non si chiude.
 *
 * TRE FASI (stato dell'interfaccia, useState)
 *   INTRO   chi lavora, a cosa, quanto rischia; «Aiuta» o «Lascia fare»;
 *   GIOCO   il minigioco giusto per il tipo (RADAR, SINTONIA…);
 *   ESITO   il punteggio e il bonus; «Continua» manda RISOLVI_MINIGIOCO.
 * «Lascia fare» manda subito RISOLVI_MINIGIOCO con punteggio 0.
 *
 * `key={idTask}`: per ogni minigioco nuovo React ricrea la finestra
 * interna, e le fasi ripartono da INTRO senza nessun useEffect.
 *
 * COME SI SCEGLIE IL GIOCO
 * Un oggetto "tipo → componente" (GIOCHI): aggiungere un minigioco vuol
 * dire scrivere il componente e aggiungere una riga qui. TypeScript
 * controlla che ci sia un componente per OGNI tipo (Record<TipoMinigioco, …>).
 * ============================================================================
 */

import { useState, type ComponentType } from "react";
import { CATALOGO_TASK } from "../../content/tasks";
import { bonusMinigioco } from "../../engine/tasks/minigiochi";
import type { MinigiocoInAttesa, StatoMissione, TipoMinigioco } from "../../engine/types";
import { suona } from "../audio";
import type { Dispatch } from "../useMissione";
import { Confronto } from "./giochi/Confronto";
import { Manovra } from "./giochi/Manovra";
import { Pressione } from "./giochi/Pressione";
import { Radar } from "./giochi/Radar";
import { Ricerca } from "./giochi/Ricerca";
import { Sequenza } from "./giochi/Sequenza";
import { Sintonia } from "./giochi/Sintonia";
import { Tempismo } from "./giochi/Tempismo";
import type { PropsGioco } from "./simulazione";
import stili from "./FinestraMinigioco.module.css";

const GIOCHI: Record<TipoMinigioco, ComponentType<PropsGioco>> = {
  RADAR: Radar,
  SINTONIA: Sintonia,
  SEQUENZA: Sequenza,
  PRESSIONE: Pressione,
  MANOVRA: Manovra,
  TEMPISMO: Tempismo,
  CONFRONTO: Confronto,
  RICERCA: Ricerca,
};

const NOMI_DIFFICOLTA = ["", "BASSA", "MEDIA", "ALTA"] as const;

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
}

export function FinestraMinigioco({ stato, dispatch }: Props) {
  const attesa = stato.minigioco;
  if (!attesa) return null;
  return <Contenuto key={attesa.idTask} stato={stato} attesa={attesa} dispatch={dispatch} />;
}

type Fase = { tipo: "INTRO" } | { tipo: "GIOCO" } | { tipo: "ESITO"; punteggio: number };

function Contenuto({ stato, attesa, dispatch }: Props & { attesa: MinigiocoInAttesa }) {
  const [fase, setFase] = useState<Fase>({ tipo: "INTRO" });
  const task = stato.tasks[attesa.idTask];
  const def = task ? CATALOGO_TASK[task.idDefinizione] : undefined;
  const nome = task ? (stato.crew[task.responsabile]?.nome ?? "?") : "?";
  const info = def?.minigioco;
  const Gioco = GIOCHI[attesa.tipo];

  function risolvi(punteggio: number) {
    suona("CLIC");
    dispatch({ tipo: "RISOLVI_MINIGIOCO", punteggio });
  }

  return (
    <div className={stili.sfondo}>
      <section className={stili.finestra} role="dialog" aria-modal="true" aria-label={`Assistenza: ${info?.titolo ?? ""}`}>
        <header className={stili.barra}>
          <span>⚡ ASSISTENZA DEL CAPITANO</span>
          <span>DIFFICOLTÀ {NOMI_DIFFICOLTA[attesa.difficolta]}</span>
        </header>

        <div className={stili.corpo}>
          <h2 className={stili.titolo}>{info?.titolo ?? "Minigioco"}</h2>
          <p className={stili.sottotitolo}>
            {nome} · {def?.nome}
          </p>

          {fase.tipo === "INTRO" && (
            <>
              <p className={stili.istruzioni}>{info?.istruzioni}</p>
              <p className={stili.nota}>
                Se aiuti {nome}, il rischio del task può scendere fino a {bonusMinigioco(1)} punti. Se va male, non peggiora
                nulla. Il tempo è fermo.
              </p>
              <div className={stili.azioni}>
                <button type="button" className={stili.secondario} onClick={() => risolvi(0)}>
                  Lascia fare a {nome}
                </button>
                <button
                  type="button"
                  className={stili.primario}
                  autoFocus
                  onClick={() => {
                    suona("AVVIO");
                    setFase({ tipo: "GIOCO" });
                  }}
                >
                  Aiuta {nome} ▶
                </button>
              </div>
            </>
          )}

          {fase.tipo === "GIOCO" && (
            <Gioco difficolta={attesa.difficolta} onFine={(punteggio) => setFase({ tipo: "ESITO", punteggio })} />
          )}

          {fase.tipo === "ESITO" && (
            <>
              <p className={stili.esito}>
                PUNTEGGIO <strong>{Math.round(fase.punteggio * 100)}%</strong>
              </p>
              <p className={stili.istruzioni}>
                {bonusMinigioco(fase.punteggio) > 0
                  ? `Grazie al tuo aiuto il rischio del task scende di ${bonusMinigioco(fase.punteggio)} punti.`
                  : `Nessun miglioramento: ${nome} procede come previsto.`}
              </p>
              <div className={stili.azioni}>
                <button type="button" className={stili.primario} autoFocus onClick={() => risolvi(fase.punteggio)}>
                  Continua ▶
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
