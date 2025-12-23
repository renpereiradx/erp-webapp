/**
 * Modular Mock Data System
 * Centralized configuration and data management for all mock data
 * No hardcoded values - everything is configurable and factory-generated
 */

// Import all modular mock data
import {
  DEMO_PRODUCT_DATA,
  PRODUCTS_CONFIG,
  createProductData,
} from './products.js'
import {
  DEMO_SALES_DATA,
  DEMO_SALE_ITEMS_DATA,
  SALES_CONFIG,
  createSalesData,
} from './sales.js'
import {
  DEMO_RESERVATIONS_DATA,
  RESERVATIONS_CONFIG,
  createReservationsData,
} from './reservations.js'
import {
  DEMO_SCHEDULES_DATA,
  SCHEDULES_CONFIG,
  createSchedulesData,
} from './schedules.js'

// Global mock configuration
export const MOCK_CONFIG = {
  enabled: true, // Master switch for all mock data
  useRealAPI: true, // Global toggle for real API calls - CHANGED to use real API
  simulateNetworkDelay: false, // Global network simulation - DISABLED for real API
  defaultDelayMs: 500,
  globalSeed: 1000, // For consistent data generation

  // Environment-specific settings
  development: {
    enabled: true,
    verbose: true, // Log mock data usage
    generateOnStart: true,
  },

  production: {
    enabled: false, // Disable mocks in production
    verbose: false,
    generateOnStart: false,
  },
}

// Data generators - factory pattern
export const MockDataGenerators = {
  products: createProductData,
  sales: createSalesData,
  reservations: createReservationsData,
  schedules: createSchedulesData,
}

// Configurations
export const MockConfigs = {
  products: PRODUCTS_CONFIG,
  sales: SALES_CONFIG,
  reservations: RESERVATIONS_CONFIG,
  schedules: SCHEDULES_CONFIG,
}

// Generated data exports
export {
  DEMO_PRODUCT_DATA,
  DEMO_SALES_DATA,
  DEMO_SALE_ITEMS_DATA,
  DEMO_RESERVATIONS_DATA,
  DEMO_SCHEDULES_DATA,
}

// Utility functions
export const generateMockData = (type, options = {}) => {
  const generator = MockDataGenerators[type]
  if (!generator) {
    throw new Error(`No generator found for type: ${type}`)
  }

  return generator({
    seed: MOCK_CONFIG.globalSeed,
    ...options,
  })
}

export const refreshMockData = () => {
  return {
    products: generateMockData('products', { count: 10 }),
    sales: generateMockData('sales', { count: 20 }),
    reservations: generateMockData('reservations', { count: 15 }),
    schedules: generateMockData('schedules', { daysAhead: 21 }),
  }
}

// Simulate network delay
export const simulateDelay = (ms = MOCK_CONFIG.defaultDelayMs) => {
  if (!MOCK_CONFIG.simulateNetworkDelay) return Promise.resolve()
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock data service helpers
export const MockDataService = {
  async getProducts(params = {}) {
    await simulateDelay(PRODUCTS_CONFIG.delayMs)

    const {
      page = 1,
      pageSize = PRODUCTS_CONFIG.pageSize,
      category = '',
      type = '',
      search = '',
      reservable = null,
    } = params

    let filteredProducts = [...DEMO_PRODUCT_DATA]

    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(p =>
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    if (type) {
      filteredProducts = filteredProducts.filter(p => p.type === type)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
      )
    }

    if (reservable !== null) {
      filteredProducts = filteredProducts.filter(
        p => p.reservable === reservable
      )
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredProducts.length / pageSize)

    return {
      success: true,
      data: paginatedProducts,
      pagination: {
        total: filteredProducts.length,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      source: 'mock',
    }
  },

  async getSales(params = {}) {
    await simulateDelay(SALES_CONFIG.delayMs)

    const {
      page = 1,
      pageSize = SALES_CONFIG.pageSize,
      client_id = '',
      status = '',
      date_from = '',
      date_to = '',
    } = params

    let filteredSales = [...DEMO_SALES_DATA]

    // Apply filters
    if (client_id) {
      filteredSales = filteredSales.filter(
        s => s.client_id === parseInt(client_id)
      )
    }

    if (status) {
      filteredSales = filteredSales.filter(s => s.status === status)
    }

    if (date_from) {
      filteredSales = filteredSales.filter(s => s.sale_date >= date_from)
    }

    if (date_to) {
      filteredSales = filteredSales.filter(s => s.sale_date <= date_to)
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedSales = filteredSales.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredSales.length / pageSize)

    return {
      success: true,
      data: paginatedSales,
      sales: paginatedSales, // For API compatibility
      total_count: filteredSales.length,
      total_pages: totalPages,
      page,
      page_size: pageSize,
      pagination: {
        total: filteredSales.length,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      source: 'mock',
    }
  },

  async getReservations(params = {}) {
    await simulateDelay(RESERVATIONS_CONFIG.delayMs)

    const {
      page = 1,
      pageSize = RESERVATIONS_CONFIG.pageSize,
      client_id = '',
      product_id = '',
      status = '',
    } = params

    let filteredReservations = [...DEMO_RESERVATIONS_DATA]

    // Apply filters
    if (client_id) {
      filteredReservations = filteredReservations.filter(
        r => r.client_id === parseInt(client_id)
      )
    }

    if (product_id) {
      filteredReservations = filteredReservations.filter(
        r => r.product_id === product_id
      )
    }

    if (status) {
      filteredReservations = filteredReservations.filter(
        r => r.status === status
      )
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedReservations = filteredReservations.slice(
      startIndex,
      endIndex
    )
    const totalPages = Math.ceil(filteredReservations.length / pageSize)

    return {
      success: true,
      data: paginatedReservations,
      pagination: {
        total: filteredReservations.length,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      source: 'mock',
    }
  },

  async getSchedules(params = {}) {
    await simulateDelay(SCHEDULES_CONFIG.delayMs)

    const {
      page = 1,
      pageSize = SCHEDULES_CONFIG.pageSize,
      product_id = '',
      startDate = '',
      endDate = '',
    } = params

    let filteredSchedules = [...DEMO_SCHEDULES_DATA]

    // Apply filters
    if (product_id) {
      filteredSchedules = filteredSchedules.filter(
        s => s.product_id === product_id
      )
    }

    if (startDate) {
      filteredSchedules = filteredSchedules.filter(
        s => s.start_time >= startDate
      )
    }

    if (endDate) {
      filteredSchedules = filteredSchedules.filter(s => s.start_time <= endDate)
    }

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredSchedules.length / pageSize)

    return {
      success: true,
      data: paginatedSchedules,
      pagination: {
        total: filteredSchedules.length,
        totalPages,
        currentPage: page,
        pageSize,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      source: 'mock',
    }
  },
}

// Development utilities
if (MOCK_CONFIG.development.verbose && process.env.NODE_ENV === 'development') {
  // Mock data system initialized
}
