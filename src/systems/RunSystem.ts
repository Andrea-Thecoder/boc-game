import { W } from '../config';
import { line } from '../content';
import { clean } from '../ui/text';
import type { DialogueSystem } from './DialogueSystem';
import type { GameContext } from './GameContext';
import type { ScoreSystem } from './ScoreSystem';

/** End screens, named like their scenes. */
type EndScreen = 'victory' | 'gameover';

/** The life cycle of one run: mission card, pause, death, victory, quitting and the hand-off to the next screen. */
export class RunSystem {
  private finished = false;
  private pausedState = false;
  private readonly startedAt: number;
  /** frame of the last resume: a pause press in that same frame belongs to the menu that just closed */
  private resumedOnFrame = -1;

  constructor(
    private readonly ctx: GameContext,
    private readonly dialogue: DialogueSystem,
    private readonly score: ScoreSystem,
    levelName: string,
  ) {
    const scene = ctx.scene;
    this.startedAt = scene.time.now;

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

  /**
   * Pause button pressed during the level: freezes the world and asks for the pause menu (`run:paused`).
   * While paused the menu owns the input: resuming goes through `resume()`.
   */
  handlePause(pausePressed: boolean) {
    const frame = this.ctx.scene.game.getFrame();
    if (!pausePressed || this.finished || this.pausedState || frame === this.resumedOnFrame) return;
    this.pausedState = true;
    this.freeze(true);
    this.ctx.bus.emit('run:paused');
  }

  /** Back to the game (RESUME in the pause menu). */
  resume() {
    if (!this.pausedState) return;
    this.pausedState = false;
    this.resumedOnFrame = this.ctx.scene.game.getFrame();
    this.freeze(false);
  }

  /** Leaves the run from the pause menu: it counts as abandoned, then back to the title. */
  quit() {
    if (this.finished) return;
    this.finished = true;
    // the animation manager is global: leaving it paused would freeze the title screen too
    this.freeze(false);
    this.pausedState = false;
    this.ctx.bus.emit('run:over', { outcome: 'quit' });
    const scene = this.ctx.scene;
    scene.scene.stop('hud');
    scene.scene.start('title');
  }

  private freeze(on: boolean) {
    const scene = this.ctx.scene;
    if (on) {
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

  private end(next: EndScreen) {
    const scene = this.ctx.scene;
    scene.scene.stop('hud');
    scene.scene.start(next, {
      score: this.score.total,
      seconds: Math.floor((scene.time.now - this.startedAt) / 1000),
    });
  }
}
