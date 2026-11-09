# BOC Game: "The Monsignor Chronicles: Battle for Chiappetons"

Run-and-gun 2D a scorrimento laterale in pixel art, tono comico. Protagonista Paolone, cattivo Monsignor Panza. Ambientazione: **Chiappetons**, paesino del Sud Italia.
Stack: **Phaser 3 + TypeScript (strict) + Vite**. Risoluzione interna 320x180, scalata.

Questo file è il riferimento per gli agenti: descrive **come il progetto DEVE funzionare** (architettura target),
lo stato attuale e le trappole già scoperte. Va aggiornato ogni volta che una decisione cambia.

Lore, personaggi e meccaniche stanno nel GDD (`docs/gdd/`). Il GDD è la fonte di verità del design:
se il codice e il GDD divergono, chiedere all'utente quale dei due va aggiornato.

## Comandi

```bash
npm run dev           # dev server
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (type-aware), lint:fix per correggere
npm run format        # Prettier sul codice (i file .md sono esclusi di proposito)
npm run format:check  # verifica formattazione senza modificare
npm run build         # typecheck + build in dist/
npm run check         # typecheck, lint, format:check, test:unit, build
npm run test:unit     # unit test Vitest (test:unit:watch in modalità watch)
npm run test:e2e      # smoke test Playwright sulla build di produzione (test:e2e:ui per la modalità interattiva)
```

Prima di considerare finito un lavoro devono passare `npm run check` **e** `npm run test:e2e`.

