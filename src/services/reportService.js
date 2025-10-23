import BusinessManagementAPI from './BusinessManagementAPI'
import telemetryService from './telemetryService'

const apiClient = new BusinessManagementAPI()
const DAY_IN_MS = 24 * 60 * 60 * 1000
const isDevelopment = process.env.NODE_ENV !== 'production'

const parseIsoDate = value => {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const differenceInDaysInclusive = (startDate, endDate) => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)

  if (!start || !end) {
    return 1
  }

  const diff = Math.round((end - start) / DAY_IN_MS)
  return Math.max(1, diff + 1)
}

const roundToTwo = value => {
  const number = Number(value) || 0
  return Math.round(number * 100) / 100
}

const normalizeTotals = (rawData, type) => {
  if (!rawData) {
    return null
  }

  const salesNumericFields = [
    'total_payments',
    'total_amount',
    'completed_payments',
    'completed_amount',
    'refunded_payments',
    'refunded_amount',
    'average_payment',
    'total_change_given',
    'payments_with_change',
  ]

  const purchaseNumericFields = [
    'total_payments',
    'total_amount',
    'completed_payments',
    'completed_amount',
    'cancelled_payments',
    'cancelled_amount',
    'average_payment',
    'unique_purchases',
  ]

  const numericFields =
    type === 'sales' ? salesNumericFields : purchaseNumericFields
  const normalized = { ...rawData }

  numericFields.forEach(field => {
    if (normalized[field] == null) {
      normalized[field] = 0
      return
    }

    const numericValue = Number(normalized[field])
    normalized[field] = Number.isNaN(numericValue)
      ? 0
      : roundToTwo(numericValue)
  })

  return normalized
}

const createMockSalesTotals = range => {
  const { start_date: startDate, end_date: endDate } = range
  const days = differenceInDaysInclusive(startDate, endDate)

  const paymentsPerDay = 6.1
  const completedRatio = 0.96
  const averageCompleted = 295000
  const refundRatio = 1 - completedRatio
  const averageRefund = 115000
  const changeRate = 0.58
  const averageChange = 1800

  const totalPayments = Math.max(1, Math.round(paymentsPerDay * days))
  const completedPayments = Math.max(
    0,
    Math.round(totalPayments * completedRatio)
  )
  const refundedPayments = Math.max(0, totalPayments - completedPayments)
  const completedAmount = roundToTwo(completedPayments * averageCompleted)
  const refundedAmount = roundToTwo(refundedPayments * averageRefund)
  const totalAmount = roundToTwo(completedAmount + refundedAmount)
  const averagePayment =
    completedPayments > 0 ? roundToTwo(completedAmount / completedPayments) : 0
  const paymentsWithChange = Math.max(
    0,
    Math.round(completedPayments * changeRate)
  )
  const totalChangeGiven = roundToTwo(paymentsWithChange * averageChange)

  return {
    start_date: startDate,
    end_date: endDate,
    total_payments: totalPayments,
    total_amount: totalAmount,
    completed_payments: completedPayments,
    completed_amount: completedAmount,
    refunded_payments: refundedPayments,
    refunded_amount: refundedAmount,
    average_payment: averagePayment,
    total_change_given: totalChangeGiven,
    payments_with_change: paymentsWithChange,
  }
}

const createMockPurchaseTotals = range => {
  const { start_date: startDate, end_date: endDate } = range
  const days = differenceInDaysInclusive(startDate, endDate)

  const paymentsPerDay = 2.3
  const completedRatio = 0.94
  const averageCompleted = 265000
  const cancelledRatio = 1 - completedRatio
  const averageCancelled = 95000

  const totalPayments = Math.max(1, Math.round(paymentsPerDay * days))
  const completedPayments = Math.max(
    0,
    Math.round(totalPayments * completedRatio)
  )
  const cancelledPayments = Math.max(0, totalPayments - completedPayments)
  const completedAmount = roundToTwo(completedPayments * averageCompleted)
  const cancelledAmount = roundToTwo(cancelledPayments * averageCancelled)
  const totalAmount = roundToTwo(completedAmount + cancelledAmount)
  const averagePayment =
    completedPayments > 0 ? roundToTwo(completedAmount / completedPayments) : 0
  const uniquePurchases = Math.max(1, Math.round(completedPayments * 0.82))

  return {
    start_date: startDate,
    end_date: endDate,
    total_payments: totalPayments,
    total_amount: totalAmount,
    completed_payments: completedPayments,
    completed_amount: completedAmount,
    cancelled_payments: cancelledPayments,
    cancelled_amount: cancelledAmount,
    average_payment: averagePayment,
    unique_purchases: uniquePurchases,
  }
}

