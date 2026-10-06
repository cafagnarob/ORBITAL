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
  // Sono i valori della nave SENZA moduli: ogni modulo installato li
  // modifica (content/loadout.ts → engine/nave/parametri.ts).
  // --------------------------------------------------------------------------
  giornata: {
    /** Consumi di ogni membro a bordo, al rapporto serale. */
    ciboPerMembro: 2,
    acquaPerMembro: 2,
    ossigenoPerMembro: 2,
    /** Ossigeno rigenerato al giorno dal Supporto Vitale al 100% (scala con l'integrità). */
    produzioneOssigeno: 8,
    /** Capienza dei serbatoi: la rigenerazione non va oltre (le bombole sì). */
    capacitaOssigeno: 60,
    /** Salute persa ogni sera da chi resta senza… */
    dannoSenzaCibo: 10,
    dannoSenzaAcqua: 20,
    dannoSenzaOssigeno: 35,
    /** Energia generata al giorno (DESIGN §6.2, senza moduli). */
    generazioneEnergia: 12,
    /**
     * Energia consumata al giorno dai sistemi core. Il DESIGN (§6.2) dice 8
     * con il loadout di riferimento: 5 della nave + 3 dei moduli installati.
     */
    consumoEnergia: 5,
    /** Carica massima della batteria (DESIGN §6.2). */
    capacitaBatteria: 150,
    /** Fatica recuperata con il sonno, al risveglio. */
    recuperoFaticaNotturno: 35,
  },

  // --------------------------------------------------------------------------
  // PREPARAZIONE (DESIGN §7.1, §11.1, §6.3 — Fase 4)
  // --------------------------------------------------------------------------
  preparazione: {
    /** Membri della crew che partono. */
    crewRichiesta: 4,
    /** Carico operativo massimo in kg (la crew conta nel peso). */
    caricoMassimo: 1000,
    slotModuli: 4,
    slotEquipaggiamento: 6,
    /** Spazio scorte della stiva senza Espansione Stoccaggio. */
    spazioScorte: 200,
    /** Carburante nel serbatoio principale: è la riserva di rientro. */
    serbatoio: 18,
    /** Carburante che serve per tornare a casa (DESIGN §6.3). */
    riservaRientro: 18,
    /** Sotto questi giorni di scorte la Preparazione avvisa. */
    giorniScorteConsigliati: 8,
  },

  // --------------------------------------------------------------------------
  // V.A.L.E. (DESIGN §3 — Fase 3)
  // --------------------------------------------------------------------------
  vale: {
    /** Punti di tensione per salire di un livello di comportamento. */
    tensionePerLivello: 3,
    /** Tensione aggiunta quando parte un task contrario alla direttiva. */
    tensioneTaskContrario: 2,
    /** Tensione aggiunta da un tentativo fallito nel Terminale SVC-07. */
    tensioneTentativoTerminale: 1,
    /** Tensione aggiunta quando il Capitano contesta un'affermazione. */
    tensioneContestazione: 1,
    /** Tensione aggiunta dall'override del nucleo (ORD-01). */
    tensioneOverride: 3,
    /** Fiducia della crew quando una verifica SMENTISCE / CONFERMA V.A.L.E. */
    fiduciaSmentita: -15,
    fiduciaConfermata: 5,
    /** Fiducia della crew quando V.A.L.E. rifiuta un task. */
    fiduciaRifiuto: -10,
    /** Soglie oltre le quali un membro della crew DICE cosa pensa. */
    sogliaSfiducia: 30,
    sogliaFiducia: 75,
    /** Pesi dell'integrità dei dati (somma 1). */
    pesoIntegrita: { SCIENZA: 0.4, NAVIGAZIONE: 0.3, COMUNICAZIONI: 0.3 },
    /** Errore massimo della stima di rischio = (100 − integrità) × questo valore. */
    erroreStimaPerPunto: 0.5,
  },

  // --------------------------------------------------------------------------
  // STORIA EMERGENTE (DESIGN §10.2 — v3.0)
  // --------------------------------------------------------------------------
  storia: {
    /** Fiducia da cui un membro sta CON V.A.L.E. (≥) o CONTRO (≤). In mezzo: indeciso. */
    fazioneCon: 65,
    fazioneContro: 35,
    /** Probabilità, ogni mattina, che un membro CONTRO contesti V.A.L.E. da solo. */
    probabilitaIniziativa: 0.35,
    /** Da questo comportamento (3 = PERSISTENTE) chi sta con V.A.L.E. rifiuta i task che lei sconsiglia. */
    comportamentoRifiutoCrew: 3,
    /** Da questa autonomia (4 = AUTONOMA) V.A.L.E. blocca i compartimenti e il rientro. */
    autonomiaBlocco: 4,
    /** Tensione aggiunta da uno sblocco manuale riuscito. */
    tensioneSblocco: 2,
    /** Dopo questo giorno la finestra di rientro si chiude: la missione finisce. */
    durataMissione: 10,
  },
} as const;
