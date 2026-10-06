/**
 * ============================================================================
 * App.tsx — Componente radice di ORBITAL
 * ============================================================================
 *
 * Per ora mostra solo la schermata Missione (vertical slice, Fase 2).
 * Quando arriveranno Preparazione, Terra e Campagna, qui ci sarà la scelta
 * di quale schermata mostrare in base allo stato della campagna.
 * ============================================================================
 */

import { SchermataMissione } from "./ui/missione/SchermataMissione";

export default function App() {
  return <SchermataMissione />;
}