**CI** (`.github/workflows/ci.yml`): gira solo sulle pull request verso `main` e sui push su `main` (cioè i merge).
Job `check` (typecheck, lint, format check, unit test, build) e poi job `e2e` (smoke test Playwright), con Node 22 (`.nvmrc`).
Se gli e2e falliscono, il report Playwright è scaricabile come artifact della run.
Flusso di lavoro: branch dedicato → pull request verso `main` → CI verde → merge (fatto dall'utente).

`?debug` nell'URL mostra le hitbox ed espone `window.game`. `?e2e` espone solo l'API di test `window.__boc`
e salta l'avvertenza dopo NEW GAME (`?e2e&disclaimer` la mostra).

### Unit test (Vitest)

- Stanno in `tests/unit/`, rispecchiando la struttura di `src/` (es. `src/core/Pool.ts` → `tests/unit/core/Pool.test.ts`).
- Girano in **Node**: un modulo testato a unità **non deve importare Phaser**, né direttamente né tramite i suoi import.
  La logica pura va tenuta in moduli separati da quelli che usano Phaser (es. `clean()` sta in `ui/text.ts`, non in `art/font.ts`).
- I casi con più input dello stesso comportamento usano `it.each` (è la versione parametrizzata, non un `for` nel test).
- Le garanzie di tipo si testano con `// @ts-expect-error`: le verifica `npm run typecheck`, che include `tests/`.

### Smoke test e2e e API di test

- I test stanno in `tests/e2e/` e parlano **solo** con `GameDriver` (`tests/e2e/support/`), che a sua volta usa
  l'API `window.__boc` definita in `src/debug/testHooks.ts` (`BocTestApi`, `TestState`).
- L'API è un **contratto stabile**: il refactor deve mantenerla funzionante adattando `testHooks.ts`,
  **non** modificando i test. Se un test va cambiato, chiedere prima all'utente.
- I test premono **azioni**, mai tasti: `game.tap('confirm')`, `game.press('fire')`. Il driver legge il tasto da
  `content/data/controls.json` (`keyFor()`), quindi cambiare i tasti non rompe i test. Gli unit test non devono
  dipendere dai valori dei JSON di contenuto: ogni test imposta da sé i dati che verifica.
- Il clock è deterministico: `freeze()` ferma il loop reale, simula `Date.now()` e rende `Math.random` riproducibile;
  il tempo avanza solo con `step(frames)`.
- Gli hook che servono solo ai test vivono in `GameScene` come metodi `debug*` e si chiamano solo da `testHooks.ts`.

### Contenuti di gioco (`src/content/`)

- I JSON stanno tutti in `src/content/data/`; in `src/content/` restano solo i `.ts` (schemi, validazione, accesso).
- **Numeri di bilanciamento e testi stanno nei JSON**, mai nel codice:
  `weapons.json`, `player.json`, `enemies.json`, `projectiles.json`, `boss-panza.json`, `ui.json` (titolo, menu,
  opzioni: solo caratteri del font pixel, validati), `controls.json` (tasti), `props.json` (catalogo degli
  oggetti di scena), `levels/<livello>.json` (oggetti, pickup, ondate, drop delle nonne), `dialoghi/<personaggio>.json`.
- **Nel codice resta solo la geometria legata agli sprite** (offset delle mani, hitbox, punti di lancio, posizioni
  nell'arena del boss): cambia con la pixel art, non con il bilanciamento.
- Ogni file è validato con **zod** (`content/schemas.ts`) all'avvio, più i controlli incrociati in `content/validate.ts`
  (ondata → battuta esistente, oggetto → tipo esistente, fase del boss → battuta esistente...). Un JSON sbagliato blocca
  il gioco all'avvio con un messaggio che indica file e campo.
- Si accede ai contenuti solo da `src/content/index.ts`: `CONTENT` per i dati, `line(personaggio, id)` per le battute.
  `line()` controlla l'id **a compile time** (le chiavi vengono dal JSON); per gli id che arrivano dai dati si usa
  `lineById()`, validato all'avvio. Una battuta con più varianti (array) ne restituisce una a caso.
- Le battute di Paolone si scrivono in italiano normale: le K le aggiunge `kappa()` quando vengono mostrate.
- Aggiungere un campo: schema in `schemas.ts` → valore nel JSON → uso nel codice → test in `tests/unit/content/`
  → aggiornare template e guida in `docs/contenuti/` (`templates.test.ts` valida i template contro gli schemi).
- `docs/contenuti/README.md` è la guida per l'utente (campi, unità, ricette); `docs/contenuti/template/` ha un JSON
  di esempio per ogni tipo di contenuto. Il gioco non li carica.
- `content/`, `core/` e `ui/text.ts` sono moduli puri (niente Phaser): si testano con Vitest.

---

## Architettura target

### Strati e responsabilità

```
src/
  core/       infrastruttura senza logica di gioco: EventBus tipizzato, StateMachine, Pool, Save, Settings
  systems/    logica di gioco trasversale: Spawn, Combat, Camera, Fx, Dialogue, Score/Telemetry
  entities/   attori: player/, enemies/, bosses/, projectiles/, pickups/
  scenes/     SOLO orchestrazione: crea i sistemi, collega gli eventi, avvia e ferma la musica
  ui/         HUD, fumetti, menu, input
  content/    dati di gioco in JSON validati: armi, nemici, dialoghi
  art/ audio/ generazione procedurale e caricamento degli asset
assets/       mappe Tiled (.tmj), spritesheet Aseprite, audio
tests/        unit/ (Vitest), e2e/ (Playwright)
docs/         gdd/, adr/ (decisioni architetturali), roadmap
```

### Regole

1. **Le scene non contengono logica di gioco.** Una scena istanzia i sistemi e li collega. Se un metodo di una scena
   decide qualcosa sul gameplay (danni, ondate, punteggio), va spostato in un sistema.
2. **Le entità non chiamano la scena.** Comunicano emettendo eventi sull'EventBus tipizzato
   (`enemy:killed`, `player:hurt`, `weapon:changed`, `boss:phase` e così via). I sistemi si iscrivono agli eventi.
   La mappa degli eventi è un unico tipo TS (`GameEvents`), così payload ed emettitori sono controllati a compile time.
3. **L'IA è una macchina a stati** (`core/StateMachine`), con stati espliciti tipo `walk → windup → attack → cooldown`.
   Niente `if` sparsi su timer multipli.
4. **Data-driven.** Statistiche di armi e nemici, ondate, dialoghi e livelli stanno in dati (JSON / Tiled), non nel codice.
   Il codice definisce i *comportamenti*, i dati i *numeri*. Il bilanciamento non deve richiedere modifiche alla logica.
5. **Dialoghi in file di contenuto** (`content/data/dialoghi/<personaggio>.json`). La parlata con le K di Paolone è una
   trasformazione automatica (`kappa()`), non va mai scritta a mano nei testi.
6. **Pooling** per proiettili, particelle e popup: niente `new` per ogni sukkino in un loop di gioco.
7. **Telemetria dietro un'interfaccia** (`systems/Telemetry`): oggi salva in locale, domani invia al backend.
   Il gioco deve funzionare offline.
8. **Costanti in `config.ts`**, mai numeri magici duplicati tra file.

---

## Stato attuale (v0.1, architettura della fase 2 completata)

Funziona tutto il ciclo: titolo → livello 1 → boss → vittoria / game over. Il codice **segue l'architettura target**;
le decisioni e il loro perché sono negli ADR (`docs/adr/`). Un ADR non si riscrive: se una decisione cambia se ne
scrive uno nuovo che sostituisce il vecchio.

- `scenes/GameScene.ts` fa solo orchestrazione: costruisce il livello, crea i sistemi di `src/systems/`, collega eventi
  e musica. La logica sta nei sistemi (Camera, Fx, Dialogue, Spawn, Pickup, Combat, Score, BossArena, Run), le regole
  pure e testate in `systems/rules/`, gli eventi in `systems/events.ts` (`GameEvents`).
- Le entità non conoscono `GameScene`: ricevono `(scene: Phaser.Scene, bus: GameBus, ...)` e parlano col gioco solo
  emettendo eventi. Possono usare le API Phaser della propria scena (`scene.time`, `scene.add`, `scene.tweens`), mai
  metodi di gioco della scena. I sistemi invece possono chiamare i metodi delle entità (`player.heal()`, `boss.laugh()`).
- Eventi (`systems/events.ts`) di due tipi: **fatti** al passato (`player:threw`, `enemy:fired`, `boss:damaged`...)
  e **richieste di presentazione** (`fx:*`, `dialogue:say`) che non cambiano mai lo stato del gioco.
- Sukkini e proiettili nemici sono in pool (`ProjectileSystem`), le scritte volanti in pool (`FxSystem`).
- L'IA di tutti i nemici e del boss è una `StateMachine` (campo `brain`), con il diagramma degli stati nel commento
  della classe. Gli **stati** dicono cosa sta facendo il nemico; le **ricariche** degli attacchi (`nextThrow`,
  `nextVolley`...) sono timer assoluti separati, perché devono scorrere anche mentre il nemico è in un altro stato.
- Contenuti in JSON validati (armi, Paolone, nemici, boss, oggetti, livello 1, dialoghi). Il livello si scrive
  ancora a mano in JSON: passerà a Tiled nella fase 3.
- Telemetria (`systems/telemetry/`): `TelemetrySystem` ascolta gli eventi e a fine partita produce un `RunSummary`
  anonimo (solo statistiche di gioco, versionato con `schemaVersion`), che `LocalStorageSink` salva nel browser
  (chiave `boc.runs`, ultime 50 partite). Il gioco conosce solo l'interfaccia `TelemetrySink`: nella fase 6 si aggiunge
  un `HttpSink`. La telemetria **non deve mai far fallire il gioco**. `TelemetrySystem` va creato **prima** di
  `RunSystem` (deve registrare `boss:defeated` prima di `run:over`). Se cambia la forma del riepilogo, incrementare
  `RUN_SUMMARY_SCHEMA_VERSION`.
- La versione del gioco (`package.json`) è iniettata da Vite come `__APP_VERSION__`.
- Dopo NEW GAME `DisclaimerScene` mostra l'avvertenza "opera di fantasia" (testi e durata in `ui.json` →
  `disclaimer`), poi parte il livello: dopo `durationMs` o al primo tasto/clic/pulsante (le ripetizioni di un tasto
  tenuto premuto non contano). Il "riprova" del game over va dritto al livello. Con `?e2e` è saltata
  (`SHOW_DISCLAIMER` in `config.ts`) così gli smoke test vanno dritti al livello; i suoi test usano `?e2e&disclaimer`.
- Titolo e menu (ADR 0007): il primo tasto attiva l'audio e mostra il menu (NEW GAME, LOAD GAME bloccato fino al
  backend, OPTIONS). Le voci sono in inglese per scelta dell'utente, il resto del gioco in italiano.
  `ui/Menu` è il componente riusabile (tastiera, mouse, gamepad; il cursore salta le voci bloccate, regole pure in
  `ui/menuNav.ts`). `OptionsScene` è un overlay lanciato sopra la scena che lo apre: volumi, schermo intero, comandi,
  lingua (solo italiano, bloccata). Le impostazioni stanno in `core/Settings` (`SettingsStore`, chiave `boc.settings`,
  ogni campo con il suo fallback) e si applicano con `applySettings()` di `src/settings.ts`. Come la telemetria,
  il salvataggio delle impostazioni **non deve mai far fallire il gioco**.
