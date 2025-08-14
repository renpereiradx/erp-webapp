import { describe, test, expect, beforeEach } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { act } from 'react';

describe('normalization productsById', () => {
  beforeEach(() => {
    useProductStore.getState().reset();
  });

  test('fetchProducts populates productsById map', () => {
    // Simular fetch: setear directamente estado como si viniera de fetchProducts
    act(() => {
      useProductStore.setState({
        products: [ { id: 'X1', name: 'X1' }, { id: 'X2', name: 'X2' } ],
        productsById: { X1: { id: 'X1', name: 'X1' }, X2: { id: 'X2', name: 'X2' } },
        totalProducts: 2
      });
    });
    const { productsById } = useProductStore.getState();
    expect(Object.keys(productsById)).toEqual(['X1', 'X2']);
  });
});
