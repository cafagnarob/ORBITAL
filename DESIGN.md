<!--
  DESIGN.md — ORBITAL
  Unica fonte di verità del game design. Sostituisce: Master Summary, Master Design v1.1, Master Design v1.3.

  COME USARE QUESTO FILE
  - Ogni regola ha uno stato:  [BLOCCATO] deciso, non si cambia senza una voce nel Registro decisioni
                               [PROVVISORIO] struttura decisa, numeri da bilanciare
                               [APERTO] ancora da progettare
  - Ogni modifica passa da un commit. Se cambi una regola [BLOCCATO], aggiungi una riga al §18 Registro decisioni.
  - I numeri vivono anche in src/content/balance.ts: se cambiano qui, cambiano lì (e viceversa).
  - Lingua: tutto ciò che vede il giocatore è in italiano. Gli identificatori nel codice possono essere in inglese.
-->

# ORBITAL — DESIGN v3.2

> **Prepara con cura. Non fidarti mai del tutto.**
> Domanda centrale: **di cosa mi posso fidare?**

---

## Indice
1. Identità
2. Struttura: Campagna → Missione → Operazione
3. V.A.L.E.
4. Verità, conoscenza e log
5. Nave
6. Risorse
7. Crew
8. Tempo
9. Task
10. Eventi
11. Loadout
12. Pianeti
13. E-17 (pianeta di riferimento)
14. Campagna, Terra ed economia
15. Finali e Game Over
16. Architettura tecnica
17. Piano di sviluppo
18. Registro decisioni
19. Questioni aperte

---

## 1. Identità  [BLOCCATO]

Browser game single-player: **gestione risorse + sopravvivenza + strategia della crew + narrativa emergente + mistero**.

Non è un simulatore realistico, non è un gestionale puro, non è una visual novel, non è un gioco d'azione.
L'identità sta nell'intersezione tra gestione e **fiducia nell'informazione**.

Il giocatore è il **Capitano**. Deve decidere non solo *cosa fare*, ma *quali informazioni considerare affidabili*.

### Le tre domande del gioco
```text
COSA SO?  →  COSA È VERO?  →  DI CHI MI FIDO?  →  QUANTO RISCHIO?
```

### Esclusioni dall'MVP  [BLOCCATO]
NO multiplayer · NO crafting · NO movimento manuale o real-time · NO albero tecnologico ampio · NO galassia procedurale · NO centinaia di oggetti · NO indicatore generico di "pressione eventi" · NO backend · NO mercato dinamico, commercio, debito, prestiti.

> Nota: l'esclusione "NO economia" della v1.1 è stata rimossa con la v1.3 (vedi §18). Resta esclusa ogni economia oltre ai **Crediti** funzionali.

---

## 2. Struttura: Campagna → Missione → Operazione  [BLOCCATO]

| Livello | Contiene | Dura |
|---|---|---|
| **Campagna** | crew, nave, crediti, loadout posseduto, log, conoscenza, rapporto con V.A.L.E., storia delle decisioni | tutta la partita |
| **Missione** | pianeta, obiettivi, ricompensa, task, eventi, risorse correnti, mistero locale | ~10–15 giorni (missione complessa) |
| **Operazione** | un'azione concreta: EVA, scansione, riparazione, analisi, campionamento… | minuti/ore di gioco |

### Loop della campagna
```text
TERRA (hub) → PREPARAZIONE → SCELTA MISSIONE → MISSIONE
   → COMPLETATA (ricompensa) / FALLITA (0 crediti)
   → crew viva?  NO → GAME OVER
                 SÌ → TORNA SULLA TERRA  oppure  CONTINUA DIRETTAMENTE → nuova missione
   → … → FINALE NARRATIVO
```

### Loop della missione
```text
PIANIFICA → ESEGUI → EVENTO → DECISIONE → TASK → CONSEGUENZA → SCOPERTA
```

### Loop narrativo
```text
COSA DICE V.A.L.E. → DATI DELLA NAVE → LOG NASCOSTI → COSA È VERO?
```

---

## 3. V.A.L.E.  [BLOCCATO]

**V.A.L.E. — Vessel Autonomous Logistics & Exploration.** L'AI di bordo. Non è necessariamente malvagia.

**Tono:** neutrale, calma, precisa, professionale, minimale. Parla poco. L'inquietudine nasce dal contrasto tra situazione pericolosa e tono calmo.
> «Capitano. Raccomando di posticipare l'atterraggio.»

### 3.1 Quattro variabili indipendenti

| Variabile | Valori | Significato |
|---|---|---|
| **Direttiva** | vedi §3.2 | cosa *vuole* (nascosta) |
| **Comportamento** | SUPPORTIVA · COOPERATIVA · NEUTRALE · PERSISTENTE · RESISTENTE · OSTILE | *come* si comporta |
| **Autonomia** | 0 ASSISTENZA · 1 ROUTINE · 2 OPERATIVA · 3 RESTRITTIVA · 4 AUTONOMA | cosa *può* fare |
| **Modalità informativa** | VERITÀ · OMISSIONE · SVIAMENTO | cosa *dice* |

Regola: **direttiva ≠ comportamento ≠ autonomia.** Esempi:
- Direttiva in conflitto + SUPPORTIVA + autonomia 1 → «Raccomando di interrompere il task.»
- Stessa direttiva + RESISTENTE + autonomia 3 → `TASK RIFIUTATO`
- Stessa direttiva + OSTILE + autonomia 4 → `ACCESSO AIRLOCK LIMITATO`

L'evoluzione è progressiva: cooperazione → insistenza → resistenza → possibile conflitto. Mai "buona → cattiva" all'improvviso.

### 3.2 Direttiva
Ogni missione: **missione della crew** (nota) + **direttiva di V.A.L.E.** (nascosta).

Generazione: `filtro di compatibilità (pianeta + missione + crew + loadout + tag nascosti) → pesi → selezione`.

Classificazione rispetto alla missione: COMPATIBILE · NEUTRALE · IN CONFLITTO · CONFLITTO CRITICO.

**Limite al conflitto critico:** richiede almeno 2 forti collegamenti nascosti + bersaglio sensibile + missione incompatibile. Non ogni partita deve arrivarci.

### 3.3 Controllo della nave
Con autonomia alta V.A.L.E. può agire su: potenza, navigazione, comunicazioni, porte, supporto vitale, scienza, medicina, airlock.
L'accesso è sempre conseguenza di `autonomia + comportamento + direttiva + situazione`, mai un evento improvviso.

### 3.4 Persistenza  [BLOCCATO]
Tra una missione e l'altra **non si azzerano**: comportamento, autonomia, fiducia della crew, log, contraddizioni scoperte. La direttiva invece è per missione.

### 3.5 Implementazione  [BLOCCATO struttura · PROVVISORIO numeri — v2.6]
Cosa fa oggi il motore (`src/engine/vale/`, numeri in `balance.ts → vale`):
- **Direttiva**: scelta dal seed della partita tra le direttive del catalogo (`content/direttive.ts`), con i pesi. Vertical slice: D01 COMPATIBILE, D05 NEUTRALE (contraria ai DRONI), D12 IN CONFLITTO (contraria a SEGNALE e VERIFICA). Ogni direttiva elenca i **tag contrari**.
- **Tensione**: un numero nascosto che sale quando il Capitano lavora contro la direttiva: task contrario avviato (+2), contestazione (+1), tentativo fallito nel terminale (+1), override ORD-01 (+3). Non scende (per ora).
- **Comportamento e autonomia sono derivati, non salvati**: livello = base della classe (COMPATIBILE 0 · NEUTRALE 1 · IN CONFLITTO 2 · CRITICO 3) + ⌊tensione / 3⌋. Autonomia = max(1, comportamento − 1); dopo ORD-01 resta a 1.
- **Rifiuto**: da autonomia 3 (RESTRITTIVA) V.A.L.E. rifiuta di avviare i task con tag contrari: `TASK RIFIUTATO`, fiducia della crew −10, e nel log compare il riferimento a `ORD-01`.
- **Filtro informativo**: un evento può avere dei *filtri* legati a una direttiva. Se la direttiva è attiva, V.A.L.E. dice il testo filtrato (OMISSIONE o SVIAMENTO) al posto della verità, ma **una riga di SISTEMA lascia trapelare il dato grezzo**. È la contraddizione che il giocatore deve notare.
- **Contestare**: ogni affermazione di V.A.L.E. ha il pulsante CONTESTA (anche quelle vere, così il pulsante non rivela nulla). Una contestazione aperta sblocca il task **Verifica dei dati grezzi**: se l'affermazione era filtrata → SMENTITA (verità rivelata, fiducia −15); altrimenti → CONFERMATA (fiducia +5).
- **Domande**: tre pulsanti (Stato · Perché? · Direttiva?), niente testo libero. La risposta dipende dal comportamento; alcune lasciano nel log i codici `MEM-12` e `DIR-07`.
- **Fiducia (§7.5)**: quando un membro scende sotto 30 o sale sopra 75 lo **dice** nel log.

