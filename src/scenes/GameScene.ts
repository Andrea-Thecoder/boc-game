import Phaser from 'phaser';
import { BOSS_ARENA_X, DEBUG, GROUND_Y, H, LEVEL_WIDTH, W } from '../config';
import { audio } from '../audio/engine';
import { music } from '../audio/music';
import { sfx } from '../audio/sfx';
import { type EnemyBullet } from '../entities/EnemyBullet';
import { Pickup, type PickupKind } from '../entities/Pickup';
import { Player } from '../entities/Player';
import type { Sukkino } from '../entities/Sukkino';
import { Enemy } from '../entities/enemies/Enemy';
import { Beghina, Chierichetto, Sacrestano } from '../entities/enemies/Faithful';
import { MonsignorPanza } from '../entities/enemies/MonsignorPanza';
import { LEVEL1, type EnemyType, type SpawnDef } from '../level/level1';
import { Bubble, popText } from '../ui/Bubble';
import { Controls } from '../ui/Controls';
import { clean, kappa, pick } from '../ui/text';
import { WEAPONS } from '../weapons';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

export default class GameScene extends Phaser.Scene {
  player!: Player;
  private controls!: Controls;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private sukkini!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private pickups!: Phaser.GameObjects.Group;
  private hills!: Phaser.GameObjects.TileSprite;
  private houses!: Phaser.GameObjects.TileSprite;
  private waveIdx = 0;
  private score = 0;
  private boss: MonsignorPanza | null = null;
  private bossLocked = false;
  private finished = false;
  private paused = false;
  private pauseText!: Phaser.GameObjects.BitmapText;
  private bubbles = new Map<object, Bubble>();
  private splashEmitters = new Map<number, Emitter>();
  private dustEmitter!: Emitter;
  private sparkEmitter!: Emitter;
  private fireEmitter!: Emitter;
  private nextNonnaDrop = 0;
  private startedAt = 0;

  constructor() {
    super('game');
  }

  create() {
    this.waveIdx = 0;
    this.score = 0;
    this.boss = null;
    this.bossLocked = false;
    this.finished = false;
    this.paused = false;
    this.bubbles.clear();
    this.splashEmitters.clear();
    this.startedAt = this.time.now;

    this.physics.world.setBounds(0, -200, LEVEL_WIDTH, H + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, LEVEL_WIDTH, H);
    cam.setRoundPixels(true);

    // parallax backdrop
    this.add.image(0, 0, 'bg-sky').setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.hills = this.add.tileSprite(0, 0, W, H, 'bg-hills').setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.houses = this.add.tileSprite(0, 0, W, H, 'bg-houses').setOrigin(0).setScrollFactor(0).setDepth(-80);
    this.add
      .image(BOSS_ARENA_X + 175, GROUND_Y + 2, 'chiesa')
      .setOrigin(0.5, 1)
      .setDepth(-70);
    this.add
      .tileSprite(0, GROUND_Y, LEVEL_WIDTH, H - GROUND_Y, 'ground')
      .setOrigin(0)
      .setDepth(10);

    // solids
    this.ground = this.physics.add.staticGroup();
    const g = this.add.zone(LEVEL_WIDTH / 2, GROUND_Y + 10, LEVEL_WIDTH, 20);
    this.ground.add(g);
    this.platforms = this.physics.add.staticGroup();
    this.buildProps();

    // actors
    this.sukkini = this.add.group();
    this.enemies = this.add.group();
    this.enemyBullets = this.add.group();
    this.pickups = this.add.group();
    this.player = new Player(this, 40, GROUND_Y - 1);
    this.controls = new Controls(this);
    for (const p of LEVEL1.pickups) this.pickups.add(new Pickup(this, p.kind, p.x, p.y));

    this.buildEffects();
    this.setupCollisions();

    this.pauseText = this.add
      .bitmapText(W / 2, H / 2, 'pxo', 'PAUSA', 14)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);
    this.input.keyboard!.on('keydown-M', () => audio.toggleMute());

    this.scene.launch('hud');
    this.syncHud();
    music.play('level');

