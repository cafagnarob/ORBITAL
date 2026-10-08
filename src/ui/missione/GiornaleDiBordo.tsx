/**
 * ============================================================================
 * GiornaleDiBordo.tsx — La pagina di diario del rapporto serale
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.2 (come il diario di 60 Seconds).
 *
 * Compare da sola quando il gioco è in RAPPORTO (22:00), sopra la
 * schermata: è il momento in cui la giornata diventa RACCONTO. Le righe
 * le ha scritte il motore (engine/storia/diario.ts): eventi, scelte, chi ha
 * cambiato idea su V.A.L.E., risorse che finiscono.
 * "Buonanotte" spegne il monitor: al buio si chiude il rapporto e la
 * notte scorre; al mattino il monitor si riaccende (SchermataMissione).
 *
 * Come la FinestraEvento, si "deriva" dallo stato: nessun useState per
 * aprirla o chiuderla, nessun useEffect.
 *
 * LE RAZIONI (v3.4)
 * Sotto il diario, il Capitano decide cibo e acqua per ognuno
 * (PannelloRazioni). La scelta è stato dell'interfaccia finché non si
 * preme Buonanotte: vive in useState dentro RapportoSerale, che riceve
 * `key={giorno}`. Ogni sera la key cambia, React ricrea il componente e le
 * razioni ripartono dalle predefinite: niente useEffect per "resettarle".
 * ============================================================================
 */

import { useId, useState } from "react";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { costoRazioni, razioniPredefinite, type RazioniSerali } from "../../engine/crew/razioni";
import { paginaDiario } from "../../engine/storia/diario";
import { scomponiTempo } from "../../engine/clock";
import type { StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import { ConIcone } from "../components/icone/ConIcone";
import stili from "./GiornaleDiBordo.module.css";
import { PannelloRazioni } from "./PannelloRazioni";

interface Props {
  stato: StatoMissione;
  /** Distribuisce le razioni, spegne il monitor, fa passare la notte e lo riaccende sul mattino. */
  onBuonanotte: (razioni: RazioniSerali) => void;
}

export function GiornaleDiBordo({ stato, onBuonanotte }: Props) {
  if (stato.statoGioco !== "RAPPORTO") return null;
  const { giorno } = scomponiTempo(stato.tempo);
  return <RapportoSerale key={giorno} stato={stato} onBuonanotte={onBuonanotte} />;
}

/** La pagina vera e propria: esiste solo durante il rapporto, una per sera. */
function RapportoSerale({ stato, onBuonanotte }: Props) {
  const idTitolo = useId();
  // Inizializzazione pigra: le razioni predefinite si calcolano una volta, all'apertura.
  const [razioni, setRazioni] = useState(() => razioniPredefinite(stato, CONTESTO_GIOCO));

  const { giorno } = scomponiTempo(stato.tempo);
  const righe = paginaDiario(stato, giorno);
  const r = stato.risorse;
  const costo = costoRazioni(stato, CONTESTO_GIOCO, razioni);
  const troppo = costo.cibo > r.cibo || costo.acqua > r.acqua;

  return (
    <div className={stili.sfondo}>
      <article className={stili.pagina} role="dialog" aria-modal="true" aria-labelledby={idTitolo}>
        <header className={stili.barra}>
          <h2 id={idTitolo}>GIORNALE DI BORDO</h2>
          <span>GIORNO {String(giorno).padStart(2, "0")}</span>
        </header>

        <ol className={stili.righe}>
          {righe.map((v, i) => (
            // Ogni riga compare con un piccolo ritardo, come battuta a macchina.
            <li key={i} style={{ animationDelay: `${i * 0.25}s` }}>
              {v.testo}
            </li>
          ))}
        </ol>

        <p className={stili.bilancio}>
          <ConIcone
            testo={`CIBO ${r.cibo} · ACQUA ${r.acqua} · O₂ ${r.ossigeno} · ENERGIA ${r.energia} · CARBURANTE ${r.carburante}`}
          />
        </p>

        <PannelloRazioni stato={stato} razioni={razioni} onCambia={setRazioni} />

        <footer className={stili.piede}>
          {troppo && <span className={stili.avviso}>▲ Non ci sono scorte per queste razioni</span>}
          <Pulsante variante="primario" disabled={troppo} onClick={() => onBuonanotte(razioni)}>
            Distribuisci e dormi ▶
          </Pulsante>
        </footer>
      </article>
    </div>
  );
}
