import { describe, expect, it } from 'vitest';
import controlsJson from '../../../src/content/data/controls.json';
import { GAME_ACTIONS, MENU_ACTIONS, controlsSchema, duplicateKeys } from '../../../src/content/schemas';

const withKeys = (patch: Record<string, string[]>) => ({
  ...controlsJson,
  keyboard: { ...controlsJson.keyboard, ...patch },
});

describe('controlsSchema', () => {
  it('controlsSchema_realFile_isValid', () => {
    // Arrange: src/content/data/controls.json

    // Act
    const result = controlsSchema.safeParse(controlsJson);

    // Assert
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('controlsSchema_sameKeyForTwoGameActions_isRejectedNamingKeyAndActions', () => {
    // Arrange: X both throws and jumps (both set here, so the test does not depend on the real bindings)
    const controls = withKeys({ jump: ['X'], fire: ['X'] });

    // Act
    const result = controlsSchema.safeParse(controls);

    // Assert
    expect(result.error?.issues.map((i) => i.message)).toEqual(['tasto usato per due azioni: X -> jump, fire']);
  });

  it('controlsSchema_menuReusesAGameKey_isAccepted', () => {
    // Arrange: Z jumps in game and confirms in menus (different groups)
    const controls = withKeys({ jump: ['Z'], confirm: ['Z'] });

    // Act
    const result = controlsSchema.safeParse(controls);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([
    ['an unknown key name', { fire: ['F13'] }],
    ['a lowercase key name', { fire: ['x'] }],
    ['an action with no keys', { fire: [] }],
  ])('controlsSchema_%s_isRejected', (_case, patch) => {
    // Arrange
    const controls = withKeys(patch);

    // Act
    const result = controlsSchema.safeParse(controls);

    // Assert
    expect(result.success).toBe(false);
  });

  it('controlsSchema_tableShowsAMenuAction_isRejected', () => {
    // Arrange
    const controls = { ...controlsJson, table: [{ label: 'OK', actions: ['confirm'] }] };

    // Act
    const result = controlsSchema.safeParse(controls);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('duplicateKeys', () => {
  it('duplicateKeys_sameKeyTwiceInOneAction_isNotAClash', () => {
    // Arrange
    const bindings = { jump: ['Z', 'Z'], fire: ['X'] };

    // Act
    const clashes = duplicateKeys(bindings, GAME_ACTIONS);

    // Assert
    expect(clashes).toEqual([]);
  });

  it('duplicateKeys_actionsOfAnotherGroup_areIgnored', () => {
    // Arrange: ESC pauses the game and goes back in menus
    const bindings = { pause: ['ESC'], back: ['ESC'] };

    // Act
    const clashes = duplicateKeys(bindings, MENU_ACTIONS);

    // Assert
    expect(clashes).toEqual([]);
  });
});
