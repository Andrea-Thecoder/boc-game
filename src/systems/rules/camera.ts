/**
 * Camera rules, pure functions (no Phaser): the camera only moves forward, Metal Slug style.
 */
export interface CameraRules {
  viewWidth: number;
  /** fraction of the view width kept between the left edge and Paolone */
  lead: number;
  /** fraction of the remaining distance covered per frame (0..1) */
  smoothing: number;
  /** the camera never scrolls past this x */
  maxScroll: number;
}

/** Next horizontal scroll: eases towards Paolone, never goes back, never passes `maxScroll`. */
export function forwardScroll(current: number, playerX: number, r: CameraRules): number {
  const target = playerX - r.viewWidth * r.lead;
  if (target <= current) return current;
  return Math.min(r.maxScroll, current + (target - current) * r.smoothing);
}

export interface BoundsRules {
  viewWidth: number;
  margin: number;
  levelWidth: number;
  arenaX: number;
}

/** Horizontal range Paolone may occupy: behind him is the screen edge, ahead the level end or the locked arena. */
export function playerBounds(scrollX: number, arenaLocked: boolean, r: BoundsRules): { minX: number; maxX: number } {
  return {
    minX: scrollX + r.margin,
    maxX: arenaLocked ? r.arenaX + r.viewWidth - r.margin : r.levelWidth - r.margin,
  };
}
