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
