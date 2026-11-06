import { BOSS_ARENA_X, BOSS_TRIGGER_OFFSET, GROUND_Y } from '../config';
import { line, type LevelDef, type PickupKind } from '../content';
import { pick } from '../core/random';
import { MonsignorPanza } from '../entities/enemies/MonsignorPanza';
import type { DialogueSystem } from './DialogueSystem';
import type { GameContext } from './GameContext';
import type { PickupSystem } from './PickupSystem';
import type { SpawnSystem } from './SpawnSystem';
import { CONTENT } from '../content';
import { shouldLockArena } from './rules/bossArena';

/** Intro dialogue timings (ms after the boss stops). */
const INTRO = { panzaLineMs: 2300, paoloneReplyAtMs: 3300, paoloneLineMs: 2000, fightAtMs: 5900 } as const;

/**
 * The boss arena: locks the camera, brings in Monsignor Panza, runs the intro dialogue,
 * makes the nonne throw snacks during the fight and reports the boss health to the HUD.
 */
export class BossArenaSystem {
  boss: MonsignorPanza | null = null;
  private locked = false;
  private nextNonnaDrop = 0;

  constructor(
    private readonly ctx: GameContext,
    private readonly deps: { dialogue: DialogueSystem; pickups: PickupSystem; spawn: SpawnSystem },
    private readonly nonnaDrop: LevelDef['boss']['nonnaDrop'],
  ) {
    const bus = ctx.bus;
    bus.on('boss:arrived', () => this.intro());
    bus.on('boss:summonRequested', () => this.summonAltarBoy());
    bus.on('boss:damaged', () => this.publishHp());
    // registered before RunSystem's listener: the HUD bar disappears before the victory sequence
    bus.on('boss:defeated', () => {
      this.boss = null;
      this.publishHp();
    });
    bus.on('hud:changed', () => this.publishHp());
  }

  private publishHp() {
    const b = this.boss;
    this.ctx.scene.registry.set('bossHp', b ? Math.max(0, b.hp / b.maxHp) : -1);
  }

  update(time: number) {
    const { scene, player } = this.ctx;
    if (!this.locked && shouldLockArena(scene.cameras.main.scrollX, player.x, BOSS_ARENA_X, BOSS_TRIGGER_OFFSET)) {
      this.lock();
    }
    if (this.boss?.fighting && time > this.nextNonnaDrop) this.dropSnack(time);
  }

  private lock() {
    const { scene, player, bus } = this.ctx;
    this.locked = true;
    player.frozen = true;
    bus.emit('boss:arenaLocked');
    scene.cameras.main.flash(250, 120, 20, 40);
    this.boss = new MonsignorPanza(scene, bus, player);
    this.deps.spawn.add(this.boss);
    bus.emit('hud:changed');
  }

  private intro() {
    const boss = this.boss;
    if (!boss) return;
    const { scene, player, bus } = this.ctx;
    const { dialogue } = this.deps;
    boss.setFrame(1);
    dialogue.say(boss, line('monsignor-panza', 'intro'), INTRO.panzaLineMs, true);
    scene.time.delayedCall(INTRO.paoloneReplyAtMs, () =>
      dialogue.say(player, line('paolone', 'risposta_boss'), INTRO.paoloneLineMs),
    );
    scene.time.delayedCall(INTRO.fightAtMs, () => {
      player.frozen = false;
      boss.startFight();
      this.nextNonnaDrop = scene.time.now + this.nonnaDrop.firstAfterMs;
      bus.emit('boss:fightStarted');
    });
  }

  /** Monsignor Panza calls his altar boys, if there is room for one more. */
  private summonAltarBoy() {
    const boss = this.boss;
    const { spawn, dialogue } = this.deps;
    if (!boss || spawn.aliveEnemies() >= CONTENT.boss.summon.maxAlive) return;
    boss.laugh(700);
    dialogue.say(boss, line('monsignor-panza', 'evoca'), 900);
    spawn.spawnAt('chierichetto', BOSS_ARENA_X + 335, GROUND_Y - 2);
  }

  /** A nonna on a balcony throws Paolone a snack. Grandmothers always help. */
  private dropSnack(time: number) {
    this.nextNonnaDrop = time + this.nonnaDrop.everyMs;
    const kind: PickupKind = pick(this.nonnaDrop.kinds);
    const x = BOSS_ARENA_X + 30 + Math.random() * 120;
    this.deps.pickups.drop(kind, x);
    this.deps.dialogue.say({ x, y: 36 }, line('nonna', 'lancio'), 1300);
  }

  /** Debug / tests: the arena entry point, just outside the arena. */
  static readonly approachX = BOSS_ARENA_X - 40;
  static readonly approachY = GROUND_Y - 1;
}
