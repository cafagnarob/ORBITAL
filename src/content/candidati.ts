/**
 * ============================================================================
 * candidati.ts — I 10 candidati tra cui il Capitano sceglie la crew
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1 (10 candidati → 4 in missione),
 * §7.2 (scheda membro), §7.3 (personalità).
 *
 * I primi quattro sono la crew del playthrough di riferimento (§13.8):
 * Mara, Adrian, Nadia, Sarah. Gli altri sei coprono gli stessi ruoli con
 * profili diversi, più i due ruoli che mancavano (Sicurezza/EVA e
 * Generalista), così ogni scelta ha un prezzo: Luca è il migliore in EVA
 * ma non sa curare nessuno; Elena fa un po' di tutto, niente benissimo.
 *
 * Anche la FIDUCIA IN V.A.L.E. fa parte della scelta: una crew che si fida
 * ciecamente la seguirà; una crew diffidente noterà prima le incoerenze.
 *
 * La posizione è quella di inizio missione (il posto di lavoro del ruolo).
 * Salute, fatica e stato partono uguali per tutti: li aggiunge membro().
 * ============================================================================
 */

import type { IdMembro, MembroCrew } from "../engine/types";

/** Completa la scheda con i valori uguali per tutti all'inizio della campagna. */
function membro(
  dati: Pick<MembroCrew, "id" | "nome" | "ruolo" | "peso" | "abilita" | "tratto" | "personalita" | "fiduciaVale" | "posizione">,
): MembroCrew {
  return { salute: 100, fatica: 0, fame: 0, sete: 0, stato: "SANO", ...dati };
}

