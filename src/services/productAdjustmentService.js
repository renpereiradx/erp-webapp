/**
 * Servicio para gestionar ajustes de producto.
 * Provee integración con la API y fallback con datos de demostración.
 */

import { apiClient } from '@/services/api'
import { telemetryService } from '@/services/telemetryService'
// import {
//   DEMO_PRODUCT_ADJUSTMENTS,
//   DEMO_PRODUCT_ADJUSTMENT_SUMMARY,
// } from '@/config/demoData'

const API_ENDPOINTS = {
  adjustments: '/api/product-adjustments',
  summary: '/api/product-adjustments/summary',
  sync: '/api/product-adjustments/sync',
}

const MAX_RETRIES = 2

const isNotFoundError = error => {
  if (!error) return false
  const status = error.status || error.response?.status
  if (status === 404) return true
  const message = error.message || error.response?.data?.message
  if (!message) return false
  return message.includes('404') || message.includes('not found')
}

const normalizeAdjustment = (item = {}) => ({
  id: item.id || item.adjustment_id || `ADJ-${Date.now()}`,
  product_id: item.product_id,
  product_name: item.product_name || item.metadata?.product_name,
  sku: item.sku || item.metadata?.sku,
  adjustment_type: item.adjustment_type || item.type || 'inventory',
  adjustment_method: item.adjustment_method || item.method || 'manual',
  previous_value: item.previous_value ?? item.old_quantity ?? null,
  new_value: item.new_value ?? item.new_quantity ?? null,
  difference:
    item.difference ??
    (item.new_value !== undefined && item.previous_value !== undefined
      ? item.new_value - item.previous_value
      : item.quantity_delta ?? null),
  unit: item.unit || item.metadata?.unit || 'UNIT',
  status: item.status || 'pending',
  reason: item.reason || item.metadata?.reason || 'Sin motivo registrado',
  user: item.user || item.user_id || item.created_by || 'usuario',
  created_at:
    item.created_at || item.adjustment_date || new Date().toISOString(),
  metadata: item.metadata || {},
})

