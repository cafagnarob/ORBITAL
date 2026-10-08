/**
 * ============================================================================
 * scoperte.ts — Catalogo delle scoperte possibili (tutte le supermissioni)
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
    descrizione: "Un segnale a bassa potenza, a 1,42 GHz, che viene dal bersaglio della missione. Origine sconosciuta.",
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
    descrizione: "Il punto esatto da cui parte il segnale. Ovunque sia, risponde allo stesso protocollo di V.A.L.E.",
  },
  GEOMETRIA_REGOLARE: {
    titolo: "Geometria regolare",
    descrizione: "Sotto il fondo del cratere la scansione mostra linee rette e angoli di 90°.",
  },
  PROTOCOLLO_P7: {
    titolo: "Protocollo VL-P7-04",
    descrizione: "Un protocollo di osservazione prioritaria attivato da V.A.L.E. Origine dell'istruzione non documentata.",
  },
  RIFERIMENTO_DIRETTIVA: {
    titolo: "Riferimento VL-D7-X",
    descrizione: "Un riferimento interno di classe DIRETTIVA. Il contenuto richiede un accesso più alto.",
  },
  MEMORIA_KESTREL: {
    titolo: "Memoria MEM-12",
    descrizione: "Un registro sigillato nella memoria di V.A.L.E. Riferimento: missione KESTREL-4.",
  },
  DIRETTIVA_RIVELATA: {
    titolo: "Direttiva di V.A.L.E.",
    descrizione: "Il terminale SVC-07 ha rivelato la direttiva interna di V.A.L.E.",
  },
  OBIETTIVO_DISCESA: {
    titolo: "Obiettivo di discesa",
    descrizione: "Il Capitano ha indicato il cratere come zona d'interesse per l'atterraggio.",
  },
  // --- La super-missione (v3.7) ------------------------------------------------
  AREA_ACQUISITA: {
    titolo: "Area d'interesse acquisita",
    descrizione: "La scansione profonda ha registrato il punto del cratere da cui partono le anomalie.",
  },
  REGISTRO_SR9: {
    titolo: "Il registro della SR-9",
    descrizione: "L'ultimo pacchetto della sonda: una richiesta di contatto da un'origine sconosciuta, poi il silenzio.",
  },
  // --- Le supermissioni (v3.8) -------------------------------------------------
  OBIETTIVO_PRIMARIO: {
    titolo: "Obiettivo primario conseguito",
    descrizione: "Quello per cui l'agenzia ci ha mandati è a bordo. Ora bisogna riportarlo a casa.",
  },
  SCATOLA_ARGO: {
    titolo: "La scatola nera di Argo-3",
    descrizione: "Quaranta giorni di registri della stazione. L'ultimo pacchetto è a 1,42 GHz.",
  },
  CAROTA_HK7: {
    titolo: "Il nucleo di HK-7",
    descrizione: "Tre metri di carota. Quando l'abbiamo toccata, i ricevitori hanno fischiato.",
  },
  PENETRATORE_HALVOR: {
    titolo: "Il penetratore nel nucleo di Halvor",
    descrizione: "Trasmette da quaranta metri sotto il ghiaccio. Sotto di lui, qualcosa batte.",
  },
  NUCLEO_KESTREL: {
    titolo: "Il nucleo della Kestrel-4",
    descrizione: "La memoria del prototipo di V.A.L.E. È ancora accesa, e trasmette.",
  },
  // --- Storia emergente (v3.0) ------------------------------------------------
  BLOCCO_VALE: {
    titolo: "Porte chiuse",
    descrizione: "V.A.L.E. può chiudere i compartimenti della nave. Lo ha già fatto.",
  },
  COMPLOTTO: {
    titolo: "Il piano",
    descrizione: "Una parte della crew vuole isolare V.A.L.E. dalle comunicazioni.",
  },
  VALE_SPENTA: {
    titolo: "V.A.L.E. spenta",
    descrizione: "Il nucleo di V.A.L.E. è stato disattivato dall'equipaggio. La nave si pilota a mano.",
  },
};
