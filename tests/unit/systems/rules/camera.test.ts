import { describe, expect, it } from 'vitest';
import { forwardScroll, playerBounds, type BoundsRules, type CameraRules } from '../../../../src/systems/rules/camera';

const cam: CameraRules = { viewWidth: 320, lead: 0.5, smoothing: 0.5, maxScroll: 1000 };
const bounds: BoundsRules = { viewWidth: 320, margin: 10, levelWidth: 2000, arenaX: 1680 };

describe('forwardScroll', () => {
  it('forwardScroll_playerAheadOfLead_movesHalfTheDistance', () => {
    // Arrange: target = 400 - 160 = 240, current 100 → halfway is 170

    // Act
    const result = forwardScroll(100, 400, cam);

    // Assert
    expect(result).toBe(170);
  });

  it('forwardScroll_playerBehindLead_neverScrollsBack', () => {
    // Arrange: target = 150 - 160 = -10, behind the current scroll

    // Act
    const result = forwardScroll(100, 150, cam);

    // Assert
    expect(result).toBe(100);
  });

  it('forwardScroll_targetBeyondMax_stopsAtMax', () => {
    // Arrange: target = 3000 - 160 = 2840, far past maxScroll

    // Act
    const result = forwardScroll(990, 3000, cam);

    // Assert
    expect(result).toBe(1000);
  });
});

describe('playerBounds', () => {
  it('playerBounds_anyScroll_leftLimitIsScreenEdgePlusMargin', () => {
    // Arrange: nothing to prepare

    // Act
    const result = playerBounds(500, false, bounds);

    // Assert
    expect(result.minX).toBe(510);
  });

  it('playerBounds_arenaOpen_rightLimitIsLevelEnd', () => {
    // Arrange: nothing to prepare

    // Act
    const result = playerBounds(500, false, bounds);

    // Assert
    expect(result.maxX).toBe(1990);
  });

  it('playerBounds_arenaLocked_rightLimitIsArenaEdge', () => {
    // Arrange: nothing to prepare

    // Act
    const result = playerBounds(1680, true, bounds);

    // Assert
    expect(result.maxX).toBe(1990);
  });
});
