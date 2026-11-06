import Phaser from 'phaser';
import { sfx } from '../../audio/sfx';
import { roll } from '../../core/random';
import { StateMachine } from '../../core/StateMachine';
import { CONTENT, line } from '../../content';
import { bulletGravity } from '../EnemyBullet';
import type { GameBus } from '../../systems/events';
import { lob } from '../../systems/rules/ballistics';
import type { Player } from '../Player';
import { Enemy } from './Enemy';

const CHIERICHETTO = CONTENT.enemies.chierichetto;
const BEGHINA = CONTENT.enemies.beghina;
const SACRESTANO = CONTENT.enemies.sacrestano;

/*
 * The faithful of Monsignor Panza. Each one is a StateMachine:
 * states say WHAT the enemy is doing; attack cooldowns are separate timers (they keep running in every state).
 */

// ---------------------------------------------------------------------------------------------
// Chierichetto:  move ──(cooldown ready, in range)──▶ throw ──(windup over)──▶ move
// ---------------------------------------------------------------------------------------------

type ChierichettoState = 'move' | 'throw';

/** Keeps his distance and lobs consecrated wafers. */
export class Chierichetto extends Enemy {
  protected readonly deadFrame = 3;
  protected readonly score = CHIERICHETTO.score;
  /** absolute time of the next possible throw (cooldown) */
  private nextThrow = 0;
  private readonly brain: StateMachine<ChierichettoState, Chierichetto>;

  constructor(scene: Phaser.Scene, bus: GameBus, target: Player, x: number, y: number) {
    super(scene, bus, target, x, y, 'chierichetto', CHIERICHETTO.hp);
    this.setBodyBox(10, 20, 5, 4);
    this.nextThrow = scene.time.now + roll(CHIERICHETTO.attack.firstDelayMs);
    this.play('chierichetto-walk');
    this.brain = new StateMachine<ChierichettoState, Chierichetto>(
      this,
      {
        move: { update: () => this.move() },
        throw: {
          enter: () => this.throwWafer(),
          update: (_, fsm) => {
            this.faceTowards(this.target.x);
            this.stopX();
            return fsm.elapsed >= CHIERICHETTO.attack.windupMs ? 'move' : undefined;
          },
        },
      },
      'move',
    );
  }

  protected deathScream() {
    return line('chierichetto', 'morte');
  }

  protected think(_time: number, deltaMs: number) {
    this.brain.update(deltaMs);
  }

  /** Stays between keepDistance[0] and keepDistance[1] px from Paolone. */
  private move(): ChierichettoState | undefined {
    const { keepDistance, walkSpeed, retreatSpeed, attack } = CHIERICHETTO;
    const p = this.target;
    const dx = p.x - this.x;
    const dist = Math.abs(dx);
    this.faceTowards(p.x);
    let vx = 0;
    if (dist > keepDistance[1]) vx = Math.sign(dx) * walkSpeed;
    else if (dist < keepDistance[0]) vx = -Math.sign(dx) * retreatSpeed;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(vx);
    if (vx !== 0) this.play('chierichetto-walk', true);
    else this.stop().setFrame(0);
    return this.scene.time.now > this.nextThrow && dist < attack.range ? 'throw' : undefined;
  }

  private throwWafer() {
    const { attack } = CHIERICHETTO;
    const p = this.target;
    this.nextThrow = this.scene.time.now + roll(attack.cooldownMs);
    this.stop().setFrame(2);
    const sx = this.x + this.facing * 6;
    const sy = this.y - 21;
    const [vx, vy] = lob(sx, sy, p.x, p.y - 14, attack.flightTime, bulletGravity('ostia'));
    this.bus.emit('enemy:fired', { kind: 'ostia', x: sx, y: sy, vx, vy });
    sfx.ostia();
  }

  private stopX() {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
  }
}

// ---------------------------------------------------------------------------------------------
// Beghina:  walk ──(Paolone within reach)──▶ windup ──(windupMs)──▶ whip ──(whipMs)──▶ walk
// ---------------------------------------------------------------------------------------------

type BeghinaState = 'walk' | 'windup' | 'whip';

/** Slow, stubborn, whips you with her rosary after a clear wind-up. */
export class Beghina extends Enemy {
  protected readonly deadFrame = 4;
  protected readonly score = BEGHINA.score;
  private readonly brain: StateMachine<BeghinaState, Beghina>;

