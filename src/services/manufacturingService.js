import { apiClient } from '@/services/api'
import { ApiError, toApiError } from '@/utils/ApiError'

const isMissingResourceError = error => {
  if (!error) return false
  const code = error.code || ''
  return [
    'NOT_FOUND',
    'ENDPOINT_NOT_FOUND',
    'ENDPOINT_NOT_IMPLEMENTED',
  ].includes(code)
}

const normalizeError = (error, fallbackMessage) => {
  if (error instanceof ApiError) return error
  return toApiError(error, fallbackMessage)
}

const normalizeListResponse = response => {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

const normalizeSingleResponse = response => {
  if (!response) return null
  if (Array.isArray(response)) return response[0] ?? null
  if (Array.isArray(response?.data)) return response.data[0] ?? null
  return response
}

export const manufacturingService = {
  async getProductRecipe(productId) {
    if (!productId) return []
    try {
      const response = await apiClient.makeRequest(
        `/manufacturing/recipes/${productId}`,
        {
          method: 'GET',
        }
      )
      return normalizeListResponse(response)
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Error al obtener la receta de producción'
      )
      if (isMissingResourceError(normalized)) {
        return []
      }
      throw normalized
    }
  },

  async addRecipeIngredient(productId, payload) {
    try {
      return await apiClient.makeRequest(
        `/manufacturing/recipes/${productId}/ingredients`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
    } catch (error) {
      throw toApiError(error, 'Error al agregar ingrediente a la receta')
    }
  },

  async removeRecipeIngredient(productId, supplyId) {
    try {
      return await apiClient.makeRequest(
        `/manufacturing/recipes/${productId}/ingredients/${supplyId}`,
        {
          method: 'DELETE',
        }
      )
    } catch (error) {
      throw toApiError(error, 'Error al eliminar ingrediente de la receta')
    }
  },

  async getProductionBatches(params = {}) {
    try {
      const query = new URLSearchParams()
      if (params.productId) query.append('product_id', params.productId)
      if (params.limit != null) query.append('limit', params.limit)
      if (params.offset != null) query.append('offset', params.offset)
      const queryString = query.toString()
      const endpoint = `/manufacturing/production/batches${
        queryString ? `?${queryString}` : ''
      }`
      const response = await apiClient.makeRequest(endpoint, { method: 'GET' })
      return normalizeListResponse(response)
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Error al obtener los lotes de producción'
      )
      if (isMissingResourceError(normalized)) {
        return []
      }
      throw normalized
    }
  },

  async registerProduction(payload) {
    try {
      return await apiClient.makeRequest('/manufacturing/production', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      throw toApiError(error, 'Error al registrar la producción')
    }
  },

  async getProductionSummary(productId) {
    try {
      const query = productId
        ? `?product_id=${encodeURIComponent(productId)}`
        : ''
      const response = await apiClient.makeRequest(
        `/manufacturing/reports/production${query}`,
        {
          method: 'GET',
        }
      )
      return normalizeSingleResponse(response)
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Error al obtener el resumen de producción'
      )
      if (isMissingResourceError(normalized)) {
        return null
      }
      throw normalized
    }
  },

  async getProfitability(productId) {
    try {
      const query = productId
        ? `?product_id=${encodeURIComponent(productId)}`
        : ''
      const response = await apiClient.makeRequest(
        `/manufacturing/reports/profitability${query}`,
        {
          method: 'GET',
        }
      )
      return normalizeSingleResponse(response)
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Error al obtener la rentabilidad del producto'
      )
      if (isMissingResourceError(normalized)) {
        return null
      }
      throw normalized
    }
  },

  async getSupplies(params = {}) {
    try {
      const query = new URLSearchParams()
      if (typeof params.active !== 'undefined')
        query.append('active', params.active ? 'true' : 'false')
      if (params.limit != null) query.append('limit', params.limit)
      if (params.offset != null) query.append('offset', params.offset)
      const queryString = query.toString()
      const endpoint = `/manufacturing/supplies${
        queryString ? `?${queryString}` : ''
      }`
      const response = await apiClient.makeRequest(endpoint, { method: 'GET' })
      return normalizeListResponse(response)
    } catch (error) {
      const normalized = normalizeError(error, 'Error al obtener los insumos')
      if (isMissingResourceError(normalized)) {
        return []
      }
      throw normalized
    }
  },

  async registerSupplyPurchase(payload) {
    try {
      const body = {
        supply_id: Number.parseInt(payload.supply_id, 10),
        quantity: Number.parseFloat(payload.quantity),
        unit_cost: Number.parseFloat(payload.unit_cost),
        supplier_name: payload.supplier_name?.trim() || undefined,
        invoice_number: payload.invoice_number?.trim() || undefined,
        notes: payload.notes?.trim() || undefined,
      }

      if (!Number.isFinite(body.supply_id)) {
        throw new ApiError(
          'INVALID_SUPPLY',
          'Debes seleccionar un insumo válido'
        )
      }

      if (!Number.isFinite(body.quantity) || body.quantity <= 0) {
        throw new ApiError('INVALID_QUANTITY', 'La cantidad debe ser mayor a 0')
      }

      if (!Number.isFinite(body.unit_cost) || body.unit_cost < 0) {
        throw new ApiError(
          'INVALID_COST',
          'El costo unitario no puede ser negativo'
        )
      }

      return await apiClient.makeRequest('/manufacturing/purchases', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    } catch (error) {
      throw normalizeError(error, 'Error al registrar la compra de insumos')
    }
  },

  async getSupplyPurchases(params = {}) {
    try {
      const query = new URLSearchParams()
      if (params.supplyId) query.append('supply_id', params.supplyId)
      if (params.limit != null) query.append('limit', params.limit)
      if (params.offset != null) query.append('offset', params.offset)
      const queryString = query.toString()
      const endpoint = `/manufacturing/purchases${
        queryString ? `?${queryString}` : ''
      }`
      const response = await apiClient.makeRequest(endpoint, { method: 'GET' })
      return normalizeListResponse(response)
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Error al obtener el historial de compras de insumos'
      )
      if (isMissingResourceError(normalized)) {
        return []
      }
      throw normalized
    }
  },

  async createSupply(payload) {
    try {
      return await apiClient.makeRequest('/manufacturing/supplies', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      throw normalizeError(error, 'Error al crear el insumo')
    }
  },

  async updateSupply(id, payload) {
    try {
      return await apiClient.makeRequest(`/manufacturing/supplies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    } catch (error) {
      throw normalizeError(error, 'Error al actualizar el insumo')
    }
  },

  async deleteSupply(id) {
    try {
      return await apiClient.makeRequest(`/manufacturing/supplies/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw normalizeError(error, 'Error al eliminar el insumo')
    }
  },
}

export default manufacturingService
