/**
 * ============================================================================
 * PannelloRazioni.tsx — Chi mangia e chi beve stasera (rapporto serale)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.4 (razioni, fame e sete — v3.4).
 *
 * Una riga per ogni membro a bordo, con due interruttori a tre posizioni:
 * CIBO e ACQUA, ciascuno PIENA · ½ · NIENTE. Sotto il nome si vede come
 * starà DOMANI con questa scelta (fame, sete, task possibili, salute persa
 * stanotte): il Capitano decide sapendo cosa costa.
 *
 * STATO CONTROLLATO DAL GENITORE
 * Le razioni scelte non sono qui ma nel genitore (RapportoSerale), che le
 * passa con `razioni` e riceve i cambi con `onCambia`. Questo componente
 * mostra e basta: si chiama "componente controllato", come un <input>
 * con value + onChange. Così il pulsante Buonanotte, che sta fuori, legge
 * le stesse razioni senza doverle "chiedere" al pannello.
 * ============================================================================
 */

import { CONTESTO_GIOCO } from "../../content/contesto";
import {
  bisogniDopo,
  costoRazioni,
  livelloBisogno,
  NOMI_FAME,
  NOMI_SETE,
  RAZIONI,
  type Razione,
  type RazioniSerali,
} from "../../engine/crew/razioni";
import { membriAttivi } from "../../engine/storia/fazioni";
import type { StatoMissione } from "../../engine/types";
import { suona } from "../audio";
import { Icona } from "../components/icone/Icona";
import stili from "./PannelloRazioni.module.css";

interface Props {
  stato: StatoMissione;
  razioni: RazioniSerali;
  onCambia: (razioni: RazioniSerali) => void;
}

const ETICHETTE: Record<Razione, string> = { PIENA: "PIENA", MEZZA: "½", NIENTE: "—" };

/** Tono di un livello di bisogno 0–3: verde, ambra, rosso. */
const tono = (livello: number) => (livello >= 3 ? stili.critico : livello >= 2 ? stili.attenzione : "");

export function PannelloRazioni({ stato, razioni, onCambia }: Props) {
  const membri = membriAttivi(stato);
  const costo = costoRazioni(stato, CONTESTO_GIOCO, razioni);
  const r = stato.risorse;

  function imposta(id: string, risorsa: "cibo" | "acqua", valore: Razione) {
    const attuale = razioni[id] ?? { cibo: "NIENTE", acqua: "NIENTE" };
    suona("CLIC");
    onCambia({ ...razioni, [id]: { ...attuale, [risorsa]: valore } });
  }

  function aTutti(valore: Razione) {
    suona("CLIC");
    onCambia(Object.fromEntries(membri.map((m) => [m.id, { cibo: valore, acqua: valore }])));
  }

  return (
    <section className={stili.pannello} aria-label="Razioni della sera">
      <header className={stili.testa}>
        <h3>RAZIONI DELLA SERA</h3>
        <div className={stili.rapide}>
          <button type="button" onClick={() => aTutti("PIENA")}>
            Tutti piena
          </button>
          <button type="button" onClick={() => aTutti("MEZZA")}>
            Tutti ½
          </button>
        </div>
      </header>

      {/* Il conto: si vede subito se si sta dando più di quanto c'è. */}
      <p className={stili.conto}>
        <span className={costo.cibo > r.cibo ? stili.critico : ""}>
          <Icona tipo="cibo" /> CIBO {r.cibo} → {r.cibo - costo.cibo}
        </span>
        <span className={costo.acqua > r.acqua ? stili.critico : ""}>
          <Icona tipo="acqua" /> ACQUA {r.acqua} → {r.acqua - costo.acqua}
        </span>
      </p>

      <ul className={stili.elenco}>
        {membri.map((m) => {
          const scelta = razioni[m.id] ?? { cibo: "NIENTE", acqua: "NIENTE" };
          const dopo = bisogniDopo(m, scelta);
          const lf = livelloBisogno(dopo.fame);
          const ls = livelloBisogno(dopo.sete);
          return (
            <li key={m.id} className={stili.riga}>
              <div className={stili.chi}>
                <strong>{m.nome}</strong>
                <span className={stili.previsione}>
                  domani: <span className={tono(lf)}>{NOMI_FAME[lf]}</span> ·{" "}
                  <span className={tono(ls)}>{NOMI_SETE[ls]}</span> · {dopo.capacita} task
                  {dopo.danno > 0 && <span className={stili.critico}> · salute −{dopo.danno}</span>}
                </span>
              </div>
              {(["cibo", "acqua"] as const).map((risorsa) => (
                <div key={risorsa} className={stili.gruppo} role="group" aria-label={`${risorsa} per ${m.nome}`}>
                  <span className={stili.risorsa}>
                    <Icona tipo={risorsa} /> {risorsa.toUpperCase()}
                  </span>
                  {RAZIONI.map((valore) => (
                    <button
                      key={valore}
                      type="button"
                      aria-pressed={scelta[risorsa] === valore}
                      aria-label={`${risorsa} ${valore.toLowerCase()} per ${m.nome}`}
                      onClick={() => imposta(m.id, risorsa, valore)}
                    >
                      {ETICHETTE[valore]}
                    </button>
                  ))}
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
