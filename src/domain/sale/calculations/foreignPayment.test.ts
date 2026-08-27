import { describe, it, expect } from 'vitest';
import {
  computeForeignDue,
  computeBaseFromForeign,
  computeForeignChange,
  computeBaseChange,
} from './foreignPayment';

describe('computeForeignDue', () => {
  it('divide el total en base por la tasa', () => {
    expect(computeForeignDue(500000, 7300)).toBeCloseTo(68.49, 2);
  });

  it('devuelve 0 con tasa ausente o no positiva (tasa pendiente)', () => {
    expect(computeForeignDue(500000, 0)).toBe(0);
    expect(computeForeignDue(500000, -1)).toBe(0);
    expect(computeForeignDue(500000, NaN)).toBe(0);
  });

  it('devuelve 0 con total 0', () => {
    expect(computeForeignDue(0, 7300)).toBe(0);
  });
});

describe('computeBaseFromForeign', () => {
  it('multiplica el monto recibido en divisa por la tasa', () => {
    expect(computeBaseFromForeign(70, 7300)).toBe(511000);
  });

  it('redondea a 2 decimales', () => {
    expect(computeBaseFromForeign(1.111, 3)).toBe(3.33);
    expect(computeBaseFromForeign(68.493, 7300)).toBe(499998.9);
  });

  it('devuelve 0 con tasa ausente o no positiva', () => {
    expect(computeBaseFromForeign(70, 0)).toBe(0);
    expect(computeBaseFromForeign(70, NaN)).toBe(0);
  });
});

describe('computeForeignChange', () => {
  it('calcula el vuelto en la divisa de cobro', () => {
    expect(computeForeignChange(70, 68.49)).toBeCloseTo(1.51, 2);
  });

  it('nunca es negativo', () => {
    expect(computeForeignChange(50, 68.49)).toBe(0);
  });
});

describe('computeBaseChange', () => {
  it('calcula el vuelto en guaraníes cuando se cobra en divisa', () => {
    // Cliente entrega US$ 70 (tasa 7300) sobre un total de 500.000 PYG:
    // recibido 511.000 − 500.000 = 11.000 PYG de vuelto.
    expect(computeBaseChange(70, 7300, 500000)).toBe(11000);
  });

  it('es 0 si lo recibido no cubre el total', () => {
    expect(computeBaseChange(50, 7300, 500000)).toBe(0);
  });

  it('es 0 con tasa ausente o no positiva', () => {
    expect(computeBaseChange(70, 0, 500000)).toBe(0);
  });
});
