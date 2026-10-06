/**
 * ============================================================================
 * SelezioneCrew.tsx — I 10 candidati: il Capitano ne sceglie 4
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1, §7.2 (scheda membro), §7.3.
 *
 * Ogni candidato è un PULSANTE (aria-pressed = scelto): si sceglie e si
 * toglie con un clic, anche da tastiera. Quando la crew è al completo, i
 * candidati non scelti si disattivano: per cambiare qualcuno prima se ne
 * toglie uno. È la stessa regola del reducer (engine/preparazione), qui
 * solo resa visibile.
 *
 * COSA MOSTRA LA SCHEDA
 * - le 7 abilità come piccole colonne: si confrontano a colpo d'occhio
 *   (la più alta è evidenziata: è "il mestiere" del candidato);
 * - tratto e personalità: oggi sono testo, più avanti cambieranno dialoghi
 *   ed eventi (DESIGN §7.3);
 * - FIDUCIA IN V.A.L.E.: è una scelta anche questa. Una crew che si fida
 *   la seguirà; una diffidente si accorgerà prima delle incoerenze;
 * - il peso, perché conta nei 1000 kg del carico.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { LISTA_CANDIDATI } from "../../content/candidati";
import { ABILITA_GENERALI, ABILITA_TECNICHE, type Abilita, type Preparazione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { etichetta } from "../format";
import type { DispatchPreparazione } from "../usePreparazione";
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
}

export function SelezioneCrew({ prep, dispatch }: Props) {
  const richiesti = BALANCE.preparazione.crewRichiesta;
  const completa = prep.crew.length >= richiesti;

  return (
    <Finestra titolo="Candidati" destra={`CREW ${prep.crew.length}/${richiesti}`}>
      <p className={stili.intro}>
        Scegli {richiesti} membri su {LISTA_CANDIDATI.length}. Nessun reclutamento dopo la partenza.
      </p>

      <ul className={stili.lista}>
        {LISTA_CANDIDATI.map((c) => {
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
                <span className={stili.testa}>
                  <span className={stili.nome}>{c.nome}</span>
                  <span className={stili.ruolo}>{etichetta(c.ruolo)}</span>
                  <span className={stili.peso}>{c.peso} kg</span>
                </span>

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

                <span className={stili.dettagli}>
                  <span>TRATTO · {etichetta(c.tratto)}</span>
                  <span className={stili.personalita}>
                    {[c.personalita.approccio, c.personalita.socialita, c.personalita.mentalita].map(etichetta).join(" · ")}
                  </span>
                  <span className={stili.fiducia}>FIDUCIA IN V.A.L.E. {c.fiduciaVale}</span>
                </span>

                <span className={stili.stato} aria-hidden="true">
                  {scelto ? "▣ IN MISSIONE" : "□ DISPONIBILE"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Finestra>
  );
}
