/**
 * ============================================================================
 * eventiDiProva.ts — Eventi costruiti apposta per testare il motore
 * ============================================================================
 *
 * Indipendenti dal contenuto vero (content/eventi.ts): servono a provare
 * ogni meccanismo in modo prevedibile. Per questo usano soglie di esito
 * larghissime (qualsiasi esito va bene), così non dipendono dai tiri.
 * ============================================================================
 */

import type { ContestoMissione } from "../../src/engine/mission";
import type { DefinizioneEvento } from "../../src/engine/types";
import { CONTESTO_DI_PROVA } from "./taskDiProva";

/** Base comune: si sovrascrive solo ciò che serve. */
function evento(dati: Partial<DefinizioneEvento> & Pick<DefinizioneEvento, "id">): DefinizioneEvento {
  return {
    titolo: dati.id,
    categoria: "NARRATIVO",
    priorita: "NORMALE",
    unaVolta: true,
    probabilita: 1,
    peso: 10,
    condizioni: [],
    fonte: "VALE",
    testo: `Evento ${dati.id}`,
    codici: [],
    effetti: [],
    scelte: [],
    ...dati,
  };
}

/** Con scelte: scatta alla fine di QUALSIASI diagnostica (anche fallita). */
export const EV_DECISIONE = evento({
  id: "T-DEC",
  priorita: "IMPORTANTE",
  condizioni: [
    { tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA" },
    { tipo: "NON_SCOPERTA", id: "INDIZIO" },
  ],
  effetti: [{ tipo: "FATICA", chi: "RESPONSABILE", delta: 5 }],
  scelte: [
    {
      id: "PRENDI",
      etichetta: "Prendi",
      requisiti: [],
      effetti: [
        { tipo: "SCOPERTA", id: "INDIZIO" },
        { tipo: "RISORSA", risorsa: "energia", delta: -10 },
      ],
    },
    { id: "LASCIA", etichetta: "Lascia", requisiti: [], effetti: [] },
    {
      id: "TRIVELLA",
      etichetta: "Usa la trivella",
      requisiti: [{ tipo: "EQUIPAGGIAMENTO", id: "TRIVELLA" }],
      effetti: [],
    },
  ],
});

/** Informativo: scatta al risveglio se si conosce l'indizio. */
export const EV_RISVEGLIO = evento({
  id: "T-RIS",
  condizioni: [
    { tipo: "MOMENTO", momento: "RISVEGLIO" },
    { tipo: "SCOPERTA", id: "INDIZIO" },
  ],
  effetti: [
    { tipo: "SCOPERTA", id: "SECONDO_INDIZIO" },
    { tipo: "SISTEMA", sistema: "SCIENZA", delta: -150 },
  ],
});

/** Ripetibile e di bassa priorità: perde sempre contro EV_DECISIONE. */
export const EV_SFONDO = evento({
  id: "T-SFONDO",
  priorita: "SFONDO",
  unaVolta: false,
  condizioni: [{ tipo: "TASK_CONCLUSO_ORA", tag: "DIAGNOSTICA" }],
  effetti: [{ tipo: "SCAFO", delta: -1 }],
});

export const CONTESTO_CON_EVENTI: ContestoMissione = {
  ...CONTESTO_DI_PROVA,
  catalogoEventi: {
    [EV_DECISIONE.id]: EV_DECISIONE,
    [EV_RISVEGLIO.id]: EV_RISVEGLIO,
    [EV_SFONDO.id]: EV_SFONDO,
  },
};
