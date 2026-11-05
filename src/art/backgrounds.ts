import type Phaser from 'phaser';
import { Painter, rng } from './painter';
import { P } from './palette';
import { sheet } from './sprites';

const TAU = Math.PI * 2;

function sky(): Painter {
  const p = new Painter(320, 180);
  const bands = [P.sky0, P.sky1, P.sky2, P.sky3, P.sky4];
  for (let y = 0; y < 180; y++) {
    const t = Math.min(y / 150, 1) * (bands.length - 1);
    const i = Math.min(Math.floor(t), bands.length - 1);
    const f = t - i;
    const next = bands[Math.min(i + 1, bands.length - 1)];
    p.dither(0, y, 320, 1, bands[i], next, f > 0.55 ? (f - 0.55) / 0.45 : 0);
  }
  const r = rng(7);
  for (let k = 0; k < 80; k++) {
    const x = Math.floor(r() * 320),
      y = Math.floor(r() * 95);
    p.px(x, y, r() > 0.7 ? P.white : P.grey);
    if (r() > 0.92)
      p.px(x - 1, y, P.darkGrey)
        .px(x + 1, y, P.darkGrey)
        .px(x, y - 1, P.darkGrey)
        .px(x, y + 1, P.darkGrey);
  }
  // full moon, of course
  p.ellipse(252, 40, 19, 19, P.sky2);
  p.ellipse(252, 40, 16, 16, P.moon);
  p.ellipse(246, 35, 3, 3, P.moonShade).ellipse(258, 46, 4, 3, P.moonShade).ellipse(256, 32, 2, 2, P.moonShade);
  // crows
  for (const [x, y] of [
    [200, 30],
    [214, 24],
    [226, 33],
    [80, 50],
  ]) {
    p.px(x - 2, y - 1, P.black)
      .px(x - 1, y, P.black)
      .px(x, y, P.black)
      .px(x + 1, y, P.black)
      .px(x + 2, y - 1, P.black);
  }
  return p;
}

function hills(): Painter {
  const W = 384;
  const p = new Painter(W, 180);
  const far = (x: number) => 108 + 9 * Math.sin((TAU * x * 2) / W) + 5 * Math.sin((TAU * x * 5) / W + 1);
  const near = (x: number) => 132 + 7 * Math.sin((TAU * x * 3) / W + 2) + 3 * Math.sin((TAU * x * 7) / W);
  for (let x = 0; x < W; x++) p.rect(x, Math.round(far(x)), 1, 180, P.hill0);
  // distant monastery on the hill, where the Monsignore keeps his loot
  const mx = 196,
    my = Math.round(far(mx));
  p.rect(mx - 14, my - 12, 28, 14, P.hill0).rect(mx + 6, my - 26, 7, 16, P.hill0);
  for (let y = my - 33; y < my - 26; y++) p.rect(mx + 9 - (y - (my - 33)) / 2, y, y - (my - 33) + 1, 1, P.hill0);
  p.rect(mx + 9, my - 37, 1, 4, P.hill0).rect(mx + 8, my - 36, 3, 1, P.hill0);
  p.px(mx + 9, my - 20, '#f2c46a')
    .px(mx - 6, my - 6, '#f2c46a')
    .px(mx + 1, my - 6, '#f2c46a');
  for (let x = 0; x < W; x++) p.rect(x, Math.round(near(x)), 1, 180, P.hill1);
  // cypresses
  for (const cx of [30, 44, 120, 260, 271, 340]) {
    const base = Math.round(near(cx));
    p.ellipse(cx, base - 9, 2.5, 11, P.hill1);
  }
  // olive trees
  const r = rng(11);
  for (let k = 0; k < 14; k++) {
    const cx = Math.floor(r() * W),
      base = Math.round(near(cx));
    p.ellipse(cx, base - 3, 4 + r() * 2, 3, '#24152f').rect(cx, base - 2, 1, 3, '#24152f');
  }
  return p;
}

interface Lit {
  x: number;
  y: number;
  nonna: boolean;
}

