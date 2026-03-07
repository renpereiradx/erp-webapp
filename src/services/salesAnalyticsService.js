import { apiClient } from './api';
import { DEMO_CONFIG } from '@/config/demoAuth';
import * as mocks from './mocks/salesAnalyticsMock';

/**
 * Service for Sales Analytics API
 */
const salesAnalyticsService = {
  /**
   * Get main dashboard metrics
   * @param {string} period - 'today', 'week', 'month', 'year'
   */
  getDashboard: (period = 'month') => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_DASHBOARD);
    return apiClient.makeRequest(`/sales-analytics/dashboard?period=${period}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales performance metrics
   * @param {Object} params - { period, compare }
   */
  getPerformance: (params = { period: 'month', compare: true }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_PERFORMANCE);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/performance?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales trends
   * @param {Object} params - { period, granularity }
   */
  getTrends: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) {
      return Promise.resolve(params.granularity === 'hourly' ? mocks.MOCK_TRENDS_HOURLY : mocks.MOCK_TRENDS_DAILY);
    }
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/trends?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales by category
   * @param {Object} params - { period, limit }
   */
  getByCategory: (params = { period: 'month', limit: 20 }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_BY_CATEGORY);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/by-category?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales by product with pagination
   * @param {Object} params - { period, page, page_size, sort_by, sort_order }
   */
  getByProduct: (params = { period: 'month', page: 1, page_size: 20 }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_BY_PRODUCT);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/by-product?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get top and bottom products
   * @param {Object} params - { period, limit }
   */
  getTopBottomProducts: (params = { period: 'month', limit: 10 }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_BY_PRODUCT);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/top-bottom-products?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales by customer
   * @param {Object} params - { period, page, page_size }
   */
  getByCustomer: (params = { period: 'month', page: 1, page_size: 20 }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_BY_CUSTOMER);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/by-customer?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales by seller
   * @param {Object} params - { period }
   */
  getBySeller: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_BY_SELLER);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/by-seller?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales by payment method
   * @param {Object} params - { period }
   */
  getByPaymentMethod: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_PAYMENT_METHODS);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/by-payment-method?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales heatmap (day/hour matrix)
   * @param {Object} params - { period }
   */
  getHeatmap: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_HEATMAP);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/heatmap?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Get sales velocity metrics
   * @param {Object} params - { period }
   */
  getVelocity: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_VELOCITY);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/velocity?${query}`, {
      method: 'GET'
    });
  },

  /**
   * Compare metrics between two periods
   * @param {Object} params - { period } OR { start1, end1, start2, end2 }
   */
  comparePeriods: (params = { period: 'month' }) => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(mocks.MOCK_COMPARE);
    const query = new URLSearchParams(params).toString();
    return apiClient.makeRequest(`/sales-analytics/compare?${query}`, {
      method: 'GET'
    });
  }
};

export default salesAnalyticsService;
