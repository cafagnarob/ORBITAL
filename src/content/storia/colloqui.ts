/**
 * ============================================================================
 * colloqui.ts — Cosa risponde la crew ai discorsi del Capitano (v3.4)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.8. Il motore (engine/storia/colloqui.ts)
 * decide SE il discorso convince; qui ci sono solo le parole.
 * Frasi al neutro: valgono per chiunque della crew.
 * ============================================================================
 */

import type { TestiColloqui } from "../../engine/types";

export const TESTI_COLLOQUI: TestiColloqui = {
  DIFENDI_VALE: {
    CONVINTO: [
      "Va bene, Capitano. Se lei si fida, ci provo anch'io.",
      "Ha ragione: senza V.A.L.E. non saremmo nemmeno arrivati in orbita.",
      "D'accordo. Le darò un'altra possibilità.",
      "Forse sono solo stanco di sospettare di tutto.",
    ],
    RESPINTO: [
      "Con tutto il rispetto, Capitano: lei non ha visto quello che ho visto io.",
      "Fidarmi? È esattamente quello che vuole che facciamo.",
      "Me lo dice lei o ve l'ha suggerito V.A.L.E.?",
      "No. E la prego di non insistere.",
    ],
  },
  DUBITA_VALE: {
    CONVINTO: [
      "Anch'io ho notato qualcosa. Non ne avevo parlato con nessuno.",
      "Ora che lo dice… i suoi rapporti sono un po' troppo puliti.",
      "Terrò gli occhi aperti. E il registro sotto mano.",
      "Ha ragione. Chi controlla chi controlla la nave?",
    ],
    RESPINTO: [
      "V.A.L.E. ci tiene in vita ogni minuto. Lei cosa ha fatto, oggi?",
      "Questa è paranoia, Capitano. Dovrebbe riposare.",
      "Non partecipo a questa caccia alle streghe.",
      "Se V.A.L.E. volesse farci del male, l'avrebbe già fatto.",
    ],
  },
  INCORAGGIA: {
    CONVINTO: [
      "Grazie, Capitano. Ne avevo bisogno.",
      "Un giorno alla volta. Ce la facciamo.",
      "Va meglio. Davvero.",
      "Torno al lavoro. Con un po' più di fiato.",
    ],
    RESPINTO: [
      "Le parole non riempiono lo stomaco, Capitano.",
      "Lo so, lo so. Mi lasci solo un momento.",
      "Apprezzo. Ma sono a pezzi lo stesso.",
      "Mi dica qualcosa che non so.",
    ],
  },
};
