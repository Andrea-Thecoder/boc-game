import Phaser from 'phaser';
import { sfx } from '../../audio/sfx';
import { EnemyBullet } from '../EnemyBullet';
import type GameScene from '../../scenes/GameScene';
import type { Player } from '../Player';
import { Enemy } from './Enemy';

/** Chierichetto: keeps his distance and lobs consecrated wafers. */
export class Chierichetto extends Enemy {
  protected readonly deadFrame = 3;
  protected readonly score = 100;
  protected readonly screams = ['MAMMAAA!', 'NON VALE!', 'LO DICO AL MONSIGNORE!', 'SANTO CIELO!'] as const;
  private nextThrow = 0;
  private throwingUntil = 0;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'chierichetto', 2);
    this.setBodyBox(10, 20, 5, 4);
    this.nextThrow = gs.time.now + 900 + Math.random() * 900;
    this.play('chierichetto-walk');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = p.x - this.x;
    const dist = Math.abs(dx);
    this.faceTowards(p.x);
    if (time < this.throwingUntil) { body.setVelocityX(0); return; }
    let vx = 0;
    if (dist > 110) vx = Math.sign(dx) * 58;
    else if (dist < 60) vx = -Math.sign(dx) * 48;
    body.setVelocityX(vx);
    if (vx !== 0) this.play('chierichetto-walk', true); else this.stop().setFrame(0);
    if (time > this.nextThrow && dist < 220) {
      this.nextThrow = time + 1600 + Math.random() * 900;
      this.throwingUntil = time + 300;
      this.stop().setFrame(2);
      const sx = this.x + this.facing * 6, sy = this.y - 21;
      const [vxB, vyB] = EnemyBullet.lob(sx, sy, p.x, p.y - 14, 0.85, EnemyBullet.gravityOf('ostia'));
      this.gs.addEnemyBullet(new EnemyBullet(this.gs, 'ostia', sx, sy, vxB, vyB));
      sfx.ostia();
    }
  }
}

/** Beghina: slow, stubborn, whips you with her rosary. */
export class Beghina extends Enemy {
  protected readonly deadFrame = 4;
  protected readonly score = 150;
  protected readonly screams = ['MALEDUCATO!', 'SANTA PAZIENZA!', 'AIUTO, UN CICCIONE!', 'PREGHERO\' PER TE!'] as const;
  private phase: 'walk' | 'windup' | 'whip' = 'walk';
  private stateUntil = 0;
  private hitDone = false;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'beghina', 3);
    this.setBodyBox(10, 20, 11, 4);
    this.play('beghina-walk');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = p.x - this.x;
    if (this.phase === 'walk') {
      this.faceTowards(p.x);
      body.setVelocityX(Math.abs(dx) > 26 ? Math.sign(dx) * 40 : 0);
      this.play('beghina-walk', true);
      if (Math.abs(dx) < 34 && Math.abs(p.y - this.y) < 26) {
        this.phase = 'windup';
        this.stateUntil = time + 380;
        body.setVelocityX(0);
        this.stop().setFrame(2);
      }
    } else if (this.phase === 'windup') {
      body.setVelocityX(0);
      if (time > this.stateUntil) {
        this.phase = 'whip';
        this.stateUntil = time + 260;
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
      if (time > this.stateUntil) { this.phase = 'walk'; this.stateUntil = time + 700; }
    }
  }
}

/** Sacrestano: swings the thurible and releases clouds of toxic incense. */
export class Sacrestano extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = 200;
  protected readonly screams = ['UFFA!', 'L\'INCENSO NO!', 'CHIAMO IL PARROCO!'] as const;
  private nextPuff = 0;

  constructor(gs: GameScene, x: number, y: number) {
    super(gs, x, y, 'sacrestano', 4);
    this.setBodyBox(10, 24, 7, 4);
    this.nextPuff = gs.time.now + 1200;
    this.play('sacrestano-swing');
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = p.x - this.x;
    this.faceTowards(p.x);
    body.setVelocityX(Math.abs(dx) > 120 ? Math.sign(dx) * 22 : 0);
    if (time > this.nextPuff && Math.abs(dx) < 240) {
      this.nextPuff = time + 2600 + Math.random() * 800;
      const sx = this.x + this.facing * 12, sy = this.y - 14;
      const ang = Math.atan2(p.y - 16 - sy, p.x - sx);
      this.gs.addEnemyBullet(new EnemyBullet(this.gs, 'fumo', sx, sy, Math.cos(ang) * 42, Math.sin(ang) * 42));
      sfx.smoke();
    }
  }
}
