/**
 * Tests del dominio de ventana de reenvío (S6-H4, MT §6.2).
 * Espejo de las reglas del backend: 72 h desde la emisión (fecha_firma como
 * referencia del contrato FE) y rechazos definitivos 1050–1053.
 */
import { describe, it, expect } from 'vitest';
import { retryWindow, isFinalRejection, isRetryableState, RETRY_WINDOW_HOURS } from './emission';

// Referencias fijas (sin zona, formato del backend) — fechas locales como
// parseFiscalDateTime, inmunes al huso de la máquina que corre el test.
const FIRMADO = '2026-08-21T12:00:00';
const ahora = (h: number) => new Date(2026, 7, 21, 12 + h);

describe('isFinalRejection', () => {
  it('1050–1053 son definitivos', () => {
    for (const code of ['1050', '1051', '1052', '1053']) {
      expect(isFinalRejection(code)).toBe(true);
    }
  });

  it('otros códigos y vacío son reenviables', () => {
    expect(isFinalRejection('0401')).toBe(false);
    expect(isFinalRejection(undefined)).toBe(false);
    expect(isFinalRejection('')).toBe(false);
  });
});

describe('isRetryableState', () => {
  it('solo EMITIDO/RECHAZADO', () => {
    expect(isRetryableState('EMITIDO')).toBe(true);
    expect(isRetryableState('RECHAZADO')).toBe(true);
    expect(isRetryableState('APROBADO')).toBe(false);
    expect(isRetryableState('CANCELADO')).toBe(false);
  });
});

describe('retryWindow', () => {
  it('dentro de la ventana: computable y hoursLeft positivo', () => {
    const win = retryWindow({ estado: 'EMITIDO', fecha_firma: FIRMADO }, ahora(10));
    expect(win.computable).toBe(true);
    expect(win.withinWindow).toBe(true);
    expect(win.hoursLeft).toBeCloseTo(62, 5);
    expect(win.deadline?.getTime()).toBe(ahora(72).getTime());
  });

  it('fuera de la ventana: hoursLeft negativo y withinWindow false', () => {
    const win = retryWindow({ estado: 'RECHAZADO', fecha_firma: FIRMADO }, ahora(80));
    expect(win.computable).toBe(true);
    expect(win.withinWindow).toBe(false);
    expect(win.hoursLeft).toBeCloseTo(-8, 5);
  });

  it('borde exacto de 72 h sigue dentro', () => {
    const win = retryWindow({ estado: 'EMITIDO', fecha_firma: FIRMADO }, ahora(72));
    expect(win.withinWindow).toBe(true);
    expect(win.hoursLeft).toBeCloseTo(0, 5);
  });

  it('sin fecha de firma → no computable, sin deadline', () => {
    const win = retryWindow({ estado: 'EMITIDO' }, ahora(0));
    expect(win.computable).toBe(false);
    expect(win.withinWindow).toBe(true);
    expect(win.deadline).toBeNull();
    expect(win.hoursLeft).toBe(RETRY_WINDOW_HOURS);
  });

  it('rechazo definitivo marcado aunque esté dentro de ventana', () => {
    const win = retryWindow({ estado: 'RECHAZADO', fecha_firma: FIRMADO, codigo_respuesta: '1051' }, ahora(1));
    expect(win.finalRejection).toBe(true);
    expect(win.withinWindow).toBe(true);
  });

  it('fecha parseada en LOCAL (sin corrimiento UTC)', () => {
    // Ambas fechas construidas locales → diff exacto de 72 h en cualquier huso
    const win = retryWindow({ estado: 'EMITIDO', fecha_firma: FIRMADO }, ahora(0));
    expect(win.hoursLeft).toBeCloseTo(72, 5);
  });
});
