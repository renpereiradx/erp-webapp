/**
 * Sales Store Tests - Wave 8
 * Comprehensive test suite for the sales state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSalesStore } from '../../store/useSalesStore';
import { createMockSale, createMockClient, mockApiSuccess, mockApiError } from '../testUtils.jsx';

// Mock the sales service
vi.mock('../../services/salesService', () => ({
  salesService: {
    createSale: vi.fn(),
    getSales: vi.fn(),
    getSaleById: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
    processPayment: vi.fn(),
    cancelSale: vi.fn()
  }
}));

import { salesService } from '../../services/salesService';

describe('useSalesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useSalesStore());
    act(() => {
      result.current.reset();
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSalesStore());

      expect(result.current.sales).toEqual([]);
      expect(result.current.currentSale).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual({
        status: 'all',
        dateRange: 'all',
        client: null
      });
    });
  });

  describe('Sales Loading', () => {
    it('should load sales successfully', async () => {
      const mockSales = [createMockSale(), createMockSale()];
      salesService.getSales.mockResolvedValue({ success: true, data: mockSales });

      const { result } = renderHook(() => useSalesStore());

      await act(async () => {
        await result.current.loadSales();
      });

      expect(result.current.sales).toEqual(mockSales);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(salesService.getSales).toHaveBeenCalledWith(result.current.filters);
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load sales';
      salesService.getSales.mockResolvedValue({ success: false, error: errorMessage });

      const { result } = renderHook(() => useSalesStore());

      await act(async () => {
        await result.current.loadSales();
      });

      expect(result.current.sales).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should set loading state during async operations', async () => {
      let resolvePromise;
      const loadingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      salesService.getSales.mockReturnValue(loadingPromise);

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.loadSales();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ success: true, data: [] });
        await loadingPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Sale Creation', () => {
    it('should create a sale successfully', async () => {
      const newSale = createMockSale();
      const saleData = {
        clientId: 'client_1',
        items: [{ productId: 'product_1', quantity: 2, price: 25.00 }],
        total: 50.00
      };

      salesService.createSale.mockResolvedValue({ success: true, data: newSale });

      const { result } = renderHook(() => useSalesStore());

      await act(async () => {
        await result.current.createSale(saleData);
      });

      expect(result.current.sales).toContain(newSale);
      expect(result.current.currentSale).toEqual(newSale);
      expect(result.current.error).toBeNull();
      expect(salesService.createSale).toHaveBeenCalledWith(saleData);
    });

    it('should handle creation errors', async () => {
      const errorMessage = 'Invalid sale data';
      const saleData = { clientId: '', items: [] };

      salesService.createSale.mockResolvedValue({ success: false, error: errorMessage });

      const { result } = renderHook(() => useSalesStore());

      await act(async () => {
        await result.current.createSale(saleData);
      });

      expect(result.current.sales).toEqual([]);
      expect(result.current.currentSale).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should implement optimistic updates', async () => {
      const saleData = {
        clientId: 'client_1',
        items: [{ productId: 'product_1', quantity: 1, price: 25.00 }],
        total: 25.00
      };

      let resolvePromise;
      const creationPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      salesService.createSale.mockReturnValue(creationPromise);

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.createSale(saleData);
      });

      // Should have optimistic sale immediately
      expect(result.current.sales).toHaveLength(1);
      expect(result.current.sales[0]).toMatchObject({
        ...saleData,
        status: 'pending'
      });

      await act(async () => {
        resolvePromise({ success: true, data: createMockSale(saleData) });
        await creationPromise;
      });

      // Should replace optimistic sale with real one
      expect(result.current.sales).toHaveLength(1);
      expect(result.current.sales[0].status).not.toBe('pending');
    });
  });

  describe('Sale Updates', () => {
    it('should update a sale successfully', async () => {
      const existingSale = createMockSale();
      const updatedSale = { ...existingSale, status: 'completed' };

      salesService.updateSale.mockResolvedValue({ success: true, data: updatedSale });

      const { result } = renderHook(() => useSalesStore());

      // Set initial sales
      act(() => {
        result.current.setSales([existingSale]);
      });

      await act(async () => {
        await result.current.updateSale(existingSale.id, { status: 'completed' });
      });

      expect(result.current.sales[0]).toEqual(updatedSale);
      expect(result.current.error).toBeNull();
    });

    it('should handle update errors', async () => {
      const existingSale = createMockSale();
      const errorMessage = 'Cannot update sale';

      salesService.updateSale.mockResolvedValue({ success: false, error: errorMessage });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setSales([existingSale]);
      });

      await act(async () => {
        await result.current.updateSale(existingSale.id, { status: 'invalid' });
      });

      expect(result.current.sales[0]).toEqual(existingSale); // Should remain unchanged
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Sale Deletion', () => {
    it('should delete a sale successfully', async () => {
      const saleToDelete = createMockSale();
      const otherSale = createMockSale();

      salesService.deleteSale.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setSales([saleToDelete, otherSale]);
      });

      await act(async () => {
        await result.current.deleteSale(saleToDelete.id);
      });

      expect(result.current.sales).toEqual([otherSale]);
      expect(result.current.error).toBeNull();
    });

    it('should handle deletion errors', async () => {
      const saleToDelete = createMockSale();
      const errorMessage = 'Cannot delete completed sale';

      salesService.deleteSale.mockResolvedValue({ success: false, error: errorMessage });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setSales([saleToDelete]);
      });

      await act(async () => {
        await result.current.deleteSale(saleToDelete.id);
      });

      expect(result.current.sales).toEqual([saleToDelete]); // Should remain unchanged
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Filters', () => {
    it('should update filters and reload sales', async () => {
      const mockSales = [createMockSale({ status: 'completed' })];
      salesService.getSales.mockResolvedValue({ success: true, data: mockSales });

      const { result } = renderHook(() => useSalesStore());

      const newFilters = {
        status: 'completed',
        dateRange: 'today',
        client: 'client_1'
      };

      await act(async () => {
        await result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
      expect(salesService.getSales).toHaveBeenCalledWith(newFilters);
      expect(result.current.sales).toEqual(mockSales);
    });

    it('should clear filters', async () => {
      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setFilters({ status: 'completed' });
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        status: 'all',
        dateRange: 'all',
        client: null
      });
    });
  });

  describe('Current Sale Management', () => {
    it('should set and clear current sale', () => {
      const sale = createMockSale();
      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setCurrentSale(sale);
      });

      expect(result.current.currentSale).toEqual(sale);

      act(() => {
        result.current.clearCurrentSale();
      });

      expect(result.current.currentSale).toBeNull();
    });

    it('should load sale by ID and set as current', async () => {
      const sale = createMockSale();
      salesService.getSaleById.mockResolvedValue({ success: true, data: sale });

      const { result } = renderHook(() => useSalesStore());

      await act(async () => {
        await result.current.loadSaleById(sale.id);
      });

      expect(result.current.currentSale).toEqual(sale);
      expect(salesService.getSaleById).toHaveBeenCalledWith(sale.id);
    });
  });

  describe('Payment Processing', () => {
    it('should process payment successfully', async () => {
      const sale = createMockSale();
      const paymentData = {
        method: 'cash',
        amount: 100.00,
        received: 120.00
      };
      const paymentResult = {
        success: true,
        change: 20.00,
        transactionId: 'txn_123'
      };

      salesService.processPayment.mockResolvedValue({ success: true, data: paymentResult });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setCurrentSale(sale);
      });

      await act(async () => {
        await result.current.processPayment(paymentData);
      });

      expect(result.current.error).toBeNull();
      expect(salesService.processPayment).toHaveBeenCalledWith({
        saleId: sale.id,
        ...paymentData
      });
    });

    it('should handle payment errors', async () => {
      const sale = createMockSale();
      const paymentData = { method: 'card', amount: 100.00 };
      const errorMessage = 'Payment declined';

      salesService.processPayment.mockResolvedValue({ success: false, error: errorMessage });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setCurrentSale(sale);
      });

      await act(async () => {
        await result.current.processPayment(paymentData);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Sale Cancellation', () => {
    it('should cancel sale successfully', async () => {
      const sale = createMockSale();
      const cancellationData = {
        reason: 'Customer request',
        refundMethod: 'cash'
      };
      const cancellationResult = {
        cancelled: true,
        refundAmount: 100.00
      };

      salesService.cancelSale.mockResolvedValue({ success: true, data: cancellationResult });

      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setSales([sale]);
        result.current.setCurrentSale(sale);
      });

      await act(async () => {
        await result.current.cancelSale(sale.id, cancellationData);
      });

      expect(result.current.error).toBeNull();
      expect(salesService.cancelSale).toHaveBeenCalledWith(sale.id, cancellationData);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useSalesStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle concurrent operations gracefully', async () => {
      const { result } = renderHook(() => useSalesStore());

      // Start multiple loading operations simultaneously
      const promises = [
        result.current.loadSales(),
        result.current.loadSales(),
        result.current.loadSales()
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Should not cause race conditions or multiple loading states
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useSalesStore());
      const sales = [createMockSale()];

      act(() => {
        result.current.setSales(sales);
      });

      // Check if localStorage was called
      const persistedState = JSON.parse(localStorage.getItem('sales-store') || '{}');
      expect(persistedState.sales).toEqual(sales);
    });

    it('should restore state from localStorage on initialization', () => {
      const persistedSales = [createMockSale()];
      localStorage.setItem('sales-store', JSON.stringify({
        sales: persistedSales,
        filters: { status: 'completed' }
      }));

      const { result } = renderHook(() => useSalesStore());

      expect(result.current.sales).toEqual(persistedSales);
      expect(result.current.filters.status).toBe('completed');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of sales efficiently', async () => {
      const largeSalesList = Array.from({ length: 1000 }, () => createMockSale());
      salesService.getSales.mockResolvedValue({ success: true, data: largeSalesList });

      const { result } = renderHook(() => useSalesStore());

      const start = performance.now();
      
      await act(async () => {
        await result.current.loadSales();
      });

      const end = performance.now();

      expect(result.current.sales).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    it('should debounce filter updates', async () => {
      const { result } = renderHook(() => useSalesStore());

      // Rapidly change filters
      act(() => {
        result.current.setFilters({ status: 'pending' });
        result.current.setFilters({ status: 'completed' });
        result.current.setFilters({ status: 'cancelled' });
      });

      // Should only make one API call after debounce
      expect(salesService.getSales).toHaveBeenCalledTimes(1);
    });
  });
});
