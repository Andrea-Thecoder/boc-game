import type { GameDriver } from './support/GameDriver';
import { expect, test } from './support/fixtures';

/** In the level, opens the pause menu (RESUME is selected). */
async function pauseLevel(game: GameDriver) {
  await game.startGame();
  await game.step(30);
  await game.tap('pause');
  return game.step(5);
}

/** From the pause menu: MAIN MENU → the confirmation, where NO is selected. */
async function askToQuit(game: GameDriver) {
  await game.tap('menuDown');
  await game.tap('menuDown');
  await game.tap('confirm');
  return game.step(5);
}

/** From the pause menu: MAIN MENU → YES, until the title is back. */
async function quitFromPauseMenu(game: GameDriver) {
  await askToQuit(game);
  await game.tap('menuDown');
  await game.tap('confirm');
  return game.runUntil((s) => s.scenes.includes('title'), 60, 5);
}

/** Starts a run and leaves it from the pause menu. */
async function quitToTitle(game: GameDriver) {
  await pauseLevel(game);
  return quitFromPauseMenu(game);
}

/**
 * Pause menu: RESUME, OPTIONS, MAIN MENU (with confirmation).
 */
test.describe('pause', () => {
  test('pause_pausePressedInLevel_opensThePauseMenu', async ({ game }) => {
    // Arrange: title screen

    // Act
    const state = await pauseLevel(game);

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'hud', 'pause']));
  });

  test('pause_menuOpen_paolonePushingRightDoesNotMove', async ({ game }) => {
    // Arrange
    const paused = await pauseLevel(game);

    // Act
    await game.press('right');
    const state = await game.step(60);
    await game.release('right');

    // Assert
    expect(state.playerX).toBe(paused.playerX);
  });

  test('pause_resumeChosen_closesTheMenuAndTheLevelGoesOn', async ({ game }) => {
    // Arrange
    await pauseLevel(game);

    // Act
    await game.tap('confirm');
    const state = await game.step(5);

    // Assert
    expect(state.scenes).toEqual(['game', 'hud']);
  });

  test('pause_mainMenuThenNo_staysPaused', async ({ game }) => {
    // Arrange
    await pauseLevel(game);
    await askToQuit(game);

    // Act
    await game.tap('confirm');
    const state = await game.step(5);

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'pause']));
  });

  test('pause_mainMenuThenYes_returnsToTheTitle', async ({ game }) => {
    // Arrange
    await pauseLevel(game);

    // Act
    const state = await quitFromPauseMenu(game);

    // Assert
    expect(state.scenes).toEqual(['title']);
  });

  test('pause_quitThenNewGame_startsANewRun', async ({ game }) => {
    // Arrange: quit a run from the pause menu
    await quitToTitle(game);

    // Act
    await game.tap('confirm');
    const state = await game.runUntil((s) => s.scenes.includes('game'), 120);

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'hud']));
  });

  test('pause_everyPauseMenuPath_noConsoleErrors', async ({ game, consoleErrors }) => {
    // Arrange
    await pauseLevel(game);

    // Act: options opened and closed, NO, then YES and a new game
    await game.tap('menuDown');
    await game.tap('confirm');
    await game.step(5);
    await game.tap('back');
    await game.step(5);
    await askToQuit(game);
    await game.tap('confirm');
    await game.step(5);
    await quitFromPauseMenu(game);
    await game.tap('confirm');
    await game.runUntil((s) => s.scenes.includes('game'), 120);

    // Assert
    expect(consoleErrors).toEqual([]);
  });
});
