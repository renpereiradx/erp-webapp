import { describe, it, expect } from 'vitest';
import {
  CDC_LENGTH,
  normalizeCDC,
  isValidCDC,
  formatCDC,
} from './cdc';

/** Vector dorado del Manual Técnico SIFEN v150 (§10.1). */
const MT_CDC = '01444444017001001001452822017012515873260988';
const MT_CDC_FORMATTED = '0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988';

describe('normalizeCDC', () => {
  it('extrae solo dígitos de un CDC agrupado', () => {
    expect(normalizeCDC(MT_CDC_FORMATTED)).toBe(MT_CDC);
  });

  it('tolera guiones y espacios', () => {
    expect(normalizeCDC('0144-4444-0170 0100 1001')).toBe('01444444017001001001');
  });

  it('devuelve cadena vacía para input vacío o nulo', () => {
    expect(normalizeCDC('')).toBe('');
    expect(normalizeCDC(null as unknown as string)).toBe('');
    expect(normalizeCDC(undefined as unknown as string)).toBe('');
  });
});

describe('isValidCDC', () => {
  it('acepta un CDC de 44 dígitos (vector del MT)', () => {
    expect(isValidCDC(MT_CDC)).toBe(true);
  });

  it('rechaza longitudes distintas de 44', () => {
    expect(isValidCDC(MT_CDC.slice(0, 43))).toBe(false);
    expect(isValidCDC(MT_CDC + '1')).toBe(false);
    expect(isValidCDC('')).toBe(false);
  });

  it('rechaza caracteres no numéricos', () => {
    expect(isValidCDC('A' + MT_CDC.slice(1))).toBe(false);
    expect(isValidCDC(MT_CDC.replace(/\d/, 'x'))).toBe(false);
  });

  it('valida el vector del MT también agrupado', () => {
    expect(isValidCDC(MT_CDC_FORMATTED)).toBe(true);
  });
});

describe('formatCDC', () => {
  it('formatea el vector del MT en 11 grupos de 4 (estilo KuDE)', () => {
    const formatted = formatCDC(MT_CDC);
    expect(formatted).toBe(MT_CDC_FORMATTED);
    expect(formatted.split(' ')).toHaveLength(11);
    expect(CDC_LENGTH).toBe(44);
  });

  it('es idempotente sobre un CDC ya agrupado', () => {
    expect(formatCDC(MT_CDC_FORMATTED)).toBe(MT_CDC_FORMATTED);
  });

  it('tolera separadores extraños en el input', () => {
    expect(formatCDC('0144-4444-0170 0100 1001.4528.2201 7012 5158 7326 0988')).toBe(
      MT_CDC_FORMATTED,
    );
  });

  it('devuelve "" para CDC inválido', () => {
    expect(formatCDC('')).toBe('');
    expect(formatCDC(MT_CDC.slice(0, 43))).toBe('');
    expect(formatCDC(MT_CDC.replace(/\d/, 'x'))).toBe('');
  });
});
