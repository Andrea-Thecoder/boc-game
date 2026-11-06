import type Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { popText } from '../ui/Bubble';
import type { GameContext } from './GameContext';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** Particles and floating texts. Pure presentation: never changes the game state. */
export class FxSystem {
  private readonly splashEmitters = new Map<number, Emitter>();
  private readonly dustEmitter: Emitter;
  private readonly sparkEmitter: Emitter;
  private readonly fireEmitter: Emitter;

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

  popText(x: number, y: number, text: string, color?: number) {
    popText(this.ctx.scene, x, y, text, color);
  }
}
