import { z } from 'zod';
import type { StorageLike } from './storage';

/** Volume steps shown in the options menu: 0 = silent, VOLUME_MAX = full. */
export const VOLUME_MAX = 10;

/** Languages the game can be played in. Only Italian exists today: the option is shown but locked. */
export const LANGUAGES = ['it'] as const;
export type Language = (typeof LANGUAGES)[number];

export const SETTINGS_STORAGE_KEY = 'boc.settings';

const volume = z.number().int().min(0).max(VOLUME_MAX);

/**
 * Player preferences saved in the browser. Every field has its own fallback (`catch`):
 * a corrupted or outdated value resets only that field, never the whole settings.
 */
const settingsSchema = z.object({
  musicVolume: volume.catch(VOLUME_MAX),
  sfxVolume: volume.catch(VOLUME_MAX),
  language: z.enum(LANGUAGES).catch('it'),
});
export type GameSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Readonly<GameSettings> = settingsSchema.parse({});

/** Clamps a volume step into 0..VOLUME_MAX. */
export function clampVolume(value: number): number {
  return Math.min(VOLUME_MAX, Math.max(0, Math.round(value)));
}

/**
 * Reads and writes the player settings. Never throws: with no storage, a full storage or garbage in it,
 * the game keeps working with the defaults (or the values changed in this session).
 */
export class SettingsStore {
  private current: GameSettings;

  constructor(
    private readonly storage: StorageLike | null,
    private readonly key = SETTINGS_STORAGE_KEY,
  ) {
    this.current = this.load();
  }

  get(): Readonly<GameSettings> {
    return this.current;
  }

  /** Applies the changes (out-of-range values are clamped or reset), saves them and returns the result. */
  update(patch: Partial<GameSettings>): Readonly<GameSettings> {
    const next = { ...this.current, ...patch };
    this.current = settingsSchema.parse({
      ...next,
      musicVolume: clampVolume(next.musicVolume),
      sfxVolume: clampVolume(next.sfxVolume),
    });
    this.save();
    return this.current;
  }

  private load(): GameSettings {
    try {
      const raw = this.storage?.getItem(this.key);
      return settingsSchema.parse(raw ? JSON.parse(raw) : {});
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private save() {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.current));
    } catch {
      // storage full or blocked: the settings still apply for this session
    }
  }
}
