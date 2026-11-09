# ADR-0004: Object pooling per proiettili e scritte volanti

- **Stato:** Accettato
- **Data:** 2026-11-07

## Contesto
Ogni sukkino, proiettile nemico e scritta "+100" veniva creato e distrutto. Con l'ACE (circa 10 lanci al secondo) e le
raffiche del boss si creano centinaia di oggetti, con lavoro per il garbage collector e possibili scatti nel framerate.

## Decisione
- `core/Pool` generico: `acquire` / `release`, limite massimo, oggetti creati in anticipo.
- `ProjectileSystem` possiede i pool di sukkini ed `EnemyBullet` (60 ciascuno, 16 creati all'avvio);
  `FxSystem` quello delle scritte volanti.
- Gli oggetti in pool non si distruggono mai: `fire()` li riattiva reimpostando **tutto** lo stato,
  `retire()` li rimette nel pool. Oltre il limite un lancio viene saltato.
- Particelle: già gestite dagli emitter di Phaser. Fumetti e nemici: pochi, non in pool.

## Alternative considerate
- **Nessun pool**: più semplice, ma allocazioni continue nei momenti più concitati.
- **Pool di Phaser (`Group` con `maxSize` e `get()`)**: accoppiato ai gruppi fisici, che resettano i body (vedi CLAUDE.md).

## Conseguenze
- Allocazioni costanti durante il gioco.
- Rischio di "stato sporco" tra un lancio e l'altro: mitigato dalla regola di reimpostare tutto in `fire()`.
