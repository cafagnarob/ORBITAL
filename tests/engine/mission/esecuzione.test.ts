/**
 * ============================================================================
 * esecuzione.test.ts — Avvio e conclusione dei task durante la giornata
 * ============================================================================
 *
 * I tempi attesi si calcolano con le stesse funzioni del motore (valutaTask,
 * BALANCE): così i test verificano che i PEZZI siano collegati bene, senza
 * rompersi quando ribilanci i numeri.
 * ============================================================================
 */

import { describe, it, expect } from "vitest"
import { BALANCE } from "../../../src/content/balance"
import { ORARIO_OPERAZIONI, ORARIO_RAPPORTO } from "../../../src/engine/clock"
import type { ContestoMissione } from "../../../src/engine/mission"
import { valutaTask } from "../../../src/engine/tasks/valutazione"
import type { DefinizioneTask } from "../../../src/engine/types"
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva"
import {
  avanzaFinoAPausa,
  esegui,
  membro,
  task,
} from "../../fixtures/simulazione"
import {
  CONTESTO_DI_PROVA,
  DIAGNOSTICA,
  ISPEZIONE_ESTERNA,
  MANOVRA_ORBITALE,
} from "../../fixtures/taskDiProva"

describe("avvio dei task (AVVIA_OPERAZIONI)", () => {
  it("porta l'orologio alle 07:00 e avvia il primo task in coda", () => {
    const iniziale = creaMissioneDiProva()
    const stato = esegui(iniziale, [{ tipo: "AVVIA_OPERAZIONI" }])
    const mara = membro(iniziale, "mara")
    const attesa = valutaTask(DIAGNOSTICA, mara, null)

    expect(stato.tempo).toBe(ORARIO_OPERAZIONI)
    expect(stato.statoGioco).toBe("IN_ESECUZIONE")
    expect(task(stato, "task-1")).toMatchObject({
      stato: "IN_CORSO",
      inizio: ORARIO_OPERAZIONI,
      // Mara è in HABITAT, la diagnostica si fa in INGEGNERIA: c'è lo spostamento.
      fine: ORARIO_OPERAZIONI + BALANCE.spostamento.interno + attesa.durata,
      rischio: attesa.rischio,
    })
  })

  it("paga il costo in risorse e sposta il responsabile nel luogo del task", () => {
    const stato = esegui(creaMissioneDiProva(), [{ tipo: "AVVIA_OPERAZIONI" }])
    expect(stato.risorse.energia).toBe(
      150 - (DIAGNOSTICA.costoRisorse.energia ?? 0),
    )
    expect(membro(stato, "mara").posizione).toBe("INGEGNERIA")
  })

  it("le attività fuori dalla nave richiedono anche la procedura di airlock", () => {
    const stato = esegui(creaMissioneDiProva(), [
      { tipo: "RIMUOVI_TASK", idTask: "task-1" },
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: ISPEZIONE_ESTERNA.id,
        responsabile: "adrian",
        supporto: "mara",
      },
      { tipo: "AVVIA_OPERAZIONI" },
    ])
    const iniziale = creaMissioneDiProva()
    const attesa = valutaTask(
      ISPEZIONE_ESTERNA,
      membro(iniziale, "adrian"),
      membro(iniziale, "mara"),
    )
    const { interno, airlock } = BALANCE.spostamento
    expect(task(stato, "task-2").fine).toBe(
      ORARIO_OPERAZIONI + interno + airlock + attesa.durata,
    )
  })

  it("se l'aiutante è occupato, il responsabile procede da solo", () => {
    // Mara inizia task-1 (alfabeticamente prima di Nadia), quindi non può aiutarla.
    const stato = esegui(creaMissioneDiProva(), [
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: DIAGNOSTICA.id,
        responsabile: "nadia",
        supporto: "mara",
      },
      { tipo: "AVVIA_OPERAZIONI" },
    ])
    expect(task(stato, "task-2")).toMatchObject({
      stato: "IN_CORSO",
      supporto: null,
    })
    expect(
      stato.log.some(
        (v) => v.fonte === "CREW" && v.testo.includes("procede da solo"),
      ),
    ).toBe(true)
  })

  it("un aiutante impegnato non avvia i propri task finché non ha finito", () => {
    const stato = esegui(creaMissioneDiProva(), [
      { tipo: "RIMUOVI_TASK", idTask: "task-1" },
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: DIAGNOSTICA.id,
        responsabile: "mara",
        supporto: "nadia",
      },
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: DIAGNOSTICA.id,
        responsabile: "nadia",
        supporto: null,
      },
      { tipo: "AVVIA_OPERAZIONI" },
    ])
    expect(task(stato, "task-2").stato).toBe("IN_CORSO") // Mara con Nadia
    expect(task(stato, "task-3").stato).toBe("IN_CODA") // Nadia aspetta

    const dopo = esegui(stato, [{ tipo: "AVANZA" }])
    expect(task(dopo, "task-3").stato).toBe("IN_CORSO") // ora Nadia è libera
  })

  it("un task che non finirebbe entro le 22:00 resta in coda", () => {
    const lunghissimo: DefinizioneTask = {
      ...DIAGNOSTICA,
      id: "T-LUNGO",
      durataBase: 1000,
    }
    const contesto: ContestoMissione = {
      catalogoTask: {
        ...CONTESTO_DI_PROVA.catalogoTask,
        [lunghissimo.id]: lunghissimo,
      },
    }
    let stato = esegui(
      creaMissioneDiProva(),
      [
        { tipo: "RIMUOVI_TASK", idTask: "task-1" },
        {
          tipo: "ASSEGNA_TASK",
          idDefinizione: "T-LUNGO",
          responsabile: "mara",
          supporto: null,
        },
        { tipo: "AVVIA_OPERAZIONI" },
      ],
      contesto,
    )
    expect(task(stato, "task-2").stato).toBe("IN_CODA")

    stato = avanzaFinoAPausa(stato, contesto)
    expect(stato.tempo).toBe(ORARIO_RAPPORTO)
    expect(task(stato, "task-2").stato).toBe("IN_CODA")
  })

  it("se le risorse non bastano il task viene annullato", () => {
    const povera = creaMissioneDiProva()
    povera.risorse.energia = 1
    const stato = esegui(povera, [{ tipo: "AVVIA_OPERAZIONI" }])
    expect(task(stato, "task-1").stato).toBe("ANNULLATO")
    expect(stato.risorse.energia).toBe(1)
  })
})

