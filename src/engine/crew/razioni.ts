/**
 * ============================================================================
 * razioni.ts — Chi mangia e chi beve stasera (alla 60 Seconds)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §6.4 (razioni, fame e sete — v3.4).
 *
 * L'IDEA
 * Al rapporto serale il Capitano decide, per ogni membro, una razione di
 * CIBO e una di ACQUA: PIENA, MEZZA o NIENTE. Le scorte non bastano mai
 * per tutti, quindi si sceglie chi tenere in forze.
 *
 * FAME E SETE: PUNTI E LIVELLI
 * Ogni membro ha punti di fame e di sete (0–6, salvati nello stato). Ogni
 * sera la razione li sposta (balance.razioni): piena li fa scendere, mezza
 * o niente li fa salire (l'acqua più del cibo). Dai punti si CALCOLA il
 * livello 0–3 che conta nel gioco:
 *     punti 0 → 0 · 1–2 → 1 · 3–4 → 2 · 5–6 → 3
 * Il CARICO di un membro è livello fame + livello sete (0–6).
 *
 * COSA FA IL CARICO
 *   - meno task al giorno:   capacità = 4 − carico (a zero non lavora);
 *   - più fatica:            di notte recupera 10 punti in meno per livello;
 *   - salute:                oltre il primo livello, ogni notte fa male;
 *   - paranoia (carico ≥ 2): chi diffida di V.A.L.E. diffida di più, chi
 *                            le crede si fida di lei più che dei compagni.
 *
 * Funzioni "verifica…" e di calcolo: pure. "distribuisciRazioni": sulla bozza.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { minutoDelGiorno } from "../clock";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { parametriNave } from "../nave/parametri";
import { scriviDiario, elenco } from "../storia/diario";
import { fazioneDi, membriAttivi, modificaFiduciaMembro } from "../storia/fazioni";
import type { IdMembro, MembroCrew, StatoMissione } from "../types";
import { modificaSalute } from "./salute";

export const RAZIONI = ["PIENA", "MEZZA", "NIENTE"] as const;
export type Razione = (typeof RAZIONI)[number];

/** La razione di una persona per una sera. */
export interface RazionePersonale {
  cibo: Razione;
  acqua: Razione;
}
/** Le razioni della sera, per ID di membro. */
export type RazioniSerali = Record<IdMembro, RazionePersonale>;

// ----------------------------------------------------------------------------
// LIVELLI E CARICO (derivati)
// ----------------------------------------------------------------------------

/** Dai punti (0–6) al livello (0–3). */
export function livelloBisogno(punti: number): number {
  return Math.ceil(Math.max(0, punti) / 2);
}

export const NOMI_FAME = ["SAZIO", "APPETITO", "FAME", "DENUTRITO"] as const;
export const NOMI_SETE = ["IDRATATO", "SETE", "DISIDRATATO", "DISIDRATAZIONE GRAVE"] as const;

/** Livello di fame + livello di sete. */
export function caricoBisogni(m: MembroCrew): number {
  return livelloBisogno(m.fame) + livelloBisogno(m.sete);
}

/** Quanti task può avviare oggi (non contano le pause di riposo). */
export function capacitaGiornaliera(m: MembroCrew): number {
  return Math.max(0, BALANCE.razioni.taskMassimi - caricoBisogni(m));
}

/** Tag dei task che non consumano la capacità (riposare non è lavorare). */
const TAG_RIPOSO = "RIPOSO";

/**
 * I task di OGGI di un membro come responsabile: quelli già avviati oggi
 * più quelli ancora in coda. Contano per la capacità giornaliera.
 */
export function taskDiOggi(stato: StatoMissione, contesto: ContestoMissione, id: IdMembro): number {
  const inizioGiorno = stato.tempo - minutoDelGiorno(stato.tempo);
  return Object.values(stato.tasks).filter((t) => {
    if (t.responsabile !== id) return false;
    if (contesto.catalogoTask[t.idDefinizione]?.tag.includes(TAG_RIPOSO)) return false;
    if (t.stato === "IN_CODA") return true;
    return t.inizio !== null && t.inizio >= inizioGiorno && t.stato !== "ANNULLATO";
  }).length;
}

/** Il task è "lavoro" (consuma capacità)? */
export function consumaCapacita(contesto: ContestoMissione, idDefinizione: string): boolean {
  return !contesto.catalogoTask[idDefinizione]?.tag.includes(TAG_RIPOSO);
}

// ----------------------------------------------------------------------------
// RAZIONI: costo, predefinite, verifica
// ----------------------------------------------------------------------------

/** Unità di cibo o acqua consumate da una razione. Mezza = metà, per eccesso. */
function quantita(razione: Razione, piena: number): number {
  if (razione === "PIENA") return piena;
  if (razione === "MEZZA") return Math.ceil(piena / 2);
  return 0;
}

/** Quanto cibo e acqua costano queste razioni. */
export function costoRazioni(stato: StatoMissione, contesto: ContestoMissione, razioni: RazioniSerali) {
  const p = parametriNave(stato.nave.moduli, contesto.catalogoModuli);
  let cibo = 0;
  let acqua = 0;
  for (const m of membriAttivi(stato)) {
    const r = razioni[m.id];
    if (!r) continue;
    cibo += quantita(r.cibo, p.ciboPerMembro);
    acqua += quantita(r.acqua, p.acquaPerMembro);
  }
  return { cibo, acqua };
}

/**
 * Le razioni "automatiche" (se il Capitano non sceglie, per esempio nei
 * test): piena a tutti se basta; altrimenti mezza a tutti; altrimenti si
 * distribuisce mezza razione in ordine alfabetico finché ce n'è.
 */
