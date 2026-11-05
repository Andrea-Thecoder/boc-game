export const W = 320;
export const H = 180;
export const GROUND_Y = 160;
export const GRAVITY = 720;
export const LEVEL_WIDTH = 3520;
/** Left edge of the boss arena: camera locks here. */
export const BOSS_ARENA_X = LEVEL_WIDTH - W;
export const DEBUG = new URLSearchParams(location.search).has('debug');
