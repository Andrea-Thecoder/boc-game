import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Pickup } from '../entities/Pickup';
import type { Sukkino } from '../entities/Sukkino';
import type { Enemy } from '../entities/enemies/Enemy';
import { MonsignorPanza } from '../entities/enemies/MonsignorPanza';
import type { FxSystem } from './FxSystem';
import type { GameContext } from './GameContext';
import type { PickupSystem } from './PickupSystem';

const HOLY_WATER = 0x7fc8f0;
/** Enemy bullets soft enough to be knocked away by a juice box or a panzata. */
const deflectable = (b: EnemyBullet) => b.kind === 'ostia' || b.kind === 'fumo';

/**
 * Every collision and every hit: bricks vs enemies, bullets vs Paolone, the panzata.
 * Colliders are registered in a fixed order (Arcade resolves them in creation order).
 */
export class CombatSystem {
  constructor(
    private readonly ctx: GameContext,
    private readonly fx: FxSystem,
    pickups: PickupSystem,
  ) {
    const { scene, player, groups, solids } = ctx;
    const ph = scene.physics;
    const notDropping = () => scene.time.now >= player.dropUntil;

    ph.add.collider(player, solids.ground);
    ph.add.collider(player, solids.platforms, undefined, notDropping);
    ph.add.collider(groups.enemies, solids.ground);
    ph.add.collider(groups.enemies, solids.platforms);
    ph.add.collider(groups.pickups, solids.ground);

    const brickHitsSurface = (s: unknown) => {
      const brick = s as Sukkino;
      if (brick.active) brick.onSurface();
    };
    ph.add.collider(groups.sukkini, solids.ground, brickHitsSurface);
    ph.add.collider(groups.sukkini, solids.platforms, brickHitsSurface);

    ph.add.overlap(groups.sukkini, groups.enemies, (s, e) => this.brickHitsEnemy(s as Sukkino, e as Enemy));
    ph.add.overlap(groups.sukkini, groups.enemyBullets, (s, b) => {
      const bullet = b as EnemyBullet;
      if (!deflectable(bullet)) return;
      if (!bullet.active) return;
      this.fx.dust(bullet.x, bullet.y + 4);
      bullet.retire();
      (s as Sukkino).splat();
    });

    const solidBullet = (b: unknown) => (b as EnemyBullet).solid;
    const bulletHitsSurface = (b: unknown) => this.bulletLands(b as EnemyBullet);
    ph.add.collider(groups.enemyBullets, solids.ground, bulletHitsSurface, solidBullet);
    ph.add.collider(
      groups.enemyBullets,
      solids.platforms,
      bulletHitsSurface,
      (b) => (b as EnemyBullet).kind === 'ostia',
    );

    ph.add.overlap(player, groups.enemyBullets, (_p, b) => this.bulletHitsPlayer(b as EnemyBullet));
    ph.add.overlap(player, groups.enemies, (_p, e) => {
      if (e instanceof MonsignorPanza && e.fighting) player.hurt(e.x);
    });
    ph.add.overlap(player, groups.pickups, (_p, k) => pickups.collect(k as Pickup));

    ctx.bus.on('player:panzata', ({ area, damage, facing }) => this.panzata(area, damage, facing));
  }

  /** The panzata: damages enemies in the area and swats away wafers and incense. */
  private panzata(area: Phaser.Geom.Rectangle, dmg: number, facing: number) {
    const { groups, player } = this.ctx;
    let hit = false;
    for (const child of groups.enemies.getChildren()) {
      const e = child as Enemy;
      if (e.dead || !Phaser.Geom.Rectangle.Overlaps(area, e.getBounds())) continue;
      e.hurt(dmg, player.x - facing * 10, 170);
      hit = true;
    }
    for (const child of [...groups.enemyBullets.getChildren()]) {
      const b = child as EnemyBullet;
      if (b.active && deflectable(b) && Phaser.Geom.Rectangle.Overlaps(area, b.getBounds())) {
        this.fx.dust(b.x, b.y);
        b.retire();
      }
    }
    if (hit) {
      this.ctx.scene.cameras.main.shake(80, 0.006);
      this.fx.popText(area.centerX, area.y - 4, 'PANZATA!', 0xf4efe4);
    }
  }

  private brickHitsEnemy(brick: Sukkino, enemy: Enemy) {
    if (!brick.active || enemy.dead) return;
    // the boss is untouchable during his entrance and intro dialogue
    if (!(enemy instanceof MonsignorPanza) || enemy.fighting) enemy.hurt(brick.damage, brick.x);
    brick.splat();
  }

  private bulletLands(bullet: EnemyBullet) {
    if (!bullet.active) return;
    if (bullet.kind === 'campana') {
      sfx.bell();
      this.fx.dust(bullet.x, bullet.y + 6);
      this.ctx.scene.cameras.main.shake(80, 0.004);
    } else if (bullet.kind === 'goccia') {
      this.fx.splash(bullet.x, bullet.y, HOLY_WATER, 4);
    } else {
      this.fx.dust(bullet.x, bullet.y);
    }
    bullet.retire();
  }

  private bulletHitsPlayer(bullet: EnemyBullet) {
    const player = this.ctx.player;
    if (player.invulnerable || !bullet.active) return;
    player.hurt(bullet.x);
    if (bullet.kind === 'goccia') this.fx.splash(bullet.x, bullet.y, HOLY_WATER, 4);
    else this.fx.dust(bullet.x, bullet.y);
    bullet.retire();
  }
}
