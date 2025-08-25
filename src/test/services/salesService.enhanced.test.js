/**
 * Enhanced Sales Service Tests - Wave 8 Extension
 * Comprehensive test suite for extended sales service functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import salesService from '../../services/salesService';

// Mock all dependencies
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: {
    record: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/utils/circuitBreaker', () => ({
  circuitBreaker: {
    execute: vi.fn((fn) => fn())
  }
}));

vi.mock('@/utils/retry', () => ({
  retryWithBackoff: vi.fn((fn) => fn())
}));

describe('Enhanced SalesService - Wave 8 Extensions', () => {
  let apiClient;
  let telemetry;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import mocks after clearing
    const apiModule = await import('../../services/api');
    const telemetryModule = await import('@/utils/telemetry');
    
    apiClient = apiModule.apiClient;
    telemetry = telemetryModule.telemetry;

    // Set up default successful responses
    apiClient.get.mockResolvedValue({ data: [] });
    apiClient.post.mockResolvedValue({ success: true });
    apiClient.put.mockResolvedValue({ success: true });
    apiClient.delete.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSale', () => {
    it('should create a sale successfully', async () => {
      const saleData = {
        client_id: 'client_123',
        product_details: [
          { product_id: 'product_1', quantity: 2 }
        ]
      };

      const mockResponse = {
        sale_id: 'sale_123',
        total_amount: 100.00,
        items_processed: 1
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(true);
      expect(result.sale_id).toBe('sale_123');
      expect(telemetry.record).toHaveBeenCalledWith('sales.create.start', {
        hasReservation: false,
        productCount: 1
      });
    });

    it('should handle validation errors', async () => {
      const invalidSaleData = {
        // Missing required fields
      };

      const result = await salesService.createSale(invalidSaleData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('client_id');
    });

    it('should handle API errors gracefully', async () => {
      const saleData = {
        client_id: 'client_123',
        product_details: [
          { product_id: 'product_1', quantity: 2 }
        ]
      };

      const mockError = new Error('API Error');
      mockError.status = 400;
      apiClient.post.mockRejectedValue(mockError);

      const result = await salesService.createSale(saleData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(telemetry.error).toHaveBeenCalled();
    });
  });

  describe('getSales', () => {
    it('should fetch sales with default parameters', async () => {
      const mockSales = [
        { id: 'sale_1', total: 100 },
        { id: 'sale_2', total: 200 }
      ];

      apiClient.get.mockResolvedValue({
        data: mockSales,
        total: 2
      });

      const result = await salesService.getSales();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSales);
      expect(result.pagination.total).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith('/sales', {
        params: {
          page: 1,
          limit: 20
        }
      });
    });

    it('should handle custom filters', async () => {
      const filters = {
        status: 'completed',
        client_id: 'client_123',
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      };

      const mockSales = [];
      apiClient.get.mockResolvedValue({ data: mockSales, total: 0 });

      const result = await salesService.getSales(filters);

      expect(result.success).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/sales', {
        params: {
          page: 1,
          limit: 20,
          status: 'completed',
          client_id: 'client_123',
          start_date: '2025-01-01',
          end_date: '2025-01-31'
        }
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Server Error');
      mockError.status = 500;
      apiClient.get.mockRejectedValue(mockError);

      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSaleById', () => {
    it('should fetch a sale by ID successfully', async () => {
      const saleId = 'sale_123';
      const mockSale = {
        id: saleId,
        total: 100,
        status: 'completed'
      };

      apiClient.get.mockResolvedValue(mockSale);

      const result = await salesService.getSaleById(saleId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSale);
      expect(apiClient.get).toHaveBeenCalledWith(`/sales/${saleId}`);
      expect(telemetry.record).toHaveBeenCalledWith('sales.get_by_id.start', { sale_id: saleId });
    });

    it('should validate sale ID parameter', async () => {
      const result = await salesService.getSaleById('');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SALE_ID');
    });

    it('should handle sale not found', async () => {
      const mockError = new Error('Not Found');
      mockError.status = 404;
      apiClient.get.mockRejectedValue(mockError);

      const result = await salesService.getSaleById('sale_123');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('SALE_NOT_FOUND');
    });
  });

  describe('updateSale', () => {
    it('should update a sale successfully', async () => {
      const saleId = 'sale_123';
      const updateData = { status: 'completed' };
      const mockResponse = { success: true, updated: true };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await salesService.updateSale(saleId, updateData);

      expect(result.success).toBe(true);
      expect(apiClient.put).toHaveBeenCalledWith(`/sales/${saleId}`, updateData);
      expect(telemetry.record).toHaveBeenCalledWith('sales.update.start', {
        sale_id: saleId,
        fields: ['status']
      });
    });

    it('should validate parameters', async () => {
      const result = await salesService.updateSale('', {});

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SALE_ID');
    });
  });

  describe('deleteSale', () => {
    it('should delete a sale successfully', async () => {
      const saleId = 'sale_123';
      const mockResponse = { deleted: true };

      apiClient.delete.mockResolvedValue(mockResponse);

      const result = await salesService.deleteSale(saleId);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(`/sales/${saleId}`);
    });

    it('should validate sale ID', async () => {
      const result = await salesService.deleteSale('');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SALE_ID');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        sale_id: 'sale_123',
        amount: 100.00,
        payment_method_id: 1,
        received_amount: 150.00
      };

      const mockResponse = {
        payment_id: 'payment_123',
        receipt_data: {}
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.payment_id).toBe('payment_123');
      expect(result.change_amount).toBe(50.00);
      expect(apiClient.post).toHaveBeenCalledWith('/sales/payments', {
        ...paymentData,
        change_amount: 50.00
      });
    });

    it('should validate payment data', async () => {
      const result = await salesService.processPayment({});

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SALE_ID');
    });

    it('should handle payment errors', async () => {
      const paymentData = {
        sale_id: 'sale_123',
        amount: 100.00,
        payment_method_id: 1
      };

      const mockError = new Error('Payment Declined');
      mockError.status = 402;
      apiClient.post.mockRejectedValue(mockError);

      const result = await salesService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('cancelSale', () => {
    it('should cancel a sale successfully', async () => {
      const saleId = 'sale_123';
      const cancellationData = { reason: 'Customer request' };
      const mockResponse = {
        cancellation_id: 'cancel_123',
        refund_amount: 100.00
      };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await salesService.cancelSale(saleId, cancellationData);

      expect(result.success).toBe(true);
      expect(result.cancellation_id).toBe('cancel_123');
      expect(result.refund_amount).toBe(100.00);
      expect(apiClient.put).toHaveBeenCalledWith(`/sales/${saleId}/cancel`, cancellationData);
    });

    it('should validate cancellation data', async () => {
      const result = await salesService.cancelSale('sale_123', {});

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('CANCELLATION_REASON_REQUIRED');
    });

    it('should handle already cancelled sales', async () => {
      const mockError = new Error('Already Cancelled');
      mockError.status = 409;
      apiClient.put.mockRejectedValue(mockError);

      const result = await salesService.cancelSale('sale_123', { reason: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('applyPriceModification', () => {
    it('should apply price modification successfully', async () => {
      const modificationData = {
        sale_id: 'sale_123',
        product_id: 'product_1',
        new_price: 25.00,
        reason: 'Discount applied'
      };

      const mockResponse = {
        modification_id: 'mod_123',
        applied: true
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.applyPriceModification(modificationData);

      expect(result.success).toBe(true);
      expect(result.modification_id).toBe('mod_123');
      expect(apiClient.post).toHaveBeenCalledWith('/sales/price-modification', modificationData);
    });

    it('should validate modification data', async () => {
      const result = await salesService.applyPriceModification({});

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_MODIFICATION_DATA');
    });

    it('should handle unauthorized modifications', async () => {
      const modificationData = {
        sale_id: 'sale_123',
        product_id: 'product_1',
        new_price: 25.00,
        reason: 'Discount applied'
      };

      const mockError = new Error('Not Authorized');
      mockError.status = 403;
      apiClient.post.mockRejectedValue(mockError);

      const result = await salesService.applyPriceModification(modificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should handle network timeouts', async () => {
      const mockError = new Error('Network Timeout');
      mockError.code = 'TIMEOUT_ERROR';
      apiClient.get.mockRejectedValue(mockError);

      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(telemetry.error).toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
      const mockError = new Error('Rate Limited');
      mockError.status = 429;
      apiClient.get.mockRejectedValue(mockError);

      const result = await salesService.getSales();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should categorize errors correctly', async () => {
      const mockError = new Error('Validation Error');
      mockError.status = 400;
      mockError.error_code = 'INVALID_PRODUCT_ID';
      apiClient.post.mockRejectedValue(mockError);

      const result = await salesService.createSale({
        client_id: 'client_123',
        product_details: [{ product_id: 'invalid', quantity: 1 }]
      });

      expect(result.success).toBe(false);
      expect(result.category).toBeDefined();
      expect(telemetry.error).toHaveBeenCalled();
    });
  });

  describe('Performance & Optimization', () => {
    it('should handle large result sets efficiently', async () => {
      const largeMockResponse = {
        data: new Array(1000).fill(null).map((_, i) => ({ id: `sale_${i}` })),
        total: 1000
      };

      apiClient.get.mockResolvedValue(largeMockResponse);

      const start = performance.now();
      const result = await salesService.getSales({ limit: 1000 });
      const end = performance.now();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1000);
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    it('should track performance metrics', async () => {
      const mockSale = { id: 'sale_123' };
      apiClient.get.mockResolvedValue(mockSale);

      await salesService.getSaleById('sale_123');

      expect(telemetry.record).toHaveBeenCalledWith('sales.get_by_id.start', { sale_id: 'sale_123' });
      expect(telemetry.record).toHaveBeenCalledWith('sales.get_by_id.success', { sale_id: 'sale_123' });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete sale workflow', async () => {
      // Create sale
      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'product_1', quantity: 2 }]
      };

      apiClient.post.mockResolvedValue({ sale_id: 'sale_123', total_amount: 100 });
      const createResult = await salesService.createSale(saleData);
      expect(createResult.success).toBe(true);

      // Process payment
      const paymentData = {
        sale_id: 'sale_123',
        amount: 100,
        payment_method_id: 1
      };

      apiClient.post.mockResolvedValue({ payment_id: 'payment_123' });
      const paymentResult = await salesService.processPayment(paymentData);
      expect(paymentResult.success).toBe(true);

      // Get sale details
      apiClient.get.mockResolvedValue({ id: 'sale_123', status: 'completed' });
      const saleDetails = await salesService.getSaleById('sale_123');
      expect(saleDetails.success).toBe(true);

      // Verify all operations were tracked
      expect(telemetry.record).toHaveBeenCalled(); // At least some telemetry was recorded
    });

    it('should handle sale cancellation workflow', async () => {
      const saleId = 'sale_123';
      
      // Get sale first
      apiClient.get.mockResolvedValue({ id: saleId, status: 'pending' });
      await salesService.getSaleById(saleId);

      // Cancel sale
      const cancellationData = { reason: 'Customer request', restock: true };
      apiClient.put.mockResolvedValue({ 
        cancellation_id: 'cancel_123',
        refund_amount: 100.00 
      });

      const result = await salesService.cancelSale(saleId, cancellationData);
      
      expect(result.success).toBe(true);
      expect(result.refund_amount).toBe(100.00);
    });
  });
});
