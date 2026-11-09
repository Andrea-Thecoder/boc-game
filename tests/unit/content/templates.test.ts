import type { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../../src/content';
import {
  bossSchema,
  dialogueSchema,
  enemiesSchema,
  levelSchema,
  playerSchema,
  projectilesSchema,
  propSchema,
  waveSchema,
  weaponSchema,
} from '../../../src/content/schemas';
import { validateReferences } from '../../../src/content/validate';

/*
 * The templates in docs/contenuti/template are documentation, the game never loads them.
 * These tests keep them honest: if a schema changes and a template falls behind, CI goes red.
 */

/** every template, keyed by file name (loaded by Vite, like the game loads its JSON) */
const FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(
    import.meta.glob<unknown>('../../../docs/contenuti/template/*.json', { eager: true, import: 'default' }),
  ).map(([path, data]): [string, unknown] => [path.slice(path.lastIndexOf('/') + 1), data]),
);

const readTemplate = (file: string): unknown => FILES[file];

/** template file → schema of the content entry it shows */
const TEMPLATES: Record<string, z.ZodType> = {
  'arma.json': weaponSchema,
  'giocatore.json': playerSchema,
  'nemico-chierichetto.json': enemiesSchema.shape.chierichetto,
  'nemico-beghina.json': enemiesSchema.shape.beghina,
  'nemico-sacrestano.json': enemiesSchema.shape.sacrestano,
  'proiettile.json': projectilesSchema.valueType,
  'boss.json': bossSchema,
  'oggetto-di-scena.json': propSchema,
  'ondata.json': waveSchema,
  'livello.json': levelSchema,
  'dialoghi.json': dialogueSchema,
};

describe('content templates (docs/contenuti/template)', () => {
  it('templateDir_everyFile_hasASchemaInThisTest', () => {
    // Arrange
    const files = Object.keys(FILES);

    // Act
    const covered = Object.keys(TEMPLATES);

    // Assert
    expect(files.sort()).toEqual(covered.sort());
  });

  it.each(Object.entries(TEMPLATES))('template_%s_isValidAgainstItsSchema', (file, schema) => {
    // Arrange
    const data = readTemplate(file);

    // Act
    const result = schema.safeParse(data);

    // Assert
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('validateReferences_templateLevelAndBoss_referenceExistingPropsAndLines', () => {
    // Arrange
    const level = levelSchema.parse(readTemplate('livello.json'));
    const boss = bossSchema.parse(readTemplate('boss.json'));
    const wave = waveSchema.parse(readTemplate('ondata.json'));
    const bundle = {
      ...CONTENT,
      weapons: CONTENT.weaponStats,
      boss,
      levels: { template: { ...level, waves: [...level.waves, wave] } },
    };

    // Act
    const errors = validateReferences(bundle);

    // Assert
    expect(errors).toEqual([]);
  });
});
