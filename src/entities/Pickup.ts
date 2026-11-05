import Phaser from 'phaser';
import type GameScene from '../scenes/GameScene';

export type PickupKind = 'pera' | 'ace' | 'pesca' | 'panzerotto';

/** Collectibles: new sukkini flavours or a panzerotto that restores a heart. */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  readonly kind: PickupKind;

  constructor(scene: GameScene, kind: PickupKind, x: number, y: number, floating = true) {
    super(scene, x, y, kind === 'panzerotto' ? 'panzerotto' : `pickup-${kind}`);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(40);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(!floating);
    body.setBounce(0, 0.3);
    if (floating) {
      body.setImmovable(true);
      scene.tweens.add({ targets: this, y: y - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.sparkles = scene.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => scene.sparkle(this.x, this.y - this.height / 2),
    });
  }

  private sparkles: Phaser.Time.TimerEvent;

  destroy(fromScene?: boolean) {
    this.sparkles?.remove();
    super.destroy(fromScene);
  }
}
