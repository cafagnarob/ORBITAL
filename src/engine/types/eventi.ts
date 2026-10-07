/**
 * ============================================================================
 * eventi.ts — Tipi del sistema di eventi: condizioni, effetti, scelte
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §10.
 *
 * L'IDEA: GLI EVENTI SONO DATI, NON CODICE
 * Un evento non è una funzione che "fa cose": è un oggetto che DESCRIVE
 * quando può accadere (condizioni), cosa cambia (effetti) e quali scelte
 * offre al Capitano. Il motore legge queste descrizioni e le applica.
 *
 * Perché così:
 *   - gli eventi si scrivono in content/ come semplici oggetti, senza
 *     toccare il motore (aggiungere E05 = aggiungere un oggetto);
 *   - sono serializzabili e testabili (si può controllare automaticamente
 *     che ogni evento citi solo scoperte che esistono);
 *   - il "linguaggio" è piccolo e chiuso: TypeScript segnala ogni errore.
 *
 * Le condizioni e gli effetti sono "union discriminate", come le azioni.
 * ============================================================================
 */

import type { IdDefinizioneTask, IdEquipaggiamento, IdEvento, IdMembro, IdModulo, IdScoperta, Minuti, Tag } from "./comuni";
import type { Ruolo, StatoMembro } from "./crew";
import type { FonteLog } from "./log";
import type { Compartimento, SistemaCore, StatoAccesso } from "./nave";
import type { Risorse } from "./risorse";
import type { CausaFine, EsitoCasuale, Fazione, SelettoreMembro } from "./storia";
import type { EsitoTask } from "./task";
import type { ClasseDirettiva, FiltroVale } from "./vale";

export const CATEGORIE_EVENTO = [
  "SISTEMA",
  "EQUIPAGGIO",
  "EVA",
  "SCIENTIFICO",
  "ESPLORAZIONE",
  "AMBIENTALE",
  "NARRATIVO",
  "VALE",
] as const;
export type CategoriaEvento = (typeof CATEGORIE_EVENTO)[number];

/** Dalla meno alla più importante: a parità di momento vince la più alta. */
export const PRIORITA_EVENTO = ["SFONDO", "NORMALE", "IMPORTANTE", "CRITICO"] as const;
export type PrioritaEvento = (typeof PRIORITA_EVENTO)[number];

// ----------------------------------------------------------------------------
// CONDIZIONI: "quando può accadere?"
// ----------------------------------------------------------------------------