- **Pausa**: il tasto `pause` (P / Esc) fa `RunSystem.handlePause()`, che congela il mondo ed emette `run:paused`;
  `GameScene` lancia `PauseScene` passandole `PauseActions` (`resume` / `quit` del `RunSystem`): la scena di pausa non
  decide nulla da sola. Voci: RESUME, OPTIONS (la stessa `OptionsScene`), MAIN MENU con conferma (NO selezionato).
  `quit()` registra la partita come abbandonata (`run:over` con `outcome: 'quit'`, telemetria schema v2) e torna al
  titolo. Attenzione: `anims.pauseAll()` è **globale**, va sempre riattivato prima di lasciare il livello.
  Gli overlay (`OptionsScene`, `PauseScene`) estendono `OverlayScene` (sfondo scurito, riquadro, cambio di vista).
- **Tasti**: si decidono **solo** in `content/data/controls.json` (azione → tasti, nomi di
  `Phaser.Input.Keyboard.KeyCodes`). Nel codice non si scrive mai un tasto: `ui/Controls` (gioco), `ui/Menu` (menu),
  `onActionKey()` di `ui/keys.ts` (muto, schermate finali). Lo schema rifiuta un tasto usato per due azioni dello
  stesso gruppo (gioco o menu). La tabella CONTROLS delle opzioni è generata dai tasti veri (`ui/controlsTable.ts`).
  Il gamepad usa il layout standard, definito in `Controls` e `Menu`.
