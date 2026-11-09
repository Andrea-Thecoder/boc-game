import type { ControlsDef, KeyName } from '../content/schemas';

/*
 * Builds the CONTROLS table of the options from the real bindings (content/data/controls.json),
 * so the table can never show a key the game does not use. Pure module: unit tested.
 */

const ARROWS: ReadonlySet<KeyName> = new Set(['LEFT', 'RIGHT', 'UP', 'DOWN']);

const DIGITS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];

/** How a key is written in the table (the pixel font has no arrow glyphs). */
export function keyLabel(key: KeyName): string {
  const digit = DIGITS.indexOf(key);
  if (digit >= 0) return String(digit);
  return key === 'BACKSPACE' ? 'BKSP' : key;
}

export interface ControlsRow {
  label: string;
  keys: string;
}

/**
 * One row per table entry. Actions shown together (MOVE = left + right) are paired key by key:
 * [LEFT, A] + [RIGHT, D] → "ARROWS / A D".
 */
export function controlsTable(def: ControlsDef): ControlsRow[] {
  return def.table.map(({ label, actions }) => {
    const lists = actions.map((a) => def.keyboard[a]);
    const columns = Math.max(...lists.map((l) => l.length));
    const groups = Array.from({ length: columns }, (_, i) =>
      lists.map((l) => l[i]).filter((k): k is KeyName => k !== undefined),
    );
    const keys = groups.map((g) =>
      g.length > 1 && g.every((k) => ARROWS.has(k)) ? 'ARROWS' : g.map(keyLabel).join(' '),
    );
    return { label, keys: keys.join(' / ') };
  });
}
