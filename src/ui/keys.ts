import Phaser from 'phaser';
import { CONTENT, type InputAction } from '../content';

const KEY_CODES = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number | undefined>;

/** Key codes bound to an action in content/data/controls.json. */
export function keyCodes(action: InputAction): number[] {
  return CONTENT.controls.keyboard[action].map((name) => {
    const code = KEY_CODES[name];
    if (code === undefined) throw new Error(`controls.json: tasto "${name}" sconosciuto a Phaser`);
    return code;
  });
}

/** True if the key event is one of the keys bound to `action`. */
export function isKeyFor(action: InputAction, e: KeyboardEvent): boolean {
  return keyCodes(action).includes(e.keyCode);
}

/**
 * Calls `handler` when a key bound to `action` is pressed in this scene (held-down repeats ignored).
 * The listener goes away with the scene.
 */
export function onActionKey(scene: Phaser.Scene, action: InputAction, handler: () => void) {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return;
  const listener = (e: KeyboardEvent) => {
    if (!e.repeat && isKeyFor(action, e)) handler();
  };
  keyboard.on('keydown', listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off('keydown', listener));
}
