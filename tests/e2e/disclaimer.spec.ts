import ui from '../../src/content/data/ui.json' with { type: 'json' };
import { expect, test } from './support/fixtures';

/** Frames the notice stays on screen by itself (60 frames per second). */
const DISCLAIMER_FRAMES = (ui.disclaimer.durationMs / 1000) * 60;
/** Generous margin for the fade-out towards the level. */
const FADE_FRAMES = 60;

/**
 * "Work of fiction" notice: shown after NEW GAME, before the level, for a few seconds or until a key is pressed.
 */
test.describe('disclaimer', () => {
  test.beforeEach(async ({ game }) => {
    await game.openWithDisclaimer();
  });

  test('disclaimer_newGameChosen_isShownBeforeTheLevel', async ({ game }) => {
    // Arrange: title screen with the notice enabled

    // Act
    const state = await game.newGameUntilDisclaimer();

    // Assert
    expect(state.scenes).toEqual(['disclaimer']);
  });

  test('disclaimer_noKeyPressed_staysUntilItsTimeIsOver', async ({ game }) => {
    // Arrange
    await game.newGameUntilDisclaimer();

    // Act: one second before the end
    const state = await game.step(DISCLAIMER_FRAMES - 60);

    // Assert
    expect(state.scenes).toEqual(['disclaimer']);
  });

  test('disclaimer_timeIsOver_startsTheLevel', async ({ game }) => {
    // Arrange
    await game.newGameUntilDisclaimer();

    // Act
    const state = await game.step(DISCLAIMER_FRAMES + FADE_FRAMES);

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'hud']));
  });

  test('disclaimer_anyKeyPressed_startsTheLevelRightAway', async ({ game }) => {
    // Arrange
    await game.newGameUntilDisclaimer();

    // Act
    await game.pressAnyKey();
    const state = await game.step(FADE_FRAMES);

    // Assert
    expect(state.scenes).toEqual(expect.arrayContaining(['game', 'hud']));
  });
});
