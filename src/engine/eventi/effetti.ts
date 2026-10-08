/**
 * ============================================================================
 * effetti.ts — Applicare gli effetti di eventi e scelte alla bozza
 * ============================================================================
 *
 * Ogni effetto è un piccolo cambiamento descritto come dato (types/eventi.ts).
 * Qui c'è l'unico punto in cui quei dati diventano modifiche allo stato,
 * sempre con i limiti giusti: le risorse non scendono sotto zero,
 * integrità e fatica restano tra 0 e 100.
 *
 * L'AMBITO (v3.0)
 * Alcuni effetti sono "personali": colpiscono il responsabile del task che
 * ha fatto scattare l'evento, oppure il PROTAGONISTA e il SECONDO scelti
 * dalla storia emergente. L'ambito porta queste tre informazioni, e serve
 * anche a sostituire {P} e {S} nei testi (log e giornale di bordo).
 * ============================================================================
 */

import { BALANCE } from "../../content/balance";
import { modificaSalute } from "../crew/salute";
import { assegnaTask, verificaAssegnazione } from "../mission/assegnazione";
import type { ContestoMissione } from "../mission/contesto";
import { scriviLog } from "../mission/log";
import { conNomi } from "../storia/attori";
import { scriviDiario } from "../storia/diario";
import { modificaFiduciaCrew, modificaFiduciaMembro } from "../storia/fazioni";
import { concludiMissione } from "../storia/fine";
import { avviaRientro } from "../storia/viaggio";
import { sbloccaTutto } from "../storia/iniziative";
import { limita } from "../tasks/rischio";
import type { Destinatario, Effetto, IdIstanzaTask, IdMembro, MembroCrew, StatoMissione } from "../types";

/** Chi c'entra con gli effetti che stiamo applicando. */
export interface Ambito {
  idTaskOrigine: IdIstanzaTask | null;
  protagonista: IdMembro | null;
  secondo: IdMembro | null;
}

export const AMBITO_VUOTO: Ambito = { idTaskOrigine: null, protagonista: null, secondo: null };

/** I membri a cui si riferisce un destinatario. */
function bersagli(bozza: StatoMissione, chi: Destinatario, ambito: Ambito): MembroCrew[] {
  const per = (id: IdMembro | null | undefined) => (id ? bozza.crew[id] : undefined);
  const lista =
    chi === "TUTTI"
      ? Object.values(bozza.crew).filter((m) => m.stato !== "MORTO" && m.stato !== "DISPERSO")
      : chi === "RESPONSABILE"
        ? [per(ambito.idTaskOrigine !== null ? bozza.tasks[ambito.idTaskOrigine]?.responsabile : null)]
        : chi === "PROTAGONISTA"
          ? [per(ambito.protagonista)]
          : [per(ambito.secondo)];
  return lista.filter((m): m is MembroCrew => m !== undefined);
}

