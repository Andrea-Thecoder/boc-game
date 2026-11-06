/**
 * Wave rules, pure (no Phaser).
 */

/** Walks through the level waves in order as Paolone advances. */
export class WaveCursor<W extends { trigger: number }> {
  private index = 0;

  constructor(private readonly waves: readonly W[]) {}

  /**
   * Returns the next wave if Paolone has reached its trigger, and moves past it.
   * At most one wave per call (one per frame), like the original game loop.
   */
  advance(playerX: number): { wave: W; index: number } | null {
    const wave = this.waves[this.index];
    if (!wave || playerX < wave.trigger) return null;
    return { wave, index: this.index++ };
  }

  /** Marks every wave as already played (debug / tests). */
  skipAll(): void {
    this.index = this.waves.length;
  }

  get remaining(): number {
    return this.waves.length - this.index;
  }
}

/** Where a spawn appears: just outside the left/right screen edge, or at an absolute x. */
export function spawnX(at: 'left' | 'right' | number, scrollX: number, viewWidth: number, margin: number): number {
  if (at === 'right') return scrollX + viewWidth + margin;
  if (at === 'left') return scrollX - margin;
  return at;
}
