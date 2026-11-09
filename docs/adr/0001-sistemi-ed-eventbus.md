# ADR-0001: Scene come orchestrazione, logica nei sistemi, EventBus tipizzato

- **Stato:** Accettato
- **Data:** 2026-11-06

## Contesto
Nel prototipo `GameScene` (527 righe) gestiva camera, ondate, collisioni, effetti, boss, punteggio e HUD, e le entità
ne chiamavano direttamente i metodi (`gs.say`, `gs.onEnemyKilled`...). Ogni nuova funzione passava dalla scena:
accoppiamento alto, logica non testabile, rischio crescente a ogni livello o PNG aggiunto.

## Decisione
- La scena fa solo **orchestrazione**: costruisce il livello, crea i sistemi (`src/systems/`), collega eventi e musica.
- La logica sta in **sistemi** con una responsabilità ciascuno (Camera, Spawn, Combat, Pickup, Projectile, Fx,
  Dialogue, Score, BossArena, Telemetry, Run). Le regole pure stanno in `systems/rules/` e si testano con Vitest.
- Le entità ricevono solo `(scene, bus)` e comunicano **emettendo eventi** su un `EventBus` tipizzato.
  Tutti gli eventi sono in un unico tipo, `GameEvents`: nome o payload sbagliati non compilano.
- Due tipi di eventi: **fatti** al passato (`player:threw`, `boss:damaged`) e **richieste di presentazione**
  (`fx:*`, `dialogue:say`) che non cambiano lo stato del gioco.
- La migrazione è avvenuta con il pattern *strangler*: facciata temporanea nella scena (passo 4), poi rimossa (passo 5).

## Alternative considerate
- **Eventi nativi di Phaser** (`scene.events.emit`): non tipizzati, nessun controllo su nomi e payload.
- **ECS (Entity Component System)**: molto flessibile, ma sproporzionato per un run-and-gun con pochi tipi di attori.
- **Lasciare la god class**: il costo di ogni modifica cresce con i contenuti.

## Conseguenze
- Funzioni nuove si aggiungono come sistemi o eventi, senza toccare le entità esistenti.
- L'ordine di creazione dei sistemi conta (handler e collider girano in ordine di iscrizione/creazione): è documentato.
- Seguire un flusso richiede di cercare chi ascolta un evento: il tipo `GameEvents` fa da indice.
