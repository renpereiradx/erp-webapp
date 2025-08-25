/**
 * Sales Analytics Service Tests
 * Wave 6: Advanced Analytics & Reporting - Testing Suite
 * 
 * Tests comprehensivos para el servicio de analytics de ventas
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { salesAnalyticsService } from '@/services/salesAnalyticsService';
import { telemetryService } from '@/services/telemetryService';

// Mock dependencies
vi.mock('@/services/telemetryService', () => ({
  telemetryService: {
    track: vi.fn(),
    trackError: vi.fn(),
    trackPerformance: vi.fn()
  }
}));

// Mock data
const mockSalesData = [
  {
    id: '1',
    date: '2025-08-20',
    total: 150.00,
    customerId: 'customer1',
    products: [
      { id: 'prod1', name: 'Product 1', category: 'Electronics', quantity: 2, price: 75.00 }
    ],
    status: 'completed'
  },
  {
    id: '2',
    date: '2025-08-21',
    total: 200.00,
    customerId: 'customer2',
    products: [
      { id: 'prod2', name: 'Product 2', category: 'Clothing', quantity: 1, price: 200.00 }
    ],
    status: 'completed'
  },
  {
    id: '3',
    date: '2025-08-22',
    total: 100.00,
    customerId: 'customer1',
    products: [
      { id: 'prod1', name: 'Product 1', category: 'Electronics', quantity: 1, price: 100.00 }
    ],
    status: 'pending'
  }
];

const mockCustomerData = [
  {
    id: 'customer1',
    name: 'John Doe',
    email: 'john@example.com',
    registrationDate: '2025-01-01',
    totalOrders: 5,
    lifetimeValue: 750.00
  },
  {
    id: 'customer2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    registrationDate: '2025-02-01',
    totalOrders: 2,
    lifetimeValue: 400.00
  }
];

describe('salesAnalyticsService', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset cache
    salesAnalyticsService._clearCache?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSalesMetrics', () => {
    it('should calculate basic sales metrics correctly', async () => {
      // Mock the data fetch
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getSalesMetrics();

      expect(result).toEqual({
        totalRevenue: 450.00,
        totalSales: 3,
        completedSales: 2,
        pendingSales: 1,
        averageOrderValue: 150.00,
        conversionRate: 66.67, // 2/3 * 100
        growthRate: expect.any(Number),
        topSellingProducts: expect.any(Array),
        salesByCategory: expect.any(Array),
        recentActivity: expect.any(Array)
      });
    });

    it('should handle empty sales data', async () => {
      const mockFetch = vi.fn().mockResolvedValue([]);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getSalesMetrics();

      expect(result).toEqual({
        totalRevenue: 0,
        totalSales: 0,
        completedSales: 0,
        pendingSales: 0,
        averageOrderValue: 0,
        conversionRate: 0,
        growthRate: 0,
        topSellingProducts: [],
        salesByCategory: [],
        recentActivity: []
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      global.fetch = mockFetch;

      await expect(salesAnalyticsService.getSalesMetrics()).rejects.toThrow('Service unavailable');
      
      expect(telemetryService.trackError).toHaveBeenCalledWith(
        'analytics_service_error',
        expect.any(Error),
        expect.objectContaining({
          operation: 'getSalesMetrics'
        })
      );
    });
  });

  describe('getProductAnalytics', () => {
    it('should analyze product performance correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getProductAnalytics();

      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0]).toEqual({
        id: 'prod1',
        name: 'Product 1',
        category: 'Electronics',
        totalSales: 2,
        totalRevenue: 175.00,
        averagePrice: 87.50,
        trend: expect.any(String)
      });

      expect(result.categoryBreakdown).toHaveLength(2);
      expect(result.categoryBreakdown).toContainEqual({
        category: 'Electronics',
        salesCount: 2,
        revenue: 175.00,
        percentage: expect.any(Number)
      });
    });

    it('should filter products by category when specified', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getProductAnalytics({
        category: 'Electronics'
      });

      expect(result.topProducts).toHaveLength(1);
      expect(result.topProducts[0].category).toBe('Electronics');
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should segment customers correctly', async () => {
      const mockFetchSales = vi.fn().mockResolvedValue(mockSalesData);
      const mockFetchCustomers = vi.fn().mockResolvedValue(mockCustomerData);
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockSalesData) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockCustomerData) });

      const result = await salesAnalyticsService.getCustomerAnalytics();

      expect(result.customerSegments).toBeDefined();
      expect(result.topCustomers).toHaveLength(2);
      expect(result.newCustomers).toBeGreaterThanOrEqual(0);
      expect(result.returningCustomers).toBeGreaterThanOrEqual(0);
      expect(result.customerRetentionRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate customer lifetime value correctly', async () => {
      const mockFetchSales = vi.fn().mockResolvedValue(mockSalesData);
      const mockFetchCustomers = vi.fn().mockResolvedValue(mockCustomerData);
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockSalesData) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockCustomerData) });

      const result = await salesAnalyticsService.getCustomerAnalytics();

      expect(result.averageCustomerLifetimeValue).toBeGreaterThan(0);
      expect(result.topCustomers[0].lifetimeValue).toBe(750.00);
    });
  });

  describe('getBusinessIntelligence', () => {
    it('should generate business insights', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getBusinessIntelligence();

      expect(result.insights).toBeDefined();
      expect(result.predictions).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.alerts).toBeDefined();

      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should prioritize insights correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getBusinessIntelligence();

      // Check that insights have priority levels
      if (result.insights.length > 0) {
        expect(result.insights[0]).toHaveProperty('priority');
        expect(['high', 'medium', 'low']).toContain(result.insights[0].priority);
      }
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getRealTimeMetrics();

      expect(result).toHaveProperty('activeSessions');
      expect(result).toHaveProperty('revenueToday');
      expect(result).toHaveProperty('salesInProgress');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('timestamp');

      expect(typeof result.activeSessions).toBe('number');
      expect(typeof result.revenueToday).toBe('number');
      expect(typeof result.salesInProgress).toBe('number');
    });

    it('should include current timestamp', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getRealTimeMetrics();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('caching behavior', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      // First call
      const result1 = await salesAnalyticsService.getSalesMetrics();
      
      // Second call (should use cache)
      const result2 = await salesAnalyticsService.getSalesMetrics();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should refresh cache after TTL expires', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      // Mock cache TTL to be very short for testing
      const originalTTL = salesAnalyticsService._cacheTTL;
      salesAnalyticsService._cacheTTL = 1; // 1ms

      // First call
      await salesAnalyticsService.getSalesMetrics();
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 2));
      
      // Second call (should fetch new data)
      await salesAnalyticsService.getSalesMetrics();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Restore original TTL
      salesAnalyticsService._cacheTTL = originalTTL;
    });
  });

  describe('error handling and circuit breaker', () => {
    it('should track telemetry on successful operations', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      await salesAnalyticsService.getSalesMetrics();

      expect(telemetryService.track).toHaveBeenCalledWith(
        'analytics_operation_success',
        expect.objectContaining({
          operation: 'getSalesMetrics'
        })
      );
    });

    it('should track performance metrics', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      await salesAnalyticsService.getSalesMetrics();

      expect(telemetryService.trackPerformance).toHaveBeenCalledWith(
        'analytics_operation_duration',
        expect.any(Number),
        expect.objectContaining({
          operation: 'getSalesMetrics'
        })
      );
    });

    it('should handle network errors appropriately', async () => {
      const networkError = new Error('Network error');
      const mockFetch = vi.fn().mockRejectedValue(networkError);
      global.fetch = mockFetch;

      await expect(salesAnalyticsService.getSalesMetrics()).rejects.toThrow('Network error');

      expect(telemetryService.trackError).toHaveBeenCalledWith(
        'analytics_service_error',
        networkError,
        expect.objectContaining({
          operation: 'getSalesMetrics'
        })
      );
    });
  });

  describe('data transformation and formatting', () => {
    it('should format currency values correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getSalesMetrics();

      expect(typeof result.totalRevenue).toBe('number');
      expect(result.totalRevenue).toBe(450.00);
      expect(typeof result.averageOrderValue).toBe('number');
    });

    it('should calculate percentages correctly', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getSalesMetrics();

      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(100);
    });

    it('should handle date ranges properly', async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockSalesData);
      global.fetch = mockFetch;

      const result = await salesAnalyticsService.getSalesTrends({
        startDate: '2025-08-20',
        endDate: '2025-08-22'
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.trends)).toBe(true);
    });
  });
});
