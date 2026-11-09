# ADR-0002: Contenuti di gioco in JSON validati con zod, nel repository

- **Stato:** Accettato
- **Data:** 2026-11-05

## Contesto
Numeri di bilanciamento, ondate e battute erano sparsi nel codice. Bilanciare o aggiungere contenuti significava
modificare la logica, con il rischio di romperla. Era anche stata valutata l'idea di tenerli in un database del backend.

## Decisione
- Statistiche, livelli e dialoghi stanno in **file JSON** in `src/content/` (*data-driven design*, pattern *Type Object*).
- Ogni file è validato all'avvio con **zod** (`schemas.ts`), più controlli incrociati tra file (`validate.ts`).
  Un errore blocca il gioco all'avvio indicando file e campo.
- Gli id delle battute usate dal codice sono controllati **a compile time** (le chiavi vengono dal JSON).
- Nel codice resta solo la geometria legata agli sprite (offset, hitbox, posizioni dell'arena).
- I contenuti sono **design**, versionato in git col codice. I **dati dei giocatori** (partite, punteggi) andranno
  invece nel database del backend (fase 6).

## Alternative considerate
- **Database nel backend**: niente storia in git, niente test in CI sulle modifiche, gioco dipendente dalla rete,
  migrazioni da coordinare col client. Se servirà bilanciare da remoto si aggiungerà una *remote config* che
  sovrascrive i JSON di base, validata con gli stessi schemi.
- **Numeri nel codice**: il bilanciamento richiede di toccare la logica.
- **Fogli di calcolo / CSV**: comodi per tabelle, scomodi per strutture annidate (ondate, fasi del boss).

## Conseguenze
- Si bilancia e si aggiungono ondate o battute senza programmare.
- Un passaggio in più per capire un valore (JSON invece della classe).
- La fase 3 (livelli disegnati con Tiled) si innesta naturalmente: Tiled produce JSON.
