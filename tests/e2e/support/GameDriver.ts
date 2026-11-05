import type { Page } from '@playwright/test';
import type { TestState } from '../../../src/debug/testHooks';

/** Frames to wait for the boss intro dialogue before he starts fighting. */
const BOSS_INTRO_FRAMES = 420;

/**
 * Drives the game through the `window.__boc` test API with a deterministic, frame-by-frame clock.
 * Tests talk only to this class: if the game's internals change, only the API/driver needs updating.
 */
export class GameDriver {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/?e2e');
    await this.page.waitForFunction(() => window.__boc?.ready() === true);
    await this.page.evaluate(() => window.__boc!.freeze(1));
  }

  step(frames: number): Promise<TestState> {
    return this.page.evaluate((n) => window.__boc!.step(n), frames);
  }

  state(): Promise<TestState> {
    return this.page.evaluate(() => window.__boc!.state());
  }

  /** Holds a key for N frames, as a real player would. */
  async hold(key: string, frames: number): Promise<TestState> {
    await this.page.keyboard.down(key);
    await this.step(frames);
    await this.page.keyboard.up(key);
    return this.step(1);
  }

  tap(key: string): Promise<TestState> {
    return this.hold(key, 2);
  }

  /** Advances in chunks until the predicate holds or the frame budget runs out. */
  async runUntil(predicate: (s: TestState) => boolean, maxFrames: number, chunk = 30): Promise<TestState> {
    let s = await this.state();
    for (let used = 0; used < maxFrames && !predicate(s); used += chunk) s = await this.step(chunk);
    return s;
  }

  /** From the title screen into level 1. */
  async startGame(): Promise<TestState> {
    await this.tap('a'); // first key unlocks audio
    await this.step(30);
    await this.tap('Enter');
    return this.runUntil((s) => s.scenes.includes('game'), 120);
  }

  /** Walks into the boss arena (skipping the level) with infinite health. */
  async enterBossArena(): Promise<TestState> {
    await this.startGame();
    await this.page.evaluate(() => {
      window.__boc!.godMode();
      window.__boc!.skipToBossArena();
    });
    await this.page.keyboard.down('ArrowRight');
    const s = await this.runUntil((st) => st.bossHp >= 0, 600);
    await this.page.keyboard.up('ArrowRight');
    return s;
  }

  /** Enters the arena and throws juice boxes until the victory screen. */
  async defeatBoss(): Promise<TestState> {
    await this.enterBossArena();
    await this.step(BOSS_INTRO_FRAMES);
    await this.page.keyboard.down('x');
    const s = await this.runUntil((st) => st.scenes.includes('victory'), 12000, 60);
    await this.page.keyboard.up('x');
    return s;
  }

  async killPlayer(): Promise<TestState> {
    await this.page.evaluate(() => window.__boc!.killPlayer());
    return this.runUntil((s) => s.scenes.includes('gameover'), 400);
  }
}
