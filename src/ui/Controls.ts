import type Phaser from 'phaser';
import { GAME_ACTIONS, type GameAction } from '../content';
import { keyCodes } from './keys';

/**
 * Keyboard and gamepad, merged into one state per frame.
 * Keyboard keys come from content/data/controls.json (the only place where keys are decided);
 * the gamepad uses the standard layout below.
 */
export class Controls {
  left = false;
  right = false;
  up = false;
  down = false;
  jump = false;
  fire = false;
  panza = false;
  jumpPressed = false;
  panzaPressed = false;
  pausePressed = false;
  private prevJump = false;
  private prevPanza = false;
  private prevPause = false;
  private readonly keys: Record<GameAction, Phaser.Input.Keyboard.Key[]>;

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = Object.fromEntries(GAME_ACTIONS.map((a) => [a, keyCodes(a).map((code) => kb.addKey(code))])) as Record<
      GameAction,
      Phaser.Input.Keyboard.Key[]
    >;
  }

  /** True while any key bound to the action is held. */
  private held(action: GameAction) {
    return this.keys[action].some((k) => k.isDown);
  }

  update() {
    const pad = this.scene.input.gamepad?.total ? this.scene.input.gamepad.getPad(0) : null;
    const ax = pad ? pad.leftStick.x : 0;
    const ay = pad ? pad.leftStick.y : 0;
    this.left = this.held('left') || ax < -0.4 || !!pad?.left;
    this.right = this.held('right') || ax > 0.4 || !!pad?.right;
    this.up = this.held('up') || ay < -0.5 || !!pad?.up;
    this.down = this.held('down') || ay > 0.5 || !!pad?.down;
    this.jump = this.held('jump') || !!pad?.A;
    this.fire = this.held('fire') || !!pad?.X || !!pad?.R2;
    this.panza = this.held('panza') || !!pad?.B;
    const pause = this.held('pause') || !!pad?.buttons[9]?.pressed;
    this.jumpPressed = this.jump && !this.prevJump;
    this.panzaPressed = this.panza && !this.prevPanza;
    this.pausePressed = pause && !this.prevPause;
    this.prevJump = this.jump;
    this.prevPanza = this.panza;
    this.prevPause = pause;
  }
}
