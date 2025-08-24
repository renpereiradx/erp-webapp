/**
 * Sales Telemetry Service Tests
 * Wave 7: Observability & Monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import salesTelemetryService from '../../../src/services/salesTelemetryService';

// Mock telemetryService
vi.mock('@/services/telemetryService', () => ({
  default: {
    record: vi.fn(),
    startTimer: vi.fn(() => ({ name: 'test-timer', start: Date.now() })),
    endTimer: vi.fn(() => 100)
  }
}));

describe('SalesTelemetryService', () => {
  beforeEach(() => {
    salesTelemetryService.clearMetrics();
    vi.clearAllMocks();
  });

  describe('Sales Operations', () => {
    it('should record sales operations with enriched data', () => {
      const operationData = { saleId: 'SALE001', amount: 100 };
      
      salesTelemetryService.recordSalesOperation('create', operationData);
      
      const metrics = salesTelemetryService.getMetrics('sales.create');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        saleId: 'SALE001',
        amount: 100,
        sessionId: expect.any(String),
        timestamp: expect.any(Number)
      });
    });

    it('should record payment metrics', () => {
      const paymentData = { paymentId: 'PAY001', method: 'credit_card', amount: 150 };
      
      salesTelemetryService.recordPaymentMetrics('success', paymentData);
      
      const metrics = salesTelemetryService.getMetrics('sales.payment.success');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject(paymentData);
    });

    it('should record user interactions', () => {
      const interactionData = { element: 'payment-button', duration: 50 };
      
      salesTelemetryService.recordUserInteraction('click', interactionData);
      
      const metrics = salesTelemetryService.getMetrics('sales.interaction.click');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject(interactionData);
    });
  });

  describe('Error Tracking', () => {
    it('should record errors with categorization', () => {
      const error = new Error('Network timeout');
      error.code = 'NETWORK_ERROR';
      
      salesTelemetryService.recordError(error, { operation: 'payment' });
      
      const metrics = salesTelemetryService.getMetrics('sales.error');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        message: 'Network timeout',
        code: 'NETWORK_ERROR',
        severity: 'high',
        context: { operation: 'payment' }
      });
    });

    it('should categorize error severity correctly', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const typeError = new TypeError('Cannot read property');
      
      salesTelemetryService.recordError(networkError);
      salesTelemetryService.recordError(validationError);
      salesTelemetryService.recordError(typeError);
      
      const errorMetrics = salesTelemetryService.getMetrics('sales.error');
      expect(errorMetrics[0].severity).toBe('high'); // NetworkError
      expect(errorMetrics[1].severity).toBe('medium'); // ValidationError
      expect(errorMetrics[2].severity).toBe('high'); // TypeError
    });

    it('should update error rate metrics', () => {
      // Record multiple errors
      for (let i = 0; i < 5; i++) {
        salesTelemetryService.recordError(new Error(`Error ${i}`));
      }
      
      const rateMetrics = salesTelemetryService.getMetrics('sales.error.rate');
      expect(rateMetrics).toHaveLength(5); // One rate metric per error
      expect(rateMetrics[rateMetrics.length - 1].count).toBe(5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record API performance metrics', () => {
      salesTelemetryService.recordApiPerformance('/api/sales', 'POST', 150, 200, {
        requestSize: 1024
      });
      
      const metrics = salesTelemetryService.getMetrics('sales.api.post');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        endpoint: '/api/sales',
        method: 'POST',
        duration: 150,
        status: 200,
        rating: 'excellent',
        requestSize: 1024
      });
    });

    it('should rate API performance correctly', () => {
      salesTelemetryService.recordApiPerformance('/api/fast', 'GET', 100, 200);
      salesTelemetryService.recordApiPerformance('/api/slow', 'GET', 800, 200);
      salesTelemetryService.recordApiPerformance('/api/very-slow', 'GET', 1500, 200);
      
      const fastMetrics = salesTelemetryService.getMetrics('sales.api.get');
      expect(fastMetrics[0].rating).toBe('excellent'); // 100ms
      expect(fastMetrics[1].rating).toBe('fair'); // 800ms
      expect(fastMetrics[2].rating).toBe('poor'); // 1500ms
    });
  });

  describe('Business Metrics', () => {
    it('should record conversion funnel steps', () => {
      salesTelemetryService.recordConversionStep('view_product', { productId: 'PROD001' });
      salesTelemetryService.recordConversionStep('add_to_cart', { productId: 'PROD001' });
      salesTelemetryService.recordConversionStep('checkout', { cartTotal: 100 });
      
      const viewMetrics = salesTelemetryService.getMetrics('sales.conversion.view_product');
      const cartMetrics = salesTelemetryService.getMetrics('sales.conversion.add_to_cart');
      const checkoutMetrics = salesTelemetryService.getMetrics('sales.conversion.checkout');
      
      expect(viewMetrics).toHaveLength(1);
      expect(cartMetrics).toHaveLength(1);
      expect(checkoutMetrics).toHaveLength(1);
      expect(checkoutMetrics[0].cartTotal).toBe(100);
    });

    it('should record business metrics', () => {
      salesTelemetryService.recordBusinessMetrics('revenue', { 
        amount: 500, 
        currency: 'USD',
        source: 'online'
      });
      
      const metrics = salesTelemetryService.getMetrics('sales.business.revenue');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        amount: 500,
        currency: 'USD',
        source: 'online'
      });
    });
  });

  describe('Data Aggregation', () => {
    it('should calculate performance summary', () => {
      // Mock performance data
      salesTelemetryService.recordMetric('performance.lcp', { value: 2000 });
      salesTelemetryService.recordMetric('performance.lcp', { value: 2500 });
      salesTelemetryService.recordMetric('performance.fid', { value: 80 });
      salesTelemetryService.recordMetric('performance.fid', { value: 120 });
      
      const summary = salesTelemetryService.getPerformanceSummary();
      
      expect(summary.lcp).toMatchObject({
        count: 2,
        min: 2000,
        max: 2500,
        avg: 2250
      });
      expect(summary.fid).toMatchObject({
        count: 2,
        min: 80,
        max: 120,
        avg: 100
      });
    });

    it('should calculate error summary', () => {
      // Add errors to buffer
      const now = Date.now();
      salesTelemetryService.errorBuffer = [
        { severity: 'high', name: 'NetworkError', timestamp: now - 1000 },
        { severity: 'medium', name: 'ValidationError', timestamp: now - 2000 },
        { severity: 'high', name: 'NetworkError', timestamp: now - 3000 },
        { severity: 'low', name: 'Warning', timestamp: now - 4000 }
      ];
      
      const summary = salesTelemetryService.getErrorSummary('1h');
      
      expect(summary.total).toBe(4);
      expect(summary.bySeverity).toEqual({
        high: 2,
        medium: 1,
        low: 1
      });
      expect(summary.byType).toEqual({
        NetworkError: 2,
        ValidationError: 1,
        Warning: 1
      });
    });

    it('should calculate business metrics summary', () => {
      // Record business operations
      salesTelemetryService.recordMetric('sales.operation', { type: 'sale' });
      salesTelemetryService.recordMetric('sales.operation', { type: 'sale' });
      salesTelemetryService.recordMetric('sales.payment.success', { amount: 100 });
      salesTelemetryService.recordMetric('sales.conversion.complete', { revenue: 150 });
      
      const summary = salesTelemetryService.getBusinessMetricsSummary();
      
      expect(summary).toMatchObject({
        totalSales: 2,
        successfulPayments: 1,
        completedConversions: 1,
        conversionRate: 50 // 1 conversion out of 2 sales
      });
    });
  });

  describe('Timer Operations', () => {
    it('should start and end timers correctly', () => {
      const timer = salesTelemetryService.startTimer('test_operation');
      expect(timer).toHaveProperty('name');
      expect(timer.name).toContain('sales.test_operation');
      
      const duration = salesTelemetryService.endTimer(timer, { extra: 'data' });
      expect(typeof duration).toBe('number');
      
      const metrics = salesTelemetryService.getMetrics('sales.timer');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        operation: 'test_operation',
        duration: expect.any(Number),
        extra: 'data'
      });
    });
  });

  describe('Data Export', () => {
    it('should export data in JSON format', () => {
      salesTelemetryService.recordSalesOperation('test', { id: 1 });
      salesTelemetryService.recordError(new Error('Test error'));
      
      const exported = salesTelemetryService.exportData('json');
      const data = JSON.parse(exported);
      
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('business');
    });

    it('should export data in object format', () => {
      salesTelemetryService.recordSalesOperation('test', { id: 1 });
      
      const data = salesTelemetryService.exportData('object');
      
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('metrics');
    });
  });

  describe('Cleanup Operations', () => {
    it('should clear all metrics and reset session', () => {
      const originalSessionId = salesTelemetryService.sessionId;
      
      salesTelemetryService.recordSalesOperation('test', { id: 1 });
      salesTelemetryService.recordError(new Error('Test'));
      
      expect(salesTelemetryService.getMetrics()).not.toEqual({});
      expect(salesTelemetryService.errorBuffer).toHaveLength(1);
      
      salesTelemetryService.clearMetrics();
      
      expect(salesTelemetryService.getMetrics()).toEqual({});
      expect(salesTelemetryService.errorBuffer).toHaveLength(0);
      expect(salesTelemetryService.sessionId).not.toBe(originalSessionId);
    });
  });
});
