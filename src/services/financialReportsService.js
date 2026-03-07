import apiService from './api'
import { telemetry } from '../utils/telemetry'

const API_PREFIX = '/financial-reports'
const USE_MOCK = import.meta.env.VITE_USE_DEMO === 'true'

const _mockRes = data =>
  new Promise(resolve =>
    setTimeout(() => resolve({ data, success: true }), 600),
  )

const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
    }
  }
  throw lastError
}

const _toQueryString = params => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })

  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export const financialReportsService = {
  /**
   * Obtiene el flujo de efectivo
   */
  async getCashFlow(period = 'month') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          beginning_cash: 10000000,
          operating_activities: {
            cash_from_sales: 35000000,
            cash_from_receivables: 5000000,
            cash_paid_to_suppliers: 25000000,
            cash_paid_for_expenses: 3000000,
            cash_paid_for_salaries: 5000000,
            net_operating_cash_flow: 7000000,
          },
          investing_activities: {
            equipment_purchases: 0,
            net_investing_cash_flow: 0,
          },
          financing_activities: {
            loan_payments: 0,
            net_financing_cash_flow: 0,
          },
          ending_cash: 17000000,
          net_cash_change: 7000000,
          daily_breakdown: [
            {
              date: '2026-01-01',
              inflows: 1500000,
              outflows: 800000,
              net_flow: 700000,
              balance: 10700000,
            },
            {
              date: '2026-01-02',
              inflows: 1100000,
              outflows: 900000,
              net_flow: 200000,
              balance: 10900000,
            },
            {
              date: '2026-01-03',
              inflows: 2100000,
              outflows: 1200000,
              net_flow: 900000,
              balance: 11800000,
            },
            {
              date: '2026-01-04',
              inflows: 1750000,
              outflows: 950000,
              net_flow: 800000,
              balance: 12600000,
            },
            {
              date: '2026-01-05',
              inflows: 1650000,
              outflows: 1400000,
              net_flow: 250000,
              balance: 12850000,
            },
            {
              date: '2026-01-06',
              inflows: 1900000,
              outflows: 1000000,
              net_flow: 900000,
              balance: 13750000,
            },
            {
              date: '2026-01-07',
              inflows: 1450000,
              outflows: 950000,
              net_flow: 500000,
              balance: 14250000,
            },
          ],
        })
      }

      const endpoint = `${API_PREFIX}/cash-flow?period=${period}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('financial.service.cashFlow', {
        duration: Date.now() - startTime,
        period,
      })
      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getCashFlow',
      })
      throw error
    }
  },

  /**
   * Obtiene el reporte de IVA
   */
  async getVat(period = 'month') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          sales_vat: {
            gross_sales_10: 40000000,
            vat_10: 3636364,
            gross_sales_5: 5000000,
            vat_5: 238095,
            exempt_sales: 3500000,
            total_gross_sales: 48500000,
            total_vat_debito: 3874459,
            transaction_count: 250,
          },
          purchases_vat: {
            gross_purchases_10: 30000000,
            vat_10: 2727273,
            gross_purchases_5: 2000000,
            vat_5: 95238,
            exempt_purchases: 3000000,
            total_gross_purchases: 35000000,
            total_vat_credito: 2822511,
            transaction_count: 50,
          },
          vat_balance: {
            vat_debito: 3874459,
            vat_credito: 2822511,
            vat_payable: 1051948,
            credit_carryover: 0,
            status: 'TO_PAY',
          },
          monthly_breakdown: [
            {
              month: '2025-08-01',
              vat_debito: 3340000,
              vat_credito: 2480000,
              balance: 860000,
              status: 'TO_PAY',
            },
            {
              month: '2025-09-01',
              vat_debito: 3510000,
              vat_credito: 2590000,
              balance: 920000,
              status: 'TO_PAY',
            },
            {
              month: '2025-10-01',
              vat_debito: 3660000,
              vat_credito: 2670000,
              balance: 990000,
              status: 'TO_PAY',
            },
            {
              month: '2025-11-01',
              vat_debito: 3720000,
              vat_credito: 2760000,
              balance: 960000,
              status: 'TO_PAY',
            },
            {
              month: '2025-12-01',
              vat_debito: 3810000,
              vat_credito: 2810000,
              balance: 1000000,
              status: 'TO_PAY',
            },
            {
              month: '2026-01-01',
              vat_debito: 3874459,
              vat_credito: 2822511,
              balance: 1051948,
              status: 'TO_PAY',
            },
          ],
        })
      }

      const endpoint = `${API_PREFIX}/vat${_toQueryString({ period })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.vat', {
        duration: Date.now() - startTime,
        period,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getVat',
      })
      throw error
    }
  },

  /**
   * Obtiene el resumen fiscal
   */
  async getTaxSummary(period = 'month') {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          vat_summary: {
            total_debito: 3874459,
            total_credito: 2822511,
            net_vat: 1051948,
            credit_balance: 0,
          },
          total_tax_liability: 1051948,
          total_tax_credits: 0,
          net_tax_position: 1051948,
          monthly_detail: [
            {
              month: '2025-11-01',
              vat_debito: 3720000,
              vat_credito: 2760000,
              net_vat: 960000,
              retentions: 0,
              total_liability: 960000,
            },
            {
              month: '2025-12-01',
              vat_debito: 3810000,
              vat_credito: 2810000,
              net_vat: 1000000,
              retentions: 0,
              total_liability: 1000000,
            },
            {
              month: '2026-01-01',
              vat_debito: 3874459,
              vat_credito: 2822511,
              net_vat: 1051948,
              retentions: 0,
              total_liability: 1051948,
            },
          ],
        })
      }

      const endpoint = `${API_PREFIX}/tax-summary${_toQueryString({ period })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.taxSummary', {
        duration: Date.now() - startTime,
        period,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getTaxSummary',
      })
      throw error
    }
  },

  /**
   * Obtiene el libro de ventas por período
   */
  async getSalesLedger(period = 'month', page = 1, pageSize = 50) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          summary: {
            total_transactions: 5,
            total_gross: 6090000,
            total_vat_10: 365000,
            total_vat_5: 75000,
            total_exempt: 500000,
            total_net: 5650000,
          },
          entries: [
            {
              date: '2026-01-05T10:30:00Z',
              invoice_number: '001-001-0004512',
              timbrado: '12345678',
              client_ruc: '80023412-5',
              client_name: 'Distribuidora Nacional S.A.',
              gross_amount: 2750000,
              vat_10: 250000,
              vat_5: 0,
              exempt: 0,
              net_amount: 2500000,
              payment_method: 'cash',
              payment_status: 'paid',
            },
            {
              date: '2026-01-12T10:30:00Z',
              invoice_number: '001-002-0000891',
              timbrado: '15822941',
              client_ruc: '1245678-3',
              client_name: 'Juan Pérez Garcia',
              gross_amount: 500000,
              vat_10: 0,
              vat_5: 0,
              exempt: 500000,
              net_amount: 500000,
              payment_method: 'transfer',
              payment_status: 'paid',
            },
          ],
          pagination: {
            page,
            page_size: pageSize,
            total_items: 5,
            total_pages: 1,
          },
        })
      }

      const endpoint = `${API_PREFIX}/sales-ledger${_toQueryString({
        period,
        page,
        page_size: pageSize,
      })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.salesLedger', {
        duration: Date.now() - startTime,
        period,
        page,
        pageSize,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesLedger',
      })
      throw error
    }
  },

  /**
   * Obtiene el libro de ventas por rango de fechas
   */
  async getSalesLedgerDateRange(startDate, endDate, page = 1, pageSize = 50) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return this.getSalesLedger('month', page, pageSize)
      }

      const endpoint = `${API_PREFIX}/sales-ledger/date-range${_toQueryString({
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
      })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.salesLedgerDateRange', {
        duration: Date.now() - startTime,
        startDate,
        endDate,
        page,
        pageSize,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getSalesLedgerDateRange',
      })
      throw error
    }
  },

  /**
   * Obtiene el libro de compras por período
   */
  async getPurchaseLedger(period = 'month', page = 1, pageSize = 50) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: { type: period },
          summary: {
            total_transactions: 4,
            total_gross: 4520000,
            total_vat_10: 302000,
            total_vat_5: 51000,
            total_exempt: 400000,
            total_net: 3767000,
          },
          entries: [
            {
              date: '2026-01-07T09:00:00Z',
              invoice_number: '001-001-0005678',
              timbrado: '87654321',
              supplier_ruc: '80098765-4',
              supplier_name: 'Proveedor SRL',
              gross_amount: 1500000,
              vat_10: 136364,
              vat_5: 0,
              exempt: 0,
              net_amount: 1363636,
              payment_status: 'paid',
            },
            {
              date: '2026-01-15T09:00:00Z',
              invoice_number: '001-001-0005691',
              timbrado: '87654321',
              supplier_ruc: '80011223-4',
              supplier_name: 'Servicios Integrales S.A.',
              gross_amount: 920000,
              vat_10: 83636,
              vat_5: 0,
              exempt: 0,
              net_amount: 836364,
              payment_status: 'paid',
            },
          ],
          pagination: {
            page,
            page_size: pageSize,
            total_items: 4,
            total_pages: 1,
          },
        })
      }

      const endpoint = `${API_PREFIX}/purchase-ledger${_toQueryString({
        period,
        page,
        page_size: pageSize,
      })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.purchaseLedger', {
        duration: Date.now() - startTime,
        period,
        page,
        pageSize,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPurchaseLedger',
      })
      throw error
    }
  },

  /**
   * Obtiene el libro de compras por rango de fechas
   */
  async getPurchaseLedgerDateRange(startDate, endDate, page = 1, pageSize = 50) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return this.getPurchaseLedger('month', page, pageSize)
      }

      const endpoint = `${API_PREFIX}/purchase-ledger/date-range${_toQueryString({
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
      })}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))

      telemetry.record('financial.service.purchaseLedgerDateRange', {
        duration: Date.now() - startTime,
        startDate,
        endDate,
        page,
        pageSize,
      })

      return result
    } catch (error) {
      telemetry.record('financial.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getPurchaseLedgerDateRange',
      })
      throw error
    }
  },

  /**
   * Obtiene el estado de resultados (P&L)
   */
  async getIncomeStatement(period = 'month', compare = true) {
    const startTime = Date.now()
    try {
      if (USE_MOCK) {
        return _mockRes({
          period: {
            start_date: '2024-05-01T00:00:00Z',
            end_date: '2024-05-31T00:00:00Z',
            type: period,
          },
          revenue: {
            gross_sales: 510000000,
            returns: 5000000,
            discounts: 54800000,
            net_sales: 450200000,
            by_category: [
              {
                category_id: '1',
                category_name: 'Hardware & Accesorios',
                amount: 185000000,
                percentage: 41,
              },
              {
                category_id: '2',
                category_name: 'Suscripciones Software',
                amount: 210000000,
                percentage: 46,
              },
              {
                category_id: '3',
                category_name: 'Servicios Profesionales',
                amount: 55200000,
                percentage: 13,
              },
            ],
            by_payment_method: [
              { method: 'credit_card', amount: 292630000, percentage: 65 },
              { method: 'bank_transfer', amount: 126056000, percentage: 28 },
              { method: 'cash', amount: 31514000, percentage: 7 },
            ],
          },
          cost_of_sales: {
            purchases: 180000000,
            purchase_returns: 0,
            ending_inventory: 9950000,
            cost_of_goods_sold: 170050000,
          },
          gross_profit: {
            amount: 280150000,
            margin: 62.2,
            percentage: 62.2,
          },
          operating_income: 120400000,
          net_income: 95200000,
          comparison: {
            previous_period: {
              net_sales: 435000000,
              cost_of_goods_sold: 162000000,
              gross_profit: 273000000,
            },
            revenue_change: 15200000,
            revenue_change_pct: 12.5,
            gross_profit_change_pct: -2.1,
            operating_income_change_pct: 5.4,
            net_income_change: 7227000,
            net_income_change_pct: 8.2,
            cogs_change: 8050000,
            net_margin_gap: 1.2,
          },
        })
      }

      const endpoint = `${API_PREFIX}/income-statement?period=${period}&compare=${compare}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('financial.service.incomeStatement', {
        duration: Date.now() - startTime,
        period,
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
            revenue: 450000000,
          },
          by_category: [
            {
              category_id: '1',
              category_name: 'Electrónica',
              revenue: 180000000,
              cost: 120000000,
              gross_profit: 60000000,
              gross_margin_pct: 33.3,
              units_sold: 150,
              evolution: 2.4,
            },
            {
              category_id: '2',
              category_name: 'Hogar y Jardín',
              revenue: 95000000,
              cost: 65000000,
              gross_profit: 30000000,
              gross_margin_pct: 31.6,
              units_sold: 200,
              evolution: -0.8,
            },
            {
              category_id: '3',
              category_name: 'Moda y Accesorios',
              revenue: 110000000,
              cost: 85000000,
              gross_profit: 25000000,
              gross_margin_pct: 22.7,
              units_sold: 350,
              evolution: 1.2,
            },
            {
              category_id: '4',
              category_name: 'Alimentos',
              revenue: 65000000,
              cost: 55000000,
              gross_profit: 10000000,
              gross_margin_pct: 15.4,
              units_sold: 500,
              evolution: -4.5,
            },
          ],
          by_product: [],
          top_profitable: [
            {
              product_id: '1',
              product_name: 'Smartwatch Series X',
              sku: 'SW-X2024-B',
              category_name: 'Electrónica',
              revenue: 5000000,
              cost: 2575000,
              gross_profit: 2425000,
              gross_margin_pct: 48.5,
              units_sold: 57,
              average_price: 87700,
              average_cost: 45175,
            },
            {
              product_id: '2',
              product_name: 'Auriculares ANC Pro',
              sku: 'AU-ANC-99',
              category_name: 'Electrónica',
              revenue: 4500000,
              cost: 2601000,
              gross_profit: 1899000,
              gross_margin_pct: 42.2,
              units_sold: 48,
              average_price: 93750,
              average_cost: 54187,
            },
            {
              product_id: '3',
              product_name: 'Cámara 4K Vlog',
              sku: 'CAM-4K-V2',
              category_name: 'Electrónica',
              revenue: 12000000,
              cost: 7224000,
              gross_profit: 4776000,
              gross_margin_pct: 39.8,
              units_sold: 10,
              average_price: 1200000,
              average_cost: 722400,
            },
          ],
          least_profitable: [
            {
              product_id: '4',
              product_name: 'Papelera Premium Steel',
              sku: 'HO-PA-04',
              category_name: 'Hogar',
              revenue: 1500000,
              cost: 1437000,
              gross_profit: 63000,
              gross_margin_pct: 4.2,
              units_sold: 52,
              average_price: 28846,
              average_cost: 27634,
            },
            {
              product_id: '5',
              product_name: 'Cables USB-C (Pack 3)',
              sku: 'EL-CB-UC3',
              category_name: 'Electrónica',
              revenue: 850000,
              cost: 806650,
              gross_profit: 43350,
              gross_margin_pct: 5.1,
              units_sold: 106,
              average_price: 8018,
              average_cost: 7609,
            },
            {
              product_id: '6',
              product_name: 'Alfombrilla Mouse XL',
              sku: 'EL-AL-M02',
              category_name: 'Electrónica',
              revenue: 1200000,
              cost: 1118400,
              gross_profit: 81600,
              gross_margin_pct: 6.8,
              units_sold: 55,
              average_price: 21818,
              average_cost: 20334,
            },
          ],
          trends: [
            { date: 'ENE', gross_margin_pct: 40.0, revenue_pct: 60 },
            { date: 'FEB', gross_margin_pct: 50.0, revenue_pct: 70 },
            { date: 'MAR', gross_margin_pct: 45.0, revenue_pct: 65 },
            { date: 'ABR', gross_margin_pct: 60.0, revenue_pct: 85 },
            { date: 'MAY', gross_margin_pct: 55.0, revenue_pct: 80 },
            { date: 'JUN', gross_margin_pct: 70.0, revenue_pct: 95 },
          ],
        })
      }

      const endpoint = `${API_PREFIX}/profit-margins?period=${period}&limit=${limit}`
      const result = await _fetchWithRetry(async () => apiService.get(endpoint))
      telemetry.record('financial.service.profitMargins', {
        duration: Date.now() - startTime,
        period,
        limit,
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
  },
}
