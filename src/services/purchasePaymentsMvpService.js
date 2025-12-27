import purchaseService from '@/services/purchaseService'
import { purchasePaymentService } from '@/services/purchasePaymentService'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_FETCH_LIMIT = 200
const DEFAULT_CURRENCY = 'PYG'
const PRIORITY_FALLBACK = 'medium'

const CURRENCY_ID_MAP = {
  1: 'PYG',
}

const isCurrencyCode = value => /^[A-Z]{3}$/.test(value)

const normalizeCurrencyCode = raw => {
  if (!raw && raw !== 0) {
    return DEFAULT_CURRENCY
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return CURRENCY_ID_MAP[raw] || DEFAULT_CURRENCY
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) {
      return DEFAULT_CURRENCY
    }

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      if (Number.isFinite(numeric)) {
        return CURRENCY_ID_MAP[numeric] || DEFAULT_CURRENCY
      }
    }

    const upper = trimmed.toUpperCase()
    if (isCurrencyCode(upper)) {
      return upper
    }

    return DEFAULT_CURRENCY
  }

  if (typeof raw === 'object') {
    const nestedCandidate =
      raw?.currency ||
      raw?.currency_code ||
      raw?.currencyCode ||
      raw?.code ||
      raw?.id

    if (nestedCandidate !== undefined) {
      return normalizeCurrencyCode(nestedCandidate)
    }
  }

  return DEFAULT_CURRENCY
}

const resolveCurrencyValue = source => {
  if (source == null || typeof source !== 'object') {
    return source
  }

  const candidates = [
    source.currency,
    source.currency_code,
    source.currencyCode,
    source.currency_id,
    source.currencyId,
    source.currency_type,
    source.currency?.code,
    source.currency?.currency_code,
    source.currency?.currencyCode,
    source.currency?.id,
    source.currency?.currency_id,
  ]

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) {
      return candidate
    }
  }

  return null
}

const STATUS_MAP = {
  paid: 'completed',
  complete: 'completed',
  completed: 'completed',
  finished: 'completed',
  processed: 'completed',
  partial: 'partial',
  partial_payment: 'partial',
  partialpaid: 'partial',
  pending: 'pending',
  processing: 'pending',
  in_progress: 'pending',
  created: 'pending',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  voided: 'cancelled',
  overdue: 'overdue',
}

