import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SettingsStore,
  VOLUME_MAX,
  clampVolume,
} from '../../../src/core/Settings';
import type { StorageLike } from '../../../src/core/storage';

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class BrokenStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

const storageWith = (raw: string) => {
  const storage = new MemoryStorage();
  storage.setItem(SETTINGS_STORAGE_KEY, raw);
  return storage;
};

describe('SettingsStore', () => {
  it('get_emptyStorage_returnsDefaults', () => {
    // Arrange
    const store = new SettingsStore(new MemoryStorage());

    // Act
    const settings = store.get();

    // Assert
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('get_noStorage_returnsDefaults', () => {
    // Arrange
    const store = new SettingsStore(null);

    // Act
    const settings = store.get();

    // Assert
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('get_savedSettings_returnsThem', () => {
    // Arrange
    const store = new SettingsStore(storageWith('{"musicVolume":3,"sfxVolume":7,"language":"it"}'));

    // Act
    const settings = store.get();

    // Assert
    expect(settings).toEqual({ musicVolume: 3, sfxVolume: 7, language: 'it' });
  });

  it.each([
    ['not JSON at all', 'garbage{'],
    ['a JSON array', '[1,2,3]'],
    ['null', 'null'],
  ])('get_storageHolds%s_returnsDefaults', (_case, raw) => {
    // Arrange
    const store = new SettingsStore(storageWith(raw));

    // Act
    const settings = store.get();

    // Assert
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('get_oneFieldCorrupted_resetsOnlyThatField', () => {
    // Arrange
    const store = new SettingsStore(storageWith('{"musicVolume":"loud","sfxVolume":4,"language":"klingon"}'));

    // Act
    const settings = store.get();

    // Assert
    expect(settings).toEqual({ musicVolume: VOLUME_MAX, sfxVolume: 4, language: 'it' });
  });

  it('update_newVolume_isSavedForTheNextSession', () => {
    // Arrange
    const storage = new MemoryStorage();
    new SettingsStore(storage).update({ musicVolume: 2 });

    // Act
    const reloaded = new SettingsStore(storage).get();

    // Assert
    expect(reloaded.musicVolume).toBe(2);
  });

  it('update_volumeOutOfRange_isClamped', () => {
    // Arrange
    const store = new SettingsStore(new MemoryStorage());

    // Act
    const settings = store.update({ musicVolume: 99, sfxVolume: -4 });

    // Assert
    expect([settings.musicVolume, settings.sfxVolume]).toEqual([VOLUME_MAX, 0]);
  });

  it('update_storageThrows_keepsTheValueForThisSession', () => {
    // Arrange
    const store = new SettingsStore(new BrokenStorage());

    // Act
    const settings = store.update({ sfxVolume: 5 });

    // Assert
    expect(settings.sfxVolume).toBe(5);
  });
});

describe('clampVolume', () => {
  it.each([
    [-1, 0],
    [0, 0],
    [4.6, 5],
    [VOLUME_MAX, VOLUME_MAX],
    [VOLUME_MAX + 3, VOLUME_MAX],
  ])('clampVolume_%s_returns%s', (input, expected) => {
    // Arrange: input from the table

    // Act
    const result = clampVolume(input);

    // Assert
    expect(result).toBe(expected);
  });
});
