/**
 * ============================================================================
 * rng.test.ts — Test del generatore casuale deterministico
 * ============================================================================
 *
 * COSA VERIFICA
 * Il generatore è il fondamento del determinismo di ORBITAL: se questi test
 * passano, possiamo fidarci che stesso seed = stessa partita e che i
 * salvataggi riprendano la sorte esattamente da dove era.
 *
 * COME È ORGANIZZATO
 * Un blocco `describe` per ogni funzione esportata. Ogni `it` verifica una
 * singola proprietà, con un nome che descrive il comportamento atteso.
 *
 * NOTA SUI TEST "STATISTICI"
 * Alcuni test fanno migliaia di tiri. Non sono fragili: con un seed fisso
 * la sequenza è sempre la stessa, quindi il risultato non cambia mai
 * tra un'esecuzione e l'altra.
 * ============================================================================
 */

import { describe, it, expect } from "vitest"
import { createRng, deriveSeed, hashSeed } from "../../src/engine/rng"

// Seed di riferimento del pianeta E-17 (DESIGN §13.1).
const SEED_E17 = "E17-73A9"

/** Funzione di supporto: estrae i primi `n` numeri da un generatore. */
function primiNumeri(stato: number, n: number): number[] {
  const rng = createRng(stato)
  return Array.from({ length: n }, () => rng.next())
}

// ----------------------------------------------------------------------------
describe("hashSeed", () => {
  it("restituisce sempre lo stesso numero per lo stesso testo", () => {
    expect(hashSeed(SEED_E17)).toBe(hashSeed(SEED_E17))
  })

  it("restituisce numeri diversi per testi diversi", () => {
    expect(hashSeed("E17-73A9")).not.toBe(hashSeed("E17-73AA"))
  })

  it("restituisce un intero senza segno a 32 bit", () => {
    const h = hashSeed(SEED_E17)
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(2 ** 32)
  })
})

// ----------------------------------------------------------------------------
describe("deriveSeed", () => {
  it("è deterministico: stesso seed e stesso dominio danno lo stesso valore", () => {
    expect(deriveSeed(SEED_E17, "meteo")).toBe(deriveSeed(SEED_E17, "meteo"))
  })

  it("domini diversi producono seed diversi", () => {
    const meteo = deriveSeed(SEED_E17, "meteo")
    const vale = deriveSeed(SEED_E17, "vale")
    const pianeta = deriveSeed(SEED_E17, "pianeta")
    expect(new Set([meteo, vale, pianeta]).size).toBe(3)
  })
})

