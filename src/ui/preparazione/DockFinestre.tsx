/**
 * ============================================================================
 * DockFinestre.tsx — La fila di icone delle finestre (Candidati, Loadout)
 * ============================================================================
 *
 * Come la barra delle applicazioni di un vecchio sistema operativo:
 *   - finestra RIDOTTA  → l'icona è "spenta"; un clic la riaccende;
 *   - finestra APERTA   → l'icona è accesa; un clic la riduce.
 * Ogni icona porta anche un contatore (CREW 2/4, MODULI 1/4…): si vede cosa
 * manca senza aprire niente.
 *
 * aria-expanded dice allo screen reader se la finestra è aperta.
 * ============================================================================
 */

import type { ReactNode } from "react";
import type { FaseFinestra } from "../components/useFinestre";
import stili from "./DockFinestre.module.css";

export interface VoceDock {
  id: string;
  nome: string;
  icona: ReactNode;
  contatore: string;
  fase: FaseFinestra;
  onClick: () => void;
}

export function DockFinestre({ voci }: { voci: VoceDock[] }) {
  return (
    <nav className={stili.dock} aria-label="Finestre">
      {voci.map((v) => {
        const aperta = v.fase === "APERTA";
        return (
          <button
            key={v.id}
            type="button"
            className={`${stili.icona} ${aperta ? stili.accesa : ""}`}
            aria-expanded={aperta}
            title={aperta ? `Riduci ${v.nome}` : `Apri ${v.nome}`}
            onClick={v.onClick}
          >
            <span className={stili.simbolo} aria-hidden="true">
              {v.icona}
            </span>
            <span className={stili.nome}>{v.nome}</span>
            <span className={stili.contatore}>{v.contatore}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Icona dei candidati: tre sagome (testa e spalle). */
export function IconaCrew() {
  return (
    <svg viewBox="0 0 32 24">
      <circle cx="16" cy="8" r="4.5" />
      <path d="M8 22 C8 15 24 15 24 22" />
      <circle cx="6.5" cy="10" r="3" />
      <path d="M1 22 C1 17 9 16 10 18" />
      <circle cx="25.5" cy="10" r="3" />
      <path d="M31 22 C31 17 23 16 22 18" />
    </svg>
  );
}

/** Icona del loadout: una cassa con le cinghie. */
export function IconaLoadout() {
  return (
    <svg viewBox="0 0 32 24">
      <rect x="4" y="5" width="24" height="16" />
      <path d="M4 10 H28 M12 5 V21 M20 5 V21" />
    </svg>
  );
}
