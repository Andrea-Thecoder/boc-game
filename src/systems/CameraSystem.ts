import { BOSS_ARENA_X, CAMERA_LEAD, CAMERA_SMOOTHING, LEVEL_WIDTH, PARALLAX, PLAYER_EDGE_MARGIN, W } from '../config';
import type { GameContext } from './GameContext';
import type { BuiltLevel } from './LevelBuilder';
import { forwardScroll, playerBounds } from './rules/camera';

/** Forward-only camera, arena lock, screen-edge limits for Paolone, parallax. */
export class CameraSystem {
  private arenaLocked = false;

  constructor(
    private readonly ctx: GameContext,
    private readonly parallax: BuiltLevel['parallax'],
  ) {
    ctx.bus.on('boss:arenaLocked', () => (this.arenaLocked = true));
  }

  update() {
    const cam = this.ctx.scene.cameras.main;
    const player = this.ctx.player;
    cam.scrollX = this.arenaLocked
      ? BOSS_ARENA_X
      : forwardScroll(cam.scrollX, player.x, {
          viewWidth: W,
          lead: CAMERA_LEAD,
          smoothing: CAMERA_SMOOTHING,
          maxScroll: BOSS_ARENA_X,
        });
    const bounds = playerBounds(cam.scrollX, this.arenaLocked, {
      viewWidth: W,
      margin: PLAYER_EDGE_MARGIN,
      levelWidth: LEVEL_WIDTH,
      arenaX: BOSS_ARENA_X,
    });
    player.minX = bounds.minX;
    player.maxX = bounds.maxX;
    this.parallax.hills.tilePositionX = cam.scrollX * PARALLAX.hills;
    this.parallax.houses.tilePositionX = cam.scrollX * PARALLAX.houses;
  }

  shake(durationMs: number, intensity: number) {
    this.ctx.scene.cameras.main.shake(durationMs, intensity);
  }
}
