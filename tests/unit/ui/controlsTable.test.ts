import { describe, expect, it } from 'vitest';
import type { ControlsDef, KeyName } from '../../../src/content/schemas';
import { controlsTable, keyLabel } from '../../../src/ui/controlsTable';

const keys = (patch: Partial<ControlsDef['keyboard']>): ControlsDef['keyboard'] => ({
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  up: ['UP'],
  down: ['DOWN'],
  jump: ['Z', 'SPACE'],
  fire: ['X'],
  panza: ['C'],
  pause: ['P'],
  mute: ['M'],
  menuUp: ['UP'],
  menuDown: ['DOWN'],
  menuLeft: ['LEFT'],
  menuRight: ['RIGHT'],
  confirm: ['ENTER'],
  back: ['ESC'],
  ...patch,
});

describe('controlsTable', () => {
  it('controlsTable_moveRowWithArrowsAndLetters_pairsThemColumnByColumn', () => {
    // Arrange
    const def: ControlsDef = { keyboard: keys({}), table: [{ label: 'MOVE', actions: ['left', 'right'] }] };

    // Act
    const rows = controlsTable(def);

    // Assert
    expect(rows).toEqual([{ label: 'MOVE', keys: 'ARROWS / A D' }]);
  });

  it('controlsTable_singleAction_listsItsKeysSeparatedBySlashes', () => {
    // Arrange
    const def: ControlsDef = { keyboard: keys({}), table: [{ label: 'JUMP', actions: ['jump'] }] };

    // Act
    const rows = controlsTable(def);

    // Assert
    expect(rows).toEqual([{ label: 'JUMP', keys: 'Z / SPACE' }]);
  });

  it('controlsTable_actionsWithDifferentKeyCounts_showsTheExtraKeysAlone', () => {
    // Arrange: left has 3 keys, right only 2
    const def: ControlsDef = {
      keyboard: keys({ left: ['LEFT', 'A', 'J'] }),
      table: [{ label: 'MOVE', actions: ['left', 'right'] }],
    };

    // Act
    const rows = controlsTable(def);

    // Assert
    expect(rows).toEqual([{ label: 'MOVE', keys: 'ARROWS / A D / J' }]);
  });

  it('controlsTable_keyChangedInTheBindings_tableFollows', () => {
    // Arrange: throw moved from X to Q
    const def: ControlsDef = { keyboard: keys({ fire: ['Q'] }), table: [{ label: 'THROW', actions: ['fire'] }] };

    // Act
    const rows = controlsTable(def);

    // Assert
    expect(rows).toEqual([{ label: 'THROW', keys: 'Q' }]);
  });
});

describe('keyLabel', () => {
  it.each<[KeyName, string]>([
    ['X', 'X'],
    ['ZERO', '0'],
    ['SEVEN', '7'],
    ['BACKSPACE', 'BKSP'],
    ['ESC', 'ESC'],
  ])('keyLabel_%s_returns%s', (key, expected) => {
    // Arrange: key from the table

    // Act
    const label = keyLabel(key);

    // Assert
    expect(label).toBe(expected);
  });
});
