import {
  DEMO_PURCHASE_ORDERS_DATA,
  DEMO_SUPPLIER_DATA,
  DEMO_PURCHASE_ITEMS_DATA,
  simulateDelay,
} from '@/config/demoData'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_CURRENCY = 'PYG'

const roundMoney = value => {
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }
  return Number(numeric.toFixed(2))
}

const ensureDate = (value, fallback = new Date()) => {
  if (!value) return new Date(fallback)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date(fallback)
  }
  return date
}

const sumPayments = payments =>
  (payments || []).reduce(
    (acc, payment) => acc + Number(payment.amount || 0),
    0
  )

const createSupplierInfo = order => {
  const supplier = DEMO_SUPPLIER_DATA.find(
    item => item.id === order.supplier_id
  )

  if (supplier) {
    return {
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact?.email ?? supplier.contact?.phone ?? null,
      email: supplier.contact?.email ?? null,
      phone: supplier.contact?.phone ?? null,
      address: supplier.address ?? null,
      taxId: supplier.tax_id ?? null,
      priority: supplier.metadata?.priority ?? 'medium',
    }
  }

  return {
    id: order.supplier_id,
    name: order.supplier_name,
    contact: null,
    email: null,
    phone: null,
    address: null,
    taxId: null,
    priority: 'medium',
  }
}

const computeInitialPending = (order, priority) => {
  if (order.status === 'completed' || order.status === 'cancelled') {
    return 0
  }

  const multiplier = priority === 'high' ? 0.65 : 0.45
  const base = order.total_amount * multiplier
  return Number(Math.max(0, base).toFixed(2))
}

const createItemsCollection = orderId =>
  DEMO_PURCHASE_ITEMS_DATA.filter(
    item => item.purchase_order_id === orderId
  ).map(item => ({
    id: item.id,
    productId: item.product_id,
    name: item.product_name,
    quantity: item.quantity,
    unitPrice: roundMoney(item.unit_price),
    total: roundMoney(item.total_price),
    expDate: item.exp_date ?? null,
  }))

const generateInitialPayments = (order, targetPaid) => {
  const normalizedTarget = roundMoney(Math.max(0, targetPaid))
  if (!normalizedTarget) return []

  const baseDate = ensureDate(order.order_date)
  const currency = order.currency ?? DEFAULT_CURRENCY

  const shouldSplit = normalizedTarget > order.total_amount * 0.55
  const segments = shouldSplit
    ? [roundMoney(normalizedTarget * 0.6), normalizedTarget]
    : [normalizedTarget]

  let accumulated = 0

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1
    const targetAmount = isLast
      ? roundMoney(normalizedTarget - accumulated)
      : segment

    accumulated = roundMoney(accumulated + targetAmount)

    const registered = new Date(baseDate)
    registered.setDate(baseDate.getDate() + (index + 1) * 2)

    return {
      id: `seed_${order.id}_${index + 1}`,
      order_id: order.id,
      amount: targetAmount,
      method: index === 0 ? 'transfer' : 'cash',
      currency,
      reference: `SIM-${order.id}-${index + 1}`,
      cash_register_id: index === 0 ? 'main' : 'secondary',
      notes:
        index === 0
          ? 'Pago simulado para datos demo'
          : 'Segundo pago simulado para datos demo',
      status: 'approved',
      recorded_by: index === 0 ? 'demo.user' : 'demo.manager',
      registered_at: registered.toISOString(),
    }
  })
}

const createInternalOrder = order => {
  const supplier = createSupplierInfo(order)
  const basePending = computeInitialPending(order, supplier.priority)
  const safePending = roundMoney(
    Math.min(order.total_amount, Math.max(0, basePending))
  )
  const targetPaid = roundMoney(order.total_amount - safePending)
  const payments = generateInitialPayments(order, targetPaid)
  const totalPaid = roundMoney(sumPayments(payments))
  const recalculatedPending = roundMoney(
    Math.max(0, order.total_amount - totalPaid)
  )

  return {
    id: order.id,
    supplier,
    issue_date: order.order_date,
    expected_delivery: order.expected_delivery,
    total_amount: order.total_amount,
    pendingAmount: recalculatedPending,
    totalPaid,
    currency: order.currency ?? DEFAULT_CURRENCY,
    status: order.status,
    priority: supplier.priority,
    notes: order.notes ?? '',
    payments,
    items: createItemsCollection(order.id),
    history: [],
    lastPaymentAt:
      payments.length > 0 ? payments[payments.length - 1].registered_at : null,
    createdAt: order.order_date,
    updatedAt:
      payments.length > 0
        ? payments[payments.length - 1].registered_at
        : order.order_date,
  }
}

let ordersState = DEMO_PURCHASE_ORDERS_DATA.map(createInternalOrder)

const cloneOrder = order => ({
  ...order,
  supplier: order.supplier ? { ...order.supplier } : null,
  payments: order.payments
    ? order.payments.map(payment => ({ ...payment }))
    : [],
  items: order.items ? order.items.map(item => ({ ...item })) : [],
})

