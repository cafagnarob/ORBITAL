/**
 * ============================================================================
 * SchermataPreparazione.tsx — Prima di partire: crew, moduli, equipaggiamento, stiva
 * ============================================================================
 *
 * Riferimento design: DESIGN.md §7.1 (selezione crew), §11 (loadout),
 * §14.4 (fattibilità).
 *
 * COSA FA
 * Compone i tre pannelli della Preparazione dentro la stessa cornice del
 * monitor della Missione, e la barra di avvio in fondo. Lo stato (le scelte)
 * vive in usePreparazione; questa schermata decide solo DOVE mostrare cosa.
 *
 * LAYOUT (v3.7.4)
 *   La pagina è la NAVE, grande, con a destra il RIEPILOGO. Candidati e
 *   Loadout sono due FINESTRE A COMPARSA (components/FinestraMobile):
 *   si trascinano dalla barra del titolo, si portano in primo piano con un
 *   clic, e con "—" si riducono a ICONA nel dock sotto la nave. Un clic
 *   sull'icona le riapre. Ogni scelta si vede subito "montata" sulla nave.
 *     Desktop (≥ 1100px): nave │ riepilogo; finestre sopra, aperte all'inizio.
 *     Telefono: nave, dock, riepilogo in colonna; le finestre si aprono a
 *       tutto schermo dal dock (all'inizio sono ridotte).
 *   La barra AVVIA MISSIONE resta sempre in fondo.
 *
 * Aperta/ridotta e posizione delle finestre sono stato dell'INTERFACCIA
 * (useFinestre), non della partita.
 *
 * AUDIO
 * L'atmosfera di partenza è "PREPARAZIONE" (hangar). Premendo AVVIA, nello
 * stesso gestore del clic: rombo dei motori, V.A.L.E. conferma la
 * fattibilità e l'inserimento in orbita, l'ambiente passa a "MISSIONE".
 *
 * AVVIO
 * onAvvia riceve le scelte e App.tsx passa alla Missione. Il seed della
 * partita arriva da App: si mostra qui perché è già deciso, e la direttiva
 * di V.A.L.E. verrà sorteggiata con questo seed TRA quelle possibili con il
 * loadout scelto (DESIGN §11.4). Il giocatore non lo sa: vede solo che
 * "cosa porti" cambia "cosa può succedere".
 * ============================================================================
 */

import type { Preparazione } from "../../engine/types"
import { Monitor } from "../cornice/Monitor"
import { useAccensione } from "../cornice/useAccensione"
import { PannelloFrontale } from "../cornice/PannelloFrontale"
import { frasiApertura } from "../../content/missioneIniziale"
import { definizioneMissione } from "../../content/missioni"
import { FRASI_FATTIBILITA } from "../../content/vale"
import { impostaAtmosfera, parla, suona } from "../audio"
import { usePreparazione } from "../usePreparazione"
import { BALANCE } from "../../content/balance"
import { Finestra } from "../components/Finestra"
import { FinestraMobile } from "../components/FinestraMobile"
import { useFinestre } from "../components/useFinestre"
import { DockFinestre, IconaCrew, IconaLoadout } from "./DockFinestre"
import { BarraAvvio } from "./BarraAvvio"
import { NaveSezione } from "./NaveSezione"
import { AvvisoPreparazione } from "./AvvisoPreparazione"
import { candidatiProposti, pezziSuggeriti, preparazioneCasuale } from "../../engine/preparazione"
import { createRng } from "../../engine/rng"
import { LISTA_CANDIDATI } from "../../content/candidati"
import { useState } from "react"
import { PannelloRiepilogo } from "./PannelloRiepilogo"
import stili from "./SchermataPreparazione.module.css"
import { SelezioneCrew } from "./SelezioneCrew"
import { SelezioneLoadout } from "./SelezioneLoadout"

/** Le due finestre a comparsa della Preparazione. */
const FINESTRE = ["candidati", "loadout"] as const
type IdFinestra = (typeof FINESTRE)[number]

/** Su desktop le finestre partono aperte; su telefono ridotte (sarebbero a tutto schermo). */
const apertaAllInizio = () =>
  typeof window === "undefined" ||
  !window.matchMedia("(max-width: 1099px)").matches

interface Props {
  seed: string
  onAvvia: (preparazione: Preparazione) => void
  /** true se si arriva da una missione finita (monitor già spento). */
  daSpento?: boolean
}