// ----------------------------------------------------------------------------
describe("createRng / next", () => {
  it("stesso stato iniziale → stessa sequenza (determinismo)", () => {
    const stato = hashSeed(SEED_E17)
    expect(primiNumeri(stato, 100)).toEqual(primiNumeri(stato, 100))
  })

  it("stati iniziali diversi → sequenze diverse", () => {
    expect(primiNumeri(1, 20)).not.toEqual(primiNumeri(2, 20))
  })

  it("produce sempre valori in [0, 1)", () => {
    const rng = createRng(hashSeed(SEED_E17))
    for (let i = 0; i < 10_000; i++) {
      const n = rng.next()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it("salvataggio e ripresa: un nuovo Rng creato da getState() prosegue identico", () => {
    // Simula una partita: il generatore avanza di 50 passi...
    const originale = createRng(hashSeed(SEED_E17))
    for (let i = 0; i < 50; i++) originale.next()

    // ...il gioco salva lo stato (come farebbe JSON.stringify dello stato di gioco)...
    const statoSalvato = originale.getState()

    // ...e dopo il caricamento crea un nuovo generatore da quello stato.
    const caricato = createRng(statoSalvato)

    // Da qui in poi le due sequenze devono coincidere.
    for (let i = 0; i < 50; i++) {
      expect(caricato.next()).toBe(originale.next())
    }
  })

  it("getState non fa avanzare la sequenza", () => {
    const a = createRng(42)
    const b = createRng(42)
    a.getState()
    a.getState()
    expect(a.next()).toBe(b.next())
  })
})

// ----------------------------------------------------------------------------
describe("int", () => {
  it("resta nei limiti e produce sia il minimo sia il massimo", () => {
    const rng = createRng(hashSeed(SEED_E17))
    const visti = new Set<number>()

    for (let i = 0; i < 10_000; i++) {
      const n = rng.int(1, 6)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(6)
      visti.add(n)
    }

    // Tutte e 6 le facce del "dado" devono essere uscite almeno una volta:
    // in particolare il 6, che sparirebbe dimenticando il "+ 1".
    expect([...visti].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("con min = max restituisce sempre quel valore", () => {
    const rng = createRng(7)
    expect(rng.int(5, 5)).toBe(5)
  })

  it("lancia un errore se min > max o se riceve decimali", () => {
    const rng = createRng(7)
    expect(() => rng.int(6, 1)).toThrow()
    expect(() => rng.int(1.5, 3)).toThrow()
  })
})

// ----------------------------------------------------------------------------
describe("chance", () => {
  it("0 è sempre false e 1 è sempre true", () => {
    const rng = createRng(hashSeed(SEED_E17))
    for (let i = 0; i < 1_000; i++) {
      expect(rng.chance(0)).toBe(false)
      expect(rng.chance(1)).toBe(true)
    }
  })

  it("su molti tiri si avvicina alla probabilità richiesta", () => {
    const rng = createRng(hashSeed(SEED_E17))
    let successi = 0
    for (let i = 0; i < 10_000; i++) {
      if (rng.chance(0.3)) successi++
    }
    // 30% di 10.000 = 3.000; accettiamo un margine del ±3%.
    expect(successi).toBeGreaterThan(2_700)
    expect(successi).toBeLessThan(3_300)
  })

  it("lancia un errore con probabilità fuori da 0..1", () => {
    const rng = createRng(7)
    expect(() => rng.chance(-0.1)).toThrow()
    expect(() => rng.chance(1.5)).toThrow()
  })
})

// ----------------------------------------------------------------------------
describe("pick", () => {
  it("restituisce sempre un elemento della lista", () => {
    const crew = ["Mara", "Adrian", "Nadia", "Sarah"] as const
    const rng = createRng(hashSeed(SEED_E17))
    for (let i = 0; i < 1_000; i++) {
      expect(crew).toContain(rng.pick(crew))
    }
  })

  it("lancia un errore su una lista vuota", () => {
    const rng = createRng(7)
    expect(() => rng.pick([])).toThrow()
  })
})

// ----------------------------------------------------------------------------
describe("weightedPick", () => {
  it("non sceglie mai una voce con peso 0", () => {
    const rng = createRng(hashSeed(SEED_E17))
    const voci = [
      { item: "TEMPESTA_DI_POLVERE", peso: 40 },
      { item: "MAI", peso: 0 },
      { item: "GUASTO_DRONE", peso: 10 },
    ]
    for (let i = 0; i < 5_000; i++) {
      expect(rng.weightedPick(voci)).not.toBe("MAI")
    }
  })

  it("rispetta le proporzioni dei pesi", () => {
    const rng = createRng(hashSeed(SEED_E17))
    const voci = [
      { item: "A", peso: 75 },
      { item: "B", peso: 25 },
    ]
    let contaA = 0
    for (let i = 0; i < 10_000; i++) {
      if (rng.weightedPick(voci) === "A") contaA++
    }
    // A dovrebbe uscire circa il 75% delle volte (±3%).
    expect(contaA).toBeGreaterThan(7_200)
    expect(contaA).toBeLessThan(7_800)
  })

  it("lancia un errore se il totale dei pesi è 0 o la lista è vuota", () => {
    const rng = createRng(7)
    expect(() => rng.weightedPick([])).toThrow()
    expect(() => rng.weightedPick([{ item: "X", peso: 0 }])).toThrow()
  })

  it("lancia un errore con pesi negativi", () => {
    const rng = createRng(7)
    expect(() => rng.weightedPick([{ item: "X", peso: -5 }])).toThrow()
  })
})
