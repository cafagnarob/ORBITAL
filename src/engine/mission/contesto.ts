/**
 * ============================================================================
 * contesto.ts — I dati di sola lettura di cui il reducer ha bisogno
 * ============================================================================
 *
 * COS'È IL CONTESTO
 * Il reducer deve conoscere il catalogo dei task (la "ricetta" di ogni
 * IstanzaTask). Il catalogo NON sta nello stato: non cambia mai e non va
 * salvato. Lo passiamo quindi come terzo parametro:
 *
 *   applicaAzione(stato, azione, contesto)
 *
 * PERCHÉ NON IMPORTARLO DIRETTAMENTE DA content/
 * Si chiama "iniezione delle dipendenze": chi chiama il reducer decide
 * quale catalogo usare. Il gioco passerà quello vero di content/; i test
 * passano un piccolo catalogo di prova, così non si rompono ogni volta che
 * aggiungi o modifichi un task nel gioco.
 *
 * In futuro qui arriverà anche il pianeta.
 * ============================================================================
 */

import type {
  ContenutiStoria,
  DefinizioneCodice,
  DefinizioneDirettiva,
  DefinizioneEvento,
  DefinizioneMissione,
  DefinizioneModulo,
  DefinizioneTask,
  IdDefinizioneTask,
  IdDirettiva,
  IdEvento,
  IdMissione,
  IdModulo,
  TestiVale,
} from "../types";

export interface ContestoMissione {
  catalogoTask: Readonly<Record<IdDefinizioneTask, DefinizioneTask>>;
  catalogoEventi: Readonly<Record<IdEvento, DefinizioneEvento>>;
  /** Codici validi del Terminale SVC-07, indicizzati per codice. */
  catalogoCodici: Readonly<Record<string, DefinizioneCodice>>;
  /** Direttive possibili di V.A.L.E. */
  catalogoDirettive: Readonly<Record<IdDirettiva, DefinizioneDirettiva>>;
  /** Le frasi di V.A.L.E. usate dal motore (domande, rifiuti, contestazioni). */
  testiVale: TestiVale;
  /** Moduli della nave: i loro effetti cambiano energia, scorte, fatica… */
  catalogoModuli: Readonly<Record<IdModulo, DefinizioneModulo>>;
  /** La storia emergente (v3.0): finali, battute della crew, frasi del diario. */
  storia: ContenutiStoria;
  /**
   * Le supermissioni (v3.8), per id. La partita usa quella del suo piano
   * (stato.missione.id): obiettivi, scaletta, nomi.
   */
  missioni: Readonly<Record<IdMissione, DefinizioneMissione>>;
}
