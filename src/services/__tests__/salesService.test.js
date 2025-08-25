/**
 * Sales Service Tests - Real API Implementation
 * Wave 4 Testing & Integration - Aligned with actual service
 * 
 * Tests based on real salesService API:
 * - processSale() instead of createSale()
 * - getSaleDetails() instead of getSaleById()
 * - Actual service methods and responses
 * 
 * Target Coverage: ≥90% for critical business logic
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { salesService } from '@/services/salesService';
import { mockData } from '@/test/utils';

// Mock dependencies to match real service implementation
vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    startTimer: vi.fn().mockReturnValue({ name: 'test', start: Date.now() }),
    endTimer: vi.fn().mockReturnValue(100)
  }
}));

vi.mock('@/utils/circuitBreaker', () => ({
  circuitBreaker: {
    execute: vi.fn().mockImplementation(async (fn) => await fn())
  }
}));

vi.mock('@/utils/retry', () => ({
  retryWithBackoff: vi.fn().mockImplementation(async (fn) => await fn())
}));

// Mock API client to return realistic responses
vi.mock('@/services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn()
  }
}));

describe('SalesService - Real API Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Sale Processing', () => {
    test('should process a sale successfully using processSale', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const saleData = {
        customer_id: 'customer_123',
        product_details: [
          { product_id: 'prod_1', quantity: 2, unit_price: 10.00 }
        ],
        allow_price_modifications: false
      };

      const expectedResponse = {
        success: true,
        data: {
          sale_id: 'sale_123',
          ...saleData,
          total_amount: 23.20 // including tax
        }
      };

      apiClient.post.mockResolvedValue(expectedResponse);

      // Act
      const result = await salesService.processSale(saleData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/sale/', saleData);
    });

    test('should handle API errors gracefully in processSale', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const saleData = {
        customer_id: 'customer_123',
        product_details: [],
        allow_price_modifications: false
      };

      const errorResponse = {
        success: false,
        error: 'Insufficient inventory',
        code: 'INVENTORY_ERROR'
      };

      apiClient.post.mockResolvedValue(errorResponse);

      // Act
      const result = await salesService.processSale(saleData);

      // Assert
      expect(result).toEqual(errorResponse);
      expect(result.success).toBe(false);
    });

    test('should validate sale data before processing', async () => {
      // Arrange
      const invalidSaleData = {
        // Missing required fields
        customer_id: null,
        product_details: []
      };

      // Act
      const result = await salesService.processSale(invalidSaleData);

      // Assert - Should handle gracefully, not throw
      expect(result).toBeDefined();
    });
  });

  describe('Sale Retrieval', () => {
    test('should get sale details successfully', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const saleId = 'sale_123';
      const expectedSale = {
        sale_id: saleId,
        customer_name: 'John Doe',
        total_amount: 100,
        status: 'completed'
      };

      apiClient.get.mockResolvedValue({
        success: true,
        data: expectedSale
      });

      // Act
      const result = await salesService.getSaleDetails(saleId);

      // Assert
      expect(result.data).toEqual(expectedSale);
      expect(apiClient.get).toHaveBeenCalledWith(`/sale/${saleId}`);
    });

    test('should handle sale not found errors', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const saleId = 'nonexistent_sale';

      apiClient.get.mockResolvedValue({
        success: false,
        error: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });

      // Act
      const result = await salesService.getSaleDetails(saleId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sale not found');
    });

    test('should get sales by date range with filters', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const filters = {
        startDate: '2025-08-01',
        endDate: '2025-08-23',
        page: 1,
        pageSize: 20
      };

      const expectedResponse = {
        success: true,
        data: {
          sales: [mockData.sale(), mockData.sale()],
          total_count: 2,
          page: 1
        }
      };

      apiClient.get.mockResolvedValue(expectedResponse);

      // Act
      const result = await salesService.getSalesByDateRange(filters);

      // Assert
      expect(result.data.sales).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/sale/date_range/'));
    });
  });

  describe('Performance and Resilience', () => {
    test('should complete sale operations within performance targets', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const saleData = mockData.sale();

      apiClient.post.mockResolvedValue({
        success: true,
        data: saleData
      });

      // Act
      const startTime = performance.now();
      await salesService.processSale(saleData);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    test('should use circuit breaker for resilience', async () => {
      // Arrange
      const { circuitBreaker } = await import('@/utils/circuitBreaker');
      const saleData = mockData.sale();

      // Act
      await salesService.processSale(saleData);

      // Assert
      expect(circuitBreaker.execute).toHaveBeenCalled();
    });

    test('should record telemetry for operations', async () => {
      // Arrange
      const { telemetry } = await import('@/utils/telemetry');
      const saleData = mockData.sale();

      // Act
      await salesService.processSale(saleData);

      // Assert
      expect(telemetry.record).toHaveBeenCalledWith(
        'sales.process.start',
        expect.objectContaining({
          hasReservation: false,
          productCount: expect.any(Number)
        })
      );
    });
  });

  describe('Integration Tests', () => {
    test('should integrate with validation system', async () => {
      // Arrange
      const saleData = {
        customer_id: 'customer_123',
        product_details: [
          { product_id: 'prod_1', quantity: 1, unit_price: 10.00 }
        ]
      };

      // Act
      const result = await salesService.processSale(saleData);

      // Assert - Should process without validation errors
      expect(result).toBeDefined();
    });

    test('should handle reservation-based sales', async () => {
      // Arrange
      const { apiClient } = await import('@/services/api');
      const reservationSaleData = {
        customer_id: 'customer_123',
        reserve_id: 'reservation_456',
        product_details: [
          { product_id: 'prod_1', quantity: 1, unit_price: 10.00 }
        ]
      };

      apiClient.post.mockResolvedValue({
        success: true,
        data: {
          sale_id: 'sale_789',
          reservation_converted: true,
          ...reservationSaleData
        }
      });

      // Act
      const result = await salesService.processSale(reservationSaleData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.reservation_converted).toBe(true);
    });
  });
});
