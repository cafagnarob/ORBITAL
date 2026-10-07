/**
 * ============================================================================
 * content.test.ts — Il contenuto del gioco è coerente con il motore
 * ============================================================================
 *
 * Il contenuto è scritto a mano: è facile sbagliare un ID o dimenticare un
 * campo. Questi test controllano che i dati veri del gioco rispettino le
 * regole del motore, così un errore di battitura si scopre qui e non
 * a metà partita.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { LISTA_CANDIDATI } from "../../src/content/candidati";
import { CATALOGO_CODICI, LIVELLI_ACCESSO } from "../../src/content/codici";
import { CATALOGHI_PREPARAZIONE } from "../../src/content/contesto";
import { CATALOGO_DIRETTIVE } from "../../src/content/direttive";
import { CATALOGO_EVENTI } from "../../src/content/eventi";
import {
  CATALOGO_EQUIPAGGIAMENTO,
  CATALOGO_MODULI,
  LISTA_EQUIPAGGIAMENTO,
  LISTA_MODULI,
  LISTA_SCORTE,
} from "../../src/content/loadout";
import { creaMissioneIniziale, PREPARAZIONE_DI_RIFERIMENTO } from "../../src/content/missioneIniziale";
import { parametriNave } from "../../src/engine/nave/parametri";
import { fattibilita, problemiPreparazione, riepilogoPreparazione } from "../../src/engine/preparazione";
import { CATALOGO_SCOPERTE } from "../../src/content/scoperte";
import { TASK_DISPONIBILI } from "../../src/content/tasks";
import { TESTI_VALE } from "../../src/content/vale";
import { LIVELLO_MASSIMO, type Condizione, type Effetto } from "../../src/engine/types";

/** Tutte le condizioni, anche quelle annidate dentro UNO_TRA. */
function appiattisci(condizioni: readonly Condizione[]): Condizione[] {
  return condizioni.flatMap((c) =>
    c.tipo === "UNO_TRA" ? [c, ...appiattisci(c.condizioni)] : c.tipo === "NON" ? [c, ...appiattisci([c.condizione])] : [c],
  );
}

const EVENTI = Object.values(CATALOGO_EVENTI);
const TUTTE_LE_CONDIZIONI = [
  ...EVENTI.flatMap((e) =>
    appiattisci([
      ...e.condizioni,
      ...e.scelte.flatMap((s) => [...s.requisiti, ...(s.esiti ?? []).flatMap((es) => es.requisiti)]),
    ]),
  ),
  // Anche le condizioni di sblocco dei task (v3.3) usano lo stesso linguaggio.
  ...TASK_DISPONIBILI.flatMap((t) => appiattisci(t.sblocco)),
];
const CODICI = Object.values(CATALOGO_CODICI);
const FILTRI = EVENTI.flatMap((e) => e.filtri ?? []);
const TUTTI_GLI_EFFETTI: Effetto[] = [
  ...EVENTI.flatMap((e) => [
    ...e.effetti,
    ...e.scelte.flatMap((s) => [...s.effetti, ...(s.esiti ?? []).flatMap((es) => es.effetti)]),
  ]),
  ...FILTRI.flatMap((f) => [...f.effetti, ...f.verita]),
  ...CODICI.flatMap((c) => c.effetti),
];
/** Scoperte ottenibili: quelle degli effetti SCOPERTA, più quelle create dal motore. */
const SCOPERTE_DEL_MOTORE: Record<string, string> = { RIVELA_DIRETTIVA: "DIRETTIVA_RIVELATA", ACCESSO: "BLOCCO_VALE" };

