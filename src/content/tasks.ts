/**
 * ============================================================================
 * tasks.ts — Catalogo dei task del gioco (vertical slice)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §9, §17 (Fase 2).
 *
 * COSA CONTIENE
 * Le "ricette" dei task disponibili nella prima versione giocabile: la nave
 * è in orbita attorno a E-17, sopra il Cratere Settentrionale. Non c'è
 * ancora l'atterraggio, quindi i task si svolgono a bordo o all'esterno
 * della nave.
 *
 * NUMERI [PROVVISORIO]: si tarano giocando, come tutto il bilanciamento.
 *
 * LIMITE ATTUALE
 * Gli esiti dei task non producono ancora conseguenze sul mondo (scoperte,
 * danni, eventi): arriveranno con il sistema di eventi. Per ora servono a
 * giocare il ciclo pianifica → esegui → rapporto.
 * ============================================================================
 */

import type { DefinizioneTask, IdDefinizioneTask } from "../engine/types"

const LISTA_TASK: DefinizioneTask[] = [
  {
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
  },
  {
    id: "T-MANUTENZIONE-SV",
    nome: "Manutenzione del supporto vitale",
    categoria: "INGEGNERIA",
    abilitaPrincipale: "INGEGNERIA",
    abilitaSecondaria: "MEDICINA",
    supportoAmmesso: true,
    durataBase: 100,
    rischioBase: 20,
    luogo: "SUPPORTO_VITALE",
    equipaggiamentoRichiesto: ["KIT_RIPARAZIONE"],
    costoRisorse: { energia: 1 },
    costoFatica: 10,
    tag: ["MANUTENZIONE", "SUPPORTO_VITALE"],
  },
  {
    id: "T-CORREZIONE-ORBITA",
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
  },
  {
    id: "T-SCANSIONE-CRATERE",
    nome: "Scansione orbitale del cratere",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "PILOTAGGIO",
    supportoAmmesso: true,
    durataBase: 150,
    rischioBase: 25,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: ["SENSORE_PROFONDO"],
    costoRisorse: { energia: 4 },
    costoFatica: 12,
    tag: ["SCANSIONE", "CRATERE"],
  },
  {
    id: "T-ANALISI-SEGNALE",
    nome: "Analisi del segnale",
    categoria: "SCIENZA",
    abilitaPrincipale: "SCIENZA",
    abilitaSecondaria: "INGEGNERIA",
    supportoAmmesso: true,
    durataBase: 180,
    rischioBase: 20,
    luogo: "LABORATORIO",
    equipaggiamentoRichiesto: [],
    costoRisorse: { energia: 3 },
    costoFatica: 15,
    tag: ["SEGNALE"],
  },
  {
    id: "T-RICOGNIZIONE-DRONE",
    nome: "Ricognizione con drone",
    categoria: "PILOTAGGIO",
    abilitaPrincipale: "PILOTAGGIO",
    abilitaSecondaria: "SCIENZA",
    supportoAmmesso: true,
    durataBase: 120,
    rischioBase: 30,
    luogo: "COMANDO",
    equipaggiamentoRichiesto: ["DRONE_RICOGNIZIONE"],
    costoRisorse: { energia: 5 },
    costoFatica: 8,
    tag: ["DRONE", "CRATERE"],
  },
  {
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
  },
]

/** Il catalogo indicizzato per ID, come lo vuole il reducer. */
export const CATALOGO_TASK: Readonly<
  Record<IdDefinizioneTask, DefinizioneTask>
> = Object.fromEntries(LISTA_TASK.map((t) => [t.id, t]))

/** La stessa lista in ordine, per mostrarla nei menu. */
export const TASK_DISPONIBILI: readonly DefinizioneTask[] = LISTA_TASK
