# ADR-0007: Menu riusabile e impostazioni salvate nel browser

- **Stato:** Accettato
- **Data:** 2026-11-09

## Contesto
Il titolo diventa *The Monsignor Chronicles: Battle for Chiappetons* e la schermata iniziale ha bisogno di un menu
(nuova partita, caricamento futuro, opzioni). Le opzioni devono sopravvivere alla chiusura del browser, e lo stesso
menu servirà in futuro anche per la pausa.

## Decisione
- Un componente `ui/Menu` unico per tutti i menu: tastiera, mouse e gamepad, voci bloccate (lucchetto, saltate dal
  cursore), valori a destra (ON/OFF, lingua) o a tacche (volumi). Le regole di navigazione sono pure (`ui/menuNav.ts`).
- Le opzioni sono una scena overlay (`OptionsScene`) lanciata sopra quella che la apre: oggi il titolo, domani la pausa.
  Gli smoke test la vedono come scena attiva `options`, senza cambiare l'API di test.
- Le impostazioni (`core/Settings`) sono validate con zod con un fallback **per campo**: un valore corrotto o di una
  versione vecchia rimette al default solo quel campo. Salvate in `localStorage` (`boc.settings`); se lo storage manca
  o è pieno, valgono per la sessione.
- Lo schermo intero non si salva: i browser permettono di attivarlo solo dopo un gesto dell'utente.
- La lingua è già un'impostazione (`LANGUAGES`), oggi con il solo italiano: l'opzione è visibile ma bloccata.
- I testi di titolo e menu stanno in `content/data/ui.json`, validati: solo i caratteri che il font pixel sa disegnare.

## Alternative considerate
- **Menu in HTML sopra il canvas**: più semplice da scrivere, ma stile grafico diverso e input da gamepad da rifare.
- **Opzioni dentro la scena del titolo**: meno codice oggi, ma non riusabili dalla pausa.
- **Validazione tutto-o-niente delle impostazioni**: un solo campo sbagliato farebbe perdere tutte le preferenze.

## Conseguenze
- Il menu di pausa e la schermata di caricamento (fase 6) riusano `Menu` e `OptionsScene`.
- Una seconda lingua richiede: il codice in `LANGUAGES`, i testi tradotti e lo sblocco della voce nelle opzioni.

## Note
- I tasti (gioco e menu) sono poi stati centralizzati in `content/data/controls.json`: la tabella CONTROLS delle opzioni
  viene generata da lì invece di essere scritta a mano. È un dettaglio di questa stessa decisione, non una nuova.
