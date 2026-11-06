import Phaser from 'phaser';
import { sfx } from '../../audio/sfx';
import type { GameBus } from '../../systems/events';
import type { Player } from '../Player';

/** Base class for every faithful of Monsignor Panza. */
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  dead = false;
  facing = -1;
  protected abstract readonly deadFrame: number;
  protected abstract readonly score: number;
  /** What the enemy shouts while flying away (from content/dialoghi/<enemy>.json). */
  protected abstract deathScream(): string;

  /**
   * @param bus the only channel to the rest of the game (see systems/events.ts)
   * @param target who this enemy hunts: Paolone
   */
  constructor(
    scene: Phaser.Scene,
    protected readonly bus: GameBus,
    protected readonly target: Player,
    x: number,
    y: number,
    texture: string,
    hp: number,
  ) {
    super(scene, x, y, texture, 0);
    this.hp = hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(45);
  }

  /** AI tick, only called while alive and near the camera. */
  protected abstract think(time: number, player: Player): void;

  get isBoss() {
    return false;
  }

  hurt(dmg: number, fromX: number, knock = 40) {
    if (this.dead) return;
    this.hp -= dmg;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.active && this.clearTint());
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX((this.x < fromX ? -1 : 1) * knock);
    sfx.hit();
    if (this.hp <= 0) this.die(fromX);
  }

  protected die(fromX: number) {
    this.dead = true;
    const dir = this.x < fromX ? -1 : 1;
    this.stop();
    this.setFrame(this.deadFrame);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.setAllowGravity(true);
    this.setCollideWorldBounds(false);
    this.setVelocity(dir * (90 + Math.random() * 80), -220 - Math.random() * 80);
    this.setAngularVelocity(dir * (400 + Math.random() * 400));
    sfx.enemyDie();
    this.bus.emit('enemy:killed', { enemy: this, points: this.score });
    if (Math.random() < 0.6) {
      this.bus.emit('dialogue:say', { target: this, text: this.deathScream(), durationMs: 1100, shout: true });
    }
    this.scene.time.delayedCall(2500, () => this.destroy());
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const cam = this.scene.cameras.main;
    const near = this.x > cam.scrollX - 60 && this.x < cam.scrollX + cam.width + 60;
    if (near && !this.target.dead) this.think(time, this.target);
    else (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    if (this.y > 240) this.destroy();
  }

  private boxOffX = 0;

  /** Body box defined for the right-facing art; mirrored automatically when the sprite flips. */
  protected setBodyBox(w: number, h: number, offX: number, offY: number) {
    this.boxOffX = offX;
    (this.body as Phaser.Physics.Arcade.Body).setSize(w, h).setOffset(offX, offY);
    this.faceTowards(this.x - 1);
  }

  protected faceTowards(x: number) {
    this.facing = x < this.x ? -1 : 1;
    this.setFlipX(this.facing < 0);
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setOffset(this.facing < 0 ? this.width - this.boxOffX - b.width : this.boxOffX, b.offset.y);
  }
}
