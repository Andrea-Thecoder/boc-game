import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import type { MenuAction } from '../content';
import { isKeyFor } from './keys';
import { firstEnabled, nextEnabled } from './menuNav';

const TINT = { normal: 0xf4efe4, selected: 0xe8b830, disabled: 0x6b6475 } as const;
const FONT_SIZE = 7;
const PIP_W = 5;

/** Standard pad buttons (W3C "standard" mapping). */
const PAD = { confirm: 0, back: 1, up: 12, down: 13, left: 14, right: 15 } as const;

/** Menu command → action in content/data/controls.json (where the keys are decided). */
const KEY_ACTIONS = {
  up: 'menuUp',
  down: 'menuDown',
  left: 'menuLeft',
  right: 'menuRight',
  confirm: 'confirm',
  back: 'back',
} as const satisfies Record<string, MenuAction>;

type Command = keyof typeof KEY_ACTIONS;

export interface MenuItem {
  label: string;
  /** false = greyed out with a padlock, skipped by the cursor; default true */
  enabled?: boolean;
  /** text shown on the right (ON / OFF, a language...) */
  value?: () => string;
  /** a 0..max value shown as pips and changed with left / right (volumes) */
  steps?: { max: number; value: () => number };
  onConfirm?: () => void;
  onAdjust?: (delta: 1 | -1) => void;
}

export interface MenuOptions {
  x: number;
  /** y of the first row */
  y: number;
  width: number;
  rowHeight?: number;
  /** 'center' = labels centred (main menu); 'split' = label left, value right (options) */
  layout?: 'center' | 'split';
  /** Esc / pad B / Backspace */
  onBack?: () => void;
  depth?: number;
}

interface Row {
  item: MenuItem;
  label: Phaser.GameObjects.BitmapText;
  value?: Phaser.GameObjects.BitmapText;
  pips: Phaser.GameObjects.Image[];
  lock?: Phaser.GameObjects.Image;
}

/**
 * Vertical pixel-art menu driven by keyboard, mouse and gamepad. The cursor is a juice box
 * that skips locked items. Reusable for the title, the options and (later) the pause menu.
 */
