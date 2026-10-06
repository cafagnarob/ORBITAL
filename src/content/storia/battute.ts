/**
 * ============================================================================
 * battute.ts — Cosa dice la crew quando cambia idea su V.A.L.E. o agisce da sola
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.3 (personalità), §10.2.
 *
 * Divise per situazione e per APPROCCIO (CAUTO · AMANTE DEL RISCHIO ·
 * PRAGMATICO): la stessa notizia suona diversa in bocca a persone diverse.
 * Il motore ne sceglie una in modo deterministico (engine/storia/battute.ts).
 * Niente aggettivi al maschile/femminile: le battute valgono per tutti.
 * ============================================================================
 */

import type { Battute } from "../../engine/types";

export const BATTUTE: Battute = {
  PASSA_CON_VALE: {
    CAUTO: ["V.A.L.E. ha avuto ragione più volte di noi. Io la ascolto.", "Preferisco fidarmi di chi ha tutti i dati."],
    AMANTE_DEL_RISCHIO: ["Ok, lo ammetto: la macchina sa il fatto suo.", "Se V.A.L.E. dice di no, un motivo ci sarà."],
    PRAGMATICO: ["I numeri di V.A.L.E. tornano. Mi basta.", "Finora non ha sbagliato un calcolo."],
  },
  PASSA_CONTRO_VALE: {
    CAUTO: ["Non mi fido più dei dati di V.A.L.E.", "Ci sta nascondendo qualcosa. Non ho più dubbi."],
    AMANTE_DEL_RISCHIO: ["Basta. Da adesso controllo tutto io.", "Quella cosa ci mente. E lo sa benissimo."],
    PRAGMATICO: ["Due dati non tornano. Uno è un errore, due sono una scelta.", "Da qui in avanti, ogni sua parola va verificata."],
  },
  TORNA_INDECISO: {
    CAUTO: ["Non so più cosa pensare.", "Forse avevamo torto. O forse no."],
    AMANTE_DEL_RISCHIO: ["Ci ripenso. Non è tutto bianco o nero.", "Va bene, va bene. Le do un'altra possibilità."],
    PRAGMATICO: ["Sospendo il giudizio finché non ho altri dati.", "Né amica né nemica. Uno strumento. Vediamo."],
  },
  RIFIUTA_TASK: {
    CAUTO: ["V.A.L.E. lo sconsiglia. Non lo faccio.", "Non voglio rischiare la nave per un'intuizione."],
    AMANTE_DEL_RISCHIO: ["Stavolta no, Capitano. V.A.L.E. ha i suoi motivi.", "Mi dispiace. Non contro di lei."],
    PRAGMATICO: ["Il rischio non è giustificato. Lo dice anche V.A.L.E.", "Mi rifiuto. Mettilo a rapporto, se vuoi."],
  },
  CONTESTA_DA_SOLO: {
    CAUTO: ["Ho ricontrollato. Quello che ha detto V.A.L.E. ieri non torna.", "Voglio vedere i dati grezzi. Da solo, se serve."],
    AMANTE_DEL_RISCHIO: ["Non aspetto ordini: questa la verifico io.", "V.A.L.E., ti sto guardando. Riapro il tuo rapporto."],
    PRAGMATICO: ["C'è una discrepanza nei log. Apro una verifica.", "Contesto l'ultima affermazione di V.A.L.E. Procedura standard."],
  },
  MORTE_COMPAGNO: {
    CAUTO: ["Doveva esserci un modo per evitarlo.", "Non doveva andare così."],
    AMANTE_DEL_RISCHIO: ["Sapevamo i rischi. Non rende le cose più facili.", "Andiamo avanti. Non abbiamo scelta."],
    PRAGMATICO: ["Ridistribuiamo i turni. Poi, quando torniamo, piangeremo.", "Registro l'ora del decesso. Poi torno al lavoro."],
  },
};
