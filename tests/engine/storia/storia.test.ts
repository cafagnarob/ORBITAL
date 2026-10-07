/**
 * ============================================================================
 * storia.test.ts — Le regole della storia emergente (v3.0)
 * ============================================================================
 *
 * Fazioni, protagonisti, esiti casuali, giornale di bordo, iniziative
 * della crew, porte chiuse da V.A.L.E., testo libero, fine della missione.
 * Tutto con la fixture (Mara 72 · Adrian 31 · Nadia 55 · Sarah 80):
 *   CON V.A.L.E.: Mara, Sarah · CONTRO: Adrian · INDECISA: Nadia.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { BALANCE } from "../../../src/content/balance";
import { applicaAzione, type Azione, type ContestoMissione } from "../../../src/engine/mission";
import { createRng } from "../../../src/engine/rng";
import { contaFazione, fazioneDaFiducia } from "../../../src/engine/storia/fazioni";
import { epilogo } from "../../../src/engine/storia/fine";
import { iniziativeMattino } from "../../../src/engine/storia/iniziative";
import type { DefinizioneDirettiva, DefinizioneEvento, StatoMissione } from "../../../src/engine/types";
import { interpretaTesto } from "../../../src/engine/vale/domande";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { avanzaFinoAPausa, membro, task } from "../../fixtures/simulazione";
import { CONTESTO_DI_PROVA, DIAGNOSTICA } from "../../fixtures/taskDiProva";
import { TESTI_VALE_DI_PROVA } from "../../fixtures/valeDiProva";

// ----------------------------------------------------------------------------
// Eventi e contesti di prova
// ----------------------------------------------------------------------------

/** Al rapporto serale: chi non si fida di V.A.L.E. litiga con chi si fida. */
const EV_LITE: DefinizioneEvento = {
  id: "EV-LITE",
  titolo: "Lite",
  categoria: "EQUIPAGGIO",
  priorita: "NORMALE",
  unaVolta: true,
  probabilita: 1,
  peso: 1,
  condizioni: [{ tipo: "MOMENTO", momento: "RAPPORTO_SERALE" }],
  protagonista: { fazione: "CONTRO_VALE" },
  secondo: { fazione: "CON_VALE", preferisci: "PIU_FIDUCIOSO" },
  fonte: "CREW",
  testo: "{P} litiga con {S}",
  codici: [],
  diario: "Lite tra {P} e {S}.",
  effetti: [],
  scelte: [
    {
      id: "DECIDI",
      etichetta: "Ragione a {P}",
      requisiti: [],
      effetti: [{ tipo: "FIDUCIA_MEMBRO", chi: "SECONDO", delta: -50 }],
      esiti: [
        { id: "IMPOSSIBILE", peso: 100, requisiti: [{ tipo: "SCOPERTA", id: "MAI" }], testo: "mai", effetti: [] },
        { id: "CERTO", peso: 1, requisiti: [], testo: "{P} sorride", effetti: [], diario: "{P} ha vinto." },
      ],
    },
    { id: "FINE", etichetta: "Basta, si torna", requisiti: [], effetti: [{ tipo: "FINE_MISSIONE", causa: "RIENTRO" }] },
  ],
};

/** Un evento che nessuno può vivere: serve un PILOTA indeciso (Adrian è CONTRO). */
const EV_IMPOSSIBILE: DefinizioneEvento = {
  ...EV_LITE,
  id: "EV-NESSUNO",
  priorita: "CRITICO",
  protagonista: { fazione: "INDECISO", ruolo: "PILOTA" },
  secondo: undefined,
};

const NEUTRA: DefinizioneDirettiva = { id: "D-T", nome: "Prova", classe: "IN_CONFLITTO", peso: 1, tagContrari: ["DIAGNOSTICA"], richiede: [] };

function contesto(extra: Partial<ContestoMissione> = {}): ContestoMissione {
  return {
    ...CONTESTO_DI_PROVA,
    catalogoEventi: { [EV_LITE.id]: EV_LITE, [EV_IMPOSSIBILE.id]: EV_IMPOSSIBILE },
    catalogoDirettive: { [NEUTRA.id]: NEUTRA },
    ...extra,
  };
}

