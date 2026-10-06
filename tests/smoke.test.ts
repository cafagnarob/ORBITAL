// smoke.test.ts — Test di verifica dell'ambiente: se passa, Vitest è configurato correttamente.
import { describe, it, expect } from "vitest"

describe("ambiente", () => {
  it("esegue i test", () => {
    expect(1 + 1).toBe(2)
  })
})
