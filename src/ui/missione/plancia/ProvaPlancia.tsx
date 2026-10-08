/**
 * ============================================================================
 * ProvaPlancia.tsx — Banco di prova della grafica di bordo (solo per chi sviluppa)
 * ============================================================================
 *
 * Si apre con ?prova=plancia. Mostra tutte le viste della Plancia (v3.8:
 * per ogni supermissione) e il pannello della nave in stati diversi, senza dover giocare fino al giorno 4
 * o aspettare una scansione: serve per collaudare grafica e animazioni.
 * Il gioco normale non lo mostra mai.
 * ============================================================================
 */

import { LISTA_MISSIONI, MISSIONE_E17 } from "../../../content/missioni";
import { creaMissioneIniziale } from "../../../content/missioneIniziale";
import type { Tratta } from "../../../engine/storia/viaggio";
import type { DefinizioneMissione, StatoMissione } from "../../../engine/types";
import { PannelloNave } from "../PannelloNave";
import { VistaOrbita } from "./VistaOrbita";
import { VistaViaggio } from "./VistaViaggio";

const tratta = (destinazione: Tratta["destinazione"], progresso: number): Tratta => ({
  destinazione,
  da: 0,
  a: 4320,
  progresso,
  minutiAllArrivo: Math.round((1 - progresso) * 4320),
});

/** Nome e forma del bersaglio, come li vuole VistaViaggio. */
const sagoma = (m: DefinizioneMissione) => ({ nome: m.nome, forma: m.bersaglio.forma });

const sana = creaMissioneIniziale("PROVA-1");
const danneggiata: StatoMissione = {
  ...sana,
  nave: { ...sana.nave, scafo: 58, sistemi: { ...sana.nave.sistemi, POTENZA: 47, COMUNICAZIONI: 18, OPERAZIONI_ESTERNE: 72 } },
};

const riquadro = { border: "1px solid var(--c-griglia)", background: "var(--c-pannello)" } as const;
const etichetta = {
  font: "16px var(--font-terminale)",
  color: "var(--c-fosforo-tenue)",
  letterSpacing: "0.12em",
  margin: "8px 0 4px",
} as const;

export function ProvaPlancia() {
  // v3.8: una riga per ogni supermissione (forma del bersaglio diversa),
  // più le modalità di acquisizione e il rientro su E-17.
  const viste = [
    { nome: "ANDATA · 0% · E-17", el: <VistaViaggio tratta={tratta("BERSAGLIO", 0)} seed="E17-0042" bersaglio={sagoma(MISSIONE_E17)} /> },
    {
      nome: "ANDATA · 97% · E-17",
      el: <VistaViaggio tratta={tratta("BERSAGLIO", 0.97)} seed="E17-0042" bersaglio={sagoma(MISSIONE_E17)} />,
    },
    { nome: "RIENTRO · 30%", el: <VistaViaggio tratta={tratta("TERRA", 0.3)} seed="E17-0042" bersaglio={sagoma(MISSIONE_E17)} /> },
    { nome: "ORBITA · ACQUISIZIONE · E-17", el: <VistaOrbita modo="ACQUISIZIONE" seed="E17-0042" missione={MISSIONE_E17} /> },
    { nome: "ORBITA · ACQUISITA · E-17", el: <VistaOrbita modo="ACQUISITA" seed="E17-0042" missione={MISSIONE_E17} /> },
    ...LISTA_MISSIONI.flatMap((m) => [
      {
        nome: `ANDATA · 60% · ${m.nome}`,
        el: <VistaViaggio tratta={tratta("BERSAGLIO", 0.6)} seed={`${m.sigla}-0042`} bersaglio={sagoma(m)} />,
      },
      { nome: `SUL POSTO · ${m.nome}`, el: <VistaOrbita modo="OSSERVAZIONE" seed={`${m.sigla}-0042`} missione={m} /> },
    ]),
  ];
  return (
    <main style={{ padding: 16, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))" }}>
      {viste.map((v) => (
        <section key={v.nome}>
          <h2 style={etichetta}>{v.nome}</h2>
          {/* Alto 260px: con quattro colonne (≥ 1600px) la vista lo riempie e
              mostra la disposizione ALTA; sotto i 1600px resta una striscia. */}
          <div style={{ ...riquadro, height: 260 }}>{v.el}</div>
        </section>
      ))}
      <section>
        <h2 style={etichetta}>NAVE · INTEGRA</h2>
        <PannelloNave stato={sana} />
      </section>
      <section>
        <h2 style={etichetta}>NAVE · DANNEGGIATA</h2>
        <PannelloNave stato={danneggiata} />
      </section>
    </main>
  );
}
