/**
 * Sales Service Tests - Wave 8
 * Comprehensive test suite for the core sales service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { salesService } from '../../services/salesService';
import { createMockSale, createMockClient, createMockProduct, mockApiSuccess, mockApiError, mockApiNetworkError } from '../testUtils.jsx';

// Mock dependencies
vi.mock('../../utils/telemetry', () => ({
  trackEvent: vi.fn(),
  trackError: vi.fn()
}));

describe('SalesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSale', () => {
    it('should create a sale successfully', async () => {
      const mockSale = createMockSale();
      const saleData = {
        clientId: 'client_1',
        items: [
          { productId: 'product_1', quantity: 2, price: 25.00 }
        ],
        paymentMethod: 'cash',
        total: 50.00
      };

      mockApiSuccess(mockSale);

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSale);
      expect(fetch).toHaveBeenCalledWith('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saleData)
      });
    });

    it('should handle API errors gracefully', async () => {
      const saleData = {
        clientId: 'client_1',
        items: [],
        total: 0
      };

      mockApiError('Invalid sale data', 400);

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sale data');
    });

    it('should handle network errors', async () => {
      const saleData = { clientId: 'client_1', items: [], total: 0 };
      
      mockApiNetworkError();

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network Error');
    });

    it('should validate required fields', async () => {
      const invalidSaleData = {
        // Missing required fields
        items: []
      };

      const result = await salesService.createSale(invalidSaleData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should calculate total correctly for multiple items', async () => {
      const mockSale = createMockSale({ total: 100.00 });
      const saleData = {
        clientId: 'client_1',
        items: [
          { productId: 'product_1', quantity: 2, price: 25.00 },
          { productId: 'product_2', quantity: 1, price: 50.00 }
        ],
        paymentMethod: 'cash'
      };

      mockApiSuccess(mockSale);

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(100.00);
    });
  });

  describe('getSales', () => {
    it('should fetch sales with default parameters', async () => {
      const mockSales = [createMockSale(), createMockSale()];
      
      mockApiSuccess(mockSales);

      const result = await salesService.getSales();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSales);
      expect(fetch).toHaveBeenCalledWith('/api/sales?page=1&limit=10');
    });

    it('should fetch sales with custom parameters', async () => {
      const mockSales = [createMockSale()];
      const filters = {
        page: 2,
        limit: 5,
        status: 'completed',
        clientId: 'client_1'
      };
      
      mockApiSuccess(mockSales);

      const result = await salesService.getSales(filters);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/sales?page=2&limit=5&status=completed&clientId=client_1');
    });

    it('should handle empty results', async () => {
      mockApiSuccess([]);

      const result = await salesService.getSales();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockApiError('Server error', 500);

      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });
  });

  describe('getSaleById', () => {
    it('should fetch a sale by ID successfully', async () => {
      const mockSale = createMockSale();
      const saleId = 'sale_123';
      
      mockApiSuccess(mockSale);

      const result = await salesService.getSaleById(saleId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSale);
      expect(fetch).toHaveBeenCalledWith(`/api/sales/${saleId}`);
    });

    it('should handle sale not found', async () => {
      const saleId = 'nonexistent_sale';
      
      mockApiError('Sale not found', 404);

      const result = await salesService.getSaleById(saleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sale not found');
    });

    it('should validate sale ID parameter', async () => {
      const result = await salesService.getSaleById('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sale ID is required');
    });
  });

  describe('updateSale', () => {
    it('should update a sale successfully', async () => {
      const saleId = 'sale_123';
      const updateData = {
        status: 'completed',
        notes: 'Updated notes'
      };
      const updatedSale = createMockSale({ ...updateData, id: saleId });
      
      mockApiSuccess(updatedSale);

      const result = await salesService.updateSale(saleId, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedSale);
      expect(fetch).toHaveBeenCalledWith(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
    });

    it('should handle update errors', async () => {
      const saleId = 'sale_123';
      const updateData = { status: 'invalid_status' };
      
      mockApiError('Invalid status', 400);

      const result = await salesService.updateSale(saleId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid status');
    });

    it('should validate parameters', async () => {
      const result = await salesService.updateSale('', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sale ID is required');
    });
  });

  describe('deleteSale', () => {
    it('should delete a sale successfully', async () => {
      const saleId = 'sale_123';
      
      mockApiSuccess({ deleted: true });

      const result = await salesService.deleteSale(saleId);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(`/api/sales/${saleId}`, {
        method: 'DELETE'
      });
    });

    it('should handle delete errors', async () => {
      const saleId = 'sale_123';
      
      mockApiError('Cannot delete completed sale', 409);

      const result = await salesService.deleteSale(saleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete completed sale');
    });

    it('should validate sale ID', async () => {
      const result = await salesService.deleteSale('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sale ID is required');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        saleId: 'sale_123',
        method: 'cash',
        amount: 100.00,
        received: 120.00
      };
      const paymentResult = {
        success: true,
        change: 20.00,
        transactionId: 'txn_123'
      };
      
      mockApiSuccess(paymentResult);

      const result = await salesService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(paymentResult);
      expect(fetch).toHaveBeenCalledWith('/api/sales/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
    });

    it('should handle payment errors', async () => {
      const paymentData = {
        saleId: 'sale_123',
        method: 'card',
        amount: 100.00
      };
      
      mockApiError('Payment declined', 402);

      const result = await salesService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment declined');
    });

    it('should calculate change correctly', async () => {
      const paymentData = {
        saleId: 'sale_123',
        method: 'cash',
        amount: 100.00,
        received: 150.00
      };
      const paymentResult = {
        success: true,
        change: 50.00
      };
      
      mockApiSuccess(paymentResult);

      const result = await salesService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.data.change).toBe(50.00);
    });
  });

  describe('cancelSale', () => {
    it('should cancel a sale successfully', async () => {
      const saleId = 'sale_123';
      const cancellationData = {
        reason: 'Customer request',
        refundMethod: 'cash'
      };
      const cancellationResult = {
        cancelled: true,
        refundAmount: 100.00
      };
      
      mockApiSuccess(cancellationResult);

      const result = await salesService.cancelSale(saleId, cancellationData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cancellationResult);
      expect(fetch).toHaveBeenCalledWith(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cancellationData)
      });
    });

    it('should handle cancellation errors', async () => {
      const saleId = 'sale_123';
      const cancellationData = { reason: 'Test' };
      
      mockApiError('Cannot cancel completed sale', 409);

      const result = await salesService.cancelSale(saleId, cancellationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot cancel completed sale');
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should implement retry logic for network failures', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: createMockSale() })
        });
      });

      const result = await salesService.getSales();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle circuit breaker pattern', async () => {
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        mockApiError('Server error', 500);
        await salesService.getSales();
      }

      // Next call should be blocked by circuit breaker
      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Circuit breaker');
    });

    it('should validate input data types', async () => {
      const invalidSaleData = {
        clientId: 123, // Should be string
        items: 'invalid', // Should be array
        total: 'invalid' // Should be number
      };

      const result = await salesService.createSale(invalidSaleData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data types');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeSalesList = Array.from({ length: 1000 }, () => createMockSale());
      mockApiSuccess(largeSalesList);

      const start = performance.now();
      const result = await salesService.getSales({ limit: 1000 });
      const end = performance.now();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1000);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should implement caching for repeated requests', async () => {
      const mockSale = createMockSale();
      mockApiSuccess(mockSale);

      // First request
      await salesService.getSaleById('sale_123');
      
      // Second request should use cache
      const result = await salesService.getSaleById('sale_123');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1); // Only called once due to caching
    });
  });

  describe('Security Tests', () => {
    it('should sanitize input data', async () => {
      const maliciousData = {
        clientId: '<script>alert("xss")</script>',
        items: [
          { productId: '../../etc/passwd', quantity: 1, price: 10 }
        ]
      };

      const result = await salesService.createSale(maliciousData);

      // Should either sanitize or reject malicious input
      expect(result.success).toBe(false);
    });

    it('should handle authorization errors', async () => {
      mockApiError('Unauthorized', 401);

      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });
});
