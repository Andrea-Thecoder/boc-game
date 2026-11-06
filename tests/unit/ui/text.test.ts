import { describe, expect, it } from 'vitest';
import { clean, kappa, pick } from '../../../src/ui/text';

describe('kappa', () => {
  it.each([
    ['conquistare', 'KONKUISTARE'],
    ['Vaticano', 'VATIKANO'],
    ['pesca', 'PESKA'],
    ['bocca', 'BOKKA'],
  ])('kappa_hardC_becomesK (%s)', (input, expected) => {
    // Arrange: input from the table

    // Act
    const result = kappa(input);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    ['dolce', 'DOLCE'],
    ['cielo', 'CIELO'],
    ['faccia', 'FACCIA'],
    ['città', 'CITTÀ'],
  ])('kappa_softC_staysC (%s)', (input, expected) => {
    // Arrange: input from the table

    // Act
    const result = kappa(input);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    ['succhino', 'SUKKINO'],
    ['chierichetti', 'KIERIKETTI'],
  ])('kappa_chDigraph_becomesK (%s)', (input, expected) => {
    // Arrange: input from the table

    // Act
    const result = kappa(input);

    // Assert
    expect(result).toBe(expected);
  });

  it.each([
    ['questo', 'KUESTO'],
    ['acqua', 'AKKUA'],
  ])('kappa_qu_becomesKu (%s)', (input, expected) => {
    // Arrange: input from the table

    // Act
    const result = kappa(input);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('clean', () => {
  it('clean_accentedLetters_returnsPlainUppercase', () => {
    // Arrange
    const text = 'Chiappetons è salva, però è già città';

    // Act
    const result = clean(text);

    // Assert
    expect(result).toBe('CHIAPPETONS E SALVA, PERO E GIA CITTA');
  });

  it('clean_symbolsMissingFromFont_areRemoved', () => {
    // Arrange
    const text = 'costa 5€ #sukkino @paolone';

    // Act
    const result = clean(text);

    // Assert
    expect(result).toBe('COSTA 5 SUKKINO PAOLONE');
  });

  it('clean_newline_isPreserved', () => {
    // Arrange
    const text = 'missione 1\nvia roma';

    // Act
    const result = clean(text);

    // Assert
    expect(result).toBe('MISSIONE 1\nVIA ROMA');
  });
});

describe('pick', () => {
  it('pick_singleElementList_returnsThatElement', () => {
    // Arrange
    const list = ['tamarindo'] as const;

    // Act
    const result = pick(list);

    // Assert
    expect(result).toBe('tamarindo');
  });
});
