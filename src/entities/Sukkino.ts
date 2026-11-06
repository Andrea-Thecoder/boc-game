import Phaser from 'phaser';
import { GRAVITY } from '../config';
import type { Flavour, Weapon } from '../content';
import type { GameBus } from '../systems/events';

/** A brick lives at most this long, then it goes back to the pool. */
const MAX_LIFE_MS = 4000;
/** How far outside the camera a brick may fly before it is recycled. */
const OFFSCREEN_MARGIN = 40;

/**
 * A thrown juice brick. Pooled: created once by the ProjectileSystem, then `fire()`d and `retire()`d many times.
 * Splashes on impact; peach ones bounce first.
 */
export class Sukkino extends Phaser.Physics.Arcade.Sprite {
  damage = 1;
  bouncesLeft = 0;
  flavour: Flavour = 'tamarindo';
  private born = 0;

  /** @param recycle gives the brick back to its pool (set by the ProjectileSystem) */
  constructor(
    scene: Phaser.Scene,
    private readonly bus: GameBus,
    private readonly recycle: (brick: Sukkino) => void,
  ) {
    super(scene, 0, 0, 'sukkino-tamarindo');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(6, 6).setOffset(1, 2);
    body.setBounce(0.55, 0.65);
    this.setDepth(50);
  }

  /** Launches the brick from (x, y) along `angle` (radians). */
  fire(w: Weapon, x: number, y: number, angle: number) {
    this.enableBody(true, x, y, true, true);
    this.setTexture(`sukkino-${w.flavour}`).setAngle(0);
    this.flavour = w.flavour;
    this.damage = w.damage;
    this.bouncesLeft = w.bounces;
    this.born = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(w.gravity - GRAVITY);
    const a = angle + (Math.random() - 0.5) * 2 * w.jitter;
    this.setVelocity(Math.cos(a) * w.speed, Math.sin(a) * w.speed);
    this.setAngularVelocity((Math.cos(a) >= 0 ? 1 : -1) * 900);
  }

  /** Called when it hits ground / platform. Returns true if the brick is consumed. */
  onSurface(): boolean {
    if (this.bouncesLeft > 0) {
      this.bouncesLeft--;
      return false;
    }
    this.splat();
    return true;
  }

  splat() {
    if (!this.active) return;
    this.bus.emit('sukkino:splat', { x: this.x, y: this.y, flavour: this.flavour });
    this.retire();
  }

  /** Back to the pool, without splashing. */
  retire() {
    if (this.active) this.recycle(this);
  }

  preUpdate(t: number, d: number) {
    super.preUpdate(t, d);
    const cam = this.scene.cameras.main;
    const offscreen = this.x < cam.scrollX - OFFSCREEN_MARGIN || this.x > cam.scrollX + cam.width + OFFSCREEN_MARGIN;
    if (t - this.born > MAX_LIFE_MS || offscreen || this.y > 220) this.retire();
  }
}