  constructor(scene: Phaser.Scene, bus: GameBus, target: Player, x: number, y: number) {
    super(scene, bus, target, x, y, 'beghina', BEGHINA.hp);
    this.setBodyBox(10, 20, 11, 4);
    this.play('beghina-walk');
    const { attack } = BEGHINA;
    this.brain = new StateMachine<BeghinaState, Beghina>(
      this,
      {
        walk: { update: () => this.walk() },
        windup: {
          enter: () => {
            this.stopX();
            this.stop().setFrame(2);
          },
          update: (_, fsm) => {
            this.stopX();
            return fsm.elapsed > attack.windupMs ? 'whip' : undefined;
          },
        },
        whip: {
          enter: () => this.whip(),
          update: (_, fsm) => {
            this.stopX();
            return fsm.elapsed > attack.whipMs ? 'walk' : undefined;
          },
        },
      },
      'walk',
    );
  }

  protected deathScream() {
    return line('beghina', 'morte');
  }

  protected think(_time: number, deltaMs: number) {
    this.brain.update(deltaMs);
  }

  private walk(): BeghinaState | undefined {
    const { walkSpeed, stopDistance, attack } = BEGHINA;
    const p = this.target;
    const dx = p.x - this.x;
    this.faceTowards(p.x);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(Math.abs(dx) > stopDistance ? Math.sign(dx) * walkSpeed : 0);
    this.play('beghina-walk', true);
    const inReach = Math.abs(dx) < attack.reach && Math.abs(p.y - this.y) < attack.verticalReach;
    return inReach ? 'windup' : undefined;
  }

  /** The rosary lashes the area in front of her, once. */
  private whip() {
    this.setFrame(3);
    sfx.whip();
    const p = this.target;
    const reach = new Phaser.Geom.Rectangle(this.facing > 0 ? this.x : this.x - 18, this.y - 18, 18, 10);
    if (Phaser.Geom.Rectangle.Overlaps(reach, p.getBounds())) p.hurt(this.x);
  }

  private stopX() {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
  }
}

// ---------------------------------------------------------------------------------------------
// Sacrestano:  stalk ──(cooldown ready, in range)──▶ incense ──(next frame)──▶ stalk
// ---------------------------------------------------------------------------------------------

type SacrestanoState = 'stalk' | 'incense';

/** Swings the thurible and releases clouds of toxic incense that drift towards Paolone. */
export class Sacrestano extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = SACRESTANO.score;
  /** absolute time of the next possible puff (cooldown) */
  private nextPuff = 0;
  private readonly brain: StateMachine<SacrestanoState, Sacrestano>;

  constructor(scene: Phaser.Scene, bus: GameBus, target: Player, x: number, y: number) {
    super(scene, bus, target, x, y, 'sacrestano', SACRESTANO.hp);
    this.setBodyBox(10, 24, 7, 4);
    this.nextPuff = scene.time.now + SACRESTANO.attack.firstDelayMs;
    this.play('sacrestano-swing');
    this.brain = new StateMachine<SacrestanoState, Sacrestano>(
      this,
      {
        stalk: { update: () => this.stalk() },
        incense: { enter: () => this.puff(), update: () => 'stalk' },
      },
      'stalk',
    );
  }

  protected deathScream() {
    return line('sacrestano', 'morte');
  }

  protected think(_time: number, deltaMs: number) {
    this.brain.update(deltaMs);
  }

  /** Walks until keepDistance px from Paolone, then stands swinging. */
  private stalk(): SacrestanoState | undefined {
    const { walkSpeed, keepDistance, attack } = SACRESTANO;
    const dx = this.target.x - this.x;
    this.faceTowards(this.target.x);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(Math.abs(dx) > keepDistance ? Math.sign(dx) * walkSpeed : 0);
    return this.scene.time.now > this.nextPuff && Math.abs(dx) < attack.range ? 'incense' : undefined;
  }

  private puff() {
    const { attack } = SACRESTANO;
    const p = this.target;
    this.nextPuff = this.scene.time.now + roll(attack.cooldownMs);
    const sx = this.x + this.facing * 12;
    const sy = this.y - 14;
    const ang = Math.atan2(p.y - 16 - sy, p.x - sx);
    const v = attack.smokeSpeed;
    this.bus.emit('enemy:fired', { kind: 'fumo', x: sx, y: sy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v });
    sfx.smoke();
  }
}
