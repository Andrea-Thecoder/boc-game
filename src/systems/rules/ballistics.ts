/** Ballistics, pure (no Phaser). */

/** Enemy lobs are capped so they stay dodgeable. */
export const LOB_LIMITS = { maxVx: 220, minVy: -320, maxVy: 200 } as const;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Aimed lob: launch velocity [vx, vy] (px/s) to go from (x, y) to (tx, ty) in `t` seconds under gravity `g` (px/s²).
 * Clamped to LOB_LIMITS, so a far target is reached later or not at all, like a real throw.
 */
export function lob(x: number, y: number, tx: number, ty: number, t: number, g: number): [number, number] {
  const vx = clamp((tx - x) / t, -LOB_LIMITS.maxVx, LOB_LIMITS.maxVx);
  const vy = (ty - y - 0.5 * g * t * t) / t;
  return [vx, clamp(vy, LOB_LIMITS.minVy, LOB_LIMITS.maxVy)];
}
