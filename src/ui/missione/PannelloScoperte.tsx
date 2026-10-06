/**
 * ============================================================================
 * PannelloScoperte.tsx — Il registro di ciò che la crew ha scoperto
 * ============================================================================
 *
 * Mostra la CONOSCENZA (stato.conoscenza.scoperte) con titoli e descrizioni
 * presi da content/scoperte.ts, in ordine di scoperta.
 * È il primo seme della Tavola del Capitano (DESIGN §4.4): oggi si legge,
 * nella Fase 3 si potranno collegare le prove tra loro.
 * ============================================================================
 */

import { CATALOGO_SCOPERTE } from "../../content/scoperte";
import type { StatoMissione } from "../../engine/types";
import { Finestra } from "../components/Finestra";
import stili from "./PannelloScoperte.module.css";

export function PannelloScoperte({ stato }: { stato: StatoMissione }) {
  const scoperte = stato.conoscenza.scoperte;

  return (
    <Finestra variante="cornice" titolo="Registro scoperte" destra={String(scoperte.length).padStart(2, "0")}>
      {scoperte.length === 0 ? (
        <p className={stili.vuoto}>Nessuna scoperta registrata.</p>
      ) : (
        <ol className={stili.lista}>
          {scoperte.map((id) => {
            const def = CATALOGO_SCOPERTE[id];
            return (
              <li key={id}>
                <span className={stili.titolo}>{def?.titolo ?? id}</span>
                {def && <span className={stili.descrizione}>{def.descrizione}</span>}
              </li>
            );
          })}
        </ol>
      )}
    </Finestra>
  );
}
