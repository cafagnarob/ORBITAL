/**
 * ============================================================================
 * briefing.ts — L'ordine di missione letto prima della Preparazione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.4 (contratti di missione), §16.5.3.
 *
 * Testi e dati del briefing: la schermata (ui/briefing) li impagina e basta.
 *
 * v3.8 · SUPERMISSIONI: ogni missione ha il SUO ordine (protocollo, scheda,
 * contesto, cosa fare in ogni fase: content/missioni/<id>.ts). Qui restano
 * le parti COMUNI (mittente, esiti, come si gioca) e `briefingDi(piano)`,
 * che compone il fascicolo completo con i giorni decisi dal seed.
 * Gli OBIETTIVI e gli ESITI devono restare coerenti con i finali veri
 * (content/storia/finali.ts): se cambi un finale, controlla anche qui.
 * Niente spoiler: si dice COSA conta, non COME ci si arriva.
 * ============================================================================
 */

import { giorniTotali } from "../engine/storia/piano";
import type { PianoMissione, VoceSchedaBriefing } from "../engine/types";
import { definizioneMissione } from "./missioni";

export type VoceScheda = VoceSchedaBriefing;

export interface Obiettivo {
  tipo: "PRINCIPALE" | "SECONDARIO" | "RISERVATO";
  testo: string;
}

export interface EsitoPossibile {
  stelle: 0 | 1 | 2 | 3;
  titolo: string;
  testo: string;
}

/** Le parti uguali per tutte le missioni. */
export const BRIEFING_COMUNE = {
  mittente: "AGENZIA DI ESPLORAZIONE ORBITALE · DIREZIONE MISSIONI",

  esiti: [
    { stelle: 3, titolo: "Missione compiuta", testo: "Obiettivo primario conseguito e tutti a casa. O, meglio ancora, la verità su chi vi ha mandato quassù." },
    { stelle: 2, titolo: "Rientro con i dubbi", testo: "Avete visto qualcosa, ma non potete dimostrarlo." },
    { stelle: 1, titolo: "Rientro a mani vuote", testo: "Missione archiviata «senza esito»." },
    { stelle: 0, titolo: "Missione perduta", testo: "La nave alla deriva, l'equipaggio perduto, o il comando in mani non vostre." },
  ] satisfies EsitoPossibile[],

  comeSiGioca: [
    "La scaletta è nel pannello MISSIONE: alcuni preparativi «scadono», e se il passo finale fallisce vanno rifatti. Organizza bene i tempi.",
    "06:00 · Pianifichi i task della crew. Poi le operazioni scorrono da sole: una giornata dura 5 minuti. Puoi mettere in pausa o saltare al prossimo evento.",
    "22:00 · Rapporto serale: decidi chi mangia e chi beve. Chi ha fame o sete lavora meno, si stanca di più e diventa paranoico.",
    "V.A.L.E. vi assiste. Non sempre vi dice tutto: contesta ciò che non ti convince, fallo verificare, cerca i codici nel log per il Terminale SVC-07.",
    "Parla con la crew: quello che pensano di V.A.L.E. deciderà da che parte staranno quando servirà.",
    "Quando un task è rischioso puoi aiutare chi lo svolge con un minigioco: più giochi bene, meno rischia.",
  ],

  domanda: "Accetta l'incarico, Capitano?",
} as const;

/** Toglie il punto finale: la frase continua con i giorni tra parentesi. */
const senzaPunto = (t: string) => t.replace(/\.\s*$/, "");

/** "1 giorno" / "3 giorni". */
const giorni = (n: number) => `${n} ${n === 1 ? "giorno" : "giorni"}`;

/** Il fascicolo completo di una partita: la missione del piano, con i suoi giorni. */
export function briefingDi(piano: PianoMissione) {
  const m = definizioneMissione(piano.id);
  const { andata, orbita, rientro } = piano.durate;
  // La finestra di rientro si apre al risveglio del giorno dopo l'ultimo in orbita.
  const giornoFinestra = andata + orbita + 1;

  const scheda: VoceScheda[] = [
    ...m.briefing.scheda,
    {
      etichetta: "DURATA",
      valore: `${giorni(giorniTotali(piano))} · ${andata} di viaggio, ${orbita} sul posto, ${rientro} di rientro`,
    },
    { etichetta: "EQUIPAGGIO", valore: "4 persone, scelte dal Capitano" },
    { etichetta: "NAVE", valore: "ORB-1 · assistente di bordo V.A.L.E. modello 7" },
  ];

  const obiettivi: Obiettivo[] = [
    { tipo: "PRINCIPALE", testo: `Parte 1 · ${senzaPunto(m.briefing.parti.andata)} (${giorni(andata)}): tieni in efficienza nave e crew.` },
    { tipo: "PRINCIPALE", testo: `Parte 2 · Sul posto (${giorni(orbita)}): ${m.briefing.parti.orbita}` },
    {
      tipo: "PRINCIPALE",
      testo: `Parte 3 · ${senzaPunto(m.briefing.parti.rientro)} (${giorni(rientro)}): si parte entro il giorno ${giornoFinestra}, con la riserva di carburante.`,
    },
    { tipo: "SECONDARIO", testo: "Di contorno: durante la missione compariranno incarichi facoltativi, con risorse e informazioni in premio." },
    { tipo: "RISERVATO", testo: "Direttiva interna di V.A.L.E. · ACCESSO NEGATO" },
  ];

  return {
    ...BRIEFING_COMUNE,
    protocollo: m.briefing.protocollo,
    titolo: m.titolo,
    nome: m.nome,
    scheda,
    contesto: m.briefing.contesto,
    obiettivi,
    obiettivoFinale: m.briefing.obiettivoFinale,
  };
}
