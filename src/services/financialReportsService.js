import apiService from './api'
import { telemetry } from '../utils/telemetry'

const API_PREFIX = '/financial-reports'
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true'

const _mockRes = (data) =>
  new Promise((resolve) => setTimeout(() => resolve({ data, success: true }), 600))

const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }
  throw lastError
}

export const financialReportsService = {
  /**
   * Obtiene el estado de resultados (P&L)
   */
  async getIncomeStatement(period = 'month', compare = true) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { start_date: "2024-05-01T00:00:00Z", end_date: "2024-05-31T00:00:00Z", type: period },
          revenue: {
            gross_sales: 510000000,
            returns: 5000000,
            discounts: 54800000,
            net_sales: 450200000,
            by_category: [
              { category_id: "1", category_name: "Hardware & Accesorios", amount: 185000000, percentage: 41 },
              { category_id: "2", category_name: "Suscripciones Software", amount: 210000000, percentage: 46 },
              { category_id: "3", category_name: "Servicios Profesionales", amount: 55200000, percentage: 13 }
            ],
            by_payment_method: [
              { method: "credit_card", amount: 292630000, percentage: 65 },
              { method: "bank_transfer", amount: 126056000, percentage: 28 },
              { method: "cash", amount: 31514000, percentage: 7 }
            ]
          },
          cost_of_sales: {
            purchases: 180000000,
            purchase_returns: 0,
            ending_inventory: 9950000,
            cost_of_goods_sold: 170050000
          },
          gross_profit: {
            amount: 280150000,
            margin: 62.2,
            percentage: 62.2
          },
          operating_income: 120400000,
          net_income: 95200000,
          comparison: {
            previous_period: { net_sales: 435000000, cost_of_goods_sold: 162000000, gross_profit: 273000000 },
            revenue_change: 15200000,
            revenue_change_pct: 12.5,
            gross_profit_change_pct: -2.1,
            operating_income_change_pct: 5.4,
            net_income_change: 7227000,
            net_income_change_pct: 8.2,
            cogs_change: 8050000,
            net_margin_gap: 1.2
          }
        })
      }

      const endpoint = `${API_PREFIX}/income-statement?period=${period}&compare=${compare}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('financial.service.incomeStatement', {
        duration: Date.now() - startTime,
        period
      })
      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getIncomeStatement',
      })
      throw error
    }
  },

  /**
   * Obtiene el reporte de márgenes de rentabilidad
   */
  async getProfitMargins(period = 'month', limit = 20) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          overall: {
            gross_margin: 125000000,
            gross_margin_pct: 27.8,
            operating_margin: 80000000,
            operating_margin_pct: 17.7,
            operating_growth: 4.2,
            net_margin: 60000000,
            net_margin_pct: 13.3,
            revenue: 450000000
          },
          by_category: [
            { category_id: "1", category_name: "Electrónica", revenue: 180000000, cost: 120000000, gross_profit: 60000000, gross_margin_pct: 33.3, units_sold: 150, evolution: 2.4 },
            { category_id: "2", category_name: "Hogar y Jardín", revenue: 95000000, cost: 65000000, gross_profit: 30000000, gross_margin_pct: 31.6, units_sold: 200, evolution: -0.8 },
            { category_id: "3", category_name: "Moda y Accesorios", revenue: 110000000, cost: 85000000, gross_profit: 25000000, gross_margin_pct: 22.7, units_sold: 350, evolution: 1.2 },
            { category_id: "4", category_name: "Alimentos", revenue: 65000000, cost: 55000000, gross_profit: 10000000, gross_margin_pct: 15.4, units_sold: 500, evolution: -4.5 }
          ],
          by_product: [],
          top_profitable: [
            { product_id: "1", product_name: "Smartwatch Series X", sku: "SW-X2024-B", category_name: "Electrónica", revenue: 5000000, cost: 2575000, gross_profit: 2425000, gross_margin_pct: 48.5, units_sold: 57, average_price: 87700, average_cost: 45175 },
            { product_id: "2", product_name: "Auriculares ANC Pro", sku: "AU-ANC-99", category_name: "Electrónica", revenue: 4500000, cost: 2601000, gross_profit: 1899000, gross_margin_pct: 42.2, units_sold: 48, average_price: 93750, average_cost: 54187 },
            { product_id: "3", product_name: "Cámara 4K Vlog", sku: "CAM-4K-V2", category_name: "Electrónica", revenue: 12000000, cost: 7224000, gross_profit: 4776000, gross_margin_pct: 39.8, units_sold: 10, average_price: 1200000, average_cost: 722400 }
          ],
          least_profitable: [
            { product_id: "4", product_name: "Papelera Premium Steel", sku: "HO-PA-04", category_name: "Hogar", revenue: 1500000, cost: 1437000, gross_profit: 63000, gross_margin_pct: 4.2, units_sold: 52, average_price: 28846, average_cost: 27634 },
            { product_id: "5", product_name: "Cables USB-C (Pack 3)", sku: "EL-CB-UC3", category_name: "Electrónica", revenue: 850000, cost: 806650, gross_profit: 43350, gross_margin_pct: 5.1, units_sold: 106, average_price: 8018, average_cost: 7609 },
            { product_id: "6", product_name: "Alfombrilla Mouse XL", sku: "EL-AL-M02", category_name: "Electrónica", revenue: 1200000, cost: 1118400, gross_profit: 81600, gross_margin_pct: 6.8, units_sold: 55, average_price: 21818, average_cost: 20334 }
          ],
          trends: [
            { date: "ENE", gross_margin_pct: 40.0, revenue_pct: 60 },
            { date: "FEB", gross_margin_pct: 50.0, revenue_pct: 70 },
            { date: "MAR", gross_margin_pct: 45.0, revenue_pct: 65 },
            { date: "ABR", gross_margin_pct: 60.0, revenue_pct: 85 },
            { date: "MAY", gross_margin_pct: 55.0, revenue_pct: 80 },
            { date: "JUN", gross_margin_pct: 70.0, revenue_pct: 95 }
          ]
        })
      }

      const endpoint = `${API_PREFIX}/profit-margins?period=${period}&limit=${limit}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('financial.service.profitMargins', {
        duration: Date.now() - startTime,
        period, limit
      })
      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getProfitMargins',
      })
      throw error
    }
  }
}
