import Phaser from 'phaser';
import { BOSS_ARENA_X, DEBUG, GROUND_Y, H, LEVEL_WIDTH } from '../config';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { CONTENT, line, lineById } from '../content';
import { EventBus } from '../core/EventBus';
import { Player } from '../entities/Player';
import { BossArenaSystem } from '../systems/BossArenaSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import type { GameEvents } from '../systems/events';
import { FxSystem } from '../systems/FxSystem';
import type { ActorGroups, GameContext } from '../systems/GameContext';
import { buildLevel } from '../systems/LevelBuilder';
import { PickupSystem } from '../systems/PickupSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { RunSystem } from '../systems/RunSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { LocalStorageSink, browserStorage } from '../systems/telemetry/sinks';
import { TelemetrySystem } from '../systems/telemetry/TelemetrySystem';
import { Controls } from '../ui/Controls';

const LEVEL = CONTENT.levels.level1;

/** Systems of one run, created fresh on every `create()` (retry included). */
interface Systems {
  fx: FxSystem;
  dialogue: DialogueSystem;
  score: ScoreSystem;
  camera: CameraSystem;
  spawn: SpawnSystem;
  pickups: PickupSystem;
  projectiles: ProjectileSystem;
  combat: CombatSystem;
  bossArena: BossArenaSystem;
  telemetry: TelemetrySystem;
  run: RunSystem;
}

/**
 * Level scene. ONLY orchestration: builds the world, creates the systems, wires events and music.
 * Gameplay rules live in `src/systems/`; entities talk to them through the EventBus, never through the scene.
 */
export default class GameScene extends Phaser.Scene {
  player!: Player;
  private bus!: EventBus<GameEvents>;
  private controls!: Controls;
  private systems!: Systems;

  constructor() {
    super('game');
  }

  create() {
    this.physics.world.setBounds(0, -200, LEVEL_WIDTH, H + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, LEVEL_WIDTH, H);
    cam.setRoundPixels(true);

    const level = buildLevel(this, LEVEL);
    this.bus = new EventBus<GameEvents>();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.bus.clear());

    const groups: ActorGroups = {
      sukkini: this.add.group(),
      enemies: this.add.group(),
      enemyBullets: this.add.group(),
      pickups: this.add.group(),
    };
    this.player = new Player(this, this.bus, 40, GROUND_Y - 1);
    this.controls = new Controls(this);
    const ctx: GameContext = { scene: this, bus: this.bus, player: this.player, groups, solids: level.solids };

    // order matters: listeners run in subscription order, colliders in creation order
    const dialogue = new DialogueSystem(ctx);
    const spawn = new SpawnSystem(ctx, LEVEL.waves);
    const fx = new FxSystem(ctx);
    const pickups = new PickupSystem(ctx, fx, dialogue, LEVEL);
    const score = new ScoreSystem(ctx, fx);
    this.systems = {
      fx,
      dialogue,
      score,
      spawn,
      pickups,
      projectiles: new ProjectileSystem(ctx),
      camera: new CameraSystem(ctx, level.parallax),
      combat: new CombatSystem(ctx, fx, pickups),
      bossArena: new BossArenaSystem(ctx, { dialogue, pickups, spawn }, LEVEL.boss.nonnaDrop),
      // before RunSystem: it must see boss:defeated before run:over
      telemetry: new TelemetrySystem(this.bus, new LocalStorageSink(browserStorage()), {
        level: 'level1',
        gameVersion: __APP_VERSION__,
        now: () => Date.now(),
        score: () => score.total,
      }),
      run: new RunSystem(ctx, dialogue, score, LEVEL.name),
    };
    this.wireEvents();

    this.input.keyboard!.on('keydown-M', () => audio.toggleMute());
    this.scene.launch('hud');
    this.bus.emit('hud:changed');
    music.play('level');
    if (DEBUG) this.physics.world.createDebugGraphic();
  }

  /** Cross-system reactions that are pure wiring: dialogue lines and music cues. */
  private wireEvents() {
    const { bus, player } = this;
    const { dialogue } = this.systems;
    bus.on('wave:started', ({ line }) => {
      if (line) dialogue.say(player, lineById('paolone', line), 2200);
    });
    bus.on('weapon:depleted', () => dialogue.say(player, line('paolone', 'munizioni_finite')));
    bus.on('boss:arenaLocked', () => music.play('boss'));
    bus.on('run:over', ({ outcome }) => {
      if (outcome === 'victory') music.play('victory');
      else music.stop();
    });
  }

  update(time: number) {
    const { run, camera, spawn, bossArena } = this.systems;
    this.controls.update();
    run.handlePause(this.controls.pausePressed);
    if (run.paused) return;
    this.player.update(time, this.controls);
    camera.update();
    spawn.update();
    bossArena.update(time);
  }

  // -------------------------------------------------------------------------------------------
  // debug / test hooks: used only by src/debug/testHooks.ts (?e2e, ?debug)
  // -------------------------------------------------------------------------------------------

  /** Skips every wave and puts Paolone just before the boss arena. */
  debugSkipToBossArena() {
    this.systems.spawn.skipAllWaves();
    this.cameras.main.scrollX = BOSS_ARENA_X - 120;
    this.player.setPosition(BossArenaSystem.approachX, BossArenaSystem.approachY);
  }

  debugGodMode() {
    this.player.maxHp = 999;
    this.player.hp = 999;
    this.bus.emit('hud:changed');
  }

  debugKillPlayer() {
    this.player.hp = 1;
    this.player.hurt(this.player.x + 10);
  }
}