    // mission card + opening line
    const card = this.add
      .bitmapText(W / 2, 58, 'pxo', clean(`MISSIONE 1\n${LEVEL1.name}`), 7)
      .setOrigin(0.5)
      .setCenterAlign()
      .setScrollFactor(0)
      .setDepth(2000)
      .setTint(0xe8b830);
    this.tweens.add({ targets: card, alpha: 0, delay: 2200, duration: 600, onComplete: () => card.destroy() });
    this.time.delayedCall(700, () =>
      this.say(this.player, 'Monsignor Panza vuole conquistare il Vaticano? Prima deve passare da Paolone!', 2600),
    );

    if (DEBUG) this.physics.world.createDebugGraphic();
  }

  // -------------------------------------------------------------------------------------------
  // level building
  // -------------------------------------------------------------------------------------------

  private buildProps() {
    for (const p of LEVEL1.props) {
      const y = p.y ?? GROUND_Y + 1;
      this.add
        .image(p.x, y, p.key)
        .setOrigin(0.5, 1)
        .setDepth(p.depth ?? 20);
      if (p.platform) this.addPlatform(p.x + p.platform.dx, p.platform.top, p.platform.w);
      if (p.key === 'cartello') {
        this.add
          .bitmapText(p.x, y - 22, 'px', 'CHIAPPETONS', 6)
          .setOrigin(0.5)
          .setTint(0x120b16)
          .setDepth(26);
      }
    }
  }

  private addPlatform(cx: number, top: number, w: number) {
    const z = this.add.zone(cx, top + 2, w, 4);
    this.platforms.add(z);
    const body = z.body as Phaser.Physics.Arcade.StaticBody;
    body.checkCollision.down = false;
    body.checkCollision.left = false;
    body.checkCollision.right = false;
  }

  private buildEffects() {
    const base = { emitting: false, lifespan: 500 };
    this.dustEmitter = this.add
      .particles(0, 0, 'puff', {
        ...base,
        speedX: { min: -60, max: 60 },
        speedY: { min: -20, max: -5 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: 0xa9a192,
        lifespan: 450,
      })
      .setDepth(80);
    this.sparkEmitter = this.add
      .particles(0, 0, 'dot', {
        ...base,
        speed: { min: 10, max: 45 },
        scale: { start: 1, end: 0 },
        tint: [0xe8b830, 0xf4efe4],
        lifespan: 600,
      })
      .setDepth(80);
    this.fireEmitter = this.add
      .particles(0, 0, 'puff', {
        ...base,
        speed: { min: 30, max: 120 },
        scale: { start: 1.8, end: 0 },
        tint: [0xf08a1c, 0xe8b830, 0xb3242f, 0x4a4352],
        lifespan: 700,
        gravityY: -60,
      })
      .setDepth(80);
  }

  private setupCollisions() {
    const ph = this.physics;
    const notDropping = () => this.time.now >= this.player.dropUntil;
    ph.add.collider(this.player, this.ground);
    ph.add.collider(this.player, this.platforms, undefined, notDropping);
    ph.add.collider(this.enemies, this.ground);
    ph.add.collider(this.enemies, this.platforms);
    ph.add.collider(this.pickups, this.ground);

    const brickHitsSurface = (s: unknown) => {
      const brick = s as Sukkino;
      if (brick.active) brick.onSurface();
    };
    ph.add.collider(this.sukkini, this.ground, brickHitsSurface);
    ph.add.collider(this.sukkini, this.platforms, brickHitsSurface);

    ph.add.overlap(this.sukkini, this.enemies, (s, e) => {
      const brick = s as Sukkino,
        enemy = e as Enemy;
      if (!brick.active || enemy.dead) return;
      if (enemy instanceof MonsignorPanza && !enemy.fighting) {
        brick.splat();
        return;
      }
      enemy.hurt(brick.damage, brick.x);
      brick.splat();
    });
    ph.add.overlap(this.sukkini, this.enemyBullets, (s, b) => {
      const bullet = b as EnemyBullet;
      if (bullet.kind === 'fumo' || bullet.kind === 'ostia') {
        this.dust(bullet.x, bullet.y + 4);
        bullet.destroy();
        (s as Sukkino).splat();
      }
    });

    const bulletHitsSurface = (b: unknown) => {
      const bullet = b as EnemyBullet;
      if (!bullet.active) return;
      if (bullet.kind === 'campana') {
        sfx.bell();
        this.dust(bullet.x, bullet.y + 6);
        this.cameras.main.shake(80, 0.004);
      } else if (bullet.kind === 'goccia') {
        this.splash(bullet.x, bullet.y, 0x7fc8f0, 4);
      } else {
        this.dust(bullet.x, bullet.y);
      }
      bullet.destroy();
    };
    const solidBullet = (b: unknown) => (b as EnemyBullet).solid;
    ph.add.collider(this.enemyBullets, this.ground, bulletHitsSurface, solidBullet);
    ph.add.collider(this.enemyBullets, this.platforms, bulletHitsSurface, (b) => (b as EnemyBullet).kind === 'ostia');

    ph.add.overlap(this.player, this.enemyBullets, (_p, b) => {
      const bullet = b as EnemyBullet;
      if (this.player.invulnerable || !bullet.active) return;
      this.player.hurt(bullet.x);
      if (bullet.kind === 'goccia') this.splash(bullet.x, bullet.y, 0x7fc8f0, 4);
      else this.dust(bullet.x, bullet.y);
      bullet.destroy();
    });
    ph.add.overlap(this.player, this.enemies, (_p, e) => {
      if (e instanceof MonsignorPanza && e.fighting) this.player.hurt(e.x);
    });
    ph.add.overlap(this.player, this.pickups, (_p, k) => this.collect(k as Pickup));
  }

  // -------------------------------------------------------------------------------------------
  // main loop
  // -------------------------------------------------------------------------------------------

  update(time: number) {
    this.controls.update();
    if (this.controls.pausePressed && !this.finished) this.togglePause();
    if (this.paused) return;

    const cam = this.cameras.main;
    this.player.update(time, this.controls);

    // camera only moves forward
    if (!this.bossLocked) {
      const target = this.player.x - W * 0.38;
      if (target > cam.scrollX) cam.scrollX = Math.min(BOSS_ARENA_X, cam.scrollX + (target - cam.scrollX) * 0.14);
    } else {
      cam.scrollX = BOSS_ARENA_X;
    }
    this.player.minX = cam.scrollX + 10;
    this.player.maxX = this.bossLocked ? BOSS_ARENA_X + W - 10 : LEVEL_WIDTH - 10;
    this.hills.tilePositionX = cam.scrollX * 0.15;
    this.houses.tilePositionX = cam.scrollX * 0.45;

    // waves
    const wave = LEVEL1.waves[this.waveIdx];
    if (wave && this.player.x >= wave.trigger) {
      this.waveIdx++;
      wave.spawns.forEach((s) => this.time.delayedCall(s.delay ?? 0, () => this.spawn(s)));
      if (wave.line) this.say(this.player, wave.line, 2200);
    }

    // boss
    if (!this.bossLocked && cam.scrollX >= BOSS_ARENA_X - 1 && this.player.x > BOSS_ARENA_X + 70) this.startBoss();
    if (this.boss?.fighting && time > this.nextNonnaDrop) this.nonnaDrop(time);
  }

  private togglePause() {
    this.paused = !this.paused;
    this.pauseText.setVisible(this.paused);
    if (this.paused) {
      this.physics.world.pause();
      this.time.paused = true;
      this.tweens.pauseAll();
      this.anims.pauseAll();
    } else {
      this.physics.world.resume();
      this.time.paused = false;
      this.tweens.resumeAll();
      this.anims.resumeAll();
    }
  }

  private spawn(s: SpawnDef) {
    if (this.finished) return;
    const cam = this.cameras.main;
    const x = s.at === 'right' ? cam.scrollX + W + 14 : s.at === 'left' ? cam.scrollX - 14 : s.at;
    const y = (s.y ?? GROUND_Y) - 1;
    const ctor: Record<EnemyType, new (gs: GameScene, x: number, y: number) => Enemy> = {
      chierichetto: Chierichetto,
      beghina: Beghina,
      sacrestano: Sacrestano,
    };
    this.addEnemy(new ctor[s.type](this, x, y));
  }

  // -------------------------------------------------------------------------------------------
  // boss
  // -------------------------------------------------------------------------------------------

  private startBoss() {
    this.bossLocked = true;
    this.player.frozen = true;
    music.play('boss');
    this.cameras.main.flash(250, 120, 20, 40);
    this.boss = new MonsignorPanza(this);
    this.addEnemy(this.boss);
    this.syncHud();
  }

  onBossArrived() {
    const boss = this.boss!;
    boss.setFrame(1);
    this.say(boss, 'Pentiti, ciccione! Prima Chiappetons, poi il Vaticano sarà MIO!', 2300, true);
    this.time.delayedCall(3300, () => this.say(this.player, 'Prima devi passare dal mio succhino al tamarindo!', 2000));
    this.time.delayedCall(5900, () => {
      this.player.frozen = false;
      boss.startFight();
      this.nextNonnaDrop = this.time.now + 12000;
    });
  }

  /** A nonna on a balcony throws Paolone a snack. Grandmothers always help. */
  private nonnaDrop(time: number) {
    this.nextNonnaDrop = time + 14000;
    const kind = pick<PickupKind>(['ace', 'pera', 'pesca', 'panzerotto', 'panzerotto']);
    const x = BOSS_ARENA_X + 30 + Math.random() * 120;
    const k = new Pickup(this, kind, x, -10, false);
    this.pickups.add(k);
    this.say({ x, y: 36 }, pick(['Tiè, Paolì! Mangia!', 'Sei sciupato, mangia!', 'Forza Paolone!']), 1300);
  }

  onBossDefeated() {
    this.finished = true;
    this.boss = null;
    this.syncHud();
    music.play('victory');
    this.player.frozen = true;
    this.time.delayedCall(600, () =>
      this.say(this.player, 'Il Vaticano può dormire tranquillo. Ora però mi serve un succhino per me.', 3000),
    );
    this.time.delayedCall(5200, () => this.endScene('victory'));
  }

  // -------------------------------------------------------------------------------------------
  // events from entities
  // -------------------------------------------------------------------------------------------

  addSukkino(s: Sukkino) {
    this.sukkini.add(s);
  }
  addEnemyBullet(b: EnemyBullet) {
    this.enemyBullets.add(b);
  }
  addEnemy(e: Enemy) {
    this.enemies.add(e);
  }

  aliveEnemies(): number {
    return this.enemies.getChildren().filter((e) => !(e as Enemy).dead && !(e as Enemy).isBoss).length;
  }

  meleeHit(area: Phaser.Geom.Rectangle, dmg: number, facing: number) {
    let hit = false;
    for (const child of this.enemies.getChildren()) {
      const e = child as Enemy;
      if (e.dead || !Phaser.Geom.Rectangle.Overlaps(area, e.getBounds())) continue;
      e.hurt(dmg, this.player.x - facing * 10, 170);
      hit = true;
    }
    for (const child of [...this.enemyBullets.getChildren()]) {
      const b = child as EnemyBullet;
      if ((b.kind === 'ostia' || b.kind === 'fumo') && Phaser.Geom.Rectangle.Overlaps(area, b.getBounds())) {
        this.dust(b.x, b.y);
        b.destroy();
      }
    }
    if (hit) {
      this.cameras.main.shake(80, 0.006);
      popText(this, area.centerX, area.y - 4, 'PANZATA!', 0xf4efe4);
    }
  }

  onEnemyKilled(e: Enemy, points: number) {
    this.score += points;
    popText(this, e.x, e.y - 30, `+${points}`);
    this.syncHud();
  }

  private collect(k: Pickup) {
    if (!k.active || this.player.dead) return;
    this.sparkle(k.x, k.y - 6, 10);
    sfx.pickup();
    if (k.kind === 'panzerotto') {
      this.player.heal(2);
      this.say(this.player, pick(['Panzerotto! Mamma mia che bontà!', 'Questo lo mangio subito!']), 1500);
      popText(this, k.x, k.y - 16, '+2 VITA', 0xb3242f);
    } else {
      this.player.setWeapon(k.kind);
      this.say(this.player, WEAPONS[k.kind].shout, 1800);
      sfx.burp();
    }
    this.score += 50;
    this.syncHud();
    k.destroy();
  }

  // -------------------------------------------------------------------------------------------
  // debug / test hooks: used only by src/debug/testHooks.ts (?e2e, ?debug)
  // -------------------------------------------------------------------------------------------

  /** Skips every wave and puts Paolone just before the boss arena. */
  debugSkipToBossArena() {
    this.waveIdx = LEVEL1.waves.length;
    this.cameras.main.scrollX = BOSS_ARENA_X - 120;
    this.player.setPosition(BOSS_ARENA_X - 40, GROUND_Y - 1);
  }

  debugGodMode() {
    this.player.maxHp = 999;
    this.player.hp = 999;
    this.syncHud();
  }

  debugKillPlayer() {
    this.player.hp = 1;
    this.player.hurt(this.player.x + 10);
  }

  onPlayerDeath() {
    if (this.finished) return;
    this.finished = true;
    music.stop();
    this.say(this.player, pick(['Mannaggia...', 'Mi sento... calante...', 'Ditelo a mamma...']), 1500);
    this.time.delayedCall(2200, () => this.endScene('gameover'));
  }

  private endScene(next: 'gameover' | 'victory') {
    this.scene.stop('hud');
    this.scene.start(next, { score: this.score, seconds: Math.floor((this.time.now - this.startedAt) / 1000) });
  }

  syncHud() {
    const r = this.registry;
    r.set('hp', this.player?.hp ?? 5);
    r.set('maxHp', this.player?.maxHp ?? 5);
    r.set('weapon', this.player?.weapon.flavour ?? 'tamarindo');
    r.set('ammo', this.player?.ammo ?? Infinity);
    r.set('score', this.score);
    r.set('bossHp', this.boss ? Math.max(0, this.boss.hp / this.boss.maxHp) : -1);
  }

  // -------------------------------------------------------------------------------------------
  // fx helpers
  // -------------------------------------------------------------------------------------------

  say(target: { x: number; y: number; active?: boolean }, text: string, duration = 2000, shout = false) {
    const isPlayer = target === this.player;
    if (!isPlayer && !shout && this.bubbles.size > 3) return;
    this.bubbles.get(target)?.destroy();
    const yOff = isPlayer ? 38 : target instanceof MonsignorPanza ? 66 : target instanceof Enemy ? 30 : 4;
    const b = new Bubble(this, target, isPlayer ? kappa(text) : text, yOff, duration, { shout });
    this.bubbles.set(target, b);
    b.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.bubbles.get(target) === b) this.bubbles.delete(target);
    });
  }

  splash(x: number, y: number, color: number, n = 9) {
    let em = this.splashEmitters.get(color);
    if (!em) {
      em = this.add
        .particles(0, 0, 'dot', {
          emitting: false,
          speed: { min: 40, max: 130 },
          angle: { min: 200, max: 340 },
          gravityY: 420,
          lifespan: 520,
          scale: { start: 1, end: 0.4 },
          tint: color,
        })
        .setDepth(80);
      this.splashEmitters.set(color, em);
    }
    em.explode(n, x, y);
    if (n > 5) sfx.splash();
  }

  dust(x: number, y: number) {
    this.dustEmitter.explode(6, x, y);
  }
  sparkle(x: number, y: number, n = 3) {
    this.sparkEmitter.explode(n, x, y);
  }
  explosion(x: number, y: number) {
    this.fireEmitter.explode(14, x, y);
    this.sparkEmitter.explode(6, x, y);
  }
}
