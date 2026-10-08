/**
 * ============================================================================
 * ConIcone.tsx — Un testo in cui le risorse prendono la loro icona
 * ============================================================================
 *
 * <ConIcone testo="ENERGIA −2 · CARBURANTE −1" />
 *   → ⚡ ENERGIA −2 · ⛽ CARBURANTE −1
 *
 * Serve per i testi già pronti che arrivano dal motore o da format.ts
 * (costi delle scelte, rese dei task, effetti dei moduli): non bisogna
 * riscriverli, basta passarli di qui.
 *
 * COME FUNZIONA
 * String.split con un'espressione regolare che ha le PARENTESI (un gruppo)
 * tiene anche i pezzi trovati: "A ENERGIA B".split(/(ENERGIA)/) dà
 * ["A ", "ENERGIA", " B"]. I pezzi dispari sono le parole da decorare.
 * La parola resta scritta accanto all'icona: si impara a riconoscerla.
 * ============================================================================
 */

import { Icona } from "./Icona";
import { PAROLE_CON_ICONA } from "./mappe";

const PAROLE = new RegExp(`(${Object.keys(PAROLE_CON_ICONA).join("|")})`, "g");

export function ConIcone({ testo }: { testo: string }) {
  const pezzi = testo.split(PAROLE);
  return (
    <>
      {pezzi.map((pezzo, i) => {
        const tipo = i % 2 === 1 ? PAROLE_CON_ICONA[pezzo] : undefined;
        return tipo ? (
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            <Icona tipo={tipo} /> {pezzo}
          </span>
        ) : (
          pezzo
        );
      })}
    </>
  );
}
