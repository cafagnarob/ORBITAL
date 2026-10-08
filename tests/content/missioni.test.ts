/**
 * ============================================================================
 * missioni.test.ts — Le cinque supermissioni si possono completare? (v3.8)
 * ============================================================================
 *
 * Un "bot che segue la scaletta", uguale per tutte le missioni: legge la
 * scaletta dalla DEFINIZIONE della missione (content/missioni), in orbita
 * mette in coda i preparativi alle persone più adatte e, appena il task
 * finale diventa disponibile, lo assegna. I minigiochi li gioca bene (0,8),
 * le decisioni prendono la prima opzione (senza partire in anticipo).
 *
 * Ogni missione si gioca con seed che cominciano con la sua sigla
 * ("ARGO-3", "HK7-5"…), quindi con durate diverse: si controlla che la
 * scaletta funzioni, che la finestra oraria del finale sia rispettata, che
 * il rientro duri quanto dice il piano e che «Missione compiuta» sia
 * raggiungibile ovunque.
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { cataloghiPreparazionePer, CATALOGHI_PREPARAZIONE, CONTESTO_GIOCO } from "../../src/content/contesto";
import { CATALOGO_EVENTI } from "../../src/content/eventi";
import { CATALOGO_EQUIPAGGIAMENTO, CATALOGO_MODULI } from "../../src/content/loadout";
import { LISTA_MISSIONI, MISSIONE_E17, pianoPartita, taskObbligatori } from "../../src/content/missioni";
import { creaMissioneIniziale, PREPARAZIONE_DI_RIFERIMENTO, PREPARAZIONE_VUOTA } from "../../src/content/missioneIniziale";
import { CATALOGO_SCOPERTE } from "../../src/content/scoperte";
import { applicaAzione, verificaAssegnazione, verificaScelta, type Azione } from "../../src/engine/mission";
import {
  applicaPreparazione,
  attrezzaturaIndispensabile,
  problemiPreparazione,
  taskNonDisponibili,
} from "../../src/engine/preparazione";
import { faseViaggio } from "../../src/engine/storia/viaggio";
import type { DefinizioneMissione, Preparazione, StatoMissione } from "../../src/engine/types";

const gioca = (s: StatoMissione, a: Azione) => applicaAzione(s, a, CONTESTO_GIOCO);
const def = (id: string) => CONTESTO_GIOCO.catalogoTask[id];

/** Il membro libero più bravo nell'abilità principale del task, che può prenderlo. */
function assegnaAlMigliore(s: StatoMissione, task: string): StatoMissione {
  const abilita = def(task)?.abilitaPrincipale;
  if (!abilita) return s;
  const candidati = Object.values(s.crew)
    .filter((m) => verificaAssegnazione(s, CONTESTO_GIOCO, task, m.id, null) === null)
    .sort((a, b) => b.abilita[abilita] - a.abilita[abilita]);
  const m = candidati[0];
  return m ? gioca(s, { tipo: "ASSEGNA_TASK", idDefinizione: task, responsabile: m.id, supporto: null }) : s;
}

/**
 * Il loadout del bot: quello di riferimento, con l'indispensabile della
 * missione al posto di ciò che manca (gli slot sono limitati: un modulo
 * indispensabile prende il posto dell'ultimo modulo di riferimento).
 */
function loadoutPer(m: DefinizioneMissione): Preparazione {
  const ind = attrezzaturaIndispensabile(taskObbligatori(m), CATALOGHI_PREPARAZIONE);
  const prep = structuredClone(PREPARAZIONE_DI_RIFERIMENTO);
  for (const mod of ind.moduli) if (!prep.moduli.includes(mod)) prep.moduli.splice(prep.moduli.length - 1, 1, mod);
  for (const eq of ind.equipaggiamento) if (!prep.equipaggiamento.includes(eq)) prep.equipaggiamento.splice(prep.equipaggiamento.length - 1, 1, eq);
  return prep;
}

/**
 * Le task di sopravvivenza (v3.9): acqua, cibo, ossigeno, energia. Con i
 * consumi della v3.9 la stiva da sola non basta: il bot le mette in coda
 * ogni mattina (quelle non ancora disponibili vengono semplicemente scartate).
 */
const SOPRAVVIVENZA = ["T-MANUTENZIONE-SV", "T-RICICLO-ACQUA", "T-COLTURA", "T-ELETTROLISI", "T-INVENTARIO", "T-RAZIONAMENTO", "T-PANNELLI"];

