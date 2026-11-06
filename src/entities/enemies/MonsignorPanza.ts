import Phaser from 'phaser';
import { BOSS_ARENA_X, GROUND_Y } from '../../config';
import { sfx } from '../../audio/sfx';
import { StateMachine } from '../../core/StateMachine';
import { CONTENT, line, lineById } from '../../content';
import { bulletGravity } from '../EnemyBullet';
import type { GameBus } from '../../systems/events';
import { lob } from '../../systems/rules/ballistics';
import type { Player } from '../Player';
import { Enemy } from './Enemy';

const BOSS = CONTENT.boss;

/** Arena geometry (relative to BOSS_ARENA_X): tied to the arena layout, not to balancing. */
const ARENA = {
  /** spawn point: must stay within 60 px of the screen edge, or the AI is frozen (see CLAUDE.md) */
  spawn: 372,
  /** where he stops for the intro dialogue */
  stop: 250,
  /** patrol range during the fight */
  patrol: [170, 290] as const,
  /** a charge ends here, near the left wall */
  chargeEnd: 52,
  /** after a charge he drives back to here */
  home: 240,
  /** falling bells land within this range */
  bells: [10, 310] as const,
} as const;

/**
 * States of the boss:
 *
 *   entering ──(reached stop)──▶ waiting ──(startFight)──▶ fighting
 *   fighting ──(charge ready)──▶ telegraph ──(telegraphMs)──▶ charge ──(hits the wall)──▶ recover
 *   recover ──(pauseMs)──▶ returning ──(back home)──▶ fighting
 *   any ──(hp 0)──▶ defeated
 *
 * Attack cooldowns (volley, summon, bells, charge) are timers that keep running during `fighting`.
 */
type PanzaState = 'entering' | 'waiting' | 'fighting' | 'telegraph' | 'charge' | 'recover' | 'returning' | 'defeated';

const COMBAT_STATES: ReadonlySet<PanzaState> = new Set(['fighting', 'telegraph', 'charge', 'recover', 'returning']);

/**
 * Monsignor Angelius Panza, 88 years old, corrupt to the bone, on his armoured Papamobile.
 * Three phases: holy water barrage → summons altar boys → bells from the sky and ramming charges.
 */
export class MonsignorPanza extends Enemy {
  protected readonly deadFrame = 2;
  protected readonly score = BOSS.score;
  readonly maxHp = BOSS.hp;
  /** index in BOSS.phases */
  private phase = 0;
  private targetX = BOSS_ARENA_X + ARENA.stop;
  private nextVolley = 0;
  private nextSummon = 0;
  private nextBells = 0;
  private nextCharge = 0;
  /** until when the current facial expression (laugh, pain) stays on */
  private faceUntil = 0;
  private readonly brain: StateMachine<PanzaState, MonsignorPanza>;

