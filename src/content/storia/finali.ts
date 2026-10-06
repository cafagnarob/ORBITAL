/**
 * ============================================================================
 * finali.ts — I modi in cui può finire la missione su E-17
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §15 (finali), §10.2.
 *
 * Il motore (engine/storia/fine.ts) prende la CAUSA della fine e sceglie
 * il primo finale compatibile, in ordine di PRIORITÀ, le cui condizioni
 * sono vere. Le condizioni sono le stesse degli eventi: scoperte, fazioni,
 * override, morti… Così il racconto finale riflette la partita giocata.
 *
 * Segnaposto nel testo: {VIVI}, {MORTI}, {GIORNI}.
 * Nell'epilogo la direttiva di V.A.L.E. viene SEMPRE rivelata (dalla UI):
 * anche chi non l'ha scoperta deve sapere con chi ha viaggiato.
 * ============================================================================
 */

import type { DefinizioneFinale, IdFinale } from "../../engine/types";

const LISTA_FINALI: DefinizioneFinale[] = [
  // --- MORTE -------------------------------------------------------------------
  {
    id: "SILENZIO",
    titolo: "Silenzio",
    cause: ["MORTE"],
    condizioni: [],
    priorita: 0,
    tono: "critico",
    testo:
      "Al giorno {GIORNI} nessuno risponde più all'appello. V.A.L.E. continua a compilare il rapporto serale, ogni sera alle 22:00, per una nave vuota. Il segnale di E-17 continua a trasmettere. Adesso, qualcuno lo ascolta.",
  },

  // --- CONTROLLO DI V.A.L.E. ---------------------------------------------------
  {
    id: "NAVE_DI_VALE",
    titolo: "Rimani in stazione",
    cause: ["CONTROLLO_VALE"],
    condizioni: [],
    priorita: 0,
    tono: "critico",
    testo:
      "V.A.L.E. ha preso il controllo della navigazione. «La partenza comprometterebbe la continuità dell'osservazione.» La nave resta in orbita attorno a E-17. A bordo: {VIVI}. Le scorte finiranno prima della sua missione.",
  },

  // --- DERIVA ------------------------------------------------------------------
  {
    id: "ALLA_DERIVA",
    titolo: "Alla deriva",
    cause: ["DERIVA"],
    condizioni: [],
    priorita: 0,
    tono: "critico",
    testo:
      "I motori si accendono, poi tossiscono. Il carburante non basta per la traiettoria di rientro. La nave scivola su un'orbita lunga, lontana da E-17 e lontana da casa. {VIVI} aspettano un soccorso che forse non arriverà.",
  },

  // --- RIENTRO -----------------------------------------------------------------
  {
    id: "AMMUTINAMENTO",
    titolo: "A mani nude",
    cause: ["RIENTRO"],
    condizioni: [{ tipo: "SCOPERTA", id: "VALE_SPENTA" }],
    priorita: 40,
    tono: "attenzione",
    testo:
      "Con V.A.L.E. spenta, la nave torna a casa pilotata a mano, tra allarmi muti e calcoli fatti su carta. Rientrano {VIVI}. La commissione d'inchiesta vorrà sapere perché un equipaggio ha disattivato la propria AI. Avrete una risposta?",
  },
  {
    id: "RIENTRO_CON_LA_VERITA",
    titolo: "La verità a bordo",
    cause: ["RIENTRO"],
    condizioni: [{ tipo: "SCOPERTA", id: "DIRETTIVA_RIVELATA" }],
    priorita: 30,
    tono: "normale",
    testo:
      "Rientrano {VIVI}, e con loro la prova: la direttiva nascosta di V.A.L.E., estratta dal suo stesso terminale. Qualcuno, sulla Terra, sapeva cosa c'era su E-17 prima della partenza. Adesso lo sapete anche voi.",
  },
  {
    id: "RIENTRO_CON_IL_SEGNALE",
    titolo: "Il segnale",
    cause: ["RIENTRO"],
    condizioni: [{ tipo: "SCOPERTA", id: "SEGNALE_SORGENTE" }],
    priorita: 20,
    tono: "normale",
    testo:
      "Rientrano {VIVI} con le coordinate della sorgente del segnale nel Cratere Settentrionale. Non sapete cosa sia. Non sapete cosa volesse V.A.L.E. Ma sapete dove tornare.",
  },
  {
    id: "RIENTRO_COI_DUBBI",
    titolo: "Domande senza risposta",
    cause: ["RIENTRO"],
    condizioni: [{ tipo: "SCOPERTA", id: "SEGNALE_RILEVATO" }],
    priorita: 10,
    tono: "attenzione",
    testo:
      "Rientrano {VIVI}. Avete sentito il segnale, avete dubitato di V.A.L.E., ma non avete prove di niente. Nel rapporto ufficiale, E-17 resta un pianeta arido e silenzioso. Voi sapete che non è vero.",
  },
  {
    id: "RIENTRO_A_MANI_VUOTE",
    titolo: "A mani vuote",
    cause: ["RIENTRO"],
    condizioni: [],
    priorita: 0,
    tono: "attenzione",
    testo:
      "Rientrano {VIVI} dopo {GIORNI} giorni in orbita. Nessuna scoperta, nessuna anomalia nei rapporti di V.A.L.E. La missione è archiviata come «senza esito». V.A.L.E. vi augura buon rientro. Sembra quasi sollevata.",
  },
];

export const CATALOGO_FINALI: Readonly<Record<IdFinale, DefinizioneFinale>> = Object.fromEntries(
  LISTA_FINALI.map((f) => [f.id, f]),
);
