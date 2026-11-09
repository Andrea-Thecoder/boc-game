import type { z } from 'zod';
import {
  FLAVOUR_IDS,
  type BossStats,
  type DialogueFile,
  type LevelDef,
  type PropKind,
  type Speaker,
  type WeaponStats,
  type Flavour,
} from './schemas';

/**
 * Validates one content file and returns its typed data.
 * On failure throws an error naming the file and every wrong field, e.g.
 * `Contenuto non valido in src/content/data/weapons.json: - pera.cooldown: Too small: expected number to be >0`.
 */
export function parseContent<S extends z.ZodType>(schema: S, data: unknown, file: string): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((i) => `  - ${i.path.length ? i.path.join('.') : '(radice)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Contenuto non valido in src/content/data/${file}:\n${details}`);
}

/** The parts of the content that reference each other. */
export interface ReferenceBundle {
  weapons: Record<Flavour, WeaponStats>;
  boss: BossStats;
  props: Record<string, PropKind>;
  levels: Record<string, LevelDef>;
  dialogues: Record<Speaker, DialogueFile>;
}

/**
 * Cross-file checks that a single schema cannot express (a wave quoting a line that does not exist,
 * a level using an unknown prop...). Returns the list of problems, empty when everything is consistent.
 */
export function validateReferences(c: ReferenceBundle): string[] {
  const errors: string[] = [];
  const hasLine = (speaker: Speaker, id: string) => Object.hasOwn(c.dialogues[speaker], id);

  for (const [levelId, level] of Object.entries(c.levels)) {
    level.props.forEach((p, i) => {
      if (!Object.hasOwn(c.props, p.kind)) {
        errors.push(`levels/${levelId}.json props[${i}]: tipo di oggetto "${p.kind}" assente in props.json`);
      }
    });
    level.waves.forEach((w, i) => {
      if (w.line !== undefined && !hasLine('paolone', w.line)) {
        errors.push(`levels/${levelId}.json waves[${i}].line: battuta "${w.line}" assente in dialoghi/paolone.json`);
      }
    });
  }

  c.boss.phases.forEach((ph, i) => {
    if (ph.line !== undefined && !hasLine('monsignor-panza', ph.line)) {
      errors.push(`boss-panza.json phases[${i}].line: battuta "${ph.line}" assente in dialoghi/monsignor-panza.json`);
    }
  });

  // every collectible flavour needs Paolone's pickup line
  for (const flavour of FLAVOUR_IDS) {
    if (flavour !== 'tamarindo' && !hasLine('paolone', `raccolta_${flavour}`)) {
      errors.push(`dialoghi/paolone.json: manca la battuta "raccolta_${flavour}"`);
    }
  }

  if (c.weapons.tamarindo.ammo !== null) {
    errors.push("weapons.json tamarindo.ammo: deve essere null (infinito), è l'arma di riserva");
  }

  return errors;
}
