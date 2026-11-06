import Phaser from 'phaser';
import { sfx } from '../../audio/sfx';
import { roll } from '../../core/random';
import { CONTENT, line } from '../../content';
import { EnemyBullet } from '../EnemyBullet';
import type GameScene from '../../scenes/GameScene';
import type { Player } from '../Player';
import { Enemy } from './Enemy';

/** Chierichetto: keeps his distance and lobs consecrated wafers. */
const CHIERICHETTO = CONTENT.enemies.chierichetto;
const BEGHINA = CONTENT.enemies.beghina;
const SACRESTANO = CONTENT.enemies.sacrestano;

export class Chierichetto extends Enemy {
  protected readonly deadFrame = 3;
  protected readonly score = CHIERICHETTO.score;
  private nextThrow = 0;
  private throwingUntil = 0;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'chierichetto', CHIERICHETTO.hp);
    this.setBodyBox(10, 20, 5, 4);
    this.nextThrow = gs.time.now + roll(CHIERICHETTO.attack.firstDelayMs);
    this.play('chierichetto-walk');
  }

  protected deathScream() {
    return line('chierichetto', 'morte');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { keepDistance, walkSpeed, retreatSpeed, attack } = CHIERICHETTO;
    const dx = p.x - this.x;
    const dist = Math.abs(dx);
    this.faceTowards(p.x);
    if (time < this.throwingUntil) {
      body.setVelocityX(0);
      return;
    }
    let vx = 0;
    if (dist > keepDistance[1]) vx = Math.sign(dx) * walkSpeed;
    else if (dist < keepDistance[0]) vx = -Math.sign(dx) * retreatSpeed;
    body.setVelocityX(vx);
    if (vx !== 0) this.play('chierichetto-walk', true);
    else this.stop().setFrame(0);
    if (time > this.nextThrow && dist < attack.range) {
      this.nextThrow = time + roll(attack.cooldownMs);
      this.throwingUntil = time + attack.windupMs;
      this.stop().setFrame(2);
      const sx = this.x + this.facing * 6,
        sy = this.y - 21;
      const [vxB, vyB] = EnemyBullet.lob(sx, sy, p.x, p.y - 14, attack.flightTime, EnemyBullet.gravityOf('ostia'));
      this.gs.addEnemyBullet(new EnemyBullet(this.gs, 'ostia', sx, sy, vxB, vyB));
      sfx.ostia();
    }
  }
}

/** Beghina: slow, stubborn, whips you with her rosary. */
export class Beghina extends Enemy {
  protected readonly deadFrame = 4;
  protected readonly score = BEGHINA.score;
  private phase: 'walk' | 'windup' | 'whip' = 'walk';
  private stateUntil = 0;
  private hitDone = false;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'beghina', BEGHINA.hp);
    this.setBodyBox(10, 20, 11, 4);
    this.play('beghina-walk');
  }

  protected deathScream() {
    return line('beghina', 'morte');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { walkSpeed, stopDistance, attack } = BEGHINA;
    const dx = p.x - this.x;
    if (this.phase === 'walk') {
      this.faceTowards(p.x);
      body.setVelocityX(Math.abs(dx) > stopDistance ? Math.sign(dx) * walkSpeed : 0);
      this.play('beghina-walk', true);
      if (Math.abs(dx) < attack.reach && Math.abs(p.y - this.y) < attack.verticalReach) {
        this.phase = 'windup';
        this.stateUntil = time + attack.windupMs;
        body.setVelocityX(0);
        this.stop().setFrame(2);
      }
    } else if (this.phase === 'windup') {
      body.setVelocityX(0);
      if (time > this.stateUntil) {
        this.phase = 'whip';
        this.stateUntil = time + attack.whipMs;
        this.hitDone = false;
        this.setFrame(3);
        sfx.whip();
      }
    } else {
      body.setVelocityX(0);
      if (!this.hitDone) {
        this.hitDone = true;
        const reach = new Phaser.Geom.Rectangle(this.facing > 0 ? this.x : this.x - 18, this.y - 18, 18, 10);
        if (Phaser.Geom.Rectangle.Overlaps(reach, p.getBounds())) p.hurt(this.x);
      }
      if (time > this.stateUntil) {
        this.phase = 'walk';
        this.stateUntil = time + 700;
      }
    }
  }
}

/** Sacrestano: swings the thurible and releases clouds of toxic incense. */
export class Sacrestano extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = SACRESTANO.score;
  private nextPuff = 0;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'sacrestano', SACRESTANO.hp);
    this.setBodyBox(10, 24, 7, 4);
    this.nextPuff = gs.time.now + SACRESTANO.attack.firstDelayMs;
    this.play('sacrestano-swing');
  }

  protected deathScream() {
    return line('sacrestano', 'morte');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const { walkSpeed, keepDistance, attack } = SACRESTANO;
    const dx = p.x - this.x;
    this.faceTowards(p.x);
    body.setVelocityX(Math.abs(dx) > keepDistance ? Math.sign(dx) * walkSpeed : 0);
    if (time > this.nextPuff && Math.abs(dx) < attack.range) {
      this.nextPuff = time + roll(attack.cooldownMs);
      const sx = this.x + this.facing * 12,
        sy = this.y - 14;
      const ang = Math.atan2(p.y - 16 - sy, p.x - sx);
      this.gs.addEnemyBullet(
        new EnemyBullet(this.gs, 'fumo', sx, sy, Math.cos(ang) * attack.smokeSpeed, Math.sin(ang) * attack.smokeSpeed),
      );
      sfx.smoke();
    }
  }
}
