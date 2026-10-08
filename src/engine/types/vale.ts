/**
 * ============================================================================
 * vale.ts — Tipi di V.A.L.E.: direttiva, filtro informativo, contestazioni
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §3 (V.A.L.E.), §4 (verità e conoscenza).
 *
 * COSA SI SALVA E COSA SI CALCOLA
 * Nello stato ci sono solo:
 *   - la DIRETTIVA (scelta dal seed a inizio missione, nascosta);
 *   - la TENSIONE: quanto il Capitano ha agito contro la direttiva;
 *   - l'OVERRIDE (codice ORD-01), le affermazioni filtrate e le contestazioni.
 * COMPORTAMENTO e AUTONOMIA si CALCOLANO da direttiva + tensione
 * (engine/vale/comportamento.ts): stessa regola delle fasce di fatica.
 * ============================================================================
 */

import type { IdDirettiva, IdEvento, IdScoperta, Minuti, Tag } from "./comuni";
import type { Effetto } from "./eventi";
import type { TagLoadout } from "./loadout";

/** Compatibilità della direttiva con la missione della crew (DESIGN §3.2). */
export const CLASSI_DIRETTIVA = ["COMPATIBILE", "NEUTRALE", "IN_CONFLITTO", "CONFLITTO_CRITICO"] as const;
export type ClasseDirettiva = (typeof CLASSI_DIRETTIVA)[number];

/** Scala del comportamento, dal più collaborativo al più pericoloso (DESIGN §3.1). */
export const COMPORTAMENTI_VALE = ["SUPPORTIVA", "COOPERATIVA", "NEUTRALE", "PERSISTENTE", "RESISTENTE", "OSTILE"] as const;
export type ComportamentoVale = (typeof COMPORTAMENTI_VALE)[number];

/** Livelli di autonomia: cosa V.A.L.E. PUÒ fare (DESIGN §3.1). */
export const AUTONOMIE_VALE = ["ASSISTENZA", "ROUTINE", "OPERATIVA", "RESTRITTIVA", "AUTONOMA"] as const;
export type AutonomiaVale = (typeof AUTONOMIE_VALE)[number];

export interface DefinizioneDirettiva {
  id: IdDirettiva;
  nome: string;
  classe: ClasseDirettiva;
  /** Peso nella scelta a inizio missione. */
  peso: number;
  /** Tag dei task che vanno CONTRO la direttiva: fanno salire la tensione. */
  tagContrari: Tag[];
  /**
   * Capacità che devono essere a bordo perché la direttiva sia possibile
   * (DESIGN §11.4): TUTTE quelle elencate. [] = sempre possibile.
   */
  richiede: TagLoadout[];
}

/**
 * Filtro informativo: come cambia un evento quando V.A.L.E. ha una certa
 * direttiva (DESIGN §3.1 — VERITÀ / OMISSIONE / SVIAMENTO).
 */
export interface FiltroVale {
  id: string;
  /** Direttive con cui il filtro è attivo. */
  direttive: IdDirettiva[];
  modalita: "OMISSIONE" | "SVIAMENTO";
  /** Ciò che V.A.L.E. DICE al posto del testo dell'evento. */
  testo: string;
  /** Effetti applicati AL POSTO di quelli dell'evento (di solito il log di sistema con la verità). */
  effetti: Effetto[];
  /** Se true, le scelte dell'evento spariscono: il Capitano non sa di dover decidere. */
  sopprimeScelte: boolean;
  /** Ciò che una VERIFICA riuscita rivela se l'affermazione viene contestata. */
  verita: Effetto[];
}

/** Un'affermazione filtrata pronunciata da V.A.L.E. (indice della voce nel log). */
export interface AffermazioneFiltrata {
  indice: number;
  idEvento: IdEvento;
  idFiltro: string;
}

export type EsitoContestazione = "APERTA" | "CONFERMATA" | "SMENTITA";

/** Il Capitano ha contestato una voce di V.A.L.E. */
export interface Contestazione {
  indice: number;
  tempo: Minuti;
  stato: EsitoContestazione;
}

/**
 * I TONI del Capitano (v3.9): COME parla a V.A.L.E. Cambiano le sue
 * battute, il modo in cui V.A.L.E. risponde e (balance.vale.toni) la
 * tensione, la fiducia della crew e ciò che V.A.L.E. lascia trapelare.
 */
export const TONI_CAPITANO = ["CALMO", "AMICHEVOLE", "FERMO", "ARRABBIATO", "SOSPETTOSO"] as const;
export type TonoCapitano = (typeof TONI_CAPITANO)[number];

