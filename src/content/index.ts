/**
 * Single entry point of the game content. Every JSON is validated when this module is first imported:
 * a broken file stops the game at startup with a clear message instead of failing mid-level.
 *
 * Pure module (zod + JSON): safe to import from unit tests.
 */
import { pick } from '../core/random';
import {
  bossSchema,
  controlsSchema,
  dialogueSchema,
  enemiesSchema,
  levelSchema,
  playerSchema,
  projectilesSchema,
  propsSchema,
  uiTextSchema,
  weaponsSchema,
  FLAVOUR_IDS,
  SPEAKERS,
  type DialogueFile,
  type Flavour,
  type Speaker,
  type WeaponStats,
} from './schemas';
import { parseContent, validateReferences } from './validate';

import weaponsJson from './data/weapons.json';
import playerJson from './data/player.json';
import enemiesJson from './data/enemies.json';
import projectilesJson from './data/projectiles.json';
import bossJson from './data/boss-panza.json';
import propsJson from './data/props.json';
import uiJson from './data/ui.json';
import controlsJson from './data/controls.json';
import level1Json from './data/levels/level1.json';
import paoloneJson from './data/dialoghi/paolone.json';
import panzaJson from './data/dialoghi/monsignor-panza.json';
import nonnaJson from './data/dialoghi/nonna.json';
import chierichettoJson from './data/dialoghi/chierichetto.json';
import beghinaJson from './data/dialoghi/beghina.json';
import sacrestanoJson from './data/dialoghi/sacrestano.json';
import narratoreJson from './data/dialoghi/narratore.json';

export * from './schemas';

/** Raw dialogue files: their JSON keys give `line()` compile-time checked ids. */
const RAW_DIALOGUES = {
  paolone: paoloneJson,
  'monsignor-panza': panzaJson,
  nonna: nonnaJson,
  chierichetto: chierichettoJson,
  beghina: beghinaJson,
  sacrestano: sacrestanoJson,
  narratore: narratoreJson,
} satisfies Record<Speaker, unknown>;

export type LineId<S extends Speaker> = keyof (typeof RAW_DIALOGUES)[S] & string;

/** A weapon ready for the game: `ammo` is Infinity instead of null. */
export interface Weapon extends Omit<WeaponStats, 'ammo'> {
  flavour: Flavour;
  ammo: number;
}

function load() {
  const weaponStats = parseContent(weaponsSchema, weaponsJson, 'weapons.json');
  const dialogues = Object.fromEntries(
    SPEAKERS.map((s) => [s, parseContent(dialogueSchema, RAW_DIALOGUES[s], `dialoghi/${s}.json`)]),
  ) as Record<Speaker, DialogueFile>;

  const bundle = {
    weaponStats,
    player: parseContent(playerSchema, playerJson, 'player.json'),
    enemies: parseContent(enemiesSchema, enemiesJson, 'enemies.json'),
    projectiles: parseContent(projectilesSchema, projectilesJson, 'projectiles.json'),
    boss: parseContent(bossSchema, bossJson, 'boss-panza.json'),
    props: parseContent(propsSchema, propsJson, 'props.json'),
    ui: parseContent(uiTextSchema, uiJson, 'ui.json'),
    controls: parseContent(controlsSchema, controlsJson, 'controls.json'),
    levels: { level1: parseContent(levelSchema, level1Json, 'levels/level1.json') },
    dialogues,
  };

  const errors = validateReferences({ ...bundle, weapons: weaponStats });
  if (errors.length) throw new Error(`Riferimenti non validi nei contenuti:\n  - ${errors.join('\n  - ')}`);

  const weapons = Object.fromEntries(
    FLAVOUR_IDS.map((f) => [f, { ...weaponStats[f], flavour: f, ammo: weaponStats[f].ammo ?? Infinity }]),
  ) as Record<Flavour, Weapon>;

  return { ...bundle, weapons };
}

export const CONTENT = load();

/** A line of dialogue; a list of variants returns one at random. Ids are checked at compile time. */
export function line<S extends Speaker>(speaker: S, id: LineId<S>): string {
  return lineById(speaker, id);
}

/** Same as `line()` for ids that come from data (wave lines, boss phases): validated at load time. */
export function lineById(speaker: Speaker, id: string): string {
  const value = CONTENT.dialogues[speaker][id];
  if (value === undefined) throw new Error(`Battuta "${id}" assente in dialoghi/${speaker}.json`);
  return typeof value === 'string' ? value : pick(value);
}
