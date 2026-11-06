import Phaser from 'phaser';
import { Enemy } from '../entities/enemies/Enemy';
import { MonsignorPanza } from '../entities/enemies/MonsignorPanza';
import { Bubble } from '../ui/Bubble';
import { kappa } from '../ui/text';
import type { GameContext } from './GameContext';

export type BubbleTarget = { x: number; y: number; active?: boolean };

/** Max bubbles on screen before minor enemy lines are dropped (shouts always show). */
const MAX_BUBBLES = 3;

/** Comic speech bubbles: one per speaker, Paolone always talks with his K. */
export class DialogueSystem {
  private readonly bubbles = new Map<object, Bubble>();

  constructor(private readonly ctx: GameContext) {}

  say(target: BubbleTarget, text: string, duration = 2000, shout = false) {
    const isPlayer = target === this.ctx.player;
    if (!isPlayer && !shout && this.bubbles.size > MAX_BUBBLES) return;
    this.bubbles.get(target)?.destroy();
    const b = new Bubble(this.ctx.scene, target, isPlayer ? kappa(text) : text, this.heightAbove(target), duration, {
      shout,
    });
    this.bubbles.set(target, b);
    b.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.bubbles.get(target) === b) this.bubbles.delete(target);
    });
  }

  /** How high above the speaker's feet the bubble tail goes (depends on the sprite size). */
  private heightAbove(target: BubbleTarget): number {
    if (target === this.ctx.player) return 38;
    if (target instanceof MonsignorPanza) return 66;
    if (target instanceof Enemy) return 30;
    return 4;
  }
}