function stato(tensione = 0): StatoMissione {
  const s = creaMissioneDiProva();
  s.vale.direttiva = NEUTRA.id;
  s.vale.tensione = tensione;
  return s;
}

const esegui = (s: StatoMissione, c: ContestoMissione, azioni: Azione[]) => azioni.reduce((acc, a) => applicaAzione(acc, a, c), s);

/** Gioca fino al primo rapporto serale (o alla prima decisione). */
const finoAllaSera = (c: ContestoMissione, s = stato()) => avanzaFinoAPausa(esegui(s, c, [{ tipo: "AVVIA_OPERAZIONI" }]), c);

// ----------------------------------------------------------------------------
describe("fazioni", () => {
  it("si ricavano dalla fiducia: ≥65 con V.A.L.E., ≤35 contro, in mezzo indecisi", () => {
    expect([80, 65, 64, 36, 35, 10].map(fazioneDaFiducia)).toEqual([
      "CON_VALE",
      "CON_VALE",
      "INDECISO",
      "INDECISO",
      "CONTRO_VALE",
      "CONTRO_VALE",
    ]);
    const s = stato();
    expect(contaFazione(s, "CON_VALE")).toBe(2);
    expect(contaFazione(s, "CONTRO_VALE")).toBe(1);
  });
});

// ----------------------------------------------------------------------------
describe("eventi con protagonista ed esiti casuali", () => {
  const c = contesto();

  it("sceglie protagonista e secondo dalle fazioni e mette i nomi nei testi", () => {
    const s = finoAllaSera(c);
    expect(s.statoGioco).toBe("DECISIONE");
    expect(s.eventi.inAttesa).toMatchObject({ id: "EV-LITE", protagonista: "adrian", secondo: "sarah" });
    expect(s.log.some((v) => v.testo === "Adrian litiga con Sarah")).toBe(true);
    expect(s.diario.some((v) => v.testo === "Lite tra Adrian e Sarah.")).toBe(true);
  });

  it("un evento senza nessuno adatto a viverlo non accade", () => {
    const s = finoAllaSera(c);
    expect(s.eventi.accaduti.some((r) => r.id === "EV-NESSUNO")).toBe(false);
  });

  it("la scelta colpisce il secondo, e l'esito esce solo tra quelli possibili", () => {
    const s = esegui(finoAllaSera(c), c, [{ tipo: "RISOLVI_EVENTO", idScelta: "DECIDI" }]);
    expect(membro(s, "sarah").fiduciaVale).toBe(30); // 80 − 50: ora è CONTRO
    expect(s.eventi.accaduti.at(-1)).toMatchObject({ id: "EV-LITE", protagonista: "adrian", esito: "CERTO" });
    expect(s.log.some((v) => v.testo === "Adrian sorride")).toBe(true);
    expect(s.diario.some((v) => v.testo === "Adrian ha vinto.")).toBe(true);
  });

  it("chi cambia fazione lo dice (battuta) e finisce nel giornale di bordo", () => {
    const s = esegui(finoAllaSera(c), c, [{ tipo: "RISOLVI_EVENTO", idScelta: "DECIDI" }]);
    expect(s.log.some((v) => v.fonte === "CREW" && v.testo === "Sarah: «CONTRO»")).toBe(true);
    expect(s.diario.some((v) => v.testo === "Sarah non si fida più di V.A.L.E.")).toBe(true);
  });
});

