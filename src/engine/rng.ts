/**
 * ============================================================================
 * rng.ts — Generatore di numeri casuali deterministico (PRNG con seed)
 * ============================================================================
 *
 * COSA FA
 * Fornisce tutta la casualità di ORBITAL: esiti dei task, scelta degli eventi,
 * meteo, direttiva di V.A.L.E., quale delle tre verità è attiva, ecc.
 *
 * PERCHÉ NON USIAMO Math.random()
 * Math.random() non si può riprodurre né salvare. Un generatore "con seed"
 * invece è una funzione matematica che, partendo da un numero iniziale
 * (lo STATO), produce una sequenza che sembra casuale ma è sempre identica
 * a parità di stato. Questo ci dà:
 *   - DETERMINISMO: stesso seed → stessa partita (replay, debug, playtest).
 *   - SALVATAGGI CORRETTI: salvando lo stato del generatore insieme allo stato
 *     di gioco, dopo il caricamento la sorte continua esattamente da dove era.
 *     Il giocatore non può "ritentare" ricaricando.
 *   - TEST AFFIDABILI: possiamo simulare partite intere e verificarne l'esito.
 *
 * COME SI USA (pattern "mutabile dentro, puro fuori")
 * Il motore è fatto di funzioni pure: (stato, azione) → nuovoStato.
 * Dentro un reducer:
 *   1. const rng = createRng(stato.rngState);   // crea un Rng LOCALE
 *   2. rng.int(...), rng.chance(...), ...        // lo usa quante volte serve
 *   3. return { ...nuovoStato, rngState: rng.getState() };  // salva lo stato
 * L'oggetto rng cambia internamente, ma non esce mai dal reducer:
 * dall'esterno il reducer resta puro.
 *
 * ALGORITMI USATI (standard e noti, non inventati da noi)
 *   - FNV-1a:     trasforma un testo (es. "E17-73A9") in un intero a 32 bit.
 *   - Mulberry32: genera la sequenza pseudo-casuale. Veloce, piccolo e con una
 *                 qualità più che sufficiente per un gioco (non per crittografia).
 *
 * Riferimento design: DESIGN.md §12.1 (seed pianeta / seed partita) e §16.1.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// TIPI
// ----------------------------------------------------------------------------

/**
 * Una voce di una scelta pesata.
 * Più è alto il peso, più è probabile che la voce venga scelta.
 * Esempio (DESIGN §10): { item: "TEMPESTA_DI_POLVERE", peso: 25 }
 */
export interface VocePesata<T> {
  item: T
  peso: number
}

/**
 * L'interfaccia del generatore.
 * Tutti i metodi (tranne getState) fanno avanzare la sequenza.
 */
export interface Rng {
  /** Numero decimale in [0, 1): può valere 0, non arriva mai a 1. */
  next(): number
  /** Intero tra min e max, ENTRAMBI inclusi. */
  int(min: number, max: number): number
  /** true con la probabilità indicata (0 = mai, 1 = sempre, 0.3 = 30%). */
  chance(probabilita: number): boolean
  /** Un elemento a caso della lista (tutti con la stessa probabilità). */
  pick<T>(lista: readonly T[]): T
  /** Un elemento scelto in base ai pesi (pool di eventi, tipi di POI...). */
  weightedPick<T>(voci: readonly VocePesata<T>[]): T
  /** Lo stato attuale, da salvare nello stato di gioco. Non fa avanzare nulla. */
  getState(): number
}

// ----------------------------------------------------------------------------
// SEED TESTUALI → NUMERI
// ----------------------------------------------------------------------------

/**
 * Trasforma un seed testuale in un intero senza segno a 32 bit (FNV-1a).
 *
 * Perché serve: i seed di ORBITAL sono leggibili ("E17-73A9"), ma il
 * generatore lavora con numeri. FNV-1a "mescola" i caratteri uno alla volta:
 * stesso testo → sempre stesso numero; testi simili → numeri molto diversi.
 */
export function hashSeed(testo: string): number {
  // Valore di partenza standard dell'algoritmo FNV-1a (offset basis).
  let h = 0x811c9dc5

  for (let i = 0; i < testo.length; i++) {
    // XOR con il codice del carattere: "incorpora" il carattere nell'hash.
    h ^= testo.charCodeAt(i)
    // Moltiplicazione per il numero primo FNV.
    // Math.imul moltiplica come un processore a 32 bit (scarta l'eccedenza),
    // cosa che la normale moltiplicazione di JavaScript non fa.
    h = Math.imul(h, 0x01000193)
  }

  // ">>> 0" converte il risultato in intero SENZA segno (sempre ≥ 0).
  return h >>> 0
}

/**
 * Crea un seed indipendente per un singolo dominio di generazione.
 *
 * Perché serve (DESIGN §12.1): se pianeta, meteo e V.A.L.E. usassero tutti
 * la stessa sequenza, aggiungere un solo tiro al meteo sposterebbe tutti i
 * tiri successivi e cambierebbe anche il pianeta. Con un seed per dominio,
 * ogni generatore ha la sua sequenza e non disturba gli altri.
 *
 * Esempio: deriveSeed("E17-73A9", "meteo") e deriveSeed("E17-73A9", "vale")
 * producono due numeri diversi, ma sempre gli stessi.
 */
export function deriveSeed(seed: string, dominio: string): number {
  return hashSeed(`${seed}:${dominio}`)
}

// ----------------------------------------------------------------------------
// GENERATORE
// ----------------------------------------------------------------------------

/**
 * Crea un generatore partendo da uno stato numerico.
 *
 * Lo stato iniziale può venire da hashSeed/deriveSeed (nuova partita)
 * oppure da getState() di un generatore precedente (partita caricata).
 *
 * Tecnica usata: una "closure". La variabile `stato` è privata: è visibile
 * solo alle funzioni definite qui dentro, nessuno può modificarla dall'esterno.
 */
