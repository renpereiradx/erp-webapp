/**
 * Precedencia de resolveUnitFactor — debe calcar products.convert_units_for_product
 * (SQL) y findConversionFactor (Go): específico-directo → específico-inverso →
 * global-directo → global-inverso. Si esta precedencia diverge, el POS deriva
 * un precio distinto del que cobra el backend (bug pantalla ≠ cobro).
 */
import { describe, it, expect } from 'vitest';
import { resolveUnitFactor, type UnitConversionRow } from './resolveUnitFactor';

const rows = (...rs: Partial<UnitConversionRow>[]): UnitConversionRow[] =>
  rs.map((r) => ({
    from_unit: 'unit',
    to_unit: 'dozen',
    factor: 12,
    product_id: null,
    ...r,
  }));

describe('resolveUnitFactor', () => {
  it('misma unidad → 1 sin mirar conversiones', () => {
    expect(resolveUnitFactor(null, 'P1', 'kg', 'kg')).toBe(1);
  });

  it('sin conversiones / unidad vacía → null', () => {
    expect(resolveUnitFactor([], 'P1', 'kg', 'g')).toBeNull();
    expect(resolveUnitFactor(rows(), 'P1', '', 'g')).toBeNull();
    expect(resolveUnitFactor(rows(), 'P1', 'kg', '')).toBeNull();
  });

  it('global directa: kg→g = 1000', () => {
    expect(resolveUnitFactor(rows({ from_unit: 'kg', to_unit: 'g', factor: 1000 }), 'P1', 'kg', 'g')).toBe(1000);
  });

  it('global inversa: g→kg = 1/1000 consultando la fila kg→g', () => {
    expect(resolveUnitFactor(rows({ from_unit: 'kg', to_unit: 'g', factor: 1000 }), 'P1', 'g', 'kg')).toBeCloseTo(0.001, 10);
  });

  it('específica directa gana sobre global y sobre específica inversa', () => {
    const list = rows(
      { from_unit: 'unit', to_unit: 'dozen', factor: 12 }, // global directa
      { product_id: 'P1', from_unit: 'dozen', to_unit: 'unit', factor: 20 }, // específica inversa
      { product_id: 'P1', from_unit: 'unit', to_unit: 'dozen', factor: 10 }, // específica directa
    );
    expect(resolveUnitFactor(list, 'P1', 'unit', 'dozen')).toBe(10);
  });

  it('específica inversa gana sobre global directa', () => {
    const list = rows(
      { from_unit: 'unit', to_unit: 'dozen', factor: 12 }, // global directa
      { product_id: 'P1', from_unit: 'dozen', to_unit: 'unit', factor: 20 }, // específica inversa → 1/20
    );
    expect(resolveUnitFactor(list, 'P1', 'unit', 'dozen')).toBeCloseTo(0.05, 10);
  });

  it('global inversa como último recurso', () => {
    const list = rows({ from_unit: 'dozen', to_unit: 'unit', factor: 12 });
    expect(resolveUnitFactor(list, 'P1', 'unit', 'dozen')).toBeCloseTo(1 / 12, 10);
  });

  it('conversión de OTRO producto se ignora por completo', () => {
    const list = rows(
      { product_id: 'OTRO', from_unit: 'unit', to_unit: 'dozen', factor: 99 },
      { from_unit: 'unit', to_unit: 'dozen', factor: 12 },
    );
    expect(resolveUnitFactor(list, 'P1', 'unit', 'dozen')).toBe(12);
  });

  it('factor 0 no se usa como inversa (división por cero)', () => {
    const list = rows({ from_unit: 'dozen', to_unit: 'unit', factor: 0 });
    expect(resolveUnitFactor(list, 'P1', 'unit', 'dozen')).toBeNull();
  });

  it('factor string (respuestas de la API) se normaliza', () => {
    const list = rows({ from_unit: 'kg', to_unit: 'g', factor: '1000' });
    expect(resolveUnitFactor(list, 'P1', 'kg', 'g')).toBe(1000);
  });
});