// ----------------------------------------------------------------------------
describe("fine della missione", () => {
  const c = contesto();

  it("FINE_MISSIONE chiude la partita con il finale giusto per priorità", () => {
    const base = finoAllaSera(c);
    const senza = esegui(base, c, [{ tipo: "RISOLVI_EVENTO", idScelta: "FINE" }]);
    expect(senza.statoGioco).toBe("CONCLUSA");
    expect(senza.esito).toMatchObject({ finale: "F_RIENTRO", causa: "RIENTRO" });

    const conVerita = structuredClone(base);
    conVerita.conoscenza.scoperte.push("DIRETTIVA_RIVELATA");
    expect(esegui(conVerita, c, [{ tipo: "RISOLVI_EVENTO", idScelta: "FINE" }]).esito?.finale).toBe("F_RIENTRO_VERITA");
  });

  it("a missione conclusa ogni azione è rifiutata", () => {
    const fine = esegui(finoAllaSera(c), c, [{ tipo: "RISOLVI_EVENTO", idScelta: "FINE" }]);
    expect(() => applicaAzione(fine, { tipo: "AVANZA" }, c)).toThrow(/conclusa/);
  });

  /** Lo stato di prova, ma al giorno 5 alle 06:00: in orbita attorno a E-17 (v3.7). */
  const inOrbita = (tensione = 0) => ({ ...stato(tensione), tempo: 4 * 1440 + 360 });

  it("durante il viaggio d'andata il rientro non si può ordinare", () => {
    expect(() => esegui(stato(), c, [{ tipo: "RIENTRA" }])).toThrow(/in viaggio verso E-17/);
  });

  it("RIENTRA senza carburante oltre la riserva porta alla deriva", () => {
    const s = inOrbita();
    s.risorse.carburante = 10;
    expect(esegui(s, c, [{ tipo: "RIENTRA" }]).esito?.causa).toBe("DERIVA");
  });

  it("RIENTRA fa partire la nave: si paga la riserva, la missione finisce all'arrivo", () => {
    const s = esegui(inOrbita(), c, [{ tipo: "RIENTRA" }]);
    expect(s.statoGioco).not.toBe("CONCLUSA");
    expect(s.partenza).toBe(s.tempo);
    expect(s.risorse.carburante).toBe(inOrbita().risorse.carburante - BALANCE.preparazione.riservaRientro);
    // Si salta in avanti di tre giorni, all'alba: si arriva a casa.
    const vigilia: StatoMissione = { ...s, tempo: s.tempo + 3 * 1440 - 1, statoGioco: "IN_ESECUZIONE" };
    const arrivo = esegui(vigilia, contesto({ catalogoEventi: {} }), [{ tipo: "AVANZA" }]);
    expect(arrivo.esito?.causa).toBe("RIENTRO");
  });

  it("con autonomia AUTONOMA V.A.L.E. rifiuta il rientro (finché non c'è l'override)", () => {
    const s = esegui(inOrbita(9), c, [{ tipo: "RIENTRA" }]); // IN_CONFLITTO 2 + 9/3 = 5 → autonomia 4
    expect(s.statoGioco).toBe("PIANIFICAZIONE");
    expect(s.partenza).toBeNull();
    expect(s.log.some((v) => v.codici.includes("ORD-01"))).toBe(true);
    const conOverride = inOrbita(9);
    conOverride.vale.override = true;
    expect(esegui(conOverride, c, [{ tipo: "RIENTRA" }]).partenza).not.toBeNull();
  });

  it("se nessuno è più vivo la missione finisce in MORTE", () => {
    const s = stato();
    for (const m of Object.values(s.crew)) m.salute = 5;
    s.risorse.ossigeno = 0;
    s.risorse.acqua = 0;
    const fine = finoAllaSera(contesto({ catalogoEventi: {} }), s);
    expect(fine.statoGioco).toBe("CONCLUSA");
    expect(fine.esito?.causa).toBe("MORTE");
    const e = epilogo(fine, contesto());
    expect(e.testo).toContain("Mara");
    expect(e.crew.find((x) => x.id === "mara")?.riga).toBe("Mara-MORTO");
  });
});

// ----------------------------------------------------------------------------
describe("la crew agisce da sola", () => {
  it("chi sta con V.A.L.E. rifiuta i task che lei sconsiglia (comportamento ≥ 3)", () => {
    const c = contesto({ catalogoEventi: {} });
    const s = esegui(stato(3), c, [{ tipo: "AVVIA_OPERAZIONI" }]); // Mara (72) e la diagnostica contraria
    expect(task(s, "task-1").stato).toBe("ANNULLATO");
    expect(s.log.some((v) => v.testo === "Mara: «RIFIUTO-CREW»")).toBe(true);
  });

  it("chi non si fida contesta da solo e si mette in coda la verifica", () => {
    const VERIFICA = { ...DIAGNOSTICA, id: "T-VER", nome: "Verifica", tag: ["VERIFICA"], luogo: "LABORATORIO" as const };
    const c = contesto({ catalogoEventi: {}, catalogoTask: { ...CONTESTO_DI_PROVA.catalogoTask, [VERIFICA.id]: VERIFICA } });
    // Proviamo molti generatori: con probabilità 0.35 almeno uno deve far agire Adrian.
    const riusciti = Array.from({ length: 20 }, (_, i) => {
      const s = stato();
      iniziativeMattino(s, c, createRng(i + 1));
      return s;
    }).filter((s) => s.vale.contestazioni.length > 0);
    expect(riusciti.length).toBeGreaterThan(0);
    const s = riusciti[0]!;
    expect(s.log.some((v) => v.testo === "Adrian contesta un'affermazione di V.A.L.E.")).toBe(true);
    expect(Object.values(s.tasks).some((t) => t.idDefinizione === "T-VER" && t.responsabile === "adrian")).toBe(true);
  });
});

