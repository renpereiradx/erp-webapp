/**
 * Tests MVP para Price Adjustment Store
 * Siguiendo patrón de testing simple y efectivo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import usePriceAdjustmentStore from '../store/usePriceAdjustmentStore';
import { priceAdjustmentService } from '../services/priceAdjustmentService';

vi.mock('../services/priceAdjustmentService');

describe('PriceAdjustment Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    usePriceAdjustmentStore.getState().clearAdjustments();
    usePriceAdjustmentStore.getState().clearError();
  });

  describe('createPriceAdjustment', () => {
    it('should create price adjustment successfully', async () => {
      const mockAdjustment = {
        id: 1,
        product_id: 'PROD_TEST_001',
        old_price: 15.00,
        new_price: 16.50,
        price_change: 1.50,
        price_change_percent: 10.00,
        unit: 'UNIT',
        reason: 'Test adjustment',
        created_at: new Date().toISOString()
      };

      priceAdjustmentService.createPriceAdjustment.mockResolvedValue(mockAdjustment);

      const adjustmentData = {
        product_id: 'PROD_TEST_001',
        new_price: 16.50,
        unit: 'UNIT',
        reason: 'Test adjustment'
      };

      const result = await usePriceAdjustmentStore.getState().createPriceAdjustment(adjustmentData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAdjustment);
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.adjustments).toHaveLength(1);
      expect(state.adjustments[0]).toEqual(mockAdjustment);
      expect(state.creating).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle create error', async () => {
      const errorMessage = 'Product not found';
      priceAdjustmentService.createPriceAdjustment.mockRejectedValue(new Error(errorMessage));

      const adjustmentData = {
        product_id: 'INVALID_ID',
        new_price: 16.50,
        unit: 'UNIT',
        reason: 'Test adjustment'
      };

      const result = await usePriceAdjustmentStore.getState().createPriceAdjustment(adjustmentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.adjustments).toHaveLength(0);
      expect(state.creating).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchProductHistory', () => {
    it('should fetch product history successfully', async () => {
      const mockHistory = {
        product_id: 'PROD_TEST_001',
        history: [
          {
            adjustment_id: 1,
            adjustment_type: 'price',
            old_value: 15.00,
            new_value: 16.50,
            value_change: 1.50,
            reason: 'Test adjustment',
            adjustment_date: new Date().toISOString()
          }
        ],
        limit: 10,
        offset: 0,
        count: 1
      };

      priceAdjustmentService.getProductHistory.mockResolvedValue(mockHistory);

      const result = await usePriceAdjustmentStore.getState().fetchProductHistory('PROD_TEST_001');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory.history);
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.productHistory['PROD_TEST_001']).toBeDefined();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle fetch history error', async () => {
      const errorMessage = 'Network error';
      priceAdjustmentService.getProductHistory.mockRejectedValue(new Error(errorMessage));

      const result = await usePriceAdjustmentStore.getState().fetchProductHistory('PROD_TEST_001');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('fetchRecentAdjustments', () => {
    it('should fetch recent adjustments successfully', async () => {
      const mockAdjustments = [
        {
          id: 1,
          product_id: 'PROD_TEST_001',
          new_price: 16.50,
          reason: 'Test adjustment 1',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          product_id: 'PROD_TEST_002',
          new_price: 12.00,
          reason: 'Test adjustment 2',
          created_at: new Date().toISOString()
        }
      ];

      priceAdjustmentService.getRecentAdjustments.mockResolvedValue({ data: mockAdjustments });

      const result = await usePriceAdjustmentStore.getState().fetchRecentAdjustments();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAdjustments);
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.adjustments).toEqual(mockAdjustments);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      // Setup test data
      const testAdjustments = [
        {
          id: 1,
          product_id: 'PROD_A',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 2,
          product_id: 'PROD_B',
          created_at: '2023-01-02T00:00:00Z'
        },
        {
          id: 3,
          product_id: 'PROD_A',
          created_at: '2023-01-03T00:00:00Z'
        }
      ];
      
      usePriceAdjustmentStore.setState({ adjustments: testAdjustments });
    });

    it('should filter adjustments by product', () => {
      const state = usePriceAdjustmentStore.getState();
      const productAdjustments = state.getAdjustmentsByProduct('PROD_A');
      
      expect(productAdjustments).toHaveLength(2);
      expect(productAdjustments.every(adj => adj.product_id === 'PROD_A')).toBe(true);
    });

    it('should get recent adjustments sorted by date', () => {
      const state = usePriceAdjustmentStore.getState();
      const recentAdjustments = state.getRecentAdjustments(2);
      
      expect(recentAdjustments).toHaveLength(2);
      // Should be sorted by date descending (most recent first)
      expect(recentAdjustments[0].id).toBe(3);
      expect(recentAdjustments[1].id).toBe(2);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      usePriceAdjustmentStore.setState({ error: 'Test error' });
      
      usePriceAdjustmentStore.getState().clearError();
      
      expect(usePriceAdjustmentStore.getState().error).toBe(null);
    });

    it('should clear adjustments', () => {
      usePriceAdjustmentStore.setState({ 
        adjustments: [{ id: 1 }],
        error: 'Test error'
      });
      
      usePriceAdjustmentStore.getState().clearAdjustments();
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.adjustments).toEqual([]);
      expect(state.error).toBe(null);
    });

    it('should clear product history', () => {
      usePriceAdjustmentStore.setState({ 
        productHistory: {
          'PROD_A': { history: [{ id: 1 }] },
          'PROD_B': { history: [{ id: 2 }] }
        }
      });
      
      usePriceAdjustmentStore.getState().clearProductHistory('PROD_A');
      
      const state = usePriceAdjustmentStore.getState();
      expect(state.productHistory['PROD_A']).toBeUndefined();
      expect(state.productHistory['PROD_B']).toBeDefined();
    });
  });
});