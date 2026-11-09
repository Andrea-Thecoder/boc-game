import type Phaser from 'phaser';
import { Painter } from './painter';
import { P } from './palette';
import { sheet } from './sprites';

/** Border size of the `ui-panel` texture, in px: the part that is NOT stretched by the nine-slice. */
export const PANEL_SLICE = 5;

const PANEL_PALETTE: Record<string, string> = {
  o: P.outline,
  g: P.gold,
  h: '#f6d86b',
  d: P.goldShade,
  p: P.purple,
  q: P.purpleShade,
  c: P.cassock,
};

/** Gothic frame: gold border with studs on the corners, purple band on top, dark cassock fill. */
const PANEL = [
  '.oooooooooooooo.',
  'ohggggggggggggho',
  'ogddddddddddddgo',
  'ogdppppppppppdgo',
  'ogdqqqqqqqqqqdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogdccccccccccdgo',
  'ogddddddddddddgo',
  'ohggggggggggggho',
  '.oooooooooooooo.',
];

/** Menu graphics: panel frame, padlock for locked items, volume pips. */
export function registerUi(scene: Phaser.Scene) {
  const panel = new Painter(16, 16).map(0, 0, PANEL, PANEL_PALETTE);
  scene.textures.addCanvas('ui-panel', panel.canvas);

  sheet(scene, 'ui-lock', 7, 8, 1, (p) => {
    p.rect(2, 0, 3, 1, P.grey).rect(1, 1, 1, 3, P.grey).rect(5, 1, 1, 3, P.grey);
    p.rect(0, 3, 7, 5, P.goldShade).rect(0, 3, 7, 1, P.gold);
    p.rect(3, 5, 1, 2, P.outline);
  });

  // frame 0 = filled step, frame 1 = empty step
  sheet(
    scene,
    'ui-pip',
    4,
    7,
    2,
    (p, f) => {
      if (f === 0) p.rect(0, 0, 4, 7, P.goldShade).rect(0, 0, 3, 6, P.gold).px(0, 0, '#f6d86b');
      else p.rect(0, 0, 4, 7, P.outline).rect(1, 1, 2, 5, P.darkGrey);
    },
    false,
  );
}
