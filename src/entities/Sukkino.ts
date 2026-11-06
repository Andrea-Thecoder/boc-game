import Phaser from 'phaser';
import { GRAVITY } from '../config';
import { FLAVOURS } from '../art/sprites';
import type { Flavour, Weapon } from '../content';
import type GameScene from '../scenes/GameScene';

/** A thrown juice brick. Splashes on impact; peach ones bounce first. */
export class Sukkino extends Phaser.Physics.Arcade.Sprite {
  damage = 1;
  bouncesLeft = 0;
  private born = 0;

  constructor(scene: GameScene, x: number, y: number, w: Weapon, angle: number) {
    super(scene, x, y, `sukkino-${w.flavour}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.damage = w.damage;
    this.bouncesLeft = w.bounces;
    this.born = scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(6, 6).setOffset(1, 2);
    body.setGravityY(w.gravity - GRAVITY);
    body.setBounce(0.55, 0.65);
    const a = angle + (Math.random() - 0.5) * 2 * w.jitter;
    this.setVelocity(Math.cos(a) * w.speed, Math.sin(a) * w.speed);
    this.setAngularVelocity((Math.cos(a) >= 0 ? 1 : -1) * 900);
    this.setDepth(50);
  }

  get flavourColor(): number {
    const key = this.texture.key.replace('sukkino-', '') as Flavour;
    return Phaser.Display.Color.HexStringToColor(FLAVOURS[key]).color;
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
    (this.scene as GameScene).splash(this.x, this.y, this.flavourColor);
    this.destroy();
  }

  preUpdate(t: number, d: number) {
    super.preUpdate(t, d);
    const cam = this.scene.cameras.main;
    if (t - this.born > 4000 || this.x < cam.scrollX - 40 || this.x > cam.scrollX + cam.width + 40 || this.y > 220) {
      this.destroy();
    }
  }
}
