import { apiClient } from './api.js'
import { paymentApiDebug } from './paymentApiDebug.js'

// Track currencies whose exchange rate endpoints are unavailable to avoid redundant requests
const unavailableCurrencyEndpoints = new Set()
const loggedExchangeRateFailures = new Set()

const logExchangeRateFetchFailure = ({ currencyId, date, endpoint, error }) => {
  const logKey = `${currencyId || 'unknown'}|${date || 'latest'}`
  if (loggedExchangeRateFailures.has(logKey)) {
    return
  }
  loggedExchangeRateFailures.add(logKey)

  const timestamp = new Date().toISOString()
  const clientInfo = {}

  if (typeof window !== 'undefined') {
    clientInfo.location = window.location?.href
    clientInfo.userAgent = window.navigator?.userAgent
  }

  try {
    paymentApiDebug.record({
      service: 'ExchangeRateService',
      operation: 'getByDate',
      endpoint,
      error,
      note: 'Consulta de tipo de cambio específica',
      extra: {
        currencyId,
        date,
      },
    })
  } catch (logError) {
    console.warn(
      '[ExchangeRateService] No se pudo registrar el diagnóstico:',
      logError
    )
  }

  console.groupCollapsed(
    `%c[ExchangeRateService] ❌ Falló consulta tipo de cambio`,
    'color:#ef4444;font-weight:600;'
  )
  console.log('🕒 Timestamp:', timestamp)
  console.log('💱 Moneda:', currencyId)
  console.log('📅 Fecha solicitada:', date || 'último disponible')
  console.log('🌐 Endpoint:', endpoint)
  console.log('⚙️ Base URL:', apiClient?.baseUrl || 'desconocido')
  console.log('🧭 Modo:', import.meta.env?.MODE)
  if (Object.keys(clientInfo).length > 0) {
    console.log('🖥️ Cliente:', clientInfo)
  }
  const errorSummary = {
    nombre: error?.name || 'Error',
    codigo: error?.code || 'UNKNOWN',
    mensaje: error?.message,
    pista: error?.hint,
    estado: error?.status,
  }
  console.table(errorSummary)
  if (error?.stack) {
    console.log(
      '📚 Stack (primeras líneas):',
      error.stack.split('\n').slice(0, 5).join('\n')
    )
  }
  console.groupEnd()
}

/**
 * Exchange Rate Service - Handles all exchange rate-related API operations
 * Based on PAYMENT_API.md documentation
 */
class ExchangeRateService {
  /**
   * Normaliza la estructura de un tipo de cambio recibido desde la API
   * @param {any} payload
   * @returns {import('../types/payment.js').ExchangeRateEnriched|null}
   */
  static normalizeExchangeRate(payload) {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const currencyData = payload.currency || {}
    const rateValueRaw =
      typeof payload.rate_to_base === 'number'
        ? payload.rate_to_base
        : Number.parseFloat(payload.rate_to_base)

    const normalizedDate = (() => {
      const dateCandidate =
        payload.date || payload.effective_date || payload.created_at

      if (!dateCandidate) {
        return null
      }

      if (typeof dateCandidate === 'string') {
        return dateCandidate.includes('T')
          ? dateCandidate.split('T')[0]
          : dateCandidate
      }

      return new Date(dateCandidate).toISOString().split('T')[0]
    })()

    const currencyId =
      payload.currency_id ?? currencyData.currency_id ?? currencyData.id ?? null

    const currencyCode =
      payload.currency_code ||
      currencyData.currency_code ||
      currencyData.code ||
      ''

    const currencyName =
      payload.currency_name ||
      currencyData.currency_name ||
      currencyData.name ||
      ''

    const createdAt =
      payload.created_at ||
      payload.inserted_at ||
      (normalizedDate ? `${normalizedDate}T00:00:00Z` : null)

    return {
      id: payload.id ?? null,
      currency_id: currencyId,
      currency_code: currencyCode,
      currency_name: currencyName,
      rate_to_base: Number.isFinite(rateValueRaw) ? rateValueRaw : null,
      date: normalizedDate,
      source: payload.source || payload.rate_source || '',
      created_at: createdAt,
      updated_at: payload.updated_at || payload.modified_at || null,
      // Guardamos la respuesta original para depuración si es necesario
      original: payload,
    }
  }

