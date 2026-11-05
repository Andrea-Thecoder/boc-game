import Phaser from 'phaser';
import { GROUND_Y, H, W } from '../config';
import { clean } from '../art/font';
import { TORSO } from '../art/sprites';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { kappa, pick } from '../ui/text';

interface Result {
  score: number;
  seconds: number;
}

abstract class EndScene extends Phaser.Scene {
  private leaving = false;

  protected backdrop(dark: boolean) {
    this.add.image(0, 0, 'bg-sky').setOrigin(0);
    this.add.tileSprite(0, 0, W, H, 'bg-hills').setOrigin(0);
    this.add.tileSprite(0, 0, W, H, 'bg-houses').setOrigin(0);
    this.add.tileSprite(0, GROUND_Y, W, H - GROUND_Y, 'ground').setOrigin(0);
    if (dark) this.add.rectangle(0, 0, W, H, 0x0b0710, 0.6).setOrigin(0);
  }

  protected text(y: number, s: string, size = 7, tint = 0xf4efe4) {
    return this.add
      .bitmapText(W / 2, y, 'pxo', clean(s), size)
      .setOrigin(0.5, 0)
      .setTint(tint)
      .setCenterAlign()
      .setMaxWidth(290);
  }

  protected waitFor(next: string) {
    this.leaving = false;
    this.time.delayedCall(1200, () => {
      const p = this.text(H - 14, 'PREMI INVIO');
      this.tweens.add({ targets: p, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
      const go = () => {
        if (this.leaving) return;
        this.leaving = true;
        sfx.select();
        music.stop();
        this.scene.start(next);
      };
      this.input.keyboard!.on('keydown-ENTER', go);
      this.input.keyboard!.on('keydown-SPACE', go);
      this.input.on('pointerdown', go);
      this.input.gamepad?.on('down', go);
    });
  }
}

export class GameOverScene extends EndScene {
  constructor() {
    super('gameover');
  }

  create(data: Result) {
    this.backdrop(true);
    music.play('gameOver');
    this.text(28, 'GAME OVER', 21, 0xb3242f);
    this.add
      .sprite(W / 2, GROUND_Y + 1, 'paolone-legs', 0)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setAngle(-90)
      .setPosition(W / 2 + 30, GROUND_Y - 16);
    this.add
      .sprite(W / 2 + 30, GROUND_Y - 16, 'paolone-torso', TORSO.hurt)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setAngle(-90);
    this.text(
      70,
      kappa(
        pick([
          'Mannaggia... mi serve un altro succhino.',
          'Il Monsignore ha vinto... per ora.',
          'Chiappetons, perdonami!',
        ]),
      ),
      7,
      0xe8b830,
    );
    this.text(92, `PUNTI ${data.score}`);
    this.waitFor('game');
  }
}

export class VictoryScene extends EndScene {
  constructor() {
    super('victory');
  }

  create(data: Result) {
    this.backdrop(false);
    this.text(6, 'CHIAPPETONS', 14, 0xe8b830);
    this.text(22, "E' SALVA!", 14, 0xe8b830);
    this.text(42, "MONSIGNOR PANZA E' VOLATO VIA... MA TORNERA'.", 7, 0xe2685a);
    this.add
      .sprite(W / 2, GROUND_Y + 1, 'paolone-legs', 0)
      .setOrigin(0.5, 1)
      .setScale(2);
    const torso = this.add
      .sprite(W / 2, GROUND_Y + 1, 'paolone-torso', TORSO.up)
      .setOrigin(0.5, 1)
      .setScale(2);
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => torso.setFrame(torso.frame.name === String(TORSO.up) ? TORSO.idle : TORSO.up),
    });
    this.text(62, kappa('Il Vaticano può dormire tranquillo. Io invece vado a mangiare.'));
    const m = Math.floor(data.seconds / 60),
      s = data.seconds % 60;
    this.text(82, `PUNTI ${data.score}   TEMPO ${m}:${String(s).padStart(2, '0')}`);
    this.waitFor('title');
  }
}
