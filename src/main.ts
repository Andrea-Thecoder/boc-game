import Phaser from 'phaser';
import { DEBUG, E2E, GRAVITY, H, W } from './config';
import { installTestHooks } from './debug/testHooks';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import GameScene from './scenes/GameScene';
import HudScene from './scenes/HudScene';
import { GameOverScene, VictoryScene } from './scenes/EndScenes';
import OptionsScene from './scenes/OptionsScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#0b0710',
  pixelArt: true,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: true },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVITY }, debug: DEBUG } },
  // overlays last: they are drawn on top of the scene that opened them
  scene: [BootScene, TitleScene, GameScene, HudScene, GameOverScene, VictoryScene, OptionsScene],
});
if (DEBUG) (window as unknown as { game: Phaser.Game }).game = game;
if (DEBUG || E2E) installTestHooks(game);