describe("catalogo dei task", () => {
  it("ha ID unici", () => {
    const ids = TASK_DISPONIBILI.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("i task che non ammettono aiutanti non hanno abilità secondaria", () => {
    for (const t of TASK_DISPONIBILI) {
      if (!t.supportoAmmesso) expect(t.abilitaSecondaria).toBeNull();
    }
  });

  it("ogni task (tranne i bonus dei moduli) è eseguibile con il loadout iniziale", () => {
    const { nave } = creaMissioneIniziale();
    for (const t of TASK_DISPONIBILI.filter((x) => !x.bonus)) {
      for (const e of t.equipaggiamentoRichiesto) expect(nave.equipaggiamento).toContain(e);
      for (const m of t.moduliRichiesti) expect(nave.moduli).toContain(m);
    }
  });

  it("ogni task ha un minigioco (v3.6)", () => {
    for (const t of TASK_DISPONIBILI) expect(t.minigioco, t.id).toBeDefined();
  });

  it("le scoperte richieste esistono nel catalogo delle scoperte", () => {
    for (const t of TASK_DISPONIBILI) {
      for (const s of t.scoperteRichieste) expect(CATALOGO_SCOPERTE).toHaveProperty(s);
    }
  });
});

describe("catalogo degli eventi", () => {
  it("ogni evento ha peso positivo, probabilità tra 0 e 1 e scelte con ID unici", () => {
    for (const e of EVENTI) {
      expect(e.peso).toBeGreaterThan(0);
      expect(e.probabilita).toBeGreaterThanOrEqual(0);
      expect(e.probabilita).toBeLessThanOrEqual(1);
      const ids = e.scelte.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("le condizioni citano solo scoperte, eventi, tag ed equipaggiamenti esistenti", () => {
    const tagEsistenti = new Set(TASK_DISPONIBILI.flatMap((t) => t.tag));
    for (const c of TUTTE_LE_CONDIZIONI) {
      if (c.tipo === "SCOPERTA" || c.tipo === "NON_SCOPERTA") expect(CATALOGO_SCOPERTE).toHaveProperty(c.id);
      if (c.tipo === "EVENTO_ACCADUTO") {
        const evento = CATALOGO_EVENTI[c.id];
        expect(evento).toBeDefined();
        if (c.scelta !== undefined) expect(evento?.scelte.map((s) => s.id)).toContain(c.scelta);
      }
      if (c.tipo === "TASK_CONCLUSO_ORA") expect(tagEsistenti).toContain(c.tag);
      if (c.tipo === "TASK_COMPLETATO") expect(TASK_DISPONIBILI.map((t) => t.id)).toContain(c.task);
      if (c.tipo === "MODULO") expect(CATALOGO_MODULI).toHaveProperty(c.id);
      if (c.tipo === "EQUIPAGGIAMENTO") expect(CATALOGO_EQUIPAGGIAMENTO).toHaveProperty(c.id);
      if (c.tipo === "EVENTO_RECENTE") {
        const evento = CATALOGO_EVENTI[c.id];
        expect(evento).toBeDefined();
        if (c.scelta !== undefined) expect(evento?.scelte.map((s) => s.id)).toContain(c.scelta);
      }
    }
  });

  it("ogni task temporaneo è aperto da un evento che lo annuncia ai cambi turno", () => {
    for (const t of TASK_DISPONIBILI) {
      for (const c of appiattisci(t.sblocco)) {
        if (c.tipo !== "EVENTO_RECENTE") continue;
        const evento = CATALOGO_EVENTI[c.id]!;
        expect(JSON.stringify(evento.condizioni)).toContain('"TURNO"');
      }
    }
  });

  it("ogni tag ascoltato dagli esiti dei task temporanei appartiene a un task", () => {
    const tag = new Set(TASK_DISPONIBILI.flatMap((t) => t.tag));
    for (const id of ["METEORITE", "RELITTO", "SOCCORSO"]) expect(tag).toContain(id);
  });

  it("gli effetti scoprono solo scoperte esistenti", () => {
    for (const ef of TUTTI_GLI_EFFETTI) {
      if (ef.tipo === "SCOPERTA") expect(CATALOGO_SCOPERTE).toHaveProperty(ef.id);
    }
  });

  it("ogni scoperta del catalogo può essere ottenuta (da un evento o da un codice)", () => {
    const ottenibili = new Set(
      TUTTI_GLI_EFFETTI.flatMap((ef) =>
        ef.tipo === "SCOPERTA" ? [ef.id] : SCOPERTE_DEL_MOTORE[ef.tipo] ? [SCOPERTE_DEL_MOTORE[ef.tipo]!] : [],
      ),
    );
    for (const id of Object.keys(CATALOGO_SCOPERTE)) expect(ottenibili).toContain(id);
  });
});

describe("catalogo dei codici (Terminale SVC-07)", () => {
  /** Tutti i codici nascosti che possono comparire nel log: eventi, filtri e frasi di V.A.L.E. */
  const codiciNeiLog = new Set([
    ...EVENTI.flatMap((e) => e.codici),
    ...TUTTI_GLI_EFFETTI.flatMap((ef) => (ef.tipo === "LOG" ? (ef.codici ?? []) : [])),
    ...Object.values(TESTI_VALE.domande).flatMap((d) => d.risposte.flatMap((r) => r.log?.codici ?? [])),
    ...TESTI_VALE.rifiuto.codici,
  ]);

  it("ci sono esattamente sei livelli di accesso (0–5)", () => {
    expect(LIVELLI_ACCESSO).toHaveLength(LIVELLO_MASSIMO + 1);
  });

  it("ogni codice è già normalizzato e ha livelli coerenti", () => {
    for (const c of CODICI) {
      expect(c.codice).toBe(c.codice.toUpperCase().replace(/\s+/g, ""));
      expect(c.livelloOttenuto).toBeGreaterThan(c.livelloRichiesto);
      expect(c.livelloOttenuto).toBeLessThanOrEqual(LIVELLO_MASSIMO);
    }
  });

  it("ogni codice valido si può TROVARE in qualche log del gioco", () => {
    for (const c of CODICI) expect(codiciNeiLog).toContain(c.codice);
  });

  it("ogni livello richiesto è raggiungibile con un altro codice", () => {
    const raggiungibili = new Set([0, ...CODICI.map((c) => c.livelloOttenuto)]);
    for (const c of CODICI) expect(raggiungibili).toContain(c.livelloRichiesto);
  });
});

describe("direttive e filtri di V.A.L.E.", () => {
  it("ogni filtro cita direttive esistenti e ha una verità da rivelare", () => {
    for (const f of FILTRI) {
      expect(f.direttive.length).toBeGreaterThan(0);
      for (const d of f.direttive) expect(CATALOGO_DIRETTIVE).toHaveProperty(d);
      expect(f.verita.length).toBeGreaterThan(0);
    }
  });

  it("ogni filtro lascia trapelare la verità con una riga di SISTEMA", () => {
    for (const f of FILTRI) {
      expect(f.effetti.some((ef) => ef.tipo === "LOG" && ef.fonte === "SISTEMA")).toBe(true);
    }
  });

  it("la direttiva COMPATIBILE non filtra mai nulla", () => {
    const compatibili = Object.values(CATALOGO_DIRETTIVE).filter((d) => d.classe === "COMPATIBILE").map((d) => d.id);
    for (const f of FILTRI) for (const d of compatibili) expect(f.direttive).not.toContain(d);
  });

  it("le direttive escono tutte, con seed diversi", () => {
    const uscite = new Set(Array.from({ length: 60 }, (_, i) => creaMissioneIniziale(`S-${i}`).vale.direttiva));
    expect([...uscite].sort()).toEqual(Object.keys(CATALOGO_DIRETTIVE).sort());
  });
});

describe("missione iniziale", () => {
  it("rispetta gli slot del loadout e ha una coda per ogni membro", () => {
    const stato = creaMissioneIniziale();
    expect(stato.nave.moduli.length).toBeLessThanOrEqual(4);
    expect(stato.nave.equipaggiamento.length).toBeLessThanOrEqual(6);
    expect(Object.keys(stato.code).sort()).toEqual(Object.keys(stato.crew).sort());
  });

  it("parte senza scoperte, eventi né accessi al terminale", () => {
    const stato = creaMissioneIniziale();
    expect(stato.conoscenza.scoperte).toEqual([]);
    expect(stato.eventi).toEqual({ accaduti: [], inAttesa: null });
    expect(stato.terminale).toEqual({ livello: 0, frammenti: [], segnalate: [], tentativi: [] });
    expect(stato.vale).toMatchObject({ tensione: 0, override: false, affermazioni: [], contestazioni: [] });
  });
});

describe("catalogo del loadout e candidati (DESIGN §7.1, §11.3)", () => {
  it("ha 10 candidati, 15 moduli, 15 equipaggiamenti e 8 tipi di casse, con ID unici", () => {
    for (const [lista, quanti] of [
      [LISTA_CANDIDATI, 10],
      [LISTA_MODULI, 15],
      [LISTA_EQUIPAGGIAMENTO, 15],
      [LISTA_SCORTE, 8],
    ] as const) {
      expect(lista).toHaveLength(quanti);
      expect(new Set(lista.map((x) => x.id)).size).toBe(quanti);
    }
  });

  it("ogni oggetto richiesto da un task esiste nel catalogo", () => {
    for (const t of TASK_DISPONIBILI) {
      for (const e of t.equipaggiamentoRichiesto) expect(CATALOGO_EQUIPAGGIAMENTO[e]).toBeDefined();
      for (const m of t.moduliRichiesti) expect(CATALOGO_MODULI[m]).toBeDefined();
    }
  });

  it("ogni equipaggiamento citato dagli eventi esiste nel catalogo", () => {
    for (const c of TUTTE_LE_CONDIZIONI) if (c.tipo === "EQUIPAGGIAMENTO") expect(CATALOGO_EQUIPAGGIAMENTO[c.id]).toBeDefined();
  });

  it("ogni oggetto senza task, eventi o effetti dichiara cosa farà (inArrivo)", () => {
    const usati = new Set([
      ...TASK_DISPONIBILI.flatMap((t) => [...t.equipaggiamentoRichiesto, ...t.moduliRichiesti]),
      ...TUTTE_LE_CONDIZIONI.flatMap((c) => (c.tipo === "EQUIPAGGIAMENTO" ? [c.id] : [])),
    ]);
    for (const m of LISTA_MODULI) {
      if (!usati.has(m.id) && Object.keys(m.effetti).length === 0) expect(m.inArrivo).not.toBeNull();
    }
    for (const e of LISTA_EQUIPAGGIAMENTO) if (!usati.has(e.id)) expect(e.inArrivo).not.toBeNull();
    for (const s of LISTA_SCORTE) if (s.risorsa === null) expect(s.inArrivo).not.toBeNull();
  });

  it("ogni direttiva richiede tag che il catalogo può fornire", () => {
    const disponibili = new Set([...LISTA_MODULI, ...LISTA_EQUIPAGGIAMENTO].flatMap((o) => o.tag));
    for (const d of Object.values(CATALOGO_DIRETTIVE)) for (const t of d.richiede) expect(disponibili).toContain(t);
  });
});

describe("preparazione di riferimento (DESIGN §13.8)", () => {
  it("è POSSIBILE e sta nei limiti", () => {
    const problemi = problemiPreparazione(PREPARAZIONE_DI_RIFERIMENTO, CATALOGHI_PREPARAZIONE);
    expect(problemi).toEqual([]);
    expect(fattibilita(problemi)).toBe("POSSIBILE");
  });

  it("riproduce i numeri del DESIGN: 15 giorni di cibo e acqua, 26 di carburante, consumo 8, generazione 12", () => {
    const r = riepilogoPreparazione(PREPARAZIONE_DI_RIFERIMENTO, CATALOGHI_PREPARAZIONE);
    expect(r.risorse).toEqual({ cibo: 120, acqua: 120, ossigeno: 60, energia: 150, carburante: 26 });
    const p = parametriNave(PREPARAZIONE_DI_RIFERIMENTO.moduli, CATALOGO_MODULI);
    expect(p.consumoEnergia).toBe(8);
    expect(p.generazioneEnergia).toBe(12);
  });

  it("la missione creata contiene esattamente la crew scelta", () => {
    const prep = { ...PREPARAZIONE_DI_RIFERIMENTO, crew: ["marco", "giulia", "davide", "irene"] };
    const stato = creaMissioneIniziale("S-1", prep);
    expect(Object.keys(stato.crew).sort()).toEqual(["davide", "giulia", "irene", "marco"]);
    expect(Object.keys(stato.code).sort()).toEqual(["davide", "giulia", "irene", "marco"]);
  });

  it("la crew della missione è una COPIA: il catalogo dei candidati non cambia", () => {
    const stato = creaMissioneIniziale();
    const mara = stato.crew.mara;
    if (!mara) throw new Error("manca mara");
    mara.fatica = 99;
    expect(LISTA_CANDIDATI.find((c) => c.id === "mara")?.fatica).toBe(0);
  });

  it("senza drone a bordo la direttiva D05 (Preserva la struttura) non esce mai", () => {
    const senzaDrone = {
      ...PREPARAZIONE_DI_RIFERIMENTO,
      equipaggiamento: PREPARAZIONE_DI_RIFERIMENTO.equipaggiamento.filter((e) => e !== "DRONE_RICOGNIZIONE"),
    };
    const uscite = new Set(Array.from({ length: 60 }, (_, i) => creaMissioneIniziale(`S-${i}`, senzaDrone).vale.direttiva));
    expect(uscite.has("D05")).toBe(false);
    expect(uscite.size).toBeGreaterThan(1);
  });
});
