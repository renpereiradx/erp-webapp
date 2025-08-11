import { describe, test, expect, vi } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { productService } from '@/services/productService';

describe('useProductStore searchProducts abort', () => {
  test('retorna aborted:true y no actualiza estado en cancelación', async () => {
    const spy = vi.spyOn(productService, 'searchProducts').mockImplementation((_term, { signal } = {}) => {
      return new Promise((resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
        }
        // no resolve/reject a menos que se aborte
      });
    });

    const controller = new AbortController();
    const store = useProductStore.getState();

    const p = store.searchProducts('abcdef', { signal: controller.signal });
    controller.abort();

    const res = await p;
    expect(res.aborted).toBe(true);

    const { products, totalProducts, error } = useProductStore.getState();
    expect(products).toEqual([]);
    expect(totalProducts).toBe(0);
    expect(error === null || error === undefined).toBe(true);

    spy.mockRestore();
  });
});
