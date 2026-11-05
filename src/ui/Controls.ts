import Phaser from 'phaser';

const K = Phaser.Input.Keyboard.KeyCodes;

/** Keyboard (arrows/WASD + Z X C, or K J L) and gamepad, merged into one state per frame. */
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
  private keys: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = kb.addKeys({
      left: K.LEFT,
      right: K.RIGHT,
      up: K.UP,
      down: K.DOWN,
      a: K.A,
      d: K.D,
      w: K.W,
      s: K.S,
      z: K.Z,
      x: K.X,
      c: K.C,
      space: K.SPACE,
      j: K.J,
      k: K.K,
      l: K.L,
      p: K.P,
      esc: K.ESC,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update() {
    const k = this.keys;
    const pad = this.scene.input.gamepad?.total ? this.scene.input.gamepad.getPad(0) : null;
    const ax = pad ? pad.leftStick.x : 0;
    const ay = pad ? pad.leftStick.y : 0;
    this.left = k.left.isDown || k.a.isDown || ax < -0.4 || !!pad?.left;
    this.right = k.right.isDown || k.d.isDown || ax > 0.4 || !!pad?.right;
    this.up = k.up.isDown || k.w.isDown || ay < -0.5 || !!pad?.up;
    this.down = k.down.isDown || k.s.isDown || ay > 0.5 || !!pad?.down;
    this.jump = k.z.isDown || k.space.isDown || k.k.isDown || !!pad?.A;
    this.fire = k.x.isDown || k.j.isDown || !!pad?.X || !!pad?.R2;
    this.panza = k.c.isDown || k.l.isDown || !!pad?.B;
    const pause = k.p.isDown || k.esc.isDown || !!pad?.buttons[9]?.pressed;
    this.jumpPressed = this.jump && !this.prevJump;
    this.panzaPressed = this.panza && !this.prevPanza;
    this.pausePressed = pause && !this.prevPause;
    this.prevJump = this.jump;
    this.prevPanza = this.panza;
    this.prevPause = pause;
  }
}
