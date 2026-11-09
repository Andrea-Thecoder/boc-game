import { z } from 'zod';
import { LANGUAGES } from '../core/Settings';

/**
 * Schemas of every game content file (`src/content/data/**\/*.json`).
 * Pure module (only zod): safe to import from unit tests.
 *
 * Rule of thumb: JSON holds the balancing numbers and texts; geometry tied to the sprites
 * (hand offsets, hitboxes, arena positions) stays in code because it changes with the art, not with balancing.
 */

// ---------------------------------------------------------------------------------------------
// shared building blocks
// ---------------------------------------------------------------------------------------------

export const FLAVOUR_IDS = ['tamarindo', 'pera', 'ace', 'pesca'] as const;
export type Flavour = (typeof FLAVOUR_IDS)[number];

export const PICKUP_KINDS = ['pera', 'ace', 'pesca', 'panzerotto'] as const;
export type PickupKind = (typeof PICKUP_KINDS)[number];

export const ENEMY_TYPES = ['chierichetto', 'beghina', 'sacrestano'] as const;
export type EnemyType = (typeof ENEMY_TYPES)[number];

export const BULLET_KINDS = ['ostia', 'goccia', 'fumo', 'campana'] as const;
export type BulletKind = (typeof BULLET_KINDS)[number];

export const SPEAKERS = [
  'paolone',
  'monsignor-panza',
  'nonna',
  'chierichetto',
  'beghina',
  'sacrestano',
  'narratore',
] as const;
export type Speaker = (typeof SPEAKERS)[number];

const positive = z.number().positive();
const nonNegative = z.number().nonnegative();
const ms = z.number().int().nonnegative();
/** [min, max]: the game rolls a uniform random value in between. */
const range = z
  .tuple([nonNegative, nonNegative])
  .refine(([min, max]) => min <= max, { message: 'il minimo deve essere <= del massimo' });
export type Range = z.infer<typeof range>;

// ---------------------------------------------------------------------------------------------
// weapons.json
// ---------------------------------------------------------------------------------------------

export const weaponSchema = z.object({
  /** label shown in the HUD */
  name: z.string().min(1),
  /** ms between two throws */
  cooldown: ms.positive(),
  damage: positive,
  /** null = infinite (the trusty tamarindo) */
  ammo: z.number().int().positive().nullable(),
  /** launch speed, px/s */
  speed: positive,
  /** gravity felt by the brick, px/s² */
  gravity: nonNegative,
  /** angle offsets (radians) of each brick of a volley: [0] = single throw */
  spread: z.array(z.number()).min(1),
  bounces: z.number().int().nonnegative(),
  /** random angle error (radians) */
  jitter: nonNegative,
});
export const weaponsSchema = z.record(z.enum(FLAVOUR_IDS), weaponSchema);
export type WeaponStats = z.infer<typeof weaponSchema>;

// ---------------------------------------------------------------------------------------------
// player.json
// ---------------------------------------------------------------------------------------------

