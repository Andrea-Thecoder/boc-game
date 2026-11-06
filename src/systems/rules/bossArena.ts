/** Boss arena rules, pure (no Phaser). */

/** The arena locks once the camera has reached it and Paolone has walked `triggerOffset` px inside. */
export function shouldLockArena(scrollX: number, playerX: number, arenaX: number, triggerOffset: number): boolean {
  return scrollX >= arenaX - 1 && playerX > arenaX + triggerOffset;
}
