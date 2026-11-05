import Phaser from 'phaser';
import { GROUND_Y, H, W } from '../config';
import { TORSO } from '../art/sprites';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { Bubble } from '../ui/Bubble';
import { kappa } from '../ui/text';

export default class TitleScene extends Phaser.Scene {
  private prompt!: Phaser.GameObjects.BitmapText;
  private ready = false;

  constructor() {
    super('title');
  }

  create() {
    this.ready = !!audio.ctx;
    this.add.image(0, 0, 'bg-sky').setOrigin(0);
    this.add.tileSprite(0, 0, W, H, 'bg-hills').setOrigin(0);
    const houses = this.add.tileSprite(0, 0, W, H, 'bg-houses').setOrigin(0);
    this.add.tileSprite(0, GROUND_Y, W, H - GROUND_Y, 'ground').setOrigin(0);
    this.tweens.add({ targets: houses, tilePositionX: 512, duration: 60000, repeat: -1 });

    const title = this.add
      .bitmapText(W / 2, 14, 'pxo', 'PAOLONE', 21)
      .setOrigin(0.5, 0)
      .setTint(0xe8b830);
    this.add.bitmapText(W / 2, 44, 'pxo', 'CONTRO', 7).setOrigin(0.5, 0);
    this.add
      .bitmapText(W / 2, 55, 'pxo', 'MONSIGNOR PANZA', 14)
      .setOrigin(0.5, 0)
      .setTint(0xe2685a);
    this.tweens.add({ targets: title, y: 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Paolone, ready to throw
    const px = 70;
    this.add
      .sprite(px, GROUND_Y + 1, 'paolone-legs', 0)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(5);
    const torso = this.add
      .sprite(px, GROUND_Y + 1, 'paolone-torso', TORSO.windup)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(6);
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => torso.setFrame(torso.frame.name === String(TORSO.windup) ? TORSO.fwd : TORSO.windup),
    });

    // the villain
    this.add
      .image(258, GROUND_Y + 1, 'panza', 1)
      .setOrigin(0.5, 1)
      .setDepth(5);
    this.add
      .sprite(200, GROUND_Y + 1, 'chierichetto', 0)
      .setOrigin(0.5, 1)
      .setFlipX(true)
      .play('chierichetto-walk');
    this.add
      .sprite(222, GROUND_Y + 1, 'beghina', 0)
      .setOrigin(0.5, 1)
      .setFlipX(true)
      .play('beghina-walk');

    this.prompt = this.add.bitmapText(W / 2, 92, 'pxo', '', 7).setOrigin(0.5, 0);
    this.setPrompt();
    this.tweens.add({ targets: this.prompt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    this.add
      .bitmapText(W / 2, H - 9, 'px', 'FRECCE MUOVI  Z SALTA  X SUKKINO  C PANZATA', 6)
      .setOrigin(0.5, 0)
      .setTint(0xd9d2c3)
      .setDepth(10);

    this.time.delayedCall(
      1200,
      () => new Bubble(this, { x: px + 8, y: GROUND_Y - 4 }, kappa('Chiappetons non si tocca!'), 70, 2400),
    );

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e.code));
    this.input.on('pointerdown', () => this.onKey('Enter'));
    this.input.gamepad?.on('down', () => this.onKey('Enter'));
    if (this.ready) music.play('title');
  }

  private setPrompt() {
    this.prompt.setText(this.ready ? 'PREMI INVIO PER INIZIARE' : 'PREMI UN TASTO (ATTIVA AUDIO)');
  }

  private onKey(code: string) {
    if (!this.ready) {
      audio.unlock();
      this.ready = true;
      music.play('title');
      this.setPrompt();
      return;
    }
    if (code === 'KeyM') {
      audio.toggleMute();
      return;
    }
    if (['Enter', 'Space', 'KeyZ', 'KeyX'].includes(code)) {
      sfx.select();
      music.stop();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('game'));
    }
  }
}
