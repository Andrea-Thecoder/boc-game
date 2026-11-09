import { describe, expect, it, vi } from 'vitest';
import { Pool } from '../../../src/core/Pool';

/** Stand-in for a game object: just an id and an active flag. */
interface FakeBrick {
  id: number;
  active: boolean;
}

const brickPool = (options: { max?: number; prewarm?: number } = {}) => {
  let nextId = 0;
  return new Pool<FakeBrick>({
    create: () => ({ id: nextId++, active: false }),
    onAcquire: (b) => (b.active = true),
    onRelease: (b) => (b.active = false),
    ...options,
  });
};

describe('Pool', () => {
  it('acquire_emptyPool_createsNewItem', () => {
    // Arrange
    const pool = brickPool();

    // Act
    pool.acquire();

    // Assert
    expect(pool.created).toBe(1);
  });

  it('acquire_afterRelease_reusesSameItem', () => {
    // Arrange
    const pool = brickPool();
    const first = pool.acquire()!;
    pool.release(first);

    // Act
    const second = pool.acquire();

    // Assert
    expect(second).toBe(first);
  });

  it('acquire_freeItem_runsOnAcquire', () => {
    // Arrange
    const pool = brickPool();

    // Act
    const brick = pool.acquire()!;

    // Assert
    expect(brick.active).toBe(true);
  });

  it('release_itemInUse_runsOnRelease', () => {
    // Arrange
    const pool = brickPool();
    const brick = pool.acquire()!;

    // Act
    pool.release(brick);

    // Assert
    expect(brick.active).toBe(false);
  });

  it('release_itemAlreadyReleased_returnsFalse', () => {
    // Arrange
    const pool = brickPool();
    const brick = pool.acquire()!;
    pool.release(brick);

    // Act
    const result = pool.release(brick);

    // Assert
    expect(result).toBe(false);
  });

  it('release_itemNotFromPool_returnsFalse', () => {
    // Arrange
    const pool = brickPool();

    // Act
    const result = pool.release({ id: 99, active: true });

    // Assert
    expect(result).toBe(false);
  });

  it('release_itemAlreadyReleased_isNotDuplicatedInFreeList', () => {
    // Arrange
    const pool = brickPool();
    const brick = pool.acquire()!;
    pool.release(brick);

    // Act
    pool.release(brick);

    // Assert
    expect(pool.available).toBe(1);
  });

  it('acquire_maxReached_returnsUndefined', () => {
    // Arrange
    const pool = brickPool({ max: 2 });
    pool.acquire();
    pool.acquire();

    // Act
    const result = pool.acquire();

    // Assert
    expect(result).toBeUndefined();
  });

  it('acquire_maxReachedThenOneReleased_returnsItem', () => {
    // Arrange
    const pool = brickPool({ max: 1 });
    const brick = pool.acquire()!;
    pool.release(brick);

    // Act
    const result = pool.acquire();

    // Assert
    expect(result).toBe(brick);
  });

  it('constructor_prewarm_itemsAreAvailable', () => {
    // Arrange: nothing to prepare

    // Act
    const pool = brickPool({ prewarm: 3 });

    // Assert
    expect(pool.available).toBe(3);
  });

  it('constructor_prewarmAboveMax_createsOnlyMax', () => {
    // Arrange: nothing to prepare

    // Act
    const pool = brickPool({ prewarm: 10, max: 4 });

    // Assert
    expect(pool.created).toBe(4);
  });

  it('constructor_prewarm_runsOnReleaseOnCreatedItems', () => {
    // Arrange
    const onRelease = vi.fn();

    // Act
    new Pool({ create: () => ({}), onRelease, prewarm: 2 });

    // Assert
    expect(onRelease).toHaveBeenCalledTimes(2);
  });

  it('acquire_prewarmedPool_doesNotCreateNewItems', () => {
    // Arrange
    const pool = brickPool({ prewarm: 2 });

    // Act
    pool.acquire();

    // Assert
    expect(pool.created).toBe(2);
  });

  it('inUse_afterAcquires_countsThem', () => {
    // Arrange
    const pool = brickPool();

    // Act
    pool.acquire();
    pool.acquire();

    // Assert
    expect(pool.inUse).toBe(2);
  });

  it('releaseAll_itemsInUse_noneLeftInUse', () => {
    // Arrange
    const pool = brickPool();
    pool.acquire();
    pool.acquire();

    // Act
    pool.releaseAll();

    // Assert
    expect(pool.inUse).toBe(0);
  });

  it('forEachInUse_itemsInUse_visitsOnlyThose', () => {
    // Arrange
    const pool = brickPool();
    const kept = pool.acquire()!;
    pool.release(pool.acquire()!);
    const visited: FakeBrick[] = [];

    // Act
    pool.forEachInUse((b) => visited.push(b));

    // Assert
    expect(visited).toEqual([kept]);
  });
});