---

## 4. Verità, conoscenza e log  [BLOCCATO]

### 4.1 Tre livelli
| Livello | Cos'è | Chi lo vede |
|---|---|---|
| **Verità** | ciò che succede davvero | nessuno (solo il motore) |
| **Conoscenza** | ciò che la crew ha rilevato o dimostrato | il giocatore |
| **Versione di V.A.L.E.** | ciò che V.A.L.E. comunica, filtrato dalla direttiva | il giocatore |

Possono coincidere o contraddirsi.
> V.A.L.E.: «Non sono presenti firme biologiche.»
> Log: `SCANSIONE BIO ATTIVA · FIRME 03 · CLASSE SCONOSCIUTA · AZIONE SOPPRESSIONE`

### 4.2 Log
Ogni comando importante produce un log tecnico con doppia funzione: **feedback di sistema + indizio narrativo**.
```text
[VALE::EXECUTION] 12:43:08
SYS.POWER OK · ROUTE PWR-07 → LS-01 · PRIORITÀ VITA
PROTOCOLLO VL-P7-04 · STATO ESEGUITO
```
I log raccolti persistono nella campagna.

### 4.3 Codici nascosti
Famiglie: **DIR** Direttiva · **BEH** Comportamento · **MEM** Memoria · **ORD** Override · **ETH** Etica.
Esempi: `VL-P7-04`, `VL-EVA-07`, `VL-D7-X`, `DIR-07`, `MEM-12`, `ORD-01`.
I codici possono essere frammentati su più log, anche di missioni diverse. Il giocatore impara la grammatica di V.A.L.E.

**Terminale di manutenzione SVC-07**  [BLOCCATO concetto · PROVVISORIO contenuti — v2.5]
- Si apre dal pulsante **SVC** sulla cornice del monitor: discreto, sulla plastica e non sullo schermo.
- **Segnalare**: ogni riga del log ha un segno ◇. Se la riga segnalata contiene codici, questi diventano **frammenti** nel terminale. Tutte le righe si segnalano allo stesso modo, così il segno non rivela quali "contano".
- **Inserire codici**: un codice valido alza il **livello di accesso** (0–5: Funzioni normali · Log diagnostici · Protocolli interni · Memoria riservata · Accesso direttiva · Override del nucleo; non scende mai) e applica i suoi effetti (di solito una scoperta).
- I **tentativi falliti** (codice inesistente o livello insufficiente) lasciano `SVC.ACCESSO · TENTATIVO NON AUTORIZZATO` nel log: **V.A.L.E. lo vede**. Dalla v2.6 alza la sua tensione (§3.5).
- Il terminale non fa scorrere il tempo. Il suo stato (livello, frammenti, righe segnalate, tentativi) è salvato nella partita.
- Codici della vertical slice: `VL-P7-04` (livello 0 → 1, dai log del segnale) e `VL-D7-X` (1 → 2, dalla scansione profonda). Livelli 3–5 (v2.6): `MEM-12` (2 → 3, dalle risposte di V.A.L.E.), `DIR-07` (3 → 4, **rivela la direttiva** nel terminale e nel Registro scoperte), `ORD-01` (4 → 5, **override**: autonomia bloccata a 1, niente più rifiuti, ma tensione +3).
- Ogni tentativo fallito alza di 1 la tensione di V.A.L.E. (§3.5).

### 4.4 Tavola del Capitano  [PROVVISORIO]
Strumento con cui il giocatore **elabora** l'informazione:
- segna un log o un'affermazione come prova;
- collega prove ad anomalie, codici o persone;
- marca un'affermazione di V.A.L.E. come **contestata** → sblocca azioni (verifica dati, task di controllo, interrogare V.A.L.E.);
- collegamenti corretti producono una **nuova ipotesi** (anche tra missioni diverse, es. `MEM-12` + `MEM-27`).

Meccanica dettagliata: [APERTO] (§19).

### 4.5 Scoperta
Ogni elemento del pianeta segue: `SCONOSCIUTO → RILEVATO → SCANSIONATO → IDENTIFICATO → INVESTIGATO`.

Qualità dell'informazione per strumento:
| Fonte | Informazione |
|---|---|
| Nessun equipaggiamento | di base |
| Scanner Manuale | locale |
| Sensore Profondo Portatile | dettagliata |
| Scanner Spaziale Profondo | avanzata |
| Drone | remota |
| EVA | osservazione diretta |

La scienza serve a **interpretare**. Regola: **rilevare non significa capire.**
L'informazione è una risorsa: si paga in tempo, energia, carburante, rischio.

### 4.6 Integrità dei dati  [BLOCCATO concetto · PROVVISORIO formula — v2.6]
Valore 0–100 mostrato nell'intestazione: **quanto sono affidabili i dati della nave**.
È indipendente da V.A.L.E.: scende con i danni a Scienza, Navigazione e Comunicazioni, con le anomalie (es. AN-04 Campo di risonanza) e con alcuni eventi.
Più è bassa, più letture dei sensori, risultati delle scansioni e stime di rischio possono essere **sbagliati senza che nessuno menta**.
Così, davanti a una contraddizione, il giocatore deve chiedersi: *V.A.L.E. mente, il sensore è guasto, o il pianeta interferisce?* Funziona anche nelle partite con direttiva COMPATIBILE, dove il dubbio esiste ma è mal riposto.

