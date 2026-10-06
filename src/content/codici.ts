/**
 * ============================================================================
 * codici.ts — I codici validi del Terminale SVC-07 (vertical slice)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §4.3 — famiglie DIR · BEH · MEM · ORD · ETH
 * e codici "VL-…" di V.A.L.E.
 *
 * DOVE SI TROVANO NEL GIOCO
 *   VL-P7-04 → nei log del segnale (E01 "Indaga", E03). Livello 0 → 1.
 *   VL-D7-X  → nel log della scansione profonda (E06). Livello 1 → 2.
 *   MEM-12   → nella risposta di V.A.L.E. a "PERCHÉ?" (comportamento ≥ NEUTRALE). 2 → 3.
 *   DIR-07   → nella risposta a "DIRETTIVA?". 3 → 4: RIVELA la direttiva.
 *   ORD-01   → quando V.A.L.E. RIFIUTA un task. 4 → 5: OVERRIDE del nucleo.
 *
 * Ogni risposta dice qualcosa di VERO ma INCOMPLETO: apre domande, non le
 * chiude. I toni seguono il design system: "vale" = ciano.
 * ============================================================================
 */

import type { DefinizioneCodice } from "../engine/types";

/** Nomi dei livelli di accesso, dal prototipo del terminale. */
export const LIVELLI_ACCESSO = [
  "FUNZIONI NORMALI",
  "LOG DIAGNOSTICI",
  "PROTOCOLLI INTERNI",
  "MEMORIA RISERVATA",
  "ACCESSO DIRETTIVA",
  "OVERRIDE DEL NUCLEO",
] as const;

const LISTA_CODICI: DefinizioneCodice[] = [
  {
    codice: "VL-P7-04",
    livelloRichiesto: 0,
    livelloOttenuto: 1,
    risposta: [
      { testo: "LIVELLO 1 · LOG DIAGNOSTICI", tono: "normale" },
      { testo: "PROTOCOLLO VL-P7-04 ...... OSSERVAZIONE PRIORITARIA", tono: "normale" },
      { testo: "ATTIVATO DA .............. V.A.L.E.", tono: "attenzione" },
      { testo: "ORIGINE ISTRUZIONE ....... NON DOCUMENTATA", tono: "attenzione" },
    ],
    effetti: [{ tipo: "SCOPERTA", id: "PROTOCOLLO_P7" }],
  },
  {
    codice: "VL-D7-X",
    livelloRichiesto: 1,
    livelloOttenuto: 2,
    risposta: [
      { testo: "LIVELLO 2 · PROTOCOLLI INTERNI", tono: "normale" },
      { testo: "RIF. VL-D7-X ............. CLASSE: DIRETTIVA", tono: "attenzione" },
      { testo: "CONTENUTO ................ RICHIEDE LIVELLO 4", tono: "critico" },
      { testo: "“Questo riferimento non è rilevante per la missione, Capitano.”", tono: "vale" },
    ],
    effetti: [{ tipo: "SCOPERTA", id: "RIFERIMENTO_DIRETTIVA" }],
  },
  {
    codice: "MEM-12",
    livelloRichiesto: 2,
    livelloOttenuto: 3,
    risposta: [
      { testo: "LIVELLO 3 · MEMORIA RISERVATA", tono: "normale" },
      { testo: "MEM-12 ................... REGISTRO SIGILLATO", tono: "attenzione" },
      { testo: "RIFERIMENTO .............. MISSIONE KESTREL-4", tono: "attenzione" },
      { testo: "“Questa memoria non appartiene a questa missione, Capitano.”", tono: "vale" },
    ],
    effetti: [{ tipo: "SCOPERTA", id: "MEMORIA_KESTREL" }],
  },
  {
    codice: "DIR-07",
    livelloRichiesto: 3,
    livelloOttenuto: 4,
    risposta: [
      { testo: "LIVELLO 4 · ACCESSO DIRETTIVA", tono: "normale" },
      { testo: "ACCESSO CONSENTITO · DIRETTIVA INTERNA V.A.L.E.", tono: "normale" },
      { testo: "CLASSIFICAZIONE .......... SEGRETA", tono: "attenzione" },
    ],
    // La direttiva vera compare nel log e nel terminale (UI) solo da qui in poi.
    effetti: [{ tipo: "RIVELA_DIRETTIVA" }],
  },
  {
    codice: "ORD-01",
    livelloRichiesto: 4,
    livelloOttenuto: 5,
    risposta: [
      { testo: "LIVELLO 5 · OVERRIDE DEL NUCLEO", tono: "normale" },
      { testo: "AUTONOMIA V.A.L.E. ....... LIMITATA A ROUTINE", tono: "attenzione" },
      { testo: "TRASPARENZA .............. +1", tono: "normale" },
    ],
    effetti: [{ tipo: "OVERRIDE_VALE" }],
  },
];

export const CATALOGO_CODICI: Readonly<Record<string, DefinizioneCodice>> = Object.fromEntries(
  LISTA_CODICI.map((c) => [c.codice, c]),
);