const ensureRange = range => {
  if (!range || !range.start_date || !range.end_date) {
    throw new Error(
      'start_date y end_date son requeridos para obtener los totales de pagos'
    )
  }

  return range
}

const buildQueryString = params => new URLSearchParams(params).toString()

const fetchWithFallback = async (endpoint, range, type, fallbackFactory) => {
  const safeRange = ensureRange(range)
  const queryString = buildQueryString(safeRange)
  const startedAt = performance?.now?.() ?? Date.now()

  // DEBUG LOG: Request para reportes
  console.group('🔍 [DEBUG] Reports API Request')
  console.log('Endpoint:', endpoint)
  console.log('Full URL:', `${endpoint}?${queryString}`)
  console.log('Range:', JSON.stringify(safeRange, null, 2))
  console.log('Type:', type)
  console.log('Timestamp:', new Date().toISOString())
  console.groupEnd()

  try {
    const response = await apiClient.get(`${endpoint}?${queryString}`)
    const duration = (performance?.now?.() ?? Date.now()) - startedAt

    // DEBUG LOG: Respuesta exitosa
    console.group('✅ [DEBUG] Reports API Response - Success')
    console.log('Response:', JSON.stringify(response, null, 2))
    console.log('Duration:', duration.toFixed(2), 'ms')
    console.log('Type:', type)
    console.groupEnd()

    telemetryService.recordMetric('report_totals_fetch_ms', duration, {
      endpoint,
      type,
      status: 'success',
    })

    const normalized = normalizeTotals({ ...safeRange, ...response }, type)
    return normalized
  } catch (error) {
    const duration = (performance?.now?.() ?? Date.now()) - startedAt

    // DEBUG LOG: Error detallado
    console.group('❌ [DEBUG] Reports API Response - Error')
    console.log('Endpoint:', endpoint)
    console.log('Full URL:', `${endpoint}?${queryString}`)
    console.log('Error Message:', error?.message)
    console.log('Error Type:', error?.constructor?.name)
    console.log('Error Status:', error?.status || 'N/A')
    console.log('Error Code:', error?.code || 'N/A')
    console.log('Error Response:', JSON.stringify(error?.response || error?.data || {}, null, 2))
    console.log('Request Range:', JSON.stringify(safeRange, null, 2))
    console.log('Duration:', duration.toFixed(2), 'ms')
    console.log('Full Error Object:', error)
    console.log('Will use fallback?', isDevelopment)
    console.groupEnd()

    telemetryService.recordMetric('report_totals_fetch_ms', duration, {
      endpoint,
      type,
      status: 'error',
    })
    telemetryService.recordEvent('report_totals_fetch_error', {
      endpoint,
      type,
      message: error?.message,
      code: error?.code,
    })

    if (isDevelopment) {
      console.warn(
        `Fallo la consulta a ${endpoint}, se usaran datos simulados`,
        error
      )
      const fallbackData = fallbackFactory(safeRange)
      const normalizedFallback = normalizeTotals(
        { ...fallbackData, _isFallback: true },
        type
      )
      return normalizedFallback
    }

    throw error
  }
}

export const getSalesPaymentTotals = range =>
  fetchWithFallback(
    '/payment/totals/sales',
    range,
    'sales',
    createMockSalesTotals
  )

export const getPurchasePaymentTotals = range =>
  fetchWithFallback(
    '/payment/totals/purchases',
    range,
    'purchases',
    createMockPurchaseTotals
  )

const reportService = {
  getSalesPaymentTotals,
  getPurchasePaymentTotals,
}

export default reportService
