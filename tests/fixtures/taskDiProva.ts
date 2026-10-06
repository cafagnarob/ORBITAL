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

import type { ContestoMissione } from "../../src/engine/mission/contesto"
import type { DefinizioneTask } from "../../src/engine/types"

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
  costoRisorse: { energia: 2 },
  costoFatica: 10,
  tag: ["DIAGNOSTICA"],
}

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
  costoRisorse: { carburante: 2 },
  costoFatica: 8,
  tag: ["MANOVRA"],
}

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
  costoRisorse: { energia: 3 },
  costoFatica: 20,
  tag: ["EVA", "SCAFO"],
}

/** Un task che richiede equipaggiamento NON presente a bordo. */
export const SCAVO_MINERARIO: DefinizioneTask = {
  ...ISPEZIONE_ESTERNA,
  id: "T-SCAVO",
  nome: "Scavo minerario",
  luogo: "SUPERFICIE",
  equipaggiamentoRichiesto: ["TRIVELLA"],
}

/** Il contesto da passare al reducer nei test: un catalogo con questi task. */
export const CONTESTO_DI_PROVA: ContestoMissione = {
  catalogoTask: {
    [DIAGNOSTICA.id]: DIAGNOSTICA,
    [MANOVRA_ORBITALE.id]: MANOVRA_ORBITALE,
    [ISPEZIONE_ESTERNA.id]: ISPEZIONE_ESTERNA,
    [SCAVO_MINERARIO.id]: SCAVO_MINERARIO,
  },
}
