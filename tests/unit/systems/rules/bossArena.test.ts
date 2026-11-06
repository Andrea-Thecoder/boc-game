import { describe, expect, it } from 'vitest';
import { shouldLockArena } from '../../../../src/systems/rules/bossArena';

const ARENA_X = 3200;
const OFFSET = 70;

describe('shouldLockArena', () => {
  it('shouldLockArena_cameraNotYetAtArena_returnsFalse', () => {
    // Arrange: Paolone is inside, but the camera is still easing in

    // Act
    const result = shouldLockArena(3150, 3300, ARENA_X, OFFSET);

    // Assert
    expect(result).toBe(false);
  });

  it('shouldLockArena_playerNotDeepEnough_returnsFalse', () => {
    // Arrange: camera arrived, Paolone exactly on the trigger line

    // Act
    const result = shouldLockArena(3200, 3270, ARENA_X, OFFSET);

    // Assert
    expect(result).toBe(false);
  });

  it('shouldLockArena_cameraArrivedAndPlayerInside_returnsTrue', () => {
    // Arrange: camera within 1px of the arena (it eases in), Paolone past the line

    // Act
    const result = shouldLockArena(3199, 3271, ARENA_X, OFFSET);

    // Assert
    expect(result).toBe(true);
  });
});