function applicaEffetto(bozza: StatoMissione, effetto: Effetto, ambito: Ambito, contesto: ContestoMissione): void {
  switch (effetto.tipo) {
    case "SCOPERTA":
      // Nessuna ripetizione: una cosa si scopre una volta sola.
      if (!bozza.conoscenza.scoperte.includes(effetto.id)) bozza.conoscenza.scoperte.push(effetto.id);
      break;

    case "RISORSA":
      bozza.risorse[effetto.risorsa] = Math.max(0, bozza.risorse[effetto.risorsa] + effetto.delta);
      break;

    case "SISTEMA":
      bozza.nave.sistemi[effetto.sistema] = limita(bozza.nave.sistemi[effetto.sistema] + effetto.delta, 0, 100);
      break;

    case "SCAFO":
      bozza.nave.scafo = limita(bozza.nave.scafo + effetto.delta, 0, 100);
      break;

    case "FATICA":
      for (const membro of bersagli(bozza, effetto.chi, ambito)) {
        membro.fatica = limita(membro.fatica + effetto.delta, 0, 100);
      }
      break;

    case "LOG":
      scriviLog(bozza, effetto.fonte, conNomi(bozza, effetto.testo, ambito), effetto.codici ?? []);
      break;

    case "FIDUCIA":
      modificaFiduciaCrew(bozza, contesto, effetto.delta);
      break;

    case "TENSIONE":
      bozza.vale.tensione = Math.max(0, bozza.vale.tensione + effetto.delta);
      break;

    case "RIVELA_DIRETTIVA": {
      // La VERITÀ diventa CONOSCENZA: da qui la UI può mostrare la direttiva.
      const direttiva = contesto.catalogoDirettive[bozza.vale.direttiva];
      if (!bozza.conoscenza.scoperte.includes("DIRETTIVA_RIVELATA")) bozza.conoscenza.scoperte.push("DIRETTIVA_RIVELATA");
      scriviLog(bozza, "SISTEMA", `DIRETTIVA INTERNA V.A.L.E. · ${direttiva?.id ?? "?"} · ${direttiva?.nome.toUpperCase() ?? "SCONOSCIUTA"}`);
      scriviLog(bozza, "SISTEMA", `CLASSIFICAZIONE RISPETTO ALLA MISSIONE · ${direttiva?.classe.replaceAll("_", " ") ?? "?"}`);
      break;
    }

    case "OVERRIDE_VALE":
      if (!bozza.vale.override) {
        bozza.vale.override = true;
        bozza.vale.tensione += BALANCE.vale.tensioneOverride;
        for (const testo of contesto.testiVale.override) {
          // Le battute che iniziano con "Capitano:" sono del Capitano (v3.9:
          // fonte CAPITANO, senza il prefisso), le altre di V.A.L.E.
          if (testo.startsWith("Capitano:")) scriviLog(bozza, "CAPITANO", testo.slice("Capitano:".length).trim());
          else scriviLog(bozza, "VALE", testo);
        }
        // Con l'override anche le porte chiuse da V.A.L.E. si riaprono.
        if (sbloccaTutto(bozza)) scriviLog(bozza, "SISTEMA", "OVERRIDE · ACCESSI RIPRISTINATI");
      }
      break;

    // --- Storia emergente (v3.0) -------------------------------------------
    case "FIDUCIA_MEMBRO":
      for (const membro of bersagli(bozza, effetto.chi, ambito)) {
        modificaFiduciaMembro(bozza, contesto, membro, effetto.delta);
      }
      break;

    case "SALUTE":
      for (const membro of bersagli(bozza, effetto.chi, ambito)) {
        if (modificaSalute(membro, effetto.delta)) {
          scriviLog(bozza, "SISTEMA", `${membro.nome.toUpperCase()} · SEGNI VITALI ASSENTI`);
          scriviDiario(bozza, `Abbiamo perso ${membro.nome}.`);
        }
      }
      break;

    case "ACCESSO":
      bozza.nave.accessi[effetto.compartimento] = effetto.stato;
      if (effetto.stato === "BLOCCATO" && !bozza.conoscenza.scoperte.includes("BLOCCO_VALE")) {
        bozza.conoscenza.scoperte.push("BLOCCO_VALE");
      }
      break;

    case "SBLOCCA_COMPARTIMENTI":
      sbloccaTutto(bozza);
      break;

    case "TASK_AUTONOMO":
      for (const membro of bersagli(bozza, effetto.chi, ambito)) {
        // Solo se possibile (equipaggiamento, porte, salute…): altrimenti niente.
        if (verificaAssegnazione(bozza, contesto, effetto.task, membro.id, null) === null) {
          assegnaTask(bozza, effetto.task, membro.id, null);
          scriviLog(bozza, "SISTEMA", `${membro.nome} si assegna: ${contesto.catalogoTask[effetto.task]?.nome ?? effetto.task}`);
        }
      }
      break;

    case "DIARIO":
      scriviDiario(bozza, conNomi(bozza, effetto.testo, ambito));
      break;

    case "FINE_MISSIONE":
      concludiMissione(bozza, contesto, effetto.causa);
      break;

    case "PARTENZA":
      avviaRientro(bozza, contesto, concludiMissione);
      break;
  }
}

/** Applica una lista di effetti, nell'ordine in cui sono scritti. */
export function applicaEffetti(
  bozza: StatoMissione,
  effetti: readonly Effetto[],
  ambito: Ambito,
  contesto: ContestoMissione,
): void {
  for (const effetto of effetti) applicaEffetto(bozza, effetto, ambito, contesto);
}
