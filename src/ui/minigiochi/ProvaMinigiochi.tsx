/**
 * ============================================================================
 * ProvaMinigiochi.tsx — Banco di prova dei minigiochi (solo per chi sviluppa)
 * ============================================================================
 *
 * Si apre con ?prova=minigiochi nell'indirizzo. Permette di giocare ogni
 * minigioco a ogni livello senza dover aspettare che compaia in partita:
 * utile per collaudarli e tararli. Il gioco normale non lo mostra mai.
 *
 * `key` combina tipo, livello e un contatore: cambiando uno dei tre React
 * ricrea il minigioco da zero (nuovo bersaglio, nuovo tempo).
 * ============================================================================
 */

import { useState } from "react";
import { TIPI_MINIGIOCO, type TipoMinigioco } from "../../engine/types";
import { Confronto } from "./giochi/Confronto";
import { Manovra } from "./giochi/Manovra";
import { Pressione } from "./giochi/Pressione";
import { Radar } from "./giochi/Radar";
import { Ricerca } from "./giochi/Ricerca";
import { Sequenza } from "./giochi/Sequenza";
import { Sintonia } from "./giochi/Sintonia";
import { Tempismo } from "./giochi/Tempismo";
import stili from "./FinestraMinigioco.module.css";

const GIOCHI = { RADAR: Radar, SINTONIA: Sintonia, SEQUENZA: Sequenza, PRESSIONE: Pressione, MANOVRA: Manovra, TEMPISMO: Tempismo, CONFRONTO: Confronto, RICERCA: Ricerca };

export function ProvaMinigiochi() {
  const [tipo, setTipo] = useState<TipoMinigioco>("RADAR");
  const [livello, setLivello] = useState<1 | 2 | 3>(1);
  const [giro, setGiro] = useState(0);
  const [punteggio, setPunteggio] = useState<number | null>(null);
  const Gioco = GIOCHI[tipo];

  function ricomincia() {
    setPunteggio(null);
    setGiro((g) => g + 1);
  }

  return (
    <div className={stili.sfondo}>
      <section className={stili.finestra} aria-label="Banco di prova dei minigiochi">
        <header className={stili.barra}>
          <span>BANCO DI PROVA · MINIGIOCHI</span>
          <span>{punteggio === null ? "IN CORSO" : `PUNTEGGIO ${Math.round(punteggio * 100)}%`}</span>
        </header>
        <div className={stili.corpo}>
          <div className={stili.azioni}>
            <select
              value={tipo}
              aria-label="Minigioco"
              onChange={(e) => {
                setTipo(e.target.value as TipoMinigioco);
                ricomincia();
              }}
            >
              {TIPI_MINIGIOCO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={livello}
              aria-label="Livello"
              onChange={(e) => {
                setLivello(Number(e.target.value) as 1 | 2 | 3);
                ricomincia();
              }}
            >
              <option value={1}>Livello 1</option>
              <option value={2}>Livello 2</option>
              <option value={3}>Livello 3</option>
            </select>
            <button type="button" className={stili.secondario} onClick={ricomincia}>
              Ricomincia
            </button>
          </div>
          {punteggio === null && <Gioco key={`${tipo}-${livello}-${giro}`} difficolta={livello} onFine={setPunteggio} />}
        </div>
      </section>
    </div>
  );
}