describe("conclusione dei task (AVANZA)", () => {
  it("al momento previsto il task si chiude con un esito e aggiunge fatica", () => {
    const avviato = esegui(creaMissioneDiProva(), [
      { tipo: "AVVIA_OPERAZIONI" },
    ])
    const fine = task(avviato, "task-1").fine
    const stato = esegui(avviato, [{ tipo: "AVANZA" }])

    expect(stato.tempo).toBe(fine)
    const t = task(stato, "task-1")
    expect(t.esito).not.toBeNull()
    expect(["COMPLETATO", "FALLITO"]).toContain(t.stato)
    expect(membro(stato, "mara").fatica).toBe(DIAGNOSTICA.costoFatica)
    expect(stato.code.mara).toEqual([])
  })

  it("l'aiutante riceve una quota della fatica", () => {
    const stato = esegui(creaMissioneDiProva(), [
      { tipo: "RIMUOVI_TASK", idTask: "task-1" },
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: DIAGNOSTICA.id,
        responsabile: "mara",
        supporto: "nadia",
      },
      { tipo: "AVVIA_OPERAZIONI" },
      { tipo: "AVANZA" },
    ])
    const quota = Math.round(
      DIAGNOSTICA.costoFatica * BALANCE.task.quotaFaticaSupporto,
    )
    expect(membro(stato, "nadia").fatica).toBe(quota)
  })

  it("finito un task, parte subito il successivo della stessa coda", () => {
    const stato = esegui(creaMissioneDiProva(), [
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: MANOVRA_ORBITALE.id,
        responsabile: "adrian",
        supporto: null,
      },
      {
        tipo: "ASSEGNA_TASK",
        idDefinizione: MANOVRA_ORBITALE.id,
        responsabile: "adrian",
        supporto: null,
      },
      { tipo: "AVVIA_OPERAZIONI" },
      { tipo: "AVANZA" }, // finisce la prima manovra (più breve della diagnostica)
    ])
    expect(task(stato, "task-2").stato).not.toBe("IN_CORSO")
    expect(task(stato, "task-3").stato).toBe("IN_CORSO")
    expect(task(stato, "task-3").inizio).toBe(task(stato, "task-2").fine)
  })
})
