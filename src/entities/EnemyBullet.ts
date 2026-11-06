import Phaser from 'phaser';
import { GRAVITY } from '../config';
import type GameScene from '../scenes/GameScene';

import { CONTENT, type BulletKind } from '../content';

export type { BulletKind };

const gravityOf = (kind: BulletKind) => CONTENT.projectiles[kind].gravity;

/** Hostile projectile: consecrated wafers, holy water, toxic incense, falling bells. */
export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  private born: number;
  readonly kind: BulletKind;
  readonly solid: boolean;

  constructor(scene: GameScene, kind: BulletKind, x: number, y: number, vx: number, vy: number) {
    super(scene, x, y, kind);
    this.kind = kind;
    this.born = scene.time.now;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(gravityOf(kind) - GRAVITY);
    this.setVelocity(vx, vy).setDepth(55);
    this.solid = kind !== 'fumo';
    if (kind === 'ostia') this.setAngularVelocity(vx > 0 ? 600 : -600);
    if (kind === 'fumo') {
      this.play('fumo');
      body.setSize(10, 9).setOffset(3, 3);
      this.setAlpha(0.9);
    }
    if (kind === 'campana') body.setSize(9, 11).setOffset(2, 2);
  }

  /** Aimed lob: computes the launch velocity to land on (tx, ty) after `t` seconds. */
  static lob(x: number, y: number, tx: number, ty: number, t: number, g: number): [number, number] {
    const vx = Phaser.Math.Clamp((tx - x) / t, -220, 220);
    const vy = (ty - y - 0.5 * g * t * t) / t;
    return [vx, Phaser.Math.Clamp(vy, -320, 200)];
  }

  static gravityOf(kind: BulletKind) {
    return gravityOf(kind);
  }

  preUpdate(t: number, d: number) {
    super.preUpdate(t, d);
    const life = t - this.born;
    if (this.kind === 'fumo') {
      this.y += Math.sin(life / 220) * 0.15;
      if (life > 3200) this.setAlpha(Math.max(0, 0.9 - (life - 3200) / 800));
      if (life > 4000) this.destroy();
      return;
    }
    if (life > 6000 || this.y > 220) this.destroy();
  }
}
