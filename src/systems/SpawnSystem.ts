import type Phaser from 'phaser';
import { GROUND_Y, SPAWN_MARGIN, W } from '../config';
import type { EnemyType, SpawnDef, WaveDef } from '../content';
import type { Enemy } from '../entities/enemies/Enemy';
import { Beghina, Chierichetto, Sacrestano } from '../entities/enemies/Faithful';
import type { Player } from '../entities/Player';
import type { GameBus } from './events';
import type { GameContext } from './GameContext';
import { WaveCursor, spawnX } from './rules/waves';

const ENEMY_FACTORIES: Record<
  EnemyType,
  new (scene: Phaser.Scene, bus: GameBus, target: Player, x: number, y: number) => Enemy
> = {
  chierichetto: Chierichetto,
  beghina: Beghina,
  sacrestano: Sacrestano,
};

/** Starts the level waves as Paolone advances and owns the list of living enemies. */
export class SpawnSystem {
  private readonly cursor: WaveCursor<WaveDef>;
  private runOver = false;

  constructor(
    private readonly ctx: GameContext,
    waves: readonly WaveDef[],
  ) {
    this.cursor = new WaveCursor(waves);
    ctx.bus.on('run:over', () => (this.runOver = true));
  }

  update() {
    const next = this.cursor.advance(this.ctx.player.x);
    if (!next) return;
    const { wave, index } = next;
    wave.spawns.forEach((s) => this.ctx.scene.time.delayedCall(s.delay ?? 0, () => this.spawn(s)));
    this.ctx.bus.emit('wave:started', { index, line: wave.line });
  }

  /** Adds an enemy created elsewhere (e.g. altar boys summoned by the boss). */
  add(enemy: Enemy) {
    this.ctx.groups.enemies.add(enemy);
  }

  /** Living enemies, the boss excluded. */
  aliveEnemies(): number {
    return this.ctx.groups.enemies.getChildren().filter((e) => !(e as Enemy).dead && !(e as Enemy).isBoss).length;
  }

  skipAllWaves() {
    this.cursor.skipAll();
  }

  private spawn(s: SpawnDef) {
    if (this.runOver) return;
    const x = spawnX(s.at, this.ctx.scene.cameras.main.scrollX, W, SPAWN_MARGIN);
    this.spawnAt(s.type, x, (s.y ?? GROUND_Y) - 1);
  }

  /** Creates an enemy with its feet at (x, y). */
  spawnAt(type: EnemyType, x: number, y: number) {
    const { scene, bus, player } = this.ctx;
    this.add(new ENEMY_FACTORIES[type](scene, bus, player, x, y));
  }
}
