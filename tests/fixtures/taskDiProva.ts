/**
 * ============================================================================
 * taskDiProva.ts — Definizioni di task usate nei test
 * ============================================================================
 *
 * Il catalogo vero dei task arriverà in src/content/tasks.ts nella Fase 2.
 * Questi due bastano a coprire i casi della logica:
 *   - DIAGNOSTICA: ha abilità secondaria e ammette un aiutante;
 *   - PILOTAGGIO: niente secondaria, sempre da soli.
 * ============================================================================
 */

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
