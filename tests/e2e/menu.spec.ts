import { expect, test } from './support/fixtures';

/**
 * Main menu and options: NEW GAME is covered by the smoke tests (startGame), here the rest.
 */
test.describe('menu', () => {
  test('mainMenu_downThenEnter_skipsLockedLoadGameAndOpensOptions', async ({ game }) => {
    // Arrange: title screen

    // Act
    const state = await game.openOptions();

    // Assert
    expect(state.scenes).toEqual(['title', 'options']);
  });

  test('options_escapePressed_closesBackToTheTitle', async ({ game }) => {
    // Arrange
    await game.openOptions();

    // Act
    await game.tap('Escape');
    const state = await game.step(5);

    // Assert
    expect(state.scenes).toEqual(['title']);
  });

  test('options_musicVolumeLowered_isSavedInTheBrowser', async ({ game }) => {
    // Arrange: MUSIC VOLUME is the first option, at full volume
    await game.openOptions();

    // Act
    await game.tap('ArrowLeft');

    // Assert
    expect(await game.savedSettings()).toMatchObject({ musicVolume: 9 });
  });

  test('options_controlsOpenedAndClosed_noConsoleErrors', async ({ game, consoleErrors }) => {
    // Arrange: options open, cursor moved to CONTROLS (music, sfx, fullscreen, controls)
    await game.openOptions();
    await game.tap('ArrowDown');
    await game.tap('ArrowDown');
    await game.tap('ArrowDown');

    // Act
    await game.tap('Enter');
    await game.step(5);
    await game.tap('Escape');
    await game.tap('Escape');
    await game.step(5);

    // Assert
    expect(consoleErrors).toEqual([]);
  });
});
