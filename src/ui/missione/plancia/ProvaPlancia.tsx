/**
 * ============================================================================
 * ProvaPlancia.tsx — Banco di prova della grafica di bordo (solo per chi sviluppa)
 * ============================================================================
 *
 * Si apre con ?prova=plancia. Mostra tutte le viste della Plancia e il
 * pannello della nave in stati diversi, senza dover giocare fino al giorno 4
 * o aspettare una scansione: serve per collaudare grafica e animazioni.
 * Il gioco normale non lo mostra mai.
 * ============================================================================
 */

import { creaMissioneIniziale } from "../../../content/missioneIniziale";
import type { Tratta } from "../../../engine/storia/viaggio";
import type { StatoMissione } from "../../../engine/types";
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
  const viste = [
    { nome: "ANDATA · 0%", el: <VistaViaggio tratta={tratta("E-17", 0)} seed="E17-0042" /> },
    { nome: "ANDATA · 55%", el: <VistaViaggio tratta={tratta("E-17", 0.55)} seed="E17-0042" /> },
    { nome: "ANDATA · 97%", el: <VistaViaggio tratta={tratta("E-17", 0.97)} seed="E17-0042" /> },
    { nome: "RIENTRO · 30%", el: <VistaViaggio tratta={tratta("TERRA", 0.3)} seed="E17-0042" /> },
    { nome: "ORBITA · OSSERVAZIONE", el: <VistaOrbita modo="OSSERVAZIONE" seed="E17-0042" /> },
    { nome: "ORBITA · ACQUISIZIONE", el: <VistaOrbita modo="ACQUISIZIONE" seed="E17-0042" /> },
    { nome: "ORBITA · ACQUISITA", el: <VistaOrbita modo="ACQUISITA" seed="E17-0042" /> },
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
