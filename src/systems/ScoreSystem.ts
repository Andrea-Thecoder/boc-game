import { CONTENT } from '../content';
import type { FxSystem } from './FxSystem';
import type { GameContext } from './GameContext';

/** Score of the run and the HUD data (published on the Phaser registry, read by HudScene). */
export class ScoreSystem {
  private score = 0;

  constructor(
    private readonly ctx: GameContext,
    private readonly fx: FxSystem,
  ) {
    const bus = ctx.bus;
    bus.on('enemy:killed', ({ enemy, points }) => {
      this.score += points;
      this.fx.popText(enemy.x, enemy.y - 30, `+${points}`);
      bus.emit('hud:changed');
    });
    bus.on('pickup:collected', () => {
      this.score += CONTENT.player.pickupScore;
      bus.emit('hud:changed');
    });
    bus.on('hud:changed', () => this.publish());
  }

  get total(): number {
    return this.score;
  }

  private publish() {
    const r = this.ctx.scene.registry;
    const p = this.ctx.player;
    r.set('hp', p.hp);
    r.set('maxHp', p.maxHp);
    r.set('weapon', p.weapon.flavour);
    r.set('ammo', p.ammo);
    r.set('score', this.score);
  }
}
