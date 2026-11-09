import Phaser from 'phaser';
import { GROUND_Y, H, SHOW_DISCLAIMER, W } from '../config';
import { TORSO } from '../art/sprites';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { CONTENT, line } from '../content';
import { Bubble } from '../ui/Bubble';
import { onActionKey } from '../ui/keys';
import { Menu } from '../ui/Menu';
import { panel } from '../ui/panel';
import { kappa } from '../ui/text';

const UI = CONTENT.ui;
/** y of the first menu row; the panel is drawn around the three rows */
const MENU_Y = 70;
const MENU_W = 104;

export default class TitleScene extends Phaser.Scene {
  private prompt!: Phaser.GameObjects.BitmapText;
  private menu!: Menu;
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

    const { title: t } = UI;
    this.add
      .bitmapText(W / 2, 7, 'pxo', t.series, 7)
      .setOrigin(0.5, 0)
      .setTint(0xe8b830);
    this.add
      .bitmapText(W / 2, 19, 'pxo', t.battleFor, 7)
      .setOrigin(0.5, 0)
      .setTint(0xd9d2c3);
    const place = this.add
      .bitmapText(W / 2, 30, 'pxo', t.place, 21)
      .setOrigin(0.5, 0)
      .setTint(0xe2685a);
    this.tweens.add({ targets: place, y: 28, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add
      .bitmapText(W - 3, H - 8, 'px', `V${__APP_VERSION__}`, 6)
      .setOrigin(1, 0)
      .setTint(0x8a8394)
      .setDepth(10);

    // Paolone, ready to throw
    const px = 46; // left of the menu panel, so his speech bubble does not cover it
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

    this.prompt = this.add.bitmapText(W / 2, MENU_Y + 16, 'pxo', t.pressAnyKey, 7).setOrigin(0.5, 0);
    this.tweens.add({ targets: this.prompt, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    this.time.delayedCall(
      1200,
      () =>
        new Bubble(this, { x: px + 8, y: GROUND_Y - 4 }, kappa(line('paolone', 'titolo')), 70, 2400, { maxWidth: 80 }),
    );

    onActionKey(this, 'mute', () => audio.toggleMute());
    if (this.ready) this.showMenu();
    else {
      this.input.keyboard!.once('keydown', () => this.unlockAudio());
      this.input.once('pointerdown', () => this.unlockAudio());
      this.input.gamepad?.once('down', () => this.unlockAudio());
    }
  }

  /** Browsers start audio only after a user gesture: the first key press turns it on, then the menu shows. */
  private unlockAudio() {
    if (this.ready) return;
    this.ready = true;
    audio.unlock();
    this.showMenu();
  }

  private showMenu() {
    music.play('title');
    this.prompt.setVisible(false);
    const { mainMenu } = UI;
    panel(this, W / 2, MENU_Y + 19, MENU_W, 50);
    this.menu = new Menu(
      this,
      [
        { label: mainMenu.newGame, onConfirm: () => this.startGame() },
        // saves arrive with the backend (fase 6)
        { label: mainMenu.loadGame, enabled: false },
        { label: mainMenu.options, onConfirm: () => this.openOptions() },
      ],
      { x: W / 2, y: MENU_Y, width: MENU_W - 24 },
    );
  }

  private startGame() {
    this.menu.setEnabled(false);
    music.stop();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    // NEW GAME shows the "work of fiction" notice first (skipped in e2e runs, see config.ts)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start(SHOW_DISCLAIMER ? 'disclaimer' : 'game'),
    );
  }

  private openOptions() {
    this.menu.setEnabled(false);
    this.scene.launch('options');
    this.scene.get('options').events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.menu.setEnabled(true));
  }
}
