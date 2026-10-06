/**
 * ============================================================================
 * assegnazione.test.ts — Assegnare e rimuovere task dalle code
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { applicaAzione, verificaAssegnazione } from "../../../src/engine/mission";
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva";
import { esegui, task } from "../../fixtures/simulazione";
import { CONTESTO_DI_PROVA, DIAGNOSTICA, MANOVRA_ORBITALE, SCAVO_MINERARIO } from "../../fixtures/taskDiProva";

describe("ASSEGNA_TASK", () => {
  it("crea un'istanza in coda al responsabile, con un ID nuovo", () => {
    const stato = esegui(creaMissioneDiProva(), [
      { tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "nadia", supporto: "sarah" },
    ]);
    expect(stato.code.nadia).toEqual(["task-2"]);
    expect(task(stato, "task-2")).toMatchObject({
      responsabile: "nadia",
      supporto: "sarah",
      stato: "IN_CODA",
      rischio: null,
    });
    expect(stato.contatoreId).toBe(2);
  });

  it("aggiunge in fondo alla coda, rispettando l'ordine scelto dal Capitano", () => {
    const stato = esegui(creaMissioneDiProva(), [
      { tipo: "ASSEGNA_TASK", idDefinizione: MANOVRA_ORBITALE.id, responsabile: "mara", supporto: null },
    ]);
    expect(stato.code.mara).toEqual(["task-1", "task-2"]);
  });

  it("rifiuta le assegnazioni non valide con un motivo leggibile", () => {
    const stato = creaMissioneDiProva();
    const verifica = (def: string, resp: string, supp: string | null) =>
      verificaAssegnazione(stato, CONTESTO_DI_PROVA, def, resp, supp);

    expect(verifica("T-INESISTENTE", "mara", null)).toMatch(/sconosciuto/);
    expect(verifica(DIAGNOSTICA.id, "mara", "mara")).toMatch(/sé stesso/);
    expect(verifica(MANOVRA_ORBITALE.id, "adrian", "mara")).toMatch(/da soli/);
    expect(verifica(SCAVO_MINERARIO.id, "adrian", null)).toMatch(/TRIVELLA/);
    expect(verifica(DIAGNOSTICA.id, "mara", null)).toBeNull();
  });

  it("non assegna a un membro morto", () => {
    const stato = creaMissioneDiProva();
    stato.crew.sarah!.stato = "MORTO";
    expect(verificaAssegnazione(stato, CONTESTO_DI_PROVA, DIAGNOSTICA.id, "sarah", null)).toMatch(/non è in grado/);
  });

  it("il reducer lancia un errore se l'assegnazione non è valida", () => {
    expect(() =>
      applicaAzione(
        creaMissioneDiProva(),
        { tipo: "ASSEGNA_TASK", idDefinizione: SCAVO_MINERARIO.id, responsabile: "adrian", supporto: null },
        CONTESTO_DI_PROVA,
      ),
    ).toThrow(/TRIVELLA/);
  });

  it("non si può assegnare durante il rapporto serale", () => {
    const inRapporto = { ...creaMissioneDiProva(), statoGioco: "RAPPORTO" as const };
    expect(() =>
      applicaAzione(
        inRapporto,
        { tipo: "ASSEGNA_TASK", idDefinizione: DIAGNOSTICA.id, responsabile: "mara", supporto: null },
        CONTESTO_DI_PROVA,
      ),
    ).toThrow(/non permessa/);
  });
});

describe("RIMUOVI_TASK", () => {
  it("toglie il task dalla coda e lo segna ANNULLATO, senza cancellarlo", () => {
    const stato = esegui(creaMissioneDiProva(), [{ tipo: "RIMUOVI_TASK", idTask: "task-1" }]);
    expect(stato.code.mara).toEqual([]);
    expect(task(stato, "task-1").stato).toBe("ANNULLATO");
  });

  it("non si può rimuovere un task già in corso", () => {
    const inCorso = esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }]);
    expect(() => esegui(inCorso, [{ tipo: "RIMUOVI_TASK", idTask: "task-1" }])).toThrow(/in coda/);
  });
});
