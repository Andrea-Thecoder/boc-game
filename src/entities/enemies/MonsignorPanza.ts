import Phaser from 'phaser';
import { BOSS_ARENA_X, GROUND_Y } from '../../config';
import { sfx } from '../../audio/sfx';
import { CONTENT, line, lineById } from '../../content';
import { bulletGravity } from '../EnemyBullet';
import type { GameBus } from '../../systems/events';
import { lob } from '../../systems/rules/ballistics';
import type { Player } from '../Player';
import { Enemy } from './Enemy';

type Mode = 'intro' | 'waiting' | 'fight' | 'telegraph' | 'charge' | 'return';

const BOSS = CONTENT.boss;

/**
 * Monsignor Angelius Panza, 88 years old, corrupt to the bone, on his armoured Papamobile.
 * Three phases: holy water barrage → summons altar boys → bells from the sky and ramming charges.
 */
export class MonsignorPanza extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = BOSS.score;
  readonly maxHp = BOSS.hp;
  private mode: Mode = 'intro';
  /** index in BOSS.phases */
  private phase = 0;
  private targetX = BOSS_ARENA_X + 250;
  private nextVolley = 0;
  private nextSummon = 0;
  private nextBells = 0;
  private nextCharge = 0;
  private modeUntil = 0;
  private faceUntil = 0;

  constructor(scene: Phaser.Scene, bus: GameBus, target: Player) {
    super(scene, bus, target, BOSS_ARENA_X + 372, GROUND_Y, 'panza', BOSS.hp);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    body.setSize(80, 54).setOffset(8, 8);
    this.setDepth(44);
    this.setVelocityX(-BOSS.entrySpeed);
  }

  protected deathScream() {
    return line('monsignor-panza', 'sconfitta');
  }

  private get stats() {
    return BOSS.phases[this.phase];
  }

  get isBoss() {
    return true;
  }

  get fighting() {
    return this.mode !== 'intro' && this.mode !== 'waiting' && !this.dead;
  }

  /** Called by the scene once the intro dialogue is over. */
  startFight() {
    const t = this.scene.time.now;
    this.mode = 'fight';
    this.nextVolley = t + BOSS.firstAttackMs.volley;
    this.nextSummon = t + BOSS.firstAttackMs.summon;
    this.nextBells = t + BOSS.firstAttackMs.bells;
    this.nextCharge = t + BOSS.firstAttackMs.charge;
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
          this.bus.emit('boss:arrived');
        }
        return;
      case 'waiting':
        return;
      case 'telegraph':
        body.setVelocityX(0);
        this.x += Math.random() < 0.5 ? -1 : 1;
        if (time > this.modeUntil) {
          this.mode = 'charge';
          body.setVelocityX(-BOSS.charge.speed);
          this.bus.emit('fx:shake', { durationMs: 300, intensity: 0.008 });
        }
        return;
      case 'charge':
        if (this.x <= BOSS_ARENA_X + 52) {
          body.setVelocityX(0);
          this.bus.emit('fx:shake', { durationMs: 200, intensity: 0.015 });
          sfx.land();
          this.mode = 'return';
          this.modeUntil = time + BOSS.charge.pauseMs;
        }
        return;
      case 'return':
        if (time < this.modeUntil) return;
        body.setVelocityX(BOSS.charge.returnSpeed);
        if (this.x >= BOSS_ARENA_X + 240) {
          body.setVelocityX(0);
          this.mode = 'fight';
        }
        return;
    }

    // --- regular fight -------------------------------------------------------------------------
    const phase = this.stats;
    const speed = phase.speed;
    if (Math.abs(this.x - this.targetX) < 4) {
      this.targetX = BOSS_ARENA_X + 170 + Math.random() * 120;
    }
    body.setVelocityX(Math.sign(this.targetX - this.x) * speed);

    if (time > this.nextVolley) {
      this.nextVolley = time + phase.volleyEveryMs;
      this.volley(p);
    }
    if (phase.summons && time > this.nextSummon) {
      this.nextSummon = time + BOSS.summon.everyMs;
      // the arena decides whether there is room for another altar boy
      this.bus.emit('boss:summonRequested');
    }
    if (phase.bells && time > this.nextBells) {
      this.nextBells = time + BOSS.bells.everyMs;
      sfx.bell();
      BOSS.bells.offsets.forEach((off, i) => {
        this.scene.time.delayedCall(i * BOSS.bells.staggerMs, () => {
          const x = Phaser.Math.Clamp(p.x + off, BOSS_ARENA_X + 10, BOSS_ARENA_X + 310);
          this.bus.emit('enemy:fired', { kind: 'campana', x, y: -12, vx: 0, vy: 0 });
        });
      });
    }
    if (phase.charges && time > this.nextCharge) {
      this.nextCharge = time + BOSS.charge.everyMs;
      this.mode = 'telegraph';
      this.modeUntil = time + BOSS.charge.telegraphMs;
      this.laugh(800);
      this.say(line('monsignor-panza', 'carica'), 900, true);
    }
  }

  private volley(p: Player) {
    const sx = this.x - 46,
      sy = this.y - 32;
    const { spacing, flightTime, flightTimeStep } = BOSS.volley;
    const n = this.stats.volleyCount;
    for (let i = 0; i < n; i++) {
      const t = flightTime + i * flightTimeStep;
      const [vx, vy] = lob(sx, sy, p.x + (i - (n - 1) / 2) * spacing, p.y - 8, t, bulletGravity('goccia'));
      this.bus.emit('enemy:fired', { kind: 'goccia', x: sx, y: sy, vx, vy });
    }
    sfx.holyWater();
  }

  private say(text: string, durationMs: number, shout = false) {
    this.bus.emit('dialogue:say', { target: this, text, durationMs, shout });
  }

  /** Laughing face for `ms` (also used by the arena when his altar boys arrive). */
  laugh(ms: number) {
    this.setFrame(1);
    this.faceUntil = this.scene.time.now + ms;
  }

  hurt(dmg: number, fromX: number) {
    if (this.dead || !this.fighting) return;
    void fromX;
    this.hp -= dmg;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => this.active && this.clearTint());
    this.setFrame(2);
    this.faceUntil = this.scene.time.now + 160;
    sfx.bossHit();
    this.bus.emit('boss:damaged', { hp: this.hp, maxHp: this.maxHp });
    // at most one phase change per hit, like a real boss "stagger"
    const next = BOSS.phases[this.phase + 1];
    if (next && this.hp / this.maxHp <= next.hpRatio) {
      this.phase++;
      this.bus.emit('boss:phaseChanged', { phase: this.phase });
      if (next.line) this.say(lineById('monsignor-panza', next.line), 1500, true);
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
    this.bus.emit('enemy:killed', { enemy: this, points: this.score });
    // chain of explosions, then the Monsignore is launched into orbit
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 220, () => {
        sfx.explosion();
        this.bus.emit('fx:explosion', { x: this.x - 40 + Math.random() * 80, y: this.y - 10 - Math.random() * 45 });
        this.bus.emit('fx:shake', { durationMs: 180, intensity: 0.012 });
      });
    }
    this.scene.time.delayedCall(1900, () => {
      this.setFrame(3).setTint(0x8a8394);
      const panza = this.scene.add
        .image(this.x + 2, this.y - 47, 'panza', 0)
        .setCrop(26, 0, 48, 34)
        .setOrigin(50 / 96, 17 / 64)
        .setDepth(70);
      this.bus.emit('dialogue:say', { target: panza, text: this.deathScream(), durationMs: 1600, shout: true });
      this.scene.tweens.add({
        targets: panza,
        y: -60,
        x: panza.x + 60,
        angle: 720,
        scale: 0.4,
        duration: 1800,
        ease: 'Quad.In',
        onComplete: () => {
          panza.destroy();
          this.bus.emit('fx:sparkle', { x: this.x + 60, y: 4, count: 12 });
          this.bus.emit('boss:defeated');
        },
      });
    });
  }
}