export type Condizione =
  /**
   * In QUESTO momento si è appena concluso un task con questo tag.
   * esitoAlmeno: "SUCCESSO" vale per SUCCESSO e SUCCESSO_PERFETTO.
   * esitoAlPiu:  "FALLIMENTO" vale per FALLIMENTO e FALLIMENTO_CRITICO.
   */
  | { tipo: "TASK_CONCLUSO_ORA"; tag: Tag; esitoAlmeno?: EsitoTask; esitoAlPiu?: EsitoTask }
  /**
   * Siamo al rapporto serale, al risveglio o a un CAMBIO TURNO
   * (10:00, 13:00, 16:00, 19:00: gli eventi "durante la giornata", v3.3).
   */
  | { tipo: "MOMENTO"; momento: "RAPPORTO_SERALE" | "RISVEGLIO" | "TURNO" }
  /** La crew sa / non sa ancora una certa cosa. */
  | { tipo: "SCOPERTA"; id: IdScoperta }
  | { tipo: "NON_SCOPERTA"; id: IdScoperta }
  /** Un evento è già accaduto (eventualmente con una certa scelta). */
  | { tipo: "EVENTO_ACCADUTO"; id: IdEvento; scelta?: string }
  /** Un equipaggiamento è a bordo (tipico requisito di una scelta). */
  | { tipo: "EQUIPAGGIAMENTO"; id: IdEquipaggiamento }
  /** Almeno UNA delle condizioni interne è vera (le liste normali sono "tutte"). */
  | { tipo: "UNO_TRA"; condizioni: Condizione[] }
  /** La condizione interna è FALSA. */
  | { tipo: "NON"; condizione: Condizione }

  // --- Storia emergente (v3.0) ---------------------------------------------
  /** Siamo almeno al giorno indicato (il giorno 1 è il primo). */
  | { tipo: "GIORNO_ALMENO"; giorno: number }
  | { tipo: "TENSIONE_ALMENO"; valore: number }
  /** Autonomia di V.A.L.E. (0 ASSISTENZA … 4 AUTONOMA), derivata. */
  | { tipo: "AUTONOMIA_ALMENO"; livello: number }
  /** Almeno N membri vivi a bordo stanno in questa fazione. */
  | { tipo: "FAZIONE"; fazione: Fazione; almeno: number }
  | { tipo: "RISORSA_SOTTO"; risorsa: keyof Risorse; valore: number }
  | { tipo: "SISTEMA_SOTTO"; sistema: SistemaCore; valore: number }
  /** La classe della direttiva NASCOSTA: serve a scrivere eventi diversi per partite diverse. */
  | { tipo: "CLASSE_DIRETTIVA"; classi: ClasseDirettiva[] }
  /** C'è a bordo qualcuno vivo con questo ruolo. */
  | { tipo: "RUOLO_A_BORDO"; ruolo: Ruolo }
  /** Almeno un membro è in questo stato (es. FERITO). */
  | { tipo: "MEMBRO_IN_STATO"; stato: StatoMembro }
  /** V.A.L.E. è stata smentita almeno N volte da una verifica. */
  | { tipo: "SMENTITE_ALMENO"; n: number }
  /** L'override del nucleo (ORD-01) è attivo. */
  | { tipo: "OVERRIDE" }
  /** L'imprevisto di partenza di questa partita. */
  | { tipo: "IMPREVISTO"; id: string }
  /** V.A.L.E. ha bloccato almeno un compartimento. */
  | { tipo: "COMPARTIMENTO_BLOCCATO" }

  // --- Progressione dei task (v3.3) ---------------------------------------
  /** Un task è stato completato (con successo, anche parziale) almeno N volte. */
  | { tipo: "TASK_COMPLETATO"; task: IdDefinizioneTask; volte?: number }
  /** Un modulo è installato sulla nave. */
  | { tipo: "MODULO"; id: IdModulo }
  /**
   * Un evento è accaduto da MENO di `ore` ore (eventualmente con una certa
   * scelta). Serve ai task temporanei: «il meteorite resta a portata per 18 ore».
   */
  | { tipo: "EVENTO_RECENTE"; id: IdEvento; scelta?: string; ore: number };

// ----------------------------------------------------------------------------
// EFFETTI: "cosa cambia?"
// ----------------------------------------------------------------------------

export type Effetto =
  /** La crew scopre qualcosa: entra nella conoscenza. */
  | { tipo: "SCOPERTA"; id: IdScoperta }
  /** Variazione di una risorsa (negativa = costo). Mai sotto zero. */
  | { tipo: "RISORSA"; risorsa: keyof Risorse; delta: number }
  /** Variazione dell'integrità di un sistema, limitata a 0–100. */
  | { tipo: "SISTEMA"; sistema: SistemaCore; delta: number }
  /** Variazione dell'integrità dello scafo, limitata a 0–100. */
  | { tipo: "SCAFO"; delta: number }
  /** Variazione della fatica: del responsabile del task d'origine, dei protagonisti o di tutti. */
  | { tipo: "FATICA"; chi: Destinatario; delta: number }
  /** Una voce di log in più (con eventuali codici nascosti). */
  | { tipo: "LOG"; fonte: FonteLog; testo: string; codici?: string[] }
  /** Variazione della fiducia in V.A.L.E. di tutta la crew. */
  | { tipo: "FIDUCIA"; delta: number }
  /** Variazione della tensione tra V.A.L.E. e il Capitano. */
  | { tipo: "TENSIONE"; delta: number }
  /** Il terminale rivela la direttiva nascosta (codice DIR-07). */
  | { tipo: "RIVELA_DIRETTIVA" }
  /** Override del nucleo (codice ORD-01): l'autonomia di V.A.L.E. torna al minimo. */
  | { tipo: "OVERRIDE_VALE" }

  // --- Storia emergente (v3.0) ---------------------------------------------
  /** Fiducia in V.A.L.E. di un solo membro (protagonista o secondo). */
  | { tipo: "FIDUCIA_MEMBRO"; chi: "PROTAGONISTA" | "SECONDO"; delta: number }
  /** Salute (negativa = ferita). Aggiorna anche lo stato del membro. */
  | { tipo: "SALUTE"; chi: Destinatario; delta: number }
  /** V.A.L.E. (o la crew) cambia l'accesso a un compartimento. */
  | { tipo: "ACCESSO"; compartimento: Compartimento; stato: StatoAccesso }
  /** Tutti i compartimenti tornano APERTI. */
  | { tipo: "SBLOCCA_COMPARTIMENTI" }
  /** Il protagonista mette in coda un task di sua iniziativa. */
  | { tipo: "TASK_AUTONOMO"; chi: "PROTAGONISTA" | "SECONDO"; task: IdDefinizioneTask }
  /** Una riga in più nel giornale di bordo (con {P} e {S}). */
  | { tipo: "DIARIO"; testo: string }
  /** La missione finisce: il finale si sceglie tra quelli compatibili con la causa. */
  | { tipo: "FINE_MISSIONE"; causa: CausaFine };

