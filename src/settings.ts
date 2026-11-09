import { audio } from './audio/engine';
import { SettingsStore, VOLUME_MAX, type GameSettings } from './core/Settings';
import { browserStorage } from './core/storage';

/** The player's settings for this browser (options menu). */
export const settings = new SettingsStore(browserStorage());

/** Pushes the settings to the systems that use them (today: the audio volumes). */
export function applySettings(s: Readonly<GameSettings> = settings.get()) {
  audio.setVolumes(s.musicVolume / VOLUME_MAX, s.sfxVolume / VOLUME_MAX);
}