// ----------------------------------------------------------------------------
describe("V.A.L.E. chiude i compartimenti", () => {
  it("con autonomia AUTONOMA un task contrario fa chiudere il suo compartimento", () => {
    const c = contesto({ catalogoEventi: {} });
    const s = esegui(stato(9), c, [{ tipo: "AVVIA_OPERAZIONI" }]);
    expect(s.nave.accessi.INGEGNERIA).toBe("BLOCCATO");
    expect(s.conoscenza.scoperte).toContain("BLOCCO_VALE");
    // …e lì non si può più assegnare nulla.
    expect(() => applicaAzione(s, { tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "nadia", supporto: null }, c)).toThrow(
      /bloccato/,
    );
  });

  it("l'override (ORD-01) riapre tutte le porte", () => {
    const c = contesto({ catalogoEventi: {}, catalogoCodici: {} });
    const s = esegui(stato(9), c, [{ tipo: "AVVIA_OPERAZIONI" }]);
    const conCodice: ContestoMissione = {
      ...c,
      catalogoCodici: { "ORD-T": { codice: "ORD-T", livelloRichiesto: 0, livelloOttenuto: 1, risposta: [], effetti: [{ tipo: "OVERRIDE_VALE" }] } },
    };
    const dopo = esegui(s, conCodice, [{ tipo: "INSERISCI_CODICE", codice: "ORD-T" }]);
    expect(dopo.nave.accessi.INGEGNERIA).toBe("APERTO");
  });
});

// ----------------------------------------------------------------------------
describe("giornale di bordo", () => {
  it("al rapporto serale racconta la giornata (riempitivo se vuota)", () => {
    const s = finoAllaSera(contesto({ catalogoEventi: {} }));
    expect(s.diario.filter((v) => v.giorno === 1).map((v) => v.testo)).toContain("VUOTO");
  });
});

// ----------------------------------------------------------------------------
describe("testo libero verso V.A.L.E.", () => {
  const c = contesto({ catalogoEventi: {} });

  it("riconosce le parole chiave, anche con accenti e maiuscole", () => {
    expect(interpretaTesto("Quali DANNI ha la nave?", TESTI_VALE_DI_PROVA.paroleChiave)).toBe("DANNI");
    expect(interpretaTesto("perché?", TESTI_VALE_DI_PROVA.paroleChiave)).toBe("PERCHE");
    expect(interpretaTesto("perché menti?", TESTI_VALE_DI_PROVA.paroleChiave)).toBe("ACCUSA");
    expect(interpretaTesto("buonanotte", TESTI_VALE_DI_PROVA.paroleChiave)).toBeNull();
  });

  it("risponde con i dati veri, e accusarla fa salire la tensione", () => {
    const s = stato();
    s.nave.sistemi.COMUNICAZIONI = 40;
    const dopo = esegui(s, c, [
      { tipo: "SCRIVI_VALE", testo: "danni?" },
      { tipo: "SCRIVI_VALE", testo: "Mi stai mentendo" },
      { tipo: "SCRIVI_VALE", testo: "asdf" },
    ]);
    expect(dopo.log.some((v) => v.fonte === "VALE" && v.testo.includes("comunicazioni 40%"))).toBe(true);
    expect(dopo.vale.tensione).toBe(1);
    expect(dopo.log.at(-1)?.testo).toBe("NON-CAPITO");
  });
});
