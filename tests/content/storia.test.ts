/**
 * ============================================================================
 * storia.test.ts — Ogni partita racconta una storia diversa? (contenuto vero)
 * ============================================================================
 *
 * Un bot gioca 40 missioni COMPLETE (fino al finale) con seed diversi e
 * stili diversi: chi contesta V.A.L.E., chi si fida, chi ordina il rientro
 * presto. Controlliamo la VARIETÀ, cioè lo spirito di 60 Seconds:
 *   - escono finali diversi;
 *   - escono molti eventi narrativi diversi, vissuti da persone diverse;
 *   - gli imprevisti di partenza variano;
 *   - il giornale di bordo ha qualcosa da raccontare ogni giorno.
 * E controlliamo la coerenza dei testi: {P} solo dove c'è un protagonista.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { CONTESTO_GIOCO } from "../../src/content/contesto";
import { CATALOGO_EVENTI } from "../../src/content/eventi";
import { creaMissioneIniziale } from "../../src/content/missioneIniziale";

/** Il piano della missione storica: E-17, 3 giorni d'andata, 4 in orbita, 3 di rientro. */
const PIANO_E17_CLASSICO: PianoMissione = { id: "E17", durate: { andata: 3, orbita: 4, rientro: 3 } };
import { EVENTI_STORIA, LISTA_IMPREVISTI } from "../../src/content/storia";
import { EVENTI_TURNO } from "../../src/content/eventiTurno";
import { TASK_DISPONIBILI } from "../../src/content/tasks";
import { scomponiTempo } from "../../src/engine/clock";
import { applicaAzione, verificaAssegnazione, verificaScelta, type Azione } from "../../src/engine/mission";
import { verificaRientro } from "../../src/engine/storia/fine";
import type { PianoMissione, StatoMissione } from "../../src/engine/types";

const gioca = (s: StatoMissione, a: Azione) => applicaAzione(s, a, CONTESTO_GIOCO);

/** Stili del bot: cambiano le sue scelte, come giocatori diversi. */
type Stile = "DUBBIOSO" | "FIDUCIOSO" | "FRETTOLOSO";

function pianifica(stato: StatoMissione, n: number): StatoMissione {
  let s = stato;
  const giorno = scomponiTempo(s.tempo).giorno;
  for (const [i, id] of Object.keys(s.crew).sort().entries()) {
    // Ruota tra i task POSSIBILI in questo momento (v3.3: molti sono nascosti
    // o in ricarica), così il bot prova un po' di tutto come un giocatore.
    const possibili = TASK_DISPONIBILI.filter((d) => verificaAssegnazione(s, CONTESTO_GIOCO, d.id, id, null) === null);
    const t = possibili[(giorno * 3 + i * 7 + n) % Math.max(1, possibili.length)];
    if (t) s = gioca(s, { tipo: "ASSEGNA_TASK", idDefinizione: t.id, responsabile: id, supporto: null });
  }
  return s;
}

function partita(seed: string, n: number, stile: Stile): StatoMissione {
  // v3.8: la storia E-17 classica (3 + 4 + 3 giorni), qualunque sia il seed.
  let s = creaMissioneIniziale(seed, undefined, PIANO_E17_CLASSICO);
  for (let passi = 0; passi < 2000 && s.statoGioco !== "CONCLUSA"; passi++) {
    const giorno = scomponiTempo(s.tempo).giorno;
    switch (s.statoGioco) {
      case "PIANIFICAZIONE": {
        if (stile === "FRETTOLOSO" && giorno >= 5 && verificaRientro(s) === null) {
          s = gioca(s, { tipo: "RIENTRA" });
          if (s.statoGioco === "CONCLUSA") break;
        }
        if (stile === "DUBBIOSO") {
          // Contesta l'ultima cosa detta da V.A.L.E., come farebbe un giocatore sospettoso.
          const i = s.log.map((v) => v.fonte).lastIndexOf("VALE");
          if (i >= 0 && !s.vale.contestazioni.some((c) => c.indice === i)) s = gioca(s, { tipo: "CONTESTA", indice: i });
        }
        s = gioca(pianifica(s, n), { tipo: "AVVIA_OPERAZIONI" });
        break;
      }
      case "IN_ESECUZIONE":
        // Un minigioco in attesa (v3.6): il bot gioca "così così".
        s = gioca(s, s.minigioco ? { tipo: "RISOLVI_MINIGIOCO", punteggio: 0.5 } : { tipo: "AVANZA" });
        break;
      case "RAPPORTO":
        s = gioca(s, { tipo: "CHIUDI_RAPPORTO" });
        break;
      case "DECISIONE": {
        const evento = CONTESTO_GIOCO.catalogoEventi[s.eventi.inAttesa?.id ?? ""];
        const valide = (evento?.scelte ?? []).filter((sc) => verificaScelta(s, CONTESTO_GIOCO, sc.id) === null);
        // Il fiducioso sceglie la prima opzione, il dubbioso l'ultima, gli altri ruotano.
        const indice = stile === "FIDUCIOSO" ? 0 : stile === "DUBBIOSO" ? valide.length - 1 : (n + giorno) % valide.length;
        const scelta = valide[indice];
        if (!scelta) throw new Error(`Nessuna scelta valida per ${evento?.id}`);
        s = gioca(s, { tipo: "RISOLVI_EVENTO", idScelta: scelta.id });
        break;
      }
    }
  }
  return s;
}

