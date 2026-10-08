/**
 * ============================================================================
 * missioneDiProva.ts — Una missione valida e completa da usare nei test
 * ============================================================================
 *
 * COS'È UNA "FIXTURE"
 * Un dato di partenza preparato una volta e riusato da molti test.
 * I test di orologio, task ed eventi partiranno tutti da qui invece di
 * ricostruire ogni volta crew, nave e risorse.
 *
 * PERCHÉ UNA FUNZIONE E NON UNA COSTANTE
 * creaMissioneDiProva() restituisce un oggetto NUOVO a ogni chiamata.
 * Se fosse una costante condivisa e un test la modificasse per errore,
 * il test successivo partirebbe da dati "sporchi" e fallirebbe senza motivo.
 *
 * I DATI
 * Crew e loadout del playthrough di riferimento (DESIGN §13.8).
 * I numeri di abilità sono provvisori e servono solo ai test.
 * ============================================================================
 */

import { hashSeed } from "../../src/engine/rng";
import type { MembroCrew, StatoMissione } from "../../src/engine/types";

/** Crea un membro con valori di base, sovrascrivendo solo ciò che serve. */
function membro(dati: Pick<MembroCrew, "id" | "nome" | "ruolo" | "abilita" | "tratto" | "personalita"> & Partial<MembroCrew>): MembroCrew {
  return {
    peso: 75,
    salute: 100,
    fatica: 0,
    fame: 0,
    sete: 0,
    fiduciaVale: 50,
    posizione: "HABITAT",
    stato: "SANO",
    ...dati,
  };
}

export function creaMissioneDiProva(seed = "E17-73A9"): StatoMissione {
  const crew: Record<string, MembroCrew> = {
    mara: membro({
      id: "mara",
      nome: "Mara",
      ruolo: "INGEGNERE",
      abilita: { INGEGNERIA: 8, SCIENZA: 3, PILOTAGGIO: 2, MEDICINA: 1, EVA: 5, VELOCITA: 6, PRECISIONE: 7 },
      tratto: "ESPERTO_MECCANICA",
      personalita: { approccio: "PRAGMATICO", socialita: "LEALE", mentalita: "DISCIPLINATO" },
      fiduciaVale: 72,
    }),
    adrian: membro({
      id: "adrian",
      nome: "Adrian",
      ruolo: "PILOTA",
      abilita: { INGEGNERIA: 3, SCIENZA: 2, PILOTAGGIO: 9, MEDICINA: 1, EVA: 4, VELOCITA: 7, PRECISIONE: 6 },
      tratto: "IMPAVIDO",
      personalita: { approccio: "AMANTE_DEL_RISCHIO", socialita: "INDIPENDENTE", mentalita: "CALMO" },
      peso: 82,
      fiduciaVale: 31,
      posizione: "COMANDO",
    }),
    nadia: membro({
      id: "nadia",
      nome: "Nadia",
      ruolo: "SCIENZIATO",
      abilita: { INGEGNERIA: 2, SCIENZA: 9, PILOTAGGIO: 1, MEDICINA: 3, EVA: 4, VELOCITA: 4, PRECISIONE: 8 },
      tratto: "CURIOSO",
      personalita: { approccio: "CAUTO", socialita: "EMPATICO", mentalita: "CURIOSO" },
      peso: 64,
      fiduciaVale: 55,
      posizione: "LABORATORIO",
    }),
    sarah: membro({
      id: "sarah",
      nome: "Sarah",
      ruolo: "MEDICO",
      abilita: { INGEGNERIA: 1, SCIENZA: 5, PILOTAGGIO: 1, MEDICINA: 9, EVA: 3, VELOCITA: 5, PRECISIONE: 8 },
      tratto: "MEDICO_DA_CAMPO",
      personalita: { approccio: "CAUTO", socialita: "LEALE", mentalita: "CALMO" },
      peso: 68,
      fiduciaVale: 80,
      posizione: "INFERMERIA",
    }),
  };

  return {
    seed,
    rngState: hashSeed(seed),
    // Il piano della partita (v3.8): una missione di prova (non nel
    // catalogo: niente obiettivi) con le durate classiche 3 + 4 + 3.
    missione: { id: "PROVA", durate: { andata: 3, orbita: 4, rientro: 3 } },

    tempo: 360, // Giorno 1, ore 06:00
    statoGioco: "PIANIFICAZIONE",

    crew,
    nave: {
      scafo: 100,
      sistemi: {
        SUPPORTO_VITALE: 100,
        POTENZA: 100,
        PROPULSIONE: 100,
        NAVIGAZIONE: 100,
        COMUNICAZIONI: 100,
        SCIENZA: 100,
        MEDICINA: 100,
        OPERAZIONI_ESTERNE: 100,
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
    risorse: { cibo: 120, acqua: 120, ossigeno: 60, energia: 150, carburante: 26 },

    // Un task già in coda, per avere dati realistici da testare.
    tasks: {
      "task-1": {
        id: "task-1",
        idDefinizione: "T-DIAGNOSTICA",
        responsabile: "mara",
        supporto: null,
        stato: "IN_CODA",
        inizio: null,
        fine: null,
        rischio: null,
        esito: null,
      },
    },
    code: { mara: ["task-1"], adrian: [], nadia: [], sarah: [] },

    conoscenza: { scoperte: [] },
    eventi: { accaduti: [], inAttesa: null },
    terminale: { livello: 0, frammenti: [], segnalate: [], tentativi: [] },
    vale: { direttiva: "D-NEUTRA", tensione: 0, tono: "CALMO", ultimaScusa: null, override: false, affermazioni: [], contestazioni: [] },
    log: [
      { tempo: 360, fonte: "VALE", testo: "Capitano. Sistemi nominali. In attesa di istruzioni.", codici: [] },
    ],
    contatoreId: 1,
    diario: [],
    imprevisto: null,
    esito: null,
    colloqui: [],
    minigioco: null,
    partenza: null,
    obiettiviCompletati: [],
  };
}
