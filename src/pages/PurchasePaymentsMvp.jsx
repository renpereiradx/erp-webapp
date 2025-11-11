import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Download,
  PlusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { purchasePaymentsMvpService } from '@/services/purchasePaymentsMvpService'
import '@/styles/scss/pages/_purchase-payments-mvp.scss'

const priorityLabelMap = {
  high: 'purchasePaymentsMvp.priority.high',
  medium: 'purchasePaymentsMvp.priority.medium',
  low: 'purchasePaymentsMvp.priority.low',
  critical: 'purchasePaymentsMvp.priority.critical',
}

const currencyFormatter = (lang, currency) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: currency || 'PYG',
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  })

const dateFormatterFactory = lang =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

const buildStatusOptions = (raw = []) => [
  { value: 'all', label: 'purchasePaymentsMvp.filters.status.all' },
  ...raw.map(option => ({
    value: option.value,
    label: `purchasePaymentsMvp.status.${option.value}`,
  })),
]

const normalizeOrderForModal = order => {
  if (!order) return null

  const rawPending = order.pendingAmount ?? null
  const pendingValue =
    rawPending === null || rawPending === undefined
      ? null
      : Number.parseFloat(rawPending)
  const pendingAmount = Number.isNaN(pendingValue) ? null : pendingValue

  return {
    id: order.id,
    pendingAmount,
    currency: order.currency || 'PYG',
    supplierName: order.supplier?.name || '',
  }
}

