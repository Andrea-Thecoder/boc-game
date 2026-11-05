import Phaser from 'phaser';
import { clean } from '../art/font';
import { P } from '../art/palette';
import { sfx } from '../audio/sfx';

/**
 * Comic speech bubble that types its text letter by letter and follows a target.
 */
export class Bubble extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private tail: Phaser.GameObjects.Graphics;
  private boxW = 0;
  private labelX = 0;
  private label: Phaser.GameObjects.BitmapText;
  private full: string;
  private shown = 0;
  private typeTimer: Phaser.Time.TimerEvent;
  private shout: boolean;

  constructor(
    scene: Phaser.Scene,
    private target: { x: number; y: number; active?: boolean },
    text: string,
    private yOffset = 38,
    duration = 2600,
    opts: { shout?: boolean; maxWidth?: number } = {},
  ) {
    super(scene, target.x, target.y - yOffset);
    this.shout = !!opts.shout;
    this.full = clean(text);
    this.bg = scene.add.graphics();
    this.tail = scene.add.graphics();
    this.label = scene.add.bitmapText(0, 0, 'px', '', 6).setTint(0x120b16);
    this.label.setMaxWidth(opts.maxWidth ?? 130);
    // measure final size once
    this.label.setText(this.full);
    const w = Math.ceil(this.label.width) + 8;
    const h = Math.ceil(this.label.height) + 6;
    this.label.setText('');
    this.boxW = w;
    this.labelX = -Math.floor(w / 2) + 4;
    this.label.setPosition(this.labelX, -h + 3);
    this.drawBg(w, h);
    this.add([this.bg, this.tail, this.label]);
    this.preUpdate();
    this.setDepth(1000);
    scene.add.existing(this);

    this.typeTimer = scene.time.addEvent({
      delay: 28,
      repeat: this.full.length - 1,
      callback: () => {
        this.shown++;
        this.label.setText(this.full.slice(0, this.shown));
        if (this.shown % 2 === 0 && this.full[this.shown - 1] !== ' ') sfx.blip();
      },
    });
    scene.time.delayedCall(duration + this.full.length * 28, () => this.destroy());
    this.setScale(0.2);
    scene.tweens.add({ targets: this, scale: 1, duration: 140, ease: 'Back.Out' });
  }

  private drawBg(w: number, h: number) {
    const g = this.bg;
    const x = -Math.floor(w / 2), y = -h;
    g.fillStyle(0x120b16);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(this.shout ? 0xffe9a0 : 0xf4efe4);
    g.fillRect(x, y, w, h);
    const t = this.tail;
    t.fillStyle(0x120b16);
    t.fillRect(-2, 1, 5, 1).fillRect(-1, 2, 3, 1).fillRect(0, 3, 1, 1);
    t.fillStyle(this.shout ? 0xffe9a0 : 0xf4efe4);
    t.fillRect(-1, 0, 3, 1).fillRect(0, 1, 1, 1);
    if (this.shout) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(P.red).color);
      g.fillRect(x, y, w, 1);
    }
  }

  preUpdate() {
    if (this.target.active === false) return;
    const tx = Math.round(this.target.x);
    this.setPosition(tx, Math.round(this.target.y - this.yOffset));
    // keep the box on screen; the tail keeps pointing at the speaker
    const cam = this.scene.cameras.main;
    const half = this.boxW / 2 + 2;
    const cx = Phaser.Math.Clamp(tx, cam.scrollX + half, cam.scrollX + cam.width - half);
    const shift = Math.round(cx - tx);
    this.bg.x = shift;
    this.label.x = this.labelX + shift;
  }

  destroy(fromScene?: boolean) {
    this.typeTimer?.remove();
    super.destroy(fromScene);
  }
}

/** Floating "+100" style text. */
export function popText(scene: Phaser.Scene, x: number, y: number, text: string, color = 0xe8b830) {
  const t = scene.add.bitmapText(Math.round(x), Math.round(y), 'pxo', clean(text), 7).setOrigin(0.5).setTint(color).setDepth(900);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 800, ease: 'Cubic.Out', onComplete: () => t.destroy() });
}
