import Phaser from 'phaser';
import { W } from '../config';
import { CONTENT } from '../content';
import { onActionKey } from '../ui/keys';
import { Menu } from '../ui/Menu';
import { OverlayScene, type OverlayView } from './OverlayScene';

const TEXT = CONTENT.ui.pauseMenu;
const PANEL = { w: 176, h: 84 } as const;

/** What the level gives the pause menu: it decides nothing about the run by itself. */
export interface PauseActions {
  resume(): void;
  quit(): void;
}

/**
 * Pause menu, launched over the level when the run is paused: RESUME, OPTIONS, MAIN MENU.
 * Leaving the level asks for confirmation first (NO is selected by default).
 */
export default class PauseScene extends OverlayScene {
  protected readonly panelSize = PANEL;
  private actions!: PauseActions;
  private mode: 'main' | 'confirm' = 'main';
  private optionsOpen = false;
  private closing = false;

  constructor() {
    super('pause');
  }

  create(actions: PauseActions) {
    this.actions = actions;
    this.mode = 'main';
    this.optionsOpen = false;
    this.closing = false;
    this.drawFrame();
    // the pause key (P / Esc) also resumes, but only from the main view with no options open on top
    onActionKey(this, 'pause', () => {
      if (this.mode === 'main' && !this.optionsOpen) this.resume();
    });
    this.switchView(() => this.mainView());
  }

  private mainView(selectMainMenu = false): OverlayView {
    this.mode = 'main';
    const header = this.header(TEXT.title);
    const menu = new Menu(
      this,
      [
        { label: TEXT.resume, onConfirm: () => this.resume() },
        { label: TEXT.options, onConfirm: () => this.openOptions() },
        { label: TEXT.mainMenu, onConfirm: () => this.switchView(() => this.confirmView()) },
      ],
      { x: W / 2, y: this.top + 30, width: PANEL.w - 40, onBack: () => this.resume(), depth: 20 },
    );
    if (selectMainMenu) menu.select(2);
    return { menu, extra: [header] };
  }

  private confirmView(): OverlayView {
    this.mode = 'confirm';
    const question = this.header(TEXT.confirmQuestion, 7, this.top + 12);
    const warning = this.add
      .bitmapText(W / 2, this.top + 25, 'px', TEXT.confirmWarning, 6)
      .setOrigin(0.5, 0)
      .setTint(0x8a8394)
      .setDepth(20);
    const back = () => this.switchView(() => this.mainView(true));
    const menu = new Menu(
      this,
      [
        { label: TEXT.no, onConfirm: back },
        { label: TEXT.yes, onConfirm: () => this.quit() },
      ],
      { x: W / 2, y: this.top + 44, width: PANEL.w - 40, onBack: back, depth: 20 },
    );
    return { menu, extra: [question, warning] };
  }

  private openOptions() {
    this.optionsOpen = true;
    this.view?.menu.setEnabled(false);
    this.scene.launch('options');
    this.scene.get('options').events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.optionsOpen = false;
      this.view?.menu.setEnabled(true);
    });
  }

  private resume() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.actions.resume();
  }

  private quit() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.actions.quit();
  }
}