  /**
   * Normaliza una lista de tipos de cambio
   * @param {any} payload
   * @returns {import('../types/payment.js').ExchangeRateEnriched[]}
   */
  static normalizeExchangeRateList(payload) {
    if (!payload) {
      return []
    }

    if (Array.isArray(payload)) {
      return payload
        .map(item => this.normalizeExchangeRate(item))
        .filter(Boolean)
    }

    if (Array.isArray(payload.data)) {
      return payload.data
        .map(item => this.normalizeExchangeRate(item))
        .filter(Boolean)
    }

    return []
  }

  /**
   * Normaliza una respuesta paginada de tipos de cambio
   * @param {any} payload
   * @param {{ page?: number, page_size?: number }} fallback
   * @returns {import('../types/payment.js').ExchangeRateEnrichedPaginatedResponse}
   */
  static normalizePaginatedResponse(payload, fallback = {}) {
    const normalizedData = this.normalizeExchangeRateList(payload)

    const totalRecords =
      payload?.total ??
      (Array.isArray(payload?.data)
        ? payload.data.length
        : normalizedData.length)

    const pageSize =
      payload?.page_size ??
      fallback.page_size ??
      (normalizedData.length > 0 ? normalizedData.length : 0)

    const totalPages =
      payload?.total_pages ??
      (pageSize > 0 ? Math.ceil(totalRecords / pageSize) : 0)

    return {
      data: normalizedData,
      total: totalRecords,
      page: payload?.page ?? fallback.page ?? 1,
      page_size: pageSize,
      total_pages: totalPages,
    }
  }

  /**
   * Obtiene la lista de tipos de cambio más recientes para todas las monedas
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnriched[]>}
   */
  static async getLatestAll() {
    try {
      const response = await apiClient.makeRequest('/exchange-rate/latest')
      const payload = response.data || response
      return this.normalizeExchangeRateList(payload)
    } catch (error) {
      console.error('Error fetching latest exchange rates:', error)
      throw new Error('Error al obtener los tipos de cambio más recientes')
    }
  }

  /**
   * Obtiene todos los tipos de cambio, opcionalmente filtrando por moneda o fecha
   * @param {{ currency_id?: number, date?: string, start_date?: string, end_date?: string }} [query]
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnriched[]>}
   */
  static async getAll(query = {}) {
    try {
      const params = new URLSearchParams()

      if (query.currency_id && query.currency_id > 0) {
        params.append('currency_id', String(query.currency_id))
      }

      if (query.date && this.isValidDateFormat(query.date)) {
        params.append('date', query.date)
      }

      if (query.start_date && this.isValidDateFormat(query.start_date)) {
        params.append('start_date', query.start_date)
      }

      if (query.end_date && this.isValidDateFormat(query.end_date)) {
        params.append('end_date', query.end_date)
      }

      const endpoint = params.toString()
        ? `/exchange-rate?${params.toString()}`
        : '/exchange-rate'

      const response = await apiClient.makeRequest(endpoint)
      const payload = response.data || response

      return this.normalizeExchangeRateList(payload)
    } catch (error) {
      console.error('Error fetching exchange rates:', error)

      if (error.message && error.message.includes('no está disponible')) {
        throw new Error(
          'El sistema de tipos de cambio no está disponible. Los endpoints de Payment API no han sido implementados en el backend.'
        )
      }

      throw new Error('Error al obtener los tipos de cambio del servidor')
    }
  }

  /**
   * Obtiene tipos de cambio enriquecidos con paginación
   * @param {{ date?: string, page?: number, page_size?: number }} [query]
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnrichedPaginatedResponse>}
   */
  static async getEnriched(query = {}) {
    try {
      const params = new URLSearchParams()

      if (query.date) {
        if (!this.isValidDateFormat(query.date)) {
          throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')
        }
        params.append('date', query.date)
      }

      if (query.page && query.page > 0) {
        params.append('page', String(query.page))
      }

      if (query.page_size && query.page_size > 0) {
        params.append('page_size', String(query.page_size))
      }

      const endpoint = params.toString()
        ? `/exchange-rate/enriched?${params.toString()}`
        : '/exchange-rate/enriched'

      const response = await apiClient.makeRequest(endpoint)
      const payload = response.data || response

      if (Array.isArray(payload)) {
        const size = payload.length
        return this.normalizePaginatedResponse(payload, {
          page: query.page || 1,
          page_size: query.page_size || size || 1,
        })
      }

      return this.normalizePaginatedResponse(payload, {
        page: query.page,
        page_size: query.page_size,
      })
    } catch (error) {
      console.error('Error fetching enriched exchange rates:', error)
      throw new Error('Error al obtener los tipos de cambio enriquecidos')
    }
  }

