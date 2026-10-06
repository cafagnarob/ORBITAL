/**
 * ============================================================================
 * TerminaleSvc.tsx — TERMINALE DI MANUTENZIONE // SVC-07
 * ============================================================================
 *
 * Riferimento: il pannello segreto del prototipo Missione (pulsante SVC).
 *
 *   sinistra → livello di accesso attuale, uscita del terminale,
 *              frammenti segnalati (clic per aggiungerli al codice),
 *              campo "> INSERISCI CODICE" con ESEGUI
 *   destra   → i sei livelli di accesso, con quello attuale evidenziato
 *
 * L'USCITA È DERIVATA DALLO STATO
 * Il terminale non "ricorda" cosa ha stampato: ricostruisce lo schermo dai
 * tentativi salvati nello stato (stato.terminale.tentativi) e dalle risposte
 * del catalogo. Così, dopo un salvataggio, lo schermo è identico.
 *
 * Il testo che si sta scrivendo è invece stato locale (useState): è una
 * bozza dell'interfaccia, non fa parte della partita. Quando il terminale
 * si chiude il componente viene smontato e la bozza sparisce, senza bisogno
 * di "azzerarla" a mano.
 * ============================================================================
 */

import { useId, useState, type FormEvent } from "react";
import { CATALOGO_CODICI, LIVELLI_ACCESSO } from "../../content/codici";
import { CATALOGO_DIRETTIVE } from "../../content/direttive";
import type { StatoMissione, TentativoCodice, TonoRisposta } from "../../engine/types";
import type { Dispatch } from "../useMissione";
import stili from "./TerminaleSvc.module.css";

interface Props {
  stato: StatoMissione;
  dispatch: Dispatch;
  onChiudi: () => void;
}

interface Riga {
  testo: string;
  tono: TonoRisposta | "comando";
}

/** Quante righe di uscita restano a schermo, come in un vero terminale. */
const RIGHE_VISIBILI = 12;

/** Le righe che il terminale stampa per un tentativo. */
function righeDiTentativo(t: TentativoCodice, stato: StatoMissione): Riga[] {
  const comando: Riga = { testo: `> ${t.codice}`, tono: "comando" };
  switch (t.esito) {
    case "ACCETTATO": {
      const def = CATALOGO_CODICI[t.codice];
      const righe: Riga[] = [comando, ...(def?.risposta ?? [])];
      // Il codice che rivela la direttiva stampa anche la direttiva vera.
      if (def?.effetti.some((e) => e.tipo === "RIVELA_DIRETTIVA")) {
        const d = CATALOGO_DIRETTIVE[stato.vale.direttiva];
        righe.push({
          testo: `DIRETTIVA ......... ${stato.vale.direttiva} · ${d?.nome.toUpperCase() ?? "?"}`,
          tono: "vale",
        });
        righe.push({ testo: `RISPETTO ALLA MISSIONE ... ${d?.classe.replaceAll("_", " ") ?? "?"}`, tono: "critico" });
      }
      return righe;
    }
    case "GIA_ESEGUITO":
      return [comando, { testo: "COMANDO GIÀ ESEGUITO", tono: "normale" }];
    case "LIVELLO_INSUFFICIENTE":
      return [comando, { testo: "ACCESSO NEGATO · LIVELLO INSUFFICIENTE", tono: "critico" }];
    case "NEGATO":
      return [comando, { testo: "ACCESSO NEGATO", tono: "critico" }];
  }
}

/** Aggiunge un frammento al codice in scrittura, separandolo con un trattino. */
function aggiungiFrammento(bozza: string, frammento: string): string {
  if (bozza === "") return frammento;
  return bozza.endsWith("-") ? bozza + frammento : `${bozza}-${frammento}`;
}

export function TerminaleSvc({ stato, dispatch, onChiudi }: Props) {
  const idTitolo = useId();
  const [bozza, setBozza] = useState("");
  const { livello, frammenti, tentativi } = stato.terminale;

  const apertura: Riga = { testo: "SVC-07 · CANALE DI MANUTENZIONE APERTO", tono: "normale" };
  const righe = [apertura, ...tentativi.flatMap((t) => righeDiTentativo(t, stato))].slice(-RIGHE_VISIBILI);

  function esegui(evento: FormEvent) {
    evento.preventDefault();
    if (bozza.trim() === "") return;
    dispatch({ tipo: "INSERISCI_CODICE", codice: bozza });
    setBozza("");
  }

  return (
    <div className={stili.sfondo} onClick={onChiudi}>
      {/* stopPropagation: un clic DENTRO il terminale non deve chiuderlo. */}
      <div
        className={stili.terminale}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onChiudi()}
      >
        <header className={stili.barra}>
          <h2 id={idTitolo} className={stili.titolo}>
            ■■■ TERMINALE DI MANUTENZIONE // SVC-07
          </h2>
          <button type="button" className={stili.chiudi} onClick={onChiudi} aria-label="Chiudi il terminale">
            ×
          </button>
        </header>

        <div className={stili.corpo}>
          <div className={stili.principale}>
            <p className={stili.accesso}>
              ACCESSO AUTORIZZATO:{" "}
              <span className={livello > 0 ? stili.normale : stili.critico}>
                {livello > 0 ? `LIVELLO ${livello}` : "NO"}
              </span>
            </p>

            {/* column-reverse: le righe nuove restano in fondo (come nel canale V.A.L.E.). */}
            <ol className={stili.uscita} aria-live="polite" aria-label="Uscita del terminale">
              {[...righe].reverse().map((r, i) => (
                <li key={righe.length - 1 - i} className={stili[r.tono]}>
                  {r.testo}
                </li>
              ))}
            </ol>

            <div className={stili.frammenti}>
              <span className={stili.etichetta}>FRAMMENTI SEGNALATI · CLIC PER AGGIUNGERE</span>
              <div className={stili.chip}>
                {frammenti.length === 0 ? (
                  <span className={stili.vuoto}>— nessuno. Segnala le righe nel log di V.A.L.E. —</span>
                ) : (
                  frammenti.map((f) => (
                    <button key={f} type="button" onClick={() => setBozza((b) => aggiungiFrammento(b, f))}>
                      {f}
                    </button>
                  ))
                )}
              </div>
            </div>

            <form className={stili.ingresso} onSubmit={esegui}>
              <label htmlFor={`${idTitolo}-codice`}>&gt; INSERISCI CODICE:</label>
              <input
                id={`${idTitolo}-codice`}
                value={bozza}
                onChange={(e) => setBozza(e.target.value.toUpperCase())}
                placeholder="_ _ _ _ - _ _ - _ _"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
              <button type="submit">ESEGUI</button>
            </form>
          </div>

          <aside className={stili.livelli} aria-label="Livelli di accesso">
            <span className={stili.etichetta}>LIVELLI DI ACCESSO</span>
            <ol>
              {LIVELLI_ACCESSO.map((nome, n) => {
                const classe = n === livello ? stili.attuale : n < livello ? stili.sbloccato : stili.bloccato;
                return (
                  <li key={nome} className={classe} aria-current={n === livello ? "true" : undefined}>
                    <span className={stili.numero}>
                      <span className={stili.parola}>LIVELLO </span>
                      {n}
                    </span>
                    <span className={stili.nome}>{nome}</span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
