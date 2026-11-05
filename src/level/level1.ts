import { GROUND_Y } from '../config';
import type { PickupKind } from '../entities/Pickup';

/** One-way platform relative to a prop, or absolute (balconies float on the house walls). */
export interface PropDef {
  key: string;
  x: number;
  /** absolute y of the sprite bottom; defaults to the ground */
  y?: number;
  /** walkable top surface: offset from sprite centre-x, absolute y, width */
  platform?: { dx: number; top: number; w: number };
  depth?: number;
}

export type EnemyType = 'chierichetto' | 'beghina' | 'sacrestano';

export interface SpawnDef {
  type: EnemyType;
  /** 'right'/'left' = just off-screen, or an absolute x */
  at: 'right' | 'left' | number;
  y?: number;
  delay?: number;
}

export interface WaveDef {
  trigger: number;
  spawns: SpawnDef[];
  /** optional line Paolone says when the wave starts */
  line?: string;
}

const balcony = (x: number, y: number): PropDef => ({
  key: 'balcone',
  x,
  y: y + 10,
  platform: { dx: 0, top: y, w: 48 },
  depth: 20,
});
const ape = (x: number): PropDef => ({ key: 'ape', x, platform: { dx: -7, top: GROUND_Y - 15, w: 28 }, depth: 30 });
const crate = (x: number, y = GROUND_Y): PropDef => ({
  key: 'cassetta',
  x,
  y,
  platform: { dx: 0, top: y - 8, w: 18 },
  depth: 30,
});

export const LEVEL1 = {
  name: 'VIA ROMA, CHIAPPETONS',
  props: [
    { key: 'cartello', x: 90, depth: 25 },
    { key: 'fico', x: 180, depth: 25 },
    { key: 'lampione', x: 260, depth: 15 },
    crate(380),
    ape(560),
    { key: 'lampione', x: 640, depth: 15 },
    balcony(730, 112),
    crate(830),
    crate(848),
    crate(839, GROUND_Y - 12),
    { key: 'fico', x: 920, depth: 25 },
    balcony(1080, 104),
    { key: 'lampione', x: 1000, depth: 15 },
    { key: 'fontana', x: 1260, platform: { dx: 0, top: GROUND_Y - 13, w: 36 }, depth: 30 },
    { key: 'lampione', x: 1420, depth: 15 },
    balcony(1560, 110),
    { key: 'fico', x: 1660, depth: 25 },
    balcony(1880, 100),
    { key: 'lampione', x: 1800, depth: 15 },
    ape(2060),
    crate(2240),
    crate(2258),
    { key: 'lampione', x: 2300, depth: 15 },
    { key: 'fico', x: 2420, depth: 25 },
    balcony(2520, 108),
    { key: 'lampione', x: 2720, depth: 15 },
    balcony(2820, 102),
    { key: 'fico', x: 2960, depth: 25 },
    { key: 'lampione', x: 3100, depth: 15 },
  ] as PropDef[],

  pickups: [
    { kind: 'pera', x: 566, y: GROUND_Y - 32 },
    { kind: 'panzerotto', x: 1080, y: 96 },
    { kind: 'ace', x: 1560, y: 102 },
    { kind: 'pesca', x: 2053, y: GROUND_Y - 22 },
    { kind: 'panzerotto', x: 2520, y: 100 },
    { kind: 'ace', x: 2960, y: GROUND_Y - 40 },
    { kind: 'pera', x: 3150, y: GROUND_Y - 10 },
  ] as { kind: PickupKind; x: number; y: number }[],

  waves: [
    {
      trigger: 170,
      spawns: [
        { type: 'chierichetto', at: 'right' },
        { type: 'chierichetto', at: 'right', delay: 900 },
      ],
      line: 'Chierichetti! Venite, vi offro un succhino... IN FACCIA!',
    },
    {
      trigger: 440,
      spawns: [
        { type: 'beghina', at: 'right' },
        { type: 'chierichetto', at: 'right', delay: 900 },
      ],
    },
    {
      trigger: 700,
      spawns: [
        { type: 'sacrestano', at: 'right' },
        { type: 'chierichetto', at: 1080, y: 104 },
      ],
    },
    {
      trigger: 980,
      spawns: [
        { type: 'beghina', at: 'right' },
        { type: 'beghina', at: 'left', delay: 600 },
        { type: 'chierichetto', at: 'right', delay: 1400 },
      ],
      line: 'Pure dietro! Ma che è, una processione?',
    },
    {
      trigger: 1290,
      spawns: [
        { type: 'sacrestano', at: 'right' },
        { type: 'chierichetto', at: 'right', delay: 700 },
        { type: 'chierichetto', at: 1560, y: 110, delay: 300 },
      ],
    },
    {
      trigger: 1600,
      spawns: [
        { type: 'beghina', at: 'right' },
        { type: 'beghina', at: 'right', delay: 700 },
        { type: 'beghina', at: 'right', delay: 1400 },
      ],
      line: 'Le beghine col rosario... qui ci vuole la panzata!',
    },
    {
      trigger: 1880,
      spawns: [
        { type: 'sacrestano', at: 'right' },
        { type: 'chierichetto', at: 1880, y: 100 },
        { type: 'beghina', at: 'left', delay: 900 },
      ],
    },
    {
      trigger: 2200,
      spawns: [
        { type: 'chierichetto', at: 'right' },
        { type: 'chierichetto', at: 'right', delay: 500 },
        { type: 'beghina', at: 'left', delay: 800 },
        { type: 'beghina', at: 'right', delay: 1300 },
        { type: 'sacrestano', at: 'right', delay: 2000 },
      ],
    },
    {
      trigger: 2580,
      spawns: [
        { type: 'sacrestano', at: 'right' },
        { type: 'sacrestano', at: 'right', delay: 1500 },
        { type: 'chierichetto', at: 2820, y: 102 },
      ],
      line: "Che puzza d'incenso... peggio dei calzini di zio Gaetano!",
    },
    {
      trigger: 2880,
      spawns: [
        { type: 'beghina', at: 'right' },
        { type: 'chierichetto', at: 'right', delay: 400 },
        { type: 'chierichetto', at: 'left', delay: 800 },
        { type: 'sacrestano', at: 'right', delay: 1400 },
      ],
    },
  ] as WaveDef[],
};
