import { Pool } from '../core/Pool';
import { EnemyBullet } from '../entities/EnemyBullet';
import { Sukkino } from '../entities/Sukkino';
import type { GameContext } from './GameContext';

/**
 * Max projectiles in flight. Beyond these a throw is silently skipped: with ACE at ~10 throws/s
 * and a 4 s brick lifetime the cap is never reached in normal play.
 */
export const PROJECTILE_LIMITS = { sukkini: 60, enemyBullets: 60 } as const;
const PREWARM = { sukkini: 16, enemyBullets: 16 } as const;

/** Owns the pools of juice bricks and enemy bullets and fires them when entities ask. */
export class ProjectileSystem {
  private readonly sukkini: Pool<Sukkino>;
  private readonly bullets: Pool<EnemyBullet>;

  constructor(ctx: GameContext) {
    const { scene, bus, groups } = ctx;

    this.sukkini = new Pool<Sukkino>({
      create: () => {
        const brick = new Sukkino(scene, bus, (b) => this.sukkini.release(b));
        groups.sukkini.add(brick);
        return brick;
      },
      onRelease: (b) => b.disableBody(true, true),
      max: PROJECTILE_LIMITS.sukkini,
      prewarm: PREWARM.sukkini,
    });

    this.bullets = new Pool<EnemyBullet>({
      create: () => {
        const bullet = new EnemyBullet(scene, (b) => this.bullets.release(b));
        groups.enemyBullets.add(bullet);
        return bullet;
      },
      onRelease: (b) => b.disableBody(true, true),
      max: PROJECTILE_LIMITS.enemyBullets,
      prewarm: PREWARM.enemyBullets,
    });

    bus.on('player:threw', ({ weapon, x, y, angles }) => {
      for (const angle of angles) this.sukkini.acquire()?.fire(weapon, x, y, angle);
    });
    bus.on('enemy:fired', ({ kind, x, y, vx, vy }) => this.bullets.acquire()?.fire(kind, x, y, vx, vy));
  }

  /** Projectiles currently in flight (debug / tests). */
  get inFlight() {
    return { sukkini: this.sukkini.inUse, enemyBullets: this.bullets.inUse };
  }
}