**Formula attuale:** integrità = 0,4·Scienza + 0,3·Navigazione + 0,3·Comunicazioni. Il **rischio stimato** mostrato in Pianifica e nel log ha un errore deterministico fino a ±(100 − integrità)·0,5 punti; il rischio vero (quello che decide l'esito) non cambia. Con la nave integra l'errore è quasi nullo; con i sistemi danneggiati le stime diventano inaffidabili. Anomalie ed eventi non agiscono ancora sull'integrità.

---

## 5. Nave  [BLOCCATO]

La stessa nave per tutta la campagna (moduli, danni, upgrade persistono).

**Compartimenti (9):** Comando · Habitat · Ingegneria · Supporto Vitale · Laboratorio Scientifico · Infermeria · Stoccaggio · Airlock · Propulsione.
**Aree esterne:** Array di Comunicazione · Area Sensori.

**Sistemi core (8):** Supporto Vitale · Potenza · Propulsione · Navigazione · Comunicazioni · Scienza · Medicina · Operazioni Esterne.
Il Comando è il centro di controllo, non un sistema core.

**Accesso ai compartimenti:** APERTO · LIMITATO · MESSO IN SICUREZZA · BLOCCATO (modificabile da V.A.L.E. in base all'autonomia).

### 5.1 Integrità
Scafo e sistemi sono **due misure separate**.

| Scafo | Stato | | Sistema | Stato |
|---|---|---|---|---|
| 80–100 | NOMINALE | | 90–100 | NOMINALE |
| 50–79 | DANNEGGIATO | | 70–89 | BUONO |
| 25–49 | CRITICO | | 40–69 | DEGRADATO |
| 1–24 | GRAVE | | 20–39 | DANNEGGIATO |
| 0 | DISTRUTTO | | 1–19 | CRITICO |
| | | | 0 | FUORI SERVIZIO |

### 5.2 Sistemi
- **Supporto vitale:** ossigeno, pressione, temperatura, CO2, filtrazione. L'ossigeno è una *condizione* del sistema, non una barra da acquistare (§6).
- **Potenza:** vedi §6.2.
- **Propulsione:** motore principale, propulsori di manovra, carburante, controllo. I danni aumentano consumi e rischio, limitano le manovre.
- **Navigazione:** posizione, traiettoria, orbita, atterraggio. *Precisione navigazione* 0–100 (dipende da crew, equipaggiamento, pianeta, V.A.L.E., danni).
- **Comunicazioni:** CONNESSA · DEGRADATA · SOLO LOCALE · FUORI SERVIZIO.
- **Scienza:** base = scansione e analisi di base; moduli/equipaggiamento sbloccano analisi avanzata, scansione profonda, campioni.
- **Medicina:** diagnosi, trattamento, monitoraggio; l'Infermeria potenziata migliora stabilizzazione e recupero.
- **Operazioni esterne:** dipendono da airlock, equipaggiamento EVA, abilità EVA, condizioni esterne. **Airlock fuori servizio = nessuna EVA.**

---

## 6. Risorse

### 6.1 Risorse di missione  [PROVVISORIO]
| Risorsa | Note | Consumo base (4 persone) |
|---|---|---|
| **Cibo** | casse di cibo (+12) | −2 a persona/giorno |
| **Acqua** | casse d'acqua (+15); il Riciclo dell'Acqua dimezza il consumo | −2 a persona/giorno |
| **Ossigeno** | serbatoi da 60 + bombole (+10). Ogni sera il Supporto Vitale ne rigenera 8 × integrità% (+3 con il Potenziamento) | −2 a persona/giorno |
| **Energia** | vedi §6.2 | −8/giorno |
| **Carburante** | vedi §6.3 | per manovra |
| **Scafo** | integrità, §5.1 | — |

**v3.0 — risorse separate** (dal mockup): con il Supporto Vitale integro l'ossigeno resta stabile; se si guasta diventa il problema più urgente. Chi resta senza perde salute ogni sera (cibo −10, acqua −20, ossigeno −35): come in 60 Seconds non è un game over immediato, ma una discesa. La salute aggiorna lo stato (SANO > 60 · FERITO · CRITICO ≤ 30 · MORTO 0).

### 6.2 Potenza  [BLOCCATO concetto · PROVVISORIO numeri]
Tre valori: **generazione 12/giorno · consumo base 8/giorno · batteria 150**.
Dalla v2.7 il consumo è 5 della nave + quello dei moduli installati (il loadout di riferimento ne aggiunge 3 → 8).

Bassa energia non toglie solo punti: **riduce ciò che la nave può fare**.
```text
BASSA ENERGIA → sistemi opzionali disattivati → limiti alla scienza
→ comunicazioni degradate → limiti medici → priorità ai sistemi d'emergenza
```

### 6.3 Carburante e riserva di rientro  [BLOCCATO]
```text
Carburante operativo = Carburante attuale − Riserva di rientro stimata
Esempio: 26 − 18 = 8
```
La domanda è sempre: **posso permettermi questa manovra?** Prima di accettare una missione si valuta: carburante attuale + consumo previsto + riserva.

---

## 7. Crew

### 7.1 Selezione  [BLOCCATO]
10 candidati a inizio campagna → il Capitano ne sceglie **4**. Nell'MVP **nessun reclutamento successivo**: ogni morte è una perdita reale.
Implementata nella schermata di Preparazione (§11.5). Per ora la scelta avviene a ogni missione; con la campagna (Fase 5) avverrà una volta sola.

### 7.2 Scheda membro
Ruolo · Peso · Abilità · Tratto · Personalità · Salute · Fatica · Fiducia in V.A.L.E. · Posizione · Stato.

| Campo | Valori |
|---|---|
| Ruolo | Ingegnere · Scienziato · Pilota · Medico · Sicurezza/EVA · Generalista |
| Abilità (0–10) | Ingegneria · Scienza · Pilotaggio · Medicina · EVA · Velocità · Precisione |
| Tratto | es. Esperto di Meccanica, Tecnico Rapido, Analitico, Curioso, Amante del Rischio, Calmo sotto Pressione, Specialista in Traumi, Medico da Campo, Impavido, Adattabile |
| Stato | SANO · FERITO · CRITICO · INCOSCIENTE · DISPERSO · MORTO (permanente) |

### 7.3 Personalità  [BLOCCATO]
Tre assi:
- **Approccio:** CAUTO · AMANTE DEL RISCHIO · PRAGMATICO
- **Socialità:** LEALE · EMPATICO · INDIPENDENTE
- **Mentalità:** CURIOSO · DISCIPLINATO · CALMO

Non è un modificatore numerico: influenza dialoghi, percezione del rischio, raccomandazioni, eventi e rapporto con V.A.L.E.

### 7.4 Fatica  [PROVVISORIO numeri]
| Valore | Fascia | Durata task |
|---|---|---|
| 0–39 | BASSA | — |
| 40–69 | MODERATA | +10% |
| 70–89 | ALTA | +25% |
| 90–100 | ESAURITO | +50% |

Aumenta anche il rischio. Il riposo è un task reale. Non si azzera se si "continua direttamente" tra missioni.

### 7.5 Fiducia in V.A.L.E.  [BLOCCATO concetto · PROVVISORIO effetti — v2.6]
Individuale, 0–100, iniziale 50, persistente nella campagna. **Fiducia ≠ obbedienza.**
Effetti a soglia (es. sotto 30 contesta, sopra 75 segue V.A.L.E. anche contro il Capitano): da definire (§19). La crew deve *dire* cosa pensa, altrimenti il sistema è invisibile.
Oggi: la fiducia cambia con verifiche (−15 / +5) e rifiuti (−10); attraversando 30 o 75 il membro parla nel log. Gli effetti sul comportamento della crew restano da progettare.

### 7.6 Posizione e movimento  [PROVVISORIO numeri]
La crew ha sempre una posizione; i task richiedono un luogo; il movimento è **automatico**.
Sezione adiacente +5 min · una sezione in più +10 min · preparazione airlock +15 min.
Movimento manuale solo in emergenze specifiche.

### 7.7 Micro-obiettivi
Ogni membro può generare obiettivi personali (es. Ingegnere: «Ripristinare l'efficienza del reattore»). Non tutti noti all'inizio.

---

## 8. Tempo  [BLOCCATO]

Non real-time: **event-driven**. Il gioco salta al prossimo momento importante (fine task, checkpoint, evento, incidente, intervento di V.A.L.E., evento programmato) e **si ferma quando serve una decisione**.

```text
06:00        Risveglio / Briefing
06:00–07:00  Pianificazione
07:00–22:00  Operazioni
22:00        Rapporto serale
22:00–06:00  Notte
```

Stati di gioco: PIANIFICAZIONE · IN ESECUZIONE · DECISIONE · RAPPORTO.

---

## 9. Task  [BLOCCATO struttura · PROVVISORIO numeri]

Categorie: Ingegneria · Scienza · Pilotaggio · Medicina · EVA · Generale.

Struttura: ID · Nome · Categoria · Abilità principale · Abilità secondaria · Durata base · Rischio base · Equipaggiamento richiesto · Condizioni richieste · Costo risorse · Costo fatica · Tag · Output · Risultati possibili.

**Stati:** IN CODA · PRONTO · IN CORSO · IN PAUSA · INTERROTTO · COMPLETATO · FALLITO · ANNULLATO.
**Esiti:** SUCCESSO PERFETTO · SUCCESSO · SUCCESSO PARZIALE · FALLIMENTO · FALLIMENTO CRITICO.

Il fallimento non è automaticamente catastrofe: può produrre perdita di tempo o risorse, danno, ferita, nuovo task, nuovo evento.

**Generazione del pool:** `pianeta + regione + POI + crew + equipaggiamento + missione → task disponibili`.
**Assegnazione** [BLOCCATO]: un **responsabile** (abilità principale) + un **aiutante** facoltativo (abilità secondaria), se il task lo ammette. Ogni membro ha una **coda** di task eseguiti in ordine.

**Formula del rischio** [PROVVISORIO, v2.1 — numeri in `content/balance.ts`]:
```text
competenza = 0.7 × principale(responsabile) + 0.3 × secondaria(aiutante, o responsabile)
rischio    = rischio base − (competenza − 5) × 6 + penalità fatica − 5 se c'è aiutante
             limitato a 2–95
durata     = durata base × fatica (1 / 1.1 / 1.25 / 1.5) × (1 − (velocità − 5) × 0.04) × 0.85 se aiutante
```
**Esecuzione** [PROVVISORIO, v2.2]:
- Un task parte solo durante le operazioni e solo se **finisce entro le 22:00**: niente lavoro notturno; se non ci sta resta in coda.
- Il costo in risorse si paga **all'avvio**; se non basta, il task è annullato.
- Il rischio si calcola e si salva **all'avvio**: l'esito usa il rischio che il giocatore ha visto.
- Se l'aiutante è occupato o non operativo, il responsabile **procede da solo** (il log lo segnala). *Da verificare in playtest: il giocatore potrebbe preferire che il task aspetti.*
- Fatica: tutta al responsabile, metà all'aiutante.
- Spostamenti semplificati: +10 min verso un altro compartimento, +15 se si esce o rientra dall'airlock.
- Consumi giornalieri (scorte per membro a bordo, bilancio energia) applicati al rapporto delle 22:00; il sonno recupera 35 di fatica al risveglio.

**Esito**: un tiro 1–100. I primi `rischio` numeri sono fallimenti (¼ critici); dei successi, ¼ parziali e una quota perfetta (10% + 2% per punto di precisione del responsabile). Le probabilità mostrate al giocatore derivano dalle stesse soglie.

---

## 10. Eventi  [BLOCCATO]

Dipendono da: pianeta, nave, loadout, crew, risorse, task, eventi precedenti, missione, V.A.L.E.

| Proprietà | Valori |
|---|---|
| Categoria | Sistema · Equipaggio · EVA · Scientifico · Esplorazione · Ambientale · Narrativo · V.A.L.E. |
| Trigger | Temporale · Da task · Da condizione · Da catena · Da V.A.L.E. |
| Priorità | Sfondo · Normale · Importante · Critico |
| Ambito | Locale · Sezione · Globale |

**Selezione:** niente `RandomEvent()`. Usiamo condizioni + tag + pool pesati + cooldown + cronologia.
```text
peso = peso base × condizioni × stato × storia
es. Tempesta di Polvere: 10 normale · 25 nella Valle della Polvere · 40 con vento estremo
```

**Regola d'oro:** ogni evento narrativo deve produrre almeno uno tra: nuova informazione · nuovo rischio · nuova possibilità · nuovo vincolo · nuova decisione · nuova conseguenza.

Gli eventi formano **catene** (es. micrometeorite → danno comunicazioni → diagnostica → riparazione → EVA → ferita → trattamento).
Filosofia: 20 eventi ben interconnessi > 500 eventi isolati.

### 10.1 Implementazione  [BLOCCATO struttura · PROVVISORIO regole — v2.4]
- **Gli eventi sono dati** (`content/eventi.ts`): condizioni, effetti e scelte descritti come oggetti; il motore li interpreta.
- **Condizioni**: task concluso ora (tag + esito minimo/massimo) · rapporto serale / risveglio · scoperta presente/assente · evento già accaduto (anche con una scelta precisa) · equipaggiamento a bordo · `UNO_TRA` (oppure).
- **Effetti**: scoperta · risorsa · integrità di un sistema · scafo · fatica (responsabile del task d'origine o tutti) · voce di log con codici. Sempre limitati (risorse ≥ 0, integrità e fatica 0–100).
- **Quando**: gli eventi si controllano dopo ogni AVANZA. **Al massimo un evento per momento**; vince la priorità più alta, poi il peso.
- **Decisioni**: un evento con scelte porta in **DECISIONE**; il Capitano seleziona e conferma; poi si torna allo stato precedente (anche RAPPORTO). I task in coda partono dopo la decisione.
- **Output dei task = eventi** che reagiscono a tag ed esito (es. R01 dopo l'Analisi del segnale; O01–O04 dopo i fallimenti critici). Un solo meccanismo per tutte le conseguenze.
- **Scoperte = conoscenza**: sbloccano task (`scoperteRichieste`) e condizioni di altri eventi. La UI mostra solo i task sbloccati e non anticipa le scoperte di una scelta.
- Prima della Fase 3, V.A.L.E. dice sempre la verità.

### 10.2 Storia emergente  [BLOCCATO struttura · PROVVISORIO contenuti — v3.0]
Modello: **60 Seconds**. Nessuna trama fissa: un **mazzo di eventi narrativi** (`content/storia/eventi.ts`, S01–S22) che seed, crew, carico e scelte combinano in una storia diversa a ogni partita.
- **Protagonista e secondo**: un evento può chiedere chi lo vive (fazione, ruolo, personalità, il più/meno fiducioso). Il motore lo sceglie tra la crew; i testi usano {P} e {S}. Se nessuno è adatto, l'evento non accade.
- **Esiti casuali**: una scelta può avere più esiti con peso e requisiti; ne esce uno.
- **Fazioni** (derivate, mai salvate): fiducia ≥ 65 → CON V.A.L.E. · ≤ 35 → CONTRO · in mezzo INDECISO. Chi cambia fazione lo **dice** (battute per approccio, `content/storia/battute.ts`) e finisce nel diario.
- **La crew agisce da sola**: ogni mattina un membro CONTRO può contestare V.A.L.E. di sua iniziativa e mettersi in coda la verifica (35%); un membro CON rifiuta i task contrari alla direttiva quando V.A.L.E. è almeno PERSISTENTE.
- **V.A.L.E. agisce sulla nave** (§3.3): con autonomia AUTONOMA chiude il compartimento dove si lavora contro di lei (task "Sblocco manuale" o ORD-01 per riaprire), abbassa l'ossigeno, rifiuta l'ordine di rientro.
- **Il Confronto** (S20): quando tensione, smentite o porte chiuse arrivano al limite, la crew si riunisce. Spegnere V.A.L.E. richiede 2 membri CONTRO (o un Ingegnere); l'esito dipende da chi sta con chi. **Rimani in stazione** (S21): con autonomia AUTONOMA V.A.L.E. prende la nave; l'ammutinamento richiede 2 membri CONTRO.
- **Giornale di bordo**: eventi, scelte ed esiti scrivono righe; ogni sera il motore aggiunge il bilancio (risorse che finiscono, feriti, fazioni quando cambiano, riempitivo se la giornata è vuota). Si legge al rapporto serale.
- **Imprevisto di partenza** (8, `content/storia/imprevisti.ts`): estratto dal seed, cambia l'inizio (cassa rotta, antenna colpita, mal di spazio, nessun problema…).
- **Testo libero verso V.A.L.E.**: parole chiave → domanda (STATO, PERCHÉ, DANNI, EQUIPAGGIO, TRACCE BIO, DIRETTIVA, più ACCUSA, MINACCIA, SALUTO che fanno salire la tensione o cambiano tono). Le risposte usano i dati veri ({DANNI}, {CREW}). Sostituisce l'esclusione v2.3 «niente testo libero».

---

## 11. Loadout

### 11.1 Capacità  [BLOCCATO]
1000 kg di carico operativo (la crew conta nel peso) · **4 slot moduli** · **6 slot equipaggiamento** · 200 unità di spazio scorte.

Categorie: Sistemi core (sempre presenti) · Moduli · Equipaggiamento · Scorte.

Nella campagna il giocatore **possiede** un catalogo che cresce con i Crediti, ma **porta in missione** solo ciò che entra negli slot. L'economia non aumenta gli slot: aumenta le possibilità.

### 11.2 Le sei domande di ogni oggetto  [BLOCCATO]
1. Cosa mi permette di fare?
2. Quale problema risolve?
3. Quanto costa (peso, energia, crediti)?
4. Quale nuovo evento può creare?
5. Quale nuovo rischio può creare?
6. Quale nuova informazione può rivelare?

Niente oggetti "semplicemente più forti": la progressione aumenta versatilità, informazione, sicurezza e specializzazione.

### 11.3 Catalogo  [PROVVISORIO valori]
**Moduli (15):** Laboratorio Avanzato · Potenziamento Infermeria · Modulo di Potenza · Potenziamento Supporto Vitale · Array di Navigazione · Array di Comunicazione Secondario · Scanner Spaziale Profondo · Modulo Minerario · Estensione Habitat · Espansione Stoccaggio · Assistenza alla Propulsione · Modulo Operazioni Esterne · Hangar Droni · Potenziamento Riciclo dell'Acqua · Riserva di Energia d'Emergenza.

Esempio bilanciato: **Modulo di Potenza** — 80 kg · +6/giorno generazione · +2/giorno consumo.

**Equipaggiamento (15):** Scanner Manuale · Sensore Profondo Portatile · Kit di Riparazione · Set di Strumenti Ingegneristici · Tablet Diagnostico · Drone da Ricognizione · Contenitore per Campioni · Laboratorio Portatile · Impianto di Riparazione EVA · Tuta EVA Mk II · Faro di Emergenza · Tablet di Navigazione · Kit Medico da Campo · Rilevatore di Radiazioni · Cella di Potenza Portatile.

**Scorte (7):** Cassa di Scorte (cibo + acqua) · Bombola d'Ossigeno (emergenza) · Tanica di Carburante · Cassa di Scorte Mediche · Cassa di Pezzi di Ricambio · Cassa di Celle Batteria · Cassa di Consumabili di Ricerca.

### 11.4 Sinergie
Il loadout interagisce con crew, pianeta, task, eventi e **direttive di V.A.L.E.**
Archetipi: Scienza · Ingegneria · Sopravvivenza · Esplorazione · Mobilità · Bilanciato.
Esempio: Scanner + Laboratorio rendono eleggibili direttive di tipo OSSERVA/ANALIZZA/BIOLOGIA; Modulo Minerario + Operazioni Esterne rendono eleggibili ISPEZIONA/RECUPERA/ESTRAI.

Principio: **il pianeta non richiede un oggetto preciso; il tuo loadout cambia ciò che puoi fare sul pianeta.**

### 11.5 Preparazione (implementazione)  [BLOCCATO struttura · PROVVISORIO numeri — v2.7]
Schermata prima della missione (`src/ui/preparazione/`, motore in `src/engine/preparazione/`, numeri in `balance.ts → preparazione`):
- **Crew**: 10 candidati (`content/candidati.ts`): Mara, Adrian, Nadia, Sarah, Marco, Giulia, Davide, Irene, Luca (Sicurezza/EVA), Elena (Generalista). Se ne scelgono 4. Anche la fiducia in V.A.L.E. fa parte della scelta.
- **Loadout**: catalogo completo (15 moduli · 15 equipaggiamenti · 7 scorte, `content/loadout.ts`). Effetti **attivi**:
  - moduli → parametri della nave (`engine/nave/parametri.ts`): generazione e consumo di energia, capacità della batteria, spazio della stiva, recupero della fatica, scorte per persona, bonus all'integrità dei dati;
  - equipaggiamento e moduli → **task sbloccati** (`equipaggiamentoRichiesto`, `moduliRichiesti`; es. l'Analisi del segnale richiede il Laboratorio Avanzato);
  - casse → scorte iniziali (Cassa di Scorte +45) e carburante (Tanica +4 oltre al serbatoio di 18 = riserva di rientro).
  Gli effetti non ancora nel motore sono dichiarati come **IN ARRIVO** nella scheda dell'oggetto.
- **Vincoli**: 4 crew · 4 slot moduli · 6 slot equipaggiamento · 1000 kg (crew compresa) · 200 unità di stiva (+100 con Espansione Stoccaggio). Gli slot bloccano la scelta; il peso no (si vede il problema e si decide cosa togliere).
- **Fattibilità** (§14.4), derivata dai problemi: BLOCCANTE (crew incompleta, peso, stiva, niente scorte) → IMPOSSIBILE; AVVISO (meno di 8 giorni di scorte, niente carburante operativo, energia in calo, nessun medico, task impossibili) → RISCHIOSA; altrimenti POSSIBILE. V.A.L.E. dice «La missione è operativamente possibile.» sia per POSSIBILE sia per RISCHIOSA.
- **Direttiva**: si sorteggia col seed *dopo* la Preparazione, solo tra le direttive i cui tag `richiede` sono tutti a bordo (D01 e D12 richiedono SCANSIONE, D05 richiede DRONE). Se nessuna è possibile, si sceglie tra tutte.
- Si parte dal **loadout di riferimento** (§13.8): 934 kg, consumo 8/giorno, 540 scorte, 26 di carburante.
- **Schema della nave** (v2.8): sopra il catalogo, la ORB-1 in sezione laterale si riempie mentre scegli: 4 alloggi dei moduli (con sigla), compartimento potenziato acceso, rastrelliera dei 6 equipaggiamenti, stiva a celle da 10 unità colorate per tipo, serbatoio con la linea della riserva di rientro, crew al proprio posto.

---

## 12. Pianeti

Il pianeta non è una mappa: è **un generatore di condizioni** che alimenta task, eventi, missioni e direttive.

### 12.1 Seed  [BLOCCATO]
- **Seed pianeta** (es. `E17-73A9`): tipo, parametri, regioni, zone di atterraggio, POI, anomalie, risorse, relazioni e tag nascosti.
- **Seed partita:** ordine eventi, meteo, esiti casuali, direttiva di V.A.L.E., **quale verità è attiva** (§13.6).

Stesso pianeta ≠ stessa partita. I generatori sono separati per dominio (pianeta, regioni, POI, anomalie, risorse, meteo, V.A.L.E.) per evitare che cambiarne uno alteri gli altri.

### 12.2 Parametri  [BLOCCATO]
| Parametro | Valori |
|---|---|
| Tipo | TERRESTRE · ARIDO · GHIACCIATO · VULCANICO · OCEANICO |
| Gravità | BASSA · NORMALE · ALTA |
| Atmosfera | RESPIRABILE · RESPIRABILE CON CONTAMINANTI · SOTTILE · DENSA · TOSSICA · CORROSIVA · ASSENTE |
| Temperatura | FREDDA · TEMPERATA · CALDA · ESTREMA |
| Radiazioni | BASSE · MODERATE · ALTE · ESTREME |
| Meteo | SERENO · VENTO · TEMPESTA · TEMPESTA ELETTRICA · EVENTO DI POLVERE · EVENTO TERMICO (cambia in modo discreto) |
| Terreno | PIANURE · MONTAGNE · CRATERI · CANYON · GHIACCIO · ROCCIOSO · VULCANICO · ACQUE BASSE · ACQUE PROFONDE |
| Biologia | NESSUNA RILEVATA · MICROBICA · SIMILE A PIANTE · SIMILE AD ANIMALI · COMPLESSA · SCONOSCIUTA (il valore reale può essere nascosto) |

### 12.3 Geografia  [BLOCCATO struttura · PROVVISORIO numeri]
- 5–8 **regioni** per pianeta, almeno 3 terreni diversi su 6 regioni.
- Ogni regione: nome, terreno, modificatori temperatura/radiazioni, meteo, tag risorse/vita/anomalie, POI, zone di atterraggio.
- **Zone di atterraggio:** 1–3 per regione; proprietà: sicurezza, terreno, distanza, meteo, difficoltà navigazione, valore risorse.
- **POI:** 2–5 per regione. Tipi: Sito di Ricerca · Anomalia · Deposito Minerale · Sorgente del Segnale · Caverna · Rovine · Sito Biologico · Fonte d'Acqua · Struttura Sconosciuta. Inizialmente visibili come *Punto sconosciuto*.
- **Anomalie:** possono diventare obiettivo, fonte di eventi, ramo di missione, bersaglio di V.A.L.E., rivelazione.
- **Risorse planetarie:** acqua, materiali grezzi, campioni biologici, minerali, fonti energetiche — usate per missione, ricerca, riparazione, emergenza, rientro. Non è un survival-crafting.

### 12.4 Tre difficoltà separate  [BLOCCATO]
Pianeta · Regione · Task. Un pianeta difficile non rende difficile ogni task.

Difficoltà regione (0–100): terreno 20% · temperatura 15% · radiazioni 20% · meteo 15% · atmosfera 10% · navigazione 20%.
Fasce: 0–24 SICURA · 25–49 MODERATA · 50–74 PERICOLOSA · 75–100 ESTREMA.

### 12.5 Tag  [BLOCCATO]
Linguaggio interno con cui i sistemi comunicano (non visibili al giocatore). Es.: CALDO, ALTA_RADIAZIONE, ATMOSFERA_SOTTILE, BIOLOGICO, ARTIFICIALE, SEGNALE, ANOMALIA, INSTABILE…

### 12.6 Generatore procedurale  [APERTO — rimandato]
Pesi tipo (provvisori): Terrestre 25% · Arido 25% · Ghiacciato 20% · Vulcanico 15% · Oceanico 15%.
Validazione post-generazione (zona utilizzabile, opportunità scientifica, opportunità di sopravvivenza, elemento anomalo, percorso plausibile) con rigenerazione del solo blocco problematico.

**Decisione di sviluppo:** nell'MVP i pianeti sono **dati scritti a mano** che rispettano la struttura del generatore. Il generatore si implementa dopo la validazione del gameplay.

---

## 13. E-17 — pianeta di riferimento

Ruolo: pianeta di playtest e primo capitolo della campagna.

### 13.1 Scheda  [BLOCCATO]
ID `E-17` · seed `E17-73A9` · tipo ARIDO · gravità NORMALE · atmosfera SOTTILE (non respirabile → EVA obbligatoria in superficie) · temperatura CALDA · radiazioni MODERATE · vento MODERATO · precipitazioni BASSE · biologia SCONOSCIUTA.

Tag: ARIDO, CALDO, ATMOSFERA_SOTTILE, RADIAZIONI_MODERATE, POCA_ACQUA, PRESENZA_MINERALE, BIOLOGIA_SCONOSCIUTA, ATTIVITÀ_ANOMALA, SEGNALE_ARTIFICIALE.

### 13.2 Regioni (6) · zone (15) · POI
| # | Regione | Ruolo | Terreno | Radiazioni | Vento | Navigaz. | Sicurezza | Zone | POI |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Pianure Equatoriali | introduttiva | Pianure | basse–mod. | moderato | bassa | alta | LZ-01 Pianura di Ricognizione · LZ-02 Bacino Arido · LZ-03 Piattaforma Orientale | Deposito Minerale · Fonte d'Acqua · Sito di Ricerca |
| 2 | Canyon Occidentali | navigazione/esplorazione | Canyon | moderate | alto | alta | moderata | LZ-04 Ingresso del Canyon · LZ-05 Canyon Profondo · LZ-06 Piattaforma Occidentale | Caverna · Deposito Minerale · Segnale Sconosciuto |
| 3 | Cratere Settentrionale | **narrativa principale** | Cratere (ciclo freddo/caldo) | alte | basso | media | bassa | LZ-07 Bordo del Cratere · LZ-08 Fondo del Cratere | Zona di Radiazione · Struttura Sconosciuta · Sito Biologico · Sorgente del Segnale |
| 4 | Cresta Rossa | risorse minerarie | Roccioso/cresta (temp. estrema) | moderate | alto | media | media | LZ-09 Cresta Settentrionale · LZ-10 Valle Rossa · LZ-11 Piattaforma Termica | Deposito Minerale · Sfogo Termico · Equipaggiamento Abbandonato |
| 5 | Bacino Meridionale | sopravvivenza/biologia | Bacino | basse | basso | bassa | alta | LZ-12 Bordo del Bacino · LZ-13 Bacino Inferiore | Fonte d'Acqua · Sito Biologico · Caverna |
| 6 | Valle della Polvere | incertezza/rischio | Pianure/roccioso | moderate | estremo | molto alta | bassa | LZ-14 Ingresso della Valle · LZ-15 Valle Profonda | Sorgente del Segnale · Struttura Sconosciuta |

### 13.3 Struttura nascosta
Rete di strutture artificiali sotterranee, **dormiente ma non inattiva** (bassissima potenza), collegata a segnali, campi elettromagnetici e attività biologica. La biologia non è artificiale ma sembra interagire con la rete. Tracce di una missione umana **KESTREL-4**, non prevista dalla documentazione ufficiale.

```text
Segnale → Struttura del Cratere → Campo di Risonanza → Nodo Remoto
            ↳ Biologia (ramo parallelo)
            ↳ KESTREL-4 (collegamento col passato umano e con V.A.L.E.)
```

### 13.4 Anomalie (5)
- **AN-01 Segnale artificiale** (Canyon, Cratere, Valle): bassa potenza → schema ripetitivo → protocollo sconosciuto → sorgente non trasmittente.
- **AN-02 Struttura del Cratere:** sotterranea, artificiale, senza ingresso evidente né fonte energetica convenzionale.
- **AN-03 Sito biologico:** i campioni reagiscono agli impulsi del segnale; causalità non dimostrata.
- **AN-04 Campo di risonanza:** variazioni di navigazione, eco nelle comunicazioni, disturbi ai sensori.
- **AN-05 Equipaggiamento KESTREL-4:** telemetria danneggiata, frammento: `GIORNO 19 SEGNALE ACQUISITO · GIORNO 21 [DATI CORROTTI] · GIORNO 21 RISPOSTA V.A.L.E. NON PREVISTA`.

### 13.5 Catene e eventi
Catene: **Segnale** (rilevato → scompare → ritorna → localizzato) · **Cratere** (radiazione → geometria artificiale → struttura → risonanza → nodo) · **Biologia** (attività → campione → correlazione → secondo sito) · **KESTREL** (equipaggiamento → identificazione → log corrotto → incoerenza V.A.L.E. → memoria nascosta). Le catene si intersecano.

**20 eventi principali:** E01 Segnale Anomalo Rilevato · E02 Il Segnale Scompare · E03 Il Segnale Ritorna · E04 Localizzazione della Sorgente · E05 Tasca di Radiazione · E06 Geometria Artificiale · E07 Struttura Sepolta · E08 Campo di Risonanza · E09 Risposta Biologica Inattesa · E10 Prelievo del Campione · E11 Correlazione Biologica · E12 Secondo Sito Biologico · E13 Equipaggiamento KESTREL-4 · E14 Identificazione KESTREL-4 · E15 Registro Corrotto · E16 Incoerenza di V.A.L.E. · E17 Attivazione del Nodo Remoto · E18 Tempesta di Polvere · E19 Surriscaldamento dell'Apparecchiatura · E20 Decisione sulla Rete.

**Eventi operativi di supporto** (conseguenze, non missioni): guasto drone, esposizione al calore, perdita navigazione, ferita, disturbo comunicazioni, danno a strumento.

**Implementati nella vertical slice (v2.4):** E01 Segnale sconosciuto (INDAGA · INVIA DRONE · IGNORA) · E02 Il segnale scompare · E03 Il segnale ritorna · R01 Schema ripetitivo · E04 Sorgente localizzata (SEGNA OBIETTIVO · CONTINUA OSSERVAZIONE) · E06 Geometria regolare · O01 Impatto di microdetriti · O02 Dati corrotti · O03 Surriscaldamento · O04 Manovra brusca.
Simulazione (bot, 30 partite da 6 giorni): segnale rilevato 30/30, sorgente localizzata 25/30 tra il giorno 2 e il 6.

### 13.6 Tre verità possibili  [BLOCCATO concetto · APERTO dettaglio]
Il seed della partita sceglie quale è vera. Gli stessi indizi puntano a conclusioni diverse.
- **A** — la rete è un antico sistema artificiale; la biologia vi si è adattata.
- **B** — la rete è conseguenza di un fenomeno biologico/planetario.
- **C** — qualcuno ha costruito, attivato e monitorato il sistema; KESTREL-4 era lì per studiarlo.

Il mistero funziona come `informazione + informazione + contraddizione + ipotesi + scelta`, non come capitoli con spiegazione finale. La V1 non deve confermare tutto.

### 13.7 Direttive di V.A.L.E. per E-17 (15)  [PROVVISORIO catalogo]
- **Compatibili:** D01 Osserva il Segnale · D02 Analizza il Sito Biologico · D03 Recupera i Dati KESTREL · D04 Monitora il Cratere
- **Neutrali:** D05 Preserva la Struttura · D06 Monitora la Risonanza · D07 Limita il Contatto Biologico · D08 Evita l'Attivazione della Struttura
- **In conflitto:** D09 Non Trasmettere il Segnale Sconosciuto · D10 Non Recuperare il Campione Principale · D11 Metti in Quarantena il Materiale Biologico · D12 Sopprimi il Segnale
- **Conflitto critico:** D13 Impedisci l'Attivazione · D14 Proteggi l'Integrità della Rete · D15 Rimani in Stazione

D15 è la più pericolosa: chiede di consumare il carburante operativo che garantisce il rientro.
> «Capitano. La partenza in questo momento comprometterebbe la continuità dell'osservazione.»

### 13.8 Playthrough di riferimento
Crew: **Mara** (Ingegnere) · **Adrian** (Pilota) · **Nadia** (Scienziata) · **Sarah** (Medica).
Moduli (4): Laboratorio Avanzato · Potenziamento Supporto Vitale · Modulo Operazioni Esterne · Array di Navigazione.
Equipaggiamento (6): Sensore Profondo Portatile · Drone da Ricognizione · Contenitore per Campioni · Kit di Riparazione · Tuta EVA Mk II · Rilevatore di Radiazioni.
*(Il playtest originale ne aveva 8; Scanner Manuale e Kit Medico da Campo esclusi per rispettare i 6 slot — da confermare, §19.)*

Esito del playtest #1: il loop gestione → scoperta → decisione → conseguenza funziona; V.A.L.E. crea tensione senza parlare continuamente.

---

## 14. Campagna, Terra ed economia

### 14.1 Terra: l'hub  [BLOCCATO]
Sulla Terra il giocatore può: riparare (scafo, sistemi, apparecchiature) · rifornire scorte e carburante · modificare il loadout · acquistare equipaggiamento e moduli · gestire la crew · consultare i dati · scegliere la prossima missione.

### 14.2 Crediti  [BLOCCATO concetto · PROVVISORIO valori]
Risorsa della **campagna**. Si guadagnano solo completando missioni e si spendono **solo sulla Terra** (nello spazio li possiedi ma non puoi spenderli).

Ricompensa = base + bonus obiettivi secondari (+ bonus speciali, post-MVP), mostrata prima di accettare.
**Una missione fallita paga 0.** Nessun debito, prestito o fallimento finanziario: pochi crediti = meno possibilità, mai game over.

### 14.3 Dopo la missione  [BLOCCATO]
**TORNA SULLA TERRA** → riparazioni, rifornimento, acquisti, nuovo loadout; costo in tempo/opportunità.
**CONTINUA DIRETTAMENTE** → nessun reset: fatica, danni, scorte, carburante, equipaggiamento, fiducia e log restano come sono.

### 14.4 Contratti di missione  [BLOCCATO struttura]
Ogni missione mostra: nome · pianeta · tipo · obiettivi · durata stimata · rischio stimato · ricompensa · requisiti.
Tipi: scientifica, soccorso, ricognizione, recupero, ingegneria, sopravvivenza, esplorazione, narrativa. Non tutte devono essere misteriose.

Requisiti: OBBLIGATORIO · CONSIGLIATO · OPZIONALE.
**Fattibilità:** POSSIBILE · RISCHIOSA · NON RACCOMANDATA (accettabile) · IMPOSSIBILE (manca un requisito obbligatorio).
> V.A.L.E.: «La missione è operativamente possibile.» — Possibile non significa prudente.

### 14.5 Mistero della campagna
`mistero locale → indizio globale → mistero della campagna`. E-17 può lasciare domande riprese su altri pianeti (es. K-22, S-08) tramite log e codici persistenti.

---

## 15. Finali e Game Over

- **Game Over** [BLOCCATO]: membri vivi = 0, in qualsiasi momento. Basta un sopravvissuto per continuare.
- **Missione completata ≠ campagna completata.**
- **Finali narrativi della campagna** [APERTO]: 2–4 finali a livello di campagna. Vanno progettati **prima** di completare il catalogo eventi, perché indizi e direttive si costruiscono a ritroso dal finale.
- **Finali di missione** [PROVVISORIO — v3.0, `content/storia/finali.ts`]. Cause: RIENTRO (ordine del Capitano, evento, o fine della finestra al giorno 10) · DERIVA (rientro con carburante sotto la riserva) · CONTROLLO_VALE · MORTE. Per ogni causa vince il primo finale, per priorità, le cui condizioni sono vere:
  - RIENTRO → *A mani nude* (V.A.L.E. spenta) · *La verità a bordo* (direttiva rivelata) · *Il segnale* (sorgente localizzata) · *Domande senza risposta* (segnale rilevato) · *A mani vuote*;
  - DERIVA → *Alla deriva* · CONTROLLO_VALE → *Rimani in stazione* · MORTE → *Silenzio*.
- **Epilogo**: titolo e testo del finale, una riga per ogni membro (secondo fazione o morte), la **direttiva di V.A.L.E. sempre rivelata**, il giornale di bordo completo. Poi "Nuova missione" con un seed nuovo.
- Simulazione (bot, 45 partite con stili diversi): 5 finali diversi, ≥ 12 eventi narrativi diversi, imprevisti variati.
- Punteggio: [APERTO].

---

## 16. Architettura tecnica  [BLOCCATO]

**Stack:** Vite + React + TypeScript · Vitest · salvataggi in `localStorage` · nessun backend · nessun game engine.

### 16.1 Tre strati
```text
src/content/  →  DATI (pianeti, task, eventi, direttive, crew, balance)
src/engine/   →  LOGICA in TypeScript puro, zero React
src/ui/       →  REACT: legge lo stato, invia azioni
```
Regole:
- `engine/` non importa mai da `ui/`.
- Il motore è fatto di funzioni pure: `(stato, azione) → nuovoStato`.
- Lo stato è un oggetto semplice serializzabile (niente classi, niente funzioni) → salvataggio = `JSON.stringify`.
- **Mai `Math.random()`**: RNG con seed, il cui stato vive dentro lo stato di gioco → determinismo, replay, test.
- Nessun `useEffect` per la logica di gioco: la UI chiama `dispatch(azione)` negli handler.

### 16.2 Verità separata dalla conoscenza
```text
StatoMissione
├── verita        → realtà del pianeta (la UI non lo legge mai)
├── conoscenza    → ciò che la crew ha scoperto (la UI legge questo)
└── comunicazioni → messaggi di V.A.L.E. = f(verita, direttiva, comportamento)
```
Questa separazione protegge il mistero per costruzione.

### 16.3 Stati annidati
```text
StatoCampagna
├── crediti, crew, nave, catalogoPosseduto, log, conoscenzaGlobale, vale, storia
└── missioneCorrente?: StatoMissione
```

### 16.4 Struttura cartelle
```text
orbital/
├── DESIGN.md
├── src/
│   ├── engine/
│   │   ├── types/        tipi del dominio
│   │   ├── rng.ts        generatore con seed
│   │   ├── clock.ts      tempo event-driven
│   │   ├── tasks/        risoluzione task
│   │   ├── events/       selezione eventi
│   │   ├── vale/         direttiva, comportamento, filtro informativo
│   │   ├── crew/         fatica e altre regole della crew
│   │   ├── mission/      reducer missione: azioni, assegnazione, esecuzione, giornata
│   │   └── campaign.ts   reducer campagna (fase 5)
│   │   ├── nave/         fasce di integrità di scafo e sistemi
│   ├── content/
│   │   ├── balance.ts    tutti i numeri provvisori
│   │   ├── tasks.ts      catalogo dei task
│   │   ├── contesto.ts   contesto del gioco per il reducer
│   │   ├── missioneIniziale.ts
│   │   └── pianeti/e17.ts  (solo conoscenza; la verità andrà in un file separato)
│   └── ui/
│       ├── styles/       tokens.css (design system) · base.css
│       ├── components/   Finestra · Pulsante · BarraSegmentata
│       ├── missione/     pannelli della schermata Missione
│       ├── format.ts     testi e toni (verde/ambra/rosso)
│       └── useMissione.ts  ponte React ↔ motore (useReducer)
└── tests/
```

### 16.5 Interfaccia  [BLOCCATO regole · PROVVISORIO layout]
Fonte: *ORBITAL Design System* (VALE-OS rev 0.1), tradotto in `src/ui/styles/tokens.css`.

**Regole visive**
- Il verde (fosfori) è l'interfaccia; il **ciano è solo la voce di V.A.L.E.**
- Ambra e rosso **solo** per stati di rischio, sempre accompagnati da testo (mai il colore come unica informazione).
- I codici nei log **non sono mai evidenziati**: il giocatore li riconosce per ricorrenza.
- Lo stato interno di V.A.L.E. (comportamento, autonomia, direttiva) non è mai mostrato come indicatore.
- Font: Michroma (display) · VT323 (terminale, numeri, menu) · IBM Plex Mono (testo, log). Testo mai sotto i 12 px.
- Tre finestre: **sistema** (pannelli operativi), **console** (canale di V.A.L.E.), **cornice** (dati secondari).

**Cornice**: tutta l'interfaccia è dentro il monitor retro-futurista *Terminale V.A.L.E. · Modello 7 · Fosfori P1* (guscio, incavo, schermo con linee di scansione, vignettatura e riflesso; fascia frontale con griglia dell'altoparlante, **SVC**, manopole e LED). Il LED ambra lampeggia quando il gioco attende una decisione. Su mobile la cornice è sottile e la fascia frontale resta fissa in fondo.

**Layout**
- Desktop (≥ 1100 px): tre colonne a tutta altezza — Equipaggio + Risorse · Canale V.A.L.E. · Pianifica + Nave + Pianeta — e barra comandi in basso.
- Tablet e mobile: una colonna con quattro schede (Crew · V.A.L.E. · Task · Nave) e barra comandi fissa in fondo.
- Finestre fisse (niente trascinamento/ridimensionamento nell'MVP).
- Si interroga V.A.L.E. con 6 **pulsanti-domanda** (STATO · PERCHÉ? · DANNI · EQUIPAGGIO · TRACCE BIO · DIRETTIVA?) e, dalla v3.0, con il campo **«Scrivi a V.A.L.E.»** (parole chiave, §10.2).

**Schermate**: Ingresso (titolo, v3.2) · Missione (v0, Fase 2) · Evento/Decisione come finestra sopra la Missione (con gli eventi) · Preparazione con la sezione della navicella (Fase 4).

### 16.5.1 Accensione del monitor  [PROVVISORIO — v3.1]
Il monitor è un tubo catodico (`ui/cornice/useAccensione.ts`, animazioni in `Monitor.module.css`):
- **Accensione** (1,2 s): punto → riga orizzontale → immagine sovraesposta che si assesta con due sfarfallii; una fascia di avvio mostra «VALE-OS 4.1 · TERMINALE V.A.L.E. MODELLO 7» o «GIORNO 03 · 06:00 · BUONGIORNO, CAPITANO».
- **Spegnimento** (0,7 s): l'immagine si schiaccia in una riga, la riga in un punto; resta il bagliore del fosforo (2,2 s), il LED verde va in attesa.
- Quando: all'avvio del gioco; al lancio (Preparazione → Missione); alla **buonanotte** (al buio si chiude il rapporto e passa la notte, poi buongiorno); a «Nuova missione».
- Le fasi avanzano con l'evento `animationend` (niente timer né useEffect). Con «riduci movimento» del sistema le transizioni sono istantanee. Suoni: relè, smagnetizzazione e crepitio all'accensione; schiocco e fischio discendente allo spegnimento.

### 16.5.2 Schermata d'ingresso  [PROVVISORIO — v3.2]
Flusso del gioco: **Ingresso → Preparazione → Missione → Epilogo → Ingresso** (`App.tsx`, uno stato `fase`, niente router).
- Al centro il logo ORBITAL (Michroma, con cursore lampeggiante) sopra **E-17 in fil di ferro** che ruota, con la nave ORB-1 in orbita (`ui/ingresso/GloboOrbita.tsx`, animazione SVG nativa). Sottotitolo nella voce di V.A.L.E.
- **Registro di avvio** che si scrive riga per riga; l'ultima è «DIRETTIVA INTERNA [RISERVATO]», in rosso: il mistero comincia prima di giocare.
- Menu: **INIZIA MISSIONE** (anche con INVIO: è un `<form>`), **SEED** modificabile (stesso seed = stessa partita), interruttore **AUDIO** (accende ambiente e voce a metà, ed è il gesto che sblocca l'audio del browser).
- Atmosfera audio INGRESSO: ronzio basso e tre deboli impulsi a 1420 Hz, in eco al Segnale di E-17.
- Desktop: registro · logo · menu in tre colonne. Mobile: logo, menu, registro (INIZIA sempre raggiungibile).

### 16.6 Audio  [BLOCCATO regole · PROVVISORIO suoni — v2.8]
Tutto generato nel codice (`src/ui/audio/`): nessun file audio.
- **Ambiente** (Web Audio API): ronzio, ventilazione, eventi casuali. Cinque atmosfere: INGRESSO (titolo), PREPARAZIONE (hangar), MISSIONE, ALLERTA (decisione in attesa, impulso grave), NOTTE (rapporto serale).
- **Suoni d'interfaccia**: innesto, cassa, rimozione, errore, conferma, avvio, accesso al terminale, contestazione, allarme. Si decide quale suonare confrontando lo stato prima e dopo l'azione (un'azione rifiutata suona ERRORE).
- **Voce di V.A.L.E.**: sintesi vocale del browser in italiano, lenta e grave, preceduta da un bip. Legge le sue righe nuove del log, al massimo 2 per turno: il log resta la fonte completa.
- **Controlli**: le due manopole della cornice (AMB e VOCE), 4 scatti ciascuna. I browser bloccano l'audio fino al primo gesto dell'utente: il primo giro di manopola lo sblocca. I volumi si ricordano tra le visite.
- **Regola tecnica**: suoni e voce partono solo dai gestori di evento (dispatch), mai dal render: niente useEffect.

---

## 17. Piano di sviluppo

| Fase | Obiettivo | Risultato verificabile |
|---|---|---|
| **0** | Repo, DESIGN.md, `balance.ts` | progetto avviato |
| **1** | Motore base senza UI: tipi, RNG, orologio, risoluzione task | test verdi |
| **2** | Vertical slice: Cratere Settentrionale, crew e loadout fissi, 5–6 task, 5 eventi, 1 direttiva in conflitto, UI minimale | 3 giorni giocabili |
| **3** | Livello V.A.L.E.: filtro informativo, una contraddizione, Tavola del Capitano base | **playtest: dubitare è divertente?** |
| **4** | E-17 completo, tre verità, selezione crew e loadout | missione completa |
| **5** | Campagna: Terra, crediti, refit, contratti, 2 pianeti semplici, salvataggi | campagna di 3 missioni |
| **6** | Finali, onboarding, bilanciamento, rifinitura UI | MVP |

---

## 18. Registro decisioni

| Versione | Decisione |
|---|---|
| v1.1 | Potenza a tre valori; Modulo di Potenza ribilanciato (+6/+2); Bassa energia riduce capacità; riserva di rientro sul carburante |
| v1.1 | Rimosso il concetto di "pressione eventi" |
| post-playtest | Ogni evento narrativo deve cambiare almeno una cosa |
| v1.2 | Cibo + acqua → **Scorte**; ossigeno come condizione del Supporto Vitale |
| v1.2 | Tre verità possibili scelte dal seed partita; Tavola del Capitano |
| v1.3 | Struttura a **campagna**; Terra come hub; Crediti; nessuna ricompensa per missioni fallite; Game Over solo con crew a zero; nessun reclutamento nell'MVP |
| v1.3 | Rimossa l'esclusione "NO economia" (resta esclusa ogni economia oltre ai Crediti) |
| v2.0 | Documenti unificati. `ORD` = **Override** (non "Ordine"). "Potenziamento Navigazione" → **Array di Navigazione**. Scorte: da 8 a **7** tipologie. Loadout di riferimento ridotto a 6 equipaggiamenti. Generatore procedurale rimandato: pianeti MVP scritti a mano |
| v2.1 | Task: responsabile + aiutante facoltativo, coda per membro. Formula del rischio e dell'esito (provvisoria). Nomi nel codice in italiano |
| v2.2 | Reducer della missione: regole provvisorie di esecuzione (niente lavoro notturno, costi all'avvio, rischio salvato all'avvio, aiutante occupato → si procede da soli), consumi al rapporto serale, recupero notturno |
| v2.3 | Adottata l'**Integrità dei dati** (§4.6). Adottato il design system VALE-OS (§16.5), con la UI allineata al DESIGN (scorte unificate, E-17 arido). Crew di riferimento: Mara, Adrian, Nadia, Sarah. Niente testo libero verso V.A.L.E. |
| v2.4 | Sistema di eventi data-driven (§10.1): condizioni, effetti, scelte, stato DECISIONE, un evento per momento, output dei task come eventi, scoperte che sbloccano task. Catena del Segnale di E-17 implementata |
| v3.2 | **Schermata d'ingresso** (§16.5.2): logo, globo di E-17, registro di avvio, seed modificabile, interruttore audio; «Nuova missione» riporta qui |
| v3.1 | Accensione e spegnimento del monitor a tubo catodico (§16.5.1): all'avvio, al lancio, alla buonanotte e al buongiorno |
| v3.0 | **Storia emergente alla 60 Seconds** (§10.2): mazzo di eventi narrativi con protagonista ed esiti casuali, fazioni, crew che agisce da sola, V.A.L.E. che chiude porte e rifiuta il rientro, il Confronto, giornale di bordo, imprevisti di partenza, **finali di missione con epilogo** (§15). **Cibo, acqua e ossigeno separati** (§6.1). **Testo libero verso V.A.L.E.** con parole chiave. Adottati dal mockup anche finestre ridimensionabili ed eventi trascinabili (Tappa 2) |
| v2.8 | Schema della nave nella Preparazione (§11.5). **Audio** (§16.6): ambiente sintetizzato con 4 atmosfere, suoni d'interfaccia, voce di V.A.L.E. con la sintesi vocale del browser, manopole della cornice come controlli |
| v2.7 | **Schermata di Preparazione** (§11.5): 10 candidati, catalogo completo del loadout con effetti graduali (IN ARRIVO), parametri della nave dai moduli, task che richiedono moduli, fattibilità, direttiva sorteggiata tra quelle compatibili con il loadout. Consumo base della nave 5 + moduli |
| v2.6 | **Livello V.A.L.E.** (§3.5): direttiva scelta dal seed, tensione, comportamento e autonomia derivati, rifiuto dei task contrari, filtro informativo con riga di sistema rivelatrice, Contesta → Verifica (smentita/confermata), domande a pulsanti, codici MEM-12 · DIR-07 · ORD-01, integrità dei dati che altera la stima di rischio. Ogni partita ha un seed casuale; `?seed=` nell'indirizzo per rigiocarla. I tentativi falliti nel terminale alzano la tensione |
| v2.5 | Cornice del monitor ripristinata dal render. **Terminale SVC-07**: righe del log segnalabili, frammenti, codici, livelli di accesso 0–5, tentativi falliti visibili a V.A.L.E. |

---

## 19. Questioni aperte

**Da confermare (decise in v2.0, rivedibili):**
- [ ] `ORD` = Override?
- [ ] Equipaggiamenti esclusi dal loadout di riferimento: Scanner Manuale e Kit Medico da Campo?

**Da progettare:**
- [ ] Finali della campagna (prima del catalogo eventi definitivo)
- [ ] Aiutante occupato: il task parte da solo (attuale) o aspetta?
- [ ] Bilanciamento: con un aiutante esperto la Scansione del cratere scende al 2% di rischio, quindi E01 arriva quasi subito. Va bene così o serve più incertezza?
- [ ] Un evento per momento: se troppi eventi "saltano", valutare una coda di eventi
- [ ] Mappa delle adiacenze della nave (spostamenti precisi, §7.6)
- [ ] Effetti a soglia della fiducia in V.A.L.E. (oggi la crew parla soltanto: deve anche *agire*?)
- [ ] La tensione di V.A.L.E. deve poter scendere? (es. seguire i suoi consigli, giorni senza contestazioni)
- [ ] Contestare un'affermazione vera ha un costo sufficiente? (oggi: tensione +1 e un task da 2h)
- [ ] Meccanica della Tavola del Capitano
- [ ] Come le tre verità cambiano il significato degli indizi di E-17
- [ ] Durata obiettivo di una partita (sessione) e numero medio di missioni per campagna
- [ ] Prezzi: moduli, equipaggiamento, riparazioni, scorte; ricompense per tipo di missione
- [ ] Missioni disponibili contemporaneamente; sblocco nuovi equipaggiamenti; inizio del finale
- [ ] Pianeti semplici aggiuntivi (2–3)
- [ ] Preparazione: con la campagna la crew si sceglie una volta sola o a ogni missione (tra i sopravvissuti)?
- [ ] Analisi del segnale senza Laboratorio Avanzato: deve esistere un'alternativa (Laboratorio Portatile, più lenta)?
- [ ] Tratti della crew: quali effetti meccanici (oggi sono solo testo)?
- [ ] Punteggio, UI flow, tutorial, salvataggi
- [ ] La tensione di V.A.L.E. scende abbastanza? (eventi con TENSIONE negativa: Calibrazione, Turno di notte, Fidarsi)
- [ ] Durata della missione: 10 giorni è giusto? Quante partite finiscono per la finestra di rientro?
- [ ] Finali con le tre verità di E-17 (§13.6): oggi i finali non le distinguono
- [ ] Voce di V.A.L.E.: restare sulla sintesi del browser o passare a file registrati (stessa voce su tutti i dispositivi)?
- [ ] Musica: serve, o bastano ambiente e silenzi?

- [x] Terminale: i tentativi falliti influiscono su V.A.L.E.? → sì, +1 tensione ciascuno (v2.6)
- [ ] Integrità dei dati: anomalie ed eventi che la abbassano; errori anche nelle letture delle scansioni, non solo nelle stime
