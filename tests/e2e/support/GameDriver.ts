import type { Page } from '@playwright/test';
import controls from '../../../src/content/data/controls.json' with { type: 'json' };
import type { InputAction } from '../../../src/content/schemas';
import type { TestState } from '../../../src/debug/testHooks';

const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
const SPECIAL_KEYS: Record<string, string> = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  SPACE: 'Space',
  ENTER: 'Enter',
  ESC: 'Escape',
  BACKSPACE: 'Backspace',
  TAB: 'Tab',
  SHIFT: 'Shift',
  CTRL: 'Control',
  ALT: 'Alt',
};

/**
 * The Playwright key for an action: the first key bound to it in src/content/data/controls.json.
 * Tests press actions ("fire"), never keys ("x"), so changing the bindings never breaks them.
 */
export function keyFor(action: InputAction): string {
  const name = controls.keyboard[action][0];
  const digit = DIGITS.indexOf(name);
  if (digit >= 0) return `Digit${digit}`;
  return SPECIAL_KEYS[name] ?? `Key${name}`;
}

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

  /** Opens the game with the "work of fiction" notice enabled (normally skipped in e2e runs). */
  async openWithDisclaimer(): Promise<void> {
    await this.page.goto('/?e2e&disclaimer');
    await this.page.waitForFunction(() => window.__boc?.ready() === true);
    await this.page.evaluate(() => window.__boc!.freeze(1));
  }

  /** Title → NEW GAME → the notice shown before the level. */
  async newGameUntilDisclaimer(): Promise<TestState> {
    await this.unlockAudio();
    await this.tap('confirm');
    return this.runUntil((s) => s.scenes.includes('disclaimer'), 60, 5);
  }

  /** Presses a key bound to nothing (F2 can never be bound in controls.json): "press any key". */
  async pressAnyKey(): Promise<TestState> {
    await this.page.keyboard.down('F2');
    await this.step(2);
    await this.page.keyboard.up('F2');
    return this.step(1);
  }

  step(frames: number): Promise<TestState> {
    return this.page.evaluate((n) => window.__boc!.step(n), frames);
  }

  state(): Promise<TestState> {
    return this.page.evaluate(() => window.__boc!.state());
  }

  /** Holds the key of an action for N frames, as a real player would. */
  async hold(action: InputAction, frames: number): Promise<TestState> {
    await this.press(action);
    await this.step(frames);
    await this.release(action);
    return this.step(1);
  }

  tap(action: InputAction): Promise<TestState> {
    return this.hold(action, 2);
  }

  /** Keeps the key of an action down until `release()`. */
  press(action: InputAction): Promise<void> {
    return this.page.keyboard.down(keyFor(action));
  }

  release(action: InputAction): Promise<void> {
    return this.page.keyboard.up(keyFor(action));
  }

  /** Advances in chunks until the predicate holds or the frame budget runs out. */
  async runUntil(predicate: (s: TestState) => boolean, maxFrames: number, chunk = 30): Promise<TestState> {
    let s = await this.state();
    for (let used = 0; used < maxFrames && !predicate(s); used += chunk) s = await this.step(chunk);
    return s;
  }

  /** The first key press turns the audio on and shows the main menu. */
  async unlockAudio(): Promise<TestState> {
    await this.pressAnyKey();
    return this.step(30);
  }

  /** From the title screen into level 1 (NEW GAME is the item selected by default). */
  async startGame(): Promise<TestState> {
    await this.unlockAudio();
    await this.tap('confirm');
    return this.runUntil((s) => s.scenes.includes('game'), 120);
  }

  /** Walks into the boss arena (skipping the level) with infinite health. */
  async enterBossArena(): Promise<TestState> {
    await this.startGame();
    await this.page.evaluate(() => {
      window.__boc!.godMode();
      window.__boc!.skipToBossArena();
    });
    await this.press('right');
    const s = await this.runUntil((st) => st.bossHp >= 0, 600);
    await this.release('right');
    return s;
  }

  /** Enters the arena and throws juice boxes until the victory screen. */
  async defeatBoss(): Promise<TestState> {
    await this.enterBossArena();
    await this.step(BOSS_INTRO_FRAMES);
    await this.press('fire');
    const s = await this.runUntil((st) => st.scenes.includes('victory'), 12000, 60);
    await this.release('fire');
    return s;
  }

  /** Main menu → OPTIONS (one step down: the locked LOAD GAME is skipped). */
  async openOptions(): Promise<TestState> {
    await this.unlockAudio();
    await this.tap('menuDown');
    await this.tap('confirm');
    return this.runUntil((s) => s.scenes.includes('options'), 30, 5);
  }

  /** Settings saved in this browser by the options menu (null if never saved). */
  savedSettings(): Promise<unknown> {
    return this.page.evaluate(() => {
      const raw = localStorage.getItem('boc.settings');
      return raw ? (JSON.parse(raw) as unknown) : null;
    });
  }

  async killPlayer(): Promise<TestState> {
    await this.page.evaluate(() => window.__boc!.killPlayer());
    return this.runUntil((s) => s.scenes.includes('gameover'), 400);
  }
}
