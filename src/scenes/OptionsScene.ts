import Phaser from 'phaser';
import { H, W } from '../config';
import { sfx } from '../audio/sfx';
import { CONTENT } from '../content';
import { VOLUME_MAX } from '../core/Settings';
import { applySettings, settings } from '../settings';
import { controlsTable } from '../ui/controlsTable';
import { Menu } from '../ui/Menu';
import { panel } from '../ui/panel';

const UI = CONTENT.ui;
const PANEL_W = 224;
const PANEL_H = 126;
const ROWS_W = PANEL_W - 40;
const TOP = (H - PANEL_H) / 2;

/**
 * Options overlay, launched on top of the scene that opened it (today the title, later the pause menu).
 * Two views: the settings list and the controls table. Settings are saved as soon as they change.
 */
export default class OptionsScene extends Phaser.Scene {
  /** objects of the current view, replaced when switching view */
  private view: { menu: Menu; extra: Phaser.GameObjects.GameObject[] } | null = null;

  constructor() {
    super('options');
  }

  create() {
    // dims what is below and swallows its clicks
    this.add.rectangle(0, 0, W, H, 0x0b0710, 0.7).setOrigin(0).setInteractive();
    panel(this, W / 2, H / 2, PANEL_W, PANEL_H);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (this.view = null));
    const onFullscreen = () => this.view?.menu.refresh();
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
    });
    this.showSettings();
  }

  private showSettings(selectControls = false) {
    const o = UI.options;
    const header = this.header(o.title);
    const menu = new Menu(
      this,
      [
        {
          label: o.musicVolume,
          steps: { max: VOLUME_MAX, value: () => settings.get().musicVolume },
          onAdjust: (d) => this.changeVolume('musicVolume', d),
        },
        {
          label: o.sfxVolume,
          steps: { max: VOLUME_MAX, value: () => settings.get().sfxVolume },
          onAdjust: (d) => {
            this.changeVolume('sfxVolume', d);
            sfx.pickup(); // so the player hears the new level
          },
        },
        {
          label: o.fullscreen,
          value: () => (this.scale.isFullscreen ? o.on : o.off),
          onConfirm: () => this.scale.toggleFullscreen(),
          onAdjust: () => this.scale.toggleFullscreen(),
        },
        { label: o.controls, onConfirm: () => this.switchView(() => this.showControls()) },
        // only Italian exists today: shown but locked
        { label: o.language, value: () => UI.languages[settings.get().language], enabled: false },
        { label: o.back, onConfirm: () => this.close() },
      ],
      { x: W / 2, y: TOP + 30, width: ROWS_W, rowHeight: 14, layout: 'split', onBack: () => this.close(), depth: 20 },
    );
    if (selectControls) menu.select(3);
    this.view = { menu, extra: [header] };
  }

  private showControls() {
    const header = this.header(UI.options.controls);
    const left = W / 2 - ROWS_W / 2;
    const extra: Phaser.GameObjects.GameObject[] = [header];
    controlsTable(CONTENT.controls).forEach((row, i) => {
      const y = TOP + 30 + i * 11;
      extra.push(this.add.bitmapText(left, y, 'pxo', row.label, 7).setTint(0xe8b830).setDepth(20));
      extra.push(
        this.add
          .bitmapText(left + ROWS_W, y, 'pxo', row.keys, 7)
          .setOrigin(1, 0)
          .setDepth(20),
      );
    });
    const back = () => this.switchView(() => this.showSettings(true));
    const menu = new Menu(this, [{ label: UI.options.back, onConfirm: back }], {
      x: W / 2,
      y: TOP + PANEL_H - 20,
      width: ROWS_W,
      onBack: back,
      depth: 20,
    });
    this.view = { menu, extra };
  }

  private header(text: string) {
    return this.add
      .bitmapText(W / 2, TOP + 9, 'pxo', text, 14)
      .setOrigin(0.5, 0)
      .setTint(0xe8b830)
      .setDepth(20);
  }

  /** Replaces the current view; the new one starts listening from the next frame. */
  private switchView(build: () => void) {
    if (this.view) {
      this.view.menu.destroy();
      this.view.extra.forEach((o) => o.destroy());
    }
    build();
    this.view?.menu.setEnabled(false);
    this.view?.menu.setEnabled(true);
  }

  private changeVolume(key: 'musicVolume' | 'sfxVolume', delta: 1 | -1) {
    applySettings(settings.update({ [key]: settings.get()[key] + delta }));
  }

  private close() {
    this.scene.stop();
  }
}
