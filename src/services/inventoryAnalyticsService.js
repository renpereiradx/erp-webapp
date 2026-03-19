/**
 * Servicio para Analítica de Inventario (Business Intelligence)
 * Provee acceso a KPIs, niveles de stock, rotación y pronósticos.
 */

import { apiClient } from '@/services/api'
import * as mockData from '../data/mockInventoryAnalytics'
import { mockInventoryABCData } from '../data/mockInventoryABCData'

const API_ENDPOINTS = {
  overview: '/inventory-analytics/overview',
  stockLevels: '/inventory-analytics/stock-levels',
  turnover: '/inventory-analytics/turnover',
  turnoverDateRange: '/inventory-analytics/turnover/date-range',
  abc: '/inventory-analytics/abc',
  abcDateRange: '/inventory-analytics/abc/date-range',
  deadStock: '/inventory-analytics/dead-stock',
  reorder: '/inventory-analytics/reorder',
  aging: '/inventory-analytics/aging',
  movements: '/inventory-analytics/movements',
  movementsDateRange: '/inventory-analytics/movements/date-range',
  forecast: '/inventory-analytics/forecast',
  dashboard: '/inventory-analytics/dashboard',
}

// Verifica si estamos en modo demo
const isDemoMode = () => {
  return (
    import.meta.env.VITE_APP_MODE === 'demo' ||
    import.meta.env.MODE === 'demo' ||
    true
  ) // Forzamos true para desarrollo inicial si no hay API
}

/**
 * Helper para manejar peticiones con fallback a mock data en modo demo o error 404
 */
const _handleRequest = async (endpoint, params = {}, mockFallback) => {
  if (isDemoMode()) {
    return { success: true, data: mockFallback }
  }

  try {
    const response = await apiClient.get(endpoint, { params })
    return response
  } catch (error) {
    console.error(
      `[InventoryAnalyticsService] Error fetching ${endpoint}:`,
      error,
    )

    // Fallback si la API no existe aún (404)
    if (error.status === 404 || error.response?.status === 404) {
      console.warn(
        `[InventoryAnalyticsService] Endpoint ${endpoint} not found. Returning mock data.`,
      )
      return { success: true, data: mockFallback }
    }

    throw error
  }
}

export const inventoryAnalyticsService = {
  getOverview: () =>
    _handleRequest(API_ENDPOINTS.overview, {}, mockData.mockInventoryOverview),

  getStockLevels: (params = {}) =>
    _handleRequest(API_ENDPOINTS.stockLevels, params, mockData.mockStockLevels),

  getTurnover: (period = 'month', limit = 20) =>
    _handleRequest(
      API_ENDPOINTS.turnover,
      { period, limit },
      mockInventoryABCData,
    ),

  getABC: (period = 'month') =>
    _handleRequest(
      API_ENDPOINTS.abc,
      { period },
      mockData.mockInventoryDashboard,
    ),

  getDeadStock: (daysThreshold = 90) =>
    _handleRequest(
      API_ENDPOINTS.deadStock,
      { days_threshold: daysThreshold },
      mockData.mockDeadStockAnalysis,
    ),

  getReorderAnalysis: () =>
    _handleRequest(API_ENDPOINTS.reorder, {}, mockData.mockReorderAnalysis),

  getForecast: (forecastDays = 30) =>
    _handleRequest(
      API_ENDPOINTS.forecast,
      { forecast_days: forecastDays },
      mockData.mockStockForecast,
    ),

  getDashboard: () =>
    _handleRequest(
      API_ENDPOINTS.dashboard,
      {},
      mockData.mockInventoryDashboard,
    ),
}

export default inventoryAnalyticsService
