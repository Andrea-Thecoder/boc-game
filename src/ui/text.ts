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

/** Every character the pixel font can draw (see `art/font.ts`), plus newline. */
const UNSUPPORTED = /[^A-Z0-9 !'",\-.:?+/()<>~\n]/g;

/** Uppercases and strips accents so any Italian string can be rendered with the pixel font. */
export function clean(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(UNSUPPORTED, '');
}