function houses(): Painter {
  const W = 512;
  const p = new Painter(W, 180);
  const r = rng(23);
  const widths = [72, 56, 88, 64, 80, 48, 104];
  const walls = [P.wallA, P.wallB, P.wallC, '#e3c9a2', '#d6a088'];
  const lit: Lit[] = [];
  let x = 0;
  const tops: number[] = [];
  widths.forEach((w, idx) => {
    const top = 58 + Math.floor(r() * 42);
    tops.push(top);
    const wall = walls[idx % walls.length];
    p.rect(x, top, w, 162 - top, wall);
    p.rect(x, top, 2, 162 - top, '#00000022');
    // roof style
    const style = idx % 3;
    if (style === 0) {
      p.rect(x - 1, top - 2, w + 2, 3, P.stoneLight).rect(x - 1, top + 1, w + 2, 1, P.stoneDark);
    } else if (style === 1) {
      for (let k = 0; k < 6; k++) p.rect(x + k, top - 6 + k, w - k * 2, 1, P.roof);
      for (let k = 2; k < w - 2; k += 3) p.px(x + k, top - 1, '#7d3c2a');
    } else {
      p.rect(x - 1, top - 2, w + 2, 3, P.stoneLight);
      p.ellipse(x + w / 2, top - 2, 8, 7, '#c98f6a', -99, top - 2).rect(x + w / 2, top - 13, 1, 4, P.darkGrey);
    }
    // antenna or chimney
    if (r() > 0.4)
      p.rect(x + 8, top - 10, 1, 9, P.darkGrey)
        .rect(x + 5, top - 9, 7, 1, P.darkGrey)
        .rect(x + 6, top - 6, 5, 1, P.darkGrey);
    else p.rect(x + w - 12, top - 7, 5, 6, P.wallC).rect(x + w - 13, top - 8, 7, 2, P.stoneDark);
    // windows
    for (let wy = top + 10; wy < 130; wy += 24) {
      for (let wx = x + 8; wx + 10 < x + w - 4; wx += 18) {
        const isLit = r() > 0.62;
        const closed = !isLit && r() > 0.5;
        p.rect(wx, wy, 8, 11, '#2a1d2a');
        if (isLit) lit.push({ x: wx, y: wy, nonna: r() > 0.55 });
        if (closed) {
          p.rect(wx, wy, 8, 11, P.shutter);
          for (let s = wy + 1; s < wy + 11; s += 2) p.rect(wx, s, 8, 1, P.shutterShade);
          p.rect(wx + 4, wy, 1, 11, P.shutterShade);
        } else {
          p.rect(wx - 3, wy, 3, 11, P.shutter).rect(wx + 8, wy, 3, 11, P.shutter);
          p.rect(wx - 3, wy + 1, 3, 1, P.shutterShade).rect(wx + 8, wy + 5, 3, 1, P.shutterShade);
        }
        p.rect(wx - 1, wy + 11, 10, 1, P.stoneLight);
        if (r() > 0.7) {
          // small balcony with flower pots
          p.rect(wx - 3, wy + 11, 14, 2, P.stoneLight);
          for (let k = wx - 3; k < wx + 11; k += 2) p.rect(k, wy + 6, 1, 5, P.darkGrey);
          p.rect(wx - 3, wy + 6, 14, 1, P.darkGrey);
          p.px(wx - 2, wy + 5, P.red).px(wx + 9, wy + 5, P.pear);
        }
      }
    }
    // door
    const dx = x + Math.floor(w / 2) - 6;
    p.rect(dx, 140, 12, 22, P.brownShade).ellipse(dx + 6, 141, 6, 4, P.brownShade, -99, 141);
    p.rect(dx + 1, 142, 4, 19, P.brown)
      .rect(dx + 7, 142, 4, 19, P.brown)
      .px(dx + 6, 152, P.gold);
    if (r() > 0.5) p.rect(dx - 6, 155, 3, 7, P.roof).rect(dx - 7, 152, 5, 4, P.cactus); // basil pot
    x += w;
  });
  // laundry lines between buildings (never across the wrap seam)
  const clothes = [P.white, P.red, P.shorts, P.gold, '#e7a1c4', P.shutter];
  let bx = 0;
  for (let i = 0; i < widths.length - 1; i++) {
    bx += widths[i];
    const y = Math.max(tops[i], tops[i + 1]) + 18;
    const x0 = bx - 18,
      x1 = bx + 18;
    for (let k = x0; k <= x1; k++) {
      const sag = Math.round(3 * Math.sin(((k - x0) / (x1 - x0)) * Math.PI));
      p.px(k, y + sag, P.darkGrey);
    }
    for (let k = x0 + 3; k < x1 - 4; k += 7) {
      const sag = Math.round(3 * Math.sin(((k - x0) / (x1 - x0)) * Math.PI));
      const c = clothes[Math.floor(r() * clothes.length)];
      const big = r() > 0.6;
      p.rect(k, y + sag + 1, big ? 6 : 4, big ? 7 : 5, c);
      if (big) p.rect(k + 2, y + sag + 5, 2, 3, '#00000000');
    }
  }
  // dusk: everything goes purple except the warm windows
  p.tint('#2a1240', 0.42);
  for (const l of lit) {
    p.rect(l.x, l.y, 8, 11, '#f2c46a').rect(l.x, l.y + 8, 8, 3, '#e09a48');
    if (l.nonna) {
      p.ellipse(l.x + 4, l.y + 5, 2, 2, '#2a1530').rect(l.x + 1, l.y + 7, 6, 4, '#2a1530');
    }
  }
  return p;
}

