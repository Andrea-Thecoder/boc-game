import type { PickupKind } from '../content';
import type { Enemy } from '../entities/enemies/Enemy';

/**
 * Every gameplay event and its payload. The single source of truth for the EventBus:
 * emitting or listening to an event not listed here, or with the wrong payload, does not compile.
 *
 * Naming: `<subject>:<what happened>`, past tense for facts.
 */
export interface GameEvents {
  /** an enemy (or the boss) has been defeated */
  'enemy:killed': { enemy: Enemy; points: number };
  /** Paolone collected a pickup */
  'pickup:collected': { kind: PickupKind; x: number; y: number };
  /** Paolone reached a wave trigger; `line` is the optional id of what he says (paolone.json) */
  'wave:started': { index: number; line?: string };
  /** the camera stopped at the boss arena: walls up, boss music */
  'boss:arenaLocked': void;
  /** the boss finished his entrance and stopped: intro dialogue time */
  'boss:arrived': void;
  /** the boss starts attacking */
  'boss:fightStarted': void;
  /** the boss has been launched into orbit */
  'boss:defeated': void;
  /** Paolone lost his last heart */
  'player:died': void;
  /** something shown in the HUD changed (hp, weapon, ammo, score, boss hp) */
  'hud:changed': void;
  /** the run is over: no more spawns, the end screen follows */
  'run:over': { outcome: 'victory' | 'gameover' };
}
