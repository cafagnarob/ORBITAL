/**
 * ============================================================================
 * orologioReale.ts — Il tempo che scorre da solo (giornata di 5 minuti)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §8.1 (tempo reale, v3.3).
 *
 * COSA FA
 * Conta il tempo REALE che passa e, ogni volta che è trascorso un minuto di
 * gioco (balance.tempoReale.msPerMinuto), chiama `battito(minuti)`. Chi lo
 * usa (useMissione) decide cosa farne: se la partita è in corso, manda al
 * motore AVANZA_FINO. L'orologio non sa nulla di ORBITAL: sa solo contare.
 *
 * PERCHÉ `collega` E NON UN PARAMETRO
 * Il battito di useMissione legge un ref (l'ultimo stato). React vieta di
 * passare funzioni che leggono ref durante il render (la regola "refs"
 * del linter): l'orologio si crea quindi SENZA battito, e il battito si
 * collega dai gestori di evento (in dispatch), cioè fuori dal render.
 *
 * PERCHÉ UNO "STORE ESTERNO" E NON useEffect
 * Un timer è un effetto collaterale: va avviato quando la schermata compare
 * e fermato quando sparisce. React ha un hook ufficiale per collegarsi a
 * qualcosa che vive FUORI da React: useSyncExternalStore(iscriviti, leggi).
 *   - React chiama `iscriviti` quando il componente compare → noi avviamo
 *     il timer; la funzione che restituiamo viene chiamata quando il
 *     componente sparisce → noi fermiamo il timer. Nessun timer orfano.
 *   - `leggi` restituisce lo stato dell'orologio (in pausa? scheda nascosta?)
 *     che l'interfaccia mostra; quando cambia avvisiamo React.
 * È lo stesso schema dei volumi dell'audio (audio/impostazioni.ts).
 *
 * LE PAUSE
 *   - manuale: il pulsante PAUSA (impostaPausa);
 *   - scheda nascosta: se cambi scheda o il telefono va in standby
 *     (document.hidden), il tempo si ferma e riparte quando torni;
 *   - di gioco (decisione, rapporto, pianificazione): le decide il motore,
 *     non l'orologio. Il battito arriva comunque, ma useMissione lo ignora.
 *
 * TEMPO MISURATO, NON CONTATO
 * Non ci fidiamo che setInterval scatti davvero ogni 250 ms (con la pagina
 * sotto sforzo ritarda). Misuriamo con performance.now() quanto tempo è
 * passato davvero e accumuliamo i millisecondi: i minuti "avanzati" restano
 * nell'accumulatore per il giro dopo. Così 5 minuti reali sono 900 minuti
 * di gioco anche se il timer è irregolare.
 *
 * VELOCITÀ DI PROVA
 * Una giornata dura 5 minuti: per collaudare il gioco è ancora tanto. Aggiungendo
 * all'indirizzo ?velocita=20 il tempo scorre 20 volte più in fretta
 * (massimo 120). È uno strumento per chi sviluppa: il gioco non lo mostra.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";

/** Il moltiplicatore letto da ?velocita=N (1 se assente o non valido). */
export function velocitaDiProva(): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("velocita"));
  return Number.isFinite(n) && n >= 1 ? Math.min(120, n) : 1;
}

export interface StatoOrologio {
  /** Il Capitano ha premuto PAUSA. */
  pausa: boolean;
  /** La scheda del browser non è visibile. */
  nascosto: boolean;
}

export interface OrologioReale {
  iscriviti: (avvisa: () => void) => () => void;
  leggi: () => StatoOrologio;
  impostaPausa: (pausa: boolean) => void;
  /** Collega (o sostituisce) chi riceve i battiti. */
  collega: (battito: (minuti: number) => void) => void;
}

/** La pagina è nascosta? (Fuori dal browser, nei test, non lo è mai.) */
function paginaNascosta(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

export function creaOrologioReale(velocita = 1): OrologioReale {
  let battito: ((minuti: number) => void) | null = null;
  const { intervalloControllo, saltoMassimo } = BALANCE.tempoReale;
  const msPerMinuto = BALANCE.tempoReale.msPerMinuto / velocita;

  // Stato letto da React: un oggetto NUOVO a ogni cambio (useSyncExternalStore
  // confronta i riferimenti: se l'oggetto è lo stesso, non ridisegna).
  let stato: StatoOrologio = { pausa: false, nascosto: paginaNascosta() };
  const ascoltatori = new Set<() => void>();
  const cambia = (nuovo: Partial<StatoOrologio>) => {
    stato = { ...stato, ...nuovo };
    ascoltatori.forEach((a) => a());
  };

  let timer: ReturnType<typeof setInterval> | null = null;
  let ultimoControllo = 0;
  let accumulati = 0; // millisecondi reali non ancora trasformati in minuti

  function controlla() {
    const adesso = performance.now();
    const trascorsi = Math.min(adesso - ultimoControllo, saltoMassimo);
    ultimoControllo = adesso;
    // Il tempo in pausa (o senza nessuno collegato) non si accumula.
    if (stato.pausa || stato.nascosto || battito === null) return;

    accumulati += trascorsi;
    const minuti = Math.floor(accumulati / msPerMinuto);
    if (minuti > 0) {
      accumulati -= minuti * msPerMinuto;
      battito(minuti);
    }
  }

  function visibilita() {
    cambia({ nascosto: paginaNascosta() });
    ultimoControllo = performance.now(); // al ritorno si riparte da adesso
  }

  function avvia() {
    ultimoControllo = performance.now();
    timer = setInterval(controlla, intervalloControllo);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", visibilita);
  }

  function ferma() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", visibilita);
  }

  return {
    iscriviti(avvisa) {
      ascoltatori.add(avvisa);
      if (ascoltatori.size === 1) avvia(); // il primo che guarda accende l'orologio
      return () => {
        ascoltatori.delete(avvisa);
        if (ascoltatori.size === 0) ferma(); // l'ultimo che se ne va lo spegne
      };
    },
    leggi: () => stato,
    impostaPausa(pausa) {
      if (pausa !== stato.pausa) cambia({ pausa });
    },
    collega(nuovo) {
      battito = nuovo;
    },
  };
}
