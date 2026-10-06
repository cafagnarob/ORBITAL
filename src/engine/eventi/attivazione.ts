/**
 * ============================================================================
 * attivazione.ts — Far accadere un evento e risolvere la decisione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §8 (stato DECISIONE), §10.
 *
 *   controllaEventi  → chiamata dal reducer dopo ogni AVANZA:
 *                      sceglie al massimo un evento e lo fa accadere.
 *     - evento INFORMATIVO (senza scelte): log + effetti, e il gioco continua.
 *     - evento con SCELTE: log + effetti immediati, poi il gioco si ferma
 *       in DECISIONE finché il Capitano non sceglie.
 *
 *   verificaScelta / risolviEvento → l'azione RISOLVI_EVENTO.
 *     Dopo la decisione si torna allo stato in cui eravamo (di solito
 *     IN_ESECUZIONE, ma anche RAPPORTO se l'evento è arrivato alle 22:00).
 *
 * FILTRO INFORMATIVO: se l'evento ha un filtro per la direttiva attiva,
 * V.A.L.E. pronuncia il testo del filtro al posto di quello dell'evento.
 * L'affermazione viene registrata: se il Capitano la contesta e la verifica
 * riesce, la verità viene a galla (engine/vale/contestazioni.ts).
 *
 * STORIA EMERGENTE (v3.0)
 *   - PROTAGONISTA e SECONDO: scelti al momento tra la crew ({P}, {S});
 *     restano legati all'evento fino alla decisione (inAttesa).
 *   - ESITI CASUALI: dopo gli effetti fissi di una scelta se ne estrae uno,
 *     tra quelli possibili, in base al peso (come in 60 Seconds).
 *   - GIORNALE DI BORDO: evento, scelta ed esito possono aggiungere righe.
 *
 * Le funzioni "verifica" non modificano nulla; le altre lavorano sulla bozza.
 * ============================================================================
 */

import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import type { Rng } from "../rng";
import { conNomi, scegliAttori } from "../storia/attori";
import { scriviDiario } from "../storia/diario";
import type { Attori, StatoMissione } from "../types";
import { filtroAttivo } from "../vale/filtro";
import { MOMENTO_VUOTO, trovaTaskOrigine, verificaTutte, type MomentoEventi } from "./condizioni";
import { applicaEffetti, type Ambito } from "./effetti";
import { eventiIdonei, scegliEvento } from "./selezione";

export function controllaEventi(bozza: StatoMissione, contesto: ContestoMissione, rng: Rng, momento: MomentoEventi): void {
  // Una decisione alla volta, e nessun evento a missione finita.
  if (bozza.eventi.inAttesa !== null || bozza.statoGioco === "CONCLUSA") return;

  const evento = scegliEvento(eventiIdonei(bozza, contesto, momento), rng);
  if (evento === null) return;

  const origine = trovaTaskOrigine(bozza, contesto, evento.condizioni, momento);
  const attori: Attori = scegliAttori(bozza, evento.protagonista, evento.secondo, rng);
  const ambito: Ambito = { idTaskOrigine: origine, ...attori };
  const nomi = (testo: string) => conNomi(bozza, testo, attori);

  // FILTRO INFORMATIVO (Fase 3): con certe direttive V.A.L.E. omette o svia.
  // Dice qualcos'altro, e gli effetti dell'evento sono sostituiti da quelli
  // del filtro (di solito una riga di sistema che lascia trapelare la verità).
  const filtro = filtroAttivo(bozza, evento);
  if (filtro) {
    scriviLog(bozza, "VALE", nomi(filtro.testo));
    bozza.vale.affermazioni.push({ indice: bozza.log.length - 1, idEvento: evento.id, idFiltro: filtro.id });
    applicaEffetti(bozza, filtro.effetti, ambito, contesto);
    if (filtro.sopprimeScelte || evento.scelte.length === 0) {
      bozza.eventi.accaduti.push({ id: evento.id, tempo: bozza.tempo, scelta: `FILTRATO:${filtro.id}`, ...registroAttori(attori) });
      return;
    }
  } else {
    scriviLog(bozza, evento.fonte, nomi(evento.testo), evento.codici);
    if (evento.diario) scriviDiario(bozza, nomi(evento.diario));
    applicaEffetti(bozza, evento.effetti, ambito, contesto);
  }

  // Un effetto può aver chiuso la missione (es. FINE_MISSIONE).
  if (evento.scelte.length === 0 || conclusa(bozza)) {
    bozza.eventi.accaduti.push({ id: evento.id, tempo: bozza.tempo, scelta: null, ...registroAttori(attori) });
    return;
  }

  // Serve una decisione: si registra l'evento quando il Capitano avrà scelto.
  bozza.eventi.inAttesa = { id: evento.id, ritorno: bozza.statoGioco, idTaskOrigine: origine, ...attori };
  bozza.statoGioco = "DECISIONE";
}

