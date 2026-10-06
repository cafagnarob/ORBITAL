/**
 * ============================================================================
 * esito.test.ts — Test di soglie, esiti, probabilità e valutazione
 * ============================================================================
 *
 * La prova più importante è "le probabilità mostrate coincidono con quelle
 * reali": simuliamo 20.000 tiri e verifichiamo che le frequenze osservate
 * corrispondano a quelle calcolate da probabilitaEsiti. È la garanzia che
 * la stima che il giocatore vedrà sia onesta… a meno che V.A.L.E. non
 * decida di mentire, ma quella sarà una scelta di design, non un bug.
 * ============================================================================
 */

import { describe, it, expect } from "vitest"
import { createRng, hashSeed } from "../../../src/engine/rng"
import {
  calcolaSoglie,
  esitoDaTiro,
  probabilitaEsiti,
  tiraEsito,
  type SoglieEsito,
} from "../../../src/engine/tasks/esito"
import { valutaTask } from "../../../src/engine/tasks/valutazione"
import { ESITI_TASK, type EsitoTask } from "../../../src/engine/types"
import { creaMissioneDiProva } from "../../fixtures/missioneDiProva"
import { DIAGNOSTICA, MANOVRA_ORBITALE } from "../../fixtures/taskDiProva"

// ----------------------------------------------------------------------------
describe("esitoDaTiro", () => {
  // Soglie scritte a mano, indipendenti dal bilanciamento.
  const soglie: SoglieEsito = {
    critico: 10,
    fallimento: 40,
    parziale: 55,
    successo: 86,
  }

  it("assegna ogni tiro alla zona giusta, confini compresi", () => {
    expect(esitoDaTiro(1, soglie)).toBe("FALLIMENTO_CRITICO")
    expect(esitoDaTiro(10, soglie)).toBe("FALLIMENTO_CRITICO")
    expect(esitoDaTiro(11, soglie)).toBe("FALLIMENTO")
    expect(esitoDaTiro(40, soglie)).toBe("FALLIMENTO")
    expect(esitoDaTiro(41, soglie)).toBe("SUCCESSO_PARZIALE")
    expect(esitoDaTiro(55, soglie)).toBe("SUCCESSO_PARZIALE")
    expect(esitoDaTiro(56, soglie)).toBe("SUCCESSO")
    expect(esitoDaTiro(86, soglie)).toBe("SUCCESSO")
    expect(esitoDaTiro(87, soglie)).toBe("SUCCESSO_PERFETTO")
    expect(esitoDaTiro(100, soglie)).toBe("SUCCESSO_PERFETTO")
  })
})

// ----------------------------------------------------------------------------
describe("calcolaSoglie / probabilitaEsiti", () => {
  it("le probabilità sommano sempre a 100, per ogni rischio e precisione", () => {
    for (let rischio = 0; rischio <= 100; rischio += 5) {
      for (let precisione = 0; precisione <= 10; precisione++) {
        const p = probabilitaEsiti(calcolaSoglie(rischio, precisione))
        const somma = Object.values(p).reduce((a, b) => a + b, 0)
        expect(somma).toBe(100)
        for (const valore of Object.values(p))
          expect(valore).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("la probabilità di fallire (critici inclusi) è esattamente il rischio", () => {
    const p = probabilitaEsiti(calcolaSoglie(37, 5))
    expect(p.FALLIMENTO + p.FALLIMENTO_CRITICO).toBe(37)
  })

  it("più precisione → più successi perfetti, a parità di rischio", () => {
    const scarso = probabilitaEsiti(calcolaSoglie(30, 0))
    const preciso = probabilitaEsiti(calcolaSoglie(30, 10))
    expect(preciso.SUCCESSO_PERFETTO).toBeGreaterThan(scarso.SUCCESSO_PERFETTO)
  })
})

// ----------------------------------------------------------------------------
describe("tiraEsito", () => {
  it("è deterministico: stesso stato dell'Rng → stesso esito", () => {
    const soglie = calcolaSoglie(30, 5)
    const a = tiraEsito(soglie, createRng(hashSeed("E17-73A9")))
    const b = tiraEsito(soglie, createRng(hashSeed("E17-73A9")))
    expect(a).toEqual(b)
  })

  it("le frequenze reali coincidono con le probabilità calcolate (±1.5%)", () => {
    const soglie = calcolaSoglie(30, 6)
    const attese = probabilitaEsiti(soglie)
    const rng = createRng(hashSeed("E17-73A9"))
    const conteggi: Record<EsitoTask, number> = {
      FALLIMENTO_CRITICO: 0,
      FALLIMENTO: 0,
      SUCCESSO_PARZIALE: 0,
      SUCCESSO: 0,
      SUCCESSO_PERFETTO: 0,
    }

    const N = 20_000
    for (let i = 0; i < N; i++) conteggi[tiraEsito(soglie, rng).esito]++

    for (const esito of ESITI_TASK) {
      const osservata = (conteggi[esito] / N) * 100
      expect(Math.abs(osservata - attese[esito])).toBeLessThan(1.5)
    }
  })
})

// ----------------------------------------------------------------------------
describe("valutaTask", () => {
  const { mara, adrian, nadia } = creaMissioneDiProva().crew
  if (!mara || !adrian || !nadia) throw new Error("fixture incompleta")

  it("restituisce durata, rischio e probabilità coerenti tra loro", () => {
    const v = valutaTask(DIAGNOSTICA, mara, nadia)
    expect(v.durata).toBeGreaterThan(0)
    expect(v.probabilita.FALLIMENTO + v.probabilita.FALLIMENTO_CRITICO).toBe(
      v.rischio,
    )
  })

  it("rifiuta un aiutante su un task che non lo ammette", () => {
    expect(() => valutaTask(MANOVRA_ORBITALE, adrian, mara)).toThrow()
  })

  it("rifiuta un membro che aiuta sé stesso", () => {
    expect(() => valutaTask(DIAGNOSTICA, mara, mara)).toThrow()
  })
})
