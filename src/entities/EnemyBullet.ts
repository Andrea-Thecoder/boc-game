import Phaser from 'phaser';
import { GRAVITY } from '../config';
import { CONTENT, type BulletKind } from '../content';

export type { BulletKind };

/** Gravity felt by each kind of bullet (projectiles.json). */
export const bulletGravity = (kind: BulletKind) => CONTENT.projectiles[kind].gravity;

/** Hitbox per kind, relative to the sprite; `null` = the whole frame. */
const HITBOX: Record<BulletKind, { w: number; h: number; x: number; y: number } | null> = {
  ostia: null,
  goccia: null,
  fumo: { w: 10, h: 9, x: 3, y: 3 },
  campana: { w: 9, h: 11, x: 2, y: 2 },
};

const LIFE_MS = { fumo: 4000, other: 6000 } as const;
const SMOKE_FADE_FROM_MS = 3200;

/**
 * Hostile projectile: consecrated wafers, holy water, toxic incense, falling bells.
 * Pooled: created once by the ProjectileSystem, then `fire()`d and `retire()`d many times.
 */
export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  kind: BulletKind = 'ostia';
  /** solid bullets break on the ground; incense floats through everything */
  solid = true;
  private born = 0;

  /** @param recycle gives the bullet back to its pool (set by the ProjectileSystem) */
  constructor(
    scene: Phaser.Scene,
    private readonly recycle: (bullet: EnemyBullet) => void,
  ) {
    super(scene, 0, 0, 'ostia');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(55);
  }

  fire(kind: BulletKind, x: number, y: number, vx: number, vy: number) {
    this.enableBody(true, x, y, true, true);
    this.kind = kind;
    this.solid = kind !== 'fumo';
    this.born = this.scene.time.now;
    this.setTexture(kind)
      .setAngle(0)
      .setAlpha(kind === 'fumo' ? 0.9 : 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const box = HITBOX[kind];
    if (box) body.setSize(box.w, box.h, false).setOffset(box.x, box.y);
    else body.setSize(this.frame.width, this.frame.height, false).setOffset(0, 0);
    body.setGravityY(bulletGravity(kind) - GRAVITY);
    this.setVelocity(vx, vy);
    this.setAngularVelocity(kind === 'ostia' ? (vx > 0 ? 600 : -600) : 0);
    if (kind === 'fumo') this.play('fumo');
    else this.stop();
  }

  /** Back to the pool. */
  retire() {
    if (this.active) this.recycle(this);
  }

  preUpdate(t: number, d: number) {
    super.preUpdate(t, d);
    const life = t - this.born;
    if (this.kind === 'fumo') {
      this.y += Math.sin(life / 220) * 0.15;
      if (life > SMOKE_FADE_FROM_MS) {
        this.setAlpha(Math.max(0, 0.9 - (life - SMOKE_FADE_FROM_MS) / (LIFE_MS.fumo - SMOKE_FADE_FROM_MS)));
      }
      if (life > LIFE_MS.fumo) this.retire();
      return;
    }
    if (life > LIFE_MS.other || this.y > 220) this.retire();
  }
}
