# Guida ai contenuti di gioco

Questa guida spiega come modificare armi, nemici, boss, livelli e dialoghi **senza toccare la logica del gioco**.
I file veri stanno in `src/content/data/`; qui in `template/` trovi un esempio già compilato per ogni tipo di contenuto,
da copiare e adattare.

> I template **non vengono caricati dal gioco**: sono solo esempi. Un unit test
> (`tests/unit/content/templates.test.ts`) li valida contro gli stessi schemi del gioco, quindi sono sempre corretti.
> Se aggiungi un template nuovo, aggiungilo anche alla tabella `TEMPLATES` di quel test (altrimenti il test fallisce).

## Indice

1. [Cosa si fa col solo JSON e cosa richiede codice](#1-cosa-si-fa-col-solo-json-e-cosa-richiede-codice)
2. [Mappa dei file](#2-mappa-dei-file)
3. [Unità di misura e convenzioni](#3-unità-di-misura-e-convenzioni)
4. [Armi (`weapons.json`)](#4-armi-weaponsjson)
5. [Paolone (`player.json`)](#5-paolone-playerjson)
6. [Nemici (`enemies.json`)](#6-nemici-enemiesjson)
7. [Proiettili nemici (`projectiles.json`)](#7-proiettili-nemici-projectilesjson)
8. [Boss (`boss-panza.json`)](#8-boss-boss-panzajson)
9. [Oggetti di scena (`props.json`)](#9-oggetti-di-scena-propsjson)
10. [Livelli e ondate (`levels/<livello>.json`)](#10-livelli-e-ondate-levelslivellojson)
11. [Dialoghi (`dialoghi/<personaggio>.json`)](#11-dialoghi-dialoghipersonaggiojson)
12. [Ricette passo passo](#12-ricette-passo-passo)
13. [Se il gioco non parte](#13-se-il-gioco-non-parte)

---

## 1. Cosa si fa col solo JSON e cosa richiede codice

Regola dell'architettura: **i dati decidono i numeri, il codice decide i comportamenti.**

| Voglio...                                                         | Cosa tocco                                                         |
|-------------------------------------------------------------------|--------------------------------------------------------------------|
| cambiare danni, vita, velocità, munizioni, punteggi, tempi        | ✅ solo il JSON                                                    |
| aggiungere/spostare ondate, oggetti di scena, pickup nel livello  | ✅ solo il JSON del livello                                        |
| aggiungere o cambiare battute                                     | ✅ solo il JSON dei dialoghi                                       |
| cambiare le fasi del boss (soglie, attacchi attivi, frasi)        | ✅ solo `boss-panza.json`                                          |
| aggiungere un **tipo** di oggetto di scena                        | ⚠️ JSON + disegno dello sprite (`art/`)                            |
| aggiungere un **gusto** di sukkino                                | ⚠️ JSON + 2 righe di id + sprite ([ricetta 12.2](#122-aggiungere-un-gusto-di-sukkino)) |
| aggiungere un **tipo** di nemico                                  | ❌ JSON + codice del comportamento + sprite ([ricetta 12.3](#123-aggiungere-un-tipo-di-nemico)) |
| aggiungere un **secondo livello**                                 | ❌ oggi serve codice (arriva con Tiled nella fase 3)               |

Quando serve codice, TypeScript ti guida: aggiunto l'id nuovo, `npm run typecheck` segnala ogni punto da completare.

## 2. Mappa dei file

| File in `src/content/data/`    | Template                                   | Contiene                                    |
|--------------------------------|--------------------------------------------|---------------------------------------------|
| `weapons.json`                 | `template/arma.json`                       | i gusti di sukkino (armi)                   |
| `player.json`                  | `template/giocatore.json`                  | statistiche di Paolone e della panzata      |
| `enemies.json`                 | `template/nemico-*.json`                   | statistiche dei fedeli                      |
| `projectiles.json`             | `template/proiettile.json`                 | gravità dei proiettili nemici               |
| `boss-panza.json`              | `template/boss.json`                       | Monsignor Panza e le sue fasi               |
| `props.json`                   | `template/oggetto-di-scena.json`           | catalogo degli oggetti di scena             |
| `levels/level1.json`           | `template/livello.json`, `template/ondata.json` | oggetti, pickup, ondate, drop delle nonne |
| `dialoghi/<personaggio>.json`  | `template/dialoghi.json`                   | le battute di un personaggio                |
| `ui.json`                      | (nessuno: c'è un solo file)                | titolo, voci del menu e delle opzioni       |
| `controls.json`                | (nessuno: c'è un solo file)                | i tasti di ogni azione                      |

Lo schema di ogni file (i campi ammessi e i loro limiti) sta in `src/content/schemas.ts`: è la fonte di verità,
questa guida lo riassume.

## 3. Unità di misura e convenzioni

| Suffisso / tipo         | Significato                                                                     |
|-------------------------|---------------------------------------------------------------------------------|
| `...Ms`, `cooldown`     | millisecondi (1000 = 1 secondo), numeri interi                                  |
| `speed`, `...Speed`     | pixel al secondo. Lo schermo è largo **320 px**: 100 px/s = un terzo di schermo al secondo |
| `gravity`               | pixel al secondo². Più è alto, più l'oggetto cade in fretta                    |
| `x`, `y`                | pixel nel livello. `x` da 0 a 3520 (lunghezza del livello), `y` da 0 (cielo) a **160** (terreno) |
| angoli (`spread`, `jitter`) | radianti: 0.1 ≈ 6°, 0.26 ≈ 15°, 0.52 ≈ 30°                                 |
| `[min, max]`            | intervallo: il gioco estrae un valore a caso in mezzo (es. `[1600, 2500]`)      |
| `flightTime`            | secondi                                                                         |
| `hp`, `damage`          | interi; un sukkino base fa 1 di danno                                           |
| `null` (solo `ammo`)    | infinito                                                                        |
| id (chiavi, battute)    | `snake_case` minuscolo senza accenti: `ondata_beghine`, `raccolta_pera`         |

## 4. Armi (`weapons.json`)

Ogni chiave è l'id di un gusto (`tamarindo`, `pera`, `ace`, `pesca`). Template: [`template/arma.json`](template/arma.json).

```json
"pera": {
  "name": "SUKKINO ALLA PERA",
  "cooldown": 380,
  "damage": 1,
  "ammo": 30,
  "speed": 240,
  "gravity": 220,
  "spread": [-0.24, 0, 0.24],
  "bounces": 0,
  "jitter": 0
}
```

| Campo      | Tipo                 | Significato                                                                    |
|------------|----------------------|--------------------------------------------------------------------------------|
| `name`     | testo                | nome mostrato nell'HUD                                                         |
| `cooldown` | ms > 0               | pausa tra due lanci: più basso = mitragliatrice                                |
| `damage`   | > 0                  | danno di ogni sukkino                                                          |
| `ammo`     | intero > 0 o `null`  | munizioni; `null` = infinite. **Il tamarindo deve avere `null`** (è l'arma di riserva) |
| `speed`    | px/s > 0             | velocità di lancio                                                             |
| `gravity`  | px/s² ≥ 0            | quanto la traiettoria cade: 0 = dritto, 480 = parabola corta                   |
| `spread`   | lista di radianti    | un sukkino per elemento: `[0]` = colpo singolo, `[-0.24, 0, 0.24]` = ventaglio da 3 |
| `bounces`  | intero ≥ 0           | quante volte rimbalza a terra prima di spiaccicarsi                            |
| `jitter`   | radianti ≥ 0         | imprecisione casuale di ogni lancio                                            |

Esempi di "carattere": **fucile a pompa** → `spread` largo, `cooldown` alto; **mitra** → `cooldown` 80-100, `jitter` 0.1;
**granata** → `gravity` alta, `bounces` 2-3, `damage` 2.

## 5. Paolone (`player.json`)

Template: [`template/giocatore.json`](template/giocatore.json).

| Campo                  | Tipo     | Significato                                                     |
|------------------------|----------|-----------------------------------------------------------------|
| `maxHp`                | intero   | cuori massimi                                                   |
| `runSpeed`             | px/s     | velocità di corsa                                               |
| `jumpVelocity`         | px/s     | spinta del salto (330 ≈ salta su un balcone basso)              |
| `invulnerabilityMs`    | ms       | invulnerabilità (lampeggio) dopo un colpo subito               |
| `panzata.cooldownMs`   | ms       | pausa minima tra due panzate                                    |
| `panzata.durationMs`   | ms       | quanto dura la posa di panzata                                  |
| `panzata.lunge`        | px/s     | spinta in avanti durante la panzata                             |
| `panzata.damage`       | > 0      | danno della panzata                                             |
| `panzata.reach`        | px       | larghezza della zona colpita davanti a Paolone                  |
| `panzerottoHeal`       | intero   | cuori recuperati con un panzerotto                              |
| `pickupScore`          | intero   | punti per ogni oggetto raccolto                                 |

## 6. Nemici (`enemies.json`)

Ogni nemico ha `hp` (vita) e `score` (punti quando muore), più i campi del **suo** comportamento: i campi cambiano
da nemico a nemico perché ognuno attacca in modo diverso. Un template per tipo:

**Chierichetto**, tiratore a distanza ([`template/nemico-chierichetto.json`](template/nemico-chierichetto.json))

| Campo                 | Significato                                                        |
|-----------------------|--------------------------------------------------------------------|
| `walkSpeed`           | px/s quando si avvicina                                            |
| `retreatSpeed`        | px/s quando indietreggia                                           |
| `keepDistance`        | `[min, max]` px: resta a questa distanza da Paolone                |
| `attack.firstDelayMs` | `[min, max]` ms prima del primo lancio                             |
| `attack.cooldownMs`   | `[min, max]` ms tra un lancio e l'altro                            |
| `attack.windupMs`     | ms in cui resta fermo nella posa di lancio                         |
| `attack.range`        | px: lancia solo se Paolone è più vicino di così                    |
| `attack.flightTime`   | secondi che l'ostia impiega ad arrivare (più basso = tiro più teso) |

**Beghina**, corpo a corpo ([`template/nemico-beghina.json`](template/nemico-beghina.json))

| Campo                  | Significato                                                     |
|------------------------|-----------------------------------------------------------------|
| `walkSpeed`            | px/s                                                            |
| `stopDistance`         | px: smette di avanzare quando è così vicina                     |
| `attack.reach`         | px orizzontali entro cui inizia a caricare la frustata          |
| `attack.verticalReach` | px verticali (se Paolone è su un balcone non lo frusta)         |
| `attack.windupMs`      | ms di caricamento: è il tempo che hai per scappare o colpirla   |
| `attack.whipMs`        | ms della frustata                                               |

**Sacrestano**, nube lenta ([`template/nemico-sacrestano.json`](template/nemico-sacrestano.json))

| Campo                 | Significato                                                |
|-----------------------|------------------------------------------------------------|
| `walkSpeed`           | px/s                                                       |
| `keepDistance`        | px: avanza finché non è a questa distanza                  |
| `attack.firstDelayMs` | ms prima della prima nube                                  |
| `attack.cooldownMs`   | `[min, max]` ms tra due nubi                               |
| `attack.range`        | px: sbuffa solo se Paolone è più vicino di così            |
| `attack.smokeSpeed`   | px/s della nube d'incenso                                  |

## 7. Proiettili nemici (`projectiles.json`)

Una chiave per proiettile (`ostia`, `goccia`, `fumo`, `campana`), con un solo campo: `gravity` (px/s²).
`0` = fluttua (l'incenso), valori alti = cade a picco (la campana). Template: [`template/proiettile.json`](template/proiettile.json).

## 8. Boss (`boss-panza.json`)

Template: [`template/boss.json`](template/boss.json) (versione a 2 fasi invece di 3).

| Campo                          | Significato                                                              |
|--------------------------------|--------------------------------------------------------------------------|
| `hp`, `score`                  | vita e punti                                                             |
| `entrySpeed`                   | px/s con cui entra nell'arena                                            |
| `phases`                       | lista delle fasi, dalla prima all'ultima (vedi sotto)                    |
| `firstAttackMs.*`              | ms dall'inizio dello scontro al primo uso di ogni attacco                |
| `volley.spacing`               | px tra le gocce di acquasanta di una raffica                             |
| `volley.flightTime`            | secondi di volo della prima goccia                                       |
| `volley.flightTimeStep`        | secondi in più per ogni goccia successiva (cadono a scaglioni)           |
| `summon.everyMs`, `maxAlive`   | ogni quanto chiama un chierichetto e quanti al massimo insieme           |
| `bells.everyMs`                | ogni quanto cadono le campane                                            |
| `bells.offsets`                | px rispetto a Paolone dove cade ogni campana: `[-44, 0, 44]` = tre campane |
| `bells.staggerMs`              | ms tra una campana e la successiva                                       |
| `charge.everyMs`               | ogni quanto carica con la Papamobile                                     |
| `charge.telegraphMs`           | ms di avviso (motore che romba) prima della carica                       |
| `charge.speed`, `returnSpeed`  | px/s in carica e al ritorno                                              |
| `charge.pauseMs`               | ms di stordimento contro il muro                                         |

**Fasi.** Ogni fase dice quali attacchi sono attivi:

| Campo           | Significato                                                                         |
|-----------------|-------------------------------------------------------------------------------------|
| `hpRatio`       | la fase parte quando la vita scende a questa frazione. **La prima deve essere `1`**, le altre devono **scendere** (es. 1 → 0.66 → 0.33) |
| `speed`         | px/s di pattugliamento                                                              |
| `volleyEveryMs` | ms tra due raffiche di acquasanta                                                   |
| `volleyCount`   | gocce per raffica                                                                   |
| `summons`       | `true` = chiama chierichetti                                                        |
| `bells`         | `true` = fa cadere campane                                                          |
| `charges`       | `true` = carica con la Papamobile                                                   |
| `line`          | (facoltativo) id della battuta in `dialoghi/monsignor-panza.json` urlata a inizio fase |

## 9. Oggetti di scena (`props.json`)

È il **catalogo dei tipi** (lampione, fico, balcone...). Dove metterli lo decide il livello (sezione 10).
Template: [`template/oggetto-di-scena.json`](template/oggetto-di-scena.json).

| Campo          | Tipo         | Significato                                                                    |
|----------------|--------------|--------------------------------------------------------------------------------|
| `depth`        | numero       | ordine di disegno: più alto = davanti (Paolone sta a 60)                       |
| `groundOffset` | px           | spostamento verticale rispetto al terreno, se il livello non dà la `y`        |
| `platform`     | facoltativo  | se c'è, ci si può salire sopra (piattaforma attraversabile dal basso)          |
| `platform.dx`  | px           | spostamento orizzontale della piattaforma rispetto al centro dello sprite      |
| `platform.dy`  | px           | altezza della piattaforma rispetto alla base dello sprite (negativo = più in alto) |
| `platform.w`   | px           | larghezza della piattaforma                                                    |
| `labelDy`      | facoltativo  | per i cartelli: dove scrivere il testo `label` rispetto alla base              |

Il nome del tipo deve corrispondere a uno sprite disegnato in `src/art/` (un tipo nuovo richiede di disegnarlo).

## 10. Livelli e ondate (`levels/<livello>.json`)

Template completo: [`template/livello.json`](template/livello.json). Template di una singola ondata:
[`template/ondata.json`](template/ondata.json).

**Intestazione**: `name` è il nome mostrato a inizio livello e nella schermata finale.

**`props`**: gli oggetti di scena piazzati.

```json
{ "kind": "balcone", "x": 730, "y": 122 }
```

- `kind`: un tipo esistente in `props.json`
- `x`: centro dell'oggetto
- `y` (facoltativo): base dell'oggetto; se manca, sta a terra. Utile per balconi a varie altezze o casse impilate
- `label` (facoltativo): testo, solo per i cartelli

**`pickups`**: oggetti da raccogliere, fluttuanti.

```json
{ "kind": "pera", "x": 566, "y": 128 }
```

- `kind`: `pera`, `ace`, `pesca` (armi) o `panzerotto` (cura)
- `x`, `y`: posizione. Mettili raggiungibili: sopra una piattaforma, o a terra con `y` circa 150

**`waves`**: le ondate di nemici. **Devono essere in ordine di `trigger` crescente.**

```json
{
  "trigger": 600,
  "line": "ondata_processione",
  "spawns": [
    { "type": "chierichetto", "at": "right" },
    { "type": "beghina", "at": "left", "delay": 800 },
    { "type": "sacrestano", "at": 760, "y": 112, "delay": 1500 }
  ]
}
```

| Campo             | Significato                                                                        |
|-------------------|------------------------------------------------------------------------------------|
| `trigger`         | l'ondata parte quando Paolone supera questa `x`                                    |
| `line`            | (facoltativo) id di una battuta di `dialoghi/paolone.json` detta all'inizio        |
| `spawns[].type`   | `chierichetto`, `beghina` o `sacrestano`                                          |
| `spawns[].at`     | `"right"` / `"left"` = appena fuori dallo schermo da quel lato; un numero = `x` precisa nel livello |
| `spawns[].y`      | (facoltativo) altezza dei piedi, per far comparire un nemico su un balcone        |
| `spawns[].delay`  | (facoltativo) ms di attesa dall'inizio dell'ondata: serve a farli entrare uno dopo l'altro |

> ⚠️ Un nemico con `at` numerico deve comparire **vicino allo schermo** (entro 60 px dal bordo), altrimenti la sua
> IA resta ferma finché la camera non arriva. Per i nemici "che entrano" usa `"right"` / `"left"`.

**`boss.nonnaDrop`**: durante lo scontro col boss le nonne lanciano oggetti dai balconi.

| Campo          | Significato                                                                         |
|----------------|-------------------------------------------------------------------------------------|
| `firstAfterMs` | ms dall'inizio dello scontro al primo lancio                                        |
| `everyMs`      | ms tra un lancio e l'altro                                                          |
| `kinds`        | lista da cui si estrae a caso; ripetere un elemento lo rende più probabile (due `panzerotto` = doppia probabilità) |

## 11. Dialoghi (`dialoghi/<personaggio>.json`)

Un file per personaggio: `paolone`, `monsignor-panza`, `nonna`, `chierichetto`, `beghina`, `sacrestano`, `narratore`.
Template: [`template/dialoghi.json`](template/dialoghi.json).

```json
{
  "saluto": "Buongiorno, giovanotto!",
  "morte": ["Ahia!", "Mannaggia!", "Ci vediamo in Paradiso!"]
}
```

- La **chiave** è l'id della battuta (`snake_case` minuscolo); il codice e gli altri JSON la richiamano per id.
- Il **valore** è un testo, oppure una **lista di varianti**: il gioco ne sceglie una a caso ogni volta.
- **Paolone si scrive in italiano normale.** Le K le aggiunge il gioco (`kappa()`): scrivi "Che bontà", non "Ke bontà".
- I fumetti vanno a capo da soli ma sono piccoli: tieni le battute brevi, una o due frasi.
- Non cancellare o rinominare un id usato dal gioco: se lo fai, il gioco non parte e ti dice quale manca.

Battute con un ruolo fisso:

| Id                         | File                   | Quando                                                       |
|----------------------------|------------------------|--------------------------------------------------------------|
| `raccolta_<gusto>`         | `paolone.json`         | quando raccoglie un sukkino (**obbligatoria** per ogni gusto) |
| `raccolta_panzerotto`      | `paolone.json`         | quando raccoglie un panzerotto                               |
| `ondata_*`                 | `paolone.json`         | richiamate dalle ondate col campo `line`                     |
| `fase_2`, `fase_3`...      | `monsignor-panza.json` | richiamate dalle fasi del boss col campo `line`              |
| `morte`                    | file di ogni nemico    | quando il nemico muore                                       |

### Testi dell'interfaccia (`ui.json`)

Avvertenza mostrata dopo NEW GAME (`disclaimer`: titolo, paragrafi, scritta per saltarla e `durationMs`, quanto resta a schermo),
titolo, voci del menu principale e voci delle opzioni. Si possono cambiare liberamente, con un
vincolo: **solo maiuscole senza accenti, cifre e punteggiatura semplice** (sono scritti col font pixel così come sono).
Una lettera minuscola o accentata blocca il gioco all'avvio con un messaggio chiaro.

### Tasti (`controls.json`)

**L'unico posto dove si decidono i tasti.** Il gioco, i menu e la tabella CONTROLS delle opzioni li leggono da qui.

```json
"keyboard": {
  "fire": ["X", "J"],
  "panza": ["C", "L"],
  ...
}
```

Ogni azione ha una lista di tasti, e funzionano tutti.

| Azione          | Cosa fa (in gioco)                | Azione                  | Cosa fa (nei menu)          |
|-----------------|-----------------------------------|-------------------------|-----------------------------|
| `left`, `right` | muoversi                          | `menuUp`, `menuDown`    | spostare il cursore         |
| `up`            | mirare in alto                    | `menuLeft`, `menuRight` | regolare un valore (volume) |
| `down`          | abbassarsi / scendere dai balconi | `confirm`               | confermare                  |
| `jump`          | saltare                           | `back`                  | tornare indietro            |
| `fire`          | lanciare il sukkino               |                         |                             |
| `panza`         | panzata                           |                         |                             |
| `pause`         | pausa                             |                         |                             |
| `mute`          | audio sì/no                       |                         |                             |

**Nomi dei tasti** (in maiuscolo): le lettere `A`...`Z`, le cifre scritte in inglese `ZERO`...`NINE`, le frecce
`LEFT` `RIGHT` `UP` `DOWN`, e `SPACE`, `ENTER`, `ESC`, `BACKSPACE`, `TAB`, `SHIFT`, `CTRL`, `ALT`.

**Regola**: lo stesso tasto non può fare due azioni di gioco (es. `X` sia per `jump` sia per `fire`): il gioco non
parte e ti dice quale tasto è doppio. Un tasto del gioco può invece servire anche nei menu (`Z` salta e conferma).

**`table`**: le righe della tabella CONTROLS nelle opzioni. Scegli tu il nome della riga (`label`) e quali azioni
mostra; i tasti li scrive il gioco da solo, leggendoli da `keyboard`. Più azioni nella stessa riga vengono accoppiate:
`left` + `right` diventa `ARROWS / A D`.

Esempio: **lanciare con Q invece che con X** → `"fire": ["Q", "J"]`. Fatto: gioco e tabella si aggiornano insieme.

## 12. Ricette passo passo

Dopo ogni modifica: `npm run dev` per provarla, `npm run check` prima del commit.

### 12.1 Ribilanciare (il caso più comune)

1. Apri il JSON e cambia il numero.
2. Salva: il dev server ricarica il gioco da solo.

Nient'altro. Se il valore non è ammesso (es. `cooldown: 0`), il gioco non parte e ti dice file e campo.

### 12.2 Aggiungere un gusto di sukkino

Esempio: il **mango**.

1. `src/content/schemas.ts`: aggiungi `'mango'` a `FLAVOUR_IDS` e a `PICKUP_KINDS`.
2. `src/content/data/weapons.json`: aggiungi la voce `"mango"` partendo da [`template/arma.json`](template/arma.json).
3. `src/content/data/dialoghi/paolone.json`: aggiungi `"raccolta_mango"` (obbligatoria, altrimenti il gioco non parte).
4. `npm run typecheck`: ti segnala `FLAVOURS` in `src/art/sprites.ts`; aggiungi il colore del gusto
   (e, se serve, il colore nuovo in `src/art/palette.ts`).
5. `src/art/sprites.ts`: aggiungi lo sprite grande del pickup (`pickup-mango`), copiando quello di `pickup-pera`.
6. Piazzalo in un livello: `{ "kind": "mango", "x": ..., "y": ... }` in `pickups`, e se vuoi in `boss.nonnaDrop.kinds`.

### 12.3 Aggiungere un tipo di nemico

Esempio: la **perpetua**. Qui il codice serve per forza: va scritto **come** si comporta.

1. Descrivi il comportamento come macchina a stati (es. `walk → windup → attack → cooldown`, vedi ADR 0003).
   Se somiglia a un nemico esistente, partine da quello.
2. `src/content/schemas.ts`: aggiungi `'perpetua'` a `ENEMY_TYPES` e il suo oggetto in `enemiesSchema`
   (parti da quello del nemico più simile).
3. `src/content/data/enemies.json`: aggiungi i numeri, partendo dal template del nemico più simile.
4. Dialoghi: crea `src/content/data/dialoghi/perpetua.json` con almeno `"morte"`, aggiungi `'perpetua'` a `SPEAKERS`
   e il file a `RAW_DIALOGUES` in `src/content/index.ts`.
5. Codice: la classe in `src/entities/enemies/` (con il suo `brain: StateMachine`), registrata in
   `ENEMY_FACTORIES` di `src/systems/SpawnSystem.ts` (`npm run typecheck` ti dice che manca).
6. Sprite e animazioni in `src/art/sprites.ts`.
7. Usalo nelle ondate: `{ "type": "perpetua", "at": "right" }`.

Questo è un lavoro da fare insieme a un agente: tu descrivi il comportamento, lui scrive la macchina a stati.

### 12.4 Aggiungere un'ondata

1. In `levels/level1.json`, dentro `waves`, aggiungi un oggetto partendo da [`template/ondata.json`](template/ondata.json).
2. Mettila **nella posizione giusta** della lista: i `trigger` devono essere crescenti.
3. Se vuoi una battuta, aggiungi prima l'id in `dialoghi/paolone.json` e poi mettilo in `line`.

### 12.5 Aggiungere una battuta

1. Apri `dialoghi/<personaggio>.json` e aggiungi `"id_nuovo": "Testo"` (o una lista di varianti).
2. Se è una battuta di ondata o di fase del boss, richiamala con `line` nel JSON relativo: fatto.
   Se deve dirla il codice in un momento nuovo, serve una riga di codice (`line('paolone', 'id_nuovo')`).

### 12.6 Aggiungere un oggetto di scena

1. Se il **tipo** esiste già (balcone, cassetta...): aggiungi `{ "kind": "...", "x": ... }` in `props` del livello.
2. Se è un **tipo nuovo**: aggiungilo a `props.json` partendo da
   [`template/oggetto-di-scena.json`](template/oggetto-di-scena.json) e disegna lo sprite con lo stesso nome in `src/art/`.

## 13. Se il gioco non parte

Ogni JSON viene controllato all'avvio. Se qualcosa non va il gioco si ferma subito, con un messaggio nella console
del browser (F12) che indica **file e campo**:

```
Contenuto non valido in src/content/data/weapons.json:
  - pera.cooldown: Too small: expected number to be >0
```

```
Riferimenti non validi nei contenuti:
  - levels/level1.json waves[3].line: battuta "ondata_suore" assente in dialoghi/paolone.json
```

| Errore tipico                                   | Causa                                                                |
|-------------------------------------------------|----------------------------------------------------------------------|
| `Unexpected token` / `JSON.parse`               | virgola di troppo o mancante, virgolette dimenticate                 |
| `Too small` / `Too big`                         | numero fuori dai limiti (es. negativo, zero dove serve > 0)          |
| `Invalid option` / `Invalid enum`               | id non riconosciuto (es. `"type": "suora"` se il nemico non esiste)  |
| `il minimo deve essere <= del massimo`          | intervallo `[min, max]` scritto al contrario                         |
| `le ondate devono essere in ordine...`          | ondate non in ordine di `trigger`                                    |
| `hpRatio deve decrescere...`                    | fasi del boss in ordine sbagliato                                    |
| `battuta "..." assente`                         | un'ondata o una fase richiama un id che non esiste nei dialoghi      |
| `tipo di oggetto "..." assente in props.json`   | `kind` sbagliato nel livello                                         |

Un modo comodo per scoprire subito gli errori, senza aprire il browser: `npm run test:unit`.
