/**
 * ============================================================================
 * format.ts — Trasformare i dati del motore in testo e "toni" per la UI
 * ============================================================================
 *
 * Il motore parla in codici ("SUPPORTO_VITALE", 21, "ALTA"); il giocatore
 * legge "SUPPORTO VITALE", "21%", e vede un colore. Tutte queste traduzioni
 * stanno qui, così i componenti restano semplici e le regole di colore
 * (verde / ambra / rosso) sono decise in un solo posto.
 * ============================================================================
 */

import type { FasciaFatica } from "../engine/crew/fatica";
import type { FasciaScafo, FasciaSistema } from "../engine/nave/integrita";
import type {
  Condizione,
  DefinizioneModulo,
  Effetto,
  Fattibilita,
  Fazione,
  Minuti,
  ParametroNave,
  Percentuale,
  StatoMembro,
} from "../engine/types";

/** I tre toni del design system: verde, ambra, rosso. */
export type Tono = "normale" | "attenzione" | "critico";

/** "SUPPORTO_VITALE" → "SUPPORTO VITALE". */
export function etichetta(codice: string): string {
  return codice.replaceAll("_", " ");
}

/** 115 → "1h 55m"; 45 → "45m". */
export function formattaDurata(minuti: Minuti): string {
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Solo l'orario, es. "09:05" (il giorno è già nell'intestazione). */
export function formattaOra(t: Minuti): string {
  const m = t % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function tonoRischio(rischio: Percentuale): Tono {
  if (rischio >= 45) return "critico";
  if (rischio >= 25) return "attenzione";
  return "normale";
}

export function tonoFatica(fascia: FasciaFatica): Tono {
  if (fascia === "ESAURITO") return "critico";
  if (fascia === "ALTA") return "attenzione";
  return "normale";
}

export function tonoSistema(fascia: FasciaSistema): Tono {
  if (fascia === "NOMINALE" || fascia === "BUONO") return "normale";
  if (fascia === "DEGRADATO") return "attenzione";
  return "critico";
}

export function tonoScafo(fascia: FasciaScafo): Tono {
  if (fascia === "NOMINALE") return "normale";
  if (fascia === "DANNEGGIATO") return "attenzione";
  return "critico";
}

export function tonoStatoMembro(stato: StatoMembro): Tono {
  if (stato === "SANO") return "normale";
  if (stato === "FERITO") return "attenzione";
  return "critico";
}

/**
 * Il costo di una scelta, ricavato dai suoi effetti: "ENERGIA −5".
 * Si mostrano solo le risorse spese: scoperte e altri effetti restano
 * una sorpresa (dirli in anticipo sarebbe uno spoiler).
 */
export function descriviCosto(effetti: readonly Effetto[]): string {
  const costi = effetti.flatMap((e) =>
    e.tipo === "RISORSA" && e.delta < 0 ? [`${etichetta(e.risorsa).toUpperCase()} −${-e.delta}`] : [],
  );
  return costi.length > 0 ? costi.join(" · ") : "NESSUN COSTO";
}

/** Nomi delle fazioni per l'interfaccia. */
export const NOMI_FAZIONE: Record<Fazione, string> = {
  CON_VALE: "CON V.A.L.E.",
  INDECISO: "INDECISO",
  CONTRO_VALE: "CONTRO V.A.L.E.",
};

export function tonoFazione(f: Fazione): Tono {
  if (f === "CON_VALE") return "normale";
  if (f === "CONTRO_VALE") return "critico";
  return "attenzione";
}

/** Una condizione spiegata in poche parole (solo quelle che hanno senso per il giocatore). */
function spiegaCondizione(c: Condizione): string | null {
  switch (c.tipo) {
    case "EQUIPAGGIAMENTO":
      return etichetta(c.id);
    case "FAZIONE":
      return `${c.almeno} ${NOMI_FAZIONE[c.fazione]}`;
    case "RUOLO_A_BORDO":
      return `UN ${etichetta(c.ruolo)} A BORDO`;
    case "UNO_TRA": {
      const parti = c.condizioni.map(spiegaCondizione).filter((x): x is string => x !== null);
      return parti.length > 0 ? parti.join(" O ") : null;
    }
    case "NON":
      return c.condizione.tipo === "AUTONOMIA_ALMENO" ? "V.A.L.E. NON LO IMPEDISCA" : null;
    default:
      return null;
  }
}

/** Perché una scelta non è disponibile, es. "[RICHIEDE: DRONE RICOGNIZIONE]". */
export function descriviRequisiti(requisiti: readonly Condizione[]): string {
  const parti = requisiti.map(spiegaCondizione).filter((x): x is string => x !== null);
  return parti.length > 0 ? `[RICHIEDE: ${parti.join(", ")}]` : "[NON DISPONIBILE]";
}

/** Integrità dei dati: verde ≥ 85, ambra ≥ 60, rosso sotto. */
export function tonoIntegrita(valore: Percentuale): Tono {
  if (valore >= 85) return "normale";
  if (valore >= 60) return "attenzione";
  return "critico";
}

// ----------------------------------------------------------------------------
// PREPARAZIONE
// ----------------------------------------------------------------------------

/** Come si legge ogni parametro della nave nelle schede dei moduli. */
const NOMI_PARAMETRI: Record<ParametroNave, { nome: string; unita: string }> = {
  generazioneEnergia: { nome: "ENERGIA", unita: "/g" },
  consumoEnergia: { nome: "CONSUMO", unita: "/g" },
  capacitaBatteria: { nome: "BATTERIA", unita: "" },
  spazioScorte: { nome: "STIVA", unita: "" },
  recuperoFatica: { nome: "RIPOSO", unita: "" },
  ciboPerMembro: { nome: "CIBO", unita: "/persona/g" },
  acquaPerMembro: { nome: "ACQUA", unita: "/persona/g" },
  produzioneOssigeno: { nome: "OSSIGENO", unita: "/g" },
  integritaDati: { nome: "INTEGRITÀ DATI", unita: "" },
};

/** Numero con segno sempre visibile: 6 → "+6", -2 → "−2". */
export function conSegno(n: number): string {
  return n >= 0 ? `+${n}` : `−${-n}`;
}

/** { generazioneEnergia: 6, consumoEnergia: 2 } → ["ENERGIA +6/g", "CONSUMO +2/g"]. */
export function descriviEffettiModulo(effetti: DefinizioneModulo["effetti"]): string[] {
  return Object.entries(effetti).map(([chiave, valore]) => {
    const { nome, unita } = NOMI_PARAMETRI[chiave as ParametroNave];
    return `${nome} ${conSegno(valore ?? 0)}${unita}`;
  });
}

export function tonoFattibilita(f: Fattibilita): Tono {
  if (f === "POSSIBILE") return "normale";
  if (f === "RISCHIOSA") return "attenzione";
  return "critico";
}
