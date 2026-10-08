/**
 * ============================================================================
 * ritratti.ts — Trova le immagini dei candidati, se ci sono
 * ============================================================================
 *
 * Le immagini stanno in src/assets/ritratti/, chiamate con l'id del
 * candidato (mara.png, luca.webp…). Leggi src/assets/ritratti/LEGGIMI.md.
 *
 * COME LE TROVA: import.meta.glob (funzione di Vite)
 * Al momento della build Vite guarda la cartella e crea un oggetto
 *   { "../../assets/ritratti/mara.png": "/assets/mara-4f2a.png", … }
 * con `eager: true` (subito, non con un import asincrono) e
 * `import: "default"` (vogliamo l'URL dell'immagine). Se la cartella non ha
 * immagini, l'oggetto è vuoto e tutti i candidati usano il segnaposto.
 * Aggiungere un ritratto = aggiungere un file. Nessun codice da cambiare.
 * ============================================================================
 */

import type { IdMembro } from "../../engine/types";

const FILE = import.meta.glob<string>("../../assets/ritratti/*.{png,jpg,jpeg,webp}", { eager: true, import: "default" });

/** Da "../../assets/ritratti/mara.png" a "mara". */
const idDalPercorso = (percorso: string) =>
  percorso
    .split("/")
    .pop()
    ?.replace(/\.[a-z]+$/i, "") ?? "";

const RITRATTI: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILE).map(([percorso, url]) => [idDalPercorso(percorso), url]),
);

/** L'URL del ritratto di un candidato, o undefined se non c'è (→ segnaposto). */
export function ritrattoDi(id: IdMembro): string | undefined {
  return RITRATTI[id];
}