/** Su chi agisce un effetto "personale". */
export type Destinatario = "RESPONSABILE" | "PROTAGONISTA" | "SECONDO" | "TUTTI";

// ----------------------------------------------------------------------------
// SCELTE ED EVENTI
// ----------------------------------------------------------------------------

/** Un'opzione offerta al Capitano. */
export interface SceltaEvento {
  /** Breve e stabile, es. "INDAGA": viene salvata nel registro. */
  id: string;
  /** Testo del pulsante. */
  etichetta: string;
  /** Se non sono tutte vere, la scelta è visibile ma non selezionabile. */
  requisiti: Condizione[];
  effetti: Effetto[];
  /** Riga del giornale di bordo quando il Capitano sceglie questa opzione. */
  diario?: string;
  /**
   * Esiti casuali (v3.0): dopo gli effetti fissi se ne estrae UNO, tra
   * quelli i cui requisiti sono veri, in base al peso. Vuoto = nessun caso.
   */
  esiti?: EsitoCasuale[];
}

export interface DefinizioneEvento {
  id: IdEvento;
  titolo: string;
  categoria: CategoriaEvento;
  priorita: PrioritaEvento;

  /** Se true, accade al massimo una volta per missione. */
  unaVolta: boolean;
  /** Probabilità (0–1) che accada quando le condizioni sono vere. */
  probabilita: number;
  /** Peso nella scelta tra eventi della stessa priorità (> 0). */
  peso: number;
  /** Devono essere TUTTE vere. */
  condizioni: Condizione[];

  /** Chi "parla" quando l'evento accade, e cosa dice. */
  fonte: FonteLog;
  testo: string;
  /** Codici nascosti nel messaggio (DESIGN §4.3). */
  codici: string[];

  /** Effetti applicati subito, quando l'evento accade. */
  effetti: Effetto[];
  /** Scelte per il Capitano. Vuoto = evento solo informativo. */
  scelte: SceltaEvento[];
  /** Come V.A.L.E. può filtrare questo evento, in base alla direttiva (Fase 3). */
  filtri?: FiltroVale[];

  // --- Storia emergente (v3.0) ---------------------------------------------
  /** Chi vive l'evento: i testi lo chiamano {P}. Nessun candidato = niente evento. */
  protagonista?: SelettoreMembro;
  /** Un secondo membro, diverso dal primo ({S}): litigi, alleanze. */
  secondo?: SelettoreMembro;
  /** Riga del giornale di bordo quando l'evento accade. */
  diario?: string;
}

/** Traccia di un evento accaduto, conservata nello stato. */
export interface RegistroEvento {
  id: IdEvento;
  tempo: Minuti;
  /** ID della scelta fatta, o null per gli eventi informativi. */
  scelta: string | null;
  /** Chi l'ha vissuto (v3.0); null negli eventi senza protagonista. */
  protagonista?: IdMembro | null;
  /** L'esito casuale uscito, se la scelta ne aveva. */
  esito?: string | null;
}
