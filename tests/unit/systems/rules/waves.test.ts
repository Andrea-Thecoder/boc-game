import { describe, expect, it } from 'vitest';
import { WaveCursor, spawnX } from '../../../../src/systems/rules/waves';

const waves = [{ trigger: 100 }, { trigger: 300 }, { trigger: 300 }];

describe('WaveCursor', () => {
  it('advance_playerBeforeFirstTrigger_returnsNull', () => {
    // Arrange
    const cursor = new WaveCursor(waves);

    // Act
    const result = cursor.advance(99);

    // Assert
    expect(result).toBeNull();
  });

  it('advance_playerOnTrigger_returnsFirstWave', () => {
    // Arrange
    const cursor = new WaveCursor(waves);

    // Act
    const result = cursor.advance(100);

    // Assert
    expect(result).toEqual({ wave: waves[0], index: 0 });
  });

  it('advance_sameWaveTwice_startsItOnlyOnce', () => {
    // Arrange
    const cursor = new WaveCursor(waves);
    cursor.advance(150);

    // Act
    const result = cursor.advance(150);

    // Assert
    expect(result).toBeNull();
  });

  it('advance_playerPastSeveralTriggers_startsOneWavePerCall', () => {
    // Arrange
    const cursor = new WaveCursor(waves);

    // Act
    cursor.advance(500);

    // Assert
    expect(cursor.remaining).toBe(2);
  });

  it('skipAll_anyPosition_noWaveStartsAnymore', () => {
    // Arrange
    const cursor = new WaveCursor(waves);
    cursor.skipAll();

    // Act
    const result = cursor.advance(10_000);

    // Assert
    expect(result).toBeNull();
  });
});

describe('spawnX', () => {
  it.each([
    ['right' as const, 1000 + 320 + 14],
    ['left' as const, 1000 - 14],
    [1234, 1234],
  ])('spawnX_at_%s_returnsExpectedX', (at, expected) => {
    // Arrange: camera at 1000, view 320, margin 14

    // Act
    const result = spawnX(at, 1000, 320, 14);

    // Assert
    expect(result).toBe(expected);
  });
});
