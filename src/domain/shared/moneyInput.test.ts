import { describe, it, expect } from 'vitest';
import {
  parseNumberInput,
  formatNumberInput,
  onNumberInputChange,
} from './moneyInput';

describe('parseNumberInput', () => {
  it('strips thousands-grouping dots', () => {
    expect(parseNumberInput('10.000')).toBe('10000');
    expect(parseNumberInput('1.050.690')).toBe('1050690');
  });

  it('strips currency symbols and letters (paste tolerance)', () => {
    expect(parseNumberInput('Gs. 50.000')).toBe('50000');
    expect(parseNumberInput('₲ 2.500')).toBe('2500');
  });

  it('treats comma as the decimal point (es-PY)', () => {
    expect(parseNumberInput('10,5')).toBe('10.5');
    expect(parseNumberInput('-1.250,50')).toBe('-1250.50');
  });

  it('dots are ALWAYS grouping (backspace monotonic)', () => {
    expect(parseNumberInput('12.34')).toBe('1234');
    expect(parseNumberInput('12.3')).toBe('123');
    expect(parseNumberInput('1.0.5')).toBe('105');
  });

  it('empty stays empty', () => {
    expect(parseNumberInput('')).toBe('');
    expect(parseNumberInput('abc')).toBe('');
  });
});

describe('formatNumberInput', () => {
  it('groups thousands with dots (es-PY)', () => {
    expect(formatNumberInput('10000')).toBe('10.000');
    expect(formatNumberInput(105690)).toBe('105.690');
    expect(formatNumberInput('1050690')).toBe('1.050.690');
  });

  it('empty/invalid yields empty string (not 0)', () => {
    expect(formatNumberInput('')).toBe('');
    expect(formatNumberInput(null)).toBe('');
    expect(formatNumberInput(undefined)).toBe('');
    expect(formatNumberInput('-')).toBe('');
  });

  it('shows decimals with comma and keeps sign', () => {
    expect(formatNumberInput('1234.5')).toBe('1.234,5');
    expect(formatNumberInput('-2500')).toBe('-2.500');
  });

  it('small numbers pass through ungrouped', () => {
    expect(formatNumberInput('500')).toBe('500');
    expect(formatNumberInput(42)).toBe('42');
  });
});

describe('onNumberInputChange', () => {
  it('is just parseNumberInput', () => {
    expect(onNumberInputChange('1.050.690')).toBe('1050690');
  });
});

describe('round-trip typing behavior', () => {
  it('typing 1→10→100→1000→10000 keeps the numeric state monotonic', () => {
    let state = '';
    for (const digit of ['1', '0', '0', '0', '0']) {
      state = onNumberInputChange(state + digit);
    }
    expect(state).toBe('10000');
    expect(formatNumberInput(state)).toBe('10.000');
  });

  it('backspacing from 10.000 removes digits without ambiguity', () => {
    // Backspace edits the DISPLAY value; parse must tolerate partially
    // grouped values without throwing digits away.
    expect(parseNumberInput('10.00')).toBe('1000');
    expect(parseNumberInput('10.0')).toBe('100');
    expect(parseNumberInput('10')).toBe('10');
  });

  it('formatted value re-parses to the same number (round-trip)', () => {
    for (const n of [500, 30000, 105690, 1000000]) {
      expect(parseNumberInput(formatNumberInput(n))).toBe(String(n));
    }
  });
});
