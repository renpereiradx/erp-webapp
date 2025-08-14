import { describe, test, expect, vi, beforeEach } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { act } from 'react';
import { productService } from '@/services/productService';

// Mock productService.updateProduct
vi.mock('@/services/productService', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    productService: {
      ...mod.productService,
      updateProduct: vi.fn(async (_id, data) => ({ id: _id, ...data })),
    }
  };
});

describe('Bulk actions', () => {
  beforeEach(() => {
    useProductStore.getState().reset();
    // seed products
    act(() => {
      useProductStore.setState({
        products: [
          { id: 'A', name: 'Prod A', is_active: false },
          { id: 'B', name: 'Prod B', is_active: false },
          { id: 'C', name: 'Prod C', is_active: true },
        ],
        productsById: {
          A: { id: 'A', name: 'Prod A', is_active: false },
          B: { id: 'B', name: 'Prod B', is_active: false },
          C: { id: 'C', name: 'Prod C', is_active: true },
        }
      });
    });
  });

  test('bulkActivate sets items active and clears selection', async () => {
    const { toggleSelect, bulkActivate } = useProductStore.getState();
    act(() => {
      toggleSelect('A');
      toggleSelect('B');
    });
    await act(async () => { await bulkActivate(); });
    const state = useProductStore.getState();
    expect(state.productsById.A.is_active).toBe(true);
    expect(state.productsById.B.is_active).toBe(true);
    expect(state.selectedIds).toHaveLength(0);
  });

  test('bulkDeactivate sets items inactive and clears selection', async () => {
    const { toggleSelect, bulkDeactivate } = useProductStore.getState();
    act(() => {
      toggleSelect('C');
    });
    await act(async () => { await bulkDeactivate(); });
    const state = useProductStore.getState();
    expect(state.productsById.C.is_active).toBe(false);
    expect(state.selectedIds).toHaveLength(0);
  });
});
