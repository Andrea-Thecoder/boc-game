import Phaser from 'phaser';
import { BOSS_ARENA_X, GROUND_Y } from '../../config';
import { sfx } from '../../audio/sfx';
import { EnemyBullet } from '../EnemyBullet';
import type GameScene from '../../scenes/GameScene';
import type { Player } from '../Player';
import { Enemy } from './Enemy';
import { Chierichetto } from './Faithful';

type Mode = 'intro' | 'waiting' | 'fight' | 'telegraph' | 'charge' | 'return';

/**
 * Monsignor Angelius Panza, 88 years old, corrupt to the bone, on his armoured Papamobile.
 * Three phases: holy water barrage → summons altar boys → bells from the sky and ramming charges.
 */
export class MonsignorPanza extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = 5000;
  protected readonly screams = [] as const;
  readonly maxHp = 110;
  private mode: Mode = 'intro';
  private phase = 1;
  private targetX = BOSS_ARENA_X + 250;
  private nextVolley = 0;
  private nextSummon = 0;
  private nextBells = 0;
  private nextCharge = 0;
  private modeUntil = 0;
  private faceUntil = 0;

  constructor(gs: GameScene) {
    super(gs, BOSS_ARENA_X + 372, GROUND_Y, 'panza', 110);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    body.setSize(80, 54).setOffset(8, 8);
    this.setDepth(44);
    this.setVelocityX(-70);
  }

  get isBoss() {
    return true;
  }

  get fighting() {
    return this.mode !== 'intro' && this.mode !== 'waiting' && !this.dead;
  }

  /** Called by the scene once the intro dialogue is over. */
  startFight() {
    const t = this.gs.time.now;
    this.mode = 'fight';
    this.nextVolley = t + 800;
    this.nextSummon = t + 4000;
    this.nextBells = t + 2500;
    this.nextCharge = t + 5000;
  }

  protected think(time: number, p: Player) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // wheels bounce a bit, it's an old vehicle
    this.y = GROUND_Y + (Math.floor(time / 120) % 2 === 0 && body.velocity.x !== 0 ? -1 : 0);

    if (time > this.faceUntil && !this.dead) this.setFrame(0);

    switch (this.mode) {
      case 'intro':
        if (this.x <= BOSS_ARENA_X + 250) {
          body.setVelocityX(0);
          this.mode = 'waiting';
          this.gs.onBossArrived();
        }
        return;
      case 'waiting':
        return;
      case 'telegraph':
        body.setVelocityX(0);
        this.x += Math.random() < 0.5 ? -1 : 1;
        if (time > this.modeUntil) {
          this.mode = 'charge';
          body.setVelocityX(-270);
          this.gs.cameras.main.shake(300, 0.008);
        }
        return;
      case 'charge':
        if (this.x <= BOSS_ARENA_X + 52) {
          body.setVelocityX(0);
          this.gs.cameras.main.shake(200, 0.015);
          sfx.land();
          this.mode = 'return';
          this.modeUntil = time + 500;
        }
        return;
      case 'return':
        if (time < this.modeUntil) return;
        body.setVelocityX(110);
        if (this.x >= BOSS_ARENA_X + 240) { body.setVelocityX(0); this.mode = 'fight'; }
        return;
    }

    // --- regular fight -------------------------------------------------------------------------
    const speed = [0, 35, 50, 70][this.phase];
    if (Math.abs(this.x - this.targetX) < 4) {
      this.targetX = BOSS_ARENA_X + 170 + Math.random() * 120;
    }
    body.setVelocityX(Math.sign(this.targetX - this.x) * speed);

    if (time > this.nextVolley) {
      this.nextVolley = time + [0, 1500, 1250, 1050][this.phase];
      this.volley(p);
    }
    if (this.phase >= 2 && time > this.nextSummon) {
      this.nextSummon = time + 5500;
      if (this.gs.aliveEnemies() < 3) {
        this.laugh(700);
        this.gs.say(this, 'Venite, figlioli!', 900);
        this.gs.addEnemy(new Chierichetto(this.gs, BOSS_ARENA_X + 335, GROUND_Y - 2));
      }
    }
    if (this.phase >= 3 && time > this.nextBells) {
      this.nextBells = time + 3400;
      sfx.bell();
      [-44, 0, 44].forEach((off, i) => {
        this.gs.time.delayedCall(i * 160, () => {
          const x = Phaser.Math.Clamp(p.x + off, BOSS_ARENA_X + 10, BOSS_ARENA_X + 310);
          this.gs.addEnemyBullet(new EnemyBullet(this.gs, 'campana', x, -12, 0, 0));
        });
      });
    }
    if (this.phase >= 3 && time > this.nextCharge) {
      this.nextCharge = time + 7000;
      this.mode = 'telegraph';
      this.modeUntil = time + 800;
      this.laugh(800);
      this.gs.say(this, 'In nomine Panzae!', 900, true);
    }
  }

  private volley(p: Player) {
    const sx = this.x - 46, sy = this.y - 32;
    const n = this.phase === 1 ? 3 : 5;
    for (let i = 0; i < n; i++) {
      const t = 0.55 + i * 0.16;
      const [vx, vy] = EnemyBullet.lob(sx, sy, p.x + (i - (n - 1) / 2) * 18, p.y - 8, t, EnemyBullet.gravityOf('goccia'));
      this.gs.addEnemyBullet(new EnemyBullet(this.gs, 'goccia', sx, sy, vx, vy));
    }
    sfx.holyWater();
  }

  private laugh(ms: number) {
    this.setFrame(1);
    this.faceUntil = this.gs.time.now + ms;
  }

  hurt(dmg: number, fromX: number) {
    if (this.dead || !this.fighting) return;
    void fromX;
    this.hp -= dmg;
    this.setTintFill(0xffffff);
    this.gs.time.delayedCall(50, () => this.active && this.clearTint());
    this.setFrame(2);
    this.faceUntil = this.gs.time.now + 160;
    sfx.bossHit();
    this.gs.syncHud();
    const ratio = this.hp / this.maxHp;
    if (this.phase === 1 && ratio <= 0.66) {
      this.phase = 2;
      this.gs.say(this, 'Basta giocare! Chierichetti, a me!', 1500, true);
    } else if (this.phase === 2 && ratio <= 0.33) {
      this.phase = 3;
      this.gs.say(this, 'Suonate le campane... A MORTO!', 1500, true);
    }
    if (this.hp <= 0) this.die();
  }

  protected die() {
    this.dead = true;
    this.mode = 'waiting';
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.checkCollision.none = true;
    this.setFrame(2);
    this.gs.onEnemyKilled(this, this.score);
    // chain of explosions, then the Monsignore is launched into orbit
    for (let i = 0; i < 8; i++) {
      this.gs.time.delayedCall(i * 220, () => {
        sfx.explosion();
        this.gs.explosion(this.x - 40 + Math.random() * 80, this.y - 10 - Math.random() * 45);
        this.gs.cameras.main.shake(180, 0.012);
      });
    }
    this.gs.time.delayedCall(1900, () => {
      this.setFrame(3).setTint(0x8a8394);
      const panza = this.gs.add.image(this.x + 2, this.y - 47, 'panza', 0)
        .setCrop(26, 0, 48, 34).setOrigin(50 / 96, 17 / 64).setDepth(70);
      this.gs.say(panza, 'Maledetto sukkinooooo!', 1600, true);
      this.gs.tweens.add({
        targets: panza, y: -60, x: panza.x + 60, angle: 720, scale: 0.4, duration: 1800, ease: 'Quad.In',
        onComplete: () => {
          panza.destroy();
          this.gs.sparkle(this.x + 60, 4, 12);
          this.gs.onBossDefeated();
        },
      });
    });
  }
}