const STILI: Stile[] = ["DUBBIOSO", "FIDUCIOSO", "FRETTOLOSO"];
const partite = Array.from({ length: 45 }, (_, i) => partita(`STORIA-${i}`, i, STILI[i % 3]!));

describe("storia emergente: varietà tra partite", () => {
  it("ogni partita arriva a un finale", () => {
    for (const s of partite) {
      expect(s.statoGioco).toBe("CONCLUSA");
      expect(s.esito).not.toBeNull();
    }
  });

  it("escono almeno 4 finali diversi", () => {
    const finali = new Set(partite.map((s) => s.esito?.finale));
    expect(finali.size).toBeGreaterThanOrEqual(4);
  });

  it("escono almeno 12 eventi narrativi diversi", () => {
    const narrativi = new Set(EVENTI_STORIA.map((e) => e.id));
    const usciti = new Set(partite.flatMap((s) => s.eventi.accaduti.map((r) => r.id)).filter((id) => narrativi.has(id)));
    expect(usciti.size).toBeGreaterThanOrEqual(12);
  });

  it("escono almeno 12 eventi dei turni diversi, e in media uno ogni giorno o due", () => {
    const deiTurni = new Set(EVENTI_TURNO.map((e) => e.id));
    const usciti = partite.flatMap((s) => s.eventi.accaduti.map((r) => r.id)).filter((id) => deiTurni.has(id));
    expect(new Set(usciti).size).toBeGreaterThanOrEqual(12);
    const giorni = partite.reduce((tot, s) => tot + scomponiTempo(s.tempo).giorno, 0);
    const perGiorno = usciti.length / giorni;
    expect(perGiorno).toBeGreaterThan(0.3);
    expect(perGiorno).toBeLessThan(1.5);
  });

  it("i task cambiano durante la partita: compaiono task sbloccati a catena e per giorno", () => {
    const svolti = new Set(partite.flatMap((s) => Object.values(s.tasks).map((t) => t.idDefinizione)));
    for (const id of ["T-RICOGNIZIONE-DRONE", "T-ELETTROLISI", "T-COLTURA", "T-RIPARAZIONE-SCAFO"]) expect(svolti).toContain(id);
  });

  it("gli eventi con protagonista sono vissuti da persone diverse", () => {
    const protagonisti = new Set(partite.flatMap((s) => s.eventi.accaduti.flatMap((r) => (r.protagonista ? [r.protagonista] : []))));
    expect(protagonisti.size).toBeGreaterThanOrEqual(3);
  });

  it("gli imprevisti di partenza variano", () => {
    expect(new Set(partite.map((s) => s.imprevisto)).size).toBeGreaterThanOrEqual(5);
  });

  it("il giornale di bordo racconta ogni giorno giocato", () => {
    for (const s of partite) {
      const ultimo = scomponiTempo(s.esito?.tempo ?? s.tempo).giorno;
      for (let g = 1; g < ultimo; g++) expect(s.diario.some((v) => v.giorno === g)).toBe(true);
    }
  });
});

describe("storia emergente: coerenza del contenuto", () => {
  /** Tutti i testi di un evento (testo, diario, etichette, esiti). */
  const testi = (e: (typeof EVENTI_STORIA)[number]) => [
    e.testo,
    e.diario ?? "",
    ...e.scelte.flatMap((s) => [s.etichetta, s.diario ?? "", ...(s.esiti ?? []).flatMap((x) => [x.testo, x.diario ?? ""])]),
    ...e.effetti.flatMap((ef) => (ef.tipo === "LOG" || ef.tipo === "DIARIO" ? [ef.testo] : [])),
  ];

  it("{P} compare solo negli eventi con protagonista, {S} solo con un secondo", () => {
    for (const e of Object.values(CATALOGO_EVENTI)) {
      const tutto = testi(e).join(" ");
      if (tutto.includes("{P}")) expect(e.protagonista, e.id).toBeDefined();
      if (tutto.includes("{S}")) expect(e.secondo, e.id).toBeDefined();
    }
  });

  it("gli imprevisti con {P} hanno un protagonista", () => {
    for (const i of LISTA_IMPREVISTI) {
      if (`${i.diario} ${i.log.testo}`.includes("{P}")) expect(i.protagonista, i.id).toBeDefined();
    }
  });

  it("ogni causa di fine ha almeno un finale", () => {
    const cause = new Set(Object.values(CONTESTO_GIOCO.storia.finali).flatMap((f) => f.cause));
    for (const c of ["RIENTRO", "MORTE", "CONTROLLO_VALE", "DERIVA"] as const) expect(cause).toContain(c);
  });

  it("i task citati dagli effetti TASK_AUTONOMO esistono", () => {
    for (const e of EVENTI_STORIA) {
      const effetti = [...e.effetti, ...e.scelte.flatMap((s) => [...s.effetti, ...(s.esiti ?? []).flatMap((x) => x.effetti)])];
      for (const ef of effetti) if (ef.tipo === "TASK_AUTONOMO") expect(CONTESTO_GIOCO.catalogoTask[ef.task], e.id).toBeDefined();
    }
  });
});
