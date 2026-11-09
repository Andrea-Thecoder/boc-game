import type Phaser from 'phaser';
import { FLAVOURS } from '../art/sprites';
import { sfx } from '../audio/sfx';
import { Pool } from '../core/Pool';
import { clean } from '../ui/text';
import type { GameContext } from './GameContext';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type PopText = Phaser.GameObjects.BitmapText;

const POPUP = { max: 24, prewarm: 8, rise: 18, durationMs: 800, defaultColor: 0xe8b830 } as const;
const hex = (color: string) => parseInt(color.slice(1), 16);

/**
 * Particles, floating texts and screen shake. Pure presentation: never changes the game state.
 * Reacts to game facts (landing, hits, splats) and to `fx:*` requests from entities.
 */
export class FxSystem {
  private readonly splashEmitters = new Map<number, Emitter>();
  private readonly dustEmitter: Emitter;
  private readonly sparkEmitter: Emitter;
  private readonly fireEmitter: Emitter;
  private readonly popups: Pool<PopText>;

  constructor(private readonly ctx: GameContext) {
    const scene = ctx.scene;
    const base = { emitting: false, lifespan: 500 };
    this.dustEmitter = scene.add
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
    this.sparkEmitter = scene.add
      .particles(0, 0, 'dot', {
        ...base,
        speed: { min: 10, max: 45 },
        scale: { start: 1, end: 0 },
        tint: [0xe8b830, 0xf4efe4],
        lifespan: 600,
      })
      .setDepth(80);
    this.fireEmitter = scene.add
      .particles(0, 0, 'puff', {
        ...base,
        speed: { min: 30, max: 120 },
        scale: { start: 1.8, end: 0 },
        tint: [0xf08a1c, 0xe8b830, 0xb3242f, 0x4a4352],
        lifespan: 700,
        gravityY: -60,
      })
      .setDepth(80);
    this.popups = new Pool<PopText>({
      create: () => scene.add.bitmapText(0, 0, 'pxo', '', 7).setOrigin(0.5).setDepth(900),
      onAcquire: (t) => t.setActive(true).setVisible(true).setAlpha(1),
      onRelease: (t) => t.setActive(false).setVisible(false),
      max: POPUP.max,
      prewarm: POPUP.prewarm,
    });
    this.listen();
  }

  private listen() {
    const bus = this.ctx.bus;
    bus.on('player:landed', ({ x, y }) => {
      this.shake(90, 0.006);
      this.dust(x, y);
    });
    bus.on('player:hurt', () => this.shake(140, 0.01));
    bus.on('sukkino:splat', ({ x, y, flavour }) => this.splash(x, y, hex(FLAVOURS[flavour])));
    bus.on('fx:sparkle', ({ x, y, count }) => this.sparkle(x, y, count));
    bus.on('fx:dust', ({ x, y }) => this.dust(x, y));
    bus.on('fx:explosion', ({ x, y }) => this.explosion(x, y));
    bus.on('fx:shake', ({ durationMs, intensity }) => this.shake(durationMs, intensity));
  }

  /** Juice (or holy water) splash; one emitter per colour, created on first use. */
  splash(x: number, y: number, color: number, n = 9) {
    let em = this.splashEmitters.get(color);
    if (!em) {
      em = this.ctx.scene.add
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

  shake(durationMs: number, intensity: number) {
    this.ctx.scene.cameras.main.shake(durationMs, intensity);
  }

  /** Floating "+100" style text, rising and fading out. Pooled. */
  popText(x: number, y: number, text: string, color: number = POPUP.defaultColor) {
    const t = this.popups.acquire();
    if (!t) return;
    t.setText(clean(text)).setTint(color).setPosition(Math.round(x), Math.round(y));
    this.ctx.scene.tweens.add({
      targets: t,
      y: y - POPUP.rise,
      alpha: 0,
      duration: POPUP.durationMs,
      ease: 'Cubic.Out',
      onComplete: () => this.popups.release(t),
    });
  }
}
