import Phaser from 'phaser';
import { registerFonts } from '../art/font';
import { registerAnimations, registerSprites } from '../art/sprites';
import { registerBackgrounds } from '../art/backgrounds';
import { registerUi } from '../art/ui';
import { applySettings } from '../settings';

/** Generates every texture, font and animation procedurally, then goes to the title. */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    registerFonts(this);
    registerSprites(this);
    registerBackgrounds(this);
    registerAnimations(this);
    registerUi(this);
    applySettings();
    this.scene.start('title');
  }
}
