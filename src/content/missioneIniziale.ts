/**
 * ============================================================================
 * missioneIniziale.ts — Lo stato di partenza della vertical slice
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §13.8 (playthrough di riferimento), §17.
 *
 * Crew e loadout fissi (la selezione arriverà nella Fase 4). La nave è
 * appena entrata in orbita attorno a E-17: Giorno 1, ore 06:00.
 *
 * PERCHÉ NON RIUSARE LA FIXTURE DEI TEST
 * Si somigliano, ma servono a cose diverse: questa è il GIOCO e cambierà
 * con il bilanciamento; la fixture è un punto fermo per i test. Se i test
 * usassero questo file, ogni ritocco al gioco romperebbe i test.
 * ============================================================================
 */

import { hashSeed } from "../engine/rng";
import type { MembroCrew, StatoMissione } from "../engine/types";

function membro(
  dati: Pick<MembroCrew, "id" | "nome" | "ruolo" | "peso" | "abilita" | "tratto" | "personalita" | "fiduciaVale" | "posizione">,
): MembroCrew {
  return { salute: 100, fatica: 0, stato: "SANO", ...dati };
}

export function creaMissioneIniziale(seed = "E17-73A9"): StatoMissione {
  return {
    seed,
    rngState: hashSeed(seed),
    tempo: 360, // Giorno 1, 06:00
    statoGioco: "PIANIFICAZIONE",

    crew: {
      mara: membro({
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
      adrian: membro({
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
      nadia: membro({
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
      sarah: membro({
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
    },

    nave: {
      scafo: 100,
      sistemi: {
        SUPPORTO_VITALE: 100,
        POTENZA: 96,
        PROPULSIONE: 92,
        NAVIGAZIONE: 88,
        COMUNICAZIONI: 94,
        SCIENZA: 100,
        MEDICINA: 100,
        OPERAZIONI_ESTERNE: 97,
      },
      accessi: {
        COMANDO: "APERTO",
        HABITAT: "APERTO",
        INGEGNERIA: "APERTO",
        SUPPORTO_VITALE: "APERTO",
        LABORATORIO: "APERTO",
        INFERMERIA: "APERTO",
        STOCCAGGIO: "APERTO",
        AIRLOCK: "APERTO",
        PROPULSIONE: "APERTO",
      },
      moduli: ["LABORATORIO_AVANZATO", "POTENZIAMENTO_SUPPORTO_VITALE", "MODULO_OPERAZIONI_ESTERNE", "ARRAY_NAVIGAZIONE"],
      equipaggiamento: [
        "SENSORE_PROFONDO",
        "DRONE_RICOGNIZIONE",
        "CONTENITORE_CAMPIONI",
        "KIT_RIPARAZIONE",
        "TUTA_EVA_MK2",
        "RILEVATORE_RADIAZIONI",
      ],
    },

    // 15 giorni di scorte per 4 persone (36/giorno); carburante dal DESIGN §6.3.
    risorse: { scorte: 540, energia: 150, carburante: 26 },

    tasks: {},
    code: { mara: [], adrian: [], nadia: [], sarah: [] },
    conoscenza: { scoperte: [] },
    eventi: { accaduti: [], inAttesa: null },
    log: [
      { tempo: 360, fonte: "VALE", testo: "Inserimento orbitale completato. Pianeta E-17.", codici: [] },
      { tempo: 360, fonte: "VALE", testo: "Capitano. Sistemi nominali. In attesa di istruzioni.", codici: [] },
    ],
    contatoreId: 0,
  };
}
