/** Random helpers. They use Math.random, so the e2e test clock (seeded RNG) keeps them deterministic. */

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Uniform random value in [min, max]. */
export function roll([min, max]: readonly [number, number]): number {
  return min + Math.random() * (max - min);
}
