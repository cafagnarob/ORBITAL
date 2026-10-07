/**
 * ============================================================================
 * missione.test.ts — La super-missione si può completare? (v3.7)
 * ============================================================================
 *
 * Un "bot che segue la scaletta": in orbita mette in coda calibrazione,
 * correzione e riparazione dell'antenna alle persone più adatte, e appena
 * la scansione dell'area d'interesse diventa disponibile la assegna. I
 * minigiochi li gioca bene (0,8), le decisioni prendono la prima opzione.
 * Controlla che la scaletta funzioni davvero e che si possa tornare a
 * casa con la "Missione compiuta".
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { CATALOGHI_PREPARAZIONE, CONTESTO_GIOCO } from "../../src/content/contesto";
import { creaMissioneIniziale, PREPARAZIONE_VUOTA } from "../../src/content/missioneIniziale";
import { applicaPreparazione, attrezzaturaIndispensabile, problemiPreparazione } from "../../src/engine/preparazione";
import { applicaAzione, verificaAssegnazione, verificaScelta, type Azione } from "../../src/engine/mission";
import { faseViaggio } from "../../src/engine/storia/viaggio";
import type { AbilitaTecnica, StatoMissione } from "../../src/engine/types";

const gioca = (s: StatoMissione, a: Azione) => applicaAzione(s, a, CONTESTO_GIOCO);

/** Il membro libero più bravo nell'abilità, che può prendere il task. */
function assegnaAlMigliore(s: StatoMissione, task: string, abilita: AbilitaTecnica): StatoMissione {
  const candidati = Object.values(s.crew)
    .filter((m) => verificaAssegnazione(s, CONTESTO_GIOCO, task, m.id, null) === null)
    .sort((a, b) => b.abilita[abilita] - a.abilita[abilita]);
  const m = candidati[0];
  return m ? gioca(s, { tipo: "ASSEGNA_TASK", idDefinizione: task, responsabile: m.id, supporto: null }) : s;
}

function partita(seed: string): StatoMissione {
  let s = creaMissioneIniziale(seed);
  for (let passi = 0; passi < 3000 && s.statoGioco !== "CONCLUSA"; passi++) {
    switch (s.statoGioco) {
      case "PIANIFICAZIONE":
        if (faseViaggio(s) === "ORBITA" && !s.obiettiviCompletati.includes("P2")) {
          s = assegnaAlMigliore(s, "T-RIPARA-ANTENNA", "EVA");
          s = assegnaAlMigliore(s, "T-RICALIBRAZIONE", "SCIENZA");
          s = assegnaAlMigliore(s, "T-CORREZIONE-ORBITA", "PILOTAGGIO");
        }
        s = gioca(s, { tipo: "AVVIA_OPERAZIONI" });
        break;
      case "IN_ESECUZIONE":
        if (s.minigioco) {
          s = gioca(s, { tipo: "RISOLVI_MINIGIOCO", punteggio: 0.8 });
          break;
        }
        // Appena la scansione diventa possibile, la si assegna.
        s = assegnaAlMigliore(s, "T-SCANSIONE-OBIETTIVO", "SCIENZA");
        // Se un preparativo è scaduto o è fallito, lo si rimette in coda.
        if (faseViaggio(s) === "ORBITA" && !s.obiettiviCompletati.includes("P2")) {
          s = assegnaAlMigliore(s, "T-RICALIBRAZIONE", "SCIENZA");
          s = assegnaAlMigliore(s, "T-CORREZIONE-ORBITA", "PILOTAGGIO");
        }
        // Un'assegnazione può far partire subito un task con il suo minigioco.
        if (!s.minigioco) s = gioca(s, { tipo: "AVANZA" });
        break;
      case "RAPPORTO":
        s = gioca(s, { tipo: "CHIUDI_RAPPORTO" });
        break;
      case "DECISIONE": {
        const ev = CONTESTO_GIOCO.catalogoEventi[s.eventi.inAttesa?.id ?? ""];
        // Il bot non parte in anticipo: resta fino alla finestra.
        const valide = (ev?.scelte ?? []).filter(
          (sc) => verificaScelta(s, CONTESTO_GIOCO, sc.id) === null && !sc.effetti.some((e) => e.tipo === "PARTENZA"),
        );
        const scelta = valide[0] ?? ev?.scelte.find((sc) => verificaScelta(s, CONTESTO_GIOCO, sc.id) === null);
        if (!scelta) throw new Error(`Nessuna scelta per ${ev?.id}`);
        s = gioca(s, { tipo: "RISOLVI_EVENTO", idScelta: scelta.id });
        break;
      }
    }
  }
  return s;
}