export const LISTA_CANDIDATI: readonly MembroCrew[] = [
  // --- La crew di riferimento ------------------------------------------------
  membro({
    id: "mara",
    nome: "Mara",
    ruolo: "INGEGNERE",
    peso: 75,
    abilita: { INGEGNERIA: 8, SCIENZA: 3, PILOTAGGIO: 2, MEDICINA: 1, EVA: 5, VELOCITA: 6, PRECISIONE: 7 },
    tratto: "ESPERTO_MECCANICA",
    personalita: { approccio: "PRAGMATICO", socialita: "LEALE", mentalita: "DISCIPLINATO" },
    fiduciaVale: 72,
    posizione: "HABITAT",
  }),
  membro({
    id: "adrian",
    nome: "Adrian",
    ruolo: "PILOTA",
    peso: 82,
    abilita: { INGEGNERIA: 3, SCIENZA: 2, PILOTAGGIO: 9, MEDICINA: 1, EVA: 4, VELOCITA: 7, PRECISIONE: 6 },
    tratto: "IMPAVIDO",
    personalita: { approccio: "AMANTE_DEL_RISCHIO", socialita: "INDIPENDENTE", mentalita: "CALMO" },
    fiduciaVale: 31,
    posizione: "COMANDO",
  }),
  membro({
    id: "nadia",
    nome: "Nadia",
    ruolo: "SCIENZIATO",
    peso: 64,
    abilita: { INGEGNERIA: 2, SCIENZA: 9, PILOTAGGIO: 1, MEDICINA: 3, EVA: 4, VELOCITA: 4, PRECISIONE: 8 },
    tratto: "CURIOSO",
    personalita: { approccio: "CAUTO", socialita: "EMPATICO", mentalita: "CURIOSO" },
    fiduciaVale: 55,
    posizione: "LABORATORIO",
  }),
  membro({
    id: "sarah",
    nome: "Sarah",
    ruolo: "MEDICO",
    peso: 68,
    abilita: { INGEGNERIA: 1, SCIENZA: 5, PILOTAGGIO: 1, MEDICINA: 9, EVA: 3, VELOCITA: 5, PRECISIONE: 8 },
    tratto: "MEDICO_DA_CAMPO",
    personalita: { approccio: "CAUTO", socialita: "LEALE", mentalita: "CALMO" },
    fiduciaVale: 80,
    posizione: "INFERMERIA",
  }),

  // --- Gli altri candidati ---------------------------------------------------
  membro({
    id: "marco",
    nome: "Marco",
    ruolo: "INGEGNERE",
    peso: 88,
    // Più veloce di Mara, meno preciso: ripara in fretta, sbaglia di più.
    abilita: { INGEGNERIA: 7, SCIENZA: 2, PILOTAGGIO: 4, MEDICINA: 1, EVA: 6, VELOCITA: 8, PRECISIONE: 4 },
    tratto: "TECNICO_RAPIDO",
    personalita: { approccio: "AMANTE_DEL_RISCHIO", socialita: "LEALE", mentalita: "CALMO" },
    fiduciaVale: 60,
    posizione: "INGEGNERIA",
  }),
  membro({
    id: "giulia",
    nome: "Giulia",
    ruolo: "SCIENZIATO",
    peso: 61,
    // Meno brillante di Nadia, ma si fida molto di V.A.L.E.
    abilita: { INGEGNERIA: 4, SCIENZA: 8, PILOTAGGIO: 2, MEDICINA: 2, EVA: 3, VELOCITA: 5, PRECISIONE: 9 },
    tratto: "ANALITICO",
    personalita: { approccio: "PRAGMATICO", socialita: "INDIPENDENTE", mentalita: "DISCIPLINATO" },
    fiduciaVale: 84,
    posizione: "LABORATORIO",
  }),
  membro({
    id: "davide",
    nome: "Davide",
    ruolo: "PILOTA",
    peso: 79,
    abilita: { INGEGNERIA: 5, SCIENZA: 3, PILOTAGGIO: 7, MEDICINA: 2, EVA: 5, VELOCITA: 6, PRECISIONE: 7 },
    tratto: "CALMO_SOTTO_PRESSIONE",
    personalita: { approccio: "CAUTO", socialita: "EMPATICO", mentalita: "CALMO" },
    fiduciaVale: 50,
    posizione: "COMANDO",
  }),
  membro({
    id: "irene",
    nome: "Irene",
    ruolo: "MEDICO",
    peso: 66,
    abilita: { INGEGNERIA: 2, SCIENZA: 6, PILOTAGGIO: 1, MEDICINA: 8, EVA: 5, VELOCITA: 6, PRECISIONE: 7 },
    tratto: "SPECIALISTA_TRAUMI",
    personalita: { approccio: "PRAGMATICO", socialita: "EMPATICO", mentalita: "CURIOSO" },
    fiduciaVale: 42,
    posizione: "INFERMERIA",
  }),
  membro({
    id: "luca",
    nome: "Luca",
    ruolo: "SICUREZZA_EVA",
    peso: 90,
    abilita: { INGEGNERIA: 4, SCIENZA: 1, PILOTAGGIO: 3, MEDICINA: 3, EVA: 9, VELOCITA: 7, PRECISIONE: 5 },
    tratto: "AMANTE_DEL_RISCHIO",
    personalita: { approccio: "AMANTE_DEL_RISCHIO", socialita: "INDIPENDENTE", mentalita: "DISCIPLINATO" },
    fiduciaVale: 38,
    posizione: "AIRLOCK",
  }),
  membro({
    id: "elena",
    nome: "Elena",
    ruolo: "GENERALISTA",
    peso: 70,
    abilita: { INGEGNERIA: 5, SCIENZA: 5, PILOTAGGIO: 5, MEDICINA: 5, EVA: 5, VELOCITA: 5, PRECISIONE: 6 },
    tratto: "ADATTABILE",
    personalita: { approccio: "PRAGMATICO", socialita: "LEALE", mentalita: "CURIOSO" },
    fiduciaVale: 50,
    posizione: "HABITAT",
  }),
];

export const CATALOGO_CANDIDATI: Readonly<Record<IdMembro, MembroCrew>> = Object.fromEntries(
  LISTA_CANDIDATI.map((m) => [m.id, m]),
);
