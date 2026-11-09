import type Phaser from 'phaser';
import type { EventBus } from '../core/EventBus';
import type { BulletKind, Flavour, PickupKind, Weapon } from '../content';
import type { Enemy } from '../entities/enemies/Enemy';
import type { RunOutcome } from './telemetry/RunRecorder';

/** Anything a speech bubble can follow. */
export type BubbleTarget = { x: number; y: number; active?: boolean };

/**
 * Every event of the game and its payload: the single source of truth for the EventBus.
 * Emitting or listening to an event not listed here, or with the wrong payload, does not compile.
 *
 * Two kinds of events:
 * - FACTS (past tense): something happened in the game. Entities emit them, systems react.
 * - PRESENTATION REQUESTS (`fx:*`, `dialogue:*`): ask for visuals or a speech bubble, never change game state.
 */
export interface GameEvents {
  // --- Paolone -------------------------------------------------------------------------------
  /** Paolone threw a volley: one brick per angle */
  'player:threw': { weapon: Weapon; x: number; y: number; angles: number[] };
  /** belly thrust: everything in `area` takes `damage` */
  'player:panzata': { area: Phaser.Geom.Rectangle; damage: number; facing: number };
  /** heavy landing after a fall */
  'player:landed': { x: number; y: number };
  'player:hurt': { hp: number };
  'player:healed': { hp: number };
  /** Paolone lost his last heart */
  'player:died': void;
  'weapon:changed': { flavour: Flavour; ammo: number };
  /** the special juice ran out, back to tamarindo */
  'weapon:depleted': void;

  // --- projectiles ---------------------------------------------------------------------------
  /** a brick burst on something */
  'sukkino:splat': { x: number; y: number; flavour: Flavour };
  /** an enemy (or the boss) fires a bullet */
  'enemy:fired': { kind: BulletKind; x: number; y: number; vx: number; vy: number };

  // --- enemies -------------------------------------------------------------------------------
  /** an enemy (or the boss) has been defeated */
  'enemy:killed': { enemy: Enemy; points: number };

  // --- level ---------------------------------------------------------------------------------
  /** Paolone collected a pickup */
  'pickup:collected': { kind: PickupKind; x: number; y: number };
  /** Paolone reached a wave trigger; `line` is the optional id of what he says (paolone.json) */
  'wave:started': { index: number; line?: string };

  // --- boss ----------------------------------------------------------------------------------
  /** the camera stopped at the boss arena: walls up, boss music */
  'boss:arenaLocked': void;
  /** the boss finished his entrance and stopped: intro dialogue time */
  'boss:arrived': void;
  /** the boss starts attacking */
  'boss:fightStarted': void;
  'boss:damaged': { hp: number; maxHp: number };
  /** `phase` is the index in boss-panza.json phases */
  'boss:phaseChanged': { phase: number };
  /** the boss wants altar boys: the arena decides if there is room for one more */
  'boss:summonRequested': void;
  /** the boss has been launched into orbit */
  'boss:defeated': void;

  // --- run -----------------------------------------------------------------------------------
  /** something shown in the HUD changed (hp, weapon, ammo, score, boss hp) */
  'hud:changed': void;
  /** the run is over: no more spawns, the end screen (or the title, after quitting) follows */
  'run:over': { outcome: RunOutcome };
  /** the player paused the run: the pause menu opens */
  'run:paused': void;

  // --- presentation requests -----------------------------------------------------------------
  'fx:sparkle': { x: number; y: number; count?: number };
  'fx:dust': { x: number; y: number };
  'fx:explosion': { x: number; y: number };
  'fx:shake': { durationMs: number; intensity: number };
  'dialogue:say': { target: BubbleTarget; text: string; durationMs?: number; shout?: boolean };
}

/** The bus as seen by entities: the only channel they have to talk to the game. */
export type GameBus = EventBus<GameEvents>;
