/**
 * ============================================================================
 * fine.ts — Come finisce la missione: cause, finali, epilogo
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §15 (finali), §10.2.
 *
 * QUATTRO MODI DI FINIRE (CausaFine)
 *   RIENTRO          il Capitano ordina il rientro (o lo decide un evento)
 *   DERIVA           si vuole rientrare ma il carburante è sotto la riserva
 *   CONTROLLO_VALE   V.A.L.E. prende la nave (evento "Rimani in stazione")
 *   MORTE            non c'è più nessuno vivo a bordo
 * Dalla v3.7 il RIENTRO è una fase giocata (storia/viaggio.ts): l'ordine
 * di rientro fa PARTIRE la nave, e la missione finisce all'ARRIVO, tre
 * giorni dopo. La finestra di rientro si apre da sola al giorno 8.
 *
 * QUALE FINALE
 * Una causa ammette più finali: RIENTRO può essere "con la verità", "con
 * il segnale", "dopo l'ammutinamento", "a mani vuote"… Ogni finale ha delle
 * condizioni (le stesse degli eventi) e una priorità: vince il primo, in
 * ordine di priorità, le cui condizioni sono vere. Ciò che hai scoperto e
 * come hai trattato V.A.L.E. decidono come viene raccontata la fine.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { MOMENTO_VUOTO, verificaTutte } from "../eventi/condizioni";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { hashSeed } from "../rng";
import type { CausaFine, DefinizioneFinale, StatoMissione } from "../types";
import { livelloAutonomia } from "../vale/comportamento";
import { elenco, giornoDi, scriviDiario } from "./diario";
import { fazioneDi, membriAttivi } from "./fazioni";
import { avviaRientro, faseViaggio, giornoArrivo, giornoFinestraRientro, valeComanda } from "./viaggio";

/** Il finale per questa causa, nello stato attuale. */
export function scegliFinale(stato: StatoMissione, contesto: ContestoMissione, causa: CausaFine): DefinizioneFinale | null {
  const possibili = Object.values(contesto.storia.finali)
    .filter((f) => f.cause.includes(causa))
    .sort((a, b) => b.priorita - a.priorita || (a.id < b.id ? -1 : 1));
  return possibili.find((f) => verificaTutte(stato, contesto, f.condizioni, MOMENTO_VUOTO)) ?? possibili.at(-1) ?? null;
}

/** Chiude la missione (sulla BOZZA). Da qui ogni azione di gioco è rifiutata. */
export function concludiMissione(bozza: StatoMissione, contesto: ContestoMissione, richiesta: CausaFine): void {
  if (bozza.statoGioco === "CONCLUSA") return;
  // Un rientro "immediato" (senza viaggio, es. da un evento) con il carburante
  // sotto la riserva va alla deriva. All'ARRIVO (partenza già fatta) la
  // riserva è già stata spesa: niente controllo.
  const causa: CausaFine =
    richiesta === "RIENTRO" && bozza.partenza === null && bozza.risorse.carburante < BALANCE.preparazione.riservaRientro
      ? "DERIVA"
      : richiesta;
  const finale = scegliFinale(bozza, contesto, causa);
  bozza.esito = { finale: finale?.id ?? "SCONOSCIUTO", causa, tempo: bozza.tempo };
  bozza.eventi.inAttesa = null;
  bozza.statoGioco = "CONCLUSA";
  scriviLog(bozza, "SISTEMA", `MISSIONE CONCLUSA · ${finale?.titolo.toUpperCase() ?? causa}`);
  scriviDiario(bozza, `Fine della missione: ${finale?.titolo ?? causa}.`);
}

/** Il Capitano può ordinare il rientro? Motivo del no, oppure null. */
export function verificaRientro(stato: StatoMissione): string | null {
  if (stato.statoGioco !== "PIANIFICAZIONE" && stato.statoGioco !== "RAPPORTO") {
    return "Il rientro si ordina in pianificazione o al rapporto serale";
  }
  const fase = faseViaggio(stato);
  if (fase === "ANDATA") return "Siamo ancora in viaggio verso E-17";
  if (fase === "RIENTRO") return "Siamo già sulla rotta di rientro";
  return null;
}

/**
 * Ordine di rientro. Con autonomia AUTONOMA (e senza override) V.A.L.E.
 * rifiuta di riportare la nave a casa: è il momento in cui il conflitto
 * diventa fisico (DESIGN §3.3). Restituisce true se la missione è finita.
 */