export const playerSchema = z.object({
  maxHp: z.number().int().positive(),
  runSpeed: positive,
  jumpVelocity: positive,
  invulnerabilityMs: ms,
  panzata: z.object({
    cooldownMs: ms,
    /** how long the belly-thrust pose lasts */
    durationMs: ms,
    /** forward push, px/s */
    lunge: nonNegative,
    damage: positive,
    /** hitbox width in front of Paolone, px */
    reach: positive,
  }),
  panzerottoHeal: z.number().int().positive(),
  /** points for collecting any pickup */
  pickupScore: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof playerSchema>;

// ---------------------------------------------------------------------------------------------
// enemies.json
// ---------------------------------------------------------------------------------------------

const enemyBase = { hp: z.number().int().positive(), score: z.number().int().nonnegative() };

export const enemiesSchema = z.object({
  chierichetto: z.object({
    ...enemyBase,
    walkSpeed: positive,
    retreatSpeed: positive,
    /** stays between min and max px from Paolone */
    keepDistance: range,
    attack: z.object({
      firstDelayMs: range,
      cooldownMs: range,
      /** how long he freezes in the throwing pose */
      windupMs: ms,
      range: positive,
      /** seconds the wafer takes to reach Paolone */
      flightTime: positive,
    }),
  }),
  beghina: z.object({
    ...enemyBase,
    walkSpeed: positive,
    /** stops walking closer than this, px */
    stopDistance: nonNegative,
    attack: z.object({
      /** horizontal distance that triggers the wind-up */
      reach: positive,
      verticalReach: positive,
      windupMs: ms,
      whipMs: ms,
    }),
  }),
  sacrestano: z.object({
    ...enemyBase,
    walkSpeed: positive,
    /** walks until he is this close, px */
    keepDistance: positive,
    attack: z.object({
      firstDelayMs: ms,
      cooldownMs: range,
      range: positive,
      /** px/s of the toxic incense cloud */
      smokeSpeed: positive,
    }),
  }),
});
export type EnemiesStats = z.infer<typeof enemiesSchema>;

// ---------------------------------------------------------------------------------------------
// projectiles.json (enemy bullets)
// ---------------------------------------------------------------------------------------------

export const projectilesSchema = z.record(z.enum(BULLET_KINDS), z.object({ gravity: nonNegative }));
export type ProjectilesStats = z.infer<typeof projectilesSchema>;

// ---------------------------------------------------------------------------------------------
// boss-panza.json
// ---------------------------------------------------------------------------------------------

const bossPhaseSchema = z.object({
  /** the phase starts when hp / maxHp drops to this ratio (1 = from the start) */
  hpRatio: z.number().gt(0).lte(1),
  speed: positive,
  volleyEveryMs: ms.positive(),
  volleyCount: z.number().int().positive(),
  summons: z.boolean(),
  bells: z.boolean(),
  charges: z.boolean(),
  /** id of the line Monsignor Panza shouts when the phase starts (monsignor-panza.json) */
  line: z.string().optional(),
});

export const bossSchema = z.object({
  hp: z.number().int().positive(),
  score: z.number().int().nonnegative(),
  entrySpeed: positive,
  /** ordered from the first phase; hpRatio must decrease */
  phases: z
    .array(bossPhaseSchema)
    .min(1)
    .refine((p) => p[0]?.hpRatio === 1, { message: 'la prima fase deve avere hpRatio 1' })
    .refine((p) => p.every((ph, i) => i === 0 || ph.hpRatio < p[i - 1].hpRatio), {
      message: 'hpRatio deve decrescere da una fase alla successiva',
    }),
  firstAttackMs: z.object({ volley: ms, summon: ms, bells: ms, charge: ms }),
  volley: z.object({ spacing: nonNegative, flightTime: positive, flightTimeStep: nonNegative }),
  summon: z.object({ everyMs: ms.positive(), maxAlive: z.number().int().positive() }),
  bells: z.object({ everyMs: ms.positive(), offsets: z.array(z.number()).min(1), staggerMs: ms }),
  charge: z.object({
    everyMs: ms.positive(),
    telegraphMs: ms,
    speed: positive,
    returnSpeed: positive,
    pauseMs: ms,
  }),
});
export type BossStats = z.infer<typeof bossSchema>;

// ---------------------------------------------------------------------------------------------
// props.json (catalogue of scenery pieces)
// ---------------------------------------------------------------------------------------------

export const propSchema = z.object({
  depth: z.number(),
  /** sprite bottom relative to the ground line when the level does not give `y` */
  groundOffset: z.number(),
  /** walkable one-way surface, relative to the sprite's bottom-centre */
  platform: z.object({ dx: z.number(), dy: z.number(), w: positive }).optional(),
  /** where the `label` text goes, relative to the sprite bottom (signs) */
  labelDy: z.number().optional(),
});
export const propsSchema = z.record(z.string().min(1), propSchema);
export type PropKind = z.infer<typeof propSchema>;

// ---------------------------------------------------------------------------------------------
// levels/*.json
// ---------------------------------------------------------------------------------------------

export const spawnSchema = z.object({
  type: z.enum(ENEMY_TYPES),
  /** 'right'/'left' = just outside the screen, a number = absolute x */
  at: z.union([z.literal('right'), z.literal('left'), z.number()]),
  /** absolute y of the feet (e.g. standing on a balcony); default: ground */
  y: z.number().optional(),
  delay: ms.optional(),
});
export type SpawnDef = z.infer<typeof spawnSchema>;

export const waveSchema = z.object({
  /** the wave starts when Paolone passes this x */
  trigger: nonNegative,
  spawns: z.array(spawnSchema).min(1),
  /** id of a line in paolone.json said when the wave starts */
  line: z.string().optional(),
});
export type WaveDef = z.infer<typeof waveSchema>;

export const levelSchema = z.object({
  name: z.string().min(1),
  props: z.array(
    z.object({
      kind: z.string().min(1),
      x: z.number(),
      /** absolute y of the sprite bottom; default: ground + groundOffset of the kind */
      y: z.number().optional(),
      label: z.string().optional(),
    }),
  ),
  pickups: z.array(z.object({ kind: z.enum(PICKUP_KINDS), x: z.number(), y: z.number() })),
  waves: z.array(waveSchema).refine((w) => w.every((wave, i) => i === 0 || wave.trigger >= w[i - 1].trigger), {
    message: 'le ondate devono essere in ordine di trigger crescente',
  }),
  boss: z.object({
    nonnaDrop: z.object({
      firstAfterMs: ms,
      everyMs: ms.positive(),
      kinds: z.array(z.enum(PICKUP_KINDS)).min(1),
    }),
  }),
});
export type LevelDef = z.infer<typeof levelSchema>;

// ---------------------------------------------------------------------------------------------
// dialoghi/<speaker>.json
// ---------------------------------------------------------------------------------------------

/** line id → text, or a list of variants picked at random. Paolone's K are added by the game, never written. */
export const dialogueSchema = z.record(
  z.string().regex(/^[a-z0-9_]+$/, 'gli id delle battute sono in snake_case minuscolo'),
  z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
);
export type DialogueFile = z.infer<typeof dialogueSchema>;

// ---------------------------------------------------------------------------------------------
// ui.json (title screen, menus, options)
// ---------------------------------------------------------------------------------------------

/** Text drawn with the pixel font as it is: uppercase letters, digits and basic punctuation only. */
const pixelText = z
  .string()
  .min(1)
  .regex(
    /^[A-Z0-9 !'",\-.:?+/()<>~]+$/,
    'solo caratteri del font pixel: maiuscole senza accenti, cifre, punteggiatura',
  );

export const uiTextSchema = z.object({
  /** shown after NEW GAME, before the level, until a key is pressed or durationMs is over */
  disclaimer: z.object({
    title: pixelText,
    paragraphs: z.array(pixelText).min(1),
    skip: pixelText,
    durationMs: z.number().int().positive(),
  }),
  title: z.object({ series: pixelText, battleFor: pixelText, place: pixelText, pressAnyKey: pixelText }),
  mainMenu: z.object({ newGame: pixelText, loadGame: pixelText, options: pixelText }),
  pauseMenu: z.object({
    title: pixelText,
    resume: pixelText,
    options: pixelText,
    mainMenu: pixelText,
    /** asked before leaving the level: the run is lost */
    confirmQuestion: pixelText,
    confirmWarning: pixelText,
    yes: pixelText,
    no: pixelText,
  }),
  options: z.object({
    title: pixelText,
    musicVolume: pixelText,
    sfxVolume: pixelText,
    fullscreen: pixelText,
    on: pixelText,
    off: pixelText,
    controls: pixelText,
    language: pixelText,
    back: pixelText,
  }),
  /** name of each language, written in that language */
  languages: z.record(z.enum(LANGUAGES), pixelText),
});
export type UiText = z.infer<typeof uiTextSchema>;

// ---------------------------------------------------------------------------------------------
// controls.json (keyboard bindings: the ONLY place where keys are decided)
// ---------------------------------------------------------------------------------------------

/** Key names, as Phaser calls them (Phaser.Input.Keyboard.KeyCodes). */
export const KEY_NAMES = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'],
  ...['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE', 'ENTER', 'ESC', 'BACKSPACE', 'TAB', 'SHIFT', 'CTRL', 'ALT'],
] as const;
export type KeyName = (typeof KEY_NAMES)[number];

/** Actions while playing: no key may trigger two of them. */
export const GAME_ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'panza', 'pause', 'mute'] as const;
/** Actions in the menus: no key may trigger two of them (they may reuse the game keys). */
export const MENU_ACTIONS = ['menuUp', 'menuDown', 'menuLeft', 'menuRight', 'confirm', 'back'] as const;
export type GameAction = (typeof GAME_ACTIONS)[number];
export type MenuAction = (typeof MENU_ACTIONS)[number];
export type InputAction = GameAction | MenuAction;

const keyList = z.array(z.enum(KEY_NAMES)).min(1);

/** Keys bound to more than one action of the same group, e.g. ["X → fire, jump"]. */
export function duplicateKeys(
  bindings: Partial<Record<InputAction, readonly string[]>>,
  group: readonly InputAction[],
) {
  const owners = new Map<string, InputAction[]>();
  for (const action of group) {
    for (const key of new Set(bindings[action] ?? [])) owners.set(key, [...(owners.get(key) ?? []), action]);
  }
  return [...owners]
    .filter(([, actions]) => actions.length > 1)
    .map(([key, actions]) => `${key} -> ${actions.join(', ')}`);
}

export const controlsSchema = z.object({
  keyboard: z
    .object(
      Object.fromEntries([...GAME_ACTIONS, ...MENU_ACTIONS].map((a) => [a, keyList])) as Record<
        InputAction,
        typeof keyList
      >,
    )
    .superRefine((bindings, ctx) => {
      for (const group of [GAME_ACTIONS, MENU_ACTIONS]) {
        for (const clash of duplicateKeys(bindings, group)) {
          ctx.addIssue({ code: 'custom', message: `tasto usato per due azioni: ${clash}` });
        }
      }
    }),
  /** rows of the CONTROLS table in the options: the keys shown are read from `keyboard` */
  table: z.array(z.object({ label: pixelText, actions: z.array(z.enum(GAME_ACTIONS)).min(1) })).min(1),
});
export type ControlsDef = z.infer<typeof controlsSchema>;
