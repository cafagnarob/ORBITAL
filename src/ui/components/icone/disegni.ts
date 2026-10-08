/**
 * ============================================================================
 * disegni.ts — I disegni delle icone di ORBITAL (solo dati)
 * ============================================================================
 *
 * Un'icona = una lista di tracciati SVG in un quadrato 24×24, disegnati con
 * un tratto solo (niente riempimenti): così prendono il colore del testo
 * intorno (currentColor) e stanno bene con i fosfori verdi, l'ambra e il
 * rosso. Il componente che le disegna è Icona.tsx.
 *
 * UNA SOLA FONTE
 * Ogni risorsa ha UNA icona, usata in tutto il gioco (stiva, nave,
 * riepilogo, risorse di missione, razioni, costi e rese). Se vuoi cambiare
 * il disegno del cibo, lo cambi qui e cambia ovunque.
 *
 * Per aggiungerne una: un nuovo nome in TIPI_ICONA e i suoi tracciati in
 * DISEGNI (il "d" degli elementi <path>, coordinate da 0 a 24).
 * ============================================================================
 */

export const TIPI_ICONA = [
  "cibo",
  "acqua",
  "ossigeno",
  "energia",
  "carburante",
  "medicine",
  "ricambi",
  "batteria",
  "ricerca",
] as const;
export type TipoIcona = (typeof TIPI_ICONA)[number];

export const DISEGNI: Record<TipoIcona, readonly string[]> = {
  // Forchetta e coltello.
  cibo: ["M6 3 V8 A2 2 0 0 0 10 8 V3", "M8 3 V21", "M17 3 C14.5 6 14.5 10.5 17 12.5 V21", "M17 3 V12.5"],
  // Una goccia, con un riflesso.
  acqua: ["M12 3 C8.5 8.5 6 11.8 6 15 A6 6 0 0 0 18 15 C18 11.8 15.5 8.5 12 3 Z", "M9.2 15.5 A3 3 0 0 0 12 18.2"],
  // Bombola con valvola e fascia.
  ossigeno: ["M8.5 9 A3.5 3.5 0 0 1 15.5 9 V20 A1 1 0 0 1 14.5 21 H9.5 A1 1 0 0 1 8.5 20 Z", "M10.5 5.5 V3 H13.5 V5.5", "M13.5 4 H17", "M8.5 12.5 H15.5"],
  // Fulmine.
  energia: ["M13.5 2.5 L5.5 13.5 H11 L10 21.5 L18.5 10 H13 Z"],
  // Tanica, con la X sul fianco.
  carburante: ["M5.5 7 H15 L18.5 10.5 V21 H5.5 Z", "M8 3.5 H12.5 V7", "M9 13 L15 19", "M15 13 L9 19"],
  // Cassetta del pronto soccorso.
  medicine: ["M3.5 7.5 H20.5 V19.5 H3.5 Z", "M9 7.5 V4.5 H15 V7.5", "M12 10.5 V16.5", "M9 13.5 H15"],
  // Chiave inglese.
  ricambi: [
    "M15 3.5 A5 5 0 0 0 10.6 10.9 L3.5 18 L6 20.5 L13.1 13.4 A5 5 0 0 0 20.5 9 L17.3 12.2 L14.4 11.6 L13.8 8.7 L17 5.5 A5 5 0 0 0 15 3.5 Z",
  ],
  // Cella di batteria con tre tacche di carica.
  batteria: ["M3 7.5 H18.5 V16.5 H3 Z", "M18.5 10 H21 V14 H18.5", "M6.5 10.5 V13.5", "M10 10.5 V13.5", "M13.5 10.5 V13.5"],
  // Beuta da laboratorio.
  ricerca: ["M9 3 H15", "M10 3 V9.5 L4.8 18.8 A1.5 1.5 0 0 0 6.1 21 H17.9 A1.5 1.5 0 0 0 19.2 18.8 L14 9.5 V3", "M7.2 15 H16.8"],
};
