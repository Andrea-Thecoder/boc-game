# The Monsignor Chronicles : Battle for Chiappetons

Run-and-gun a scorrimento in pixel art, ambientato a **Chiappetons**, paesino del Sud Italia.
Paolone combatte i fedeli del corrotto Monsignor Angelius Panza a colpi di sukkini.

> [!NOTE]
> **Opera di fantasia.** Personaggi, nomi, luoghi (Chiappetons compreso), istituzioni e fatti raccontati in questo
> gioco sono **frutto della fantasia** dell'autore. Ogni riferimento a persone reali, vive o defunte, a luoghi
> o a fatti realmente accaduti è puramente casuale.

> [!NOTE]
> **Nessuno vuole offendere nessuno.** Il gioco ha un tono comico e parodistico: è una caricatura, non un giudizio.
> Non intende in alcun modo offendere o prendere in giro la fede, nessuna religione, la Chiesa, il clero o i
> credenti, né il Sud Italia e la sua gente, né chi ha un fisico come quello di Paolone, né alcuna persona,
> gruppo o istituzione. È fatto solo per divertire.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build statica in dist/
```

Aggiungi `?debug` all'URL per vedere le hitbox.

Dopo NEW GAME, prima del livello, il gioco mostra un'avvertenza (opera di fantasia, nessuna intenzione di offendere)
per 12 secondi o finché non si preme un tasto. Testo e durata stanno in `src/content/data/ui.json`.

## Comandi

I tasti si cambiano in un solo file, `src/content/data/controls.json`: gioco, menu e tabella dei comandi nelle
opzioni li leggono da lì. Quelli attuali sono anche nel gioco, in **Options → Controls**.

| Azione | Tastiera | Gamepad |
|---|---|---|
| Muovi / mira | Frecce o WASD (su = mira in alto, giù in aria = mira in basso) | Stick / D-pad |
| Salta | Z / Spazio / K (giù + salta = scendi dalla piattaforma) | A |
| Lancia sukkino | E / J | X / R2 |
| Panzata | Q / L | B |
| Pausa (menu: riprendi, opzioni, torna al menu principale) | P / Esc | Start |
| Muto | M | |

## Struttura

- `src/art/`: tutta la grafica è generata via codice (painter pixel-art, font 5x7, sprite, sfondi, interfaccia)
- `src/audio/`: organo, coro gregoriano, campane ed effetti sintetizzati con Web Audio, nessun file audio
- `src/content/`: dati di gioco in JSON validati (`data/`: armi, nemici, boss, livelli, dialoghi, testi, tasti)
- `src/entities/`: Paolone (gambe e busto separati), sukkini, nemici, boss
- `src/systems/`: la logica di gioco (ondate, combattimento, punteggio, boss, telemetria)
- `src/scenes/`: boot, titolo, opzioni, gioco, HUD, game over, vittoria
- `docs/`: GDD, decisioni architetturali (ADR) e guida ai contenuti

## Licenza

**Tutti i diritti riservati.** Il gioco si può giocare gratis per uso personale; non si può copiare, modificare,
ridistribuire o riutilizzare (codice, grafica, musiche, testi, personaggi) senza il permesso scritto dell'autore.
Il fatto che il codice sia visibile su GitHub non dà il diritto di usarlo. Testo completo: [LICENSE](LICENSE).