  /**
   * Obtiene un tipo de cambio por ID
   * @param {number} id - Exchange rate ID
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnriched>}
   */
  static async getById(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de tipo de cambio inválido')
      }

      const response = await apiClient.makeRequest(`/exchange-rate/${id}`)
      const payload = response.data || response
      const normalized = this.normalizeExchangeRate(payload)

      if (!normalized) {
        throw new Error('Respuesta de tipo de cambio inválida')
      }

      return normalized
    } catch (error) {
      console.error(`Error fetching exchange rate ${id}:`, error)
      throw new Error('Error al obtener el tipo de cambio')
    }
  }

  /**
   * Obtiene el tipo de cambio de una moneda en una fecha específica
   * @param {import('../types/payment.js').ExchangeRateQuery} query - Query parameters
   * @returns {Promise<import('../types/payment.js').ExchangeRate>}
   */
  static async getByDate(query) {
    let requestEndpoint = ''

    try {
      if (!query || !query.currency_id || query.currency_id <= 0) {
        throw new Error('ID de moneda inválido')
      }

      if (unavailableCurrencyEndpoints.has(query.currency_id)) {
        throw new Error(
          'El sistema de tipos de cambio no está disponible. Los endpoints de Payment API no han sido implementados en el backend.'
        )
      }

      const params = new URLSearchParams()
      if (query.date) {
        // Validar formato de fecha YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
          throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')
        }
        params.append('date', query.date)
      }

      const url = `/exchange-rate/currency/${query.currency_id}`
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url
      requestEndpoint = fullUrl

      const response = await apiClient.makeRequest(fullUrl)
      const data = response.data || response

      let normalized
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data)
          normalized = this.normalizeExchangeRate(parsed)
        } catch (parseError) {
          console.warn(
            'Could not parse exchange rate response as JSON:',
            data,
            parseError
          )
          normalized = this.normalizeExchangeRate({
            currency_id: query.currency_id,
            rate_to_base: Number.parseFloat(data),
            date: query.date,
          })
        }
      } else {
        normalized = this.normalizeExchangeRate(data)
      }

      if (query?.currency_id) {
        unavailableCurrencyEndpoints.delete(query.currency_id)
        loggedExchangeRateFailures.delete(
          `${query.currency_id || 'unknown'}|${query.date || 'latest'}`
        )
      }

      return normalized
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      const endpoint = `/exchange-rate/currency/${query?.currency_id}`
      logExchangeRateFetchFailure({
        currencyId: query?.currency_id,
        date: query?.date,
        endpoint: error?.endpoint || requestEndpoint || endpoint,
        error,
      })

      // Mensaje específico para cuando el endpoint no existe
      if (error.message && error.message.includes('no está disponible')) {
        if (query?.currency_id) {
          unavailableCurrencyEndpoints.add(query.currency_id)
        }
        throw new Error(
          'El sistema de tipos de cambio no está disponible. Los endpoints de Payment API no han sido implementados en el backend.'
        )
      }

      throw new Error('Error al obtener el tipo de cambio del servidor')
    }
  }

  /**
   * Obtiene tipos de cambio de una moneda en un rango de fechas
   * @param {import('../types/payment.js').ExchangeRateRangeQuery} query - Range query parameters
   * @returns {Promise<import('../types/payment.js').ExchangeRate[]>}
   */
  static async getByRange(query) {
    try {
      if (!query || !query.currency_id || query.currency_id <= 0) {
        throw new Error('ID de moneda inválido')
      }

      if (!query.start_date || !query.end_date) {
        throw new Error('Fechas de inicio y fin son requeridas')
      }

      // Validar formato de fechas
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(query.start_date) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(query.end_date)
      ) {
        throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')
      }

      // Validar que start_date <= end_date
      if (new Date(query.start_date) > new Date(query.end_date)) {
        throw new Error(
          'La fecha de inicio debe ser anterior o igual a la fecha de fin'
        )
      }

      const params = new URLSearchParams({
        start_date: query.start_date,
        end_date: query.end_date,
      })

      const response = await apiClient.makeRequest(
        `/exchange-rate/currency/${
          query.currency_id
        }/range?${params.toString()}`
      )
      const data = response.data || response

      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data)
          return this.normalizeExchangeRateList(parsed)
        } catch (parseError) {
          console.warn(
            'Could not parse exchange rate range response as JSON:',
            data,
            parseError
          )
          return this.normalizeExchangeRateList([])
        }
      }

      return this.normalizeExchangeRateList(data)
    } catch (error) {
      console.error('Error fetching exchange rate range:', error)
      throw new Error('Error al obtener los tipos de cambio')
    }
  }

  /**
   * Crea un nuevo tipo de cambio
   * @param {{ currency_id: number, rate_to_base: number, date: string, source?: string }} data
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnriched>}
   */
  static async create(data) {
    let payload
    try {
      payload = this.preparePayload(data)
      const response = await apiClient.makeRequest('/exchange-rate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const normalized = this.normalizeExchangeRate(response?.data || response)
      if (!normalized) {
        throw new Error('Respuesta inválida al crear el tipo de cambio')
      }

      return normalized
    } catch (error) {
      console.error('Error creating exchange rate:', error)
      try {
        paymentApiDebug.record({
          service: 'ExchangeRateService',
          operation: 'create',
          endpoint: '/exchange-rate',
          method: 'POST',
          error,
          requestBody: payload,
          extra: {
            originalDate: data?.date,
            normalizedDate: payload?.date,
          },
        })
      } catch (logError) {
        console.warn(
          '[ExchangeRateService] No se pudo registrar el diagnóstico de creación:',
          logError
        )
      }
      throw new Error(error?.message || 'Error al crear el tipo de cambio')
    }
  }

  /**
   * Actualiza un tipo de cambio existente
   * @param {number} id - Exchange rate ID
   * @param {{ currency_id: number, rate_to_base: number, date: string, source?: string }} data
   * @returns {Promise<import('../types/payment.js').ExchangeRateEnriched>}
   */
  static async update(id, data) {
    let payload
    try {
      if (!id || id <= 0) {
        throw new Error('ID de tipo de cambio inválido')
      }

      payload = this.preparePayload(data)
      const response = await apiClient.makeRequest(`/exchange-rate/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      const normalized = this.normalizeExchangeRate(response?.data || response)
      if (!normalized) {
        throw new Error('Respuesta inválida al actualizar el tipo de cambio')
      }

      return normalized
    } catch (error) {
      console.error(`Error updating exchange rate ${id}:`, error)
      try {
        paymentApiDebug.record({
          service: 'ExchangeRateService',
          operation: 'update',
          endpoint: `/exchange-rate/${id}`,
          method: 'PUT',
          error,
          requestBody: payload,
          extra: {
            originalDate: data?.date,
            normalizedDate: payload?.date,
          },
        })
      } catch (logError) {
        console.warn(
          '[ExchangeRateService] No se pudo registrar el diagnóstico de actualización:',
          logError
        )
      }
      throw new Error(error?.message || 'Error al actualizar el tipo de cambio')
    }
  }

  /**
   * Elimina un tipo de cambio
   * @param {number} id - Exchange rate ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      if (!id || id <= 0) {
        throw new Error('ID de tipo de cambio inválido')
      }

      await apiClient.makeRequest(`/exchange-rate/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(`Error deleting exchange rate ${id}:`, error)
      throw new Error(error?.message || 'Error al eliminar el tipo de cambio')
    }
  }

  /**
   * Prepara y valida el payload para crear/actualizar tipos de cambio
   * @param {{ currency_id: number, rate_to_base: number|string, date: string, source?: string }} data
   * @returns {{ currency_id: number, rate_to_base: number, date: string, source?: string }}
   */
  static preparePayload(data = {}) {
    const currencyId = Number(data.currency_id)
    if (!currencyId || currencyId <= 0) {
      throw new Error('Debes seleccionar una moneda válida')
    }

    const rateValue = Number.parseFloat(
      typeof data.rate_to_base === 'string'
        ? data.rate_to_base.replace(',', '.')
        : data.rate_to_base
    )

    if (!Number.isFinite(rateValue) || rateValue <= 0) {
      throw new Error('La tasa debe ser un número mayor a 0')
    }

    const dateValue = (data.date || '').trim()
    if (!dateValue) {
      throw new Error('La fecha es obligatoria')
    }

    if (!this.isValidDateFormat(dateValue)) {
      throw new Error('La fecha debe tener el formato YYYY-MM-DD')
    }

    const isoDate = this.normalizeDateToIso(dateValue)

    return {
      currency_id: currencyId,
      rate_to_base: Number(rateValue.toFixed(6)),
      date: isoDate,
      source: data.source?.trim() || undefined,
    }
  }

  /**
   * Convierte una fecha YYYY-MM-DD a ISO 8601 (UTC) sin modificar fechas ya normalizadas
   * @param {string} dateValue
   * @returns {string}
   */
  static normalizeDateToIso(dateValue) {
    if (!dateValue) {
      return dateValue
    }

    const trimmed = dateValue.trim()
    if (trimmed.includes('T')) {
      return trimmed
    }

    try {
      const isoCandidate = new Date(`${trimmed}T00:00:00Z`).toISOString()
      return isoCandidate
    } catch (error) {
      console.warn(
        '[ExchangeRateService] No se pudo convertir la fecha a ISO, se envía formato plano.',
        { dateValue, error }
      )
      return `${trimmed}T00:00:00Z`
    }
  }

  /**
   * Obtiene el tipo de cambio más reciente de una moneda
   * @param {number} currencyId - Currency ID
   * @returns {Promise<import('../types/payment.js').ExchangeRate>}
   */
  static async getLatest(currencyId) {
    return this.getByDate({ currency_id: currencyId })
  }

  /**
   * Convierte un monto de una moneda a otra
   * @param {number} amount - Amount to convert
   * @param {number} fromCurrencyId - Source currency ID
   * @param {number} toCurrencyId - Target currency ID
   * @param {string} [date] - Optional date for historical conversion
   * @returns {Promise<number>}
   */
  static async convertCurrency(amount, fromCurrencyId, toCurrencyId, date) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Monto inválido')
      }

      if (
        !fromCurrencyId ||
        !toCurrencyId ||
        fromCurrencyId <= 0 ||
        toCurrencyId <= 0
      ) {
        throw new Error('IDs de moneda inválidos')
      }

      // Si es la misma moneda, no hay conversión
      if (fromCurrencyId === toCurrencyId) {
        return amount
      }

      // Obtener tipos de cambio para ambas monedas
      const fromRate = await this.getByDate({
        currency_id: fromCurrencyId,
        date,
      })
      const toRate = await this.getByDate({ currency_id: toCurrencyId, date })

      // Validar que las tasas tienen el formato correcto
      if (!fromRate || typeof fromRate.rate_to_base !== 'number') {
        throw new Error(
          `Tipo de cambio inválido para moneda origen (ID: ${fromCurrencyId})`
        )
      }

      if (!toRate || typeof toRate.rate_to_base !== 'number') {
        throw new Error(
          `Tipo de cambio inválido para moneda destino (ID: ${toCurrencyId})`
        )
      }

      // Convertir a moneda base y luego a moneda objetivo
      const amountInBase = amount * fromRate.rate_to_base
      const convertedAmount = amountInBase / toRate.rate_to_base

      return parseFloat(convertedAmount.toFixed(2))
    } catch (error) {
      console.error('Error converting currency:', error)
      throw new Error('Error al convertir moneda')
    }
  }

  /**
   * Convierte un monto con información detallada del resultado
   * @param {number} amount - Amount to convert
   * @param {number} fromCurrencyId - Source currency ID
   * @param {number} toCurrencyId - Target currency ID
   * @param {string} [date] - Optional date for historical conversion
   * @returns {Promise<import('../types/payment.js').CurrencyConversionResult>}
   */
  static async convertCurrencyDetailed(
    amount,
    fromCurrencyId,
    toCurrencyId,
    date
  ) {
    try {
      const convertedAmount = await this.convertCurrency(
        amount,
        fromCurrencyId,
        toCurrencyId,
        date
      )

      // Obtener información adicional para el resultado detallado
      const [fromRate, toRate] = await Promise.all([
        this.getByDate({ currency_id: fromCurrencyId, date }),
        this.getByDate({ currency_id: toCurrencyId, date }),
      ])

      return {
        originalAmount: amount,
        convertedAmount,
        fromRate,
        toRate,
        conversionDate: date || new Date().toISOString().split('T')[0],
      }
    } catch (error) {
      console.error('Error in detailed currency conversion:', error)
      throw error
    }
  }

  /**
   * Valida si existe un tipo de cambio para una moneda en una fecha
   * @param {number} currencyId - Currency ID
   * @param {string} [date] - Optional date to check
   * @returns {Promise<import('../types/payment.js').ExchangeRateValidation>}
   */
  static async validateExchangeRate(currencyId, date) {
    try {
      const exchangeRate = await this.getByDate({
        currency_id: currencyId,
        date,
      })

      if (!exchangeRate) {
        return {
          hasRate: false,
          isRecent: false,
          warning: 'No se encontró tipo de cambio para esta moneda',
        }
      }

      // Verificar si el tipo de cambio es reciente (menos de 24 horas)
      const rateDate = exchangeRate.date ? new Date(exchangeRate.date) : null
      const now = new Date()
      const diffHours = rateDate
        ? Math.abs(now - rateDate) / (1000 * 60 * 60)
        : Number.POSITIVE_INFINITY
      const isRecent = Number.isFinite(diffHours) && diffHours <= 24

      return {
        hasRate: true,
        isRecent,
        warning: !isRecent
          ? 'El tipo de cambio no es reciente (más de 24 horas)'
          : undefined,
      }
    } catch {
      return {
        hasRate: false,
        isRecent: false,
        warning: 'Error al validar tipo de cambio',
      }
    }
  }

  /**
   * Obtiene el histórico de tipos de cambio para múltiples monedas
   * @param {number[]} currencyIds - Array of currency IDs
   * @param {string} startDate - Start date YYYY-MM-DD
   * @param {string} endDate - End date YYYY-MM-DD
   * @returns {Promise<{[currencyId: number]: import('../types/payment.js').ExchangeRate[]}>}
   */
  static async getMultipleCurrencyRates(currencyIds, startDate, endDate) {
    try {
      if (!Array.isArray(currencyIds) || currencyIds.length === 0) {
        throw new Error('Se requiere al menos un ID de moneda')
      }

      const results = {}

      // Obtener tipos de cambio para cada moneda en paralelo
      const promises = currencyIds.map(async currencyId => {
        try {
          const rates = await this.getByRange({
            currency_id: currencyId,
            start_date: startDate,
            end_date: endDate,
          })
          results[currencyId] = rates
        } catch (error) {
          console.error(
            `Error fetching rates for currency ${currencyId}:`,
            error
          )
          results[currencyId] = []
        }
      })

      await Promise.all(promises)
      return results
    } catch (error) {
      console.error('Error fetching multiple currency rates:', error)
      throw error
    }
  }

  /**
   * Formatea un tipo de cambio para mostrar
   * @param {number} rate - Exchange rate value
   * @param {string} [currencyCode] - Currency code for context
   * @returns {string}
   */
  static formatExchangeRate(rate, currencyCode = '') {
    if (!rate || typeof rate !== 'number') {
      return '0.00'
    }

    const formatted = new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(rate)

    return currencyCode ? `${formatted} (${currencyCode}/PYG)` : formatted
  }

  /**
   * Calcula la diferencia porcentual entre dos tipos de cambio
   * @param {number} oldRate - Previous rate
   * @param {number} newRate - Current rate
   * @returns {number} Percentage change
   */
  static calculateRateChange(oldRate, newRate) {
    if (!oldRate || !newRate || oldRate <= 0) {
      return 0
    }

    return parseFloat((((newRate - oldRate) / oldRate) * 100).toFixed(2))
  }

  /**
   * Obtiene la fecha actual en formato YYYY-MM-DD
   * @returns {string}
   */
  static getCurrentDate() {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Valida formato de fecha YYYY-MM-DD
   * @param {string} date - Date string to validate
   * @returns {boolean}
   */
  static isValidDateFormat(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  }
}

export { ExchangeRateService }
