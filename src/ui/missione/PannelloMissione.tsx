/**
 * ============================================================================
 * PannelloMissione.tsx — Fasi del viaggio, scaletta e obiettivi (v3.7)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6.
 *
 * Tre parti, tutte DERIVATE dallo stato (niente useState):
 *   1. la LINEA DELLE FASI: andata · orbita · rientro, con la fase attuale;
 *   2. gli OBIETTIVI PRINCIPALI, con la SCALETTA dell'acquisizione:
 *        ✓ valido fino a G5 · 14:00   ✗ scaduto (da rifare)   ☐ da fare
 *      (la validità viene da validoFinoA, la stessa regola del motore);
 *   3. gli OBIETTIVI SECONDARI comparsi finora, chiusi in un <details>
 *      (v3.7.1: il pannello occupava troppo spazio).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { CONTESTO_GIOCO } from "../../content/contesto";
import { CATALOGO_TASK } from "../../content/tasks";
import { SCALETTA, SCANSIONE_OBIETTIVO } from "../../content/missione";
import { formattaTempo, scomponiTempo } from "../../engine/clock";
import { validoFinoA, contaCompletati } from "../../engine/eventi/condizioni";
import { obiettiviVisibili } from "../../engine/storia/obiettivi";
import { faseViaggio, giornoArrivo, giornoFinestraRientro } from "../../engine/storia/viaggio";
import type { DefinizioneObiettivo, FaseViaggio, StatoMissione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import stili from "./PannelloMissione.module.css";

const NOMI_FASE: Record<FaseViaggio, string> = { ANDATA: "ANDATA", ORBITA: "ORBITA E-17", RIENTRO: "RIENTRO" };

/** Stato di un passo della scaletta, per l'icona e la riga. */
function statoPasso(stato: StatoMissione, task: string, validitaOre: number | null): { icona: string; nota: string; tono: string } {
  const fatti = contaCompletati(stato, task);
  if (validitaOre === null)
    return fatti > 0 ? { icona: "✓", nota: "fatto", tono: stili.fatto ?? "" } : { icona: "☐", nota: "da fare", tono: "" };
  const fino = validoFinoA(stato, task, validitaOre, SCANSIONE_OBIETTIVO.task);
  if (fino !== null) return { icona: "✓", nota: `valido fino a ${formattaTempo(fino)}`, tono: stili.fatto ?? "" };
  if (fatti > 0) return { icona: "✗", nota: "scaduto · da rifare", tono: stili.scaduto ?? "" };
  return { icona: "☐", nota: `vale ${validitaOre} h`, tono: "" };
}

export function PannelloMissione({ stato }: { stato: StatoMissione }) {
  const fase = faseViaggio(stato);
  const { giorno } = scomponiTempo(stato.tempo);
  const m = BALANCE.missione;
  const arrivo = giornoArrivo(stato);
  const obiettivi = obiettiviVisibili(stato, CONTESTO_GIOCO);
  const principali = obiettivi.filter((o) => o.tipo === "PRINCIPALE");
  const secondari = obiettivi.filter((o) => o.tipo === "SECONDARIO");
  const completato = (o: DefinizioneObiettivo) => stato.obiettiviCompletati.includes(o.id);
  const vivi = Object.values(stato.crew).filter((c) => c.stato !== "MORTO" && c.stato !== "DISPERSO").length;

  const fasi: { id: FaseViaggio; giorni: string }[] = [
    { id: "ANDATA", giorni: `G1–${m.giorniAndata}` },
    { id: "ORBITA", giorni: `G${m.giorniAndata + 1}–${giornoFinestraRientro() - 1}` },
    { id: "RIENTRO", giorni: arrivo !== null ? `→ G${arrivo}` : `${m.giorniRientro} g` },
  ];

  const scansioneFatta = stato.obiettiviCompletati.includes("P2");
  const scansione = CATALOGO_TASK[SCANSIONE_OBIETTIVO.task];

  return (
    <Finestra titolo="Missione · E-17" destra={`G${giorno} · ${NOMI_FASE[fase]}`}>
      <ol className={stili.fasi} aria-label="Fasi del viaggio">
        {fasi.map((f) => (
          <li key={f.id} className={f.id === fase ? stili.attuale : ""} aria-current={f.id === fase ? "step" : undefined}>
            <span>{NOMI_FASE[f.id]}</span>
            <span className={stili.giorni}>{f.giorni}</span>
          </li>
        ))}
      </ol>

      <h3 className={stili.titolo}>OBIETTIVI PRINCIPALI</h3>
      <ul className={stili.obiettivi}>
        {principali.map((o) => (
          <li key={o.id} className={completato(o) ? stili.fatto : ""}>
            <span className={stili.icona}>{completato(o) ? "✓" : "☐"}</span>
            <div>
              <strong>{o.titolo}</strong>
              {o.id === "P3" && (
                <span className={stili.nota}>
                  {" "}
                  · a bordo {vivi}/{Object.keys(stato.crew).length}
                </span>
              )}
              {/* La scaletta dell'acquisizione, sotto l'obiettivo P2. */}
              {o.id === "P2" && !scansioneFatta && (
                <ol className={stili.scaletta}>
                  {SCALETTA.map((p) => {
                    const st = statoPasso(stato, p.task, p.validitaOre);
                    return (
                      <li key={p.task} className={st.tono}>
                        <span className={stili.icona}>{st.icona}</span> {p.titolo} <span className={stili.nota}>· {st.nota}</span>
                      </li>
                    );
                  })}
                  <li>
                    <span className={stili.icona}>▶</span> {SCANSIONE_OBIETTIVO.titolo}{" "}
                    <span className={stili.nota}>
                      · solo {scansione?.finestra?.da}:00–{scansione?.finestra?.a}:00
                      {fase !== "ORBITA" && " · in orbita"}
                    </span>
                  </li>
                </ol>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Di contorno: chiusi in un <details> (elemento HTML nativo, si apre
          con un clic senza useState) per lasciare spazio alla Pianificazione. */}
      {secondari.length > 0 && (
        <details className={stili.contorno}>
          <summary>
            DI CONTORNO · {secondari.filter(completato).length}/{secondari.length}
          </summary>
          <ul className={stili.obiettivi}>
            {secondari.map((o) => (
              <li key={o.id} className={completato(o) ? stili.fatto : ""}>
                <span className={stili.icona}>{completato(o) ? "✓" : "◇"}</span>
                <div>
                  <strong>{o.titolo}</strong>
                  {!completato(o) && <span className={stili.descrizione}>{o.descrizione}</span>}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Finestra>
  );
}
