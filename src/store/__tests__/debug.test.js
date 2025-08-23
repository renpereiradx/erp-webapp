import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSalesStore } from '../useSalesStore';

describe('Debug Store Discount', () => {
  test('debug discount application', () => {
    // Reset store
    act(() => {
      useSalesStore.setState({
        currentSale: {
          id: null,
          customerId: null,
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          discount: 0,
          status: 'draft',
          paymentStatus: 'pending',
          reservationId: null,
          notes: '',
          createdAt: null,
          updatedAt: null
        }
      });
    });

    const store = useSalesStore.getState();
    const item = { productId: 'prod_1', quantity: 2, unitPrice: 10.00 };

    // Add item
    act(() => {
      store.initializeNewSale();
      store.addItemToSale(item);
    });

    console.log('After adding item:', useSalesStore.getState().currentSale);

    // Recalculate
    act(() => {
      store.recalculateTotals();
    });

    console.log('After recalculate:', useSalesStore.getState().currentSale);

    // Apply discount
    act(() => {
      store.applyDiscount(5.00);
    });

    console.log('After discount:', useSalesStore.getState().currentSale);

    const finalState = useSalesStore.getState().currentSale;
    expect(finalState.discount).toBe(5.00);
  });
});
