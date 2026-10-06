/**
 * ============================================================================
 * attori.ts — Chi vive un evento: protagonista ({P}) e secondo ({S})
 * ============================================================================
 *
 * Un evento narrativo non è scritto per "Mara": è scritto per «chi a bordo
 * si fida meno di V.A.L.E.», o «un membro indeciso». Il motore cerca chi
 * corrisponde (candidati) e ne sceglie uno; i testi usano {P} e {S}, che
 * diventano i nomi veri. Così lo stesso evento, in partite diverse, lo
 * vivono persone diverse, con reazioni diverse.
 * ============================================================================
 */

import type { Rng } from "../rng";
import type { Attori, MembroCrew, SelettoreMembro, StatoMissione } from "../types";
import { fazioneDi, membriAttivi } from "./fazioni";

/** I membri che rispettano il selettore (vivi, a bordo, tutti i filtri). */
export function candidati(stato: StatoMissione, sel: SelettoreMembro, escluso: string | null = null): MembroCrew[] {
  return membriAttivi(stato).filter((m) => {
    if (m.id === escluso) return false;
    if (sel.fazione && fazioneDi(m) !== sel.fazione) return false;
    if (sel.ruolo && m.ruolo !== sel.ruolo) return false;
    if (sel.personalita) {
      for (const [asse, valore] of Object.entries(sel.personalita)) {
        if (m.personalita[asse as keyof typeof m.personalita] !== valore) return false;
      }
    }
    return true;
  });
}

/** Sceglie un membro tra i candidati, secondo la preferenza del selettore. */
function scegli(lista: MembroCrew[], sel: SelettoreMembro, rng: Rng): MembroCrew | null {
  if (lista.length === 0) return null;
  if (sel.preferisci === "PIU_FIDUCIOSO") return [...lista].sort((a, b) => b.fiduciaVale - a.fiduciaVale)[0] ?? null;
  if (sel.preferisci === "MENO_FIDUCIOSO") return [...lista].sort((a, b) => a.fiduciaVale - b.fiduciaVale)[0] ?? null;
  return rng.pick(lista);
}

/** Ci sono abbastanza persone per questo evento? (Senza consumare numeri casuali.) */
export function attoriDisponibili(
  stato: StatoMissione,
  protagonista: SelettoreMembro | undefined,
  secondo: SelettoreMembro | undefined,
): boolean {
  if (!protagonista) return !secondo;
  const primi = candidati(stato, protagonista);
  if (primi.length === 0) return false;
  if (!secondo) return true;
  return primi.some((p) => candidati(stato, secondo, p.id).length > 0);
}

/** Sceglie protagonista e secondo (diverso dal primo). */
export function scegliAttori(
  stato: StatoMissione,
  protagonista: SelettoreMembro | undefined,
  secondo: SelettoreMembro | undefined,
  rng: Rng,
): Attori {
  if (!protagonista) return { protagonista: null, secondo: null };
  // Se serve anche un secondo, il protagonista va scelto tra chi ne ha uno.
  const primi = candidati(stato, protagonista).filter((p) => !secondo || candidati(stato, secondo, p.id).length > 0);
  const p = scegli(primi, protagonista, rng);
  const s = p && secondo ? scegli(candidati(stato, secondo, p.id), secondo, rng) : null;
  return { protagonista: p?.id ?? null, secondo: s?.id ?? null };
}

/** Sostituisce {P} e {S} con i nomi. */
export function conNomi(stato: StatoMissione, testo: string, attori: Attori): string {
  const nome = (id: string | null) => (id ? (stato.crew[id]?.nome ?? "?") : "qualcuno");
  return testo.replaceAll("{P}", nome(attori.protagonista)).replaceAll("{S}", nome(attori.secondo));
}

export const NESSUN_ATTORE: Attori = { protagonista: null, secondo: null };
