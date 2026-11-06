import { describe, expect, it } from 'vitest';
import { LOB_LIMITS, lob } from '../../../../src/systems/rules/ballistics';

/** Where a projectile is after `t` seconds, with gravity `g`. */
const positionAt = (x: number, y: number, [vx, vy]: [number, number], t: number, g: number) => ({
  x: x + vx * t,
  y: y + vy * t + 0.5 * g * t * t,
});

describe('lob', () => {
  it('lob_reachableTarget_landsOnTargetAfterFlightTime', () => {
    // Arrange
    const from = { x: 100, y: 140 };
    const target = { x: 180, y: 150 };
    const t = 0.85;
    const g = 300;

    // Act
    const velocity = lob(from.x, from.y, target.x, target.y, t, g);

    // Assert
    const landing = positionAt(from.x, from.y, velocity, t, g);
    expect(landing.x).toBeCloseTo(180, 6);
    expect(landing.y).toBeCloseTo(150, 6);
  });

  it('lob_farTarget_horizontalSpeedIsCapped', () => {
    // Arrange: 1000 px in 0.5 s would need 2000 px/s

    // Act
    const [vx] = lob(0, 0, 1000, 0, 0.5, 300);

    // Assert
    expect(vx).toBe(LOB_LIMITS.maxVx);
  });

  it('lob_targetBehind_throwsBackwards', () => {
    // Arrange: target on the left

    // Act
    const [vx] = lob(200, 0, 100, 0, 1, 300);

    // Assert
    expect(vx).toBe(-100);
  });

  it('lob_targetFarBelow_verticalSpeedIsCapped', () => {
    // Arrange: straight down a long way in a short time

    // Act
    const [, vy] = lob(0, 0, 0, 900, 0.5, 300);

    // Assert
    expect(vy).toBe(LOB_LIMITS.maxVy);
  });
});
