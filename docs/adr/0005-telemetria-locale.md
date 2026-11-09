# ADR-0005: Telemetria dietro un'interfaccia, oggi salvata in locale

- **Stato:** Accettato
- **Data:** 2026-11-09

## Contesto
È previsto un backend (fase 6) per tenere traccia di partite, punteggi e audit. Il gioco però deve funzionare
offline, e il backend non esiste ancora.

## Decisione
- `TelemetrySystem` ascolta gli eventi e costruisce un riepilogo anonimo della partita (`RunSummary`): esito, punti,
  durata, uccisioni per tipo, colpi subiti, cure, lanci, pickup, ondate, progresso nel boss.
  Solo statistiche di gioco, **nessun dato personale**.
- Il riepilogo ha `schemaVersion`, `runId`, `gameVersion` e `level`, così il backend potrà interpretare record di
  versioni diverse.
- La destinazione è un'interfaccia, `TelemetrySink`. Oggi `LocalStorageSink` tiene le ultime 50 partite nel browser
  (chiave `boc.runs`). La telemetria non deve mai far fallire il gioco: ogni errore di storage viene ignorato.
- Logica pura (`RunRecorder`, sink con storage iniettato) testata con Vitest.

## Alternative considerate
- **Inviare subito a un servizio esterno di analytics**: dipendenza esterna, dati fuori dal nostro controllo, privacy.
- **Tracciare ogni evento grezzo**: molto più volume e complessità; il riepilogo per partita basta per classifiche e
  bilanciamento.

## Conseguenze
- Nella fase 6 basterà un `HttpSink` (invio al backend, con coda locale se offline): il resto del gioco non cambia.
- Il client può mentire: il backend dovrà validare i riepiloghi (plausibilità di punteggio e durata).

## Note
- Schema 2: `outcome` può valere anche `quit` (partita abbandonata dal menu di pausa). I record con `schemaVersion` 1
  hanno solo `victory` e `gameover`.
