import Phaser from 'phaser';
import { W } from '../config';
import { sfx } from '../audio/sfx';
import { CONTENT } from '../content';
import { VOLUME_MAX } from '../core/Settings';
import { applySettings, settings } from '../settings';
import { controlsTable } from '../ui/controlsTable';
import { Menu } from '../ui/Menu';
import { OverlayScene, type OverlayView } from './OverlayScene';

const UI = CONTENT.ui;
const PANEL = { w: 224, h: 126 } as const;
const ROWS_W = PANEL.w - 40;

/**
 * Options overlay, launched on top of the scene that opened it (the title or the pause menu).
 * Two views: the settings list and the controls table. Settings are saved as soon as they change.
 */
export default class OptionsScene extends OverlayScene {
  protected readonly panelSize = PANEL;

  constructor() {
    super('options');
  }

  create() {
    this.drawFrame();
    const onFullscreen = () => this.view?.menu.refresh();
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, onFullscreen);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, onFullscreen);
    });
    this.switchView(() => this.settingsView());
  }

  private settingsView(selectControls = false): OverlayView {
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
        { label: o.controls, onConfirm: () => this.switchView(() => this.controlsView()) },
        // only Italian exists today: shown but locked
        { label: o.language, value: () => UI.languages[settings.get().language], enabled: false },
        { label: o.back, onConfirm: () => this.close() },
      ],
      {
        x: W / 2,
        y: this.top + 30,
        width: ROWS_W,
        rowHeight: 14,
        layout: 'split',
        onBack: () => this.close(),
        depth: 20,
      },
    );
    if (selectControls) menu.select(3);
    return { menu, extra: [header] };
  }

  private controlsView(): OverlayView {
    const header = this.header(UI.options.controls);
    const left = W / 2 - ROWS_W / 2;
    const extra: Phaser.GameObjects.GameObject[] = [header];
    controlsTable(CONTENT.controls).forEach((row, i) => {
      const y = this.top + 30 + i * 11;
      extra.push(this.add.bitmapText(left, y, 'pxo', row.label, 7).setTint(0xe8b830).setDepth(20));
      extra.push(
        this.add
          .bitmapText(left + ROWS_W, y, 'pxo', row.keys, 7)
          .setOrigin(1, 0)
          .setDepth(20),
      );
    });
    const back = () => this.switchView(() => this.settingsView(true));
    const menu = new Menu(this, [{ label: UI.options.back, onConfirm: back }], {
      x: W / 2,
      y: this.top + PANEL.h - 20,
      width: ROWS_W,
      onBack: back,
      depth: 20,
    });
    return { menu, extra };
  }

  private changeVolume(key: 'musicVolume' | 'sfxVolume', delta: 1 | -1) {
    applySettings(settings.update({ [key]: settings.get()[key] + delta }));
  }

  private close() {
    this.scene.stop();
  }
}
