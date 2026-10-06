/**
 * ============================================================================
 * CanaleVale.tsx — Il registro della missione e la voce di V.A.L.E.
 * ============================================================================
 *
 * Mostra tutte le voci di log in ordine cronologico. Le voci di V.A.L.E.
 * sono in ciano (l'unico posto in cui il ciano compare); i log di sistema
 * sono righe tecniche; le voci della crew sono marcate CREW.
 *
 * SCORRIMENTO AUTOMATICO SENZA useEffect
 * Di solito si "scrolla in fondo" con un useEffect dopo ogni render.
 * Qui usiamo un trucco solo CSS: il contenitore ha
 * `flex-direction: column-reverse`, e gli passiamo le voci al contrario.
 * Il risultato a schermo è identico (cronologico, dall'alto in basso), ma
 * per il browser il "punto di partenza" dello scorrimento è IN FONDO:
 * ogni nuova voce resta visibile senza scrivere una riga di JavaScript.
 *
 * aria-live="polite": gli screen reader leggono le nuove voci quando arrivano.
 * ============================================================================
 */

import type { StatoMissione, VoceLog } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import { formattaOra } from "../format";
import stili from "./CanaleVale.module.css";

function Voce({ voce }: { voce: VoceLog }) {
  if (voce.fonte === "VALE") {
    return (
      <li className={stili.vale}>
        <span className={stili.mittente}>
          <span className={stili.occhio} aria-hidden="true" />
          V.A.L.E. · {formattaOra(voce.tempo)}
        </span>
        <p>{voce.testo}</p>
      </li>
    );
  }
  return (
    <li className={voce.fonte === "CREW" ? stili.crew : stili.sistema}>
      <time className={stili.ora}>{formattaOra(voce.tempo)}</time>
      <span className={stili.fonte}>{voce.fonte}</span>
      <span>{voce.testo}</span>
    </li>
  );
}

export function CanaleVale({ stato }: { stato: StatoMissione }) {
  // Copia al contrario: .reverse() modificherebbe l'array dello stato!
  const vociInverse = [...stato.log].reverse();

  return (
    <Finestra variante="console" titolo="V.A.L.E. // Canale diretto con il Capitano" className={stili.finestra}>
      <ol className={stili.registro} aria-live="polite" aria-label="Registro della missione">
        {vociInverse.map((voce, i) => (
          // Il log cresce solo in coda: l'indice dall'inizio è stabile.
          <Voce key={stato.log.length - 1 - i} voce={voce} />
        ))}
      </ol>
    </Finestra>
  );
}
