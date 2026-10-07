/**
 * ============================================================================
 * indispensabile.ts — L'attrezzatura senza cui la missione è impossibile (v3.7)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.6.
 *
 * La nave parte VUOTA: è il Capitano a riempirla. Il tasto «Carica
 * l'indispensabile» aggiunge SOLO i moduli e l'equipaggiamento richiesti
 * dai task obbligatori della missione (la scaletta: calibrazione,
 * correzione, antenna, scansione). Niente crew, niente scorte: quelle sono
 * scelte del Capitano.
 *
 * Funzione pura: riceve gli ID dei task obbligatori (dal contenuto) e il
 * catalogo, restituisce le liste. Così il motore non dipende da content/.
 * ============================================================================
 */

import type { CataloghiPreparazione, IdDefinizioneTask, IdEquipaggiamento, IdModulo, Preparazione } from "../types";

export interface Indispensabile {
  moduli: IdModulo[];
  equipaggiamento: IdEquipaggiamento[];
}

/** Moduli ed equipaggiamento richiesti dai task indicati (senza doppioni). */
export function attrezzaturaIndispensabile(tasks: readonly IdDefinizioneTask[], cat: CataloghiPreparazione): Indispensabile {
  const moduli = new Set<IdModulo>();
  const equipaggiamento = new Set<IdEquipaggiamento>();
  for (const id of tasks) {
    const def = cat.task[id];
    def?.moduliRichiesti.forEach((m) => moduli.add(m));
    def?.equipaggiamentoRichiesto.forEach((e) => equipaggiamento.add(e));
  }
  return { moduli: [...moduli], equipaggiamento: [...equipaggiamento] };
}

/** Cosa manca ancora alla preparazione, dell'indispensabile. */
export function indispensabileMancante(prep: Preparazione, ind: Indispensabile): string[] {
  return [
    ...ind.moduli.filter((m) => !prep.moduli.includes(m)),
    ...ind.equipaggiamento.filter((e) => !prep.equipaggiamento.includes(e)),
  ];
}
