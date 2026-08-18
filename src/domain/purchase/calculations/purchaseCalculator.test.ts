import { describe, it, expect } from 'vitest';
import { calculatePurchaseTotals, PurchaseItem } from './purchaseCalculator';

describe('calculatePurchaseTotals', () => {
  it('extrae IVA 10% de precios de proveedor con IVA incluido', () => {
    const items: PurchaseItem[] = [
      { quantity: 2, unit_price: 11000, tax_rate: 0.1 },
    ];
    const totals = calculatePurchaseTotals(items);

    expect(totals.subtotal).toBe(22000);
    expect(totals.total).toBe(22000);
    expect(totals.iva10).toBeCloseTo(2000, 2);
    expect(totals.iva5).toBe(0);
    expect(totals.tax).toBeCloseTo(2000, 2);
    expect(totals.tax_buckets).toEqual([{ percent: 10, amount: 2000 }]);
  });

  it('incluye tasas no estándar (13%) en tax y tax_buckets', () => {
    const items: PurchaseItem[] = [
      { quantity: 1, unit_price: 11300, tax_rate: 0.13 },
    ];
    const totals = calculatePurchaseTotals(items);

    expect(totals.tax_buckets).toEqual([{ percent: 13, amount: 1300 }]);
    expect(totals.tax).toBeCloseTo(1300, 2);
    expect(totals.iva10).toBe(0);
    expect(totals.iva5).toBe(0);
  });

  it('trata la tasa 0 como exenta', () => {
    const items: PurchaseItem[] = [
      { quantity: 1, unit_price: 8000, tax_rate: 0 },
    ];
    const totals = calculatePurchaseTotals(items);

    expect(totals.exento).toBe(8000);
    expect(totals.tax).toBe(0);
    expect(totals.tax_buckets).toEqual([]);
  });

  it('usa la tasa global cuando la línea no trae tasa', () => {
    const items: PurchaseItem[] = [{ quantity: 1, unit_price: 11000 }];
    const totals = calculatePurchaseTotals(items, 0.1);

    expect(totals.tax).toBeCloseTo(1000, 2);
    expect(totals.iva10).toBeCloseTo(1000, 2);
  });

  it('prioriza la tasa del ítem sobre la global (incluida la exenta)', () => {
    const items: PurchaseItem[] = [
      { quantity: 1, unit_price: 11000, tax_rate: 0 },
    ];
    const totals = calculatePurchaseTotals(items, 0.1);

    expect(totals.exento).toBe(11000);
    expect(totals.tax).toBe(0);
  });
});
