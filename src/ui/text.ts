/**
 * Paolone parla kon le K: every hard C (and CH, QU) becomes K.
 * Works on uppercase text, which is what the pixel font renders anyway.
 */
export function kappa(text: string): string {
  return text
    .toUpperCase()
    .replace(/CCH/g, 'KK')
    .replace(/CH/g, 'K')
    .replace(/CQU/g, 'KKU')
    .replace(/QU/g, 'KU')
    .replace(/CC(?![EIÈÉÌ])/g, 'KK')
    .replace(/C(?![EIÈÉÌ])(?!C[EIÈÉÌ])/g, 'K');
}

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