  constructor(scene: Phaser.Scene, bus: GameBus, target: Player) {
    super(scene, bus, target, BOSS_ARENA_X + ARENA.spawn, GROUND_Y, 'panza', BOSS.hp);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    body.setSize(80, 54).setOffset(8, 8);
    this.setDepth(44);
    this.brain = new StateMachine<PanzaState, MonsignorPanza>(
      this,
      {
        entering: {
          enter: () => this.setVelocityX(-BOSS.entrySpeed),
          update: () => (this.x <= BOSS_ARENA_X + ARENA.stop ? 'waiting' : undefined),
        },
        waiting: {
          enter: () => {
            this.setVelocityX(0);
            this.bus.emit('boss:arrived');
          },
        },
        fighting: { update: () => this.fight() },
        telegraph: {
          enter: () => {
            this.nextCharge = this.scene.time.now + BOSS.charge.everyMs;
            this.laugh(800);
            this.say(line('monsignor-panza', 'carica'), 900, true);
          },
          update: (_, fsm) => {
            this.setVelocityX(0);
            this.x += Math.random() < 0.5 ? -1 : 1; // revving the engine
            return fsm.elapsed > BOSS.charge.telegraphMs ? 'charge' : undefined;
          },
        },
        charge: {
          enter: () => {
            this.setVelocityX(-BOSS.charge.speed);
            this.bus.emit('fx:shake', { durationMs: 300, intensity: 0.008 });
          },
          update: () => (this.x <= BOSS_ARENA_X + ARENA.chargeEnd ? 'recover' : undefined),
        },
        recover: {
          enter: () => {
            this.setVelocityX(0);
            this.bus.emit('fx:shake', { durationMs: 200, intensity: 0.015 });
            sfx.land();
          },
          update: (_, fsm) => (fsm.elapsed >= BOSS.charge.pauseMs ? 'returning' : undefined),
        },
        returning: {
          update: () => {
            this.setVelocityX(BOSS.charge.returnSpeed);
            return this.x >= BOSS_ARENA_X + ARENA.home ? 'fighting' : undefined;
          },
          exit: () => this.setVelocityX(0),
        },
        defeated: {},
      },
      'entering',
    );
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

  /** True while he can hurt and be hurt (not during the entrance, the intro dialogue or after defeat). */
  get fighting() {
    return COMBAT_STATES.has(this.brain.current);
  }

  /** Called by the arena once the intro dialogue is over. */
  startFight() {
    const t = this.scene.time.now;
    this.nextVolley = t + BOSS.firstAttackMs.volley;
    this.nextSummon = t + BOSS.firstAttackMs.summon;
    this.nextBells = t + BOSS.firstAttackMs.bells;
    this.nextCharge = t + BOSS.firstAttackMs.charge;
    this.brain.transition('fighting');
  }

  protected think(time: number, deltaMs: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    // wheels bounce a bit, it's an old vehicle
    this.y = GROUND_Y + (Math.floor(time / 120) % 2 === 0 && body.velocity.x !== 0 ? -1 : 0);
    if (time > this.faceUntil) this.setFrame(0);
    this.brain.update(deltaMs);
  }

  /** Regular fight: patrols the arena and fires every attack whose cooldown is over. */
  private fight(): PanzaState | undefined {
    const time = this.scene.time.now;
    const p = this.target;
    const phase = this.stats;

    if (Math.abs(this.x - this.targetX) < 4) {
      this.targetX = BOSS_ARENA_X + ARENA.patrol[0] + Math.random() * (ARENA.patrol[1] - ARENA.patrol[0]);
    }
    this.setVelocityX(Math.sign(this.targetX - this.x) * phase.speed);

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
      this.ringBells(p);
    }
    return phase.charges && time > this.nextCharge ? 'telegraph' : undefined;
  }

  private volley(p: Player) {
    const sx = this.x - 46;
    const sy = this.y - 32;
    const { spacing, flightTime, flightTimeStep } = BOSS.volley;
    const n = this.stats.volleyCount;
    for (let i = 0; i < n; i++) {
      const t = flightTime + i * flightTimeStep;
      const [vx, vy] = lob(sx, sy, p.x + (i - (n - 1) / 2) * spacing, p.y - 8, t, bulletGravity('goccia'));
      this.bus.emit('enemy:fired', { kind: 'goccia', x: sx, y: sy, vx, vy });
    }
    sfx.holyWater();
  }

  /** Bells fall around Paolone, one after the other. */
  private ringBells(p: Player) {
    sfx.bell();
    BOSS.bells.offsets.forEach((off, i) => {
      this.scene.time.delayedCall(i * BOSS.bells.staggerMs, () => {
        const x = Phaser.Math.Clamp(p.x + off, BOSS_ARENA_X + ARENA.bells[0], BOSS_ARENA_X + ARENA.bells[1]);
        this.bus.emit('enemy:fired', { kind: 'campana', x, y: -12, vx: 0, vy: 0 });
      });
    });
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
    this.brain.transition('defeated');
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