/**
 * La missione è finita? (Funzione e non confronto diretto: TypeScript,
 * dopo il controllo all'inizio, "crede" che lo stato non possa più essere
 * CONCLUSA, ma un effetto applicato nel frattempo può averlo cambiato.)
 */
function conclusa(stato: StatoMissione): boolean {
  return stato.statoGioco === "CONCLUSA";
}

function registroAttori(attori: Attori) {
  return { protagonista: attori.protagonista, esito: null };
}

/** Motivo per cui una scelta non è possibile, o null se lo è. */
export function verificaScelta(stato: StatoMissione, contesto: ContestoMissione, idScelta: string): string | null {
  const attesa = stato.eventi.inAttesa;
  if (attesa === null) return "Nessuna decisione in attesa";
  const evento = contesto.catalogoEventi[attesa.id];
  if (!evento) return `Evento sconosciuto: ${attesa.id}`;
  const scelta = evento.scelte.find((s) => s.id === idScelta);
  if (!scelta) return `Scelta sconosciuta: ${idScelta}`;
  if (!verificaTutte(stato, contesto, scelta.requisiti, MOMENTO_VUOTO)) return "Requisiti non soddisfatti";
  return null;
}

/** Applica la scelta del Capitano (ed eventualmente un esito casuale). */
export function risolviEvento(bozza: StatoMissione, contesto: ContestoMissione, idScelta: string, rng: Rng): void {
  const attesa = bozza.eventi.inAttesa;
  const evento = attesa ? contesto.catalogoEventi[attesa.id] : undefined;
  const scelta = evento?.scelte.find((s) => s.id === idScelta);
  if (!attesa || !evento || !scelta) throw new Error("risolviEvento: chiamata senza una scelta valida");

  const attori: Attori = { protagonista: attesa.protagonista, secondo: attesa.secondo };
  const ambito: Ambito = { idTaskOrigine: attesa.idTaskOrigine, ...attori };
  const nomi = (testo: string) => conNomi(bozza, testo, attori);

  // Prima si torna allo stato di prima: così un effetto FINE_MISSIONE può
  // ancora portare il gioco in CONCLUSA senza essere sovrascritto.
  bozza.eventi.inAttesa = null;
  bozza.statoGioco = attesa.ritorno;

  scriviLog(bozza, "SISTEMA", `Decisione del Capitano: ${nomi(scelta.etichetta)}`);
  if (scelta.diario) scriviDiario(bozza, nomi(scelta.diario));
  applicaEffetti(bozza, scelta.effetti, ambito, contesto);

  // ESITO CASUALE: uno tra quelli possibili, in base al peso.
  let idEsito: string | null = null;
  const possibili = (scelta.esiti ?? []).filter((e) => e.peso > 0 && verificaTutte(bozza, contesto, e.requisiti, MOMENTO_VUOTO));
  if (possibili.length > 0 && !conclusa(bozza)) {
    const esito = rng.weightedPick(possibili.map((e) => ({ item: e, peso: e.peso })));
    idEsito = esito.id;
    scriviLog(bozza, esito.testo.includes("«") ? "CREW" : "SISTEMA", nomi(esito.testo));
    if (esito.diario) scriviDiario(bozza, nomi(esito.diario));
    applicaEffetti(bozza, esito.effetti, ambito, contesto);
  }

  bozza.eventi.accaduti.push({ id: evento.id, tempo: bozza.tempo, scelta: scelta.id, protagonista: attori.protagonista, esito: idEsito });
}
