import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTENT, line, lineById } from '../../../src/content';
import { validateReferences } from '../../../src/content/validate';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CONTENT (real JSON files)', () => {
  it('validateReferences_realContent_reportsNoProblems', () => {
    // Arrange
    const bundle = { ...CONTENT, weapons: CONTENT.weaponStats };

    // Act
    const errors = validateReferences(bundle);

    // Assert
    expect(errors).toEqual([]);
  });

  it('weapons_tamarindoWithNullAmmo_becomesInfinite', () => {
    // Arrange: weapons.json declares "ammo": null for tamarindo

    // Act
    const ammo = CONTENT.weapons.tamarindo.ammo;

    // Assert
    expect(ammo).toBe(Infinity);
  });

  it('weapons_eachWeapon_knowsItsFlavour', () => {
    // Arrange: the flavour is the JSON key

    // Act
    const flavours = Object.entries(CONTENT.weapons).map(([key, w]) => [key, w.flavour]);

    // Assert
    expect(flavours).toEqual([
      ['tamarindo', 'tamarindo'],
      ['pera', 'pera'],
      ['ace', 'ace'],
      ['pesca', 'pesca'],
    ]);
  });
});

describe('line / lineById', () => {
  it('line_singleTextLine_returnsTheText', () => {
    // Arrange
    const expected = CONTENT.dialogues.paolone.titolo;

    // Act
    const result = line('paolone', 'titolo');

    // Assert
    expect(result).toBe(expected);
  });

  it('line_variantsList_returnsTheRandomlyPickedVariant', () => {
    // Arrange
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Act
    const result = line('nonna', 'lancio');

    // Assert
    expect(result).toBe(CONTENT.dialogues.nonna.lancio[0]);
  });

  it('lineById_unknownId_throwsNamingTheFile', () => {
    // Arrange
    const id = 'battuta_inesistente';

    // Act
    const act = () => lineById('paolone', id);

    // Assert
    expect(act).toThrow('Battuta "battuta_inesistente" assente in dialoghi/paolone.json');
  });

  it('line_unknownId_isRejectedByCompiler', () => {
    // Arrange: the real assertion is `npm run typecheck`

    // Act
    // @ts-expect-error "dieta" is not a line of paolone.json
    const act = () => line('paolone', 'dieta');

    // Assert
    expect(act).toThrow();
  });
});