export function createRng(statoIniziale: number): Rng {
  // "| 0" forza il valore a intero con segno a 32 bit, il formato su cui
  // lavora Mulberry32. Così qualsiasi numero in ingresso diventa valido.
  let stato = statoIniziale | 0

  /**
   * Mulberry32: fa avanzare lo stato e restituisce un decimale in [0, 1).
   * È l'UNICO punto in cui lo stato cambia: tutti gli altri metodi
   * sono costruiti sopra next().
   */
  function next(): number {
    // 1. Avanza lo stato di una costante fissa (resta a 32 bit grazie a "| 0").
    stato = (stato + 0x6d2b79f5) | 0

    // 2. Mescola i bit dello stato con shift, XOR e moltiplicazioni a 32 bit.
    //    Non serve capire ogni passaggio: è la "ricetta" dell'algoritmo.
    let t = Math.imul(stato ^ (stato >>> 15), 1 | stato)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    // 3. Rende il risultato un intero senza segno (0 … 2³²−1) e lo divide
    //    per 2³² = 4294967296, ottenendo un decimale tra 0 (incluso) e 1 (escluso).
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Intero tra min e max inclusi.
   *
   * Ragionamento: in int(1, 6) i valori possibili sono 6 (1,2,3,4,5,6),
   * cioè (max − min + 1). next() × 6 dà un decimale in [0, 6);
   * Math.floor lo porta a 0…5; sommando min si ottiene 1…6.
   * Senza il "+ 1" il valore max non uscirebbe mai: è l'errore più comune.
   */
  function int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new Error(
        `rng.int: min e max devono essere interi (ricevuti ${min}, ${max})`,
      )
    }
    if (min > max) {
      throw new Error(
        `rng.int: min (${min}) non può essere maggiore di max (${max})`,
      )
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  /**
   * true con la probabilità indicata.
   * Funziona perché next() è distribuito uniformemente in [0, 1):
   * la probabilità che sia minore di 0.3 è esattamente il 30%.
   * Casi limite: chance(0) è sempre false (next() non è mai < 0),
   * chance(1) è sempre true (next() è sempre < 1).
   */
  function chance(probabilita: number): boolean {
    if (probabilita < 0 || probabilita > 1 || Number.isNaN(probabilita)) {
      throw new Error(
        `rng.chance: la probabilità deve essere tra 0 e 1 (ricevuta ${probabilita})`,
      )
    }
    return next() < probabilita
  }

  /**
   * Un elemento a caso della lista.
   * `readonly T[]` permette di passare anche liste costanti del contenuto
   * di gioco, e garantisce che questa funzione non le modifichi.
   */
  function pick<T>(lista: readonly T[]): T {
    if (lista.length === 0) {
      throw new Error("rng.pick: impossibile scegliere da una lista vuota")
    }
    const indice = int(0, lista.length - 1)

    // Con "noUncheckedIndexedAccess" attivo, lista[indice] ha tipo T | undefined.
    // Qui il cast "as T" è giustificato: abbiamo appena verificato che la lista
    // non è vuota e int() restituisce un indice sempre valido.
    // (Non controlliamo "=== undefined" perché T potrebbe contenere undefined
    // come valore legittimo.)
    return lista[indice] as T
  }

  /**
   * Scelta pesata (usata dai pool di eventi, DESIGN §10).
   *
   * Ragionamento con un esempio:
   *   voci:  Tempesta 40 · Guasto drone 10 · Calore 10   → totale 60
   *   tiro = next() × 60   → per esempio 47.2
   *   si scorrono le voci sottraendo il peso:
   *     47.2 − 40 = 7.2   (ancora ≥ 0 → si passa alla voce successiva)
   *      7.2 − 10 < 0     → esce "Guasto drone"
   * Ogni voce "occupa" sulla linea 0…60 un tratto lungo quanto il suo peso:
   * più il tratto è lungo, più è probabile che il tiro ci cada dentro.
   * Una voce con peso 0 occupa un tratto lungo 0 e non può mai uscire.
   */
  function weightedPick<T>(voci: readonly VocePesata<T>[]): T {
    let totale = 0
    for (const voce of voci) {
      if (voce.peso < 0 || !Number.isFinite(voce.peso)) {
        throw new Error(`rng.weightedPick: peso non valido (${voce.peso})`)
      }
      totale += voce.peso
    }
    if (totale <= 0) {
      throw new Error(
        "rng.weightedPick: serve almeno una voce con peso maggiore di 0",
      )
    }

    let tiro = next() * totale
    // Teniamo traccia dell'ultima voce valida: serve solo come rete di sicurezza
    // per gli arrotondamenti dei numeri decimali (vedi sotto).
    let ultimaValida: VocePesata<T> | undefined

    for (const voce of voci) {
      if (voce.peso === 0) continue // peso 0 = mai scelta
      ultimaValida = voce
      tiro -= voce.peso
      if (tiro < 0) return voce.item
    }

    // In teoria non ci si arriva mai (tiro < totale). In pratica i numeri
    // decimali possono avere minuscoli errori di arrotondamento: in quel caso
    // restituiamo l'ultima voce valida invece di far fallire il gioco.
    // ultimaValida esiste sicuramente, perché totale > 0.
    return (ultimaValida as VocePesata<T>).item
  }

  /**
   * Restituisce lo stato da salvare.
   * ">>> 0" lo rende un numero positivo, più leggibile nei salvataggi;
   * createRng lo riconverte con "| 0" senza perdere informazioni.
   */
  function getState(): number {
    return stato >>> 0
  }

  return { next, int, chance, pick, weightedPick, getState }
}