const PurchasePaymentsMvpPage = () => {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { info: showInfo, success: showSuccess, error: showError } = useToast()

  const [selectedOrders, setSelectedOrders] = useState(() => new Set())
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState(null)

  const {
    orders,
    filters,
    meta,
    statuses,
    loading,
    error,
    updateFilters,
    resetFilters,
    fetchOrders,
    applyFilters,
    changePage,
    refresh,
    clearError,
  } = usePurchasePaymentsMvpStore()

  useEffect(() => {
    if (!orders || orders.length === 0) {
      fetchOrders({ page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dateFormatter = useMemo(() => dateFormatterFactory(lang), [lang])

  const formatAmount = useCallback(
    (amount, currency) =>
      currencyFormatter(lang, currency).format(Number(amount || 0)),
    [lang]
  )

  const translate = useCallback(
    (key, params, fallback) => {
      const translated = t(key, params)
      if (translated === key) {
        if (typeof fallback === 'function') {
          return fallback(params ?? {}, lang)
        }
        if (fallback !== undefined) {
          return fallback
        }
      }
      return translated
    },
    [t, lang]
  )

  const statusOptions = useMemo(() => buildStatusOptions(statuses), [statuses])

  const handleInputChange = event => {
    const { name, value, type, checked } = event.target
    updateFilters({
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleApplyFilters = async () => {
    await applyFilters()
  }

  const handleReset = async () => {
    await resetFilters()
    setSelectedOrders(new Set())
  }

  const handleRefresh = async () => {
    await refresh()
  }

  const handleRetry = async () => {
    clearError()
    await fetchOrders({ page: 1 })
  }

  const handlePageChange = async direction => {
    const nextPage = meta.page + direction
    if (nextPage >= 1 && nextPage <= meta.totalPages) {
      await changePage(nextPage)
    }
  }

  const handleDirectPageChange = async page => {
    if (page === meta.page || page < 1 || page > meta.totalPages) return
    await changePage(page)
  }

  const handleSelectAll = value => {
    if (!orders || orders.length === 0) {
      setSelectedOrders(new Set())
      return
    }

    if (value === true || value === 'indeterminate') {
      setSelectedOrders(new Set(orders.map(order => order.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleSelectOrder = (orderId, value) => {
    setSelectedOrders(prev => {
      const next = new Set(prev)
      if (value) {
        next.add(orderId)
      } else {
        next.delete(orderId)
      }
      return next
    })
  }

  useEffect(() => {
    setSelectedOrders(prev => {
      if (!prev.size) return prev
      const currentIds = new Set((orders || []).map(order => order.id))
      const filtered = new Set()
      prev.forEach(id => {
        if (currentIds.has(id)) {
          filtered.add(id)
        }
      })
      return filtered.size === prev.size ? prev : filtered
    })
  }, [orders])

  const renderStatusBadge = status => (
    <span
      className={`purchase-payments-mvp__status-badge purchase-payments-mvp__status-badge--${status}`}
    >
      {t(`purchasePaymentsMvp.status.${status}`, { status })}
    </span>
  )

  const renderPriorityTag = priority => {
    if (!priority) return null
    const translationKey = priorityLabelMap[priority] || priority
    return (
      <span
        className={`purchase-payments-mvp__priority purchase-payments-mvp__priority--${priority}`}
      >
        {t(translationKey, { priority })}
      </span>
    )
  }

  const allSelected =
    orders && orders.length > 0 && selectedOrders.size === orders.length
  const someSelected =
    orders && orders.length > 0 && selectedOrders.size > 0 && !allSelected
  const headerCheckboxState = allSelected
    ? true
    : someSelected
    ? 'indeterminate'
    : false

  const handleViewOrder = useCallback(
    orderId => {
      if (!orderId) return
      navigate(`/pagos/compras-mvp/${encodeURIComponent(orderId)}`)
    },
    [navigate]
  )

  const handleRowDoubleClick = useCallback(
    (event, orderId) => {
      if (!orderId) return
      const target = event.target
      if (target instanceof Element) {
        const interactiveTarget = target.closest('[data-stop-row-nav="true"]')
        if (interactiveTarget) return
      }
      handleViewOrder(orderId)
    },
    [handleViewOrder]
  )

  const handleRowClick = useCallback((event, orderId) => {
    if (!orderId) return
    const target = event.target
    if (target instanceof Element) {
      const interactiveTarget = target.closest('[data-stop-row-nav="true"]')
      if (interactiveTarget) return
    }

    setSelectedOrders(prev => {
      const next = new Set(prev)
      const isOnlySelected = next.size === 1 && next.has(orderId)

      if (isOnlySelected) {
        next.delete(orderId)
        return next
      }

      next.clear()
      next.add(orderId)
      return next
    })
  }, [])

  const handleRegisterPaymentSubmit = useCallback(
    async payload => {
      try {
        await purchasePaymentsMvpService.registerPayment(
          payload.orderId,
          payload
        )
        showSuccess(
          t('purchasePaymentsMvp.registerModal.feedback.success', {
            orderId: payload.orderId,
          })
        )
        await refresh()
        setSelectedOrders(new Set())
      } catch (error) {
        showError(
          error?.message ||
            t('purchasePaymentsMvp.registerModal.feedback.error')
        )
        throw error
      }
    },
    [refresh, showError, showSuccess, t]
  )

  const handleModalOpenChange = useCallback(nextOpen => {
    setRegisterModalOpen(nextOpen)
    if (!nextOpen) {
      setModalOrder(null)
    }
  }, [])

  const renderTable = () => {
    if (loading) {
      return (
        <div className='purchase-payments-mvp__state'>
          <DataState
            variant='loading'
            skeletonVariant='list'
            skeletonProps={{ count: 5 }}
          />
        </div>
      )
    }

    if (error) {
      return (
        <div className='purchase-payments-mvp__state'>
          <DataState
            variant='error'
            title={t('purchasePaymentsMvp.data.error.title')}
            message={t('purchasePaymentsMvp.data.error.description')}
            onRetry={handleRetry}
          />
        </div>
      )
    }
    const hasOrders = Boolean(orders && orders.length > 0)
    const columnCount = 7

    return (
      <div role='region' aria-live='polite'>
        {hasOrders && selectedOrders.size > 0 && (
          <div className='purchase-payments-mvp__selection-banner'>
            {translate(
              'purchasePaymentsMvp.selection.count',
              { count: selectedOrders.size },
              ({ count }) =>
                lang === 'en'
                  ? `${count} orders selected`
                  : `${count} órdenes seleccionadas`
            )}
          </div>
        )}
        <div className='purchase-payments-mvp__table-wrapper'>
          <Table className='purchase-payments-mvp__table'>
            <TableHeader className='purchase-payments-mvp__table-head'>
              <TableRow className='purchase-payments-mvp__table-row purchase-payments-mvp__table-row--head'>
                <TableHead className='purchase-payments-mvp__column purchase-payments-mvp__column--checkbox'>
                  <Checkbox
                    aria-label={translate(
                      'purchasePaymentsMvp.selection.all',
                      undefined,
                      () =>
                        lang === 'en'
                          ? 'Select all purchase orders'
                          : 'Seleccionar todas las órdenes'
                    )}
                    checked={headerCheckboxState}
                    onCheckedChange={handleSelectAll}
                    disabled={loading || !hasOrders}
                    data-stop-row-nav='true'
                  />
                </TableHead>
                <TableHead className='purchase-payments-mvp__column'>
                  {t('purchasePaymentsMvp.table.order')}
                </TableHead>
                <TableHead className='purchase-payments-mvp__column'>
                  {t('purchasePaymentsMvp.table.supplier')}
                </TableHead>
                <TableHead className='purchase-payments-mvp__column'>
                  {t('purchasePaymentsMvp.table.issueDate')}
                </TableHead>
                <TableHead className='purchase-payments-mvp__column purchase-payments-mvp__column--numeric'>
                  {t('purchasePaymentsMvp.table.total')}
                </TableHead>
                <TableHead className='purchase-payments-mvp__column purchase-payments-mvp__column--numeric'>
                  {t('purchasePaymentsMvp.table.pending')}
                </TableHead>
                <TableHead className='purchase-payments-mvp__column'>
                  {t('purchasePaymentsMvp.table.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='purchase-payments-mvp__table-body'>
              {hasOrders ? (
                orders.map(order => {
                  const issued = dateFormatter.format(
                    new Date(order.issue_date)
                  )
                  const pendingAmount = Number(order.pendingAmount)
                  const isPending = pendingAmount > 0
                  const isSelected = selectedOrders.has(order.id)
                  const priorityClass = order.priority
                    ? `purchase-payments-mvp__table-row--priority-${order.priority}`
                    : ''
                  const rowClassName = [
                    'purchase-payments-mvp__table-row',
                    'purchase-payments-mvp__table-row--interactive',
                    priorityClass,
                    isSelected
                      ? 'purchase-payments-mvp__table-row--selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <TableRow
                      key={order.id}
                      className={rowClassName}
                      aria-selected={isSelected}
                      onClick={event => handleRowClick(event, order.id)}
                      onDoubleClick={event =>
                        handleRowDoubleClick(event, order.id)
                      }
                      data-order-id={order.id}
                    >
                      <TableCell className='purchase-payments-mvp__cell purchase-payments-mvp__cell--checkbox'>
                        <Checkbox
                          aria-label={translate(
                            'purchasePaymentsMvp.selection.row',
                            { id: order.id },
                            ({ id }) =>
                              lang === 'en'
                                ? `Select order ${id}`
                                : `Seleccionar orden ${id}`
                          )}
                          checked={isSelected}
                          onCheckedChange={value =>
                            handleSelectOrder(order.id, value === true)
                          }
                          data-stop-row-nav='true'
                        />
                      </TableCell>
                      <TableCell className='purchase-payments-mvp__cell'>
                        <div className='purchase-payments-mvp__order-cell'>
                          <button
                            type='button'
                            className='purchase-payments-mvp__order-link'
                            onClick={() => handleViewOrder(order.id)}
                            data-stop-row-nav='true'
                          >
                            {order.id}
                          </button>
                          {renderPriorityTag(order.priority)}
                        </div>
                      </TableCell>
                      <TableCell className='purchase-payments-mvp__cell'>
                        <div className='purchase-payments-mvp__supplier'>
                          <span className='purchase-payments-mvp__supplier-name'>
                            {order.supplier?.name}
                          </span>
                          {order.supplier?.contact && (
                            <span className='purchase-payments-mvp__supplier-contact'>
                              {order.supplier.contact}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='purchase-payments-mvp__cell'>
                        <span className='purchase-payments-mvp__date'>
                          {issued}
                        </span>
                      </TableCell>
                      <TableCell className='purchase-payments-mvp__cell purchase-payments-mvp__cell--amount'>
                        <span className='purchase-payments-mvp__amount-value'>
                          {formatAmount(order.total_amount, order.currency)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`purchase-payments-mvp__cell purchase-payments-mvp__cell--amount ${
                          isPending
                            ? 'purchase-payments-mvp__cell--pending'
                            : 'purchase-payments-mvp__cell--settled'
                        }`}
                      >
                        <span className='purchase-payments-mvp__amount-value'>
                          {formatAmount(order.pendingAmount, order.currency)}
                        </span>
                      </TableCell>
                      <TableCell className='purchase-payments-mvp__cell'>
                        {renderStatusBadge(order.status)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className='purchase-payments-mvp__table-row purchase-payments-mvp__table-row--empty'>
                  <TableCell
                    colSpan={columnCount}
                    className='purchase-payments-mvp__cell purchase-payments-mvp__cell--empty'
                  >
                    {t('purchasePaymentsMvp.table.emptyMessage')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const from = useMemo(
    () => (meta.page - 1) * meta.pageSize + 1,
    [meta.page, meta.pageSize]
  )
  const to = useMemo(
    () => Math.min(meta.page * meta.pageSize, meta.total),
    [meta.page, meta.pageSize, meta.total]
  )

  const paginationPages = useMemo(() => {
    const totalPages = meta.totalPages || 1
    const pages = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i)
      }
      return pages
    }

    if (meta.page <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages)
      return pages
    }

    if (meta.page >= totalPages - 2) {
      pages.push(
        1,
        'ellipsis',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      )
      return pages
    }

    pages.push(
      1,
      'ellipsis',
      meta.page - 1,
      meta.page,
      meta.page + 1,
      'ellipsis',
      totalPages
    )
    return pages
  }, [meta.page, meta.totalPages])

  const handleExport = useCallback(() => {}, [])

  const handleCreatePayment = useCallback(() => {
    if (!orders || orders.length === 0) {
      showInfo(t('purchasePaymentsMvp.registerModal.feedback.selectOrder'))
      return
    }

    if (selectedOrders.size === 0) {
      showInfo(t('purchasePaymentsMvp.registerModal.feedback.selectOrder'))
      return
    }

    if (selectedOrders.size > 1) {
      showInfo(t('purchasePaymentsMvp.registerModal.feedback.singleOrder'))
      return
    }

    const [orderId] = Array.from(selectedOrders)
    const order = orders.find(item => item.id === orderId)

    if (!order) {
      showError(t('purchasePaymentsMvp.registerModal.feedback.missingOrder'))
      return
    }

    const normalized = normalizeOrderForModal(order)

    if (
      !normalized ||
      normalized.pendingAmount === null ||
      normalized.pendingAmount <= 0
    ) {
      showInfo(
        t('purchasePaymentsMvp.registerModal.feedback.noPending', { orderId })
      )
      return
    }

    setModalOrder(normalized)
    setRegisterModalOpen(true)
  }, [orders, selectedOrders, showError, showInfo, t])

  return (
    <div className='purchase-payments-mvp'>
      <div className='purchase-payments-mvp__container'>
        <header className='purchase-payments-mvp__header'>
          <div className='purchase-payments-mvp__heading'>
            <h1 className='purchase-payments-mvp__title'>
              {t('purchasePaymentsMvp.title')}
            </h1>
            <p className='purchase-payments-mvp__description'>
              {t('purchasePaymentsMvp.subtitle')}
            </p>
          </div>
          <div className='purchase-payments-mvp__actions'>
            <div className='purchase-payments-mvp__icon-actions'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleRefresh}
                className='purchase-payments-mvp__icon-button'
                aria-label={translate(
                  'purchasePaymentsMvp.actions.refresh',
                  undefined,
                  () => (lang === 'en' ? 'Refresh' : 'Actualizar')
                )}
              >
                {loading ? (
                  <Loader2 className='purchase-payments-mvp__icon--spin' />
                ) : (
                  <RefreshCw className='purchase-payments-mvp__icon' />
                )}
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={handleExport}
                className='purchase-payments-mvp__icon-button'
                aria-label={translate(
                  'purchasePaymentsMvp.actions.export',
                  undefined,
                  () => (lang === 'en' ? 'Export' : 'Exportar')
                )}
              >
                <Download className='purchase-payments-mvp__icon' />
              </Button>
            </div>
            <Button
              type='button'
              size='lg'
              onClick={handleCreatePayment}
              className='purchase-payments-mvp__primary-action'
            >
              <PlusCircle className='purchase-payments-mvp__primary-icon' />
              {t('purchasePaymentsMvp.actions.registerPayment')}
            </Button>
          </div>
        </header>

        <div className='purchase-payments-mvp__content'>
          <Card
            className='purchase-payments-mvp__filters-card'
            aria-label={t('purchasePaymentsMvp.filters.sectionLabel')}
          >
            <CardHeader className='purchase-payments-mvp__filters-header'>
              <CardTitle className='purchase-payments-mvp__filters-title'>
                {translate('purchasePaymentsMvp.filters.title', undefined, () =>
                  lang === 'en' ? 'Filters' : 'Filtros'
                )}
              </CardTitle>
              <p className='purchase-payments-mvp__filters-description'>
                {translate(
                  'purchasePaymentsMvp.filters.helper',
                  undefined,
                  () =>
                    lang === 'en'
                      ? 'Refine the list using supplier, date and status filters.'
                      : 'Refiná la lista con proveedor, fechas y estado.'
                )}
              </p>
            </CardHeader>
            <CardContent className='purchase-payments-mvp__filters-content'>
              <div className='purchase-payments-mvp__filters-form'>
                <div className='purchase-payments-mvp__field'>
                  <label
                    className='purchase-payments-mvp__field-label'
                    htmlFor='purchase-payments-search'
                  >
                    {translate(
                      'purchasePaymentsMvp.filters.search.label',
                      undefined,
                      () => (lang === 'en' ? 'Supplier' : 'Proveedor')
                    )}
                  </label>
                  <div className='purchase-payments-mvp__input-wrapper'>
                    <Search
                      className='purchase-payments-mvp__input-icon'
                      aria-hidden='true'
                    />
                    <Input
                      id='purchase-payments-search'
                      name='search'
                      type='search'
                      className='purchase-payments-mvp__input purchase-payments-mvp__input--with-icon'
                      placeholder={translate(
                        'purchasePaymentsMvp.filters.search.placeholder',
                        undefined,
                        () =>
                          lang === 'en' ? 'Search supplier' : 'Buscar proveedor'
                      )}
                      value={filters.search}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className='purchase-payments-mvp__field'>
                  <span className='purchase-payments-mvp__field-label'>
                    {translate(
                      'purchasePaymentsMvp.filters.dateRange.label',
                      undefined,
                      () => (lang === 'en' ? 'Date range' : 'Rango de fechas')
                    )}
                  </span>
                  <div className='purchase-payments-mvp__date-range'>
                    <Input
                      id='purchase-payments-date-from'
                      name='dateFrom'
                      type='date'
                      className='purchase-payments-mvp__input purchase-payments-mvp__input--date'
                      aria-label={t(
                        'purchasePaymentsMvp.filters.dateFrom.label'
                      )}
                      value={filters.dateFrom}
                      onChange={handleInputChange}
                    />
                    <span className='purchase-payments-mvp__date-separator'>
                      &ndash;
                    </span>
                    <Input
                      id='purchase-payments-date-to'
                      name='dateTo'
                      type='date'
                      className='purchase-payments-mvp__input purchase-payments-mvp__input--date'
                      aria-label={t('purchasePaymentsMvp.filters.dateTo.label')}
                      value={filters.dateTo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className='purchase-payments-mvp__field'>
                  <label
                    className='purchase-payments-mvp__field-label'
                    htmlFor='purchase-payments-status'
                  >
                    {translate(
                      'purchasePaymentsMvp.filters.status.label',
                      undefined,
                      () => (lang === 'en' ? 'Status' : 'Estado')
                    )}
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={value => updateFilters({ status: value })}
                  >
                    <SelectTrigger
                      id='purchase-payments-status'
                      data-testid='purchase-payments-filter-status'
                      className='purchase-payments-mvp__select-trigger'
                    >
                      <SelectValue
                        placeholder={translate(
                          'purchasePaymentsMvp.filters.status.placeholder',
                          undefined,
                          () => (lang === 'en' ? 'All statuses' : 'Todos')
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent className='purchase-payments-mvp__select-content'>
                      {statusOptions.map(option => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className='purchase-payments-mvp__select-item'
                        >
                          {t(option.label, { value: option.value })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className='purchase-payments-mvp__filters-footer'>
              <div className='purchase-payments-mvp__filters-actions'>
                <Button
                  type='button'
                  onClick={handleApplyFilters}
                  disabled={loading}
                  className='purchase-payments-mvp__filters-button purchase-payments-mvp__filters-button--primary'
                >
                  {t('purchasePaymentsMvp.filters.apply')}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleReset}
                  disabled={loading}
                  className='purchase-payments-mvp__filters-button purchase-payments-mvp__filters-button--secondary'
                >
                  {t('purchasePaymentsMvp.filters.reset')}
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className='purchase-payments-mvp__table-card'>
            <CardHeader className='purchase-payments-mvp__table-header'>
              <div className='purchase-payments-mvp__table-heading'>
                <div className='purchase-payments-mvp__table-heading-text'>
                  <CardTitle className='purchase-payments-mvp__table-title'>
                    {t('purchasePaymentsMvp.results.sectionLabel')}
                  </CardTitle>
                  <p className='purchase-payments-mvp__table-description'>
                    {translate(
                      'purchasePaymentsMvp.results.subtitle',
                      undefined,
                      () =>
                        lang === 'en'
                          ? 'Review outstanding, partial and paid purchase orders.'
                          : 'Revisá órdenes pendientes, parciales y pagadas.'
                    )}
                  </p>
                </div>
                {meta.total > 0 && (
                  <div className='purchase-payments-mvp__headline'>
                    {t('purchasePaymentsMvp.pagination.range', {
                      from,
                      to,
                      total: meta.total,
                    })}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className='purchase-payments-mvp__table-content'>
              {renderTable()}
            </CardContent>
            <CardFooter
              className='purchase-payments-mvp__pagination'
              aria-live='polite'
            >
              <div className='purchase-payments-mvp__pagination-info'>
                {meta.total > 0 ? (
                  <span>
                    {translate(
                      'purchasePaymentsMvp.pagination.results',
                      { count: orders?.length || 0, total: meta.total },
                      ({ count, total }) =>
                        lang === 'en'
                          ? `Showing ${count} of ${total} results`
                          : `Mostrando ${count} de ${total} resultados`
                    )}
                  </span>
                ) : (
                  <span>{t('purchasePaymentsMvp.pagination.empty')}</span>
                )}
              </div>
              <div className='purchase-payments-mvp__pagination-controls'>
                <button
                  type='button'
                  className='purchase-payments-mvp__nav-button'
                  onClick={() => handlePageChange(-1)}
                  aria-label={t('purchasePaymentsMvp.pagination.previous')}
                  disabled={loading || meta.page <= 1}
                >
                  <ChevronLeft />
                </button>
                <div className='purchase-payments-mvp__page-list'>
                  {paginationPages.map((page, index) => {
                    if (page === 'ellipsis') {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className='purchase-payments-mvp__page-ellipsis'
                        >
                          …
                        </span>
                      )
                    }

                    const pageNumber = Number(page)
                    const isActive = pageNumber === meta.page

                    return (
                      <button
                        key={pageNumber}
                        type='button'
                        className={`purchase-payments-mvp__page-button${
                          isActive
                            ? ' purchase-payments-mvp__page-button--active'
                            : ''
                        }`}
                        onClick={() => handleDirectPageChange(pageNumber)}
                        disabled={loading}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                <button
                  type='button'
                  className='purchase-payments-mvp__nav-button'
                  onClick={() => handlePageChange(1)}
                  aria-label={t('purchasePaymentsMvp.pagination.next')}
                  disabled={loading || meta.page >= meta.totalPages}
                >
                  <ChevronRight />
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      <RegisterPaymentModal
        open={isRegisterModalOpen}
        onOpenChange={handleModalOpenChange}
        order={modalOrder}
        onSubmit={handleRegisterPaymentSubmit}
      />
    </div>
  )
}

export default PurchasePaymentsMvpPage
