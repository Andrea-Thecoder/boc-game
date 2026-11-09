import type Phaser from 'phaser';
import { PANEL_SLICE } from '../art/ui';

/** Gothic pixel-art frame (nine-slice of `ui-panel`), centred on x, y. */
export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, depth = 15) {
  return scene.add
    .nineslice(x, y, 'ui-panel', undefined, width, height, PANEL_SLICE, PANEL_SLICE, PANEL_SLICE, PANEL_SLICE)
    .setDepth(depth)
    .setAlpha(0.94);
}
