/**
 * ============================================================================
 * SelezioneCrew.tsx — I 6 candidati della partita: il Capitano ne sceglie 4
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1, §7.2 (scheda membro), §7.3.
 *
 * I CANDIDATI DELLA PARTITA (v3.7.3)
 * Il catalogo ne ha 10, ma ogni partita ne presenta 6, estratti col seed
 * (engine/preparazione/candidati.ts). Le schede stanno su file da due.
 *
 * LA SCHEDA (v3.7.2)
 * A riposo mostra solo il RITRATTO (o il segnaposto), il NOME e la
 * PROFESSIONE: si sceglie "a pelle", come guardando dei fascicoli.
 * Passando sopra col mouse (o arrivandoci con il tasto Tab) il fascicolo si
 * "accende" sopra il ritratto con un'animazione a scatti da tubo catodico:
 * abilità, tratto, personalità, fiducia in V.A.L.E. e peso.
 * Sui telefoni (niente mouse, niente hover) i dettagli stanno sempre sotto
 * il nome: la regola è nel CSS (@media (hover: none)).
 *
 * TUTTO IN CSS
 * L'apparizione non usa stato React né useEffect: il browser applica
 * l'animazione quando la scheda è in :hover o :focus-visible. React disegna
 * sempre tutto (anche i dettagli nascosti), così gli screen reader leggono
 * l'intera scheda.
 *
 * La cornice (titolo, contatore CREW x/4, tasto "riduci") la dà la
 * finestra mobile della Preparazione (v3.7.4): qui solo il contenuto.
 *
 * Ogni candidato è un PULSANTE (aria-pressed = scelto): si sceglie e si
 * toglie con un clic, anche da tastiera. Quando la crew è al completo, i
 * candidati non scelti si disattivano: per cambiare qualcuno prima se ne
 * toglie uno. È la stessa regola del reducer (engine/preparazione).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { LISTA_CANDIDATI } from "../../content/candidati";
import { candidatiProposti } from "../../engine/preparazione";
import { ABILITA_GENERALI, ABILITA_TECNICHE, type Abilita, type Preparazione } from "../../engine/types";
import { etichetta } from "../format";
import type { DispatchPreparazione } from "../usePreparazione";
import { Ritratto } from "./Ritratto";
import stili from "./SelezioneCrew.module.css";

/** Sigle di tre lettere: entrano nelle colonne anche su un telefono. */
const SIGLE: Record<Abilita, string> = {
  INGEGNERIA: "ING",
  SCIENZA: "SCI",
  PILOTAGGIO: "PIL",
  MEDICINA: "MED",
  EVA: "EVA",
  VELOCITA: "VEL",
  PRECISIONE: "PRE",
};
const ORDINE_ABILITA: readonly Abilita[] = [...ABILITA_TECNICHE, ...ABILITA_GENERALI];
// Una lista "allargata" al tipo Abilita: così .includes accetta anche VELOCITA.
const TECNICHE: readonly Abilita[] = ABILITA_TECNICHE;

interface Props {
  prep: Preparazione;
  dispatch: DispatchPreparazione;
  /** Il seed della partita: decide quali candidati si presentano. */
  seed: string;
}

export function SelezioneCrew({ prep, dispatch, seed }: Props) {
  const richiesti = BALANCE.preparazione.crewRichiesta;
  const completa = prep.crew.length >= richiesti;
  // I 6 candidati di questa partita, estratti col seed tra i 10 del catalogo.
  const candidati = candidatiProposti(seed, LISTA_CANDIDATI, BALANCE.preparazione.candidatiProposti);

  return (
    <>
      <ul className={stili.lista}>
        {candidati.map((c) => {
          const scelto = prep.crew.includes(c.id);
          // La migliore abilità TECNICA: il "mestiere" da evidenziare.
          const migliore = Math.max(...ABILITA_TECNICHE.map((a) => c.abilita[a]));
          return (
            <li key={c.id}>
              <button
                type="button"
                className={stili.candidato}
                aria-pressed={scelto}
                disabled={!scelto && completa}
                onClick={() => dispatch({ tipo: "SCEGLI_CANDIDATO", id: c.id })}
              >
                {/* --- Sempre visibili: nome e professione. Vengono PRIMA nel codice
                    (così lo screen reader legge "Mara, Ingegnere…"); il CSS
                    mette il ritratto sopra con `order`. --- */}
                <span className={stili.nome}>{c.nome}</span>
                <span className={stili.ruolo}>{etichetta(c.ruolo)}</span>
                {/* --- Il ritratto (o il segnaposto) --- */}
                <span className={stili.ritratto}>
                  <Ritratto id={c.id} />
                  <span className={stili.righe} aria-hidden="true" />
                  {scelto && <span className={stili.bollino}>▣ IN MISSIONE</span>}
                </span>

                {/* --- Il fascicolo: copre tutta la scheda e si "accende" all'hover --- */}
                <span className={stili.fascicolo}>
                  <span className={stili.abilita}>
                    {ORDINE_ABILITA.map((a) => {
                      const v = c.abilita[a];
                      const forte = TECNICHE.includes(a) && v === migliore;
                      return (
                        <span key={a} className={`${stili.cella} ${forte ? stili.forte : ""}`}>
                          <span className={stili.sigla}>{SIGLE[a]}</span>
                          <span className={stili.valore}>{v}</span>
                          <span className={stili.traccia} aria-hidden="true">
                            <span style={{ width: `${v * 10}%` }} />
                          </span>
                        </span>
                      );
                    })}
                  </span>
                  <span className={stili.tratto}>{etichetta(c.tratto)}</span>
                  <span className={stili.personalita}>
                    {[c.personalita.approccio, c.personalita.socialita, c.personalita.mentalita].map(etichetta).join(" · ")}
                  </span>
                  <span className={stili.piede}>
                    <span className={stili.fiducia}>V.A.L.E. {c.fiduciaVale}</span>
                    <span>{c.peso} kg</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