const applyFiltersToDemo = (data, filters = {}) => {
  const { status, search, dateFrom, dateTo } = filters
  return data.filter(item => {
    const matchesStatus =
      !status || status === 'all' ? true : item.status === status

    const matchesSearch = (() => {
      if (!search) return true
      const term = search.toLowerCase()
      return [
        item.product_id,
        item.product_name,
        item.sku,
        item.reason,
        item.user,
        item.metadata?.reference,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    })()

    const matchesDate = (() => {
      if (!dateFrom && !dateTo) return true
      const created = new Date(item.created_at)
      if (Number.isNaN(created.getTime())) return false
      if (dateFrom && created < new Date(`${dateFrom}T00:00:00`)) return false
      if (dateTo && created > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })()

    return matchesStatus && matchesSearch && matchesDate
  })
}

const withFallback = async (fn, fallback, telemetryContext) => {
  let lastError = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (isNotFoundError(error) && fallback !== undefined) {
        telemetryService.recordEvent('product_adjustments_mock_fallback', {
          context: telemetryContext,
          attempt,
          reason: error.message,
        })
        return fallback
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

export const productAdjustmentService = {
  async list(filters = {}) {
    const startTime = Date.now()

    const query = new URLSearchParams()
    if (filters.status && filters.status !== 'all')
      query.append('status', filters.status)
    if (filters.search) query.append('search', filters.search)
    if (filters.dateFrom) query.append('from', filters.dateFrom)
    if (filters.dateTo) query.append('to', filters.dateTo)
    if (filters.limit) query.append('limit', String(filters.limit))
    if (filters.page) query.append('page', String(filters.page))

    const endpoint = `${API_ENDPOINTS.adjustments}${
      query.toString() ? `?${query.toString()}` : ''
    }`

    const demoDataset = [].map(normalizeAdjustment)
    const filteredDemo = applyFiltersToDemo(demoDataset, filters)
    const page = filters.page || 1
    const parsedLimit = Number.parseInt(filters.limit, 10)
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10
    const totalPages = Math.max(
      1,
      Math.ceil((filteredDemo.length || 1) / limit)
    )
    const safePage = Math.min(page, totalPages)
    const offset = (safePage - 1) * limit
    const paginatedDemo = filteredDemo.slice(offset, offset + limit)

    const fallback = {
      data: paginatedDemo,
      pagination: {
        page: safePage,
        pageSize: limit,
        total: filteredDemo.length,
        totalPages,
      },
    }

    try {
      const response = await withFallback(
        () => apiClient.makeRequest(endpoint, { method: 'GET' }),
        fallback,
        'list'
      )

      const payload = Array.isArray(response)
        ? { data: response }
        : response?.data
        ? { data: response.data, pagination: response.pagination }
        : response

      const normalized = Array.isArray(payload?.data)
        ? payload.data.map(normalizeAdjustment)
        : []

      telemetryService.recordEvent('product_adjustments_load_success', {
        duration: Date.now() - startTime,
        count: normalized.length,
      })

      return {
        data: normalized,
        pagination: payload?.pagination || fallback.pagination,
      }
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_load_error', {
        duration: Date.now() - startTime,
        error: error.message,
      })
      throw error
    }
  },

  async getSummary() {
    const startTime = Date.now()

    try {
      const response = await withFallback(
        () => apiClient.makeRequest(API_ENDPOINTS.summary, { method: 'GET' }),
        {},
        'summary'
      )

      telemetryService.recordEvent('product_adjustments_summary_success', {
        duration: Date.now() - startTime,
      })

      return response
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_summary_error', {
        duration: Date.now() - startTime,
        error: error.message,
      })
      throw error
    }
  },

  async create(adjustment) {
    const startTime = Date.now()

    const payload = {
      product_id: adjustment.product_id,
      new_quantity: adjustment.new_quantity,
      reason: adjustment.reason,
      metadata: adjustment.metadata || {},
    }

    try {
      const response = await withFallback(
        () =>
          apiClient.makeRequest(API_ENDPOINTS.adjustments, {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        {
          success: true,
          data: normalizeAdjustment({
            ...payload,
            id: `ADJ-${Date.now()}`,
            previous_value: adjustment.previous_value ?? null,
            new_value: adjustment.new_quantity,
            difference:
              adjustment.previous_value !== undefined
                ? adjustment.new_quantity - adjustment.previous_value
                : null,
            status: 'pending',
            user: adjustment.user || 'usuario.demo',
            created_at: new Date().toISOString(),
            metadata: {
              ...payload.metadata,
              source: payload.metadata?.source || 'manual',
              reference: payload.metadata?.reference || 'demo-entry',
            },
          }),
        },
        'create'
      )

      telemetryService.recordEvent('product_adjustments_create_success', {
        duration: Date.now() - startTime,
        productId: adjustment.product_id,
      })

      return response
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_create_error', {
        duration: Date.now() - startTime,
        error: error.message,
      })
      throw error
    }
  },

  async markAsApplied(adjustmentId) {
    const startTime = Date.now()

    try {
      const response = await withFallback(
        () =>
          apiClient.makeRequest(
            `${API_ENDPOINTS.adjustments}/${adjustmentId}/approve`,
            {
              method: 'POST',
            }
          ),
        {
          success: true,
          data: {
            id: adjustmentId,
            status: 'active',
          },
        },
        'approve'
      )

      telemetryService.recordEvent('product_adjustments_approve_success', {
        duration: Date.now() - startTime,
        adjustmentId,
      })

      return response
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_approve_error', {
        duration: Date.now() - startTime,
        adjustmentId,
        error: error.message,
      })
      throw error
    }
  },

  async revert(adjustmentId, data = {}) {
    const startTime = Date.now()

    try {
      const response = await withFallback(
        () =>
          apiClient.makeRequest(
            `${API_ENDPOINTS.adjustments}/${adjustmentId}/revert`,
            {
              method: 'POST',
              body: JSON.stringify(data),
            }
          ),
        {
          success: true,
          data: {
            id: adjustmentId,
            status: 'reverted',
          },
        },
        'revert'
      )

      telemetryService.recordEvent('product_adjustments_revert_success', {
        duration: Date.now() - startTime,
        adjustmentId,
      })

      return response
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_revert_error', {
        duration: Date.now() - startTime,
        adjustmentId,
        error: error.message,
      })
      throw error
    }
  },

  async sync() {
    const startTime = Date.now()

    try {
      const response = await withFallback(
        () => apiClient.makeRequest(API_ENDPOINTS.sync, { method: 'POST' }),
        {
          success: true,
          syncedAt: new Date().toISOString(),
          totalProcessed: 0,
        },
        'sync'
      )

      telemetryService.recordEvent('product_adjustments_sync_success', {
        duration: Date.now() - startTime,
      })

      return response
    } catch (error) {
      telemetryService.recordEvent('product_adjustments_sync_error', {
        duration: Date.now() - startTime,
        error: error.message,
      })
      throw error
    }
  },
}

export default productAdjustmentService
