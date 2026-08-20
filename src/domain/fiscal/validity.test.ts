import { describe, it, expect } from 'vitest';
import {
  daysUntilValidTo,
  timbradoValiditySeverity,
  normalizeSerie,
  isValidSerie,
  formatInvoiceNumber,
  TIMBRADO_WARNING_DAYS,
} from './validity';

const now = new Date(2026, 7, 20); // 2026-08-20 (mediodía local)

describe('daysUntilValidTo', () => {
  it('devuelve null sin fecha de vencimiento', () => {
    expect(daysUntilValidTo(undefined, now)).toBeNull();
    expect(daysUntilValidTo(null, now)).toBeNull();
    expect(daysUntilValidTo('', now)).toBeNull();
  });

  it('devuelve null ante fecha inválida', () => {
    expect(daysUntilValidTo('no-es-fecha', now)).toBeNull();
  });

  it('cuenta días exactos ignorando la hora', () => {
    expect(daysUntilValidTo('2026-08-20T23:59:00', now)).toBe(0);
    expect(daysUntilValidTo('2026-08-25T00:00:00', now)).toBe(5);
    expect(daysUntilValidTo('2026-08-15T12:00:00', now)).toBe(-5);
    expect(daysUntilValidTo('2026-09-19T00:00:00', now)).toBe(TIMBRADO_WARNING_DAYS);
  });
});

describe('timbradoValiditySeverity', () => {
  it('indefinido sin fecha', () => {
    expect(timbradoValiditySeverity(undefined, now)).toBe('indefinite');
  });

  it('vencido con días negativos; 0 = vence hoy (aún vigente)', () => {
    expect(timbradoValiditySeverity('2026-08-19', now)).toBe('expired');
    expect(timbradoValiditySeverity('2026-08-20T09:00:00', now)).toBe('warning');
    expect(timbradoValiditySeverity('2026-08-20', now)).toBe('warning');
  });

  it('warning dentro del umbral de 30 días', () => {
    expect(timbradoValiditySeverity('2026-08-21', now)).toBe('warning');
    expect(timbradoValiditySeverity('2026-09-19', now)).toBe('warning');
  });

  it('ok más allá del umbral', () => {
    expect(timbradoValiditySeverity('2026-09-20', now)).toBe('ok');
    expect(timbradoValiditySeverity('2027-01-01', now)).toBe('ok');
  });
});

describe('serie (C010 dSerieNum)', () => {
  it('normaliza a 2 letras mayúsculas', () => {
    expect(normalizeSerie('aa')).toBe('AA');
    expect(normalizeSerie('ab')).toBe('AB');
    expect(normalizeSerie('  az ')).toBe('AZ');
    expect(normalizeSerie('ABCD')).toBe('AB');
    expect(normalizeSerie('a1')).toBe('A');
  });

  it('valida formato AA..ZZ', () => {
    expect(isValidSerie('AA')).toBe(true);
    expect(isValidSerie('ZZ')).toBe(true);
    expect(isValidSerie('a1')).toBe(false);
    expect(isValidSerie('A')).toBe(false);
    expect(isValidSerie('AAA')).toBe(false);
  });
});

describe('formatInvoiceNumber', () => {
  it('rellena a 7 dígitos (C007 dNumDoc)', () => {
    expect(formatInvoiceNumber(1)).toBe('0000001');
    expect(formatInvoiceNumber(4528)).toBe('0004528');
    expect(formatInvoiceNumber(9999999)).toBe('9999999');
  });
});
