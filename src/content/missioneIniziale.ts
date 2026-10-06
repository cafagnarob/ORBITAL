/**
 * ============================================================================
 * missioneIniziale.ts — Dalla Preparazione allo stato di partenza della missione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1, §11, §13.8 (playthrough di riferimento).
 *
 * COSA FA
 * Prende le scelte del Capitano (Preparazione) e costruisce lo StatoMissione:
 *   crew           → copie dei candidati scelti (fatica 0, al loro posto)
 *   nave           → sistemi di E-17 + moduli ed equipaggiamento scelti
 *   risorse        → dalle casse caricate (risorseIniziali), batteria piena
 *   direttiva      → sorteggiata col seed, MA solo tra quelle possibili con
 *                    ciò che c'è a bordo (direttiveEleggibili, DESIGN §11.4)
 *   imprevisto     → (v3.0) un piccolo evento di partenza estratto dal seed:
 *                    una cassa rotta, un'antenna colpita… o niente
 * La nave è appena entrata in orbita attorno a E-17: Giorno 1, ore 06:00.
 *
 * PREPARAZIONE_DI_RIFERIMENTO
 * È il loadout del playthrough di riferimento (§13.8). La schermata di
 * Preparazione parte da qui, e i test che non riguardano la Preparazione
 * chiamano creaMissioneIniziale(seed) senza secondo argomento: per loro
 * non cambia nulla rispetto a prima.
 *
 * PERCHÉ NON RIUSARE LA FIXTURE DEI TEST
 * Si somigliano, ma servono a cose diverse: questa è il GIOCO e cambierà
 * con il bilanciamento; la fixture è un punto fermo per i test.
 * ============================================================================
 */

import { applicaEffetti } from "../engine/eventi/effetti";
import { risorseIniziali, tagABordo } from "../engine/preparazione";
import { createRng, deriveSeed, hashSeed } from "../engine/rng";
import { conNomi, scegliAttori } from "../engine/storia/attori";
import { scriviDiario } from "../engine/storia/diario";
import type { MembroCrew, Preparazione, StatoMissione } from "../engine/types";
import { direttiveEleggibili, scegliDirettiva } from "../engine/vale/direttiva";
import { CATALOGHI_PREPARAZIONE, CONTESTO_GIOCO } from "./contesto";
import { LISTA_DIRETTIVE } from "./direttive";
import { LISTA_IMPREVISTI } from "./storia";

/** Il loadout del playthrough di riferimento: ~969 kg su 1000. */
export const PREPARAZIONE_DI_RIFERIMENTO: Preparazione = {
  crew: ["mara", "adrian", "nadia", "sarah"],
  moduli: ["LABORATORIO_AVANZATO", "POTENZIAMENTO_SUPPORTO_VITALE", "MODULO_OPERAZIONI_ESTERNE", "ARRAY_NAVIGAZIONE"],
  equipaggiamento: [
    "SENSORE_PROFONDO",
    "DRONE_RICOGNIZIONE",
    "CONTENITORE_CAMPIONI",
    "KIT_RIPARAZIONE",
    "TUTA_EVA_MK2",
    "RILEVATORE_RADIAZIONI",
  ],
  // 10 casse di cibo = 120 (15 giorni per 4), 8 d'acqua = 120 (15 giorni),
  // 2 taniche = 8 di carburante operativo. Ossigeno: serbatoi pieni (60).
  scorte: { CASSA_CIBO: 10, CASSA_ACQUA: 8, TANICA_CARBURANTE: 2, CASSA_SCORTE_MEDICHE: 1 },
};

/** Le prime parole di V.A.L.E. in orbita (anche lette ad alta voce all'avvio). */
export const FRASI_APERTURA = [
  "Inserimento orbitale completato. Pianeta E-17.",
  "Capitano. Sistemi nominali. In attesa di istruzioni.",
] as const;

export function creaMissioneIniziale(
  seed = "E17-73A9",
  prep: Preparazione = PREPARAZIONE_DI_RIFERIMENTO,
): StatoMissione {
  const cat = CATALOGHI_PREPARAZIONE;

  // La crew: COPIE dei candidati (structuredClone), così la partita può
  // modificarle senza toccare il catalogo, che resta uguale per la prossima.
  const crew: Record<string, MembroCrew> = {};
  const code: Record<string, string[]> = {};
  for (const id of prep.crew) {
    const candidato = cat.candidati[id];
    if (!candidato) continue;
    crew[id] = structuredClone(candidato);
    code[id] = [];
  }

  const direttive = direttiveEleggibili(LISTA_DIRETTIVE, tagABordo(prep, cat));

  const stato: StatoMissione = {
    seed,
    rngState: hashSeed(seed),
    tempo: 360, // Giorno 1, 06:00
    statoGioco: "PIANIFICAZIONE",

    crew,

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
      moduli: [...prep.moduli],
      equipaggiamento: [...prep.equipaggiamento],
    },

    risorse: risorseIniziali(prep, cat),

    tasks: {},
    code,
    conoscenza: { scoperte: [] },
    eventi: { accaduti: [], inAttesa: null },
    terminale: { livello: 0, frammenti: [], segnalate: [], tentativi: [] },
    // La direttiva nascosta. La UI non la mostra mai finché il terminale
    // non la rivela (codice DIR-07).
    vale: {
      direttiva: scegliDirettiva(seed, direttive),
      tensione: 0,
      override: false,
      affermazioni: [],
      contestazioni: [],
    },
    log: FRASI_APERTURA.map((testo) => ({ tempo: 360, fonte: "VALE" as const, testo, codici: [] })),
    contatoreId: 0,
    diario: [],
    imprevisto: null,
    esito: null,
  };

  applicaImprevisto(stato);
  return stato;
}

/**
 * L'imprevisto di partenza: estratto con un generatore dedicato (dominio
 * "imprevisto"), così non cambia la sequenza casuale del resto della partita.
 */
function applicaImprevisto(stato: StatoMissione): void {
  const rng = createRng(deriveSeed(stato.seed, "imprevisto"));
  const imprevisto = rng.weightedPick(LISTA_IMPREVISTI.map((i) => ({ item: i, peso: i.peso })));
  const attori = scegliAttori(stato, imprevisto.protagonista, undefined, rng);
  stato.imprevisto = imprevisto.id;
  stato.log.push({ tempo: stato.tempo, fonte: imprevisto.log.fonte, testo: conNomi(stato, imprevisto.log.testo, attori), codici: [] });
  applicaEffetti(stato, imprevisto.effetti, { idTaskOrigine: null, ...attori }, CONTESTO_GIOCO);
  scriviDiario(stato, conNomi(stato, imprevisto.diario, attori));
}
