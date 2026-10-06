/**
 * ============================================================================
 * simulazione.test.ts — Un "bot" gioca molte partite con il contenuto vero
 * ============================================================================
 *
 * PERCHÉ
 * I test di unità controllano i pezzi; questo controlla il GIOCO INTERO.
 * Un giocatore automatico molto semplice gioca 30 partite di 6 giorni con
 * seed diversi, usando solo azioni valide (come farebbe la UI). Verifichiamo:
 *   - che non esploda mai nessun errore (nessuna combinazione rompe il motore);
 *   - che la storia sia davvero RAGGIUNGIBILE: la catena del segnale deve
 *     arrivare fino alla sorgente in almeno una partita.
 * È anche uno strumento di bilanciamento: si può stampare quanti giorni
 * servono in media per scoprire la sorgente.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { CONTESTO_GIOCO } from "../../src/content/contesto";
import { creaMissioneIniziale } from "../../src/content/missioneIniziale";
import { TASK_DISPONIBILI } from "../../src/content/tasks";
import { scomponiTempo } from "../../src/engine/clock";
import { applicaAzione, verificaAssegnazione, verificaScelta, type Azione } from "../../src/engine/mission";
import type { StatoMissione } from "../../src/engine/types";

const gioca = (s: StatoMissione, a: Azione) => applicaAzione(s, a, CONTESTO_GIOCO);

/** Preferenze del bot: per ogni membro, i task che prova ad assegnare in ordine. */
const PREFERENZE: Record<string, string[]> = {
  nadia: ["T-VERIFICA-DATI", "T-ANALISI-SEGNALE", "T-SCANSIONE-CRATERE"],
  adrian: ["T-RICOGNIZIONE-DRONE", "T-CORREZIONE-ORBITA"],
  mara: ["T-DIAGNOSTICA", "T-MANUTENZIONE-SV"],
  sarah: ["T-SCANSIONE-CRATERE", "T-MANUTENZIONE-SV"],
};

/**
 * Ogni mattina: un task per membro, il primo valido tra le sue preferenze.
 * L'ordine delle preferenze ruota con il giorno, così il bot varia il lavoro.
 */
function pianifica(stato: StatoMissione): StatoMissione {
  let s = stato;
  const giorno = scomponiTempo(s.tempo).giorno;
  for (const [membro, preferenze] of Object.entries(PREFERENZE)) {
    const k = giorno % preferenze.length;
    const preferiti = [...preferenze.slice(k), ...preferenze.slice(0, k)];
    const scelto = preferiti.find((id) => verificaAssegnazione(s, CONTESTO_GIOCO, id, membro, null) === null);
    if (scelto) s = gioca(s, { tipo: "ASSEGNA_TASK", idDefinizione: scelto, responsabile: membro, supporto: null });
  }
  return s;
}

/**
 * Il bot "bara": contesta proprio le affermazioni che V.A.L.E. ha filtrato
 * (lette dallo stato nascosto). Un giocatore vero dovrebbe accorgersene dalle
 * contraddizioni nel log; qui verifichiamo solo che la storia sia RAGGIUNGIBILE.
 */
function contestaFiltrate(stato: StatoMissione): StatoMissione {
  let s = stato;
  for (const a of s.vale.affermazioni) {
    if (!s.vale.contestazioni.some((c) => c.indice === a.indice)) s = gioca(s, { tipo: "CONTESTA", indice: a.indice });
  }
  return s;
}

/** Gioca una partita fino al giorno indicato. `n` varia le scelte del bot. */
function partita(seed: string, giorni: number, n: number): StatoMissione {
  let s = creaMissioneIniziale(seed);
  for (let passi = 0; passi < 500 && scomponiTempo(s.tempo).giorno <= giorni && s.statoGioco !== "CONCLUSA"; passi++) {
    switch (s.statoGioco) {
      case "PIANIFICAZIONE":
        s = gioca(pianifica(contestaFiltrate(s)), { tipo: "AVVIA_OPERAZIONI" });
        break;
      case "IN_ESECUZIONE":
        s = gioca(s, { tipo: "AVANZA" });
        break;
      case "RAPPORTO":
        s = gioca(s, { tipo: "CHIUDI_RAPPORTO" });
        break;
      case "DECISIONE": {
        const evento = CONTESTO_GIOCO.catalogoEventi[s.eventi.inAttesa?.id ?? ""];
        const valide = (evento?.scelte ?? []).filter((sc) => verificaScelta(s, CONTESTO_GIOCO, sc.id) === null);
        const scelta = valide[n % valide.length];
        if (!scelta) throw new Error("Nessuna scelta valida");
        s = gioca(s, { tipo: "RISOLVI_EVENTO", idScelta: scelta.id });
        break;
      }
    }
  }
  return s;
}

describe("simulazione con il contenuto vero", () => {
  const finali = Array.from({ length: 30 }, (_, i) => partita(`BOT-${i}`, 6, i));

  it("30 partite da 6 giorni si giocano senza errori (o finiscono prima con un finale)", () => {
    expect(finali).toHaveLength(30);
    for (const s of finali) {
      if (s.statoGioco === "CONCLUSA") expect(s.esito).not.toBeNull();
      else expect(scomponiTempo(s.tempo).giorno).toBeGreaterThanOrEqual(6);
    }
  });

  it("il segnale viene rilevato nella maggior parte delle partite", () => {
    const conSegnale = finali.filter((s) => s.conoscenza.scoperte.includes("SEGNALE_RILEVATO")).length;
    expect(conSegnale).toBeGreaterThan(20);
  });

  it("la catena del segnale è completabile: la sorgente viene localizzata", () => {
    const conSorgente = finali.filter((s) => s.conoscenza.scoperte.includes("SEGNALE_SORGENTE")).length;
    expect(conSorgente).toBeGreaterThan(0);
  });

  it("ogni task del catalogo viene usato almeno una volta", () => {
    const usati = new Set(finali.flatMap((s) => Object.values(s.tasks).map((t) => t.idDefinizione)));
    const nonUsabiliDalBot = TASK_DISPONIBILI.filter((t) => !Object.values(PREFERENZE).flat().includes(t.id)).map((t) => t.id);
    for (const t of TASK_DISPONIBILI) {
      if (!nonUsabiliDalBot.includes(t.id)) expect(usati).toContain(t.id);
    }
  });
});
