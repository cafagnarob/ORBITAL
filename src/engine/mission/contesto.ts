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
 * In futuro qui arriveranno anche eventi, direttive e pianeta.
 * ============================================================================
 */

import type { DefinizioneTask, IdDefinizioneTask } from "../types"

export interface ContestoMissione {
  catalogoTask: Readonly<Record<IdDefinizioneTask, DefinizioneTask>>
}