export class Menu {
  private readonly rows: Row[];
  /** every game object of the menu, destroyed with it */
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private destroyed = false;
  private readonly cursor: Phaser.GameObjects.Image;
  private readonly cursorTween: Phaser.Tweens.Tween;
  private readonly rowHeight: number;
  private readonly layout: 'center' | 'split';
  private index: number;
  private enabled = true;
  /** cursor x without the bobbing offset */
  private cursorX = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    items: MenuItem[],
    private readonly opts: MenuOptions,
  ) {
    this.rowHeight = opts.rowHeight ?? 13;
    this.layout = opts.layout ?? 'center';
    const depth = opts.depth ?? 20;
    this.rows = items.map((item, i) => this.buildRow(item, opts.y + i * this.rowHeight, depth));
    this.index = Math.max(0, firstEnabled(this.rows.map((r) => this.isEnabled(r.item))));
    this.cursor = this.track(scene.add.image(0, 0, 'sukkino-tamarindo').setAngle(90).setDepth(depth));
    // the juice box nudges towards the selected item
    const bob = { dx: 0 };
    this.cursorTween = scene.tweens.add({
      targets: bob,
      dx: 2,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: () => this.cursor.setX(this.cursorX + Math.round(bob.dx)),
    });
    this.refresh();

    scene.input.keyboard?.on('keydown', this.onKey);
    scene.input.gamepad?.on('down', this.onPad);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Disables input (e.g. while a sub-menu is open). Re-enabling waits one frame, so the key that closed
   * the sub-menu is not also handled here. */
  setEnabled(on: boolean) {
    if (!on) {
      this.enabled = false;
      return;
    }
    this.scene.time.delayedCall(1, () => (this.enabled = true));
  }

  /** Moves the cursor to an item (ignored if it is locked). */
  select(index: number) {
    if (!this.rows[index] || !this.isEnabled(this.rows[index].item)) return;
    this.index = index;
    this.refresh();
  }

  /** Redraws values, pips and the cursor (call after an external change). */
  refresh() {
    this.rows.forEach((row, i) => {
      const on = this.isEnabled(row.item);
      const tint = !on ? TINT.disabled : i === this.index ? TINT.selected : TINT.normal;
      row.label.setTint(tint);
      if (row.value && row.item.value) row.value.setText(row.item.value()).setTint(tint);
      if (row.item.steps) {
        const v = row.item.steps.value();
        row.pips.forEach((pip, p) => pip.setFrame(p < v ? 0 : 1));
      }
    });
    const sel = this.rows[this.index];
    this.cursorX = sel.label.x - (this.layout === 'center' ? sel.label.width / 2 : 0) - 9;
    this.cursor.setPosition(this.cursorX, sel.label.y + 4);
  }

  /** Removes the menu: input listeners and every object it drew. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scene.input.keyboard?.off('keydown', this.onKey);
    this.scene.input.gamepad?.off('down', this.onPad);
    this.cursorTween.remove();
    this.objects.forEach((o) => o.destroy());
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }

  // -------------------------------------------------------------------------------------------

  private isEnabled(item: MenuItem) {
    return item.enabled !== false;
  }

  private buildRow(item: MenuItem, y: number, depth: number): Row {
    const { x, width } = this.opts;
    const center = this.layout === 'center';
    const label = this.track(
      this.scene.add
        .bitmapText(center ? x : x - width / 2, y, 'pxo', item.label, FONT_SIZE)
        .setOrigin(center ? 0.5 : 0, 0)
        .setDepth(depth),
    );
    const right = x + width / 2;
    const row: Row = { item, label, pips: [] };

    if (item.steps) {
      const left = right - item.steps.max * PIP_W;
      for (let p = 0; p < item.steps.max; p++) {
        row.pips.push(
          this.track(
            this.scene.add
              .image(left + p * PIP_W, y + 1, 'ui-pip', 0)
              .setOrigin(0)
              .setDepth(depth),
          ),
        );
      }
    } else if (item.value) {
      row.value = this.track(
        this.scene.add.bitmapText(right, y, 'pxo', item.value(), FONT_SIZE).setOrigin(1, 0).setDepth(depth),
      );
    }
    if (!this.isEnabled(item)) {
      const lockX = row.value ? right - row.value.width - 11 : center ? x + label.width / 2 + 4 : right - 7;
      row.lock = this.track(this.scene.add.image(lockX, y, 'ui-lock').setOrigin(0).setDepth(depth));
    }

    // mouse: hover selects, click confirms (or adjusts a value, depending on which half was clicked)
    const zone = this.track(
      this.scene.add
        .zone(x, y + this.rowHeight / 2 - 2, width + 24, this.rowHeight)
        .setInteractive({ useHandCursor: true }),
    );
    zone.on('pointerover', () => this.hover(row));
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.click(row, pointer.x));
    return row;
  }

  private readonly onKey = (e: KeyboardEvent) => {
    const command = (Object.keys(KEY_ACTIONS) as Command[]).find((c) => isKeyFor(KEY_ACTIONS[c], e));
    if (!command || (e.repeat && (command === 'confirm' || command === 'back'))) return;
    this.handle(command);
  };

  private readonly onPad = (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
    const command = (Object.keys(PAD) as Command[]).find((c) => PAD[c] === button.index);
    if (command) this.handle(command);
  };

  private handle(command: Command) {
    if (!this.enabled) return;
    const row = this.rows[this.index];
    switch (command) {
      case 'up':
      case 'down':
        this.move(command === 'up' ? -1 : 1);
        break;
      case 'left':
      case 'right':
        this.adjust(row, command === 'left' ? -1 : 1);
        break;
      case 'confirm':
        this.confirm(row);
        break;
      case 'back':
        if (this.opts.onBack) {
          sfx.back();
          this.opts.onBack();
        }
        break;
    }
  }

  private move(dir: 1 | -1) {
    const next = nextEnabled(
      this.rows.map((r) => this.isEnabled(r.item)),
      this.index,
      dir,
    );
    if (next === this.index) return;
    this.index = next;
    sfx.cursor();
    this.refresh();
  }

  private adjust(row: Row, delta: 1 | -1) {
    if (!row.item.onAdjust) return;
    row.item.onAdjust(delta);
    this.refresh();
  }

  private confirm(row: Row) {
    if (!this.isEnabled(row.item)) {
      sfx.denied();
      return;
    }
    if (row.item.onConfirm) {
      sfx.select();
      row.item.onConfirm();
      this.refresh();
    } else if (row.item.onAdjust) {
      this.adjust(row, 1);
    }
  }

  private hover(row: Row) {
    const i = this.rows.indexOf(row);
    if (!this.enabled || i === this.index || !this.isEnabled(row.item)) return;
    this.index = i;
    sfx.cursor();
    this.refresh();
  }

  private click(row: Row, pointerX: number) {
    if (!this.enabled) return;
    if (!this.isEnabled(row.item)) {
      sfx.denied();
      return;
    }
    this.index = this.rows.indexOf(row);
    const pips = row.pips;
    if (pips.length && row.item.onAdjust) {
      const mid = (pips[0].x + pips[pips.length - 1].x + PIP_W) / 2;
      this.adjust(row, pointerX < mid ? -1 : 1);
    } else {
      this.confirm(row);
    }
    this.refresh();
  }
}
