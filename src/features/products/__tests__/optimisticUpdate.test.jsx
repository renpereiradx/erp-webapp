import { describe, test, expect, vi, beforeEach } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { act } from 'react';
import { productService } from '@/services/productService';

vi.mock('@/services/productService', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    productService: {
      ...mod.productService,
      updateProduct: vi.fn(async (id, data) => ({ id, ...data })),
    }
  };
});

describe('optimisticUpdateProduct', () => {
  beforeEach(() => {
    useProductStore.getState().reset();
    act(() => {
      useProductStore.setState({
        products: [ { id: '1', name: 'Prod 1', is_active: true } ],
        productsById: { '1': { id: '1', name: 'Prod 1', is_active: true } }
      });
    });
  });

  test('updates immediately then persists', async () => {
    const { optimisticUpdateProduct } = useProductStore.getState();
    await act(async () => { await optimisticUpdateProduct('1', { name: 'Prod 1 Updated' }); });
    const state = useProductStore.getState();
    expect(state.productsById['1'].name).toBe('Prod 1 Updated');
  });
});
