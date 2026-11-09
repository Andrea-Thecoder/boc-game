import Phaser from 'phaser';
import { H, W } from '../config';
import type { Menu } from '../ui/Menu';
import { panel } from '../ui/panel';

/** What an overlay shows at a given moment: a menu plus any other object drawn for it. */
export interface OverlayView {
  menu: Menu;
  extra: Phaser.GameObjects.GameObject[];
}

/**
 * Base of the menu overlays (options, pause): dims the scene below, draws the gothic frame
 * and swaps between views (e.g. settings ↔ controls table).
 */
export abstract class OverlayScene extends Phaser.Scene {
  protected view: OverlayView | null = null;
  protected abstract readonly panelSize: { readonly w: number; readonly h: number };

  /** y of the top edge of the frame */
  protected get top() {
    return (H - this.panelSize.h) / 2;
  }

  /** Call first in create(). */
  protected drawFrame() {
    // dims what is below and swallows its clicks
    this.add.rectangle(0, 0, W, H, 0x0b0710, 0.7).setOrigin(0).setInteractive();
    panel(this, W / 2, H / 2, this.panelSize.w, this.panelSize.h);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (this.view = null));
  }

  protected header(text: string, size = 14, y = this.top + 9) {
    return this.add
      .bitmapText(W / 2, y, 'pxo', text, size)
      .setOrigin(0.5, 0)
      .setTint(0xe8b830)
      .setDepth(20);
  }

  /** Replaces the current view. The new menu starts listening from the next frame, so the key that
   * caused the switch is not handled twice. */
  protected switchView(build: () => OverlayView) {
    if (this.view) {
      this.view.menu.destroy();
      this.view.extra.forEach((o) => o.destroy());
    }
    this.view = build();
    this.view.menu.setEnabled(false);
    this.view.menu.setEnabled(true);
  }
}