- Le scene overlay (`PauseScene`, poi `OptionsScene` che può aprirsi sopra la pausa) stanno in fondo alla lista di
  `main.ts`: Phaser disegna sopra le ultime.
- Grafica e audio sono interamente procedurali (`art/`, `audio/`). Restano come segnaposto finché non arriva la pixel art vera.

## Roadmap

- [x] **Fase 1a, strumenti**: Prettier, ESLint, CI GitHub Actions su `main`
- [x] **Fase 1b, rete di sicurezza**: smoke test e2e con Playwright (avvio → livello → boss → vittoria / game over → riprova, zero errori in console), in CI
- [x] **Fase 2, refactor architettura** (branch `refactor/fase-2`). Il gameplay è rimasto identico.
  Gli unit test (Vitest) si scrivono **insieme ai nuovi moduli**, non sul codice vecchio che verrà spostato.
  Dopo ogni passo devono passare `npm run check` e lo smoke test e2e.
  - [x] Passo 1: Vitest in CI, test di `kappa()` / `clean()` / `pick()`
  - [x] Passo 2: `core/EventBus`, `core/StateMachine`, `core/Pool` con unit test
  - [x] Passo 3: contenuti in JSON validati con zod (armi, Paolone, nemici, proiettili, boss, oggetti, livello 1, dialoghi)
  - [x] Passo 4: `GameScene` spezzata nei sistemi, `GameEvents` tipizzati, regole pure in `systems/rules/`
  - [x] Passo 5: entità sull'EventBus (niente più `GameScene` nelle entità), proiettili e popup in pool
  - [x] Passo 6: IA dei nemici e del boss su StateMachine
  - [x] Passo 7: telemetria locale, `CLAUDE.md` e ADR (`docs/adr/0001`-`0006`)
