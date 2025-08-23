/**
 * Sales Store Tests - Enterprise Grade
 * Comprehensive unit tests for sales state management
 * 
 * Test Coverage:
 * - Store initialization and state management
 * - Sales CRUD operations
 * - Real-time calculations and updates
 * - Cross-store integration
 * - Performance and memory management
 * 
 * Target Coverage: ≥90%
 * Enfoque: Hardened Testing with state management patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSalesStore } from '@/store/useSalesStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { 
  renderWithProviders, 
  mockData, 
  storeHelpers, 
  interactionHelpers,
  asyncUtils,
  performanceUtils 
} from '@/test/utils.jsx';

// Mock services
vi.mock('@/services/salesService', () => ({
  salesService: {
    createSale: vi.fn(),
    getSaleById: vi.fn(),
    updateSaleStatus: vi.fn(),
    calculateTotals: vi.fn().mockReturnValue({
      subtotal: 100,
      tax: 16,
      total: 116
    })
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    recordError: vi.fn()
  }
}));

describe('useSalesStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    storeHelpers.resetAllStores();
    vi.clearAllMocks();
  });

  describe('Store Initialization', () => {
    describe('Store Initialization', () => {
    test('should initialize with correct default state', () => {
      // Arrange
      renderHook(() => useSalesStore());

      // Act
      const store = useSalesStore.getState();

      // Assert
      expect(store.salesHistory).toEqual([]);
      expect(store.currentSale).toBeDefined();
      expect(store.currentSale.id).toBeNull();
      expect(store.loading).toBeDefined();
      expect(store.errors).toBeDefined();
      expect(store.ui.filters).toBeDefined();
      expect(store.ui.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0
      });
    });

    test('should have all required action methods', () => {
      // Arrange
      const store = useSalesStore.getState();
      const requiredMethods = [
        'createSale', 'getSaleDetails', 'cancelSale',
        'initializeNewSale', 'updateCurrentSale', 'addItemToSale',
        'removeItemFromSale', 'updateItemQuantity', 'applyDiscount',
        'recalculateTotals', 'loadSalesHistory', 'loadSalesStatistics',
        'setActiveStep', 'selectCustomer', 'updateFilters',
        'updatePagination', 'toggleReceipt', 'clearError',
        'clearAllErrors', 'getFilteredHistory', 'getCurrentSaleSummary',
        'isCurrentSaleValid'
      ];

      // Assert
      requiredMethods.forEach(method => {
        expect(typeof store[method]).toBe('function');
      });
    });
    });
  });

  describe('Sales Management', () => {
    it('should add a sale to the store', () => {
      // Arrange
      const sale = mockData.sale();
      const store = useSalesStore.getState();

      // Act
      act(() => {
        store.addSale(sale);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales).toHaveLength(1);
      expect(updatedStore.sales[0]).toEqual(sale);
    });

    it('should update an existing sale', () => {
      // Arrange
      const originalSale = mockData.sale({ id: 'sale_123', status: 'pending' });
      const store = useSalesStore.getState();

      // Add initial sale
      act(() => {
        store.addSale(originalSale);
      });

      // Act - Update sale
      const updatedSale = { ...originalSale, status: 'completed' };
      act(() => {
        store.updateSale('sale_123', updatedSale);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales[0].status).toBe('completed');
    });

    it('should remove a sale from the store', () => {
      // Arrange
      const sale1 = mockData.sale({ id: 'sale_1' });
      const sale2 = mockData.sale({ id: 'sale_2' });
      const store = useSalesStore.getState();

      act(() => {
        store.setSales([sale1, sale2]);
      });

      // Act
      act(() => {
        store.removeSale('sale_1');
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales).toHaveLength(1);
      expect(updatedStore.sales[0].id).toBe('sale_2');
    });

    it('should set current sale', () => {
      // Arrange
      const sale = mockData.sale();
      const store = useSalesStore.getState();

      // Act
      act(() => {
        store.setCurrentSale(sale);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale).toEqual(sale);
    });

    it('should clear current sale', () => {
      // Arrange
      const sale = mockData.sale();
      const store = useSalesStore.getState();

      act(() => {
        store.setCurrentSale(sale);
      });

      // Act
      act(() => {
        store.clearCurrentSale();
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale).toBeNull();
    });
  });

  describe('Current Sale Management', () => {
    it('should add item to current sale', () => {
      // Arrange
      const sale = mockData.sale({ items: [] });
      const item = mockData.saleItem();
      const store = useSalesStore.getState();

      act(() => {
        store.setCurrentSale(sale);
      });

      // Act
      act(() => {
        store.addItemToSale(item);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale.items).toHaveLength(1);
      expect(updatedStore.currentSale.items[0]).toEqual(item);
    });

    it('should update item quantity in current sale', () => {
      // Arrange
      const item = mockData.saleItem({ productId: 'product_1', quantity: 1 });
      const sale = mockData.sale({ items: [item] });
      const store = useSalesStore.getState();

      act(() => {
        store.setCurrentSale(sale);
      });

      // Act
      act(() => {
        store.updateItemQuantity('product_1', 3);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale.items[0].quantity).toBe(3);
    });

    it('should remove item from current sale', () => {
      // Arrange
      const item1 = mockData.saleItem({ productId: 'product_1' });
      const item2 = mockData.saleItem({ productId: 'product_2' });
      const sale = mockData.sale({ items: [item1, item2] });
      const store = useSalesStore.getState();

      act(() => {
        store.setCurrentSale(sale);
      });

      // Act
      act(() => {
        store.removeItemFromSale('product_1');
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale.items).toHaveLength(1);
      expect(updatedStore.currentSale.items[0].productId).toBe('product_2');
    });

    it('should recalculate totals when items change', () => {
      // Arrange
      const item = mockData.saleItem({ unitPrice: 100, quantity: 2 });
      const sale = mockData.sale({ items: [item] });
      const store = useSalesStore.getState();

      act(() => {
        store.setCurrentSale(sale);
      });

      // Act
      act(() => {
        store.recalculateTotals();
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale.subtotal).toBe(200);
      expect(updatedStore.currentSale.tax).toBe(32); // 16% of 200
      expect(updatedStore.currentSale.total).toBe(232);
    });
  });

  describe('Async Operations', () => {
    it('should handle sale creation successfully', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      const saleData = mockData.sale();
      const createdSale = { ...saleData, id: 'sale_123' };

      salesService.createSale.mockResolvedValue({
        success: true,
        data: createdSale
      });

      const store = useSalesStore.getState();

      // Act
      await act(async () => {
        await store.createSale(saleData);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales).toContain(createdSale);
      expect(updatedStore.loading).toBe(false);
      expect(updatedStore.error).toBeNull();
      expect(salesService.createSale).toHaveBeenCalledWith(saleData);
    });

    it('should handle sale creation errors', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      const saleData = mockData.sale();
      const error = new Error('Sale creation failed');

      salesService.createSale.mockRejectedValue(error);

      const store = useSalesStore.getState();

      // Act
      await act(async () => {
        try {
          await store.createSale(saleData);
        } catch (e) {
          // Error is expected
        }
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.loading).toBe(false);
      expect(updatedStore.error).toBe('Sale creation failed');
      expect(updatedStore.sales).toHaveLength(0);
    });

    it('should load sales with filters', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      const sales = [mockData.sale(), mockData.sale()];
      const filters = { status: 'completed' };

      salesService.getSales = vi.fn().mockResolvedValue({
        success: true,
        data: sales
      });

      const store = useSalesStore.getState();

      // Act
      await act(async () => {
        await store.loadSales(filters);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales).toEqual(sales);
      expect(updatedStore.loading).toBe(false);
      expect(salesService.getSales).toHaveBeenCalledWith(filters);
    });

    it('should load sale by ID', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      const sale = mockData.sale({ id: 'sale_123' });

      salesService.getSaleById.mockResolvedValue({
        success: true,
        data: sale
      });

      const store = useSalesStore.getState();

      // Act
      await act(async () => {
        await store.loadSaleById('sale_123');
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.currentSale).toEqual(sale);
      expect(updatedStore.loading).toBe(false);
      expect(salesService.getSaleById).toHaveBeenCalledWith('sale_123');
    });
  });

  describe('Error Handling', () => {
    it('should set loading state during async operations', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      
      // Create a promise that we can control
      let resolvePromise;
      const controlledPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      salesService.createSale.mockReturnValue(controlledPromise);

      const store = useSalesStore.getState();

      // Act - Start async operation
      const operationPromise = act(async () => {
        return store.createSale(mockData.sale());
      });

      // Assert - Loading should be true during operation
      expect(useSalesStore.getState().loading).toBe(true);

      // Complete the operation
      resolvePromise({ success: true, data: mockData.sale() });
      await operationPromise;

      // Assert - Loading should be false after completion
      expect(useSalesStore.getState().loading).toBe(false);
    });

    it('should clear errors when starting new operations', async () => {
      // Arrange
      const store = useSalesStore.getState();

      // Set initial error
      act(() => {
        store.setError('Previous error');
      });

      expect(useSalesStore.getState().error).toBe('Previous error');

      // Act - Start new operation
      act(() => {
        store.setLoading(true);
        store.clearError();
      });

      // Assert
      expect(useSalesStore.getState().error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const { salesService } = await import('@/services/salesService');
      const networkError = new Error('Network error');
      networkError.code = 'NETWORK_ERROR';

      salesService.createSale.mockRejectedValue(networkError);

      const store = useSalesStore.getState();

      // Act
      await act(async () => {
        try {
          await store.createSale(mockData.sale());
        } catch (e) {
          // Expected error
        }
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.error).toBe('Network error');
      expect(updatedStore.loading).toBe(false);
    });
  });

  describe('Cross-Store Integration', () => {
    it('should integrate with payment store for sale completion', async () => {
      // Arrange
      const sale = mockData.sale();
      const payment = mockData.payment();
      
      const salesStore = useSalesStore.getState();
      const paymentStore = usePaymentStore.getState();

      // Act
      act(() => {
        salesStore.setCurrentSale(sale);
        paymentStore.setCurrentPayment(payment);
      });

      // Simulate sale completion
      act(() => {
        salesStore.completeSaleWithPayment(sale.id, payment);
      });

      // Assert
      const updatedSalesStore = useSalesStore.getState();
      const updatedSale = updatedSalesStore.sales.find(s => s.id === sale.id);
      expect(updatedSale?.status).toBe('completed');
      expect(updatedSale?.paymentId).toBe(payment.id);
    });

    it('should sync current sale with payment store', async () => {
      // Arrange
      const sale = mockData.sale();
      const salesStore = useSalesStore.getState();

      // Act
      act(() => {
        salesStore.setCurrentSale(sale);
      });

      // Assert - Payment store should be notified
      await asyncUtils.waitForStoreUpdate(
        usePaymentStore,
        (state) => state.currentSaleId === sale.id
      );

      const paymentStore = usePaymentStore.getState();
      expect(paymentStore.currentSaleId).toBe(sale.id);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should limit the number of sales kept in memory', () => {
      // Arrange
      const maxSales = 100; // Assume this is the limit
      const sales = Array.from({ length: 120 }, (_, i) => 
        mockData.sale({ id: `sale_${i}` })
      );

      const store = useSalesStore.getState();

      // Act
      act(() => {
        store.setSales(sales);
      });

      // Assert
      const updatedStore = useSalesStore.getState();
      expect(updatedStore.sales.length).toBeLessThanOrEqual(maxSales);
    });

    it('should efficiently update large lists of sales', () => {
      // Arrange
      const largeSalesList = Array.from({ length: 1000 }, (_, i) => 
        mockData.sale({ id: `sale_${i}` })
      );

      const store = useSalesStore.getState();
      const startTime = performance.now();

      // Act
      act(() => {
        store.setSales(largeSalesList);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert - Should complete within reasonable time
      expect(executionTime).toBeLessThan(100); // 100ms threshold
    });

    it('should properly cleanup resources on store reset', () => {
      // Arrange
      const store = useSalesStore.getState();
      
      // Add some data
      act(() => {
        store.setSales([mockData.sale(), mockData.sale()]);
        store.setCurrentSale(mockData.sale());
        store.setError('Some error');
      });

      // Act
      act(() => {
        store.reset();
      });

      // Assert
      const resetStore = useSalesStore.getState();
      expect(resetStore.sales).toEqual([]);
      expect(resetStore.currentSale).toBeNull();
      expect(resetStore.error).toBeNull();
      expect(resetStore.loading).toBe(false);
    });
  });

  describe('Filtering and Search', () => {
    it('should filter sales by status', () => {
      // Arrange
      const sales = [
        mockData.sale({ id: 'sale_1', status: 'completed' }),
        mockData.sale({ id: 'sale_2', status: 'pending' }),
        mockData.sale({ id: 'sale_3', status: 'completed' })
      ];

      const store = useSalesStore.getState();

      act(() => {
        store.setSales(sales);
        store.setFilters({ status: 'completed' });
      });

      // Act
      const filteredSales = store.getFilteredSales();

      // Assert
      expect(filteredSales).toHaveLength(2);
      expect(filteredSales.every(sale => sale.status === 'completed')).toBe(true);
    });

    it('should filter sales by date range', () => {
      // Arrange
      const sales = [
        mockData.sale({ 
          id: 'sale_1', 
          createdAt: '2025-08-01T10:00:00Z' 
        }),
        mockData.sale({ 
          id: 'sale_2', 
          createdAt: '2025-08-15T10:00:00Z' 
        }),
        mockData.sale({ 
          id: 'sale_3', 
          createdAt: '2025-08-30T10:00:00Z' 
        })
      ];

      const store = useSalesStore.getState();

      act(() => {
        store.setSales(sales);
        store.setFilters({ 
          dateFrom: '2025-08-10',
          dateTo: '2025-08-20'
        });
      });

      // Act
      const filteredSales = store.getFilteredSales();

      // Assert
      expect(filteredSales).toHaveLength(1);
      expect(filteredSales[0].id).toBe('sale_2');
    });

    it('should search sales by customer name', () => {
      // Arrange
      const sales = [
        mockData.sale({ 
          id: 'sale_1', 
          customerName: 'Juan Pérez' 
        }),
        mockData.sale({ 
          id: 'sale_2', 
          customerName: 'María García' 
        }),
        mockData.sale({ 
          id: 'sale_3', 
          customerName: 'Juan Carlos' 
        })
      ];

      const store = useSalesStore.getState();

      act(() => {
        store.setSales(sales);
      });

      // Act
      const searchResults = store.searchSales('Juan');

      // Assert
      expect(searchResults).toHaveLength(2);
      expect(searchResults.every(sale => sale.customerName.includes('Juan'))).toBe(true);
    });
  });

  describe('Telemetry and Analytics', () => {
    it('should record telemetry for store operations', async () => {
      // Arrange
      const { telemetry } = await import('@/utils/telemetry');
      const sale = mockData.sale();
      const store = useSalesStore.getState();

      // Act
      act(() => {
        store.addSale(sale);
      });

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'store.sales.add',
        expect.objectContaining({
          saleId: sale.id,
          amount: sale.total
        })
      );
    });

    it('should provide sales analytics', () => {
      // Arrange
      const sales = [
        mockData.sale({ total: 100, status: 'completed' }),
        mockData.sale({ total: 200, status: 'completed' }),
        mockData.sale({ total: 150, status: 'pending' })
      ];

      const store = useSalesStore.getState();

      act(() => {
        store.setSales(sales);
      });

      // Act
      const analytics = store.getAnalytics();

      // Assert
      expect(analytics.totalSales).toBe(450);
      expect(analytics.completedSales).toBe(2);
      expect(analytics.pendingSales).toBe(1);
      expect(analytics.averageSaleAmount).toBe(150);
    });
  });
});
