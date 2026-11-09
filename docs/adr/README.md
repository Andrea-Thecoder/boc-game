# Architecture Decision Records

Ogni file registra **una** decisione architetturale: il contesto, cosa si è deciso, le alternative scartate e le
conseguenze. Servono a capire *perché* il codice è fatto così.

Regole:
- Un ADR non si riscrive: se una decisione cambia, se ne scrive uno nuovo e il vecchio passa a **Sostituito da ADR-XXXX**.
- Numerazione progressiva, titolo breve, in italiano.
- Formato: Stato · Contesto · Decisione · Alternative considerate · Conseguenze.

| # | Decisione | Stato |
|---|---|---|
| [0001](0001-sistemi-ed-eventbus.md) | Scene come orchestrazione, logica nei sistemi, comunicazione via EventBus tipizzato | Accettato |
| [0002](0002-contenuti-json-zod.md) | Contenuti di gioco in JSON validati con zod, nel repository (non in un database) | Accettato |
| [0003](0003-ia-macchine-a-stati.md) | IA di nemici e boss come macchine a stati finiti | Accettato |
| [0004](0004-object-pooling.md) | Object pooling per proiettili e scritte volanti | Accettato |
| [0005](0005-telemetria-locale.md) | Telemetria dietro un'interfaccia, oggi salvata in locale | Accettato |
| [0006](0006-smoke-test-api-stabile.md) | Smoke test e2e su un'API di test stabile e clock deterministico | Accettato |
