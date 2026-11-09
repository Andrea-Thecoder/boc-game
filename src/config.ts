export const W = 320;
export const H = 180;
export const GROUND_Y = 160;
export const GRAVITY = 720;
export const LEVEL_WIDTH = 3520;
/** Left edge of the boss arena: camera locks here. */
export const BOSS_ARENA_X = LEVEL_WIDTH - W;
const params = new URLSearchParams(location.search);
/** `?debug`: hitbox visibili + API di test. */
export const DEBUG = params.has('debug');
/** `?e2e`: solo API di test (`window.__boc`), usata dagli smoke test Playwright. */
export const E2E = params.has('e2e');
/** Avvertenza dopo NEW GAME: con `?e2e` si salta (i test vanno dritti al livello), a meno di `&disclaimer`. */
export const SHOW_DISCLAIMER = !E2E || params.has('disclaimer');

// --- camera & arena tuning (feel, not balancing: stays in code) -------------------------------
/** Paolone is kept at this fraction of the screen width from the left edge. */
export const CAMERA_LEAD = 0.38;
/** Fraction of the remaining distance the camera covers each frame. */
export const CAMERA_SMOOTHING = 0.14;
/** Paolone cannot get closer than this to the screen edges. */
export const PLAYER_EDGE_MARGIN = 10;
/** Enemies spawning "left"/"right" appear this far outside the screen. */
export const SPAWN_MARGIN = 14;
/** The boss fight starts when Paolone walks this far into the arena. */
export const BOSS_TRIGGER_OFFSET = 70;
/** Parallax speed of the background layers (1 = moves with the world). */
export const PARALLAX = { hills: 0.15, houses: 0.45 } as const;
