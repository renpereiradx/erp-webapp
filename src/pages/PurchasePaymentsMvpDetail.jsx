import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, PlusCircle, RefreshCw } from 'lucide-react'

import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/useToast'
import { useI18n } from '@/lib/i18n'
import { purchasePaymentsMvpService } from '@/services/purchasePaymentsMvpService'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import '@/styles/scss/pages/_purchase-payments-mvp.scss'

const priorityLabelMap = {
  high: 'purchasePaymentsMvp.priority.high',
  medium: 'purchasePaymentsMvp.priority.medium',
  low: 'purchasePaymentsMvp.priority.low',
  critical: 'purchasePaymentsMvp.priority.critical',
}

const resolveStatusKey = status => {
  if (!status) return 'pending'
  switch (status) {
    case 'completed':
    case 'paid':
      return 'paid'
    case 'cancelled':
      return 'cancelled'
    case 'partial':
      return 'partial'
    case 'overdue':
      return 'overdue'
    default:
      return status
  }
}

const translateWithFallback = (t, key, params, fallback) => {
  const translated = t(key, params)
  if (translated === key) {
    if (typeof fallback === 'function') {
      return fallback(params)
    }
    if (fallback !== undefined) {
      return fallback
    }
  }
  return translated
}

const PurchasePaymentsMvpDetail = () => {
  const { orderId } = useParams()
  const { t, lang } = useI18n()
  const refreshList = usePurchasePaymentsMvpStore(state => state.refresh)
  const { success: showSuccess, error: showError } = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRegisterOpen, setRegisterOpen] = useState(false)

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null)
      setError(
        lang === 'en'
          ? 'Missing purchase order identifier.'
          : 'Falta el identificador de la orden de compra.'
      )
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await purchasePaymentsMvpService.fetchOrder(orderId)
      setOrder(response.order)
    } catch (err) {
      setOrder(null)
      setError(
        err?.message ??
          (lang === 'en'
            ? 'Unable to load the purchase order details.'
            : 'No se pudieron cargar los detalles de la orden de compra.')
      )
    } finally {
      setLoading(false)
    }
  }, [orderId, lang])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleRefresh = useCallback(async () => {
    await loadOrder()
  }, [loadOrder])

  const handleModalOpenChange = useCallback(nextOpen => {
    setRegisterOpen(nextOpen)
  }, [])

  const handleRegisterPayment = useCallback(
    async payload => {
      try {
        const response = await purchasePaymentsMvpService.registerPayment(
          payload.orderId,
          payload
        )
        setOrder(response.order)
        showSuccess(
          translateWithFallback(
            t,
            'purchasePaymentsMvp.registerModal.feedback.success',
            { orderId: payload.orderId },
            ({ orderId: id }) =>
              lang === 'en'
                ? `Payment registered for order ${id}.`
                : `Pago registrado para la orden ${id}.`
          )
        )

        try {
          await refreshList()
        } catch (refreshError) {
          console.warn('Unable to refresh purchase payments list', refreshError)
        }
      } catch (err) {
        showError(
          err?.message ??
            translateWithFallback(
              t,
              'purchasePaymentsMvp.registerModal.feedback.error',
              undefined,
              () =>
                lang === 'en'
                  ? 'Unable to register the payment.'
                  : 'No se pudo registrar el pago.'
            )
        )
        throw err
      }
    },
    [lang, refreshList, showError, showSuccess, t]
  )

  const orderIdentifier = order?.id ?? orderId ?? '—'

  const headerTitle = useMemo(
    () =>
      translateWithFallback(
        t,
        'purchasePaymentsMvp.detail.heading',
        { orderId: orderIdentifier },
        ({ orderId: id }) =>
          lang === 'en' ? `Purchase order ${id}` : `Orden de compra ${id}`
      ),
    [lang, orderIdentifier, t]
  )

  const headerDescription = useMemo(
    () =>
      translateWithFallback(
        t,
        'purchasePaymentsMvp.detail.description',
        undefined,
        () =>
          lang === 'en'
            ? 'Review payment progress, supplier information, and recorded activity.'
            : 'Revisá el avance del pago, datos del proveedor y la actividad registrada.'
      ),
    [lang, t]
  )

  const registerLabel = useMemo(
    () =>
      translateWithFallback(
        t,
        'purchasePaymentsMvp.detail.registerPayment',
        undefined,
        () => (lang === 'en' ? 'Register payment' : 'Registrar nuevo pago')
      ),
    [lang, t]
  )

  const breadcrumbs = useMemo(
    () => [
      {
        label: translateWithFallback(
          t,
          'purchasePaymentsMvp.detail.breadcrumb.home',
          undefined,
          () => (lang === 'en' ? 'Home' : 'Inicio')
        ),
        to: '/',
      },
      {
        label: translateWithFallback(
          t,
          'purchasePaymentsMvp.detail.breadcrumb.orders',
          undefined,
          () => (lang === 'en' ? 'Purchase orders' : 'Ordenes de compra')
        ),
        to: '/purchase-payments-mvp',
      },
      {
        label: translateWithFallback(
          t,
          'purchasePaymentsMvp.detail.breadcrumb.current',
          { orderId: orderIdentifier },
          ({ orderId: id }) => id
        ),
        isCurrent: true,
      },
    ],
    [lang, orderIdentifier, t]
  )

  const amountFormatter = useMemo(() => {
    const currency = order?.currency || 'PYG'
    const locale = lang === 'en' ? 'en-US' : 'es-PY'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'PYG' ? 0 : 2,
      maximumFractionDigits: currency === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

  const formatAmount = useCallback(
    value => amountFormatter.format(Number(value || 0)),
    [amountFormatter]
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
        dateStyle: 'medium',
      }),
    [lang]
  )

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [lang]
  )

  const progressPercent = useMemo(() => {
    if (!order || !order.total_amount) return 0
    if (Number.isFinite(order.paymentProgressPercent)) {
      return Math.min(100, Math.max(0, order.paymentProgressPercent))
    }
    const total = Number(order.total_amount || 0)
    const paid = Number(order.totalPaid || 0)
    if (total <= 0) return 0
    return Math.min(100, Math.round((paid / total) * 100))
  }, [order])

  const paidAmount = useMemo(() => {
    if (!order) return 0
    if (Number.isFinite(order.totalPaid)) return Number(order.totalPaid)
    const pending = Number(order.pendingAmount || 0)
    return Math.max(0, Number(order.total_amount || 0) - pending)
  }, [order])

  const issueDateLabel = useMemo(() => {
    if (!order?.issue_date) return '—'
    return dateFormatter.format(new Date(order.issue_date))
  }, [dateFormatter, order?.issue_date])

  const dueDateLabel = useMemo(() => {
    if (!order?.expected_delivery) return '—'
    return dateFormatter.format(new Date(order.expected_delivery))
  }, [dateFormatter, order?.expected_delivery])

  const lastPaymentLabel = useMemo(() => {
    if (!order?.lastPaymentAt) {
      return translateWithFallback(
        t,
        'purchasePaymentsMvp.detail.meta.none',
        undefined,
        () => (lang === 'en' ? 'No records' : 'Sin registros')
      )
    }
    return dateTimeFormatter.format(new Date(order.lastPaymentAt))
  }, [dateTimeFormatter, lang, order?.lastPaymentAt, t])

  const supplierAddress = useMemo(() => {
    const address = order?.supplier?.address
    if (!address) return null
    const parts = [address.street, address.city, address.country]
    const filtered = parts.filter(Boolean)
    return filtered.length > 0 ? filtered.join(', ') : null
  }, [order?.supplier?.address])

  const supplierPriorityLabel = useMemo(() => {
    if (!order?.supplier?.priority) return null
    const key =
      priorityLabelMap[order.supplier.priority] || order.supplier.priority
    return translateWithFallback(
      t,
      key,
      undefined,
      () => order.supplier.priority
    )
  }, [order?.supplier?.priority, t])

  const disableRegisterPayment = !order || Number(order.pendingAmount || 0) <= 0

  const modalOrder = useMemo(() => {
    if (!order) return null
    const pending = Number(order.pendingAmount || 0)
    return {
      id: order.id,
      pendingAmount: pending,
      currency: order.currency || 'PYG',
      supplierName: order.supplier?.name || '',
    }
  }, [order])

  const renderPriorityChip = (priority, labelOverride) => {
    if (!priority) return null
    const translationKey = priorityLabelMap[priority] || priority
    const label =
      labelOverride ??
      translateWithFallback(t, translationKey, undefined, () => priority)

    return (
      <span
        className={`purchase-payments-mvp-detail__priority-chip purchase-payments-mvp-detail__priority-chip--${priority}`}
      >
        {label}
      </span>
    )
  }

  const renderStatusChip = status => {
    if (!status) return null
    const normalized = resolveStatusKey(status)
    const label = translateWithFallback(
      t,
      `purchasePaymentsMvp.status.${normalized}`,
      undefined,
      () => normalized.charAt(0).toUpperCase() + normalized.slice(1)
    )

    return (
      <span
        className={`purchase-payments-mvp-detail__status-chip purchase-payments-mvp-detail__status-chip--${normalized}`}
      >
        {label}
      </span>
    )
  }

  const renderPaymentStatus = status => {
    if (!status) return '—'
    const normalized = status.toLowerCase().replace(/\s+/g, '_')
    return translateWithFallback(
      t,
      `purchasePaymentsMvp.detail.history.status.${normalized}`,
      undefined,
      () =>
        normalized
          .split('_')
          .map(segment =>
            segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : ''
          )
          .join(' ')
    )
  }

  const renderPaymentChip = status => {
    if (!status) {
      return (
        <span className='purchase-payments-mvp-detail__chip purchase-payments-mvp-detail__chip--neutral'>
          —
        </span>
      )
    }

    const normalized = status.toLowerCase().replace(/\s+/g, '_')
    const modifier = normalized.replace(/_/g, '-')
    return (
      <span
        className={`purchase-payments-mvp-detail__chip purchase-payments-mvp-detail__chip--${modifier}`}
      >
        {renderPaymentStatus(status)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className='purchase-payments-mvp-detail'>
        <div className='purchase-payments-mvp-detail__container'>
          <div className='purchase-payments-mvp-detail__state'>
            <DataState
              variant='loading'
              skeletonVariant='list'
              skeletonProps={{ count: 4 }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='purchase-payments-mvp-detail'>
        <div className='purchase-payments-mvp-detail__container'>
          <div className='purchase-payments-mvp-detail__state'>
            <DataState
              variant='error'
              title={translateWithFallback(
                t,
                'purchasePaymentsMvp.data.error.title',
                undefined,
                () =>
                  lang === 'en'
                    ? 'Unable to load order'
                    : 'No se pudo cargar la orden'
              )}
              message={error}
              onRetry={handleRefresh}
            />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className='purchase-payments-mvp-detail'>
        <div className='purchase-payments-mvp-detail__container'>
          <div className='purchase-payments-mvp-detail__state'>
            <DataState
              variant='empty'
              title={translateWithFallback(
                t,
                'purchasePaymentsMvp.data.empty.title',
                undefined,
                () => (lang === 'en' ? 'No data' : 'Sin datos')
              )}
              description={translateWithFallback(
                t,
                'purchasePaymentsMvp.data.empty.description',
                undefined,
                () =>
                  lang === 'en'
                    ? 'The requested purchase order is not available.'
                    : 'La orden de compra solicitada no está disponible.'
              )}
              actionLabel={translateWithFallback(
                t,
                'purchasePaymentsMvp.filters.refresh',
                undefined,
                () => (lang === 'en' ? 'Refresh' : 'Refrescar')
              )}
              onAction={handleRefresh}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='purchase-payments-mvp-detail'>
      <div className='purchase-payments-mvp-detail__container'>
        <header className='purchase-payments-mvp-detail__header'>
          <Breadcrumb className='purchase-payments-mvp-detail__breadcrumb'>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.to ?? crumb.label ?? index}>
                  <BreadcrumbItem>
                    {crumb.isCurrent ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 ? (
                    <BreadcrumbSeparator />
                  ) : null}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className='purchase-payments-mvp-detail__heading'>
            <div className='purchase-payments-mvp-detail__heading-text'>
              <h1 className='purchase-payments-mvp-detail__title'>
                {headerTitle}
              </h1>
              <p className='purchase-payments-mvp-detail__description'>
                {headerDescription}
              </p>
            </div>
            <div className='purchase-payments-mvp-detail__actions'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={handleRefresh}
                disabled={loading}
                className='purchase-payments-mvp-detail__refresh'
                aria-label={translateWithFallback(
                  t,
                  'purchasePaymentsMvp.filters.refresh',
                  undefined,
                  () => (lang === 'en' ? 'Refresh' : 'Actualizar')
                )}
              >
                {loading ? (
                  <Loader2 className='purchase-payments-mvp-detail__primary-icon animate-spin' />
                ) : (
                  <RefreshCw className='purchase-payments-mvp-detail__primary-icon' />
                )}
              </Button>

              <Button
                type='button'
                className='purchase-payments-mvp-detail__primary-action'
                onClick={() => setRegisterOpen(true)}
                disabled={disableRegisterPayment}
              >
                <PlusCircle className='purchase-payments-mvp-detail__primary-icon' />
                {registerLabel}
              </Button>
            </div>
          </div>
        </header>

        <div className='purchase-payments-mvp-detail__grid'>
          <main className='purchase-payments-mvp-detail__main'>
            <section className='purchase-payments-mvp-detail__card purchase-payments-mvp-detail__card--summary'>
              <header className='purchase-payments-mvp-detail__card-header'>
                <h2 className='purchase-payments-mvp-detail__card-title'>
                  {translateWithFallback(
                    t,
                    'purchasePaymentsMvp.detail.summary.title',
                    undefined,
                    () =>
                      lang === 'en' ? 'Order summary' : 'Resumen de la orden'
                  )}
                </h2>
              </header>
              <div className='purchase-payments-mvp-detail__card-content'>
                <div className='purchase-payments-mvp-detail__summary-header'>
                  <div className='purchase-payments-mvp-detail__summary-status'>
                    {renderStatusChip(order.status)}
                  </div>
                  <div className='purchase-payments-mvp-detail__progress'>
                    <div className='purchase-payments-mvp-detail__progress-header'>
                      <span className='purchase-payments-mvp-detail__progress-label'>
                        {translateWithFallback(
                          t,
                          'purchasePaymentsMvp.detail.summary.progress',
                          undefined,
                          () =>
                            lang === 'en'
                              ? 'Payment progress'
                              : 'Progreso del pago'
                        )}
                      </span>
                      <span className='purchase-payments-mvp-detail__progress-value'>
                        {progressPercent}%
                      </span>
                    </div>
                    <Progress
                      value={progressPercent}
                      className='purchase-payments-mvp-detail__progress-bar'
                    />
                  </div>
                </div>

                <div className='purchase-payments-mvp-detail__summary-grid'>
                  <div className='purchase-payments-mvp-detail__summary-item'>
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.summary.total',
                        undefined,
                        () => (lang === 'en' ? 'Total amount' : 'Monto total')
                      )}
                    </span>
                    <span className='purchase-payments-mvp-detail__summary-value'>
                      {formatAmount(order.total_amount)}
                    </span>
                  </div>
                  <div className='purchase-payments-mvp-detail__summary-item'>
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.summary.paid',
                        undefined,
                        () => (lang === 'en' ? 'Paid amount' : 'Monto abonado')
                      )}
                    </span>
                    <span className='purchase-payments-mvp-detail__summary-value'>
                      {formatAmount(paidAmount)}
                    </span>
                  </div>
                  <div className='purchase-payments-mvp-detail__summary-item'>
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.summary.pending',
                        undefined,
                        () =>
                          lang === 'en' ? 'Pending balance' : 'Saldo pendiente'
                      )}
                    </span>
                    <span
                      className={`purchase-payments-mvp-detail__summary-value${
                        order.isOverdue
                          ? ' purchase-payments-mvp-detail__summary-value--overdue'
                          : ''
                      }`}
                    >
                      {formatAmount(order.pendingAmount)}
                    </span>
                  </div>
                  <div className='purchase-payments-mvp-detail__summary-item'>
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.summary.issueDate',
                        undefined,
                        () =>
                          lang === 'en' ? 'Issue date' : 'Fecha de emisión'
                      )}
                    </span>
                    <span className='purchase-payments-mvp-detail__summary-value'>
                      {issueDateLabel}
                    </span>
                  </div>
                  <div className='purchase-payments-mvp-detail__summary-item'>
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.summary.dueDate',
                        undefined,
                        () =>
                          lang === 'en' ? 'Due date' : 'Fecha de vencimiento'
                      )}
                    </span>
                    <span
                      className={`purchase-payments-mvp-detail__summary-value${
                        order.isOverdue
                          ? ' purchase-payments-mvp-detail__summary-value--overdue'
                          : ''
                      }`}
                    >
                      {dueDateLabel}
                    </span>
                  </div>
                </div>

                <div className='purchase-payments-mvp-detail__summary-meta'>
                  <div className='purchase-payments-mvp-detail__meta-item'>
                    <span className='purchase-payments-mvp-detail__meta-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.meta.paymentsRecorded',
                        undefined,
                        () =>
                          lang === 'en'
                            ? 'Payments recorded'
                            : 'Pagos registrados'
                      )}
                    </span>
                    <span className='purchase-payments-mvp-detail__meta-value'>
                      {order.payments?.length || 0}
                    </span>
                  </div>
                  <div className='purchase-payments-mvp-detail__meta-item'>
                    <span className='purchase-payments-mvp-detail__meta-label'>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.meta.lastPayment',
                        undefined,
                        () => (lang === 'en' ? 'Last payment' : 'Ultimo pago')
                      )}
                    </span>
                    <span className='purchase-payments-mvp-detail__meta-value'>
                      {lastPaymentLabel}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className='purchase-payments-mvp-detail__card'>
              <header className='purchase-payments-mvp-detail__card-header'>
                <h2 className='purchase-payments-mvp-detail__card-title'>
                  {translateWithFallback(
                    t,
                    'purchasePaymentsMvp.detail.history.title',
                    undefined,
                    () =>
                      lang === 'en' ? 'Payment history' : 'Historial de pagos'
                  )}
                </h2>
              </header>
              <div className='purchase-payments-mvp-detail__card-content'>
                {order.payments && order.payments.length > 0 ? (
                  <div className='purchase-payments-mvp-detail__table-wrapper'>
                    <table className='purchase-payments-mvp-detail__table'>
                      <thead>
                        <tr>
                          <th>
                            {translateWithFallback(
                              t,
                              'purchasePaymentsMvp.detail.history.columns.date',
                              undefined,
                              () => (lang === 'en' ? 'Date' : 'Fecha')
                            )}
                          </th>
                          <th>
                            {translateWithFallback(
                              t,
                              'purchasePaymentsMvp.detail.history.columns.user',
                              undefined,
                              () => (lang === 'en' ? 'User' : 'Usuario')
                            )}
                          </th>
                          <th className='purchase-payments-mvp-detail__cell--numeric'>
                            {translateWithFallback(
                              t,
                              'purchasePaymentsMvp.detail.history.columns.amount',
                              undefined,
                              () => (lang === 'en' ? 'Amount' : 'Monto')
                            )}
                          </th>
                          <th className='purchase-payments-mvp-detail__cell--status'>
                            {translateWithFallback(
                              t,
                              'purchasePaymentsMvp.detail.history.columns.status',
                              undefined,
                              () => (lang === 'en' ? 'Status' : 'Estado')
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.payments.map(payment => (
                          <tr key={payment.id}>
                            <td>
                              {dateTimeFormatter.format(
                                new Date(payment.registered_at)
                              )}
                            </td>
                            <td>{payment.recorded_by || '—'}</td>
                            <td className='purchase-payments-mvp-detail__cell--numeric'>
                              {formatAmount(payment.amount)}
                            </td>
                            <td className='purchase-payments-mvp-detail__cell--status'>
                              {renderPaymentChip(payment.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='purchase-payments-mvp-detail__empty purchase-payments-mvp-detail__empty--subtle'>
                    {translateWithFallback(
                      t,
                      'purchasePaymentsMvp.detail.history.empty',
                      undefined,
                      () =>
                        lang === 'en'
                          ? 'There are no payments recorded yet.'
                          : 'No hay pagos registrados todavía.'
                    )}
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className='purchase-payments-mvp-detail__sidebar'>
            <section className='purchase-payments-mvp-detail__card'>
              <header className='purchase-payments-mvp-detail__card-header'>
                <h2 className='purchase-payments-mvp-detail__card-title'>
                  {translateWithFallback(
                    t,
                    'purchasePaymentsMvp.detail.supplier.title',
                    undefined,
                    () => (lang === 'en' ? 'Supplier' : 'Proveedor')
                  )}
                </h2>
              </header>
              <div className='purchase-payments-mvp-detail__card-content'>
                <div className='purchase-payments-mvp-detail__supplier'>
                  <span className='purchase-payments-mvp-detail__supplier-name'>
                    {order.supplier?.name || '—'}
                  </span>
                  <span className='purchase-payments-mvp-detail__supplier-id'>
                    {order.supplier?.id ? `ID ${order.supplier.id}` : '—'}
                  </span>
                  {supplierPriorityLabel &&
                    renderPriorityChip(
                      order.supplier?.priority,
                      supplierPriorityLabel
                    )}
                </div>
                <dl className='purchase-payments-mvp-detail__supplier-details'>
                  <div className='purchase-payments-mvp-detail__supplier-detail'>
                    <dt>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.supplier.email',
                        undefined,
                        () => 'Email'
                      )}
                    </dt>
                    <dd>{order.supplier?.email || '—'}</dd>
                  </div>
                  <div className='purchase-payments-mvp-detail__supplier-detail'>
                    <dt>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.supplier.phone',
                        undefined,
                        () => (lang === 'en' ? 'Phone' : 'Telefono')
                      )}
                    </dt>
                    <dd>{order.supplier?.phone || '—'}</dd>
                  </div>
                  <div className='purchase-payments-mvp-detail__supplier-detail'>
                    <dt>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.supplier.taxId',
                        undefined,
                        () => 'Tax ID'
                      )}
                    </dt>
                    <dd>{order.supplier?.taxId || '—'}</dd>
                  </div>
                  <div className='purchase-payments-mvp-detail__supplier-detail'>
                    <dt>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.supplier.address',
                        undefined,
                        () => (lang === 'en' ? 'Address' : 'Direccion')
                      )}
                    </dt>
                    <dd>{supplierAddress || '—'}</dd>
                  </div>
                  <div className='purchase-payments-mvp-detail__supplier-detail'>
                    <dt>
                      {translateWithFallback(
                        t,
                        'purchasePaymentsMvp.detail.meta.lastPayment',
                        undefined,
                        () => (lang === 'en' ? 'Last payment' : 'Ultimo pago')
                      )}
                    </dt>
                    <dd>{lastPaymentLabel}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className='purchase-payments-mvp-detail__card'>
              <header className='purchase-payments-mvp-detail__card-header'>
                <h2 className='purchase-payments-mvp-detail__card-title'>
                  {translateWithFallback(
                    t,
                    'purchasePaymentsMvp.detail.products.title',
                    undefined,
                    () =>
                      lang === 'en'
                        ? 'Included products'
                        : 'Productos incluidos'
                  )}
                </h2>
              </header>
              <div className='purchase-payments-mvp-detail__card-content'>
                {order.items && order.items.length > 0 ? (
                  <div className='purchase-payments-mvp-detail__product-list'>
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className='purchase-payments-mvp-detail__product-row'
                      >
                        <div className='purchase-payments-mvp-detail__product-details'>
                          <span className='purchase-payments-mvp-detail__product-name'>
                            {item.name}
                          </span>
                          {item.productId && (
                            <span className='purchase-payments-mvp-detail__product-meta'>
                              {translateWithFallback(
                                t,
                                'purchasePaymentsMvp.detail.products.labels.sku',
                                { code: item.productId },
                                ({ code }) =>
                                  `${lang === 'en' ? 'SKU' : 'Codigo'}: ${code}`
                              )}
                            </span>
                          )}
                          <span className='purchase-payments-mvp-detail__product-quantity'>
                            {translateWithFallback(
                              t,
                              'purchasePaymentsMvp.detail.products.labels.quantity',
                              { quantity: item.quantity },
                              ({ quantity }) =>
                                `${
                                  lang === 'en' ? 'Quantity' : 'Cantidad'
                                }: ${quantity}`
                            )}
                          </span>
                        </div>
                        <div className='purchase-payments-mvp-detail__product-total'>
                          {formatAmount(item.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='purchase-payments-mvp-detail__empty purchase-payments-mvp-detail__empty--subtle'>
                    {translateWithFallback(
                      t,
                      'purchasePaymentsMvp.detail.products.empty',
                      undefined,
                      () =>
                        lang === 'en'
                          ? 'No products are associated with this order.'
                          : 'No hay productos asociados a esta orden.'
                    )}
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <RegisterPaymentModal
        open={isRegisterOpen}
        onOpenChange={handleModalOpenChange}
        order={modalOrder}
        onSubmit={handleRegisterPayment}
      />
    </div>
  )
}

export default PurchasePaymentsMvpDetail
