import { expect, test } from './support/fixtures';

/**
 * Smoke tests: verify WHAT the game does, not how it is written.
 * They are the safety net of the phase 2 refactor and must keep passing unchanged.
 */
test.describe('smoke', () => {
  test('boot_pageLoaded_showsTitleScreen', async ({ game }) => {
    // Arrange: the fixture opened the page

    // Act
    const state = await game.state();

    // Assert
    expect(state.scenes).toEqual(['title']);
  });

  test('startGame_enterPressedOnTitle_startsLevelWithHud', async ({ game }) => {
    // Arrange: title screen

    // Act
    const state = await game.startGame();

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'hud']));
  });

  test('firstWave_playerAdvancesThrowing_scoreIncreases', async ({ game }) => {
    // Arrange
    await game.startGame();
    await game.press('right');
    await game.press('fire');

    // Act
    const state = await game.runUntil((s) => s.score > 0, 900);

    // Assert
    expect(state.score).toBeGreaterThan(0);
  });

  test('bossArena_playerEntersArena_bossAppearsWithFullHealth', async ({ game }) => {
    // Arrange: title screen

    // Act
    const state = await game.enterBossArena();

    // Assert
    expect(state.bossHp).toBe(1);
  });

  test('bossFight_continuousThrowing_showsVictoryScreen', async ({ game }) => {
    // Arrange: title screen

    // Act
    const state = await game.defeatBoss();

    // Assert
    expect(state.scenes).toContain('victory');
  });

  test('playerDeath_lastHeartLost_showsGameOverScreen', async ({ game }) => {
    // Arrange
    await game.startGame();

    // Act
    const state = await game.killPlayer();

    // Assert
    expect(state.scenes).toContain('gameover');
  });

  test('gameOver_enterPressed_restartsLevel', async ({ game }) => {
    // Arrange
    await game.startGame();
    await game.killPlayer();
    await game.step(90); // the "PREMI INVIO" prompt appears after 1.2 s

    // Act
    await game.tap('confirm');
    const state = await game.runUntil((s) => s.scenes.includes('game'), 120);

    // Assert
    expect(state.scenes).toContain('game');
  });

  test('fullRun_bossDefeated_noConsoleErrors', async ({ game, consoleErrors }) => {
    // Arrange: title screen

    // Act
    await game.defeatBoss();

    // Assert
    expect(consoleErrors).toEqual([]);
  });
});
