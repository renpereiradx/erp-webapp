import { describe, it, expect } from 'vitest';
import {
  NOTE_EMISSION_MOTIVES,
  isValidNoteMotivo,
  validateNoteMonto,
} from './notes';
import { DICTIONARY } from '@/lib/i18n';

describe('NOTE_EMISSION_MOTIVES', () => {
  it('cubre los 8 motivos E401 (iMotEmi, MT tabla E5)', () => {
    expect(NOTE_EMISSION_MOTIVES.map(m => m.code)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('cada motivo resuelve en el diccionario ES', () => {
    NOTE_EMISSION_MOTIVES.forEach(m => {
      expect(DICTIONARY.es[m.i18nKey], `clave i18n faltante: ${m.i18nKey}`).toBeTruthy();
    });
  });

  it('isValidNoteMotivo discrimina 1-8', () => {
    expect(isValidNoteMotivo(1)).toBe(true);
    expect(isValidNoteMotivo(8)).toBe(true);
    expect(isValidNoteMotivo(0)).toBe(false);
    expect(isValidNoteMotivo(9)).toBe(false);
  });
});

describe('validateNoteMonto', () => {
  it('monto vacío → válido (nil = todo el disponible)', () => {
    expect(validateNoteMonto('', 1000)).toBeNull();
    expect(validateNoteMonto('   ', 1000)).toBeNull();
  });

  it('monto > 0 dentro del tope → válido', () => {
    expect(validateNoteMonto('500', 1000)).toBeNull();
    expect(validateNoteMonto('1000', 1000)).toBeNull(); // tope inclusive
  });

  it('no numérico → error', () => {
    expect(validateNoteMonto('abc', 1000)).toBe('fiscal.notes.error.invalidNumber');
    expect(validateNoteMonto('1,5', 1000)).toBe('fiscal.notes.error.invalidNumber');
  });

  it('cero o negativo → error', () => {
    expect(validateNoteMonto('0', 1000)).toBe('fiscal.notes.error.zeroOrNegative');
    expect(validateNoteMonto('-5', 1000)).toBe('fiscal.notes.error.zeroOrNegative');
  });

  it('excede el tope visible → error', () => {
    expect(validateNoteMonto('1000.01', 1000)).toBe('fiscal.notes.error.exceedsAvailable');
  });

  it('sin tope conocido no limita (lo valida el backend)', () => {
    expect(validateNoteMonto('999999', undefined)).toBeNull();
  });
});
