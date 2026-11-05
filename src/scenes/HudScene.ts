import Phaser from 'phaser';
import { W, H } from '../config';
import { WEAPONS } from '../weapons';
import type { Flavour } from '../art/sprites';

/** Overlay: hearts, current sukkino + ammo, score, boss health bar. */
export default class HudScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private weaponIcon!: Phaser.GameObjects.Image;
  private weaponText!: Phaser.GameObjects.BitmapText;
  private scoreText!: Phaser.GameObjects.BitmapText;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.BitmapText;

  constructor() {
    super('hud');
  }

  create() {
    this.hearts = [];
    for (let i = 0; i < 5; i++) this.hearts.push(this.add.image(6 + i * 10, 6, 'heart', 0).setOrigin(0));
    this.weaponIcon = this.add.image(7, 17, 'sukkino-tamarindo').setOrigin(0);
    this.weaponText = this.add.bitmapText(17, 18, 'pxo', '', 7);
    this.scoreText = this.add.bitmapText(W - 5, 5, 'pxo', '', 7).setOrigin(1, 0).setTint(0xe8b830);
    this.bossBar = this.add.graphics();
    this.bossLabel = this.add.bitmapText(W / 2, H - 22, 'pxo', 'MONSIGNOR ANGELIUS PANZA', 7).setOrigin(0.5, 0).setTint(0xe2685a).setVisible(false);
    this.registry.events.on('changedata', this.refresh, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off('changedata', this.refresh, this));
    this.refresh();
  }

  private refresh() {
    const r = this.registry;
    const hp = r.get('hp') as number, maxHp = r.get('maxHp') as number;
    this.hearts.forEach((h, i) => h.setFrame(i < hp ? 0 : 1).setVisible(i < maxHp));
    const weapon = (r.get('weapon') ?? 'tamarindo') as Flavour;
    const ammo = r.get('ammo') as number;
    this.weaponIcon.setTexture(`sukkino-${weapon}`);
    this.weaponText.setText(`${WEAPONS[weapon].name} X ${ammo === Infinity ? '~' : ammo}`);
    this.scoreText.setText(`PUNTI ${String(r.get('score') ?? 0).padStart(6, '0')}`);

    const boss = r.get('bossHp') as number;
    this.bossBar.clear();
    this.bossLabel.setVisible(boss >= 0);
    if (boss >= 0) {
      const bw = 160, x = (W - bw) / 2, y = H - 11;
      this.bossBar.fillStyle(0x120b16).fillRect(x - 1, y - 1, bw + 2, 7);
      this.bossBar.fillStyle(0x481d54).fillRect(x, y, bw, 5);
      this.bossBar.fillStyle(0xb3242f).fillRect(x, y, Math.round(bw * boss), 5);
      this.bossBar.fillStyle(0xe2685a).fillRect(x, y, Math.round(bw * boss), 1);
    }
  }
}
