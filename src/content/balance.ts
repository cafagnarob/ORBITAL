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
    /**
     * Consumi di ogni membro a bordo, al rapporto serale. v3.9: da 2 a 3 —
     * la stiva non basta più per tutto il viaggio: le task di sopravvivenza
     * (riciclo dell'acqua, coltura, elettrolisi) diventano quasi necessarie.
     */
    ciboPerMembro: 3,
    acquaPerMembro: 3,
    ossigenoPerMembro: 3,
    /**
     * Ossigeno rigenerato al giorno dal Supporto Vitale al 100% (scala con
     * l'integrità). v3.9: 6, meno di quanto respira la crew (4 × 3 = 12): i
     * serbatoi pieni durano una decina di giorni, poi serve l'elettrolisi.
     */
    produzioneOssigeno: 6,
    /** Capienza dei serbatoi: la rigenerazione non va oltre (le bombole sì). */
    capacitaOssigeno: 60,
    /** Salute persa ogni sera da tutti quando l'ossigeno non basta (fame e sete: vedi razioni). */
    dannoSenzaOssigeno: 35,
    /** Energia generata al giorno (DESIGN §6.2, senza moduli). */
    generazioneEnergia: 12,
    /**
     * Energia consumata al giorno dai sistemi core. Il DESIGN (§6.2) dice 8
     * con il loadout di riferimento: 5 della nave + 3 dei moduli installati.
     */
    consumoEnergia: 7, // v3.9: era 5; la batteria non si riempie più da sola
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
    /**
     * Candidati presentati in ogni partita (v3.7.3): estratti a caso, col
     * seed, tra tutti quelli del catalogo (content/candidati.ts).
     */
    candidatiProposti: 6,
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
    /** Sotto questi giorni di scorte la Preparazione avvisa (se non si conosce la missione). */
    giorniScorteConsigliati: 6,
    /**
     * Con la missione nota si avvisa sotto questa QUOTA dei suoi giorni
     * (v3.9: 60%). Il resto lo devono produrre le task di sopravvivenza:
     * la stiva da sola non basta per tutto il viaggio.
     */
    quotaScorteConsigliata: 0.6,
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
    /**
     * I TONI del Capitano (v3.9), per ogni domanda:
     *   spostamento   livelli di comportamento aggiunti quando V.A.L.E. sceglie
     *                 la risposta (−1 = più disponibile, +1 = più evasiva)
     *   tensione      tensione aggiunta a ogni domanda
     *   suDiLei       tensione in più se la domanda riguarda LEI (non di fatto)
     *   fiduciaCrew   fiducia della crew in V.A.L.E. (la crew sente come parli)
     *   datiVeri      sulle domande di fatto risponde sempre con i dati veri
     *   crepa         probabilità che V.A.L.E. lasci sfuggire un codice
     *   verifica      aggiunge la riga di verifica incrociata (concordanza %)
     */
    toni: {
      CALMO: { spostamento: 0, tensione: 0, suDiLei: 0, fiduciaCrew: 0, datiVeri: false, crepa: 0, verifica: false },
      AMICHEVOLE: { spostamento: -1, tensione: 0, suDiLei: 0, fiduciaCrew: 1, datiVeri: false, crepa: 0, verifica: false },
      FERMO: { spostamento: 0, tensione: 0, suDiLei: 1, fiduciaCrew: 0, datiVeri: true, crepa: 0, verifica: false },
      ARRABBIATO: { spostamento: 1, tensione: 1, suDiLei: 0, fiduciaCrew: -2, datiVeri: false, crepa: 0.35, verifica: false },
      SOSPETTOSO: { spostamento: 0, tensione: 0, suDiLei: 0, fiduciaCrew: -1, datiVeri: false, crepa: 0, verifica: true },
    },
    /** Le scuse tolgono questa tensione, al massimo una volta ogni tante ore. */
    scusaTensione: 1,
    scusaOgniOre: 24,
  },

  // --------------------------------------------------------------------------
  // CODICI CASUALI NEI LOG (v3.9)
  // --------------------------------------------------------------------------
  codici: {
    /**
     * A ogni cambio turno (4 al giorno) c'è questa probabilità che nel log
     * compaia una riga con un codice della catena, a caso: in media uno
     * ogni giorno e mezzo. Né comune né rarissimo.
     */
    probabilitaPerTurno: 0.18,
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
    // (v3.7: la durata della missione ora è in `missione`, fase per fase.)
  },

  // --------------------------------------------------------------------------
  // RAZIONI, FAME E SETE (DESIGN §6.4 — v3.4)
  // --------------------------------------------------------------------------
  razioni: {
    /**
     * Punti di fame/sete (0–6) aggiunti o tolti a ogni razione serale.
     * La sete è più dura della fame: senz'acqua si peggiora più in fretta.
     */
    fame: { PIENA: -2, MEZZA: 1, NIENTE: 2 },
    sete: { PIENA: -3, MEZZA: 1, NIENTE: 3 },
    puntiMassimi: 6,
    /** Task al giorno di un membro sazio e idratato; ogni livello di fame o sete ne toglie uno. */
    taskMassimi: 4,
    /** Fatica in meno recuperata di notte per ogni livello di fame o sete. */
    recuperoPerso: 10,
    /** Salute persa ogni notte per ogni livello OLTRE il primo (fame / sete). */
    dannoFame: 8,
    dannoSete: 12,
    /**
     * PARANOIA: da questo carico (livello fame + livello sete) chi è affamato
     * si chiude nelle sue idee. Chi diffida di V.A.L.E. diffida di più; chi
     * le crede si fida di lei più che dei compagni.
     */
    caricoParanoia: 2,
    paranoiaPerLivello: 3,
  },

  // --------------------------------------------------------------------------
  // COLLOQUI DEL CAPITANO (DESIGN §7.8 — v3.4)
  // --------------------------------------------------------------------------
  colloqui: {
    /** Probabilità base che un discorso convinca. */
    probabilitaBase: 0.55,
    /** Bonus se il membro è INDECISO (è disposto ad ascoltare). */
    bonusIndeciso: 0.15,
    /** Malus se il discorso va contro un'opinione forte (fiducia ≥ 80 o ≤ 20). */
    malusOpinioneForte: 0.2,
    /** Malus per ogni livello di carico (fame + sete) oltre il primo: la paranoia non ascolta. */
    malusParanoia: 0.1,
    /** Fiducia spostata da un discorso riuscito / fallito. */
    convinto: 10,
    controproducente: -4,
    /** Fatica tolta da un discorso di incoraggiamento riuscito. */
    sollievo: 12,
  },

  // --------------------------------------------------------------------------
  // MINIGIOCHI (DESIGN §9.2 — v3.6)
  // --------------------------------------------------------------------------
  minigiochi: {
    /** Da questo rischio (%) il minigioco compare sempre all'avvio del task. */
    sogliaRischio: 40,
    /** Sotto la soglia compare con questa probabilità. */
    probabilita: 0.3,
    /** Sotto questo rischio non compare mai (non c'è niente da migliorare). */
    rischioMinimo: 6,
    /** Punti di rischio tolti da un minigioco perfetto (punteggio 1). */
    bonusMassimo: 20,
    /** Rischio da cui il minigioco è di livello 2 e 3. */
    difficoltaMedia: 35,
    difficoltaAlta: 55,
  },

  // --------------------------------------------------------------------------
  // TEMPO REALE (DESIGN §8.1 — v3.3)
  // --------------------------------------------------------------------------
  tempoReale: {
    /**
     * Millisecondi reali per un minuto di gioco. Le operazioni (07:00–22:00)
     * sono 900 minuti di gioco e devono durare 5 minuti reali (300 000 ms).
     */
    msPerMinuto: 300_000 / 900, // ≈ 333 ms: 1 secondo reale = 3 minuti di gioco
    /** Ogni quanto l'orologio controlla il tempo trascorso (ms). */
    intervalloControllo: 250,
    /**
     * Il salto massimo accettato in un solo controllo (ms). Se il browser
     * congela la pagina (computer in sospensione), al risveglio il gioco
     * non deve "recuperare" ore di tempo tutte insieme.
     */
    saltoMassimo: 1000,
  },
} as const;