const toNumber = value => {
  const numeric = Number.parseFloat(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const roundCurrency = value => {
  const numeric = toNumber(value)
  return Math.round(numeric * 100) / 100
}

const ensureDate = value => {
  if (!value) return null

  // Si es solo fecha (YYYY-MM-DD), agregar T00:00:00 para interpretarla como hora local
  // new Date("2025-12-27") se interpreta como UTC, causando problemas de zona horaria
  // new Date("2025-12-27T00:00:00") se interpreta como hora local
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
  const normalizedValue =
    typeof value === 'string' && dateOnlyPattern.test(value)
      ? `${value}T00:00:00`
      : value

  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value}T00:00:00`)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  return date
}

const toStartOfDay = value => {
  const date = ensureDate(value)
  if (!date) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const toEndOfDay = value => {
  const date = ensureDate(value)
  if (!date) return null
  date.setHours(23, 59, 59, 999)
  return date
}

const buildSupplierAddress = rawAddress => {
  if (!rawAddress) return null
  if (typeof rawAddress === 'string') {
    return {
      street: rawAddress,
      city: null,
      country: null,
    }
  }

  return {
    street:
      rawAddress.street ||
      rawAddress.address ||
      rawAddress.line1 ||
      rawAddress.address_line ||
      null,
    city: rawAddress.city || rawAddress.municipality || null,
    country: rawAddress.country || rawAddress.country_name || null,
  }
}

const buildSupplier = base => {
  const contact =
    base.supplier_contact ??
    base.supplier?.contact ??
    base.supplier?.phone ??
    base.supplier?.email ??
    null

  return {
    id: base.supplier_id ?? base.supplier?.id ?? null,
    name:
      base.supplier_name ??
      base.supplier?.company_name ??
      base.supplier?.name ??
      '',
    contact,
    email: base.supplier_email ?? base.supplier?.email ?? null,
    phone: base.supplier_phone ?? base.supplier?.phone ?? null,
    address: buildSupplierAddress(
      base.supplier_address ?? base.supplier?.address
    ),
    taxId:
      base.supplier_tax_id ??
      base.supplier?.tax_id ??
      base.supplier?.ruc ??
      null,
    priority: base.supplier_priority ?? base.priority ?? PRIORITY_FALLBACK,
  }
}

const normalizeItems = items => {
  if (!Array.isArray(items)) return []

  return items.map(item => {
    const quantity = toNumber(item.quantity ?? item.qty)
    const unitPrice = toNumber(item.unit_price ?? item.unitPrice ?? item.cost)
    const total =
      item.total_price ?? item.total ?? roundCurrency(quantity * unitPrice)

    return {
      id: item.id ?? item.detail_id ?? item.item_id ?? item.product_id,
      productId: item.product_id ?? item.productId ?? item.id ?? null,
      name: item.product_name ?? item.name ?? 'Producto',
      quantity,
      unitPrice: roundCurrency(unitPrice),
      total: roundCurrency(total),
      expDate: item.exp_date ?? item.expiry_date ?? null,
    }
  })
}

const normalizePayment = (payment, currency) => {
  if (!payment) return null

  const amount =
    payment.amount ??
    payment.amount_paid ??
    payment.amountPaid ??
    payment.payment_amount ??
    0

  const timestamp =
    payment.registered_at ??
    payment.payment_date ??
    payment.date ??
    payment.created_at ??
    payment.createdAt ??
    payment.timestamp ??
    null

  const recordedBy =
    payment.recorded_by ??
    payment.user ??
    payment.user_name ??
    payment.userName ??
    payment.actor ??
    payment.cashier ??
    payment.cashier_name ??
    payment.created_by ??
    null

  const reference =
    payment.reference ??
    payment.reference_number ??
    payment.referenceNumber ??
    payment.check_number ??
    payment.checkNumber ??
    payment.payment_reference ??
    payment.paymentReference ??
    payment.document ??
    payment.document_number ??
    payment.documentNumber ??
    null

  const cashRegisterId =
    payment.cash_register_id ??
    payment.cashRegisterId ??
    payment.cash_register?.id ??
    payment.cashRegister?.id ??
    null

  const cashRegisterName =
    payment.cash_register_name ??
    payment.cashRegisterName ??
    payment.cash_register?.name ??
    payment.cashRegister?.name ??
    null

  return {
    id:
      payment.id ??
      payment.payment_id ??
      payment.paymentId ??
      payment.detail_id ??
      null,
    amount: roundCurrency(amount),
    currency: normalizeCurrencyCode(
      resolveCurrencyValue(payment) ?? currency ?? DEFAULT_CURRENCY
    ),
    status: formatStatus(
      payment.status ??
        payment.payment_status ??
        payment.state ??
        payment.result ??
        'completed'
    ),
    registered_at: timestamp,
    recorded_by: recordedBy,
    reference,
    notes: payment.notes ?? payment.description ?? payment.details ?? null,
    cash_register_id: cashRegisterId,
    cash_register_name: cashRegisterName,
    cash_register:
      cashRegisterId || cashRegisterName
        ? {
            id: cashRegisterId,
            name: cashRegisterName,
          }
        : null,
    raw: payment,
  }
}

const normalizePayments = (payments, currency) => {
  if (!Array.isArray(payments)) return []
  return payments
    .map(payment => normalizePayment(payment, currency))
    .filter(Boolean)
}

const normalizeHistoryEntry = (entry, index = 0) => {
  if (!entry) return null

  const timestamp =
    entry.timestamp ??
    entry.recorded_at ??
    entry.created_at ??
    entry.updated_at ??
    entry.date ??
    entry.occurred_at ??
    entry.event_date ??
    null

  const action =
    entry.action ??
    entry.event ??
    entry.type ??
    entry.status ??
    entry.label ??
    'update'

  const actor =
    entry.actor ??
    entry.user ??
    entry.user_name ??
    entry.userName ??
    entry.performed_by ??
    entry.author ??
    null

  const notes =
    entry.notes ??
    entry.description ??
    entry.details ??
    entry.message ??
    entry.comment ??
    ''

  return {
    id:
      entry.id ??
      entry.entry_id ??
      entry.history_id ??
      `${action}-${timestamp || index}`,
    timestamp,
    action,
    actor,
    notes,
  }
}

const normalizeHistory = (raw, base, normalizedPayments = []) => {
  const candidates = [
    raw?.history,
    raw?.timeline,
    raw?.events,
    raw?.activity,
    raw?.activity_log,
    raw?.logs,
    base?.history,
    base?.timeline,
    base?.events,
    base?.activity,
    base?.activity_log,
    base?.status_history,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate
        .map((entry, index) => normalizeHistoryEntry(entry, index))
        .filter(Boolean)
    }
  }

  if (normalizedPayments.length) {
    return normalizedPayments
      .map((payment, index) =>
        normalizeHistoryEntry(
          {
            id: payment.id ? `payment-${payment.id}` : null,
            timestamp: payment.registered_at,
            action: payment.status || 'payment',
            actor: payment.recorded_by,
            notes:
              payment.notes ||
              payment.reference ||
              `Pago registrado${
                payment.recorded_by ? ` por ${payment.recorded_by}` : ''
              }.`,
          },
          index
        )
      )
      .filter(Boolean)
  }

  return []
}

const computePaymentProgress = (paid, total) => {
  const safeTotal = toNumber(total)
  if (safeTotal <= 0) return 0
  const safePaid = toNumber(paid)
  return Math.min(100, Math.max(0, Math.round((safePaid / safeTotal) * 100)))
}

const formatStatus = status => {
  if (!status) return 'pending'
  const normalized = status.toString().trim().toLowerCase()
  return STATUS_MAP[normalized] || normalized || 'pending'
}

const normalizeOrder = raw => {
  if (!raw) return null

  const base = raw.purchase ?? raw
  const orderId = Number(
    base.purchase_order_id ?? base.order_id ?? base.id ?? raw.id
  )
  if (!Number.isFinite(orderId)) {
    return null
  }

  const currency = normalizeCurrencyCode(
    resolveCurrencyValue(base) ?? DEFAULT_CURRENCY
  )
  const totalAmount = roundCurrency(base.total_amount ?? base.total ?? 0)

  // Detect payment summary object (usually in raw.payments or base.payments if not an array)
  const paymentSummary =
    (raw.payments && !Array.isArray(raw.payments) ? raw.payments : null) ||
    (base.payments && !Array.isArray(base.payments) ? base.payments : null)

  let totalPaid
  let outstanding
  let rawStatus = base.status ?? base.payment_status ?? 'pending'

  if (paymentSummary) {
    totalPaid = roundCurrency(
      paymentSummary.total_paid ?? paymentSummary.totalPaid ?? 0
    )
    outstanding = roundCurrency(
      paymentSummary.outstanding_amount ??
        paymentSummary.outstandingAmount ??
        paymentSummary.remaining_amount ??
        0
    )
    if (paymentSummary.payment_status) {
      rawStatus = paymentSummary.payment_status
    }
  } else {
    totalPaid = roundCurrency(base.amount_paid ?? base.totalPaid ?? 0)
    outstanding = roundCurrency(
      base.remaining_amount ??
        base.pending_amount ??
        base.pendingAmount ??
        totalAmount - totalPaid
    )
  }

  const supplier = buildSupplier(base)
  if (!supplier.name) {
    supplier.name = supplier.id ? `Proveedor ${supplier.id}` : 'Proveedor'
  }

  const payments = normalizePayments(base.payments, currency)
  const lastPaymentAt = (() => {
    if (base.last_payment_at || base.lastPaymentAt) {
      return base.last_payment_at ?? base.lastPaymentAt
    }

    if (!payments.length) {
      return null
    }

    return payments.reduce((latest, payment) => {
      if (!payment.registered_at) {
        return latest
      }
      const currentTs = new Date(payment.registered_at).getTime()
      if (!Number.isFinite(currentTs)) {
        return latest
      }
      if (!latest) {
        return payment.registered_at
      }
      const latestTs = new Date(latest).getTime()
      if (!Number.isFinite(latestTs) || currentTs > latestTs) {
        return payment.registered_at
      }
      return latest
    }, null)
  })()

  const history = normalizeHistory(raw, base, payments)

  return {
    id: orderId,
    supplier,
    issue_date:
      base.order_date ??
      base.issue_date ??
      base.created_at ??
      base.createdAt ??
      null,
    expected_delivery:
      base.expected_delivery ?? base.expected_delivery_date ?? null,
    total_amount: totalAmount,
    totalPaid,
    pendingAmount: Math.max(0, outstanding),
    currency,
    status: formatStatus(rawStatus),
    priority: supplier.priority || PRIORITY_FALLBACK,
    notes: base.notes ?? '',
    payments,
    items: normalizeItems(raw.details ?? base.details ?? base.products),
    history,
    lastPaymentAt,
    createdAt: base.created_at ?? base.createdAt ?? null,
    updatedAt: base.updated_at ?? base.updatedAt ?? null,
    paymentProgressPercent: computePaymentProgress(totalPaid, totalAmount),
    paymentProgressRatio: Math.min(
      1,
      computePaymentProgress(totalPaid, totalAmount) / 100
    ),
    isOverdue:
      outstanding > 0 &&
      (() => {
        const dueDate = ensureDate(
          base.expected_delivery ?? base.expected_delivery_date
        )
        if (!dueDate) return false
        return dueDate.getTime() < Date.now()
      })(),
  }
}

const matchesSearch = (order, term) => {
  if (!term || !term.trim()) return true
  const normalized = term.trim().toLowerCase()
  const haystack = [
    String(order.id ?? ''),
    order.supplier?.name ?? '',
    order.supplier?.contact ?? '',
    order.supplier?.email ?? '',
    order.notes ?? '',
  ]
  return haystack.some(entry => entry.toLowerCase().includes(normalized))
}

const matchesOrderId = (order, orderId) => {
  if (!orderId || !orderId.trim()) return true
  const normalized = orderId.trim()
  return String(order.id ?? '').includes(normalized)
}

const matchesStatus = (order, status) => {
  if (!status || status === 'all') return true
  return (order.status ?? '').toLowerCase() === status.toLowerCase()
}

const matchesDateRange = (order, from, to) => {
  if (!from && !to) return true
  const issueDate = ensureDate(order.issue_date)
  if (!issueDate) return false
  if (from) {
    const start = toStartOfDay(from)
    if (start && issueDate < start) return false
  }
  if (to) {
    const end = toEndOfDay(to)
    if (end && issueDate > end) return false
  }
  return true
}

const filterOrders = (orders, filters) =>
  orders.filter(order => {
    if (!matchesOrderId(order, filters.orderId)) return false
    if (!matchesStatus(order, filters.status)) return false
    if (!matchesSearch(order, filters.search)) return false
    if (!matchesDateRange(order, filters.dateFrom, filters.dateTo)) return false
    return true
  })

const sortOrders = orders =>
  [...orders].sort((a, b) => {
    const aTime = ensureDate(a.issue_date)?.getTime() ?? 0
    const bTime = ensureDate(b.issue_date)?.getTime() ?? 0
    if (aTime === bTime) {
      return (b.id ?? 0) - (a.id ?? 0)
    }
    return bTime - aTime
  })

const paginate = (items, page, pageSize) => {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize
  const end = start + pageSize

  return {
    data: items.slice(start, end),
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrevious: safePage > 1,
    },
  }
}

const buildStatusOptions = orders => {
  const unique = Array.from(
    new Set(
      orders
        .map(order => order.status)
        .filter(status => typeof status === 'string' && status.length)
    )
  )

  return unique.map(value => ({ value }))
}

const SUPPLIER_NAME_PATTERN = /^[\p{L}\s.'-]+$/u
const SUPPLIER_ID_PATTERN = /^\d+$/

export const classifySupplierSearchTerm = rawTerm => {
  if (rawTerm === null || rawTerm === undefined) {
    return { type: 'empty' }
  }

  const value = String(rawTerm).trim()
  if (!value) {
    return { type: 'empty' }
  }

  const hasLetters = /\p{L}/u.test(value)
  const hasDigits = /\d/.test(value)

  // No se permite mezclar números y letras
  if (hasLetters && hasDigits) {
    return {
      type: 'invalid',
      reason: 'mixed-content',
      message:
        'No se puede mezclar ID (números) con nombre (letras). Usá solo uno.',
    }
  }

  // Solo dígitos = ID de proveedor
  if (hasDigits && !hasLetters) {
    if (SUPPLIER_ID_PATTERN.test(value)) {
      const supplierId = Number.parseInt(value, 10)
      if (supplierId > 0) {
        return { type: 'supplier-id', value: String(supplierId) }
      }
      return {
        type: 'invalid',
        reason: 'invalid-id',
        message: 'El ID debe ser un número positivo mayor a 0.',
      }
    }
    return {
      type: 'invalid',
      reason: 'invalid-id',
      message: 'El ID solo puede contener números.',
    }
  }

  // Solo letras = nombre de proveedor
  if (hasLetters && !hasDigits) {
    if (SUPPLIER_NAME_PATTERN.test(value)) {
      return { type: 'supplier-name', value }
    }
    return {
      type: 'invalid',
      reason: 'invalid-name',
      message:
        'El nombre solo puede contener letras, espacios, puntos, apóstrofes y guiones.',
    }
  }

  return {
    type: 'invalid',
    reason: 'unsupported',
    message:
      'Formato no reconocido. Ingresá un ID (números) o un nombre (letras).',
  }
}

export const fetchPurchasesBySupplierTerm = async (term, options = {}) => {
  const classification = classifySupplierSearchTerm(term)

  if (classification.type === 'supplier-id') {
    const supplierId = Number.parseInt(classification.value, 10)
    if (!Number.isFinite(supplierId) || supplierId <= 0) {
      const error = new Error('ID de proveedor inválido')
      error.code = 'INVALID_SUPPLIER_ID'
      throw error
    }

    return purchaseService.getPurchasesBySupplier(supplierId, options)
  }

  if (classification.type === 'supplier-name') {
    return purchaseService.getPurchasesBySupplierName(
      classification.value,
      options
    )
  }

  const error = new Error(
    classification.message || 'Término de búsqueda inválido'
  )
  error.code = 'INVALID_SUPPLIER_TERM'
  error.details = classification
  throw error
}

const fetchOrdersFromApi = async filters => {
  const { search, dateFrom, dateTo } = filters
  const commonOptions = { showInactiveSuppliers: true }

  try {
    if (dateFrom || dateTo) {
      const start = dateFrom || dateTo
      const end = dateTo || dateFrom

      // WORKAROUND: Agregar 1 día al endDate para asegurar inclusividad del último día
      // La API trata end_date como exclusivo, por lo que sin este ajuste
      // las compras del último día del rango no se incluyen
      const adjustedEndDate = new Date(end)
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1)
      const endDateAdjusted = adjustedEndDate.toISOString().split('T')[0]

      const response = await purchaseService.getPurchasesByDateRange(
        start,
        endDateAdjusted,
        1,
        DEFAULT_FETCH_LIMIT,
        commonOptions
      )

      if (!response?.success) {
        throw new Error(
          response?.error || 'Unable to load purchase orders by date'
        )
      }

      return response.data || []
    }

    if (search && search.trim()) {
      const response = await fetchPurchasesBySupplierTerm(search, commonOptions)

      if (!response?.success) {
        throw new Error(
          response?.error || 'Unable to load supplier purchase orders'
        )
      }

      return response.data || []
    }

    const response = await purchaseService.getRecentPurchases(
      60,
      1,
      DEFAULT_FETCH_LIMIT,
      commonOptions
    )

    if (!response?.success) {
      throw new Error(
        response?.error || 'Unable to load recent purchase orders'
      )
    }

    return response.data || []
  } catch (error) {
    throw new Error(error?.message || 'Unable to load purchase orders')
  }
}

const normalizeOrders = rawOrders =>
  rawOrders.map(item => normalizeOrder(item)).filter(order => Boolean(order))

export const purchasePaymentsMvpService = {
  async fetchOrders(params = {}) {
    const page = Number(params.page) || 1
    const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE
    const filters = {
      search: params.search ?? '',
      orderId: params.orderId ?? '',
      status: params.status ?? 'all',
      dateFrom: params.dateFrom ?? '',
      dateTo: params.dateTo ?? '',
    }

    const rawOrders = await fetchOrdersFromApi(filters)
    const normalizedOrders = sortOrders(normalizeOrders(rawOrders))

    // Verificar si estamos buscando por proveedor (ID o nombre)
    // En ese caso, el API ya filtró por proveedor, no necesitamos filtrar nuevamente
    const searchClassification = classifySupplierSearchTerm(filters.search)
    const apiAlreadyFilteredBySupplier =
      searchClassification.type === 'supplier-id' ||
      searchClassification.type === 'supplier-name'

    // Verificar si la API ya filtró por fecha
    const apiAlreadyFilteredByDate = Boolean(filters.dateFrom || filters.dateTo)

    // Crear filtros para el cliente, excluyendo filtros ya aplicados por la API
    const clientFilters = {
      ...filters,
      // Remover el filtro de búsqueda si el API ya filtró por proveedor
      search: apiAlreadyFilteredBySupplier ? '' : filters.search,
      // Remover el filtro de fechas si el API ya filtró por fecha
      // (la API ya aplicó el ajuste de +1 día para inclusividad)
      dateFrom: apiAlreadyFilteredByDate ? '' : filters.dateFrom,
      dateTo: apiAlreadyFilteredByDate ? '' : filters.dateTo,
    }

    const filteredOrders = filterOrders(normalizedOrders, clientFilters)
    const { data, meta } = paginate(filteredOrders, page, pageSize)

    return {
      data,
      meta,
      statuses: buildStatusOptions(normalizedOrders),
      appliedFilters: filters,
    }
  },

  async registerPayment(orderId, payload = {}) {
    const purchaseOrderId = Number(orderId)
    if (!Number.isFinite(purchaseOrderId)) {
      throw new Error('Invalid purchase order identifier')
    }

    const rawAmount =
      payload.amount ?? payload.amountPaid ?? payload.amount_paid ?? null
    const amount = roundCurrency(rawAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Ingresa un monto válido mayor a cero')
    }

    const rawPaymentMethodId =
      payload.paymentMethodId ??
      payload.payment_method_id ??
      payload.methodId ??
      payload.method_id ??
      null
    const paymentMethodId = Number(rawPaymentMethodId)
    if (!Number.isFinite(paymentMethodId) || paymentMethodId <= 0) {
      throw new Error('Seleccioná un método de pago válido')
    }

    const rawCurrencyCode =
      payload.currencyCode ?? payload.currency_code ?? payload.currency ?? null
    const currencyCode = String(
      rawCurrencyCode || DEFAULT_CURRENCY
    ).toUpperCase()
    if (!currencyCode) {
      throw new Error('Seleccioná una moneda para registrar el pago')
    }

    const rawCashRegisterId =
      payload.cashRegisterId ?? payload.cash_register_id ?? null
    let cashRegisterId = null
    if (rawCashRegisterId !== null && rawCashRegisterId !== undefined) {
      const parsedCashRegisterId = Number(rawCashRegisterId)
      if (!Number.isFinite(parsedCashRegisterId) || parsedCashRegisterId <= 0) {
        throw new Error(
          'Seleccioná una caja válida o dejá el campo vacío para continuar'
        )
      }
      cashRegisterId = parsedCashRegisterId
    }

    const apiPayload = {
      amount_paid: Math.round(amount),
      reference_number:
        payload.reference ??
        payload.reference_number ??
        payload.check_number ??
        null,
      check_number: payload.check_number ?? null,
      notes: payload.notes ?? null,
      payment_method_id: paymentMethodId,
      currency_code: currencyCode,
    }

    if (cashRegisterId) {
      apiPayload.cash_register_id = cashRegisterId
    }

    await purchasePaymentService.processPayment(purchaseOrderId, apiPayload)

    const updatedOrder = await purchasePaymentService.getPurchaseOrderById(
      purchaseOrderId
    )

    return {
      success: true,
      order: normalizeOrder(updatedOrder),
      payment: apiPayload,
    }
  },

  async fetchOrder(orderId) {
    const purchaseOrderId = Number(orderId)
    if (!Number.isFinite(purchaseOrderId)) {
      throw new Error('Invalid purchase order identifier')
    }

    let order = await purchasePaymentService.getPurchaseOrderById(
      purchaseOrderId
    )

    // Fallback: If order is missing payment summary (common in /purchase/{id}),
    // try to fetch enriched data from supplier endpoint if supplier info is available.
    if (
      (!order.payments || !order.payments.total_paid) &&
      (order.supplier_name || order.supplierName)
    ) {
      try {
        const supplierName = order.supplier_name || order.supplierName
        const enrichedResponse =
          await purchaseService.getPurchasesBySupplierName(supplierName)

        if (enrichedResponse?.success && Array.isArray(enrichedResponse.data)) {
          const enrichedOrder = enrichedResponse.data.find(
            candidate =>
              String(candidate.purchase?.id ?? candidate.id) ===
              String(purchaseOrderId)
          )

          if (enrichedOrder) {
            // Merge enriched data (payments summary and cost info)
            order = {
              ...order,
              payments: enrichedOrder.payments ?? order.payments,
              cost_info: enrichedOrder.cost_info ?? order.cost_info,
              // If the enriched order has a different status, prefer it
              status:
                enrichedOrder.purchase?.status ??
                enrichedOrder.status ??
                order.status,
            }
          }
        }
      } catch (err) {
        console.warn(
          '[PurchasePaymentsMVP] Failed to fetch enriched fallback data',
          err
        )
      }
    }

    return {
      order: normalizeOrder(order),
    }
  },
}

export default purchasePaymentsMvpService
