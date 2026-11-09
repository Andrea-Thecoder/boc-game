import { afterEach, describe, expect, it, vi } from 'vitest';
import { pick, roll } from '../../../src/core/random';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pick', () => {
  it('pick_singleElementList_returnsThatElement', () => {
    // Arrange
    const list = ['tamarindo'] as const;

    // Act
    const result = pick(list);

    // Assert
    expect(result).toBe('tamarindo');
  });

  it('pick_randomNearOne_returnsLastElement', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0.999);

    // Act
    const result = pick(['pera', 'ace', 'pesca']);

    // Assert
    expect(result).toBe('pesca');
  });
});

describe('roll', () => {
  it('roll_randomZero_returnsMin', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Act
    const result = roll([900, 1800]);

    // Assert
    expect(result).toBe(900);
  });

  it('roll_randomHalf_returnsMidpoint', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Act
    const result = roll([1600, 2500]);

    // Assert
    expect(result).toBe(2050);
  });

  it('roll_equalBounds_returnsThatValue', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0.73);

    // Act
    const result = roll([300, 300]);

    // Assert
    expect(result).toBe(300);
  });
});