export function SchermataPreparazione({
  seed,
  onAvvia,
  daSpento = false,
}: Props) {
  const { prep, dispatch, riepilogo, problemi, fattibilita, piano, cataloghi } =
    usePreparazione(seed)
  // La missione estratta dal seed (v3.8): l'intestazione dice dove si va.
  const missione = definizioneMissione(piano.id)
  // I pezzi da aggiungere, disegnati sulla mappa (v3.9): derivati, non salvati.
  const pezzi = pezziSuggeriti(prep, cataloghi)
  // Il pop-up di avviso: espanso o ridotto a una riga (stato dell'interfaccia).
  const [avvisoEspanso, setAvvisoEspanso] = useState(true)
  const finestre = useFinestre(FINESTRE, apertaAllInizio)
  const p = BALANCE.preparazione
  // Il tubo del monitor: si accende all'avvio del gioco, si spegne al lancio.
  const tubo = useAccensione(daSpento)

  /**
   * Partenza: rombo dei motori, V.A.L.E. conferma; il monitor si spegne e,
   * al buio, si passa alla Missione (che si accenderà già in orbita).
   */
  function avvia() {
    suona("AVVIO")
    parla([FRASI_FATTIBILITA[fattibilita], frasiApertura(piano)[0]])
    impostaAtmosfera("MISSIONE")
    tubo.spegni(() => onAvvia(prep))
  }

  /** Icona del dock: riapre la finestra ridotta, o riduce quella aperta. */
  function alternaFinestra(id: IdFinestra) {
    suona("CLIC")
    if (finestre.stato[id].fase === "APERTA") finestre.riduci(id)
    else finestre.ripristina(id)
  }

  /**
   * "Perché?" nella barra di avvio: riapre il pop-up di avviso (v3.9) e ci
   * porta il fuoco. Il pop-up è già nel DOM (sempre visibile se c'è un
   * problema), quindi lo si può cercare subito, nel gestore.
   */
  function mostraProblemi() {
    suona("CLIC")
    setAvvisoEspanso(true)
    const el = document.getElementById("avviso-preparazione")
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
    el?.focus({ preventScroll: true })
  }

  /**
   * «Carica a caso» (v3.9): una nave completa e valida. Il caso nasce QUI,
   * nel gestore del clic (mai durante il disegno): ogni clic, una nave diversa.
   */
  function caricaCaso() {
    const proposti = candidatiProposti(seed, LISTA_CANDIDATI, p.candidatiProposti).map((m) => m.id)
    const rng = createRng(crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now())
    dispatch({ tipo: "CARICA", preparazione: preparazioneCasuale(cataloghi, proposti, rng) })
  }

  /** Le proprietà comuni a ogni finestra a comparsa. */
  const gestori = (id: IdFinestra) => ({
    stato: finestre.stato[id],
    onPrimoPiano: () => finestre.primoPiano(id),
    onRiduci: () => {
      suona("CLIC")
      finestre.riduci(id)
    },
    onFineRiduzione: () => finestre.fineRiduzione(id),
    onSposta: (x: number, y: number) => finestre.sposta(id, x, y),
  })

  return (
    <Monitor
      frontale={
        <PannelloFrontale
          onApriTerminale={null}
          allerta={false}
          standby={tubo.fase === "SPENTO"}
        />
      }
      fase={tubo.fase}
      onFineTransizione={tubo.fineTransizione}
      didascalia="VALE-OS 4.1 · TERMINALE V.A.L.E. MODELLO 7"
    >
      <div className={stili.schermo}>
        <header className={stili.intestazione}>
          <span className={stili.logo}>ORBITAL</span>
          <span className={stili.sistema}>VALE-OS 4.1 ▸ PREPARAZIONE</span>
          <span className={stili.fase}>PRE-LANCIO</span>
          <span className={stili.destinazione}>
            DESTINAZIONE {missione.nome.toUpperCase()} ·{" "}
            {missione.bersaglio.puntoInteresse}
          </span>
          <span className={stili.seed}>PARTITA {seed}</span>
        </header>

        <main className={stili.area}>
          {/* --- La nave, grande, con il dock delle finestre sotto --- */}
          <div className={stili.palco}>
            <Finestra
              titolo="ORB-1 · Configurazione"
              variante="cornice"
              destra={`${prep.crew.length} A BORDO`}
              className={stili.nave}
            >
              <NaveSezione prep={prep} riepilogo={riepilogo} pezzi={pezzi} />
            </Finestra>
            {/* v3.9: il pop-up WARNING / DANGER, sempre visibile finché qualcosa non va. */}
            <AvvisoPreparazione
              problemi={problemi}
              fattibilita={fattibilita}
              espanso={avvisoEspanso}
              onEspandi={setAvvisoEspanso}
            />
            <DockFinestre
              voci={[
                {
                  id: "candidati",
                  nome: "Candidati",
                  icona: <IconaCrew />,
                  contatore: `CREW ${prep.crew.length}/${p.crewRichiesta}`,
                  fase: finestre.stato.candidati.fase,
                  onClick: () => alternaFinestra("candidati"),
                },
                {
                  id: "loadout",
                  nome: "Loadout",
                  icona: <IconaLoadout />,
                  contatore: `MODULI ${prep.moduli.length}/${p.slotModuli} · EQUIP. ${prep.equipaggiamento.length}/${p.slotEquipaggiamento}`,
                  fase: finestre.stato.loadout.fase,
                  onClick: () => alternaFinestra("loadout"),
                },
              ]}
            />
          </div>

          {/* --- Il riepilogo, sempre visibile --- */}
          <div className={stili.lato}>
            <PannelloRiepilogo
              prep={prep}
              riepilogo={riepilogo}
              fattibilita={fattibilita}
              dispatch={dispatch}
              cataloghi={cataloghi}
              onCaricaCaso={caricaCaso}
            />
          </div>

          {/* --- Le due finestre a comparsa (sopra a tutto, dentro l'area) --- */}
          <FinestraMobile
            titolo="Candidati"
            destra={`CREW ${prep.crew.length}/${p.crewRichiesta}`}
            className={stili.finestraCandidati}
            {...gestori("candidati")}
          >
            <SelezioneCrew prep={prep} dispatch={dispatch} seed={seed} />
          </FinestraMobile>
          <FinestraMobile
            titolo="Loadout"
            destra={`${riepilogo.carico.totale} / ${p.caricoMassimo} KG`}
            className={stili.finestraLoadout}
            {...gestori("loadout")}
          >
            <SelezioneLoadout
              prep={prep}
              riepilogo={riepilogo}
              dispatch={dispatch}
            />
          </FinestraMobile>
        </main>

        <BarraAvvio
          prep={prep}
          riepilogo={riepilogo}
          fattibilita={fattibilita}
          onAvvia={avvia}
          onMostraProblemi={mostraProblemi}
        />
      </div>
    </Monitor>
  )
}
