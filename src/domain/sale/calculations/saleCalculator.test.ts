import { describe, it, expect } from 'vitest';
import { calculateSaleTotals, applyGeneralDiscount, SaleItem } from './saleCalculator';

describe('calculateSaleTotals', () => {
  it('extrae IVA 10% de precios con IVA incluido', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 11000, tax_rate: 0.1 },
    ];
    const totals = calculateSaleTotals(items);

    expect(totals.subtotal).toBe(11000);
    expect(totals.total).toBe(11000); // precio con IVA, no se suma nada
    expect(totals.iva10).toBeCloseTo(1000, 2);
    expect(totals.iva5).toBe(0);
    expect(totals.tax_amount).toBeCloseTo(1000, 2);
    expect(totals.tax_buckets).toEqual([{ percent: 10, amount: 1000 }]);
    expect(totals.exento).toBe(0);
  });

  it('trata la tasa 0 (EXENTO) como válida y no liquida IVA', () => {
    const items: SaleItem[] = [
      { quantity: 2, unit_price: 5000, tax_rate: 0 },
    ];
    const totals = calculateSaleTotals(items);

    expect(totals.exento).toBe(10000);
    expect(totals.tax_amount).toBe(0);
    expect(totals.iva10).toBe(0);
    expect(totals.tax_buckets).toEqual([]);
    expect(totals.total).toBe(10000);
  });

  it('incluye tasas no estándar (13%) en tax_amount y tax_buckets', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 11300, tax_rate: 0.13 },
    ];
    const totals = calculateSaleTotals(items);

    // 11300 / 1.13 = 10000 → IVA 1300
    expect(totals.tax_buckets).toEqual([{ percent: 13, amount: 1300 }]);
    expect(totals.tax_amount).toBeCloseTo(1300, 2);
    expect(totals.iva10).toBe(0);
    expect(totals.iva5).toBe(0);
    expect(totals.total).toBe(11300);
  });

  it('agrupa múltiples tasas y mantiene iva10/iva5 derivados', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 11000, tax_rate: 0.1 },
      { quantity: 1, unit_price: 10500, tax_rate: 0.05 },
      { quantity: 1, unit_price: 3000, tax_rate: 0 },
    ];
    const totals = calculateSaleTotals(items);

    expect(totals.iva10).toBeCloseTo(1000, 2);
    expect(totals.iva5).toBeCloseTo(500, 2);
    expect(totals.exento).toBe(3000);
    expect(totals.tax_amount).toBeCloseTo(1500, 2);
    expect(totals.tax_buckets).toEqual([
      { percent: 10, amount: 1000 },
      { percent: 5, amount: 500 },
    ]);
    expect(totals.total).toBe(24500);
  });

  it('suma IVA aditivo cuando price_includes_tax es false', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 10000, tax_rate: 0.1, price_includes_tax: false },
    ];
    const totals = calculateSaleTotals(items);

    expect(totals.tax_amount).toBeCloseTo(1000, 2);
    expect(totals.total).toBeCloseTo(11000, 2);
  });

  it('aplica descuento por línea antes de liquidar IVA', () => {
    const items: SaleItem[] = [
      { quantity: 2, unit_price: 11000, tax_rate: 0.1, discount_amount: 1000 },
    ];
    const totals = calculateSaleTotals(items);

    // Línea neta: 2 × (11000 - 1000) = 20000 → IVA extraído = 20000 - 20000/1.1
    expect(totals.discount_total).toBe(2000);
    expect(totals.tax_amount).toBeCloseTo(20000 - 20000 / 1.1, 2);
    expect(totals.total).toBeCloseTo(20000, 2);
  });
});

describe('applyGeneralDiscount', () => {
  it('prorratea el descuento antes del IVA: el IVA baja proporcionalmente', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 110000, tax_rate: 0.1 },
    ];
    const discounted = applyGeneralDiscount(items, 11000); // 10%

    expect(discounted[0].discount_total).toBe(11000);

    const totals = calculateSaleTotals(discounted);
    // Línea neta 99000 → IVA = 99000 - 99000/1.1 = 9000 (antes: 10000)
    expect(totals.tax_amount).toBeCloseTo(9000, 2);
    expect(totals.total).toBeCloseTo(99000, 2);
    expect(totals.discount_total).toBeCloseTo(11000, 2);
  });

  it('prorratea entre líneas en proporción al bruto de cada una', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 66000, tax_rate: 0.1 },  // 60% del bruto
      { quantity: 1, unit_price: 44000, tax_rate: 0.1 },  // 40% del bruto
    ];
    const discounted = applyGeneralDiscount(items, 10000);

    expect(discounted[0].discount_total).toBe(6000);
    expect(discounted[1].discount_total).toBe(4000);

    const totals = calculateSaleTotals(discounted);
    expect(totals.discount_total).toBeCloseTo(10000, 2);
    expect(totals.total).toBeCloseTo(100000, 2);
  });

  it('combina con descuentos por línea existentes', () => {
    const items: SaleItem[] = [
      { quantity: 2, unit_price: 11000, tax_rate: 0.1, discount_amount: 500 },
    ];
    // Bruto 22000, descuento por línea existente = 2×500 = 1000,
    // prorrateo de 1100 (5% de 22000) → discount_total 2100
    const discounted = applyGeneralDiscount(items, 1100);

    expect(discounted[0].discount_total).toBeCloseTo(2100, 2);

    const totals = calculateSaleTotals(discounted);
    expect(totals.discount_total).toBeCloseTo(2100, 2);
    expect(totals.total).toBeCloseTo(19900, 2);
  });

  it('no descuenta más que el bruto total (descuento excesivo se satura)', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 50000, tax_rate: 0.1 },
    ];
    const discounted = applyGeneralDiscount(items, 999999);

    expect(discounted[0].discount_total).toBe(50000);
    const totals = calculateSaleTotals(discounted);
    expect(totals.total).toBeCloseTo(0, 2);
    expect(totals.tax_amount).toBeCloseTo(0, 2);
  });

  it('ignora descuentos nulos o negativos', () => {
    const items: SaleItem[] = [
      { quantity: 1, unit_price: 11000, tax_rate: 0.1 },
    ];
    expect(applyGeneralDiscount(items, 0)).toEqual(items);
    expect(applyGeneralDiscount(items, -100)).toEqual(items);
  });
});
