import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../../src/content';
import { weaponSchema } from '../../../src/content/schemas';
import { parseContent, validateReferences, type ReferenceBundle } from '../../../src/content/validate';

/** A fresh, valid copy of the real content to break in each test. */
const bundle = (): ReferenceBundle =>
  structuredClone({
    weapons: CONTENT.weaponStats,
    boss: CONTENT.boss,
    props: CONTENT.props,
    levels: CONTENT.levels,
    dialogues: CONTENT.dialogues,
  });

describe('parseContent', () => {
  it('parseContent_invalidData_errorNamesFileAndField', () => {
    // Arrange
    const broken = { ...CONTENT.weaponStats.pera, cooldown: -5 };

    // Act
    const act = () => parseContent(weaponSchema, broken, 'weapons.json');

    // Assert
    expect(act).toThrow(/src\/content\/data\/weapons\.json:\n {2}- cooldown: /);
  });

  it('parseContent_validData_returnsIt', () => {
    // Arrange
    const weapon = CONTENT.weaponStats.ace;

    // Act
    const result = parseContent(weaponSchema, weapon, 'weapons.json');

    // Assert
    expect(result).toEqual(weapon);
  });
});

describe('validateReferences', () => {
  it('validateReferences_unknownPropKind_reportsIt', () => {
    // Arrange
    const c = bundle();
    c.levels.level1.props[0].kind = 'trattore';

    // Act
    const errors = validateReferences(c);

    // Assert
    expect(errors).toEqual(['levels/level1.json props[0]: tipo di oggetto "trattore" assente in props.json']);
  });

  it('validateReferences_waveLineMissing_reportsIt', () => {
    // Arrange
    const c = bundle();
    c.levels.level1.waves[0].line = 'ondata_fantasma';

    // Act
    const errors = validateReferences(c);

    // Assert
    expect(errors).toEqual([
      'levels/level1.json waves[0].line: battuta "ondata_fantasma" assente in dialoghi/paolone.json',
    ]);
  });

  it('validateReferences_bossPhaseLineMissing_reportsIt', () => {
    // Arrange
    const c = bundle();
    c.boss.phases[1].line = 'fase_segreta';

    // Act
    const errors = validateReferences(c);

    // Assert
    expect(errors).toEqual([
      'boss-panza.json phases[1].line: battuta "fase_segreta" assente in dialoghi/monsignor-panza.json',
    ]);
  });

  it('validateReferences_pickupLineMissing_reportsIt', () => {
    // Arrange
    const c = bundle();
    delete c.dialogues.paolone.raccolta_ace;

    // Act
    const errors = validateReferences(c);

    // Assert
    expect(errors).toEqual(['dialoghi/paolone.json: manca la battuta "raccolta_ace"']);
  });

  it('validateReferences_tamarindoWithLimitedAmmo_reportsIt', () => {
    // Arrange
    const c = bundle();
    c.weapons.tamarindo.ammo = 10;

    // Act
    const errors = validateReferences(c);

    // Assert
    expect(errors).toEqual(["weapons.json tamarindo.ammo: deve essere null (infinito), è l'arma di riserva"]);
  });
});
