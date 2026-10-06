/**
 * ============================================================================
 * SchermataIngresso.tsx — La schermata del titolo: ORBITAL e "Inizia missione"
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §16.5 (design system VALE-OS), §16.5.1.
 *
 * È il terminale V.A.L.E. appena acceso, prima che la missione esista:
 *   - in alto, la riga di sistema (come l'intestazione della Missione);
 *   - al centro, il logo ORBITAL sopra E-17 che ruota, con la nave in orbita;
 *   - a sinistra, il registro di avvio che si scrive da solo, riga per riga.
 *     Una riga dice "DIRETTIVA INTERNA ... [RISERVATO]": il mistero comincia
 *     prima ancora di giocare;
 *   - il menu: INIZIA MISSIONE, il SEED (per rigiocare una partita precisa),
 *     l'interruttore AUDIO.
 *
 * PERCHÉ UN <form>
 * Il seed e il pulsante d'inizio stanno in un form: premere INVIO nel campo
 * del seed (o ovunque sul pulsante) avvia la missione. È il comportamento
 * nativo del browser: niente ascoltatori della tastiera, niente useEffect.
 *
 * ACCENSIONE
 * Come ogni schermata, nasce accendendo il tubo (useAccensione). INIZIA
 * MISSIONE spegne il monitor e, al buio, si passa alla Preparazione.
 * ============================================================================
 */

import { useState, type FormEvent } from "react";
import { impostaAtmosfera, interruttoreAudio, sbloccaAudio, suona, useVolumi } from "../audio";
import { Monitor } from "../cornice/Monitor";
import { PannelloFrontale } from "../cornice/PannelloFrontale";
import { useAccensione } from "../cornice/useAccensione";
import { GloboOrbita } from "./GloboOrbita";
import stili from "./SchermataIngresso.module.css";

/** Le righe del registro di avvio: compaiono una dopo l'altra (CSS). */
const AVVIO: [string, string][] = [
  ["CONTROLLO MEMORIA", "OK"],
  ["NUCLEO V.A.L.E.", "ONLINE"],
  ["SUPPORTO VITALE", "NOMINALE"],
  ["NAVIGAZIONE", "STABILE"],
  ["DESTINAZIONE", "E-17"],
  ["CREW MANIFEST", "IN ATTESA"],
  ["DIRETTIVA INTERNA", "[RISERVATO]"],
];

interface Props {
  /** Il seed proposto (casuale, o quello dell'indirizzo ?seed=). */
  seed: string;
  onInizia: (seed: string) => void;
  /** true se si arriva da una missione appena finita (monitor già spento). */
  daSpento?: boolean;
}

export function SchermataIngresso({ seed, onInizia, daSpento = false }: Props) {
  const tubo = useAccensione(daSpento);
  // Il campo del seed è stato dell'interfaccia finché non si preme INIZIA.
  const [testoSeed, setTestoSeed] = useState(seed);
  const volumi = useVolumi();
  const audioAcceso = volumi.ambiente > 0 || volumi.voce > 0;

  function inizia(evento: FormEvent) {
    evento.preventDefault();
    sbloccaAudio(); // è un clic: l'audio, se acceso, può partire
    suona("CONFERMA");
    impostaAtmosfera("PREPARAZIONE");
    // Seed: maiuscolo e senza spazi; vuoto → quello proposto.
    const scelto = testoSeed.trim().toUpperCase().replace(/\s+/g, "-") || seed;
    tubo.spegni(() => onInizia(scelto));
  }

  return (
    <Monitor
      frontale={<PannelloFrontale onApriTerminale={null} allerta={false} standby={tubo.fase === "SPENTO"} />}
      fase={tubo.fase}
      onFineTransizione={tubo.fineTransizione}
      didascalia="VALE-OS 4.1 · TERMINALE V.A.L.E. MODELLO 7"
    >
      <div className={stili.schermo}>
        <header className={stili.intestazione}>
          <span>VALE-OS 4.1 ▸ TERMINALE MODELLO 7</span>
          <span className={stili.collegamento}>COLLEGAMENTO · ORB-1 · ORBITA DI PARCHEGGIO</span>
        </header>

        <main className={stili.centro}>
          <div className={stili.scena}>
            <GloboOrbita className={stili.globo} />
            <h1 className={stili.titolo}>
              ORBITAL
              <span className={stili.cursore} aria-hidden="true">
                _
              </span>
            </h1>
            <p className={stili.sottotitolo}>
              Una missione. Quattro persone. Un'intelligenza che non dice tutto.
            </p>
          </div>

          <ol className={stili.avvio} aria-label="Registro di avvio">
            {AVVIO.map(([voce, esito], i) => (
              // Ogni riga compare dopo la precedente (ritardo crescente).
              <li key={voce} style={{ animationDelay: `${1.4 + i * 0.35}s` }}>
                <span className={stili.voce}>&gt; {voce}</span>
                <span className={stili.puntini} aria-hidden="true" />
                <span className={esito === "[RISERVATO]" ? stili.riservato : stili.esito}>{esito}</span>
              </li>
            ))}
          </ol>

          <form className={stili.menu} onSubmit={inizia}>
            <button type="submit" className={stili.inizia} autoFocus>
              <span className={stili.freccia} aria-hidden="true">
                ▶
              </span>
              Inizia missione
            </button>

            <label className={stili.campoSeed}>
              <span>SEED</span>
              <input
                value={testoSeed}
                onChange={(e) => setTestoSeed(e.target.value)}
                maxLength={24}
                spellCheck={false}
                autoComplete="off"
                aria-describedby="nota-seed"
              />
            </label>
            <p id="nota-seed" className={stili.nota}>
              Lo stesso seed rigioca la stessa partita. Cambialo per una storia nuova.
            </p>

            <button type="button" className={stili.audio} aria-pressed={audioAcceso} onClick={interruttoreAudio}>
              AUDIO · {audioAcceso ? "ACCESO" : "SPENTO"}
            </button>
            <p className={stili.nota}>Il volume si regola con le manopole AMB e VOCE sulla cornice.</p>
          </form>
        </main>

        <footer className={stili.piede}>
          <span className={stili.lampeggia}>PREMI INVIO PER INIZIARE</span>
          <span>ORBITAL · PROTOTIPO v3.2</span>
        </footer>
      </div>
    </Monitor>
  );
}
