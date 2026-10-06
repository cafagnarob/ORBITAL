/**
 * ============================================================================
 * SchermataEpilogo.tsx — Com'è finita: finale, crew, direttiva, diario
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §15 (finali), §10.2.
 *
 * Compare quando la missione è CONCLUSA. Racconta:
 *   1. il FINALE scelto dal motore (titolo + epilogo);
 *   2. una riga per ogni membro della crew (vivo o morto, e da che parte
 *      stava con V.A.L.E.);
 *   3. la DIRETTIVA di V.A.L.E., rivelata SEMPRE: anche chi non l'ha
 *      scoperta deve sapere con chi ha viaggiato. È la "risposta" della
 *      partita, e la ragione per giocarne un'altra;
 *   4. il GIORNALE DI BORDO completo, giorno per giorno.
 * "Nuova missione" torna alla Preparazione con un seed nuovo.
 * ============================================================================
 */

import { CONTESTO_GIOCO } from "../../content/contesto";
import { epilogo } from "../../engine/storia/fine";
import type { StatoMissione } from "../../engine/types";
import { Pulsante } from "../components/Pulsante";
import stili from "./SchermataEpilogo.module.css";

interface Props {
  stato: StatoMissione;
  onNuovaPartita: () => void;
}

export function SchermataEpilogo({ stato, onNuovaPartita }: Props) {
  if (stato.statoGioco !== "CONCLUSA") return null;
  const e = epilogo(stato, CONTESTO_GIOCO);
  const direttiva = CONTESTO_GIOCO.catalogoDirettive[stato.vale.direttiva];
  const scoperta = stato.conoscenza.scoperte.includes("DIRETTIVA_RIVELATA");

  // Il diario raggruppato per giorno: { 1: [...], 2: [...] }.
  const giorni = new Map<number, string[]>();
  for (const v of stato.diario) giorni.set(v.giorno, [...(giorni.get(v.giorno) ?? []), v.testo]);

  return (
    <div className={stili.sfondo}>
      <article className={stili.epilogo} aria-labelledby="titolo-epilogo">
        <p className={stili.etichetta}>MISSIONE E-17 · CONCLUSA · GIORNO {e.giorni}</p>
        <h1 id="titolo-epilogo" className={`${stili.titolo} ${stili[e.finale?.tono ?? "normale"]}`}>
          {e.finale?.titolo ?? "Fine"}
        </h1>
        <p className={stili.testo}>{e.testo}</p>

        <section className={stili.sezione}>
          <h2>LA CREW</h2>
          <ul className={stili.crew}>
            {e.crew.map((c) => (
              <li key={c.id}>
                <strong>{c.nome}</strong> {c.riga.replace(c.nome, "").trim()}
              </li>
            ))}
          </ul>
        </section>

        <section className={`${stili.sezione} ${stili.direttiva}`}>
          <h2>LA DIRETTIVA DI V.A.L.E.</h2>
          <p className={stili.nomeDirettiva}>
            {direttiva?.id} · {direttiva?.nome.toUpperCase()}
          </p>
          <p>
            Classificazione rispetto alla missione: <strong>{direttiva?.classe.replaceAll("_", " ")}</strong>.{" "}
            {scoperta ? "L'avevate scoperta." : "Non l'avete mai saputo."}
          </p>
        </section>

        <section className={stili.sezione}>
          <h2>GIORNALE DI BORDO</h2>
          {[...giorni.entries()].map(([giorno, righe]) => (
            <div key={giorno} className={stili.giorno}>
              <h3>GIORNO {String(giorno).padStart(2, "0")}</h3>
              <ul>
                {righe.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <footer className={stili.piede}>
          <span>PARTITA {stato.seed}</span>
          <Pulsante variante="primario" onClick={onNuovaPartita}>
            Nuova missione ▶
          </Pulsante>
        </footer>
      </article>
    </div>
  );
}
