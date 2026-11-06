import { describe, expect, it } from 'vitest';
import bossJson from '../../../src/content/boss-panza.json';
import enemiesJson from '../../../src/content/enemies.json';
import level1Json from '../../../src/content/levels/level1.json';
import weaponsJson from '../../../src/content/weapons.json';
import { bossSchema, dialogueSchema, enemiesSchema, levelSchema, weaponSchema } from '../../../src/content/schemas';

/** Each test starts from a valid real file and breaks exactly one thing. */
const clone = <T>(value: T): T => structuredClone(value);

describe('weaponSchema', () => {
  it('weaponSchema_realWeapon_isValid', () => {
    // Arrange
    const weapon = clone(weaponsJson.pera);

    // Act
    const result = weaponSchema.safeParse(weapon);

    // Assert
    expect(result.success).toBe(true);
  });

  it('weaponSchema_zeroCooldown_isRejected', () => {
    // Arrange
    const weapon = { ...clone(weaponsJson.pera), cooldown: 0 };

    // Act
    const result = weaponSchema.safeParse(weapon);

    // Assert
    expect(result.success).toBe(false);
  });

  it('weaponSchema_emptySpread_isRejected', () => {
    // Arrange
    const weapon = { ...clone(weaponsJson.pera), spread: [] };

    // Act
    const result = weaponSchema.safeParse(weapon);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('enemiesSchema', () => {
  it('enemiesSchema_rangeWithMinAboveMax_isRejected', () => {
    // Arrange
    const enemies = clone(enemiesJson);
    enemies.chierichetto.keepDistance = [110, 60];

    // Act
    const result = enemiesSchema.safeParse(enemies);

    // Assert
    expect(result.success).toBe(false);
  });

  it('enemiesSchema_missingEnemy_isRejected', () => {
    // Arrange
    const { beghina: _removed, ...enemies } = clone(enemiesJson);

    // Act
    const result = enemiesSchema.safeParse(enemies);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('bossSchema', () => {
  it('bossSchema_firstPhaseNotAtFullHealth_isRejected', () => {
    // Arrange
    const boss = clone(bossJson);
    boss.phases[0].hpRatio = 0.9;

    // Act
    const result = bossSchema.safeParse(boss);

    // Assert
    expect(result.success).toBe(false);
  });

  it('bossSchema_phasesNotDecreasing_isRejected', () => {
    // Arrange
    const boss = clone(bossJson);
    boss.phases[2].hpRatio = 0.8;

    // Act
    const result = bossSchema.safeParse(boss);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('levelSchema', () => {
  it('levelSchema_realLevel_isValid', () => {
    // Arrange
    const level = clone(level1Json);

    // Act
    const result = levelSchema.safeParse(level);

    // Assert
    expect(result.success).toBe(true);
  });

  it('levelSchema_wavesOutOfOrder_isRejected', () => {
    // Arrange
    const level = clone(level1Json);
    level.waves[1].trigger = 10;

    // Act
    const result = levelSchema.safeParse(level);

    // Assert
    expect(result.success).toBe(false);
  });

  it('levelSchema_unknownEnemyType_isRejected', () => {
    // Arrange
    const level = clone(level1Json);
    level.waves[0].spawns[0].type = 'parroco';

    // Act
    const result = levelSchema.safeParse(level);

    // Assert
    expect(result.success).toBe(false);
  });

  it('levelSchema_unknownPickupKind_isRejected', () => {
    // Arrange
    const level = clone(level1Json);
    level.pickups[0].kind = 'cannolo';

    // Act
    const result = levelSchema.safeParse(level);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('dialogueSchema', () => {
  it('dialogueSchema_idNotSnakeCase_isRejected', () => {
    // Arrange
    const dialogue = { IntroLivello: 'Ciao' };

    // Act
    const result = dialogueSchema.safeParse(dialogue);

    // Assert
    expect(result.success).toBe(false);
  });

  it('dialogueSchema_emptyVariantList_isRejected', () => {
    // Arrange
    const dialogue = { morte: [] };

    // Act
    const result = dialogueSchema.safeParse(dialogue);

    // Assert
    expect(result.success).toBe(false);
  });
});
