import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock más completo de telemetry
vi.mock('../../utils/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    error: vi.fn(),
    performance: vi.fn(),
    record: vi.fn(), // Añadir el método record que falta
    startTimer: vi.fn(() => ({ stop: vi.fn() })),
    metric: vi.fn()
  }
}));

// Mock de dependencias
vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
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

import { salesService } from '../../services/salesService.js';
import { apiClient } from '../../services/api';
import { telemetry } from '../../utils/telemetry';

describe('Wave 8 - Sales Service Core Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Process Sale', () => {
    it('should process sale successfully', async () => {
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

      expect(apiClient.post).toHaveBeenCalledWith('/sale/', mockSaleData);
      expect(result).toEqual(mockResponse);
      expect(telemetry.record).toHaveBeenCalledWith('sales.process.start', expect.any(Object));
    });

    it('should process sale with reservation', async () => {
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
      expect(telemetry.record).toHaveBeenCalledWith('sales.process.start', expect.objectContaining({
        hasReservation: true
      }));
    });

    it('should handle API errors gracefully', async () => {
      const mockSaleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      const mockError = new Error('API Error');
      mockError.status = 400;
      mockError.error_code = 'INVALID_PRODUCT_ID';

      apiClient.post.mockRejectedValue(mockError);

      await expect(salesService.processSale(mockSaleData)).rejects.toThrow('API Error');
    });
  });

  describe('Process Sale With Units', () => {
    it('should process sale with units successfully', async () => {
      const mockSaleData = {
        client_id: 'client_123',
        product_details: [
          {
            product_id: 'prod_456',
            quantity: 2.5, // Decimal quantity
            unit_type: 'kg'
          }
        ]
      };

      const mockResponse = {
        success: true,
        sale_id: 'sale_units_123',
        total_amount: 125.00,
        items_processed: 1
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.processSaleWithUnits(mockSaleData);

      expect(apiClient.post).toHaveBeenCalledWith('/sale/with-units', mockSaleData);
      expect(result.success).toBe(true);
      expect(telemetry.record).toHaveBeenCalledWith('sales.process_with_units.start', expect.any(Object));
    });
  });

  describe('Get Sale Details', () => {
    it('should get sale details successfully', async () => {
      const saleId = 'sale_123';
      const mockSaleDetails = {
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
          ]
        }
      };

      apiClient.get.mockResolvedValue(mockSaleDetails);

      const result = await salesService.getSaleDetails(saleId);

      expect(apiClient.get).toHaveBeenCalledWith(`/sale/${saleId}`);
      expect(result.sale.sale_id).toBe(saleId);
      expect(telemetry.record).toHaveBeenCalledWith('sales.get_details.start', { saleId });
    });

    it('should validate sale ID parameter', async () => {
      await expect(salesService.getSaleDetails('')).rejects.toThrow();
      await expect(salesService.getSaleDetails(null)).rejects.toThrow();
      await expect(salesService.getSaleDetails(123)).rejects.toThrow();
    });
  });

  describe('Get Sales By Date Range', () => {
    it('should get sales by date range successfully', async () => {
      const params = {
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        page: 1,
        pageSize: 20
      };

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
          items_per_page: 20
        }
      };

      apiClient.get.mockResolvedValue(mockSalesResponse);

      const result = await salesService.getSalesByDateRange(params);

      expect(apiClient.get).toHaveBeenCalled();
      expect(result.sales).toHaveLength(2);
      expect(result.pagination.total_items).toBe(100);
      expect(telemetry.record).toHaveBeenCalledWith('sales.get_by_date_range.start', expect.objectContaining({
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      }));
    });

    it('should validate date range parameters', async () => {
      // Missing dates
      await expect(salesService.getSalesByDateRange({})).rejects.toThrow();
      await expect(salesService.getSalesByDateRange({ startDate: '2025-08-01' })).rejects.toThrow();
      await expect(salesService.getSalesByDateRange({ endDate: '2025-08-31' })).rejects.toThrow();

      // Invalid date range (start > end)
      await expect(salesService.getSalesByDateRange({
        startDate: '2025-08-31',
        endDate: '2025-08-01'
      })).rejects.toThrow();
    });

    it('should use default pagination values', async () => {
      const params = {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      };

      const mockResponse = { success: true, sales: [], pagination: {} };
      apiClient.get.mockResolvedValue(mockResponse);

      await salesService.getSalesByDateRange(params);

      expect(telemetry.record).toHaveBeenCalledWith('sales.get_by_date_range.start', expect.objectContaining({
        page: 1,
        pageSize: 20
      }));
    });
  });

  describe('Telemetry Integration', () => {
    it('should track telemetry for all operations', async () => {
      const saleData = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      apiClient.post.mockResolvedValue({ success: true, sale_id: 'sale_123' });

      await salesService.processSale(saleData);

      expect(telemetry.record).toHaveBeenCalledWith('sales.process.start', expect.objectContaining({
        hasReservation: false,
        productCount: 1,
        allowPriceModifications: undefined
      }));
    });

    it('should track reservation flag correctly', async () => {
      const saleDataWithReservation = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }],
        reserve_id: 'reserve_123'
      };

      const saleDataWithoutReservation = {
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      };

      apiClient.post.mockResolvedValue({ success: true, sale_id: 'sale_123' });

      // With reservation
      await salesService.processSale(saleDataWithReservation);
      expect(telemetry.record).toHaveBeenLastCalledWith('sales.process.start', expect.objectContaining({
        hasReservation: true
      }));

      // Without reservation
      await salesService.processSale(saleDataWithoutReservation);
      expect(telemetry.record).toHaveBeenLastCalledWith('sales.process.start', expect.objectContaining({
        hasReservation: false
      }));
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      mockError.code = 'NETWORK_ERROR';
      
      apiClient.post.mockRejectedValue(mockError);

      await expect(salesService.processSale({
        client_id: 'client_123',
        product_details: [{ product_id: 'prod_456', quantity: 1 }]
      })).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      
      apiClient.get.mockRejectedValue(timeoutError);

      await expect(salesService.getSaleDetails('sale_123')).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockResponse = { success: true, sale_id: 'sale_123', total_amount: 100 };
      apiClient.post.mockResolvedValue(mockResponse);

      const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
        salesService.processSale({
          client_id: `client_${i}`,
          product_details: [{ product_id: 'prod_456', quantity: 1 }]
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(concurrentRequests);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      expect(results.every(result => result.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
      expect(apiClient.post).toHaveBeenCalledTimes(5);
    });

    it('should handle large product lists', async () => {
      const largeSaleData = {
        client_id: 'client_123',
        product_details: Array.from({ length: 50 }, (_, i) => ({
          product_id: `prod_${i}`,
          quantity: 1,
          sale_price: 10.00
        }))
      };

      const mockResponse = {
        success: true,
        sale_id: 'sale_large',
        total_amount: 500.00,
        items_processed: 50
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await salesService.processSale(largeSaleData);

      expect(result.items_processed).toBe(50);
      expect(telemetry.record).toHaveBeenCalledWith('sales.process.start', expect.objectContaining({
        productCount: 50
      }));
    });
  });
});
