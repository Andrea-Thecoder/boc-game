import { test as base } from '@playwright/test';
import { GameDriver } from './GameDriver';

interface Fixtures {
  /** errors printed in the browser console or thrown by the page during the test */
  consoleErrors: string[];
  /** game already opened on the title screen, with the deterministic clock */
  game: GameDriver;
}

export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await use(errors);
  },
  game: async ({ page, consoleErrors }, use) => {
    void consoleErrors; // listeners must be attached before the page loads
    const driver = new GameDriver(page);
    await driver.open();
    await use(driver);
  },
});

export { expect } from '@playwright/test';
