/**
 * ============================================================================
 * seed.ts — Il seed della partita
 * ============================================================================
 *
 * Ogni nuova partita ha un seed diverso, quindi una direttiva diversa per
 * V.A.L.E.: altrimenti il mistero si "imparerebbe" dopo una partita.
 * Il seed casuale nasce QUI, nell'interfaccia, fuori dal motore: il motore
 * resta deterministico (stesso seed + stessa preparazione → stessa partita).
 *
 * Per rigiocare una partita precisa (playtest, bug) basta aprire il gioco
 * con ?seed=E17-0000 nell'indirizzo.
 *
 * Il seed si sceglie PRIMA della Preparazione (App.tsx) e si mostra in
 * intestazione: così chi segnala un bug può dire "seed X, con questo loadout".
 * ============================================================================
 */

/** Un seed nuovo, casuale, es. "ORB-3FA20C1B". */
export function seedCasuale(): string {
  const numero = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  return `ORB-${numero.toString(16).toUpperCase().padStart(8, "0")}`;
}

/** Il seed dall'indirizzo (?seed=…) oppure uno nuovo, casuale. */
export function seedIniziale(): string {
  const dalUrl = new URLSearchParams(window.location.search).get("seed");
  return dalUrl ? dalUrl.toUpperCase() : seedCasuale();
}
