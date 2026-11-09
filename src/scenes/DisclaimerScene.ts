import Phaser from 'phaser';
import { H, W } from '../config';
import { CONTENT } from '../content';
import { panel } from '../ui/panel';

const TEXT = CONTENT.ui.disclaimer;
const PANEL = { w: 300, h: 160 } as const;
const BAR_W = 200;

/**
 * "Work of fiction" notice shown after NEW GAME, before the level. Goes on to the level after `durationMs`,
 * or as soon as a key, a click or a pad button is pressed.
 */
export default class DisclaimerScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('disclaimer');
  }

  create() {
    this.leaving = false;
    const top = (H - PANEL.h) / 2;
    panel(this, W / 2, H / 2, PANEL.w, PANEL.h);
    this.add
      .bitmapText(W / 2, top + 10, 'pxo', TEXT.title, 14)
      .setOrigin(0.5, 0)
      .setTint(0xe8b830)
      .setDepth(20);

    let y = top + 34;
    for (const paragraph of TEXT.paragraphs) {
      const text = this.add
        .bitmapText(W / 2, y, 'px', paragraph, 6)
        .setOrigin(0.5, 0)
        .setMaxWidth(PANEL.w - 32)
        .setCenterAlign()
        .setTint(0xf4efe4)
        .setDepth(20);
      y += text.height + 9;
    }

    const skip = this.add
      .bitmapText(W / 2, top + PANEL.h - 22, 'px', TEXT.skip, 6)
      .setOrigin(0.5, 0)
      .setTint(0x8a8394)
      .setDepth(20);
    this.tweens.add({ targets: skip, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    // how much time is left before the title shows up by itself
    const bar = this.add
      .rectangle(W / 2 - BAR_W / 2, top + PANEL.h - 11, BAR_W, 2, 0xe8b830)
      .setOrigin(0, 0.5)
      .setDepth(20);
    this.tweens.add({ targets: bar, width: 0, duration: TEXT.durationMs });

    this.time.delayedCall(TEXT.durationMs, () => this.leave());
    // a key still held from NEW GAME sends repeats: only a new press skips
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => !e.repeat && this.leave());
    this.input.once('pointerdown', () => this.leave());
    this.input.gamepad?.once('down', () => this.leave());
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('game'));
  }
}
