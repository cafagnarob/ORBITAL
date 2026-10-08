/**
 * ============================================================================
 * taskDiProva.ts — Definizioni di task usate nei test
 * ============================================================================
 *
 * Il catalogo vero dei task arriverà in src/content/tasks.ts nella Fase 2.
 * Questi task coprono i casi della logica:
 *   - DIAGNOSTICA: ha abilità secondaria e ammette un aiutante;
 *   - MANOVRA_ORBITALE: niente secondaria, sempre da soli;
 *   - ISPEZIONE_ESTERNA: si svolge fuori dalla nave e richiede la tuta EVA;
 *   - SCAVO_MINERARIO: richiede equipaggiamento che NON è a bordo.
 * ============================================================================
 */

import { STORIA_DI_PROVA } from "./storiaDiProva";
import type { ContestoMissione } from "../../src/engine/mission/contesto";
import { TESTI_VALE_DI_PROVA } from "./valeDiProva";
import type { DefinizioneTask } from "../../src/engine/types";

export const DIAGNOSTICA: DefinizioneTask = {
  id: "T-DIAGNOSTICA",
  nome: "Diagnostica dei sistemi",
  categoria: "INGEGNERIA",
  abilitaPrincipale: "INGEGNERIA",
  abilitaSecondaria: "SCIENZA",
  supportoAmmesso: true,
  durataBase: 120,
  rischioBase: 30,
  luogo: "INGEGNERIA",
  equipaggiamentoRichiesto: [],
  moduliRichiesti: [],
    scoperteRichieste: [],
  costoRisorse: { energia: 2 },
  costoFatica: 10,
  tag: ["DIAGNOSTICA"],
  sblocco: [],
  ricaricaOre: 0, // routine: i test assegnano lo stesso task più volte
};

export const MANOVRA_ORBITALE: DefinizioneTask = {
  id: "T-MANOVRA",
  nome: "Correzione d'orbita",
  categoria: "PILOTAGGIO",
  abilitaPrincipale: "PILOTAGGIO",
  abilitaSecondaria: null,
  supportoAmmesso: false,
  durataBase: 45,
  rischioBase: 35,
  luogo: "COMANDO",
  equipaggiamentoRichiesto: [],
  moduliRichiesti: [],
    scoperteRichieste: [],
  costoRisorse: { carburante: 2 },
  costoFatica: 8,
  tag: ["MANOVRA"],
  sblocco: [],
  ricaricaOre: 0, // routine: i test assegnano lo stesso task più volte
};

export const ISPEZIONE_ESTERNA: DefinizioneTask = {
  id: "T-ISPEZIONE-ESTERNA",
  nome: "Ispezione esterna dello scafo",
  categoria: "EVA",
  abilitaPrincipale: "EVA",
  abilitaSecondaria: "INGEGNERIA",
  supportoAmmesso: true,
  durataBase: 90,
  rischioBase: 40,
  luogo: "ESTERNO_NAVE",
  equipaggiamentoRichiesto: ["TUTA_EVA_MK2"],
  moduliRichiesti: [],
    scoperteRichieste: [],
  costoRisorse: { energia: 3 },
  costoFatica: 20,
  tag: ["EVA", "SCAFO"],
  sblocco: [],
  ricaricaOre: 0, // routine: i test assegnano lo stesso task più volte
};

/** Un task che richiede equipaggiamento NON presente a bordo. */
export const SCAVO_MINERARIO: DefinizioneTask = {
  ...ISPEZIONE_ESTERNA,
  id: "T-SCAVO",
  nome: "Scavo minerario",
  luogo: "SUPERFICIE",
  equipaggiamentoRichiesto: ["TRIVELLA"],
  moduliRichiesti: [],
};

/** Il contesto da passare al reducer nei test: un catalogo con questi task. */
export const CONTESTO_DI_PROVA: ContestoMissione = {
  catalogoTask: {
    [DIAGNOSTICA.id]: DIAGNOSTICA,
    [MANOVRA_ORBITALE.id]: MANOVRA_ORBITALE,
    [ISPEZIONE_ESTERNA.id]: ISPEZIONE_ESTERNA,
    [SCAVO_MINERARIO.id]: SCAVO_MINERARIO,
  },
  // Nessun evento: i test della missione restano indipendenti dalla storia.
  // I test degli eventi usano un catalogo dedicato (eventiDiProva.ts).
  catalogoEventi: {},
  catalogoCodici: {},
  // Una direttiva neutra che non contrasta nessun task: i test della
  // missione restano indipendenti da V.A.L.E.
  catalogoDirettive: {
    "D-NEUTRA": { id: "D-NEUTRA", nome: "Direttiva di prova", classe: "NEUTRALE", peso: 1, tagContrari: [], richiede: [] },
  },
  testiVale: TESTI_VALE_DI_PROVA,
  // Nessun modulo nel catalogo: la nave usa i valori base di balance.ts.
  catalogoModuli: {},
  // Storia emergente: finali e battute brevi, senza eventi narrativi.
  storia: STORIA_DI_PROVA,
  // Nessuna supermissione: i test del motore non dipendono dal contenuto.
  missioni: {},
};
