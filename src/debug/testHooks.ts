import type Phaser from 'phaser';
import type GameScene from '../scenes/GameScene';

/** Snapshot of the observable game state, independent from internal class layout. */
export interface TestState {
  /** keys of the active scenes, e.g. ['game', 'hud'] */
  scenes: string[];
  score: number;
  hp: number;
  /** boss health 0..1, -1 when there is no boss */
  bossHp: number;
  /** player x in world pixels, -1 outside the level */
  playerX: number;
}

/**
 * Stable test API exposed as `window.__boc` with `?e2e` or `?debug`.
 * It is the contract the e2e tests depend on: refactors must keep it working, not the tests.
 */
export interface BocTestApi {
  /** true once the title screen is up */
  ready(): boolean;
  /** stops the real loop: from now on time moves only through step(); clock and RNG become deterministic */
  freeze(seed?: number): void;
  /** advances the simulation by N frames of 1/60 s, then returns the resulting state */
  step(frames: number): TestState;
  state(): TestState;
  godMode(): void;
  skipToBossArena(): void;
  killPlayer(): void;
}

declare global {
  interface Window {
    __boc?: BocTestApi;
  }
}

const FRAME_MS = 1000 / 60;

/** Mulberry32: tiny seeded RNG so enemy AI behaves the same on every run. */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function installTestHooks(game: Phaser.Game) {
  let time = performance.now();
  let fakeNow = Date.now();
  const gameScene = () => game.scene.getScene('game') as GameScene;
  const inLevel = () => game.scene.isActive('game');

  const state = (): TestState => {
    const r = game.registry;
    return {
      scenes: game.scene.getScenes(true).map((s) => s.sys.settings.key),
      score: (r.get('score') as number | undefined) ?? 0,
      hp: (r.get('hp') as number | undefined) ?? 0,
      bossHp: (r.get('bossHp') as number | undefined) ?? -1,
      playerX: inLevel() ? gameScene().player.x : -1,
    };
  };

  const step = (frames: number) => {
    for (let i = 0; i < frames; i++) {
      time += FRAME_MS;
      fakeNow += FRAME_MS;
      game.step(time, FRAME_MS);
    }
    return state();
  };

  window.__boc = {
    ready: () => game.scene.isActive('title'),
    freeze(seed = 1) {
      game.loop.sleep();
      // Phaser tweens read Date.now(): drive it with the simulated clock
      Date.now = () => fakeNow;
      Math.random = seeded(seed);
    },
    step,
    state,
    godMode: () => gameScene().debugGodMode(),
    skipToBossArena: () => gameScene().debugSkipToBossArena(),
    killPlayer: () => gameScene().debugKillPlayer(),
  };
}