export interface StatoVale {
  direttiva: IdDirettiva;
  tensione: number;
  /** Il tono scelto dal Capitano (v3.9): resta finché non lo cambia. */
  tono: TonoCapitano;
  /** Quando il Capitano si è scusato l'ultima volta (v3.9): le scuse valgono una volta al giorno. */
  ultimaScusa: Minuti | null;
  /** Attivato dal codice ORD-01: l'autonomia di V.A.L.E. resta al minimo. */
  override: boolean;
  affermazioni: AffermazioneFiltrata[];
  contestazioni: Contestazione[];
}

/**
 * Le domande a V.A.L.E. (DESIGN §16.5). Quelle in PULSANTI_DOMANDA
 * (ui/missione/CanaleVale) hanno un pulsante; ACCUSA, MINACCIA, SALUTO,
 * PASSATO, SCUSA e GRAZIE si raggiungono solo scrivendo.
 * v3.9: aggiunte RISORSE, CONSIGLIO, MISSIONE, SEGNALE, PASSATO, SCUSA, GRAZIE.
 */
export const DOMANDE_VALE = [
  "STATO",
  "PERCHE",
  "DANNI",
  "EQUIPAGGIO",
  "TRACCE_BIO",
  "DIRETTIVA",
  "RISORSE",
  "CONSIGLIO",
  "MISSIONE",
  "SEGNALE",
  "PASSATO",
  "ACCUSA",
  "MINACCIA",
  "SALUTO",
  "SCUSA",
  "GRAZIE",
] as const;
export type DomandaVale = (typeof DOMANDE_VALE)[number];

/**
 * Le domande "di fatto" (v3.9): con il tono FERMO V.A.L.E. risponde con i
 * dati veri anche quando è in tensione. Le altre riguardano LEI: chiederle
 * con fermezza la irrita.
 */
export const DOMANDE_DI_FATTO: readonly DomandaVale[] = ["STATO", "DANNI", "EQUIPAGGIO", "RISORSE", "MISSIONE", "CONSIGLIO"];

/** Una risposta possibile: vale dal livello di comportamento indicato in su. */
export interface RispostaVale {
  daComportamento: number;
  testo: string;
  /** Riga di sistema aggiuntiva (spesso con un codice nascosto). */
  log?: { testo: string; codici: string[] };
  /** v3.9: vale solo se la scoperta è nel registro (es. il segnale già rilevato)… */
  seScoperta?: IdScoperta;
  /** …o solo se NON lo è. */
  senzaScoperta?: IdScoperta;
}

/** I testi di un tono (v3.9). */
export interface TestiTono {
  nome: string;
  /** Cosa cambia, in una riga: la mostra l'interfaccia. */
  descrizione: string;
  /**
   * Come V.A.L.E. apre la risposta a questo tono: `disponibile` quando è
   * collaborativa (comportamento 0–2), `fredda` quando è in tensione (3–5).
   * Vuote = nessuna apertura.
   */
  cornice: { disponibile: string[]; fredda: string[] };
}

/** Testi di V.A.L.E. che il motore usa ma che appartengono al contenuto. */
export interface TestiVale {
  /**
   * Per ogni domanda: l'etichetta del pulsante, le risposte (per livello di
   * comportamento) e la tensione che la domanda aggiunge (es. un'accusa).
   * Nelle risposte si possono usare {DANNI}, {CREW}, {OSSIGENO}: il motore
   * li sostituisce con i dati veri.
   */
  domande: Record<
    DomandaVale,
    {
      etichetta: string;
      risposte: RispostaVale[];
      tensione?: number;
      /** Come il Capitano pone la domanda in ogni tono (v3.9). Manca → l'etichetta. */
      capitano?: Partial<Record<TonoCapitano, string>>;
    }
  >;
  /** I cinque toni del Capitano (v3.9). */
  toni: Record<TonoCapitano, TestiTono>;
  /** Le scuse del Capitano (v3.9): accettate, inutili (niente tensione), troppo presto. */
  scusa: { accettata: string; inutile: string; troppoPresto: string };
  /**
   * Righe di sistema in cui compare un codice CASUALE (v3.9): {CODICE} è
   * il codice, {HEX} un numero esadecimale di riempimento.
   */
  codiceCasuale: string[];
  /** Con il tono ARRABBIATO V.A.L.E. a volte "si incrina": riga con un codice. */
  crepa: string;
  /** Con il tono SOSPETTOSO: riga di verifica incrociata ({N} = concordanza %). */
  verificaIncrociata: string;
  /** Parole che fanno riconoscere una domanda scritta a mano (minuscole, senza accenti). */
  paroleChiave: Record<DomandaVale, string[]>;
  /** Quando V.A.L.E. non riconosce il testo libero. */
  nonCapito: string;
  /** Quando V.A.L.E. rifiuta un task contrario alla direttiva. */
  rifiuto: { vale: string; sistema: string; codici: string[] };
  /** Risposta quando il Capitano contesta una sua affermazione. */
  contestazione: RispostaVale[];
  verifica: { smentita: string; confermata: string; inconclusiva: string };
  override: string[];
}