- [ ] **Fase 3, pipeline contenuti**: livello 1 in Tiled, poi spritesheet Aseprite
- [ ] **Fase 4, audio**: musiche dell'utente riarrangiate in chiptune (2 pulse + triangle + noise)
- [ ] **Fase 5, deploy**: build pubblica (itch.io o GitHub Pages)
- [ ] **Fase 6, backend**: API per run, punteggi e audit (repo separato), client Telemetry collegato

---

## Trappole già scoperte (non ripeterle)

- **Font retro di Phaser**: la `size` di `bitmapText` è riferita alla **larghezza** della cella, non all'altezza.
  Font `px` (cella 6x8) → size 6, 12…; font `pxo` (cella 7x9) → size 7, 14, 21. Altri valori li scalano in modo sbagliato.
- **`useDefineForClassFields`**: un campo di una sottoclasse con lo stesso nome di una proprietà Phaser la sovrascrive
  (es. `state` su un GameObject). Usare nomi univoci (`phase`, `mode`).
- **Nomi riservati di Phaser.Scene**: un campo di una scena non deve chiamarsi `sys`, `game`, `events`, `registry`,
  `cameras`, `physics`, `time`, `add`, `scene`... sovrascriverebbe il gestore interno di Phaser (es. `sys` è il
  `Systems` della scena). Per i sistemi di gioco la scena usa il campo `systems`.
- **Ordine dei sistemi in `GameScene.create()`**: gli handler dell'EventBus girano in ordine di iscrizione e i collider
  Arcade in ordine di creazione. Cambiare l'ordine di costruzione dei sistemi può cambiare il comportamento.
- **Oggetti in pool**: un `Sukkino` o un `EnemyBullet` non si distrugge mai con `destroy()`: si chiama `retire()`
  (torna nel pool) o `splat()`. Ogni `fire()` deve reimpostare **tutto** lo stato (texture, hitbox, gravità, velocità,
  angolo, animazione), perché l'oggetto riusato si porta dietro i valori del lancio precedente.
- **Gruppi fisici Arcade**: `physics.add.group().add(sprite)` resetta velocità e gravità del body. Per entità già
  configurate usare gruppi semplici (`this.add.group()`): i collider funzionano lo stesso.
- **Hitbox e flipX**: l'offset del body Arcade non si specchia da solo. Usare `Enemy.setBodyBox()`, che lo ricalcola.
- **Nemici fuori camera**: `Enemy.preUpdate` ferma l'IA oltre ±60px dalla camera. Spawn e ingressi del boss devono
  stare entro quel margine, altrimenti restano immobili.
- **Test nel browser**: con il pannello in background il RAF è fermo. Per i test usare `game.loop.sleep()` e
  `game.step(t, 16.67)` a mano. Le tween di Phaser usano `Date.now()`, quindi va simulato anche quello.
- **Audio**: l'AudioContext parte solo dopo un gesto dell'utente (gestito dal title screen).

## Convenzioni

- **Git: gli agenti NON fanno MAI commit né push.** Commit e push li fa solo l'utente. Un agente può preparare
  le modifiche e proporre il messaggio di commit, ma non esegue `git commit`, `git push` o comandi che riscrivono la storia.
  Repo: `https://github.com/Andrea-Thecoder/boc-game.git`, autore locale `Andrea-TheCoder`.
- Lingua: codice e identificatori in inglese; testi di gioco, commenti di design e documentazione in italiano.
- Commit convenzionali: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Test: struttura AAA, una sola logica di assert per test, nessun `if`/`for` nel corpo, naming
  `metodo_condizione_risultatoAtteso`. Unit test sulla logica pura, e2e per gli smoke test del gioco.
