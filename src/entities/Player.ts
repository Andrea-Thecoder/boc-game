import Phaser from 'phaser';
import { TORSO } from '../art/sprites';
import { GROUND_Y } from '../config';
import { sfx } from '../audio/sfx';
import { CONTENT, type Flavour, type Weapon } from '../content';
import type { GameBus } from '../systems/events';
import type { Controls } from '../ui/Controls';

const STATS = CONTENT.player;

type Aim = 'fwd' | 'up' | 'diagUp' | 'down' | 'diagDown';

/** Hand position (relative to feet, facing right) and direction for each aim. */
const AIMS: Record<Aim, { frame: number; ox: number; oy: number; dx: number; dy: number }> = {
  fwd: { frame: TORSO.fwd, ox: 14, oy: -22, dx: 1, dy: -0.12 },
  up: { frame: TORSO.up, ox: 7, oy: -33, dx: 0.05, dy: -1 },
  diagUp: { frame: TORSO.diagUp, ox: 13, oy: -30, dx: 0.72, dy: -0.72 },
  down: { frame: TORSO.down, ox: 8, oy: -7, dx: 0.05, dy: 1 },
  diagDown: { frame: TORSO.diagDown, ox: 13, oy: -14, dx: 0.72, dy: 0.72 },
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly torso: Phaser.GameObjects.Sprite;
  maxHp = STATS.maxHp;
  hp = STATS.maxHp;
  weapon: Weapon = CONTENT.weapons.tamarindo;
  ammo = Infinity;
  facing = 1;
  dead = false;
  /** set by the scene: left edge the player cannot cross (camera never scrolls back) */
  minX = 8;
  maxX = Infinity;
  frozen = false;
  /** while time < dropUntil the player falls through one-way platforms (down + jump) */
  dropUntil = 0;

  private lastShot = 0;
  private poseUntil = 0;
  private poseFrame: number = TORSO.idle;
  private invulnUntil = 0;
  private panzaReady = 0;
  private wasOnGround = true;
  private fallSpeed = 0;

  /**
   * Paolone talks to the rest of the game only through `bus` (see systems/events.ts).
   */
  constructor(
    scene: Phaser.Scene,
    private readonly bus: GameBus,
    x: number,
    y: number,
  ) {
    super(scene, x, y, 'paolone-legs', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(60);
    this.torso = scene.add.sprite(x, y, 'paolone-torso', 0).setOrigin(0.5, 1).setDepth(61);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 28).setOffset(10, 6);
    body.setMaxVelocityY(520);
    this.play('legs-idle');
    this.torso.play('torso-idle');
  }

  get onGround(): boolean {
    const b = this.body as Phaser.Physics.Arcade.Body;
    return b.blocked.down || b.touching.down;
  }

  get invulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil || this.dead;
  }

  update(time: number, c: Controls) {
    if (this.dead) {
      this.torso.setPosition(this.x, this.y).setAngle(this.angle);
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    const h = this.frozen ? 0 : (c.right ? 1 : 0) - (c.left ? 1 : 0);
    const ground = this.onGround;

    // movement
    if (h !== 0) this.facing = h;
    const lunging = time < this.poseUntil && this.poseFrame === TORSO.panza;
    if (!lunging) body.setVelocityX(h * STATS.runSpeed);
    if (!this.frozen && c.jumpPressed && ground) {
      if (c.down && this.y < GROUND_Y - 2) {
        this.dropUntil = time + 250;
      } else {
        body.setVelocityY(-STATS.jumpVelocity);
        sfx.jump();
      }
    }
    if (!c.jump && body.velocity.y < -120) body.setVelocityY(body.velocity.y * 0.85); // variable jump height

    // keep inside the visible area (no going back, Metal Slug style)
    if (this.x < this.minX) {
      this.x = this.minX;
      body.setVelocityX(Math.max(0, body.velocity.x));
    }
    if (this.x > this.maxX) {
      this.x = this.maxX;
      body.setVelocityX(Math.min(0, body.velocity.x));
    }

    // landing thud: Paolone is heavy
    if (ground && !this.wasOnGround && this.fallSpeed > 260) {
      sfx.land();
      this.bus.emit('player:landed', { x: this.x, y: this.y });
    }
    this.fallSpeed = body.velocity.y;
    this.wasOnGround = ground;

    // legs animation
    this.setFlipX(this.facing < 0);
    if (!ground) this.play('legs-jump', true);
    else if (h !== 0) this.play('legs-run', true);
    else this.play('legs-idle', true);

    // aim
    const up = c.up && !this.frozen;
    const down = c.down && !ground && !this.frozen;
    let aim: Aim = 'fwd';
    if (up) aim = h !== 0 ? 'diagUp' : 'up';
    else if (down) aim = h !== 0 ? 'diagDown' : 'down';

    if (!this.frozen && c.fire && time - this.lastShot >= this.weapon.cooldown) this.throwSukkino(time, aim);
    if (!this.frozen && c.panzaPressed && time >= this.panzaReady) this.panzata(time);

    // torso pose
    this.torso.setFlipX(this.flipX);
    const runBob = ground && h !== 0 && Number(this.frame.name) % 2 === 1 ? 1 : 0;
    this.torso.setPosition(this.x, this.y + runBob);
    if (time < this.poseUntil) {
      this.torso.stop().setFrame(this.poseFrame);
    } else if (aim !== 'fwd') {
      this.torso.stop().setFrame(AIMS[aim].frame);
    } else if (ground && h === 0) {
      this.torso.play('torso-idle', true);
    } else {
      this.torso.stop().setFrame(TORSO.idle);
    }

    // blink while invulnerable
    const blink = time < this.invulnUntil && Math.floor(time / 70) % 2 === 0;
    this.setAlpha(blink ? 0.25 : 1);
    this.torso.setAlpha(blink ? 0.25 : 1);
  }

  private throwSukkino(time: number, aim: Aim) {
    const a = AIMS[aim];
    const w = this.weapon;
    this.lastShot = time;
    this.poseUntil = time + Math.min(160, w.cooldown);
    this.poseFrame = a.frame;
    const sx = this.x + a.ox * this.facing;
    const sy = this.y + a.oy;
    const base = Math.atan2(a.dy, a.dx * this.facing);
    const angles = w.spread.map((off) => base + off * this.facing);
    sfx.throw();
    let depleted = false;
    if (this.ammo !== Infinity) {
      this.ammo--;
      if (this.ammo <= 0) {
        this.setWeapon('tamarindo');
        depleted = true;
      }
    }
    // the volley uses the weapon in hand when throwing, even if it just ran out
    this.bus.emit('player:threw', { weapon: w, x: sx, y: sy, angles });
    if (depleted) this.bus.emit('weapon:depleted');
  }

  private panzata(time: number) {
    const { cooldownMs, durationMs, lunge, damage, reach } = STATS.panzata;
    this.panzaReady = time + cooldownMs;
    this.poseUntil = time + durationMs;
    this.poseFrame = TORSO.panza;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(this.facing * lunge);
    sfx.panzata();
    const area = new Phaser.Geom.Rectangle(this.facing > 0 ? this.x : this.x - reach, this.y - 28, reach, 24);
    this.bus.emit('player:panzata', { area, damage, facing: this.facing });
  }

  setWeapon(f: Flavour) {
    this.weapon = CONTENT.weapons[f];
    this.ammo = this.weapon.ammo;
    this.bus.emit('weapon:changed', { flavour: f, ammo: this.ammo });
  }

  heal(n: number) {
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.bus.emit('player:healed', { hp: this.hp });
  }

  hurt(fromX: number) {
    if (this.invulnerable) return;
    this.hp--;
    this.invulnUntil = this.scene.time.now + STATS.invulnerabilityMs;
    this.poseUntil = this.scene.time.now + 350;
    this.poseFrame = TORSO.hurt;
    const dir = this.x < fromX ? -1 : 1;
    this.setVelocity(dir * 140, -200);
    sfx.hurt();
    this.bus.emit('player:hurt', { hp: this.hp });
    if (this.hp <= 0) this.die(dir);
  }

  private die(dir: number) {
    this.dead = true;
    this.torso.stop().setFrame(TORSO.hurt);
    this.setFrame(5);
    this.setVelocity(dir * 90, -260);
    this.setAngularVelocity(dir * 360);
    this.scene.time.delayedCall(700, () => this.setAngularVelocity(0));
    this.bus.emit('player:died');
  }

  destroy(fromScene?: boolean) {
    this.torso.destroy();
    super.destroy(fromScene);
  }
}
