/**
 * ============================================================================
 * eventi.test.ts — Il sistema di eventi: condizioni, selezione, decisioni
 * ============================================================================
 *
 * La fixture ha "task-1" (Diagnostica di Mara) già in coda: avviando le
 * operazioni e avanzando una volta, la diagnostica finisce e fa scattare
 * gli eventi di prova.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { verificaCondizione, type MomentoEventi } from "../../../src/engine/eventi/condizioni";
import { applicaAzione, verificaAssegnazione, verificaScelta, type Azione } from "../../../src/engine/mission";
import type { StatoMissione } from "../../../src/engine/types";
import { CONTESTO_CON_EVENTI } from "../../fixtures/eventiDiProva";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { membro } from "../../fixtures/simulazione";
import { DIAGNOSTICA } from "../../fixtures/taskDiProva";

const esegui = (s: StatoMissione, azioni: Azione[]) =>
  azioni.reduce((acc, a) => applicaAzione(acc, a, CONTESTO_CON_EVENTI), s);

/** Avvia le operazioni e fa finire la diagnostica di Mara: scatta EV_DECISIONE. */
function finoAllaDecisione(): StatoMissione {
  return esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }, { tipo: "AVANZA" }]);
}

// ----------------------------------------------------------------------------
describe("condizioni", () => {
  const vuoto: MomentoEventi = { rapportoSerale: false, risveglio: false, tasksConclusi: [] };

  it("SCOPERTA / NON_SCOPERTA leggono la conoscenza", () => {
    const s = creaMissioneDiProva();
    s.conoscenza.scoperte.push("X");
    expect(verificaCondizione(s, CONTESTO_CON_EVENTI, { tipo: "SCOPERTA", id: "X" }, vuoto)).toBe(true);
    expect(verificaCondizione(s, CONTESTO_CON_EVENTI, { tipo: "NON_SCOPERTA", id: "X" }, vuoto)).toBe(false);
  });

  it("UNO_TRA è vera se almeno una condizione interna è vera", () => {
    const s = creaMissioneDiProva();
    const c = {
      tipo: "UNO_TRA" as const,
      condizioni: [
        { tipo: "SCOPERTA" as const, id: "NO" },
        { tipo: "EQUIPAGGIAMENTO" as const, id: "TUTA_EVA_MK2" },
      ],
    };
    expect(verificaCondizione(s, CONTESTO_CON_EVENTI, c, vuoto)).toBe(true);
  });

  it("TASK_CONCLUSO_ORA rispetta esitoAlmeno ed esitoAlPiu", () => {
    const s = creaMissioneDiProva();
    s.tasks["task-1"] = { ...s.tasks["task-1"]!, stato: "COMPLETATO", esito: "SUCCESSO_PARZIALE" };
    const ora: MomentoEventi = { ...vuoto, tasksConclusi: ["task-1"] };
    const verifica = (extra: object) =>
      verificaCondizione(s, CONTESTO_CON_EVENTI, { tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA", ...extra }, ora);

    expect(verifica({})).toBe(true);
    expect(verifica({ esitoAlmeno: "SUCCESSO_PARZIALE" })).toBe(true);
    expect(verifica({ esitoAlmeno: "SUCCESSO" })).toBe(false);
    expect(verifica({ esitoAlPiu: "FALLIMENTO" })).toBe(false);
    // Senza task concluso in QUESTO momento la condizione è falsa.
    expect(verificaCondizione(s, CONTESTO_CON_EVENTI, { tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA" }, vuoto)).toBe(false);
  });
});

// ----------------------------------------------------------------------------
describe("attivazione", () => {
  it("un evento con scelte ferma il gioco in DECISIONE", () => {
    const s = finoAllaDecisione();
    expect(s.statoGioco).toBe("DECISIONE");
    expect(s.eventi.inAttesa).toEqual({
      id: "T-DEC",
      ritorno: "IN_ESECUZIONE",
      idTaskOrigine: "task-1",
      protagonista: null,
      secondo: null,
    });
    expect(s.log.some((v) => v.testo === "Evento T-DEC")).toBe(true);
  });

  it("vince la priorità più alta e scatta un solo evento per momento", () => {
    const s = finoAllaDecisione();
    expect(s.nave.scafo).toBe(100); // EV_SFONDO (scafo −1) non è scattato
  });

  it("gli effetti immediati colpiscono il responsabile del task d'origine", () => {
    const s = finoAllaDecisione();
    // Fatica della diagnostica + 5 dell'evento.
    expect(membro(s, "mara").fatica).toBe(DIAGNOSTICA.costoFatica + 5);
  });

  it("in DECISIONE non si può avanzare né assegnare", () => {
    const s = finoAllaDecisione();
    expect(() => esegui(s, [{ tipo: "AVANZA" }])).toThrow(/non permessa/);
    expect(() =>
      esegui(s, [{ tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "nadia", supporto: null }]),
    ).toThrow(/non permessa/);
  });
});

// ----------------------------------------------------------------------------
describe("risoluzione (RISOLVI_EVENTO)", () => {
  it("applica gli effetti della scelta, registra l'evento e torna dov'era", () => {
    const prima = finoAllaDecisione();
    const s = esegui(prima, [{ tipo: "RISOLVI_EVENTO", idScelta: "PRENDI" }]);
    expect(s.statoGioco).toBe("IN_ESECUZIONE");
    expect(s.conoscenza.scoperte).toEqual(["INDIZIO"]);
    expect(s.risorse.energia).toBe(prima.risorse.energia - 10);
    expect(s.eventi.accaduti).toEqual([{ id: "T-DEC", tempo: prima.tempo, scelta: "PRENDI", protagonista: null, esito: null }]);
    expect(s.eventi.inAttesa).toBeNull();
  });

  it("una scelta con requisiti non soddisfatti è rifiutata", () => {
    const s = finoAllaDecisione();
    expect(verificaScelta(s, CONTESTO_CON_EVENTI, "TRIVELLA")).toMatch(/Requisiti/);
    expect(() => esegui(s, [{ tipo: "RISOLVI_EVENTO", idScelta: "TRIVELLA" }])).toThrow();
  });

  it("un evento 'una volta sola' non si ripete", () => {
    let s = esegui(finoAllaDecisione(), [
      { tipo: "RISOLVI_EVENTO", idScelta: "LASCIA" },
      { tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "mara", supporto: null },
    ]);
    // Avanza finché la seconda diagnostica è finita: niente nuova decisione.
    s = esegui(s, [{ tipo: "AVANZA" }]);
    expect(s.statoGioco).not.toBe("DECISIONE");
    expect(s.eventi.accaduti.filter((r) => r.id === "T-DEC")).toHaveLength(1);
  });

  it("un evento al risveglio usa la conoscenza acquisita e limita i valori", () => {
    let s = esegui(finoAllaDecisione(), [{ tipo: "RISOLVI_EVENTO", idScelta: "PRENDI" }]);
    for (let i = 0; i < 20 && s.statoGioco !== "PIANIFICAZIONE"; i++) {
      s = esegui(s, [{ tipo: s.statoGioco === "RAPPORTO" ? "CHIUDI_RAPPORTO" : "AVANZA" }]);
    }
    expect(s.conoscenza.scoperte).toContain("SECONDO_INDIZIO");
    expect(s.nave.sistemi.SCIENZA).toBe(0); // −150 limitato a 0, mai negativo
  });

  it("salvare durante una decisione e ricaricare non cambia nulla", () => {
    const s = finoAllaDecisione();
    const ricaricata: StatoMissione = JSON.parse(JSON.stringify(s));
    const azione: Azione = { tipo: "RISOLVI_EVENTO", idScelta: "PRENDI" };
    expect(esegui(ricaricata, [azione])).toEqual(esegui(s, [azione]));
  });
});

// ----------------------------------------------------------------------------
describe("task che richiedono scoperte", () => {
  it("un task bloccato diventa assegnabile dopo la scoperta", () => {
    const s = creaMissioneDiProva();
    const contesto = {
      ...CONTESTO_CON_EVENTI,
      catalogoTask: {
        ...CONTESTO_CON_EVENTI.catalogoTask,
        "T-SEGRETO": { ...DIAGNOSTICA, id: "T-SEGRETO", scoperteRichieste: ["INDIZIO"] },
      },
    };
    expect(verificaAssegnazione(s, contesto, "T-SEGRETO", "mara", null)).toMatch(/informazioni insufficienti/);
    s.conoscenza.scoperte.push("INDIZIO");
    expect(verificaAssegnazione(s, contesto, "T-SEGRETO", "mara", null)).toBeNull();
  });
});
