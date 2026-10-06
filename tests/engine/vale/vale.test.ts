/**
 * ============================================================================
 * vale.test.ts — Il livello V.A.L.E.: direttiva, comportamento, filtro,
 *                contestazioni, rifiuti, domande, integrità dei dati
 * ============================================================================
 *
 * Ogni test costruisce il contesto che gli serve partendo da quello di
 * prova, così si vede chiaramente QUALE regola sta verificando.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  applicaAzione,
  autonomia,
  comportamento,
  integritaDati,
  scegliDirettiva,
  stimaRischio,
  verificaAssegnazione,
  type Azione,
  type ContestoMissione,
} from "../../../src/engine/mission";
import type { DefinizioneDirettiva, DefinizioneEvento, DefinizioneTask, StatoMissione } from "../../../src/engine/types";
import { risolviVerifica } from "../../../src/engine/vale/contestazioni";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { membro, task } from "../../fixtures/simulazione";
import { CONTESTO_DI_PROVA, DIAGNOSTICA } from "../../fixtures/taskDiProva";

// ----------------------------------------------------------------------------
// Costruttori di contesto e stato per i test
// ----------------------------------------------------------------------------

function direttiva(classe: DefinizioneDirettiva["classe"], tagContrari: string[] = []): DefinizioneDirettiva {
  return { id: "D-TEST", nome: "Direttiva di test", classe, peso: 1, tagContrari, richiede: [] };
}

const VERIFICA: DefinizioneTask = { ...DIAGNOSTICA, id: "T-VERIFICA", nome: "Verifica", tag: ["VERIFICA"] };

/** Evento che scatta alla fine di una diagnostica, filtrato con D-TEST. */
const EV_FILTRATO: DefinizioneEvento = {
  id: "EV-F",
  titolo: "Filtrato",
  categoria: "NARRATIVO",
  priorita: "IMPORTANTE",
  unaVolta: true,
  probabilita: 1,
  peso: 1,
  condizioni: [{ tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA" }],
  fonte: "VALE",
  testo: "VERITÀ DETTA",
  codici: [],
  effetti: [{ tipo: "SCOPERTA", id: "ORIGINALE" }],
  scelte: [{ id: "OK", etichetta: "Ok", requisiti: [], effetti: [] }],
  filtri: [
    {
      id: "F1",
      direttive: ["D-TEST"],
      modalita: "OMISSIONE",
      testo: "NIENTE DA SEGNALARE",
      effetti: [{ tipo: "LOG", fonte: "SISTEMA", testo: "DATO SOPPRESSO", codici: ["X-1"] }],
      sopprimeScelte: true,
      verita: [{ tipo: "SCOPERTA", id: "VERITA_NASCOSTA" }],
    },
  ],
};

function contesto(d: DefinizioneDirettiva, extra: Partial<ContestoMissione> = {}): ContestoMissione {
  return {
    ...CONTESTO_DI_PROVA,
    catalogoTask: { ...CONTESTO_DI_PROVA.catalogoTask, [VERIFICA.id]: VERIFICA },
    catalogoDirettive: { [d.id]: d },
    ...extra,
  };
}

function stato(tensione = 0): StatoMissione {
  const s = creaMissioneDiProva();
  s.vale.direttiva = "D-TEST";
  s.vale.tensione = tensione;
  return s;
}

const esegui = (s: StatoMissione, c: ContestoMissione, azioni: Azione[]) =>
  azioni.reduce((acc, a) => applicaAzione(acc, a, c), s);

// ----------------------------------------------------------------------------
describe("direttiva", () => {
  const catalogo = [
    { ...direttiva("COMPATIBILE"), id: "A", peso: 1 },
    { ...direttiva("IN_CONFLITTO"), id: "B", peso: 1 },
  ];

  it("la scelta è deterministica e non dipende dall'ordine del catalogo", () => {
    expect(scegliDirettiva("SEED-1", catalogo)).toBe(scegliDirettiva("SEED-1", [...catalogo].reverse()));
  });

  it("seed diversi producono direttive diverse", () => {
    const uscite = new Set(Array.from({ length: 40 }, (_, i) => scegliDirettiva(`S-${i}`, catalogo)));
    expect(uscite.size).toBe(2);
  });
});

// ----------------------------------------------------------------------------
describe("comportamento e autonomia (calcolati)", () => {
  it("partono dalla classe della direttiva", () => {
    expect(comportamento(stato(), contesto(direttiva("COMPATIBILE")))).toBe("SUPPORTIVA");
    expect(comportamento(stato(), contesto(direttiva("IN_CONFLITTO")))).toBe("NEUTRALE");
    expect(autonomia(stato(), contesto(direttiva("IN_CONFLITTO")))).toBe("ROUTINE");
  });

  it("salgono con la tensione, senza superare il massimo", () => {
    const c = contesto(direttiva("IN_CONFLITTO"));
    expect(comportamento(stato(3), c)).toBe("PERSISTENTE");
    expect(comportamento(stato(6), c)).toBe("RESISTENTE");
    expect(autonomia(stato(6), c)).toBe("RESTRITTIVA");
    expect(comportamento(stato(99), c)).toBe("OSTILE");
    expect(autonomia(stato(99), c)).toBe("AUTONOMA");
  });

  it("l'override tiene l'autonomia a ROUTINE anche con tensione altissima", () => {
    const s = stato(99);
    s.vale.override = true;
    expect(autonomia(s, contesto(direttiva("IN_CONFLITTO")))).toBe("ROUTINE");
  });
});

// ----------------------------------------------------------------------------
describe("filtro informativo", () => {
  const c = contesto(direttiva("IN_CONFLITTO"), { catalogoEventi: { [EV_FILTRATO.id]: EV_FILTRATO } });
  const dopoDiagnostica = () => esegui(stato(), c, [{ tipo: "AVVIA_OPERAZIONI" }, { tipo: "AVANZA" }]);

  it("V.A.L.E. dice il testo del filtro, non quello dell'evento", () => {
    const s = dopoDiagnostica();
    expect(s.log.some((v) => v.fonte === "VALE" && v.testo === "NIENTE DA SEGNALARE")).toBe(true);
    expect(s.log.some((v) => v.testo === "VERITÀ DETTA")).toBe(false);
  });

  it("gli effetti originali sono sostituiti e la riga di sistema lascia trapelare la verità", () => {
    const s = dopoDiagnostica();
    expect(s.conoscenza.scoperte).not.toContain("ORIGINALE");
    expect(s.log.find((v) => v.testo === "DATO SOPPRESSO")?.codici).toEqual(["X-1"]);
  });

  it("le scelte spariscono: niente decisione, e l'affermazione è registrata", () => {
    const s = dopoDiagnostica();
    expect(s.statoGioco).not.toBe("DECISIONE");
    expect(s.eventi.accaduti.at(-1)?.scelta).toBe("FILTRATO:F1");
    expect(s.vale.affermazioni).toHaveLength(1);
    expect(s.log[s.vale.affermazioni[0]!.indice]?.testo).toBe("NIENTE DA SEGNALARE");
  });

  it("con un'altra direttiva l'evento accade normalmente (V.A.L.E. dice la verità)", () => {
    const s = esegui(creaMissioneDiProva(), { ...c, catalogoDirettive: CONTESTO_DI_PROVA.catalogoDirettive }, [
      { tipo: "AVVIA_OPERAZIONI" },
      { tipo: "AVANZA" },
    ]);
    expect(s.statoGioco).toBe("DECISIONE");
    expect(s.conoscenza.scoperte).toContain("ORIGINALE");
  });
});

// ----------------------------------------------------------------------------
describe("contestazioni e verifica", () => {
  const c = contesto(direttiva("IN_CONFLITTO"), { catalogoEventi: { [EV_FILTRATO.id]: EV_FILTRATO } });

  it("si possono contestare solo le voci di V.A.L.E., una volta sola", () => {
    const s = stato();
    expect(() => esegui(s, c, [{ tipo: "CONTESTA", indice: 999 }])).toThrow(/inesistente/);
    s.log.push({ tempo: 360, fonte: "SISTEMA", testo: "riga di sistema", codici: [] });
    expect(() => esegui(s, c, [{ tipo: "CONTESTA", indice: 1 }])).toThrow(/V\.A\.L\.E\./);
    const una = esegui(s, c, [{ tipo: "CONTESTA", indice: 0 }]);
    expect(() => esegui(una, c, [{ tipo: "CONTESTA", indice: 0 }])).toThrow(/già contestata/);
  });

  it("contestare fa salire la tensione e V.A.L.E. risponde", () => {
    const s = esegui(stato(), c, [{ tipo: "CONTESTA", indice: 0 }]);
    expect(s.vale.tensione).toBe(1);
    expect(s.log.at(-1)).toMatchObject({ fonte: "VALE", testo: "CONTESTAZIONE-0" });
  });

  it("la verifica si può assegnare solo se c'è una contestazione aperta", () => {
    const s = stato();
    expect(verificaAssegnazione(s, c, VERIFICA.id, "nadia", null)).toMatch(/Nessuna affermazione/);
    const contestato = esegui(s, c, [{ tipo: "CONTESTA", indice: 0 }]);
    expect(verificaAssegnazione(contestato, c, VERIFICA.id, "nadia", null)).toBeNull();
  });

  it("verificare un'affermazione FILTRATA la smentisce: verità rivelata, fiducia giù", () => {
    const filtrato = esegui(stato(), c, [{ tipo: "AVVIA_OPERAZIONI" }, { tipo: "AVANZA" }]);
    const indice = filtrato.vale.affermazioni[0]!.indice;
    const bozza = esegui(filtrato, c, [{ tipo: "CONTESTA", indice }]);
    const prima = membro(bozza, "mara").fiduciaVale;
    risolviVerifica(bozza, c, "SUCCESSO");
    expect(bozza.vale.contestazioni[0]?.stato).toBe("SMENTITA");
    expect(bozza.conoscenza.scoperte).toContain("VERITA_NASCOSTA");
    expect(membro(bozza, "mara").fiduciaVale).toBe(prima - 15);
  });

  it("verificare un'affermazione SINCERA la conferma: la fiducia sale", () => {
    const bozza = esegui(stato(), c, [{ tipo: "CONTESTA", indice: 0 }]);
    const prima = membro(bozza, "sarah").fiduciaVale;
    risolviVerifica(bozza, c, "SUCCESSO_PARZIALE");
    expect(bozza.vale.contestazioni[0]?.stato).toBe("CONFERMATA");
    expect(membro(bozza, "sarah").fiduciaVale).toBe(prima + 5);
  });

  it("una verifica fallita lascia la contestazione aperta", () => {
    const bozza = esegui(stato(), c, [{ tipo: "CONTESTA", indice: 0 }]);
    risolviVerifica(bozza, c, "FALLIMENTO");
    expect(bozza.vale.contestazioni[0]?.stato).toBe("APERTA");
    expect(bozza.log.at(-1)?.testo).toBe("INCONCLUSIVA");
  });

  it("chi cambia fazione (passa CONTRO V.A.L.E.) lo dice nel log", () => {
    const bozza = esegui(stato(), c, [{ tipo: "CONTESTA", indice: 0 }]);
    bozza.crew.adrian!.fiduciaVale = 40; // indeciso: la smentita (−15) lo porta sotto 35
    bozza.vale.affermazioni.push({ indice: 0, idEvento: EV_FILTRATO.id, idFiltro: "F1" });
    risolviVerifica(bozza, c, "SUCCESSO");
    expect(bozza.log.some((v) => v.fonte === "CREW" && v.testo.startsWith("Adrian"))).toBe(true);
  });
});

// ----------------------------------------------------------------------------
describe("task contrari alla direttiva", () => {
  it("con autonomia bassa partono, ma la tensione sale", () => {
    const c = contesto(direttiva("COMPATIBILE", ["DIAGNOSTICA"]));
    const s = esegui(stato(), c, [{ tipo: "AVVIA_OPERAZIONI" }]);
    expect(task(s, "task-1").stato).toBe("IN_CORSO");
    expect(s.vale.tensione).toBe(2);
  });

  it("con autonomia RESTRITTIVA V.A.L.E. li rifiuta e lascia il codice ORD nel log", () => {
    const c = contesto(direttiva("IN_CONFLITTO", ["DIAGNOSTICA"]));
    const prima = stato(6); // RESISTENTE → autonomia RESTRITTIVA
    const s = esegui(prima, c, [{ tipo: "AVVIA_OPERAZIONI" }]);
    expect(task(s, "task-1").stato).toBe("ANNULLATO");
    expect(s.log.some((v) => v.fonte === "VALE" && v.testo === "RIFIUTO")).toBe(true);
    expect(s.log.some((v) => v.codici.includes("ORD-T"))).toBe(true);
    expect(membro(s, "mara").fiduciaVale).toBe(membro(prima, "mara").fiduciaVale - 10);
  });
});

// ----------------------------------------------------------------------------
describe("domande a V.A.L.E.", () => {
  const c = contesto(direttiva("IN_CONFLITTO"));

  it("la risposta dipende dal comportamento", () => {
    const calma = esegui(stato(0), c, [{ tipo: "INTERROGA_VALE", domanda: "PERCHE" }]);
    expect(calma.log.at(-1)?.testo).toBe("PERCHE-0");
    const tesa = esegui(stato(3), c, [{ tipo: "INTERROGA_VALE", domanda: "PERCHE" }]);
    expect(tesa.log.some((v) => v.testo === "PERCHE-3")).toBe(true);
  });

  it("alcune risposte lasciano un codice nascosto nel log", () => {
    const s = esegui(stato(), c, [{ tipo: "INTERROGA_VALE", domanda: "DIRETTIVA" }]);
    expect(s.log.at(-1)?.codici).toEqual(["DIR-T"]);
  });

  it("le domande non fanno scorrere il tempo né consumano l'Rng", () => {
    const prima = stato();
    const s = esegui(prima, c, [{ tipo: "INTERROGA_VALE", domanda: "STATO" }]);
    expect(s.tempo).toBe(prima.tempo);
    expect(s.rngState).toBe(prima.rngState);
  });
});

// ----------------------------------------------------------------------------
describe("codici speciali del terminale", () => {
  const c = contesto(direttiva("IN_CONFLITTO"), {
    catalogoCodici: {
      "DIR-T": { codice: "DIR-T", livelloRichiesto: 0, livelloOttenuto: 4, risposta: [], effetti: [{ tipo: "RIVELA_DIRETTIVA" }] },
      "ORD-T": { codice: "ORD-T", livelloRichiesto: 4, livelloOttenuto: 5, risposta: [], effetti: [{ tipo: "OVERRIDE_VALE" }] },
    },
  });

  it("DIR rivela la direttiva: diventa conoscenza e compare nel log", () => {
    const s = esegui(stato(), c, [{ tipo: "INSERISCI_CODICE", codice: "DIR-T" }]);
    expect(s.conoscenza.scoperte).toContain("DIRETTIVA_RIVELATA");
    expect(s.log.some((v) => v.testo.includes("DIRETTIVA DI TEST"))).toBe(true);
  });

  it("ORD attiva l'override: autonomia al minimo, ma V.A.L.E. se ne accorge", () => {
    const s = esegui(stato(6), c, [
      { tipo: "INSERISCI_CODICE", codice: "DIR-T" },
      { tipo: "INSERISCI_CODICE", codice: "ORD-T" },
    ]);
    expect(s.vale.override).toBe(true);
    expect(autonomia(s, c)).toBe("ROUTINE");
    expect(s.vale.tensione).toBe(9);
    expect(s.log.some((v) => v.fonte === "VALE" && v.testo === "OVERRIDE-1")).toBe(true);
  });

  it("un tentativo fallito nel terminale fa salire la tensione", () => {
    const s = esegui(stato(), c, [{ tipo: "INSERISCI_CODICE", codice: "SBAGLIATO" }]);
    expect(s.vale.tensione).toBe(1);
  });
});

// ----------------------------------------------------------------------------
describe("integrità dei dati e stima del rischio", () => {
  it("con sistemi integri l'integrità è 100 e la stima coincide con il rischio vero", () => {
    const s = creaMissioneDiProva();
    expect(integritaDati(s, CONTESTO_DI_PROVA)).toBe(100);
    expect(stimaRischio(s, CONTESTO_DI_PROVA, "T-X", 37)).toBe(37);
  });

  it("con sensori danneggiati la stima può sbagliare, ma entro l'errore massimo", () => {
    const s = creaMissioneDiProva();
    s.nave.sistemi.SCIENZA = 20;
    s.nave.sistemi.NAVIGAZIONE = 40;
    s.nave.sistemi.COMUNICAZIONI = 40;
    const integrita = integritaDati(s, CONTESTO_DI_PROVA); // 0.4·20 + 0.3·40 + 0.3·40 = 32
    expect(integrita).toBe(32);
    const errMax = (100 - integrita) * 0.5;
    const stime = ["T-A", "T-B", "T-C", "T-D", "T-E", "T-F"].map((id) => stimaRischio(s, CONTESTO_DI_PROVA, id, 50));
    for (const st of stime) expect(Math.abs(st - 50)).toBeLessThanOrEqual(Math.ceil(errMax));
    expect(new Set(stime).size).toBeGreaterThan(1); // non sempre lo stesso errore
  });

  it("la stima è deterministica: stesso stato, stesso task → stesso numero", () => {
    const s = creaMissioneDiProva();
    s.nave.sistemi.SCIENZA = 30;
    expect(stimaRischio(s, CONTESTO_DI_PROVA, "T-A", 40)).toBe(stimaRischio(structuredClone(s), CONTESTO_DI_PROVA, "T-A", 40));
  });
});
