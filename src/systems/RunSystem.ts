import type Phaser from 'phaser';
import { H, W } from '../config';
import { line } from '../content';
import { clean } from '../ui/text';
import type { DialogueSystem } from './DialogueSystem';
import type { GameContext } from './GameContext';
import type { ScoreSystem } from './ScoreSystem';

export type RunOutcome = 'victory' | 'gameover';

/** The life cycle of one run: mission card, pause, death, victory and the hand-off to the end screen. */
export class RunSystem {
  private finished = false;
  private pausedState = false;
  private readonly startedAt: number;
  private readonly pauseText: Phaser.GameObjects.BitmapText;

  constructor(
    private readonly ctx: GameContext,
    private readonly dialogue: DialogueSystem,
    private readonly score: ScoreSystem,
    levelName: string,
  ) {
    const scene = ctx.scene;
    this.startedAt = scene.time.now;
    this.pauseText = scene.add
      .bitmapText(W / 2, H / 2, 'pxo', 'PAUSA', 14)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    const card = scene.add
      .bitmapText(W / 2, 58, 'pxo', clean(`MISSIONE 1\n${levelName}`), 7)
      .setOrigin(0.5)
      .setCenterAlign()
      .setScrollFactor(0)
      .setDepth(2000)
      .setTint(0xe8b830);
    scene.tweens.add({ targets: card, alpha: 0, delay: 2200, duration: 600, onComplete: () => card.destroy() });
    scene.time.delayedCall(700, () => dialogue.say(ctx.player, line('paolone', 'intro_livello'), 2600));

    ctx.bus.on('player:died', () => this.gameOver());
    ctx.bus.on('boss:defeated', () => this.victory());
  }

  get paused(): boolean {
    return this.pausedState;
  }

  /** Toggles pause on the pause button (ignored once the run is over). */
  handlePause(pausePressed: boolean) {
    if (!pausePressed || this.finished) return;
    const scene = this.ctx.scene;
    this.pausedState = !this.pausedState;
    this.pauseText.setVisible(this.pausedState);
    if (this.pausedState) {
      scene.physics.world.pause();
      scene.time.paused = true;
      scene.tweens.pauseAll();
      scene.anims.pauseAll();
    } else {
      scene.physics.world.resume();
      scene.time.paused = false;
      scene.tweens.resumeAll();
      scene.anims.resumeAll();
    }
  }

  private gameOver() {
    if (this.finished) return;
    this.finished = true;
    this.ctx.bus.emit('run:over', { outcome: 'gameover' });
    this.dialogue.say(this.ctx.player, line('paolone', 'morte'), 1500);
    this.ctx.scene.time.delayedCall(2200, () => this.end('gameover'));
  }

  private victory() {
    this.finished = true;
    this.ctx.bus.emit('run:over', { outcome: 'victory' });
    this.ctx.player.frozen = true;
    this.ctx.scene.time.delayedCall(600, () =>
      this.dialogue.say(this.ctx.player, line('paolone', 'boss_sconfitto'), 3000),
    );
    this.ctx.scene.time.delayedCall(5200, () => this.end('victory'));
  }

  private end(next: RunOutcome) {
    const scene = this.ctx.scene;
    scene.scene.stop('hud');
    scene.scene.start(next, {
      score: this.score.total,
      seconds: Math.floor((scene.time.now - this.startedAt) / 1000),
    });
  }
}
