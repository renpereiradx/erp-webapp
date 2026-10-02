import { describe, expect, it } from 'vitest';
import { deriveUnitPrice } from './deriveUnitPrice';

/**
 * Regresión clave (fix 2026-10-02, PLAN_UNITS_V2_COMPLETACION F1.3a): la
 * derivación ANTES multiplicaba por el factor base→elegido (dirección
 * invertida): vender 1 ton con base kg a 5.000 mostraba 5 en vez de
 * 5.000.000 — el mismo bug "417 vs 60.000" que el SQL corrigió el 09-26.
 */

const rows = (...r: Array<{ product_id?: string | null; from_unit: string; to_unit: string; factor: number }>) => r;

describe('deriveUnitPrice', () => {
  it('unidad base: precio base, matchesUnit', () => {
    expect(
      deriveUnitPrice({ chosenUnit: 'kg', baseUnit: 'kg', basePrice: 5000 }),
    ).toEqual({ price: 5000, matchesUnit: true });
  });

  it('unidad vacía cae a la base', () => {
    expect(
      deriveUnitPrice({ chosenUnit: '', baseUnit: 'kg', basePrice: 5000 }),
    ).toEqual({ price: 5000, matchesUnit: true });
  });

  it('precio registrado para la unidad elegida gana', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        registeredPrice: 95000,
        conversions: rows({ from_unit: 'box', to_unit: 'kg', factor: 20 }),
      }),
    ).toEqual({ price: 95000, matchesUnit: true });
  });

  it('unidad MAYOR que la base: base × factor (regresión dirección)', () => {
    // 1 ton = 1000 kg → precio(ton) = 5.000 × 1000 = 5.000.000
    expect(
      deriveUnitPrice({
        chosenUnit: 'ton',
        baseUnit: 'kg',
        basePrice: 5000,
        conversions: rows({ from_unit: 'kg', to_unit: 'ton', factor: 0.001 }),
      }),
    ).toEqual({ price: 5000000, matchesUnit: true });
  });

  it('fila de una sola dirección (caja→kg, 20): caja = kg × 20 (regresión 5000/20)', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        conversions: rows({ from_unit: 'box', to_unit: 'kg', factor: 20 }),
      }),
    ).toEqual({ price: 100000, matchesUnit: true });
  });

  it('unidad MENOR que la base: base × factor fraccional', () => {
    // 1 g = 0.001 kg → precio(g) = 5.000 × 0.001 = 5
    expect(
      deriveUnitPrice({
        chosenUnit: 'g',
        baseUnit: 'kg',
        basePrice: 5000,
        conversions: rows({ from_unit: 'kg', to_unit: 'g', factor: 1000 }),
      }),
    ).toEqual({ price: 5, matchesUnit: true });
  });

  it('específica del producto gana sobre la global', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        productId: 'P1',
        conversions: rows(
          { from_unit: 'box', to_unit: 'kg', factor: 20 }, // global
          { product_id: 'P1', from_unit: 'box', to_unit: 'kg', factor: 30 }, // específica
        ),
      }),
    ).toEqual({ price: 150000, matchesUnit: true });
  });

  it('sin conversión: precio base y matchesUnit=false (hint)', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        conversions: null,
      }),
    ).toEqual({ price: 5000, matchesUnit: false });
  });

  it('conversiones de OTRO producto no cuentan', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        productId: 'P1',
        conversions: rows({ product_id: 'OTRO', from_unit: 'box', to_unit: 'kg', factor: 20 }),
      }),
    ).toEqual({ price: 5000, matchesUnit: false });
  });

  it('factor 0 (dato basura) no produce precio 0 con matchesUnit', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 5000,
        conversions: rows({ product_id: 'P1', from_unit: 'box', to_unit: 'kg', factor: 0 }),
        productId: 'P1',
      }),
    ).toEqual({ price: 5000, matchesUnit: false });
  });

  it('redondeo a 2 decimales como el SQL (ROUND)', () => {
    expect(
      deriveUnitPrice({
        chosenUnit: 'box',
        baseUnit: 'kg',
        basePrice: 3333.337,
        conversions: rows({ from_unit: 'box', to_unit: 'kg', factor: 3 }),
      }).price,
    ).toBe(10000.01);
  });
});
