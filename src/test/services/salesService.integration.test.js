import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { salesService } from '../../services/salesService.js';

// Mock de dependencias
vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../utils/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    error: vi.fn(),
    performance: vi.fn()
  }
}));

vi.mock('../../utils/circuitBreaker', () => ({
  circuitBreaker: {
    execute: vi.fn((fn) => fn())
  }
}));

vi.mock('../../utils/retry', () => ({
  retryWithBackoff: vi.fn((fn) => fn())
}));

import { apiClient } from '../../services/api';
import { telemetry } from '../../utils/telemetry';

describe('Wave 8 - Sales Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Process Sale - Core Functionality', () => {
    it('should process sale successfully with complete data', async () => {
      const mockSaleData = {
        client_id: 'client_123',
        product_details: [
          {
            product_id: 'prod_456',
            quantity: 2,
            tax_rate_id: 1,
            sale_price: 100.00
          }
        ],
        payment_method_id: 1,
        currency_id: 1,
        allow_price_modifications: true
      };

      const mockResponse = {
        success: true,
        sale_id: 'sale_789',
        total_amount: 200.00,
        items_processed: 1,
        price_modifications_enabled: true,
        has_price_changes: false,
        message: 'Sale processed successfully'
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.processSale(mockSaleData);

      expect(apiClient.post).toHaveBeenCalledWith('/sales/process', mockSaleData);
      expect(result).toEqual(mockResponse);
      expect(telemetry.track).toHaveBeenCalledWith('sale_processing_attempted', expect.any(Object));
    });

    it('should process sale with reservation successfully', async () => {
      const mockSaleData = {
        client_id: 'client_123',
        product_details: [
          {
            product_id: 'prod_456',
            quantity: 1
          }
        ],
        reserve_id: 'reserve_999',
        allow_price_modifications: false
      };

      const mockResponse = {
        success: true,
        sale_id: 'sale_789',
        total_amount: 100.00,
        items_processed: 1,
        price_modifications_enabled: false,
        has_price_changes: false,
        message: 'Sale from reservation processed successfully'
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.processSale(mockSaleData);

      expect(result.success).toBe(true);
      expect(result.sale_id).toBe('sale_789');
      expect(telemetry.track).toHaveBeenCalledWith('sale_processing_attempted', expect.objectContaining({
        has_reservation: true
      }));
    });

    it('should handle validation errors appropriately', async () => {
      const invalidSaleData = {
        client_id: '',
        product_details: []
      };

      const mockError = {
        error_code: 'INVALID_CLIENT_ID',
        message: 'Client ID is required',
        status: 400
      };

      apiClient.post.mockRejectedValue(mockError);

      await expect(salesService.processSale(invalidSaleData)).rejects.toThrow();
      expect(telemetry.error).toHaveBeenCalled();
    });

    it('should handle insufficient stock errors', async () => {
      const mockSaleData = {
        client_id: 'client_123',
        product_details: [
          {
            product_id: 'prod_456',
            quantity: 1000 // Cantidad excesiva
          }
        ]
      };

      const mockError = {
        error_code: 'INSUFFICIENT_STOCK',
        message: 'Not enough stock available',
        status: 400,
        details: {
          product_id: 'prod_456',
          requested: 1000,
          available: 50
        }
      };

      apiClient.post.mockRejectedValue(mockError);

      await expect(salesService.processSale(mockSaleData)).rejects.toMatchObject({
        error_code: 'INSUFFICIENT_STOCK'
      });
    });
  });

  describe('Sales Retrieval', () => {
    it('should get sales with pagination successfully', async () => {
      const mockSalesResponse = {
        success: true,
        sales: [
          {
            sale_id: 'sale_1',
            client_id: 'client_123',
            total_amount: 100.00,
            status: 'completed',
            created_at: '2025-08-24T10:00:00Z'
          },
          {
            sale_id: 'sale_2',
            client_id: 'client_456',
            total_amount: 200.00,
            status: 'pending',
            created_at: '2025-08-24T11:00:00Z'
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 10,
          total_items: 100,
          items_per_page: 10
        }
      };

      apiClient.get.mockResolvedValue(mockSalesResponse);

      const filters = {
        page: 1,
        limit: 10,
        status: 'all',
        date_from: '2025-08-24',
        date_to: '2025-08-24'
      };

      const result = await salesService.getSales(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/sales', { params: filters });
      expect(result.sales).toHaveLength(2);
      expect(result.pagination.total_items).toBe(100);
    });

    it('should get single sale by ID', async () => {
      const saleId = 'sale_123';
      const mockSale = {
        success: true,
        sale: {
          sale_id: saleId,
          client_id: 'client_456',
          total_amount: 150.00,
          status: 'completed',
          product_details: [
            {
              product_id: 'prod_789',
              quantity: 3,
              unit_price: 50.00,
              total_price: 150.00
            }
          ],
          payments: [
            {
              payment_id: 'pay_111',
              amount: 150.00,
              method: 'cash',
              status: 'completed'
            }
          ]
        }
      };

      apiClient.get.mockResolvedValue(mockSale);

      const result = await salesService.getSaleById(saleId);

      expect(apiClient.get).toHaveBeenCalledWith(`/sales/${saleId}`);
      expect(result.sale.sale_id).toBe(saleId);
      expect(result.sale.product_details).toHaveLength(1);
    });

    it('should handle sale not found error', async () => {
      const saleId = 'nonexistent_sale';
      const mockError = {
        error_code: 'SALE_NOT_FOUND',
        message: 'Sale not found',
        status: 404
      };

      apiClient.get.mockRejectedValue(mockError);

      await expect(salesService.getSaleById(saleId)).rejects.toMatchObject({
        error_code: 'SALE_NOT_FOUND'
      });
    });
  });

  describe('Sale Cancellation', () => {
    it('should cancel sale successfully', async () => {
      const saleId = 'sale_123';
      const cancellationReason = 'Customer request';
      
      const mockResponse = {
        success: true,
        sale_id: saleId,
        status: 'cancelled',
        cancellation_reason: cancellationReason,
        refund_amount: 150.00,
        message: 'Sale cancelled successfully'
      };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await salesService.cancelSale(saleId, cancellationReason);

      expect(apiClient.put).toHaveBeenCalledWith(`/sales/${saleId}/cancel`, {
        cancellation_reason: cancellationReason
      });
      expect(result.status).toBe('cancelled');
      expect(result.refund_amount).toBe(150.00);
    });

    it('should handle already cancelled sale', async () => {
      const saleId = 'sale_123';
      const mockError = {
        error_code: 'ALREADY_CANCELLED',
        message: 'Sale is already cancelled',
        status: 400
      };

      apiClient.put.mockRejectedValue(mockError);

      await expect(salesService.cancelSale(saleId, 'reason')).rejects.toMatchObject({
        error_code: 'ALREADY_CANCELLED'
      });
    });
  });

  describe('Price Modifications', () => {
    it('should apply price modification successfully', async () => {
      const modificationData = {
        sale_id: 'sale_123',
        product_id: 'prod_456',
        new_price: 80.00,
        reason: 'Customer discount',
        user_id: 'user_789'
      };

      const mockResponse = {
        success: true,
        modification_applied: true,
        original_price: 100.00,
        new_price: 80.00,
        price_difference: -20.00,
        percentage_change: -20.0,
        change_id: 'change_111'
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.applyPriceModification(modificationData);

      expect(apiClient.post).toHaveBeenCalledWith('/sales/price-modification', modificationData);
      expect(result.modification_applied).toBe(true);
      expect(result.price_difference).toBe(-20.00);
    });

    it('should reject unauthorized price modification', async () => {
      const modificationData = {
        sale_id: 'sale_123',
        product_id: 'prod_456',
        new_price: 50.00,
        reason: 'Too low price',
        user_id: 'unauthorized_user'
      };

      const mockError = {
        error_code: 'PRICE_MODIFICATION_NOT_ALLOWED',
        message: 'User not authorized for price modifications',
        status: 403
      };

      apiClient.post.mockRejectedValue(mockError);

      await expect(salesService.applyPriceModification(modificationData)).rejects.toMatchObject({
        error_code: 'PRICE_MODIFICATION_NOT_ALLOWED'
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle network timeout gracefully', async () => {
      const mockError = {
        error_code: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        status: 408
      };

      apiClient.post.mockRejectedValue(mockError);

      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      await expect(salesService.processSale(saleData)).rejects.toMatchObject({
        error_code: 'TIMEOUT_ERROR'
      });

      expect(telemetry.error).toHaveBeenCalledWith('sale_processing_failed', expect.objectContaining({
        error_category: expect.any(String),
        error_code: 'TIMEOUT_ERROR'
      }));
    });

    it('should handle rate limiting appropriately', async () => {
      const mockError = {
        error_code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        status: 429,
        retry_after: 60
      };

      apiClient.post.mockRejectedValue(mockError);

      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      await expect(salesService.processSale(saleData)).rejects.toMatchObject({
        error_code: 'RATE_LIMIT_EXCEEDED'
      });
    });

    it('should track performance metrics', async () => {
      const mockResponse = {
        success: true,
        sale_id: 'sale_789',
        total_amount: 100.00
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      await salesService.processSale(saleData);

      expect(telemetry.performance).toHaveBeenCalled();
      expect(telemetry.track).toHaveBeenCalledWith('sale_processing_completed', expect.objectContaining({
        success: true,
        processing_time: expect.any(Number)
      }));
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle large product lists efficiently', async () => {
      const largeSaleData = {
        client_id: 'client_123',
        product_details: Array.from({ length: 100 }, (_, i) => ({
          product_id: `prod_${i}`,
          quantity: 1,
          sale_price: 10.00
        })),
        allow_price_modifications: true
      };

      const mockResponse = {
        success: true,
        sale_id: 'sale_large',
        total_amount: 1000.00,
        items_processed: 100
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await salesService.processSale(largeSaleData);
      const endTime = performance.now();

      expect(result.items_processed).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent sale processing', async () => {
      const mockResponse = {
        success: true,
        sale_id: 'sale_concurrent',
        total_amount: 100.00
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      // Simular múltiples ventas concurrentes
      const concurrentSales = Array.from({ length: 10 }, () => 
        salesService.processSale({ ...saleData, client_id: `client_${Math.random()}` })
      );

      const results = await Promise.all(concurrentSales);

      expect(results).toHaveLength(10);
      expect(results.every(result => result.success)).toBe(true);
      expect(apiClient.post).toHaveBeenCalledTimes(10);
    });

    it('should handle malformed response data', async () => {
      const invalidResponse = {
        // Respuesta mal formada sin campos requeridos
        message: 'Sale processed'
        // Falta success, sale_id, etc.
      };

      apiClient.post.mockResolvedValue(invalidResponse);

      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      await expect(salesService.processSale(saleData)).rejects.toThrow();
    });
  });
});
