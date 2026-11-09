# ADR-0006: Smoke test e2e su un'API di test stabile e clock deterministico

- **Stato:** Accettato
- **Data:** 2026-11-05

## Contesto
Il refactor della fase 2 doveva lasciare il gameplay identico. Gli unit test sul codice da spostare sarebbero stati
riscritti subito; serviva una rete di sicurezza che verificasse il **comportamento** del gioco, non la sua struttura.

## Decisione
- Smoke test Playwright sulla build di produzione: avvio, livello, nemici e punti, boss, vittoria, game over,
  riprova, zero errori in console.
- I test parlano solo con `GameDriver`, che usa l'API `window.__boc` (attiva con `?e2e`), un **contratto stabile**:
  se l'interno del gioco cambia si adatta l'API, non i test.
- Clock deterministico: loop reale fermo, tempo che avanza a frame, `Date.now()` simulato, `Math.random` con seme.
- Unit test (Vitest) sui moduli puri, scritti insieme ai moduli nuovi.

## Alternative considerate
- **Test in tempo reale**: lenti e instabili (dipendono dal framerate e dalla macchina).
- **Screenshot comparison**: fragili a ogni ritocco grafico, e la grafica cambierà.
- **Solo unit test**: non coprono l'integrazione tra scene, sistemi e Phaser.

## Conseguenze
- Il refactor è stato fatto passo per passo con il gioco sempre verde.
- Gli e2e non vedono dentro l'IA: per quello servono unit test o sonde mirate.
- `testHooks.ts` va tenuto allineato quando cambia l'interno del gioco.