function ground(): Painter {
  const p = new Painter(32, 20);
  p.rect(0, 0, 32, 20, P.stoneDark);
  p.rect(0, 0, 32, 2, P.stoneLight).rect(0, 2, 32, 1, '#3e3832');
  const stone = (x: number, y: number, w: number, h: number) => {
    p.rect(x, y, w, h, P.stone)
      .rect(x, y, w, 1, P.stoneLight)
      .rect(x, y + h - 1, w, 1, '#6e665b');
    p.px(x + 2, y + 2, '#9a9284');
  };
  stone(0, 4, 15, 7);
  stone(16, 4, 15, 7);
  stone(-8, 12, 15, 7);
  stone(8, 12, 15, 7);
  stone(24, 12, 15, 7);
  return p;
}

function addCanvas(scene: Phaser.Scene, key: string, p: Painter) {
  scene.textures.addCanvas(key, p.canvas);
}

/** World props. Each one is a single-frame outlined sprite. */
function props(scene: Phaser.Scene) {
  sheet(scene, 'ape', 46, 32, 1, (p) => {
    p.rect(2, 16, 28, 8, P.brown).rect(2, 16, 28, 1, '#8a5a38').rect(2, 23, 28, 1, P.brownShade);
    for (let x = 4; x < 30; x += 6) p.rect(x, 17, 1, 6, P.brownShade);
    p.ellipse(9, 13, 5, 4, '#3f8a3a').ellipse(9, 13, 4, 3, '#56a84a').rect(7, 11, 1, 4, '#2e6a2b');
    for (const [x, y] of [
      [17, 13],
      [20, 12],
      [23, 13],
      [19, 14],
      [22, 14],
      [26, 13],
    ])
      p.ellipse(x, y, 1.6, 1.6, P.red);
    p.rect(29, 6, 14, 20, '#7fb2c9').rect(29, 6, 14, 2, '#a6d0e0').rect(41, 8, 2, 18, '#5d8ea6');
    p.rect(35, 9, 7, 7, '#d8eef6').px(36, 10, P.white).rect(30, 17, 6, 1, '#5d8ea6');
    p.rect(42, 21, 2, 3, P.gold);
    for (const wx of [10, 37]) p.ellipse(wx, 27, 3.5, 3.5, P.black).px(wx, 27, P.grey);
  });
  sheet(scene, 'fico', 24, 30, 1, (p) => {
    const pads: [number, number, number, number][] = [
      [12, 23, 4, 6],
      [7, 15, 3.5, 5],
      [16, 14, 3.5, 5],
      [12, 8, 3, 4],
      [4, 7, 2.5, 3.5],
      [19, 5, 2.5, 3.5],
    ];
    pads.forEach(([x, y, rx, ry]) => {
      p.ellipse(x, y, rx, ry, P.cactusShade);
      p.ellipse(x - 0.5, y - 0.5, rx - 1, ry - 1, P.cactus);
    });
    for (const [x, y] of [
      [10, 3],
      [14, 3],
      [3, 3],
      [20, 1],
      [21, 4],
      [2, 6],
    ])
      p.ellipse(x, y, 1.3, 1.3, P.pear);
    for (const [x, y] of [
      [11, 21],
      [13, 25],
      [6, 14],
      [17, 13],
      [12, 7],
    ])
      p.px(x, y, '#d8e8a0');
  });
  sheet(scene, 'fontana', 40, 28, 1, (p) => {
    p.rect(18, 4, 4, 14, P.stone).rect(18, 4, 1, 14, P.stoneLight);
    p.ellipse(20, 4, 5, 2, P.stoneLight);
    p.rect(19, 0, 2, 3, P.holyWater)
      .px(16, 3, P.holyWater)
      .px(24, 3, P.holyWater)
      .px(14, 6, P.holyWater)
      .px(26, 6, P.holyWater);
    p.rect(2, 14, 36, 12, P.stone)
      .rect(2, 14, 36, 2, P.stoneLight)
      .rect(4, 16, 32, 2, P.holyWater)
      .rect(2, 25, 36, 1, P.stoneDark);
    p.ellipse(20, 21, 4, 3, P.stoneDark).ellipse(20, 21, 2.5, 2, P.stoneLight);
  });
  sheet(scene, 'lampione', 12, 52, 1, (p) => {
    p.rect(5, 10, 2, 40, P.darkGrey).rect(3, 48, 6, 3, P.darkGrey);
    p.rect(2, 2, 8, 8, P.darkGrey).rect(3, 3, 6, 6, '#f6d67a').rect(4, 4, 2, 2, '#fff6d0');
    p.rect(1, 1, 10, 2, P.black).px(6, 0, P.black);
  });
  sheet(scene, 'cassetta', 20, 14, 1, (p) => {
    for (const [x, y] of [
      [4, 3],
      [8, 2],
      [12, 3],
      [16, 3],
      [6, 4],
      [14, 4],
      [10, 4],
    ])
      p.ellipse(x, y, 2, 2, P.red);
    p.px(8, 0, P.cactus).px(12, 1, P.cactus);
    p.rect(1, 5, 18, 8, '#b98a52')
      .rect(1, 5, 18, 1, '#d9ae74')
      .rect(1, 9, 18, 1, '#8a6038')
      .rect(1, 12, 18, 1, '#8a6038');
  });
  sheet(scene, 'balcone', 50, 18, 1, (p) => {
    for (let x = 2; x < 48; x += 4) p.rect(x, 1, 1, 7, P.darkGrey);
    p.rect(1, 1, 48, 1, P.darkGrey);
    for (let x = 4; x < 48; x += 8) p.ellipse(x + 1.5, 4, 1.5, 1.5, P.darkGrey);
    p.rect(1, 8, 48, 4, P.stoneLight).rect(1, 11, 48, 1, P.stoneDark);
    for (const x of [6, 22, 38]) p.rect(x, 12, 6, 3, P.stone).rect(x + 1, 15, 4, 1, P.stone);
  });
  sheet(scene, 'cartello', 80, 32, 1, (p) => {
    p.rect(10, 16, 2, 15, P.darkGrey).rect(68, 16, 2, 15, P.darkGrey);
    p.rect(1, 1, 78, 17, P.white).rect(2, 2, 76, 15, P.red).rect(3, 3, 74, 13, P.white);
  });
  // church facade for the boss arena
  const c = new Painter(200, 162);
  c.rect(20, 50, 160, 112, '#d9c7a4');
  c.rect(20, 50, 160, 4, P.stoneLight);
  for (let y = 0; y < 30; y++) c.rect(60 + y * 1.3, 50 - y, 80 - y * 2.6, 1, '#d9c7a4');
  c.rect(98, 14, 4, 10, P.gold).rect(94, 17, 12, 3, P.gold);
  for (const x of [28, 56, 136, 164]) c.rect(x, 54, 8, 108, '#c4ae86').rect(x, 54, 2, 108, '#e6d6b6');
  c.ellipse(100, 72, 13, 13, P.stoneDark).ellipse(100, 72, 11, 11, '#5a2d6a');
  for (let k = 0; k < 8; k++)
    c.line(100, 72, 100 + Math.cos((k * TAU) / 8) * 10, 72 + Math.sin((k * TAU) / 8) * 10, P.gold);
  c.ellipse(100, 72, 3, 3, P.red);
  c.rect(84, 112, 32, 50, P.brownShade).ellipse(100, 112, 16, 14, P.brownShade, -99, 112);
  c.rect(86, 114, 13, 48, P.brown).rect(101, 114, 13, 48, P.brown);
  for (const y of [124, 140]) c.rect(88, y, 9, 1, P.gold).rect(103, y, 9, 1, P.gold);
  c.rect(70, 156, 60, 6, P.stoneLight);
  // bell tower
  c.rect(160, 0, 34, 60, '#cbb48e').rect(166, 8, 22, 20, '#2a1d2a');
  c.ellipse(177, 8, 11, 6, '#2a1d2a', -99, 8);
  c.rect(173, 14, 8, 9, '#b07a2c').rect(172, 22, 10, 2, P.gold);
  c.tint('#2a1240', 0.38);
  for (const [wx, wy] of [
    [44, 90],
    [148, 90],
  ])
    c.rect(wx, wy, 10, 18, '#f2c46a').ellipse(wx + 5, wy, 5, 4, '#f2c46a', -99, wy);
  addCanvas(scene, 'chiesa', c);
}

export function registerBackgrounds(scene: Phaser.Scene) {
  addCanvas(scene, 'bg-sky', sky());
  addCanvas(scene, 'bg-hills', hills());
  addCanvas(scene, 'bg-houses', houses());
  addCanvas(scene, 'ground', ground());
  props(scene);
}
