/**
 * ============================================================================
 * scoperte.ts — Catalogo delle scoperte possibili su E-17 (vertical slice)
 * ============================================================================
 *
 * Il motore conosce solo gli ID ("SEGNALE_RILEVATO"); qui ci sono titolo e
 * descrizione che il giocatore legge nel Registro delle scoperte.
 *
 * Ogni descrizione dice ciò che la crew SA, non ciò che è VERO: nessuna
 * scoperta spiega il mistero, ne aggiunge solo un pezzo.
 * ============================================================================
 */

import type { IdScoperta } from "../engine/types";

export interface DefinizioneScoperta {
  titolo: string;
  descrizione: string;
}

export const CATALOGO_SCOPERTE: Readonly<Record<IdScoperta, DefinizioneScoperta>> = {
  SEGNALE_RILEVATO: {
    titolo: "Segnale artificiale",
    descrizione: "Un segnale a bassa potenza proveniente dall'emisfero nord. Origine sconosciuta.",
  },
  SEGNALE_DIREZIONE: {
    titolo: "Direzione del segnale",
    descrizione: "Il drone ha triangolato la provenienza: area del Cratere Settentrionale.",
  },
  SEGNALE_SCOMPARSO: {
    titolo: "Segnale intermittente",
    descrizione: "Durante la notte il segnale è scomparso. I ricevitori risultavano nominali.",
  },
  SEGNALE_RIATTIVATO: {
    titolo: "Il segnale ritorna",
    descrizione: "Stessa frequenza, intensità superiore del 40%.",
  },
  SEGNALE_SCHEMA: {
    titolo: "Schema ripetitivo",
    descrizione: "Il segnale si ripete ogni 7,3 secondi. Non corrisponde a nessun protocollo noto.",
  },
  SEGNALE_SORGENTE: {
    titolo: "Sorgente localizzata",
    descrizione: "Cratere Settentrionale, settore 7. Circa quaranta metri sotto la superficie.",
  },
  GEOMETRIA_REGOLARE: {
    titolo: "Geometria regolare",
    descrizione: "Sotto il fondo del cratere la scansione mostra linee rette e angoli di 90°.",
  },
  OBIETTIVO_DISCESA: {
    titolo: "Obiettivo di discesa",
    descrizione: "Il Capitano ha indicato il cratere come zona d'interesse per l'atterraggio.",
  },
};
