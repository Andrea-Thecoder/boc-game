/*
 * Pure menu navigation rules (no Phaser): unit tested.
 */

/** Index of the first enabled item, or -1 when none is. */
export function firstEnabled(enabled: readonly boolean[]): number {
  return enabled.indexOf(true);
}

/**
 * Moves the cursor by one step in `dir`, wrapping around and skipping disabled items.
 * Stays where it is when no other item is enabled.
 */
export function nextEnabled(enabled: readonly boolean[], from: number, dir: 1 | -1): number {
  const n = enabled.length;
  for (let i = 1; i <= n; i++) {
    const candidate = (((from + dir * i) % n) + n) % n;
    if (enabled[candidate]) return candidate;
  }
  return from;
}
