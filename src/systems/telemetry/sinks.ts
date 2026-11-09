import type { RunSummary } from './RunRecorder';

/**
 * Where run summaries go. Today: the browser's localStorage. Tomorrow (fase 6): an HttpSink that posts
 * to the backend and falls back to local storage when offline. The game only knows this interface.
 */
export interface TelemetrySink {
  /** Must never throw: telemetry can fail, the game must not. */
  record(summary: RunSummary): void;
}

/** The subset of the Web Storage API we use (makes the sink testable without a browser). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const RUNS_STORAGE_KEY = 'boc.runs';

/** Keeps the last `keep` run summaries in local storage, oldest first. */
export class LocalStorageSink implements TelemetrySink {
  constructor(
    private readonly storage: StorageLike | null,
    private readonly keep = 50,
    private readonly key = RUNS_STORAGE_KEY,
  ) {}

  record(summary: RunSummary): void {
    if (!this.storage) return;
    try {
      const runs = [...this.history(), summary].slice(-this.keep);
      this.storage.setItem(this.key, JSON.stringify(runs));
    } catch {
      // storage full, disabled or in private mode: drop the record, keep playing
    }
  }

  /** Stored summaries, oldest first. Corrupted data counts as empty. */
  history(): RunSummary[] {
    try {
      const raw = this.storage?.getItem(this.key);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as RunSummary[]) : [];
    } catch {
      return [];
    }
  }
}

/** Discards everything (tests, or storage unavailable). */
export class NullSink implements TelemetrySink {
  record(): void {}
}

/** The browser's localStorage, or null where accessing it throws (some privacy modes do). */
export function browserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
