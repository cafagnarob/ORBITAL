/**
 * ============================================================================
 * Plancia.tsx — Lo "schermo di navigazione" della nave (v3.7.1)
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §14.6 (Plancia).
 * Riferimenti grafici di Roberto (i due video):
 *   1. griglia in prospettiva con il pianeta all'orizzonte e piccole
 *      etichette che compaiono → VistaViaggio (andata e rientro);
 *   2. globo wireframe che ruota, schede di dati collegate da linee e un
 *      anello che "aggancia" il bersaglio → VistaOrbita (orbita e scansione).
 *
 * COME FUNZIONA
 * La Plancia non ha stato suo: guarda lo StatoMissione e sceglie la vista
 * (i calcoli sono in derivati.ts).
 *   - tratta in corso (andata o rientro) → VistaViaggio con il progresso;
 *   - sul posto → VistaOrbita, in modalità:
 *       ACQUISIZIONE  se il task finale (o una scansione del cratere) è IN_CORSO,
 *       ACQUISITA     se l'obiettivo primario è conseguito,
 *       OSSERVAZIONE  altrimenti.
 * v3.8: nome e forma del bersaglio vengono dalla missione della partita.
 * Tutto il movimento è CSS (@keyframes): nessun timer JavaScript, nessun
 * useEffect. React ridisegna solo quando cambia lo stato del gioco; tra un
 * cambio e l'altro le animazioni girano da sole nel browser.
 * ============================================================================
 */

import { definizioneMissione } from "../../../content/missioni";
import { trattaInCorso } from "../../../engine/storia/viaggio";
import type { StatoMissione } from "../../../engine/types";
import { Finestra } from "../../components/Finestra";
import { modoOrbita } from "./derivati";
import { VistaOrbita } from "./VistaOrbita";
import { VistaViaggio } from "./VistaViaggio";

export function Plancia({ stato }: { stato: StatoMissione }) {
  const tratta = trattaInCorso(stato);
  const missione = definizioneMissione(stato.missione.id);
  const nome = missione.nome.toUpperCase();
  const destra = tratta ? (tratta.destinazione === "TERRA" ? "RIENTRO → TERRA" : `ROTTA → ${nome}`) : missione.bersaglio.luogo;

  return (
    <Finestra titolo="Plancia" destra={destra} pieno>
      {tratta ? (
        // key: se cambia la destinazione (andata → rientro) la vista riparte da zero.
        <VistaViaggio
          key={tratta.destinazione}
          tratta={tratta}
          seed={stato.seed}
          bersaglio={{ nome: missione.nome, forma: missione.bersaglio.forma }}
        />
      ) : (
        <VistaOrbita modo={modoOrbita(stato)} seed={stato.seed} missione={missione} />
      )}
    </Finestra>
  );
}
