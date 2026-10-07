/**
 * ============================================================================
 * briefing.ts — L'ordine di missione letto prima della Preparazione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.4 (contratti di missione), §16.5.3.
 *
 * Testi e dati del briefing: la schermata (ui/briefing) li impagina e basta.
 * Gli OBIETTIVI e gli ESITI devono restare coerenti con i finali veri
 * (content/storia/finali.ts): se cambi un finale, controlla anche qui.
 * Niente spoiler: si dice COSA conta, non COME ci si arriva.
 * ============================================================================
 */

export interface VoceScheda {
  etichetta: string;
  valore: string;
}

export interface Obiettivo {
  tipo: "PRINCIPALE" | "SECONDARIO" | "RISERVATO";
  testo: string;
}

export interface EsitoPossibile {
  stelle: 0 | 1 | 2 | 3;
  titolo: string;
  testo: string;
}

export const BRIEFING = {
  mittente: "AGENZIA DI ESPLORAZIONE ORBITALE · DIREZIONE MISSIONI",
  protocollo: "ORDINE DI MISSIONE N. 0417 · RIF. ORB-1 / E-17",
  titolo: "Ricognizione orbitale di E-17",

  scheda: [
    { etichetta: "TIPO", valore: "Scientifica · ricognizione" },
    { etichetta: "PIANETA", valore: "E-17 · arido, atmosfera sottile, radiazioni moderate" },
    { etichetta: "POSIZIONE", valore: "Orbita bassa sopra il Cratere Settentrionale" },
    { etichetta: "DURATA", valore: "10 giorni · poi si chiude la finestra di rientro" },
    { etichetta: "EQUIPAGGIO", valore: "4 persone, scelte dal Capitano" },
    { etichetta: "NAVE", valore: "ORB-1 · assistente di bordo V.A.L.E. modello 7" },
    { etichetta: "RISCHIO STIMATO", valore: "Moderato" },
  ] satisfies VoceScheda[],

  contesto: [
    "Novanta giorni fa la sonda automatica SR-9 ha registrato anomalie elettromagnetiche sopra il Cratere Settentrionale di E-17. Undici ore dopo ha smesso di trasmettere.",
    "Siete il primo equipaggio umano inviato a capire cosa succede laggiù. Non atterrerete: lavorerete dall'orbita, con quello che porterete a bordo.",
  ],

  obiettivi: [
    { tipo: "PRINCIPALE", testo: "Indagare le anomalie del Cratere Settentrionale e localizzarne l'origine." },
    { tipo: "PRINCIPALE", testo: "Riportare a casa l'equipaggio entro il giorno 10, senza intaccare la riserva di carburante per il rientro." },
    { tipo: "SECONDARIO", testo: "Tenere in efficienza nave e crew: scorte, salute, sistemi." },
    { tipo: "RISERVATO", testo: "Direttiva interna di V.A.L.E. · ACCESSO NEGATO" },
  ] satisfies Obiettivo[],

  obiettivoFinale:
    "Tornare sulla Terra con delle risposte. Più verità riporterete a casa, migliore sarà l'esito della missione. Ma tornare vivi viene prima di tutto.",

  esiti: [
    { stelle: 3, titolo: "Rientro con le prove", testo: "L'origine delle anomalie, o la verità su chi vi ha mandato quassù." },
    { stelle: 2, titolo: "Rientro con i dubbi", testo: "Avete visto qualcosa, ma non potete dimostrarlo." },
    { stelle: 1, titolo: "Rientro a mani vuote", testo: "Missione archiviata «senza esito»." },
    { stelle: 0, titolo: "Missione perduta", testo: "La nave alla deriva, l'equipaggio perduto, o il comando in mani non vostre." },
  ] satisfies EsitoPossibile[],

  comeSiGioca: [
    "06:00 · Pianifichi i task della crew. Poi le operazioni scorrono da sole: una giornata dura 5 minuti. Puoi mettere in pausa o saltare al prossimo evento.",
    "22:00 · Rapporto serale: decidi chi mangia e chi beve. Chi ha fame o sete lavora meno, si stanca di più e diventa paranoico.",
    "V.A.L.E. vi assiste. Non sempre vi dice tutto: contesta ciò che non ti convince, fallo verificare, cerca i codici nel log per il Terminale SVC-07.",
    "Parla con la crew: quello che pensano di V.A.L.E. deciderà da che parte staranno quando servirà.",
  ],

  domanda: "Accetta l'incarico, Capitano?",
} as const;