const withDerivedFields = order => {
  const cloned = cloneOrder(order)
  const totalAmount = Number(cloned.total_amount ?? 0)
  const totalPaid = cloned.totalPaid ?? roundMoney(sumPayments(cloned.payments))
  const pendingAmount =
    cloned.pendingAmount ?? roundMoney(Math.max(0, totalAmount - totalPaid))
  const progressRatio =
    totalAmount > 0 ? Math.min(1, totalPaid / totalAmount) : 0
  const progressPercent = Math.round(progressRatio * 100)

  const dueDate = cloned.expected_delivery
    ? new Date(cloned.expected_delivery)
    : null
  const isOverdue = Boolean(
    dueDate && !Number.isNaN(dueDate.getTime()) && pendingAmount > 0
      ? dueDate.getTime() < Date.now()
      : false
  )

  return {
    ...cloned,
    totalPaid: roundMoney(totalPaid),
    pendingAmount: roundMoney(pendingAmount),
    paymentProgressPercent: progressPercent,
    paymentProgressRatio: progressRatio,
    isOverdue,
  }
}

const toEndOfDay = value => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value}T00:00:00`)
    if (Number.isNaN(fallback.getTime())) return null
    fallback.setHours(23, 59, 59, 999)
    return fallback
  }
  date.setHours(23, 59, 59, 999)
  return date
}

const toStartOfDay = value => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date(`${value}T00:00:00`)
    return Number.isNaN(fallback.getTime()) ? null : fallback
  }
  date.setHours(0, 0, 0, 0)
  return date
}

const matchSearch = (order, term) => {
  if (!term) return true
  const haystack = [
    String(order.id),
    order.supplier?.name ?? '',
    order.supplier?.contact ?? '',
    order.notes ?? '',
  ]
  return haystack.some(value =>
    value.toLowerCase().includes(term.toLowerCase())
  )
}

const applyFilters = (orders, filters) => {
  const statusFilter =
    filters.status && filters.status !== 'all' ? filters.status : null
  const searchTerm = (filters.search ?? '').trim().toLowerCase()
  const from = toStartOfDay(filters.dateFrom)
  const to = toEndOfDay(filters.dateTo)

  return orders.filter(order => {
    if (statusFilter && order.status !== statusFilter) return false
    if (from && new Date(order.issue_date) < from) return false
    if (to && new Date(order.issue_date) > to) return false
    if (!matchSearch(order, searchTerm)) return false
    return true
  })
}

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

const statusOptions = () =>
  Array.from(new Set(ordersState.map(order => order.status))).map(value => ({
    value,
  }))

export const purchasePaymentsMvpService = {
  async fetchOrders(params = {}) {
    const page = Number(params.page) || 1
    const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE

    await simulateDelay(420)

    const filtered = applyFilters(ordersState, params)
    const { data, meta } = paginate(filtered, page, pageSize)

    return {
      data: data.map(withDerivedFields),
      meta,
      statuses: statusOptions(),
      appliedFilters: {
        search: params.search ?? '',
        status: params.status ?? 'all',
        dateFrom: params.dateFrom ?? '',
        dateTo: params.dateTo ?? '',
      },
    }
  },

  async registerPayment(orderId, payload = {}) {
    await simulateDelay(380)

    const order = ordersState.find(item => item.id === Number(orderId))
    if (!order) {
      throw new Error('Purchase order not found')
    }

    if (order.pendingAmount === null || order.pendingAmount <= 0) {
      throw new Error('Order does not have a pending balance')
    }

    const rawAmount =
      payload.amount ?? payload.amountPaid ?? payload.amount_paid
    const amount = Number.parseFloat(rawAmount)

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid amount greater than zero')
    }

    if (amount - order.pendingAmount > 0.009) {
      throw new Error('Amount exceeds pending balance')
    }

    const normalizedAmount = Number(amount.toFixed(2))

    const paymentRecord = {
      id: `pay_${Date.now()}`,
      order_id: order.id,
      amount: normalizedAmount,
      method: payload.method ?? 'transfer',
      currency: payload.currency ?? order.currency ?? DEFAULT_CURRENCY,
      reference: payload.reference ?? null,
      cash_register_id:
        payload.cashRegisterId ?? payload.cash_register_id ?? null,
      notes: payload.notes ?? null,
      status: 'approved',
      recorded_by: payload.recordedBy ?? 'demo.user',
      registered_at: new Date().toISOString(),
    }

    const previousPending = Number(order.pendingAmount ?? 0)
    order.pendingAmount = roundMoney(
      Math.max(0, previousPending - normalizedAmount)
    )
    if (order.pendingAmount <= 0 && order.status !== 'cancelled') {
      order.pendingAmount = 0
      order.status = 'completed'
    }
    const previousPaid = Number(
      order.totalPaid ?? Math.max(order.total_amount - previousPending, 0)
    )
    order.totalPaid = roundMoney(previousPaid + normalizedAmount)
    order.payments = order.payments
      ? [...order.payments, paymentRecord]
      : [paymentRecord]
    order.payments.sort(
      (a, b) =>
        new Date(a.registered_at).getTime() -
        new Date(b.registered_at).getTime()
    )
    order.lastPaymentAt =
      order.payments.length > 0
        ? order.payments[order.payments.length - 1].registered_at
        : paymentRecord.registered_at
    order.updatedAt = paymentRecord.registered_at

    return {
      success: true,
      order: withDerivedFields(order),
      payment: { ...paymentRecord },
    }
  },

  async fetchOrder(orderId) {
    await simulateDelay(320)

    const order = ordersState.find(item => item.id === Number(orderId))
    if (!order) {
      throw new Error('Purchase order not found')
    }

    return {
      order: withDerivedFields(order),
    }
  },
}

export default purchasePaymentsMvpService
