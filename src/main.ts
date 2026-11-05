import Phaser from 'phaser';
import { DEBUG, GRAVITY, H, W } from './config';
import BootScene from './scenes/BootScene';
import TitleScene from './scenes/TitleScene';
import GameScene from './scenes/GameScene';
import HudScene from './scenes/HudScene';
import { GameOverScene, VictoryScene } from './scenes/EndScenes';

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
  scene: [BootScene, TitleScene, GameScene, HudScene, GameOverScene, VictoryScene],
});
if (DEBUG) (window as unknown as { game: Phaser.Game }).game = game;
