/**
 * ============================================================================
 * SchermataBriefing.tsx — L'ordine di missione, prima della Preparazione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §16.5.3 (v3.4), §14.4 (contratti di missione).
 *
 * È il "fascicolo" che il Capitano legge prima di scegliere crew e carico:
 *   - la SCHEDA della missione (pianeta, durata, nave, rischio);
 *   - il CONTESTO: perché siete lì;
 *   - gli OBIETTIVI, incluso quello RISERVATO di V.A.L.E. (accesso negato:
 *     il mistero è dichiarato fin dall'inizio);
 *   - l'OBIETTIVO FINALE e la scala degli esiti (★★★ … missione perduta);
 *   - COME SI GIOCA, in quattro righe.
 *
 * I testi stanno in content/briefing.ts: qui c'è solo l'impaginazione.
 *
 * LAYOUT
 *   Mobile: una colonna che scorre, con il pulsante sempre in fondo.
 *   Desktop (≥ 1100px): fascicolo a sinistra (scheda, contesto, obiettivi),
 *   esiti e regole a destra.
 *
 * Come le altre schermate nasce dal monitor spento (si arriva dal titolo)
 * e lo spegne quando si accetta l'incarico.
 * ============================================================================
 */

import { BRIEFING } from "../../content/briefing";
import { suona } from "../audio";
import { Monitor } from "../cornice/Monitor";
import { PannelloFrontale } from "../cornice/PannelloFrontale";
import { useAccensione } from "../cornice/useAccensione";
import stili from "./SchermataBriefing.module.css";

interface Props {
  seed: string;
  onAccetta: () => void;
}

/** ★★★ / ★★☆ / … / ✕ per la scala degli esiti. */
function stelle(n: number): string {
  return n === 0 ? "✕" : "★".repeat(n) + "☆".repeat(3 - n);
}

export function SchermataBriefing({ seed, onAccetta }: Props) {
  // Si arriva sempre dal titolo, che ha spento il monitor.
  const tubo = useAccensione(true);

  function accetta() {
    suona("CONFERMA");
    tubo.spegni(onAccetta);
  }

  return (
    <Monitor
      frontale={<PannelloFrontale onApriTerminale={null} allerta={false} standby={tubo.fase === "SPENTO"} />}
      fase={tubo.fase}
      onFineTransizione={tubo.fineTransizione}
      didascalia="ORDINE DI MISSIONE · DOCUMENTO RISERVATO"
    >
      <div className={stili.schermo}>
        <header className={stili.intestazione}>
          <span>{BRIEFING.mittente}</span>
          <span className={stili.protocollo}>
            {BRIEFING.protocollo} · PARTITA {seed}
          </span>
        </header>

        <main className={stili.griglia}>
          <article className={stili.fascicolo}>
            {/* \u2060 = "word joiner": impedisce di andare a capo dentro «E-17». */}
            <h1 className={stili.titolo}>{BRIEFING.titolo.replace("E-17", "E\u2060-\u206017")}</h1>

            <dl className={stili.scheda}>
              {BRIEFING.scheda.map((v) => (
                <div key={v.etichetta}>
                  <dt>{v.etichetta}</dt>
                  <dd>{v.valore}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h2 className={stili.sezione}>CONTESTO</h2>
              {BRIEFING.contesto.map((p) => (
                <p key={p} className={stili.paragrafo}>
                  {p}
                </p>
              ))}
            </section>

            <section>
              <h2 className={stili.sezione}>OBIETTIVI</h2>
              <ol className={stili.obiettivi}>
                {BRIEFING.obiettivi.map((o) => (
                  <li key={o.testo} className={o.tipo === "RISERVATO" ? stili.riservato : ""}>
                    <span className={stili.tipo}>{o.tipo}</span>
                    <span>{o.testo}</span>
                  </li>
                ))}
              </ol>
            </section>
          </article>

          <aside className={stili.laterale}>
            <section className={stili.finale}>
              <h2 className={stili.sezione}>OBIETTIVO FINALE</h2>
              <p className={stili.obiettivoFinale}>{BRIEFING.obiettivoFinale}</p>
              <ul className={stili.esiti}>
                {BRIEFING.esiti.map((e) => (
                  <li key={e.titolo} className={e.stelle === 0 ? stili.perduta : ""}>
                    <span className={stili.stelle} aria-label={`${e.stelle} stelle`}>
                      {stelle(e.stelle)}
                    </span>
                    <span>
                      <strong>{e.titolo}</strong> — {e.testo}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={stili.sezione}>COME SI GIOCA</h2>
              <ul className={stili.regole}>
                {BRIEFING.comeSiGioca.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          </aside>
        </main>

        <footer className={stili.piede}>
          <span className={stili.domanda}>{BRIEFING.domanda}</span>
          <button type="button" className={stili.accetta} onClick={accetta} autoFocus>
            Accetta e prepara ▶
          </button>
        </footer>
      </div>
    </Monitor>
  );
}
