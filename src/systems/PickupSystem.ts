import { sfx } from '../audio/sfx';
import { CONTENT, line, lineById, type LevelDef, type PickupKind } from '../content';
import { Pickup } from '../entities/Pickup';
import type { DialogueSystem } from './DialogueSystem';
import type { FxSystem } from './FxSystem';
import type { GameContext } from './GameContext';

/** Places the level pickups and applies their effect when Paolone grabs one. */
export class PickupSystem {
  constructor(
    private readonly ctx: GameContext,
    private readonly fx: FxSystem,
    private readonly dialogue: DialogueSystem,
    level: LevelDef,
  ) {
    for (const p of level.pickups) this.place(p.kind, p.x, p.y, true);
  }

  /** A pickup falling from above (the nonne throw them from the balconies). */
  drop(kind: PickupKind, x: number) {
    this.place(kind, x, -10, false);
  }

  collect(k: Pickup) {
    const player = this.ctx.player;
    if (!k.active || player.dead) return;
    this.fx.sparkle(k.x, k.y - 6, 10);
    sfx.pickup();
    if (k.kind === 'panzerotto') {
      const heal = CONTENT.player.panzerottoHeal;
      player.heal(heal);
      this.dialogue.say(player, line('paolone', 'raccolta_panzerotto'), 1500);
      this.fx.popText(k.x, k.y - 16, `+${heal} VITA`, 0xb3242f);
    } else {
      player.setWeapon(k.kind);
      this.dialogue.say(player, lineById('paolone', `raccolta_${k.kind}`), 1800);
      sfx.burp();
    }
    this.ctx.bus.emit('pickup:collected', { kind: k.kind, x: k.x, y: k.y });
    k.destroy();
  }

  private place(kind: PickupKind, x: number, y: number, floating: boolean) {
    this.ctx.groups.pickups.add(new Pickup(this.ctx.scene, this.ctx.bus, kind, x, y, floating));
  }
}
