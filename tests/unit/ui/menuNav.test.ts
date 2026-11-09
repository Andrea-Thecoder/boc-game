import { describe, expect, it } from 'vitest';
import { firstEnabled, nextEnabled } from '../../../src/ui/menuNav';

describe('firstEnabled', () => {
  it.each([
    [[true, true, true], 0],
    [[false, true, true], 1],
    [[false, false, false], -1],
    [[], -1],
  ])('firstEnabled_%j_returns%s', (enabled, expected) => {
    // Arrange: enabled flags from the table

    // Act
    const index = firstEnabled(enabled);

    // Assert
    expect(index).toBe(expected);
  });
});

describe('nextEnabled', () => {
  // NEW GAME, LOAD GAME (disabled), OPTIONS
  const mainMenu = [true, false, true];

  it.each([
    ['down from the first item skips the disabled one', 0, 1, 2],
    ['up from the last item skips the disabled one', 2, -1, 0],
    ['down from the last item wraps to the first', 2, 1, 0],
    ['up from the first item wraps to the last', 0, -1, 2],
  ] as const)('nextEnabled_%s', (_case, from, dir, expected) => {
    // Arrange: main menu with LOAD GAME disabled

    // Act
    const index = nextEnabled(mainMenu, from, dir);

    // Assert
    expect(index).toBe(expected);
  });

  it('nextEnabled_onlyOneItemEnabled_staysPut', () => {
    // Arrange
    const enabled = [false, true, false];

    // Act
    const index = nextEnabled(enabled, 1, 1);

    // Assert
    expect(index).toBe(1);
  });
});
