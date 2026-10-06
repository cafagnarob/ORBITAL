/**
 * ============================================================================
 * main.tsx — Punto di ingresso: carica gli stili globali e monta React
 * ============================================================================
 *
 * L'ordine degli import CSS conta: prima i token (le variabili), poi gli
 * stili di base che li usano.
 * ============================================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./ui/styles/tokens.css";
import "./ui/styles/base.css";

const radice = document.getElementById("root");
if (!radice) throw new Error("Elemento #root non trovato in index.html");

createRoot(radice).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
