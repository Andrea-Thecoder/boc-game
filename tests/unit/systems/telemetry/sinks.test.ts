import { describe, expect, it } from 'vitest';
import { RunRecorder, type RunSummary } from '../../../../src/systems/telemetry/RunRecorder';
import { LocalStorageSink, RUNS_STORAGE_KEY, type StorageLike } from '../../../../src/systems/telemetry/sinks';

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class FullStorage extends MemoryStorage {
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

const summary = (runId: string): RunSummary =>
  new RunRecorder({ runId, gameVersion: '0.1.0', level: 'level1', startedAt: 0 }).finish('victory', 100, 1000);

describe('LocalStorageSink', () => {
  it('record_emptyStorage_storesTheRun', () => {
    // Arrange
    const sink = new LocalStorageSink(new MemoryStorage());

    // Act
    sink.record(summary('a'));

    // Assert
    expect(sink.history().map((r) => r.runId)).toEqual(['a']);
  });

  it('record_overTheLimit_keepsOnlyTheMostRecent', () => {
    // Arrange
    const sink = new LocalStorageSink(new MemoryStorage(), 2);
    sink.record(summary('a'));
    sink.record(summary('b'));

    // Act
    sink.record(summary('c'));

    // Assert
    expect(sink.history().map((r) => r.runId)).toEqual(['b', 'c']);
  });

  it('record_storageFull_doesNotThrow', () => {
    // Arrange
    const sink = new LocalStorageSink(new FullStorage());

    // Act
    const act = () => sink.record(summary('a'));

    // Assert
    expect(act).not.toThrow();
  });

  it('record_noStorageAvailable_doesNotThrow', () => {
    // Arrange
    const sink = new LocalStorageSink(null);

    // Act
    const act = () => sink.record(summary('a'));

    // Assert
    expect(act).not.toThrow();
  });

  it('history_corruptedData_returnsEmptyList', () => {
    // Arrange
    const storage = new MemoryStorage();
    storage.setItem(RUNS_STORAGE_KEY, '{non è json');
    const sink = new LocalStorageSink(storage);

    // Act
    const runs = sink.history();

    // Assert
    expect(runs).toEqual([]);
  });

  it('record_afterCorruptedData_startsAFreshHistory', () => {
    // Arrange
    const storage = new MemoryStorage();
    storage.setItem(RUNS_STORAGE_KEY, '"non una lista"');
    const sink = new LocalStorageSink(storage);

    // Act
    sink.record(summary('a'));

    // Assert
    expect(sink.history().map((r) => r.runId)).toEqual(['a']);
  });
});
