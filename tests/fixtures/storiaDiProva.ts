/**
 * ============================================================================
 * storiaDiProva.ts — Contenuti della storia per i test (brevi, riconoscibili)
 * ============================================================================
 *
 * Indipendenti da content/storia/: i test controllano le REGOLE (quale finale,
 * quale battuta, quali righe di diario), non i testi del gioco.
 * ============================================================================
 */

import type { Battute, ContenutiStoria } from "../../src/engine/types";

const tutte = (testo: string) => ({ CAUTO: [testo], AMANTE_DEL_RISCHIO: [testo], PRAGMATICO: [testo] });

const BATTUTE_DI_PROVA: Battute = {
  PASSA_CON_VALE: tutte("CON"),
  PASSA_CONTRO_VALE: tutte("CONTRO"),
  TORNA_INDECISO: tutte("INDECISO"),
  RIFIUTA_TASK: tutte("RIFIUTO-CREW"),
  CONTESTA_DA_SOLO: tutte("CONTESTO-IO"),
  MORTE_COMPAGNO: tutte("LUTTO"),
};

export const STORIA_DI_PROVA: ContenutiStoria = {
  finali: {
    F_RIENTRO_VERITA: {
      id: "F_RIENTRO_VERITA",
      titolo: "Verità",
      cause: ["RIENTRO"],
      condizioni: [{ tipo: "SCOPERTA", id: "DIRETTIVA_RIVELATA" }],
      priorita: 10,
      testo: "Tornano {VIVI}.",
      tono: "normale",
    },
    F_RIENTRO: { id: "F_RIENTRO", titolo: "Rientro", cause: ["RIENTRO"], condizioni: [], priorita: 0, testo: "Tornano {VIVI} dopo {GIORNI} giorni.", tono: "normale" },
    F_DERIVA: { id: "F_DERIVA", titolo: "Deriva", cause: ["DERIVA"], condizioni: [], priorita: 0, testo: "Deriva.", tono: "critico" },
    F_VALE: { id: "F_VALE", titolo: "V.A.L.E.", cause: ["CONTROLLO_VALE"], condizioni: [], priorita: 0, testo: "Sua.", tono: "critico" },
    F_MORTE: { id: "F_MORTE", titolo: "Silenzio", cause: ["MORTE"], condizioni: [], priorita: 0, testo: "Morti: {MORTI}.", tono: "critico" },
  },
  battute: BATTUTE_DI_PROVA,
  diarioVuoto: ["VUOTO"],
  epiloghiCrew: { CON_VALE: ["{N}-CON"], INDECISO: ["{N}-INDECISO"], CONTRO_VALE: ["{N}-CONTRO"], MORTO: ["{N}-MORTO"] },
  obiettivi: [],
  colloqui: {
    DIFENDI_VALE: { CONVINTO: ["Va bene."], RESPINTO: ["No."] },
    DUBITA_VALE: { CONVINTO: ["Hai ragione."], RESPINTO: ["Paranoia."] },
    INCORAGGIA: { CONVINTO: ["Grazie."], RESPINTO: ["Lo so."] },
  },
};