const partite = Array.from({ length: 24 }, (_, i) => partita(`SCALETTA-${i}`));

describe("la super-missione E-17", () => {
  it("si arriva in orbita al giorno 4 (obiettivo P1) in ogni partita", () => {
    for (const s of partite) expect(s.obiettiviCompletati).toContain("P1");
  });

  it("chi segue la scaletta acquisisce l'area d'interesse nella maggior parte delle partite", () => {
    const riuscite = partite.filter((s) => s.obiettiviCompletati.includes("P2")).length;
    expect(riuscite).toBeGreaterThanOrEqual(partite.length * 0.6);
  });

  it("la scansione parte solo nella finestra 10:00–16:00", () => {
    for (const s of partite) {
      for (const t of Object.values(s.tasks)) {
        if (t.idDefinizione !== "T-SCANSIONE-OBIETTIVO" || t.inizio === null) continue;
        const ora = (t.inizio % 1440) / 60;
        expect(ora).toBeGreaterThanOrEqual(10);
        expect(ora).toBeLessThan(16);
      }
    }
  });

  it("ogni partita finisce, e la missione compiuta è un finale raggiungibile", () => {
    for (const s of partite) expect(s.statoGioco).toBe("CONCLUSA");
    expect(partite.some((s) => s.esito?.finale === "MISSIONE_COMPIUTA")).toBe(true);
  });

  it("il rientro dura tre giorni: chi parte alla finestra arriva il giorno 11", () => {
    const normali = partite.filter((s) => s.esito?.causa === "RIENTRO" && s.partenza !== null);
    expect(normali.length).toBeGreaterThan(0);
    for (const s of normali) expect(Math.floor((s.esito?.tempo ?? 0) / 1440) + 1).toBe(Math.floor((s.partenza ?? 0) / 1440) + 1 + 3);
  });
});

// ----------------------------------------------------------------------------

describe("preparazione: nave vuota e attrezzatura indispensabile", () => {
  const ind = attrezzaturaIndispensabile(CATALOGHI_PREPARAZIONE.taskObbligatori ?? [], CATALOGHI_PREPARAZIONE);

  it("l'indispensabile è l'attrezzatura della scaletta: sensore profondo, tuta EVA, kit di riparazione", () => {
    expect([...ind.equipaggiamento].sort()).toEqual(["KIT_RIPARAZIONE", "SENSORE_PROFONDO", "TUTA_EVA_MK2"]);
    expect(ind.moduli).toEqual([]);
  });

  it("il tasto aggiunge solo l'indispensabile: niente crew, niente scorte", () => {
    const p = applicaPreparazione(PREPARAZIONE_VUOTA, { tipo: "AGGIUNGI_INDISPENSABILE", ...ind }, CATALOGHI_PREPARAZIONE);
    expect(p.equipaggiamento).toHaveLength(3);
    expect(p.crew).toEqual([]);
    expect(p.scorte).toEqual({});
  });

  it("senza l'indispensabile la Preparazione avverte che l'obiettivo principale è impossibile", () => {
    const testi = problemiPreparazione(PREPARAZIONE_VUOTA, CATALOGHI_PREPARAZIONE).map((x) => x.testo);
    expect(testi.some((t) => t.startsWith("Obiettivo principale impossibile"))).toBe(true);
  });
});
