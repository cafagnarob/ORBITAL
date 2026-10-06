/**
 * ============================================================================
 * balance.ts — Tutti i numeri di bilanciamento di ORBITAL
 * ============================================================================
 *
 * COSA CONTIENE
 * Ogni valore "da tarare" del gioco: soglie, moltiplicatori, percentuali.
 * Sono tutti [PROVVISORIO] (DESIGN.md): si cambiano dopo i playtest.
 *
 * PERCHÉ UN FILE SOLO
 * Quando un playtest dice "i task sono troppo rischiosi", devi sapere dove
 * mettere le mani senza cercare numeri sparsi nel motore. Il motore contiene
 * la LOGICA (come si calcola), questo file contiene i VALORI (quanto vale).
 *
 * `as const` rende tutto in sola lettura: nessuna parte del codice può
 * modificare per errore un valore di bilanciamento durante la partita.
 * ============================================================================
 */

export const BALANCE = {
  // --------------------------------------------------------------------------
  // FATICA (DESIGN §7.4)
  // --------------------------------------------------------------------------
  fatica: {
    /** Valore minimo da cui inizia ogni fascia (BASSA parte da 0). */
    soglie: { MODERATA: 40, ALTA: 70, ESAURITO: 90 },
    /** Moltiplicatore della durata dei task (1.1 = +10%). */
    moltiplicatoreDurata: { BASSA: 1, MODERATA: 1.1, ALTA: 1.25, ESAURITO: 1.5 },
    /** Punti di rischio aggiunti a un task svolto in quella fascia. */
    penalitaRischio: { BASSA: 0, MODERATA: 5, ALTA: 12, ESAURITO: 25 },
  },

  // --------------------------------------------------------------------------
  // TASK (DESIGN §9 — formula del rischio, proposta v2.1)
  // --------------------------------------------------------------------------
  task: {
    /** Peso dell'abilità principale nella competenza (il resto è la secondaria). */
    pesoAbilitaPrincipale: 0.7,
    /** Abilità "nella media": sopra riduce il rischio, sotto lo aumenta. */
    abilitaNeutra: 5,
    /** Punti di rischio tolti per ogni punto di competenza sopra la media. */
    rischioPerPuntoCompetenza: 6,
    /** Punti di rischio tolti se c'è un aiutante (un paio di mani in più). */
    bonusRischioSupporto: 5,
    /** Il rischio non scende mai sotto questo valore: nulla è mai sicuro. */
    rischioMinimo: 2,
    /** …né sale oltre questo: c'è sempre una possibilità di riuscita. */
    rischioMassimo: 95,

    /** Riduzione della durata se c'è un aiutante (0.15 = −15%). */
    riduzioneDurataSupporto: 0.15,
    /** Variazione di durata per ogni punto di velocità sopra/sotto la media. */
    durataPerPuntoVelocita: 0.04,

    /** Quota dei fallimenti che diventano FALLIMENTO CRITICO. */
    quotaCritico: 0.25,
    /** Quota dei successi che diventano SUCCESSO PARZIALE. */
    quotaParziale: 0.25,
    /** Quota dei successi che diventano SUCCESSO PERFETTO, con precisione 0… */
    quotaPerfettoBase: 0.1,
    /** …più questa quota per ogni punto di precisione (precisione 10 → 30%). */
    quotaPerfettoPerPrecisione: 0.02,
    /** Quota del costo di fatica che ricade sull'aiutante (0.5 = metà). */
    quotaFaticaSupporto: 0.5,
  },

  // --------------------------------------------------------------------------
  // SPOSTAMENTI (DESIGN §7.6 — semplificato finché non c'è la mappa della nave)
  // --------------------------------------------------------------------------
  spostamento: {
    /** Minuti per raggiungere un altro compartimento. */
    interno: 10,
    /** Minuti in più per uscire o rientrare dall'airlock (tuta, pressione). */
    airlock: 15,
  },

  // --------------------------------------------------------------------------
  // GIORNATA (DESIGN §6, §8)
  // --------------------------------------------------------------------------
  giornata: {
    /** Scorte consumate da ogni membro a bordo, al rapporto serale. */
    scortePerMembro: 9,
    /** Energia generata al giorno (DESIGN §6.2, senza moduli). */
    generazioneEnergia: 12,
    /** Energia consumata al giorno dai sistemi (DESIGN §6.2). */
    consumoEnergia: 8,
    /** Carica massima della batteria (DESIGN §6.2). */
    capacitaBatteria: 150,
    /** Fatica recuperata con il sonno, al risveglio. */
    recuperoFaticaNotturno: 35,
  },
} as const;
