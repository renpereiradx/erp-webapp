import { apiClient } from './api';
import { DEMO_CONFIG } from '@/config/demoAuth';
import * as mocks from './mocks/salesAnalyticsMock';

// Helper to check for demo mode
const _checkDemo = () => {
  if (DEMO_CONFIG.enabled) {
    throw new Error('DEMO_MODE: Using local fallback data');
  }
};

/**
 * Service for Sales Analytics API
 */
const salesAnalyticsService = {
  /**
   * Get main dashboard metrics
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  getDashboard: async (period = 'month') => {
    try {
      _checkDemo();
      return await apiClient.makeRequest(`/sales-analytics/dashboard?period=${period}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_DASHBOARD;
      console.error(`[SalesAnalytics] Error in getDashboard (${period}):`, error);
      throw error;
    }
  },

  /**
   * Get sales performance metrics
   * @param {Object} params - { period, compare }
   */
  getPerformance: async (params = { period: 'month', compare: true }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/performance?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_PERFORMANCE;
      console.error(`[SalesAnalytics] Error in getPerformance:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales trends
   * @param {Object} params - { period, granularity }
   */
  getTrends: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/trends?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') {
        return params.granularity === 'hourly' ? mocks.MOCK_TRENDS_HOURLY : mocks.MOCK_TRENDS_DAILY;
      }
      console.error(`[SalesAnalytics] Error in getTrends:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales by category
   * @param {Object} params - { period, limit }
   */
  getByCategory: async (params = { period: 'month', limit: 20 }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/by-category?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_BY_CATEGORY;
      console.error(`[SalesAnalytics] Error in getByCategory:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales by product with pagination
   * @param {Object} params - { period, page, page_size, sort_by, sort_order }
   */
  getByProduct: async (params = { period: 'month', page: 1, page_size: 20 }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/by-product?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_BY_PRODUCT;
      console.error(`[SalesAnalytics] Error in getByProduct:`, error, params);
      throw error;
    }
  },

  /**
   * Get top and bottom products
   * @param {Object} params - { period, limit }
   */
  getTopBottomProducts: async (params = { period: 'month', limit: 10 }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/top-bottom-products?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_BY_PRODUCT;
      console.error(`[SalesAnalytics] Error in getTopBottomProducts:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales by customer
   * @param {Object} params - { period, page, page_size }
   */
  getByCustomer: async (params = { period: 'month', page: 1, page_size: 20 }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/by-customer?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_BY_CUSTOMER;
      console.error(`[SalesAnalytics] Error in getByCustomer:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales by seller
   * @param {Object} params - { period }
   */
  getBySeller: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/by-seller?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_BY_SELLER;
      console.error(`[SalesAnalytics] Error in getBySeller:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales by payment method
   * @param {Object} params - { period }
   */
  getByPaymentMethod: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/by-payment-method?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_PAYMENT_METHODS;
      console.error(`[SalesAnalytics] Error in getByPaymentMethod:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales heatmap (day/hour matrix)
   * @param {Object} params - { period }
   */
  getHeatmap: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/heatmap?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_HEATMAP;
      console.error(`[SalesAnalytics] Error in getHeatmap:`, error, params);
      throw error;
    }
  },

  /**
   * Get sales velocity metrics
   * @param {Object} params - { period }
   */
  getVelocity: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/velocity?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_VELOCITY;
      console.error(`[SalesAnalytics] Error in getVelocity:`, error, params);
      throw error;
    }
  },

  /**
   * Compare metrics between two periods
   * @param {Object} params - { period } OR { start1, end1, start2, end2 }
   */
  comparePeriods: async (params = { period: 'month' }) => {
    try {
      _checkDemo();
      const query = new URLSearchParams(params).toString();
      return await apiClient.makeRequest(`/sales-analytics/compare?${query}`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.message === 'DEMO_MODE: Using local fallback data') return mocks.MOCK_COMPARE;
      console.error(`[SalesAnalytics] Error in comparePeriods:`, error, params);
      throw error;
    }
  }
};

export default salesAnalyticsService;