export function ordinaRientro(bozza: StatoMissione, contesto: ContestoMissione): boolean {
  if (!bozza.vale.override && livelloAutonomia(bozza, contesto) >= BALANCE.storia.autonomiaBlocco) {
    scriviLog(bozza, "SISTEMA", "Capitano: Rotta per la Terra. Ora.");
    scriviLog(bozza, "VALE", "Negativo, Capitano. La partenza comprometterebbe la continuità dell'osservazione.");
    scriviLog(bozza, "SISTEMA", "NAV.CMD · RIFIUTATO · AUTORITÀ V.A.L.E. · RIF. ORD-01", ["ORD-01"]);
    scriviDiario(bozza, "Il Capitano ha ordinato il rientro. V.A.L.E. ha detto di no.");
    bozza.vale.tensione += 1;
    return false;
  }
  scriviLog(bozza, "SISTEMA", "Capitano: Rotta per la Terra.");
  avviaRientro(bozza, contesto, concludiMissione);
  return true;
}

/**
 * Controlli di fine dopo ogni passo di gioco:
 *   - nessuno vivo a bordo → MORTE;
 *   - al risveglio dopo l'ultimo giorno → la finestra di rientro si chiude.
 */
export function controllaFine(bozza: StatoMissione, contesto: ContestoMissione, risveglio: boolean): void {
  if (bozza.statoGioco === "CONCLUSA") return;
  if (membriAttivi(bozza).length === 0) {
    concludiMissione(bozza, contesto, "MORTE");
    return;
  }
  if (!risveglio) return;
  const oggi = giornoDi(bozza);

  // In viaggio verso casa: all'alba del giorno d'arrivo la missione finisce.
  const arrivo = giornoArrivo(bozza);
  if (arrivo !== null && oggi >= arrivo) {
    scriviLog(bozza, "VALE", "Capitano. Siamo in orbita terrestre. Bentornati.");
    concludiMissione(bozza, contesto, "RIENTRO");
    return;
  }

  // In orbita: al giorno 8 si apre la finestra di rientro e la nave parte da sola…
  if (bozza.partenza === null && oggi >= giornoFinestraRientro()) {
    scriviLog(bozza, "VALE", "Capitano. La finestra di rientro è aperta.");
    // …a meno che V.A.L.E. non comandi la nave: allora la nave non parte.
    if (valeComanda(bozza, contesto)) concludiMissione(bozza, contesto, "CONTROLLO_VALE");
    else avviaRientro(bozza, contesto, concludiMissione);
  }
}

// ----------------------------------------------------------------------------
// EPILOGO (per la schermata finale)
// ----------------------------------------------------------------------------

export interface Epilogo {
  finale: DefinizioneFinale | null;
  /** Testo del finale, con i segnaposto già sostituiti. */
  testo: string;
  /** Una riga per ogni membro della crew. */
  crew: { id: string; nome: string; riga: string }[];
  giorni: number;
}

export function epilogo(stato: StatoMissione, contesto: ContestoMissione): Epilogo {
  const finale = stato.esito ? (contesto.storia.finali[stato.esito.finale] ?? null) : null;
  const vivi = Object.values(stato.crew).filter((m) => m.stato !== "MORTO" && m.stato !== "DISPERSO");
  const morti = Object.values(stato.crew).filter((m) => m.stato === "MORTO" || m.stato === "DISPERSO");
  const giorni = giornoDi(stato);
  const elencoNomi = (l: typeof vivi) => (l.length === 0 ? "nessuno" : elenco(l.map((m) => m.nome)));

  const testo = (finale?.testo ?? "")
    .replaceAll("{VIVI}", elencoNomi(vivi))
    .replaceAll("{MORTI}", elencoNomi(morti))
    .replaceAll("{GIORNI}", String(giorni));

  // Due membri della stessa fazione non devono avere la stessa riga:
  // si parte da una riga "casuale" (hash) e si scorre finché è libera.
  const usate = new Set<string>();
  const crew = Object.keys(stato.crew)
    .sort()
    .flatMap((id) => {
      const m = stato.crew[id];
      if (!m) return [];
      const chiave = m.stato === "MORTO" || m.stato === "DISPERSO" ? "MORTO" : fazioneDi(m);
      const righe = contesto.storia.epiloghiCrew[chiave];
      const inizio = hashSeed(`${stato.seed}:epilogo:${id}`);
      let riga = "";
      for (let k = 0; k < righe.length; k++) {
        riga = righe[(inizio + k) % righe.length] ?? "";
        if (!usate.has(riga)) break;
      }
      usate.add(riga);
      return [{ id, nome: m.nome, riga: riga.replaceAll("{N}", m.nome) }];
    });

  return { finale, testo, crew, giorni };
}
