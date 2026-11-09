# ADR-0003: IA di nemici e boss come macchine a stati finiti

- **Stato:** Accettato
- **Data:** 2026-11-08

## Contesto
L'IA usava campi ad hoc (`phase`, `stateUntil`, `mode`, `modeUntil`, `hitDone`) e `if`/`switch` annidati.
Con tre nemici era gestibile; con nuovi nemici e boss sarebbe diventata fragile (c'era già un timer inutilizzato).

## Decisione
- Ogni nemico ha una `StateMachine` (`core/StateMachine.ts`) nel campo `brain`, con stati espliciti e hook
  `enter` / `update` / `exit`. La macchina misura il tempo passato nello stato (`elapsed`).
- Ogni classe documenta il proprio diagramma degli stati nel commento in testa.
- **Stati e ricariche sono separati**: lo stato dice cosa sta facendo il nemico; le ricariche degli attacchi
  (`nextThrow`, `nextVolley`...) sono timer assoluti che scorrono in ogni stato.
- "Il boss si può colpire?" dipende dallo stato (`fighting`, `telegraph`, `charge`, `recover`, `returning`).

## Alternative considerate
- **Behaviour tree**: più potenti per IA complesse e reattive, eccessivi per pattern d'attacco a copione.
- **Macchine a stati gerarchiche**: utili quando gli stati condividono molti sotto-comportamenti; da rivalutare
  se un boss futuro ne avrà bisogno.
- **Ricariche dentro gli stati**: si azzererebbero a ogni cambio di stato, cambiando l'aggressività dei nemici.

## Conseguenze
- Aggiungere un comportamento è aggiungere uno stato; un nuovo nemico è una nuova tabella di stati.
- Il debug parte da "in che stato era?"; gli stati sono ispezionabili durante i test.
- La macchina è piccola e coperta da unit test.
