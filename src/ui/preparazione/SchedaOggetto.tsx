/**
 * ============================================================================
 * SchedaOggetto.tsx — Un modulo o un equipaggiamento, da scegliere con un clic
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §11.2 — le sei domande di ogni oggetto.
 * La scheda risponde a quelle che il motore conosce già:
 *   cosa permette di fare     → descrizione + SBLOCCA (task che lo richiedono)
 *   quanto costa              → peso (kg) ed effetti sull'energia
 *   cosa cambia nella nave    → effetti (energia, stiva, riposo, integrità…)
 *   cosa farà più avanti      → IN ARRIVO (effetti non ancora nel motore)
 * I tag (SCANSIONE, DRONE…) sono le capacità portate a bordo.
 *
 * Componente "di presentazione": non conosce cataloghi né reducer. Riceve
 * testi già pronti e un onClick, quindi va bene sia per i moduli sia per
 * l'equipaggiamento (e domani per gli oggetti in vendita sulla Terra).
 * ============================================================================
 */

import { etichetta } from "../format";
import stili from "./SchedaOggetto.module.css";

interface Props {
  nome: string;
  peso: number;
  descrizione: string;
  /** Righe già formattate, es. "ENERGIA +6/g". */
  effetti: string[];
  /** Nomi dei task che questo oggetto rende possibili. */
  sblocca: string[];
  tag: string[];
  inArrivo: string | null;
  scelto: boolean;
  disattivato: boolean;
  onClick: () => void;
}

export function SchedaOggetto(props: Props) {
  const { nome, peso, descrizione, effetti, sblocca, tag, inArrivo, scelto, disattivato, onClick } = props;
  return (
    <button type="button" className={stili.scheda} aria-pressed={scelto} disabled={disattivato} onClick={onClick}>
      <span className={stili.testa}>
        <span className={stili.casella} aria-hidden="true">
          {scelto ? "▣" : "□"}
        </span>
        <span className={stili.nome}>{nome}</span>
        <span className={stili.peso}>{peso} kg</span>
      </span>

      <span className={stili.descrizione}>{descrizione}</span>

      {effetti.length > 0 && <span className={stili.effetti}>{effetti.join(" · ")}</span>}
      {sblocca.length > 0 && <span className={stili.sblocca}>SBLOCCA ▸ {sblocca.join(", ")}</span>}
      {inArrivo !== null && <span className={stili.inArrivo}>IN ARRIVO ▸ {inArrivo}</span>}

      <span className={stili.tag}>
        {tag.map((t) => (
          <span key={t}>{etichetta(t)}</span>
        ))}
      </span>
    </button>
  );
}
