/**
 * ============================================================================
 * storia/index.ts — I contenuti della storia emergente, tutti insieme
 * ============================================================================
 *
 * CONTENUTI_STORIA entra nel contesto della missione (content/contesto.ts):
 * il motore lo riceve come i cataloghi di task ed eventi, senza importarlo.
 * Gli eventi narrativi invece si uniscono al catalogo degli eventi
 * (content/eventi.ts): per il motore sono eventi come gli altri.
 * ============================================================================
 */

import type { ContenutiStoria } from "../../engine/types";
import { BATTUTE } from "./battute";
import { DIARIO_VUOTO, EPILOGHI_CREW } from "./diario";
import { CATALOGO_FINALI } from "./finali";
import { TESTI_COLLOQUI } from "./colloqui";

export const CONTENUTI_STORIA: ContenutiStoria = {
  finali: CATALOGO_FINALI,
  battute: BATTUTE,
  diarioVuoto: DIARIO_VUOTO,
  epiloghiCrew: EPILOGHI_CREW,
  colloqui: TESTI_COLLOQUI,
};

export { EVENTI_STORIA } from "./eventi";
export { LISTA_IMPREVISTI } from "./imprevisti";
