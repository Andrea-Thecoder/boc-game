import type Phaser from 'phaser';
import { Painter } from './painter';
import { P } from './palette';

type Draw = (p: Painter, frame: number) => void;

/** Paints `n` frames side by side into one canvas texture with numeric frame names 0..n-1. */
export function sheet(scene: Phaser.Scene, key: string, fw: number, fh: number, n: number, draw: Draw, outline = true) {
  const p = new Painter(fw * n, fh);
  for (let i = 0; i < n; i++) {
    p.ox = i * fw;
    p.oy = 0;
    draw(p, i);
    p.ox = 0;
    if (outline) p.outline(P.outline, i * fw, 0, fw, fh);
  }
  const tex = scene.textures.addCanvas(key, p.canvas);
  if (!tex) throw new Error(`Texture ${key} non creata`);
  for (let i = 0; i < n; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}

// ---------------------------------------------------------------------------------------------
// PAOLONE — split in legs + torso like the classic arcade run-and-guns, so aiming and running
// animate independently. Both sheets are 36x34, feet on the bottom row.
// ---------------------------------------------------------------------------------------------

export const PAOLONE_W = 36;
export const PAOLONE_H = 34;

/** Legs frames: 0 idle, 1-4 run cycle, 5 jump. */
function paoloneLegs(p: Painter, f: number) {
  p.ox += 2;
  let fx = 0,
    bx = 0,
    fy = 0,
    by = 0;
  if (f === 1) {
    fx = 3;
    bx = -3;
  }
  if (f === 2) {
    fy = -2;
  }
  if (f === 3) {
    fx = -3;
    bx = 3;
  }
  if (f === 4) {
    by = -2;
  }
  if (f === 5) {
    fx = 2;
    bx = -1;
    fy = -3;
    by = -2;
  }
  const leg = (x: number, dy: number, back: boolean) => {
    p.rect(x, 26 + dy, 4, 5, back ? P.skinShade : P.skin);
    p.rect(x - 1, 31 + dy, 6, 2, back ? '#23784f' : P.slipper);
  };
  leg(10 + bx, by, true);
  leg(17 + fx, fy, false);
  p.rect(8, 22, 16, 5, P.shorts);
  p.rect(8, 26, 16, 1, P.shortsShade);
  p.rect(21, 22, 3, 5, P.shortsShade);
  p.rect(15, 25, 2, 2, P.shortsShade);
}

/** Torso frames. */
export const TORSO = {
  idle: 0,
  bob: 1,
  fwd: 2,
  up: 3,
  diagUp: 4,
  diagDown: 5,
  down: 6,
  windup: 7,
  panza: 8,
  hurt: 9,
} as const;

function paoloneTorso(p: Painter, f: number) {
  p.ox += 2;
  const b = f === TORSO.bob ? 1 : 0;
  const lean = f === TORSO.panza ? 3 : 0;
  const hurt = f === TORSO.hurt;

  // back arm (in shadow)
  if (hurt) p.line(9, 12, 4, 4, P.skinShade, 3);
  else if (f === TORSO.panza) p.line(9, 12, 3, 15, P.skinShade, 3);
  else p.line(9, 12 + b, 7, 20 + b, P.skinShade, 3);

  // the legendary belly
  const cx = 16 + lean,
    cy = 17 + b;
  p.ellipse(cx, cy, 10, 8.5, P.skinShade);
  p.ellipse(cx - 1, cy, 9, 8, P.skin);
  p.ellipse(cx, cy, 10, 8.5, P.tankShade, -99, 20 + b);
  p.ellipse(cx - 1, cy, 9, 8, P.tank, -99, 20 + b);
  p.rect(cx - 7, 21 + b, 2, 1, P.tankShade); // hem rolling up
  p.rect(11 + lean, 8 + b, 2, 3, P.tank);
  p.rect(19 + lean, 8 + b, 2, 3, P.tank);
  // juice stains, he's been at it all day
  p.px(cx + 4, cy - 3, P.stain)
    .px(cx + 5, cy - 2, P.stain)
    .px(cx + 4, cy - 2, P.tamarindo);
  p.px(cx - 3, cy + 1, P.ace).px(cx - 2, cy + 2, P.ace);
  p.px(cx + 3, 23 + b, P.skinDark); // navel
  p.px(cx + 1, 22 + b, P.skinShade).px(cx + 5, 22 + b, P.skinShade);

  // head + double chin
  const hx = 18 + lean,
    hy = 6 + b;
  p.ellipse(hx + 1, hy + 4, 4.5, 2.5, P.skinShade);
  p.ellipse(hx, hy + 3.5, 4.5, 2.5, P.skin);
  p.ellipse(hx, hy, 5, 5, P.skin);
  p.ellipse(hx - 1, hy - 1.5, 5, 3.5, P.hair, -99, hy - 2);
  p.rect(hx - 5, hy - 2, 2, 4, P.hair);
  p.px(hx - 2, hy + 1, P.skinShade).px(hx - 2, hy, P.skinShade);
  if (hurt) {
    p.px(hx + 1, hy - 1, P.black)
      .px(hx + 3, hy - 1, P.black)
      .px(hx + 2, hy, P.black)
      .px(hx + 1, hy + 1, P.black)
      .px(hx + 3, hy + 1, P.black);
    p.rect(hx + 2, hy + 3, 2, 2, P.skinDark);
  } else {
    p.rect(hx + 1, hy - 2, 3, 1, P.hair);
    p.rect(hx + 2, hy - 1, 1, 2, P.black);
    p.px(hx + 4, hy + 2, P.cheek).px(hx + 3, hy + 2, P.cheek);
    p.rect(hx + 2, hy + 4, 3, 1, P.skinDark).px(hx + 5, hy + 3, P.skinDark);
    p.px(hx, hy + 5, P.darkGrey)
      .px(hx + 2, hy + 6, P.darkGrey)
      .px(hx - 1, hy + 4, P.darkGrey);
  }

  // front arm
  const sx = 22 + lean,
    sy = 12 + b;
  const hand = (x: number, y: number) => p.rect(x - 1, y - 1, 3, 3, P.skin);
  const brick = (x: number, y: number) => {
    p.rect(x - 1, y - 3, 3, 4, P.tamarindo);
    p.px(x, y - 4, P.white);
  };
  switch (f) {
    case TORSO.idle:
    case TORSO.bob:
      p.line(sx, sy, 24, 20 + b, P.skin, 3);
      hand(24, 21 + b);
      break;
    case TORSO.fwd:
      p.line(sx, sy, 29, 12, P.skin, 3);
      hand(30, 12);
      break;
    case TORSO.up:
      p.line(sx, sy, 23, 2, P.skin, 3);
      hand(23, 1);
      break;
    case TORSO.diagUp:
      p.line(sx, sy, 28, 5, P.skin, 3);
      hand(29, 4);
      break;
    case TORSO.diagDown:
      p.line(sx, sy, 28, 19, P.skin, 3);
      hand(29, 20);
      break;
    case TORSO.down:
      p.line(sx, sy, 24, 25, P.skin, 3);
      hand(24, 27);
      break;
    case TORSO.windup:
      p.line(sx, sy, 26, 7, P.skin, 3);
      p.line(26, 7, 22, 2, P.skin, 3);
      hand(22, 2);
      brick(22, 2);
      break;
    case TORSO.panza:
      p.line(sx, sy, 17, 18, P.skin, 3);
      hand(16, 18);
      break;
    case TORSO.hurt:
      p.line(sx, sy, 28, 3, P.skin, 3);
      hand(29, 2);
      break;
  }
}

// ---------------------------------------------------------------------------------------------
// ENEMIES — the faithful of Monsignor Angelius Panza
// ---------------------------------------------------------------------------------------------

/** Chierichetto 20x24: 0-1 walk, 2 throw, 3 dead. */
function chierichetto(p: Painter, f: number) {
  p.ox += 1;
  const step = f === 1 ? 1 : 0;
  const dead = f === 3;
  p.rect(6 - step, 21, 3, 2, P.black).rect(10 + step, 21, 3, 2, P.black);
  p.rect(6, 12, 8, 9, P.red).rect(5, 17, 10, 4, P.red).rect(12, 12, 2, 9, P.redShade).rect(13, 17, 2, 4, P.redShade);
  p.rect(5, 9, 10, 7, P.white).rect(13, 9, 2, 7, P.offWhite);
  for (let x = 5; x <= 14; x += 2) p.px(x, 16, P.white);
  p.ellipse(10, 5, 4, 4, P.skin);
  p.ellipse(9.5, 3.5, 4.5, 3, P.brown, -99, 4);
  p.rect(6, 4, 2, 3, P.brown);
  if (dead) {
    p.px(11, 4, P.black).px(13, 4, P.black).px(12, 5, P.black).px(11, 6, P.black).px(13, 6, P.black);
    p.rect(12, 7, 2, 2, P.redShade);
  } else {
    p.px(11, 3, P.brownShade).px(12, 4, P.brownShade);
    p.rect(12, 5, 1, 2, P.black);
    p.px(13, 6, P.cheek);
    p.rect(11, 8, 3, 1, P.skinDark).px(14, 7, P.skinDark);
  }
  if (f === 2) {
    p.line(12, 10, 15, 4, P.white, 2);
    p.ellipse(16, 3, 2, 2, P.white);
  } else {
    p.rect(11, 10, 2, 5, P.offWhite).px(11, 15, P.skin).px(12, 15, P.skin);
  }
}

/** Beghina 34x24: 0-1 walk, 2 windup, 3 whip, 4 dead. */
function beghina(p: Painter, f: number) {
  const step = f === 1 ? 1 : 0;
  const dead = f === 4;
  p.rect(11 - step, 21, 3, 2, P.black).rect(16 + step, 21, 3, 2, P.black);
  for (let y = 10; y <= 20; y++) {
    const half = 4 + (y - 10) * 0.3;
    p.rect(Math.round(15.5 - half), y, Math.round(half * 2), 1, P.cassock);
    p.rect(Math.round(15.5 + half) - 2, y, 2, 1, P.cassockShade);
  }
  p.ellipse(13, 10, 4.5, 3.5, P.cassock);
  p.ellipse(17, 6, 4.5, 4.5, P.cassock);
  p.ellipse(19, 6.5, 2.5, 3, P.skin);
  p.px(17, 3, P.grey).px(18, 3, P.grey);
  if (dead) {
    p.px(19, 5, P.black).px(21, 5, P.black).px(20, 6, P.black).px(19, 7, P.black).px(21, 7, P.black);
  } else {
    p.px(19, 6, P.grey).px(20, 6, P.white).px(21, 6, P.grey);
    p.px(22, 7, P.skinShade);
    p.px(18, 8, P.brownShade);
    p.rect(20, 9, 2, 1, P.skinDark);
  }
  if (f === 2) {
    p.line(19, 12, 21, 4, P.cassock, 2).px(21, 3, P.skin);
    [
      [23, 1],
      [25, 1],
      [27, 2],
      [28, 4],
      [27, 6],
    ].forEach(([x, y]) => p.px(x, y, P.beads));
    p.rect(25, 7, 1, 3, P.gold).rect(24, 8, 3, 1, P.gold);
  } else if (f === 3) {
    p.line(19, 12, 24, 11, P.cassock, 2).px(25, 11, P.skin);
    for (let x = 26; x <= 30; x += 2) p.px(x, 11 + (x === 28 ? 1 : 0), P.beads);
    p.rect(31, 10, 1, 3, P.gold).rect(30, 11, 3, 1, P.gold);
  } else {
    p.rect(19, 12, 2, 3, P.cassock).px(20, 15, P.skin);
    p.px(20, 16, P.beads).px(20, 18, P.beads).px(21, 19, P.gold).rect(21, 20, 1, 2, P.gold);
  }
}

/** Sacrestano 30x28: 0-1 incense swing, 2 dead. */
function sacrestano(p: Painter, f: number) {
  const dead = f === 2;
  p.rect(7, 25, 4, 2, P.brownShade).rect(13, 25, 4, 2, P.brownShade);
  p.rect(7, 12, 10, 13, P.brown).rect(6, 20, 12, 5, P.brown).rect(15, 12, 2, 13, P.brownShade);
  p.rect(7, 17, 10, 1, P.offWhite).px(9, 18, P.offWhite).px(9, 19, P.offWhite);
  p.ellipse(12, 7, 4.5, 5, P.skin);
  p.px(11, 3, P.white).px(12, 3, P.white);
  p.rect(8, 6, 2, 3, P.grey);
  p.rect(16, 7, 2, 2, P.skinShade);
  if (dead) {
    p.px(13, 5, P.black).px(15, 5, P.black).px(14, 6, P.black).px(13, 7, P.black).px(15, 7, P.black);
  } else {
    p.rect(13, 6, 2, 1, P.black).rect(13, 5, 2, 1, P.skinShade);
    p.rect(13, 10, 3, 1, P.skinDark);
  }
  p.line(14, 13, 18, 15, P.brown, 2).px(19, 15, P.skin);
  const [cx, cy] = f === 0 ? [25, 20] : f === 1 ? [25, 9] : [20, 24];
  p.line(19, 15, cx, cy - 3, P.grey, 1);
  p.ellipse(cx, cy, 2.5, 3, P.gold)
    .rect(cx - 2, cy + 1, 5, 1, P.goldShade)
    .px(cx, cy - 3, P.goldShade);
  if (!dead) p.px(cx - 1, cy - 5, P.toxic).px(cx + 1, cy - 6, P.toxicDark);
}

/** Monsignor Angelius Panza in his armoured Papamobile, 96x64 facing left: 0 normal, 1 laughing, 2 hurt, 3 empty wreck. */
function panza(p: Painter, f: number) {
  // wheels
  for (const wx of [22, 74]) {
    p.ellipse(wx, 55, 7, 7, P.black).ellipse(wx, 55, 3.5, 3.5, P.grey).px(wx, 55, P.gold);
  }
  // chassis
  p.rect(6, 34, 86, 18, P.white).rect(6, 47, 86, 5, P.offWhite);
  p.rect(6, 40, 86, 2, P.gold).rect(6, 51, 86, 1, P.goldShade);
  for (let x = 10; x < 90; x += 7) p.px(x, 37, P.grey).px(x, 45, P.grey);
  p.rect(62, 42, 2, 8, P.red).rect(59, 44, 8, 2, P.red);
  p.rect(30, 43, 6, 6, P.purple).rect(31, 44, 4, 4, P.gold).px(33, 46, P.red); // coat of arms
  // front ram + holy water cannon
  p.rect(2, 36, 6, 14, P.goldShade).rect(3, 37, 4, 12, P.gold);
  p.rect(1, 30, 12, 5, P.gold).rect(1, 31, 2, 3, P.black).rect(9, 30, 4, 5, P.goldShade);
  // exhaust
  p.rect(90, 28, 3, 8, P.darkGrey).rect(89, 27, 5, 2, P.grey);
  // glass dome
  p.ellipse(50, 30, 23, 24, '#9fd0e8', -99, 33);
  p.ellipse(50, 30, 21.5, 22.5, '#000', -99, 33);
  // punch out inner dome then fill with faint glass
  for (let y = 7; y <= 33; y++) {
    for (let x = 28; x <= 72; x++) {
      const dx = (x + 0.5 - 50) / 21.5,
        dy = (y + 0.5 - 30) / 22.5;
      if (dx * dx + dy * dy <= 1) {
        p.clear(x, y, 1, 1);
        p.px(x, y, 'rgba(150,205,235,0.22)');
      }
    }
  }
  if (f === 3) {
    // wreck: empty, cracked dome
    p.line(38, 12, 46, 20, 'rgba(255,255,255,0.75)')
      .line(46, 20, 44, 28, 'rgba(255,255,255,0.75)')
      .line(46, 20, 56, 16, 'rgba(255,255,255,0.75)')
      .line(56, 16, 62, 22, 'rgba(255,255,255,0.75)');
    p.rect(44, 30, 12, 4, P.redShade);
    return;
  }
  // the Monsignore: vestments
  p.ellipse(50, 34, 13, 9, P.red, -99, 33);
  p.rect(43, 26, 14, 2, P.gold).rect(49, 27, 2, 7, P.gold);
  p.rect(46, 29, 1, 4, P.gold).rect(45, 30, 3, 1, P.gold); // pectoral cross
  // head, old and swollen
  p.ellipse(48, 20, 7.5, 7, P.skin);
  p.ellipse(47, 25, 6.5, 3, P.skinShade);
  p.ellipse(47, 24.5, 6, 2.5, P.skin);
  // mitre
  for (let y = 2; y <= 14; y++) {
    const half = Math.round(2 + (y - 2) * 0.45);
    p.rect(49 - half, y, half * 2 + 1, 1, P.white);
  }
  p.rect(48, 2, 3, 13, P.gold).rect(43, 13, 13, 2, P.gold);
  p.rect(49, 5, 1, 4, P.red).rect(48, 6, 3, 1, P.red);
  // face (looks left)
  p.ellipse(41, 21, 2.2, 2, P.cheek); // red boozy nose
  if (f === 2) {
    p.rect(42, 18, 3, 1, P.black);
    p.px(53, 17, P.holyWater).px(53, 18, P.holyWater);
  } else {
    p.rect(43, 18, 1, 2, P.black);
  }
  p.line(41, 15, 46, 17, P.white, 2); // furious white eyebrow
  p.px(46, 22, P.cheek).px(45, 23, P.cheek);
  if (f === 1) {
    p.rect(41, 24, 4, 3, P.black).rect(42, 26, 2, 1, P.red).px(41, 24, P.white).px(44, 24, P.white);
  } else {
    p.rect(41, 25, 4, 1, P.skinDark).px(40, 26, P.skinDark);
  }
  p.px(51, 21, P.skinShade).px(52, 23, P.skinShade); // wrinkles
  // glass highlight
  p.line(36, 14, 40, 10, 'rgba(255,255,255,0.7)').line(34, 20, 35, 18, 'rgba(255,255,255,0.7)');
}

// ---------------------------------------------------------------------------------------------
// PROJECTILES, PICKUPS, UI
// ---------------------------------------------------------------------------------------------

export const FLAVOURS = {
  tamarindo: P.tamarindo,
  pera: P.pera,
  ace: P.ace,
  pesca: P.pesca,
} as const;
export type Flavour = keyof typeof FLAVOURS;

function sukkino(color: string): Draw {
  return (p) => {
    p.rect(1, 2, 5, 7, color).rect(5, 2, 1, 7, P.black + '55');
    p.rect(1, 4, 5, 2, P.white);
    p.px(3, 5, color);
    p.rect(4, 0, 1, 2, P.white).px(5, 0, P.red);
  };
}

function bigSukkino(color: string, fruit: (p: Painter) => void): Draw {
  return (p) => {
    p.rect(2, 3, 9, 11, color).rect(9, 3, 2, 11, P.black + '44');
    p.rect(2, 6, 9, 5, P.white);
    fruit(p);
    p.rect(8, 0, 1, 3, P.white).px(9, 0, P.red);
  };
}

function campana(p: Painter) {
  p.rect(5, 0, 3, 2, P.goldShade);
  for (let y = 2; y <= 10; y++) {
    const half = Math.round(2 + (y - 2) * 0.45);
    p.rect(6 - half, y, half * 2 + 1, 1, y === 9 ? P.gold : '#b07a2c');
  }
  p.rect(2, 10, 9, 1, P.goldShade).px(4, 4, P.gold).px(4, 5, P.gold);
  p.ellipse(6.5, 12, 1.5, 1.2, P.darkGrey);
}

export function registerSprites(scene: Phaser.Scene) {
  sheet(scene, 'paolone-legs', PAOLONE_W, PAOLONE_H, 6, paoloneLegs);
  sheet(scene, 'paolone-torso', PAOLONE_W, PAOLONE_H, 10, paoloneTorso);
  sheet(scene, 'chierichetto', 20, 24, 4, chierichetto);
  sheet(scene, 'beghina', 34, 24, 5, beghina);
  sheet(scene, 'sacrestano', 30, 28, 3, sacrestano);
  sheet(scene, 'panza', 96, 64, 4, panza);

  (Object.keys(FLAVOURS) as Flavour[]).forEach((k) => sheet(scene, `sukkino-${k}`, 8, 10, 1, sukkino(FLAVOURS[k])));
  sheet(
    scene,
    'pickup-pera',
    13,
    15,
    1,
    bigSukkino(P.pera, (p) => {
      p.ellipse(6.5, 9, 2, 1.8, P.pera).ellipse(6.5, 7.5, 1.2, 1.2, P.pera).px(7, 6, P.brown);
    }),
  );
  sheet(
    scene,
    'pickup-ace',
    13,
    15,
    1,
    bigSukkino(P.ace, (p) => {
      p.ellipse(4.5, 8.5, 1.7, 1.7, P.ace).ellipse(8, 8.5, 1.7, 1.7, P.gold).px(6, 9, P.red);
    }),
  );
  sheet(
    scene,
    'pickup-pesca',
    13,
    15,
    1,
    bigSukkino(P.pesca, (p) => {
      p.ellipse(6.5, 8.5, 2.2, 2, P.pesca).px(6, 8, P.cheek).px(7, 6, P.cactus).px(8, 6, P.cactus);
    }),
  );
  sheet(scene, 'panzerotto', 15, 10, 1, (p) => {
    p.ellipse(7.5, 8, 6.5, 6, '#d8962e', -99, 8).ellipse(7.5, 8, 5, 4.5, '#efb64a', -99, 7);
    for (let x = 2; x <= 13; x += 2) p.px(x, 8, '#b5741f');
    p.px(5, 4, '#fbe3a0').px(6, 3, '#fbe3a0');
  });
  sheet(scene, 'heart', 9, 8, 2, (p, f) => {
    const c = f === 0 ? P.red : P.darkGrey;
    p.ellipse(2.5, 2.5, 2, 2, c).ellipse(5.5, 2.5, 2, 2, c);
    for (let y = 3; y <= 6; y++) p.rect(1 + (y - 3), y, 7 - 2 * (y - 3), 1, c);
    if (f === 0) p.px(2, 1, P.white);
  });
  sheet(scene, 'ostia', 8, 8, 1, (p) => {
    p.ellipse(4, 4, 3, 3, P.white).rect(4, 2, 1, 4, P.offWhite).rect(3, 3, 3, 1, P.offWhite);
  });
  sheet(scene, 'goccia', 5, 6, 1, (p) => {
    p.rect(2, 0, 1, 1, P.holyWater).rect(1, 1, 3, 4, P.holyWater).px(1, 2, P.white);
  });
  sheet(scene, 'fumo', 16, 14, 2, (p, f) => {
    const o = f;
    p.ellipse(5, 8 - o, 4, 4, P.toxicDark)
      .ellipse(10, 7 + o, 4.5, 4.5, P.toxicDark)
      .ellipse(8, 5, 4, 3.5, P.toxic);
    p.ellipse(6, 7 - o, 2.5, 2.5, P.toxic)
      .px(9, 4, '#c8e870')
      .px(5, 6, P.purple)
      .px(11, 8, P.purple);
  });
  sheet(scene, 'campana', 13, 14, 1, campana);
  sheet(scene, 'dot', 2, 2, 1, (p) => p.rect(0, 0, 2, 2, '#fff'), false);
  sheet(scene, 'puff', 8, 8, 1, (p) => p.ellipse(4, 4, 3.5, 3.5, '#fff'), false);
}

/** Animations are defined once, globally. */
export function registerAnimations(scene: Phaser.Scene) {
  const a = scene.anims;
  const fr = (key: string, frames: number[]) => frames.map((frame) => ({ key, frame }));
  a.create({ key: 'legs-idle', frames: fr('paolone-legs', [0]), frameRate: 1 });
  a.create({ key: 'legs-run', frames: fr('paolone-legs', [1, 2, 3, 4]), frameRate: 10, repeat: -1 });
  a.create({ key: 'legs-jump', frames: fr('paolone-legs', [5]), frameRate: 1 });
  a.create({ key: 'torso-idle', frames: fr('paolone-torso', [0, 0, 1, 1]), frameRate: 4, repeat: -1 });
  a.create({ key: 'chierichetto-walk', frames: fr('chierichetto', [0, 1]), frameRate: 6, repeat: -1 });
  a.create({ key: 'beghina-walk', frames: fr('beghina', [0, 1]), frameRate: 4, repeat: -1 });
  a.create({ key: 'sacrestano-swing', frames: fr('sacrestano', [0, 1]), frameRate: 3, repeat: -1 });
  a.create({ key: 'fumo', frames: fr('fumo', [0, 1]), frameRate: 4, repeat: -1 });
}