export function razioniPredefinite(stato: StatoMissione, contesto: ContestoMissione): RazioniSerali {
  const p = parametriNave(stato.nave.moduli, contesto.catalogoModuli);
  const membri = membriAttivi(stato);
  const scegli = (scorta: number, piena: number): Razione[] => {
    if (scorta >= membri.length * piena) return membri.map(() => "PIENA");
    if (scorta >= membri.length * quantita("MEZZA", piena)) return membri.map(() => "MEZZA");
    let resto = scorta;
    return membri.map(() => {
      if (resto >= quantita("MEZZA", piena)) {
        resto -= quantita("MEZZA", piena);
        return "MEZZA";
      }
      return "NIENTE";
    });
  };
  const cibo = scegli(stato.risorse.cibo, p.ciboPerMembro);
  const acqua = scegli(stato.risorse.acqua, p.acquaPerMembro);
  return Object.fromEntries(membri.map((m, i) => [m.id, { cibo: cibo[i] ?? "NIENTE", acqua: acqua[i] ?? "NIENTE" }]));
}

/** Motivo per cui queste razioni non si possono dare, o null. */
export function verificaRazioni(stato: StatoMissione, contesto: ContestoMissione, razioni: RazioniSerali): string | null {
  for (const id of Object.keys(razioni)) {
    const m = stato.crew[id];
    if (!m || m.stato === "MORTO" || m.stato === "DISPERSO") return `Nessun membro a bordo con ID ${id}`;
  }
  const { cibo, acqua } = costoRazioni(stato, contesto, razioni);
  if (cibo > stato.risorse.cibo) return `Cibo insufficiente: servono ${cibo}, ce ne sono ${stato.risorse.cibo}`;
  if (acqua > stato.risorse.acqua) return `Acqua insufficiente: servono ${acqua}, ce ne sono ${stato.risorse.acqua}`;
  return null;
}

// ----------------------------------------------------------------------------
// LA DISTRIBUZIONE (sulla bozza)
// ----------------------------------------------------------------------------

function limitaPunti(n: number): number {
  return Math.min(BALANCE.razioni.puntiMassimi, Math.max(0, n));
}

/**
 * Come starà un membro DOPO questa razione: punti, carico, task possibili
 * domani e salute che perderà stanotte. Pura: la UI la usa per mostrare
 * le conseguenze PRIMA che il Capitano confermi.
 */
export function bisogniDopo(m: MembroCrew, r: RazionePersonale) {
  const b = BALANCE.razioni;
  const fame = limitaPunti(m.fame + b.fame[r.cibo]);
  const sete = limitaPunti(m.sete + b.sete[r.acqua]);
  const carico = livelloBisogno(fame) + livelloBisogno(sete);
  const danno = Math.max(0, livelloBisogno(fame) - 1) * b.dannoFame + Math.max(0, livelloBisogno(sete) - 1) * b.dannoSete;
  return { fame, sete, carico, capacita: Math.max(0, b.taskMassimi - carico), danno };
}

/**
 * Dà le razioni della sera: scala le scorte, aggiorna fame e sete, applica
 * i danni alla salute e la paranoia. I membri senza razione indicata
 * ricevono NIENTE (chi distribuisce ha scelto di non darla).
 */
export function distribuisciRazioni(bozza: StatoMissione, contesto: ContestoMissione, razioni: RazioniSerali): void {
  const b = BALANCE.razioni;
  const { cibo, acqua } = costoRazioni(bozza, contesto, razioni);
  bozza.risorse.cibo -= cibo;
  bozza.risorse.acqua -= acqua;

  const senzaCibo: string[] = [];
  const senzaAcqua: string[] = [];
  for (const m of membriAttivi(bozza)) {
    const r = razioni[m.id] ?? { cibo: "NIENTE", acqua: "NIENTE" };
    const dopo = bisogniDopo(m, r);
    m.fame = dopo.fame;
    m.sete = dopo.sete;
    if (r.cibo === "NIENTE") senzaCibo.push(m.nome);
    if (r.acqua === "NIENTE") senzaAcqua.push(m.nome);

    // Salute: il primo livello è solo disagio; dal secondo fa male.
    const danno = dopo.danno;
    if (danno > 0 && modificaSalute(m, -danno)) {
      scriviLog(bozza, "SISTEMA", `${m.nome.toUpperCase()} · SEGNI VITALI ASSENTI`);
      scriviDiario(bozza, `Abbiamo perso ${m.nome}. La fame e la sete hanno fatto il resto.`);
      continue;
    }

    // Paranoia: la fame estremizza le opinioni su V.A.L.E.
    const carico = caricoBisogni(m);
    if (carico >= b.caricoParanoia) {
      const delta = b.paranoiaPerLivello * (carico - 1);
      const fazione = fazioneDi(m);
      if (fazione === "CONTRO_VALE") modificaFiduciaMembro(bozza, contesto, m, -delta);
      if (fazione === "CON_VALE") modificaFiduciaMembro(bozza, contesto, m, delta);
    }
  }

  scriviLog(bozza, "SISTEMA", `RAZIONI DISTRIBUITE · CIBO −${cibo} · ACQUA −${acqua}`);
  if (senzaCibo.length > 0) scriviDiario(bozza, `Stasera niente cena per ${elenco(senzaCibo)}.`);
  if (senzaAcqua.length > 0) scriviDiario(bozza, `Niente acqua per ${elenco(senzaAcqua)}.`);
}
