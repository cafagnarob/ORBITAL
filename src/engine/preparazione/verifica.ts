/**
 * ============================================================================
 * verifica.ts — Si può partire? Problemi e fattibilità della Preparazione
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.4 (fattibilità), §11.1, §6.3.
 *
 * DUE GRAVITÀ
 *   BLOCCANTE → non si parte (regole fisiche: peso, slot, crew incompleta).
 *   AVVISO    → si parte, ma il Capitano lo fa sapendo cosa rischia.
 *
 * FATTIBILITÀ (derivata dai problemi, mai salvata)
 *   almeno un BLOCCANTE → IMPOSSIBILE
 *   almeno un AVVISO    → RISCHIOSA
 *   nessun problema     → POSSIBILE
 * «Possibile non significa prudente» (§14.4): il gioco non vieta le scelte
 * rischiose, le rende visibili.
 *
 * Le frasi sono già pronte per il giocatore: la UI le mostra così come sono.
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { attrezzaturaIndispensabile, indispensabileMancante } from "./indispensabile";
import type {
  CataloghiPreparazione,
  DefinizioneTask,
  Fattibilita,
  IdMissione,
  Preparazione,
  ProblemaPreparazione,
} from "../types";
import { riepilogoPreparazione } from "./riepilogo";

/**
 * Il task esiste in questa partita? (v3.8) Un task con una condizione
 * MISSIONE nello sblocco appartiene solo a quelle supermissioni: in tutte le
 * altre non c'è, e non va contato tra gli "impossibili".
 */
function esisteNellaMissione(t: DefinizioneTask, missione: IdMissione | undefined): boolean {
  const vincolo = t.sblocco.find((c) => c.tipo === "MISSIONE");
  if (!vincolo || vincolo.tipo !== "MISSIONE") return true;
  return missione !== undefined && vincolo.missioni.includes(missione);
}

/** I task che con questo loadout NON si potranno mai fare (manca un oggetto). */
export function taskNonDisponibili(prep: Preparazione, cat: CataloghiPreparazione): DefinizioneTask[] {
  return Object.values(cat.task).filter(
    (t) =>
      !t.bonus &&
      esisteNellaMissione(t, cat.missione) &&
      (t.equipaggiamentoRichiesto.some((e) => !prep.equipaggiamento.includes(e)) ||
        t.moduliRichiesti.some((m) => !prep.moduli.includes(m))),
  );
}

/**
 * Per quanti giorni dovrebbero bastare cibo e acqua. Con il piano della
 * partita: una QUOTA della sua durata (v3.9: il resto lo producono le task
 * di sopravvivenza); senza piano: il valore di bilancio.
 */
export function giorniScorteConsigliati(cat: CataloghiPreparazione): number {
  const p = BALANCE.preparazione;
  if (cat.giorniMissione === undefined) return p.giorniScorteConsigliati;
  return Math.max(1, Math.ceil(cat.giorniMissione * p.quotaScorteConsigliata));
}

export function problemiPreparazione(prep: Preparazione, cat: CataloghiPreparazione): ProblemaPreparazione[] {
  const p = BALANCE.preparazione;
  const r = riepilogoPreparazione(prep, cat);
  const problemi: ProblemaPreparazione[] = [];
  const blocca = (testo: string) => problemi.push({ gravita: "BLOCCANTE", testo });
  const avvisa = (testo: string) => problemi.push({ gravita: "AVVISO", testo });

  // --- Bloccanti ------------------------------------------------------------
  if (prep.crew.length !== p.crewRichiesta) {
    blocca(`Servono ${p.crewRichiesta} membri della crew (scelti: ${prep.crew.length}).`);
  }
  if (prep.moduli.length > p.slotModuli) blocca(`Troppi moduli: ${prep.moduli.length} su ${p.slotModuli} slot.`);
  if (prep.equipaggiamento.length > p.slotEquipaggiamento) {
    blocca(`Troppo equipaggiamento: ${prep.equipaggiamento.length} su ${p.slotEquipaggiamento} slot.`);
  }
  if (r.carico.totale > p.caricoMassimo) {
    blocca(`Carico oltre il limite: ${r.carico.totale} kg su ${p.caricoMassimo}.`);
  }
  if (r.spazio.occupato > r.spazio.massimo) {
    blocca(`Stiva piena: ${r.spazio.occupato} unità su ${r.spazio.massimo}.`);
  }
  if (r.risorse.cibo === 0) blocca("Nessuna cassa di cibo a bordo.");
  if (r.risorse.acqua === 0) blocca("Nessuna cassa d'acqua a bordo.");

  // --- Avvisi ---------------------------------------------------------------
  // Le scorte devono coprire la missione (v3.8: la durata viene dal piano).
  const giorniConsigliati = giorniScorteConsigliati(cat);
  if (prep.crew.length > 0 && r.risorse.cibo > 0 && r.giorniCibo < giorniConsigliati) {
    avvisa(`Cibo per soli ${r.giorniCibo} giorni.`);
  }
  if (prep.crew.length > 0 && r.risorse.acqua > 0 && r.giorniAcqua < giorniConsigliati) {
    avvisa(`Acqua per soli ${r.giorniAcqua} giorni.`);
  }
  if (r.carburanteOperativo <= 0) {
    avvisa("Nessun carburante operativo: ogni manovra intaccherà la riserva di rientro.");
  }
  if (r.bilancioEnergia < 0) avvisa(`Energia in calo di ${-r.bilancioEnergia} al giorno.`);
  if (prep.crew.length > 0 && !prep.crew.some((id) => cat.candidati[id]?.ruolo === "MEDICO")) {
    avvisa("Nessun medico a bordo.");
  }
  // La scaletta della missione (v3.7): senza questa attrezzatura è impossibile.
  const mancanti = indispensabileMancante(prep, attrezzaturaIndispensabile(cat.taskObbligatori ?? [], cat));
  if (mancanti.length > 0) {
    const nomi = mancanti.map((id) => cat.moduli[id]?.nome ?? cat.equipaggiamento[id]?.nome ?? id);
    avvisa(`Obiettivo principale impossibile senza: ${nomi.join(", ")}.`);
  }
  const bloccati = taskNonDisponibili(prep, cat);
  if (bloccati.length > 0) {
    avvisa(`Task impossibili con questo loadout: ${bloccati.map((t) => t.nome).join(", ")}.`);
  }

  return problemi;
}

export function fattibilita(problemi: readonly ProblemaPreparazione[]): Fattibilita {
  if (problemi.some((p) => p.gravita === "BLOCCANTE")) return "IMPOSSIBILE";
  if (problemi.length > 0) return "RISCHIOSA";
  return "POSSIBILE";
}