/**
 * Una partita intera giocata dal bot. Con `sopravvivenza: false` il bot
 * non fa NESSUNA task di sopravvivenza (come chi lascia scorrere il viaggio):
 * serve a dimostrare che così non si torna a casa interi.
 */
function partita(m: DefinizioneMissione, seed: string, sopravvivenza = true): StatoMissione {
  const passi = m.scaletta.passi.map((p) => p.task);
  const finale = m.scaletta.finale.task;
  let s = creaMissioneIniziale(seed, loadoutPer(m));
  const preparativi = () => {
    if (faseViaggio(s) === "ORBITA" && !s.obiettiviCompletati.includes("P2")) for (const t of passi) s = assegnaAlMigliore(s, t);
  };

  for (let n = 0; n < 4000 && s.statoGioco !== "CONCLUSA"; n++) {
    switch (s.statoGioco) {
      case "PIANIFICAZIONE":
        preparativi();
        if (sopravvivenza) for (const t of SOPRAVVIVENZA) s = assegnaAlMigliore(s, t);
        s = gioca(s, { tipo: "AVVIA_OPERAZIONI" });
        break;
      case "IN_ESECUZIONE":
        if (s.minigioco) {
          s = gioca(s, { tipo: "RISOLVI_MINIGIOCO", punteggio: 0.8 });
          break;
        }
        // Appena il finale diventa possibile lo si assegna; i preparativi
        // scaduti o falliti tornano in coda.
        s = assegnaAlMigliore(s, finale);
        preparativi();
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

const PARTITE_PER_MISSIONE = 12;

describe.each(LISTA_MISSIONI.map((m) => [m.nome, m] as const))("supermissione %s", (_nome, m) => {
  const partite = Array.from({ length: PARTITE_PER_MISSIONE }, (_, i) => partita(m, `${m.sigla}-${i}`));

  it("il seed con la sigla sceglie questa missione, e la partita la registra", () => {
    for (const s of partite) expect(s.missione.id).toBe(m.id);
  });

  it("si arriva sul posto (P1) in ogni partita", () => {
    for (const s of partite) expect(s.obiettiviCompletati).toContain("P1");
  });

  it("chi segue la scaletta consegue l'obiettivo principale nella maggior parte delle partite", () => {
    const riuscite = partite.filter((s) => s.obiettiviCompletati.includes("P2")).length;
    expect(riuscite).toBeGreaterThanOrEqual(PARTITE_PER_MISSIONE * 0.6);
  });

  it("il task finale parte solo nella sua finestra oraria", () => {
    const finestra = def(m.scaletta.finale.task)?.finestra;
    expect(finestra).toBeDefined();
    for (const s of partite) {
      for (const t of Object.values(s.tasks)) {
        if (t.idDefinizione !== m.scaletta.finale.task || t.inizio === null || !finestra) continue;
        const ora = (t.inizio % 1440) / 60;
        expect(ora).toBeGreaterThanOrEqual(finestra.da);
        expect(ora).toBeLessThan(finestra.a);
      }
    }
  });

  it("ogni partita finisce, e «Missione compiuta» è raggiungibile", () => {
    for (const s of partite) expect(s.statoGioco).toBe("CONCLUSA");
    expect(partite.some((s) => s.esito?.finale === "MISSIONE_COMPIUTA")).toBe(true);
  });

  it("il rientro dura i giorni del piano", () => {
    const normali = partite.filter((s) => s.esito?.causa === "RIENTRO" && s.partenza !== null);
    expect(normali.length).toBeGreaterThan(0);
    for (const s of normali) {
      const giornoArrivo = Math.floor((s.esito?.tempo ?? 0) / 1440) + 1;
      const giornoPartenza = Math.floor((s.partenza ?? 0) / 1440) + 1;
      expect(giornoArrivo).toBe(giornoPartenza + s.missione.durate.rientro);
    }
  });

  it("il mistero c'è anche qui: il segnale viene rilevato e compare VL-P7-04", () => {
    const conSegnale = partite.filter((s) => s.conoscenza.scoperte.includes("SEGNALE_RILEVATO"));
    expect(conSegnale.length).toBeGreaterThanOrEqual(PARTITE_PER_MISSIONE * 0.6);
    expect(partite.some((s) => s.log.some((r) => r.codici.includes("VL-P7-04")))).toBe(true);
  });
});

// ----------------------------------------------------------------------------

describe("la sopravvivenza (v3.9): senza task di risorse non si torna interi", () => {
  // Le missioni più lunghe (Kestrel-4, HK-7: fino a 14 giorni), giocate
  // dallo stesso bot ma senza riciclo dell'acqua, coltura né elettrolisi.
  const lunghe = LISTA_MISSIONI.filter((m) => m.id === "KST" || m.id === "HK7");
  const pigre = lunghe.flatMap((m) => Array.from({ length: 6 }, (_, i) => partita(m, `${m.sigla}-${i}`, false)));
  const attente = lunghe.flatMap((m) => Array.from({ length: 6 }, (_, i) => partita(m, `${m.sigla}-${i}`)));
  /** A casa (finale di rientro) e senza nessun morto. */
  const aCasaInteri = (s: StatoMissione) =>
    s.esito?.causa === "RIENTRO" && Object.values(s.crew).every((c) => c.stato !== "MORTO" && c.stato !== "DISPERSO");

  it("chi non fa le task di sopravvivenza quasi mai torna a casa con tutti", () => {
    expect(pigre.filter(aCasaInteri).length).toBeLessThanOrEqual(pigre.length * 0.2);
  });

  it("chi le fa ci riesce nella maggior parte delle partite", () => {
    expect(attente.filter(aCasaInteri).length).toBeGreaterThanOrEqual(attente.length * 0.5);
  });
});

describe("il contenuto delle supermissioni", () => {
  it("sigle e id sono unici", () => {
    expect(new Set(LISTA_MISSIONI.map((m) => m.id)).size).toBe(LISTA_MISSIONI.length);
    expect(new Set(LISTA_MISSIONI.map((m) => m.sigla)).size).toBe(LISTA_MISSIONI.length);
  });

  it("scaletta, attrezzatura e scoperte puntano a cose che esistono", () => {
    for (const m of LISTA_MISSIONI) {
      for (const t of taskObbligatori(m)) expect(def(t), `${m.id}: ${t}`).toBeDefined();
      const ind = attrezzaturaIndispensabile(taskObbligatori(m), CATALOGHI_PREPARAZIONE);
      for (const e of ind.equipaggiamento) expect(CATALOGO_EQUIPAGGIAMENTO).toHaveProperty(e);
      for (const x of ind.moduli) expect(CATALOGO_MODULI).toHaveProperty(x);
      for (const o of m.obiettivi) {
        for (const c of o.completato) if (c.tipo === "SCOPERTA") expect(CATALOGO_SCOPERTE, `${m.id}/${o.id}`).toHaveProperty(c.id);
      }
    }
  });

  it("il task finale di ogni missione ha il tag OBIETTIVO e una finestra oraria", () => {
    for (const m of LISTA_MISSIONI) {
      const f = def(m.scaletta.finale.task);
      expect(f?.tag).toContain("OBIETTIVO");
      expect(f?.finestra).toBeDefined();
    }
  });

  it("i task e gli eventi propri di una missione esistono solo in quella", () => {
    const sigleTask = /^T-(ARGO|HK7|HAL|KST)-/;
    for (const t of Object.values(CONTESTO_GIOCO.catalogoTask).filter((t) => sigleTask.test(t.id))) {
      expect(t.sblocco.some((c) => c.tipo === "MISSIONE"), t.id).toBe(true);
    }
    for (const e of Object.values(CATALOGO_EVENTI).filter((e) => /^[AHCK]-/.test(e.id))) {
      expect(e.condizioni.some((c) => c.tipo === "MISSIONE"), e.id).toBe(true);
    }
  });

  it("le durate stanno negli intervalli della missione (seed qualsiasi)", () => {
    for (let i = 0; i < 200; i++) {
      const piano = pianoPartita(`CASO-${i}`);
      const m = LISTA_MISSIONI.find((x) => x.id === piano.id);
      expect(m).toBeDefined();
      if (!m) continue;
      for (const fase of ["andata", "orbita", "rientro"] as const) {
        expect(piano.durate[fase]).toBeGreaterThanOrEqual(m.durate[fase].min);
        expect(piano.durate[fase]).toBeLessThanOrEqual(m.durate[fase].max);
      }
    }
  });
});

describe("gli eventi rispettano la fase del viaggio (v3.7.1)", () => {
  // Un evento che parla di ciò che si vede SUL pianeta (la superficie,
  // l'emisfero, qualcosa che "sfiora E-17") può succedere solo in orbita.
  // Bug trovato da Roberto: il segnale «dall'emisfero nord» arrivava già
  // durante il viaggio, dopo una diagnostica riuscita.
  const DEL_PIANETA = /superficie|emisfero|sfiora E-17/i;
  // I tag che appartengono SOLO a task sbloccati in orbita (es. CRATERE, SR9).
  const tasks = Object.values(CONTESTO_GIOCO.catalogoTask);
  const soloOrbita = (t: (typeof tasks)[number]) => t.sblocco.some((c) => c.tipo === "FASE" && !c.fasi.includes("ANDATA"));
  const TAG_DI_ORBITA = new Set(
    tasks.flatMap((t) => t.tag).filter((tag) => tasks.filter((t) => t.tag.includes(tag)).every(soloOrbita)),
  );

  it("ogni evento che descrive il pianeta da vicino richiede la fase ORBITA", () => {
    const senzaFase = Object.values(CATALOGO_EVENTI)
      .filter((e) => DEL_PIANETA.test(e.testo))
      .filter((e) => !e.condizioni.some((c) => c.tipo === "FASE" && c.fasi.includes("ORBITA") && !c.fasi.includes("ANDATA")))
      // Gli eventi che seguono un task possibile SOLO in orbita sono già al sicuro.
      .filter((e) => !e.condizioni.some((c) => c.tipo === "TASK_CONCLUSO_ORA" && c.tag !== undefined && TAG_DI_ORBITA.has(c.tag)))
      .map((e) => e.id);
    expect(senzaFase).toEqual([]);
  });
});

// ----------------------------------------------------------------------------

describe("preparazione: nave vuota e attrezzatura indispensabile (per missione)", () => {
  const catE17 = cataloghiPreparazionePer({ id: "E17", durate: { andata: 3, orbita: 4, rientro: 3 } });
  const ind = attrezzaturaIndispensabile(catE17.taskObbligatori ?? [], catE17);

  it("su E-17 l'indispensabile è sensore profondo, tuta EVA, kit di riparazione", () => {
    expect([...ind.equipaggiamento].sort()).toEqual(["KIT_RIPARAZIONE", "SENSORE_PROFONDO", "TUTA_EVA_MK2"]);
    expect(ind.moduli).toEqual([]);
  });

  it("su HK-7 serve anche il Modulo Minerario", () => {
    const cat = cataloghiPreparazionePer(pianoPartita("HK7-1"));
    expect(attrezzaturaIndispensabile(cat.taskObbligatori ?? [], cat).moduli).toEqual(["MODULO_MINERARIO"]);
  });

  it("il tasto aggiunge solo l'indispensabile: niente crew, niente scorte", () => {
    const p = applicaPreparazione(PREPARAZIONE_VUOTA, { tipo: "AGGIUNGI_INDISPENSABILE", ...ind }, catE17);
    expect(p.equipaggiamento).toHaveLength(3);
    expect(p.crew).toEqual([]);
    expect(p.scorte).toEqual({});
  });

  it("senza l'indispensabile la Preparazione avverte che l'obiettivo principale è impossibile", () => {
    const testi = problemiPreparazione(PREPARAZIONE_VUOTA, catE17).map((x) => x.testo);
    expect(testi.some((t) => t.startsWith("Obiettivo principale impossibile"))).toBe(true);
  });

  it("i task delle altre missioni non contano tra gli «impossibili»", () => {
    const nomi = taskNonDisponibili(PREPARAZIONE_DI_RIFERIMENTO, catE17).map((t) => t.id);
    expect(nomi.filter((id) => /^T-(ARGO|HK7|HAL|KST)-/.test(id))).toEqual([]);
  });

  it("le scorte consigliate seguono la durata della missione", () => {
    const corta = cataloghiPreparazionePer({ id: "E17", durate: { andata: 2, orbita: 3, rientro: 2 } });
    const lunga = cataloghiPreparazionePer({ id: "KST", durate: { andata: 5, orbita: 4, rientro: 5 } });
    // Cibo per 9 giorni: basta per 7 giorni di missione, non per 14.
    const prep: Preparazione = { ...PREPARAZIONE_DI_RIFERIMENTO, scorte: { CASSA_CIBO: 6, CASSA_ACQUA: 8, TANICA_CARBURANTE: 2 } };
    const avvisoCibo = (c: typeof corta) => problemiPreparazione(prep, c).some((p) => p.testo.startsWith("Cibo per soli"));
    expect(avvisoCibo(corta)).toBe(false);
    expect(avvisoCibo(lunga)).toBe(true);
  });

  it("E-17 resta la missione di ripiego", () => {
    expect(LISTA_MISSIONI[0]).toBe(MISSIONE_E17);
  });
});
