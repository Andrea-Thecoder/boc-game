/**
 * Object pool: reuses objects instead of creating and destroying them every frame
 * (juice boxes, enemy bullets, popups). Framework-agnostic: what "activate" and "deactivate"
 * mean for a Phaser object is decided by the `onAcquire` / `onRelease` callbacks.
 *
 * ```ts
 * const bricks = new Pool({
 *   create: () => new Sukkino(scene),
 *   onAcquire: (s) => s.setActive(true).setVisible(true),
 *   onRelease: (s) => s.setActive(false).setVisible(false),
 *   max: 60,
 * });
 * const brick = bricks.acquire(); // undefined if 60 are already in flight
 * bricks.release(brick);
 * ```
 */
export interface PoolOptions<T> {
  create: () => T;
  /** Called every time an item leaves the pool: reset and activate it here. */
  onAcquire?: (item: T) => void;
  /** Called every time an item goes back to the pool (and on prewarmed items): deactivate it here. */
  onRelease?: (item: T) => void;
  /** Maximum number of items in use at the same time. Beyond it `acquire` returns undefined. */
  max?: number;
  /** Items created up front, to avoid allocations during the first seconds of play. */
  prewarm?: number;
}

export class Pool<T> {
  private readonly free: T[] = [];
  private readonly used = new Set<T>();
  private createdCount = 0;
  private readonly max: number;

  constructor(private readonly options: PoolOptions<T>) {
    this.max = options.max ?? Infinity;
    const prewarm = Math.min(options.prewarm ?? 0, this.max);
    for (let i = 0; i < prewarm; i++) {
      const item = this.createItem();
      this.options.onRelease?.(item);
      this.free.push(item);
    }
  }

  /** Takes a free item (or creates one). Returns undefined when `max` items are already in use. */
  acquire(): T | undefined {
    if (this.used.size >= this.max) return undefined;
    const item = this.free.pop() ?? this.createItem();
    this.used.add(item);
    this.options.onAcquire?.(item);
    return item;
  }

  /** Gives an item back. Returns false (and does nothing) if it is not currently in use from this pool. */
  release(item: T): boolean {
    if (!this.used.delete(item)) return false;
    this.options.onRelease?.(item);
    this.free.push(item);
    return true;
  }

  /** Gives back every item in use (e.g. when the level restarts). */
  releaseAll(): void {
    for (const item of [...this.used]) this.release(item);
  }

  /** Calls `fn` on every item currently in use. */
  forEachInUse(fn: (item: T) => void): void {
    for (const item of [...this.used]) fn(item);
  }

  get inUse(): number {
    return this.used.size;
  }

  get available(): number {
    return this.free.length;
  }

  /** Total items ever created by this pool. */
  get created(): number {
    return this.createdCount;
  }

  private createItem(): T {
    this.createdCount++;
    return this.options.create();
  }
}
