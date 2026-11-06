import type Phaser from 'phaser';
import type { EventBus } from '../core/EventBus';
import type { Player } from '../entities/Player';
import type GameScene from '../scenes/GameScene';
import type { GameEvents } from './events';

/** Physics groups shared by the systems. Plain groups (see CLAUDE.md: physics groups reset bodies). */
export interface ActorGroups {
  sukkini: Phaser.GameObjects.Group;
  enemies: Phaser.GameObjects.Group;
  enemyBullets: Phaser.GameObjects.Group;
  pickups: Phaser.GameObjects.Group;
}

export interface Solids {
  ground: Phaser.Physics.Arcade.StaticGroup;
  platforms: Phaser.Physics.Arcade.StaticGroup;
}

/** What every system receives: the scene (to create objects, timers, tweens), the bus and the shared world. */
export interface GameContext {
  scene: GameScene;
  bus: EventBus<GameEvents>;
  player: Player;
  groups: ActorGroups;
  solids: Solids;
}
