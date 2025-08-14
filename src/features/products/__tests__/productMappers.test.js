import { describe, test, expect } from 'vitest';
import { mapApiProduct, mapApiProducts } from '@/features/products/services/productMappers';

describe('productMappers', () => {
  test('mapApiProduct normaliza campos', () => {
    const api = { id: '10', code: 'P-10', name: 'Prod 10', category_id: 3, is_active: false, stock_quantity: 5, price: 12.5, price_formatted: '$12.50', has_unit_pricing: true };
    const d = mapApiProduct(api);
    expect(d).toMatchObject({ id: '10', code: 'P-10', name: 'Prod 10', categoryId: 3, isActive: false, stockQuantity: 5, price: 12.5, priceFormatted: '$12.50', hasUnitPricing: true });
  });
  test('mapApiProducts maneja arrays', () => {
    const arr = [ { id: 1, name: 'A' }, { id: 2, name: 'B' } ];
    const out = mapApiProducts(arr);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe(1);
  });
});
