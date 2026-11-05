# The Monsignor Chronicles : Battle for Chiappetons

Run-and-gun a scorrimento in pixel art, ambientato a **Chiappetons**, paesino del Sud Italia.
Paolone combatte i fedeli del corrotto Monsignor Angelius Panza a colpi di sukkini.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build statica in dist/
```

Aggiungi `?debug` all'URL per vedere le hitbox.

## Comandi

| Azione | Tastiera | Gamepad |
|---|---|---|
| Muovi / mira | Frecce o WASD (su = mira in alto, giù in aria = mira in basso) | Stick / D-pad |
| Salta | Z / Spazio / K (giù + salta = scendi dalla piattaforma) | A |
| Lancia sukkino | X / J | X / R2 |
| Panzata | C / L | B |
| Pausa | P / Esc | Start |
| Muto | M | |

## Struttura

- `src/art/`: tutta la grafica è generata via codice (painter pixel-art, font 5x7, sprite, sfondi)
- `src/audio/`: organo, coro gregoriano, campane ed effetti sintetizzati con Web Audio, nessun file audio
- `src/entities/`: Paolone (gambe e busto separati), sukkini, nemici, boss
- `src/level/level1.ts`: oggetti, piattaforme, pickup e ondate del livello, solo dati
- `src/scenes/`: boot, titolo, gioco, HUD, game over, vittoria
