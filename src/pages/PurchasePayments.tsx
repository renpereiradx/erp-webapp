/**
 * PurchasePayments Page — pagos a proveedores (Fluent 2 / DESIGN.md).
 * Listado de saldos y vencimientos de facturas de compra con vista de tabla
 * (desktop) y cards (mobile/tablet). La lógica vive en usePurchasePaymentsMvpStore.
 */

import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Download,
  Loader2,
  Building,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Filter,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import ToastContainer from '@/components/ui/ToastContainer'
import PageHeader from '@/components/ui/PageHeader'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import purchaseService from '@/services/purchaseService'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

interface PurchaseOrderRow {
  id: number | string
  issue_date?: string
  total_amount?: number
  pendingAmount?: number | string | null
  currency?: string
  status?: string
  priority?: number | null
  supplier?: { id?: number | string; name?: string } | null
  [key: string]: any
}

const currencyFormatter = (lang: string, currency?: string) => {
  const code = normalizeCurrencyCode(currency || 'PYG')
  if (code === 'PYG') {
    return { format: (val: number) => formatPYG(val) }
  }
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const normalizeOrderForModal = (order: PurchaseOrderRow) => {
  if (!order) return null
  const pendingAmount = order.pendingAmount ?? null
  return {
    id: order.id,
    pendingAmount: pendingAmount !== null ? Number.parseFloat(String(pendingAmount)) : null,
    currency: order.currency || 'PYG',
    supplierName: order.supplier?.name || '',
    supplierId: order.supplier?.id ?? null,
    priority: order.priority ?? null,
  }
}

const headClass = 'text-label-caps uppercase text-muted-foreground'

// Normalización de estados (el servicio los entrega en inglés/español, en distintos casings)
const statusOf = (order: PurchaseOrderRow) => (order.status || '').toLowerCase()
const isPaidStatus = (order: PurchaseOrderRow) => ['completed', 'paid', 'pagado'].includes(statusOf(order))
const isPartialStatus = (order: PurchaseOrderRow) => ['partial', 'parcial'].includes(statusOf(order))
const isCancelledStatus = (order: PurchaseOrderRow) => ['cancelled', 'cancelado', 'voided', 'anulado'].includes(statusOf(order))
const pendingAmountOf = (order: PurchaseOrderRow) =>
  order.pendingAmount === null || order.pendingAmount === undefined
    ? 0
    : Number.parseFloat(String(order.pendingAmount)) || 0

const PurchasePaymentsPage = () => {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const {
    toasts,
    removeToast,
    info: showInfo,
    success: showSuccess,
    errorFrom
  } = useToast()

  const [isRegisterModalOpen, setRegisterModalOpen] = React.useState(false)
  const [modalOrder, setModalOrder] = React.useState<ReturnType<typeof normalizeOrderForModal>>(null)
  const [orderToCancel, setOrderToCancel] = React.useState<PurchaseOrderRow | null>(null)
  const [showCancelPreview, setShowCancelPreview] = React.useState(false)
  const [cancelPreviewData, setCancelPreviewData] = React.useState<any>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [localSearch, setLocalSearch] = React.useState('')

  const {
    orders, filters, loading, error, fetchOrders, applyFilters,
    updateFilters: setFilter, resetFilters, processPayment
  } = usePurchasePaymentsMvpStore()

  // Buscador instantáneo dentro de los resultados ya cargados (como en Cobros de Ventas)
  const displayOrders = useMemo(() => {
    const term = localSearch.trim().toLowerCase()
    if (!term) return orders
    return orders.filter((order: PurchaseOrderRow) =>
      String(order.id).toLowerCase().includes(term) ||
      (order.supplier?.name || '').toLowerCase().includes(term),
    )
  }, [orders, localSearch])

  // Manejar carga inicial con feedback
  useEffect(() => {
    fetchOrders().catch((err: unknown) => {
      errorFrom(err, { fallback: t('purchasePaymentsMvp.toast.loadError', 'No se pudieron cargar las órdenes de pago') })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders, errorFrom])

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', { dateStyle: 'medium' }),
    [lang],
  )
  const formatCurrency = (val: number | string | null | undefined, cur?: string) =>
    currencyFormatter(lang, cur).format(Number(val) || 0)

  const handleRefresh = async () => {
    try {
      showInfo(t('purchasePaymentsMvp.toast.refreshing', 'Actualizando listado...'))
      await fetchOrders()
      showSuccess(t('purchasePaymentsMvp.toast.refreshed', 'Listado actualizado'))
    } catch (err) {
      errorFrom(err, { fallback: t('purchasePaymentsMvp.toast.refreshError', 'Error al actualizar el listado') })
    }
  }

  const handleReset = () => {
    setLocalSearch('')
    resetFilters()
    showInfo(t('purchasePaymentsMvp.toast.filtersReset', 'Filtros reiniciados'))
  }

  const handleApplyFilters = async () => {
    try {
      await applyFilters()
    } catch (err) {
      errorFrom(err, { fallback: t('purchasePaymentsMvp.toast.loadError', 'No se pudieron cargar las órdenes de pago') })
    }
  }

  const handleRegisterPayment = (order: PurchaseOrderRow) => {
    setModalOrder(normalizeOrderForModal(order))
    setRegisterModalOpen(true)
  }

  const handleCancelOrder = async (order: PurchaseOrderRow) => {
    setOrderToCancel(order)
    setIsCancelling(true)

    try {
      const previewResult = await purchaseService.previewPurchaseOrderCancellation(order.id)
      if (previewResult?.success) {
        setCancelPreviewData(previewResult.data || { purchase_info: { id: order.id } })
      } else {
        setCancelPreviewData({ purchase_info: { id: order.id } })
      }
    } catch {
      setCancelPreviewData({ purchase_info: { id: order.id } })
    } finally {
      setIsCancelling(false)
      setShowCancelPreview(true)
    }
  }

  const handleConfirmCancellation = async () => {
    if (!orderToCancel) return
    setIsCancelling(true)
    setShowCancelPreview(false)
    try {
      const result = await purchaseService.cancelPurchaseOrderWithDetails({
        purchase_order_id: orderToCancel.id,
        user_id: 'system', // En un sistema real vendría del AuthContext
        cancellation_reason: 'ANULADO_DESDE_PAGOS',
        force_cancel: false,
      })
      if (result.success) {
        showSuccess(t('purchasePaymentsMvp.toast.cancelSuccess', 'Orden de compra anulada exitosamente.'))
        await fetchOrders()
      }
    } catch (err) {
      errorFrom(err, { fallback: t('purchasePaymentsMvp.toast.cancelError', 'No se pudo anular la orden') })
    } finally {
      setIsCancelling(false)
      setOrderToCancel(null)
    }
  }

  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      await processPayment({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        payment_method_id: paymentData.paymentMethodId,
        currency_code: paymentData.currencyCode,
        currency_id: paymentData.currencyId,
        exchange_rate: paymentData.exchange_rate,
        original_amount: paymentData.original_amount,
        reference: paymentData.reference,
        cash_register_id: paymentData.cashRegisterId,
        notes: paymentData.notes
      })
      setRegisterModalOpen(false)
      showSuccess(t('purchasePaymentsMvp.toast.paymentSuccess', 'Pago registrado exitosamente'))
      await fetchOrders()
    } catch (err) {
      console.error('Payment processing error:', err)
      errorFrom(err, { fallback: t('purchasePaymentsMvp.toast.paymentError', 'No se pudo procesar el pago') })
      throw err // Mantener el error para que el modal no se cierre prematuramente si es necesario
    }
  }

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase()
    if (s === 'completed' || s === 'paid' || s === 'pagado') {
      return <Badge variant='success' size='sm'>{t('purchasePaymentsMvp.status.paid', 'Pagado')}</Badge>
    }
    if (s === 'partial' || s === 'parcial') {
      return <Badge variant='info' size='sm'>{t('purchasePaymentsMvp.status.partial', 'Pago parcial')}</Badge>
    }
    if (s === 'overdue' || s === 'vencido') {
      return <Badge variant='destructive' size='sm'>{t('purchasePaymentsMvp.status.overdue', 'Vencido')}</Badge>
    }
    if (s === 'cancelled' || s === 'cancelado' || s === 'voided' || s === 'anulado') {
      return <Badge variant='secondary' size='sm'>{t('purchasePaymentsMvp.status.cancelled', 'Cancelado')}</Badge>
    }
    return <Badge variant='warning' size='sm'>{t('purchasePaymentsMvp.status.pending', 'Pendiente')}</Badge>
  }

  // KPIs sobre las órdenes cargadas (misma semántica que Cobros de Ventas)
  const openOrders = orders.filter(order => !isPaidStatus(order) && !isCancelledStatus(order))
  const partialOrders = orders.filter(isPartialStatus)
  const paidOrders = orders.filter(isPaidStatus)
  const cancelledOrders = orders.filter(isCancelledStatus)

  const kpis = [
    {
      label: t('purchasePaymentsMvp.kpi.pendingBalance', 'Saldos Pendientes'),
      icon: Clock,
      valueClass: 'text-warning',
      count: openOrders.length,
      amount: openOrders.reduce((acc, order) => acc + pendingAmountOf(order), 0),
    },
    {
      label: t('purchasePaymentsMvp.kpi.partialPayments', 'Pagos Parciales'),
      icon: CircleDollarSign,
      valueClass: 'text-primary',
      count: partialOrders.length,
      amount: partialOrders.reduce((acc, order) => acc + (Number(order.total_amount) || 0) - pendingAmountOf(order), 0),
    },
    {
      label: t('purchasePaymentsMvp.kpi.completedPayments', 'Pagos Exitosos'),
      icon: CheckCircle2,
      valueClass: 'text-success',
      count: paidOrders.length,
      amount: paidOrders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0),
    },
    {
      label: t('purchasePaymentsMvp.kpi.cancelledOrders', 'Órdenes Anuladas'),
      icon: Ban,
      valueClass: 'text-muted-foreground',
      count: cancelledOrders.length,
      amount: cancelledOrders.reduce((acc, order) => acc + (Number(order.total_amount) || 0), 0),
    },
  ]

  const isCancellable = (order: PurchaseOrderRow) => order.status?.toLowerCase() !== 'cancelled'
  const isPayable = (order: PurchaseOrderRow) =>
    ['pending', 'partial', 'vencido'].includes(order.status?.toLowerCase() || '')

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg animate-in fade-in duration-150'>
        <PageHeader
          breadcrumb={t('purchasePaymentsMvp.title', 'Pagos de compras')}
          title={t('purchasePaymentsMvp.page.title', 'Pagos a Proveedores')}
          subtitle={t('purchasePaymentsMvp.page.subtitle', 'Gestión de saldos y vencimientos de facturas de compra')}
          actions={
            <div className='flex flex-wrap gap-sm'>
              <Button variant='outline' onClick={handleRefresh} disabled={loading}>
                <RefreshCw size={14} className={cn('mr-2', loading && 'animate-spin')} aria-hidden='true' />
                {t('purchasePaymentsMvp.actions.refresh', 'Actualizar')}
              </Button>
              <Button variant='outline'>
                <Download size={14} className='mr-2' aria-hidden='true' />
                {t('purchasePaymentsMvp.actions.report', 'Reporte')}
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md'>
          {kpis.map(({ label, icon: Icon, valueClass, count, amount }, i) => (
            <div
              key={i}
              className='bg-surface rounded-md border border-border-subtle shadow-whisper p-lg flex flex-col gap-md'
            >
              <div className='flex items-center justify-between'>
                <div className='p-sm bg-surface-muted rounded-md'>
                  <Icon size={20} className={valueClass} aria-hidden='true' />
                </div>
                <Badge variant='secondary' size='sm'>
                  {t('purchasePaymentsMvp.kpi.operations', '{count} OP', { count })}
                </Badge>
              </div>
              <div>
                <p className='text-label-caps uppercase text-muted-foreground leading-none mb-sm'>
                  {label}
                </p>
                <h2 className='text-title-md font-data-mono text-data-mono text-foreground tracking-tight'>
                  {formatCurrency(amount)}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <section className='bg-surface rounded-md border border-border-subtle shadow-whisper p-md'>
          <div className='flex flex-col xl:flex-row items-end gap-md'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md flex-1 w-full'>
              <div className='space-y-xs min-w-0'>
                <label htmlFor='purchase-payments-supplier' className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('purchasePaymentsMvp.filters.supplier', 'Proveedor')}
                </label>
                <div className='relative'>
                  <Building className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4' aria-hidden='true' />
                  <Input
                    id='purchase-payments-supplier'
                    aria-label={t('purchasePaymentsMvp.filters.search.label', 'Buscar órdenes')}
                    placeholder={t('purchasePaymentsMvp.filters.search.placeholder', 'Buscar por ID de orden o proveedor...')}
                    value={filters.search || ''}
                    onChange={e => setFilter({ search: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleApplyFilters() }}
                    className='pl-10 min-w-0 w-full'
                  />
                </div>
              </div>

              <div className='space-y-xs min-w-0'>
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('purchasePaymentsMvp.filters.status.label', 'Estado')}
                </label>
                <Select value={filters.status || 'all'} onValueChange={(val: string) => setFilter({ status: val })}>
                  <SelectTrigger className='min-w-0 w-full'>
                    <SelectValue placeholder={t('purchasePaymentsMvp.filters.status.label', 'Estado de pago')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('purchasePaymentsMvp.filters.status.all', 'Todos')}</SelectItem>
                    <SelectItem value='PENDING'>{t('purchasePaymentsMvp.status.pending', 'Pendiente')}</SelectItem>
                    <SelectItem value='PARTIAL'>{t('purchasePaymentsMvp.status.partial', 'Parcial')}</SelectItem>
                    <SelectItem value='PAID'>{t('purchasePaymentsMvp.status.paid', 'Pagado')}</SelectItem>
                    <SelectItem value='CANCELLED' className='text-error'>{t('purchasePaymentsMvp.status.cancelled', 'Anulado')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-xs min-w-0'>
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('purchasePaymentsMvp.filters.dateFrom', 'Desde')}
                </label>
                <Input
                  type='date'
                  value={filters.dateFrom || ''}
                  onChange={e => setFilter({ dateFrom: e.target.value })}
                  className='min-w-0 w-full'
                />
              </div>

              <div className='space-y-xs min-w-0'>
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('purchasePaymentsMvp.filters.dateTo', 'Hasta')}
                </label>
                <Input
                  type='date'
                  value={filters.dateTo || ''}
                  onChange={e => setFilter({ dateTo: e.target.value })}
                  className='min-w-0 w-full'
                />
              </div>
            </div>

            <div className='flex gap-sm w-full xl:w-auto'>
              <Button variant='primary' onClick={handleApplyFilters} disabled={loading} className='flex-1 xl:flex-none'>
                <Filter size={16} className='mr-1.5' aria-hidden='true' />
                {t('purchasePaymentsMvp.actions.filter', 'Filtrar')}
              </Button>
              <Button variant='outline' onClick={handleReset} className='min-w-24'>
                {t('purchasePaymentsMvp.actions.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        </section>

        {/* Table Container */}
        <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
          <div className='p-md border-b border-border-subtle bg-surface flex justify-between items-center gap-md'>
            <div className='relative w-full max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4' aria-hidden='true' />
              <Input
                aria-label={t('purchasePaymentsMvp.search.label', 'Buscar en resultados')}
                placeholder={t('purchasePaymentsMvp.search.placeholder', 'Buscar orden (ID o proveedor)...')}
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='text-label-caps uppercase text-muted-foreground bg-surface-muted border border-border-subtle px-sm py-xs rounded-md whitespace-nowrap tabular-nums'>
              {t('purchasePaymentsMvp.results', '{count} RESULTADOS', { count: displayOrders.length })}
            </div>
          </div>

          {/* Estados de datos */}
          {error ? (
            <DataState
              variant='error'
              testId='purchase-payments-error'
              title={t('purchasePaymentsMvp.data.error.title', 'Error al cargar pagos')}
              message={error}
              onRetry={fetchOrders}
            />
          ) : loading && displayOrders.length === 0 ? (
            <div className='p-lg'>
              <GenericSkeletonList count={5} lineHeight={44} data-testid='purchase-payments-loading' />
            </div>
          ) : displayOrders.length === 0 ? (
            <DataState
              variant='empty'
              testId='purchase-payments-empty'
              title={t('purchasePaymentsMvp.data.empty.title', 'Sin resultados')}
              description={t('purchasePaymentsMvp.data.empty.description', 'No hay órdenes de compra que coincidan con los filtros.')}
              onRetry={handleReset}
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className='hidden lg:block overflow-x-auto'>
                <Table className='min-w-[900px]'>
                  <TableHeader>
                    <TableRow className='bg-surface-muted hover:bg-surface-muted border-b border-border-subtle'>
                      <TableHead className={headClass}>{t('purchasePaymentsMvp.table.orderDate', 'Orden / Fecha')}</TableHead>
                      <TableHead className={headClass}>{t('purchasePaymentsMvp.table.supplier', 'Proveedor')}</TableHead>
                      <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.table.total', 'Importe total')}</TableHead>
                      <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.table.pending', 'Saldo pendiente')}</TableHead>
                      <TableHead className={`${headClass} text-center`}>{t('purchasePaymentsMvp.table.status', 'Estado')}</TableHead>
                      <TableHead className='w-16 text-right'>
                        <span className='sr-only'>{t('purchasePaymentsMvp.table.actions', 'Acciones')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrders.map((order: PurchaseOrderRow) => (
                      <TableRow key={String(order.id)} className='hover:bg-surface-muted transition-colors duration-150'>
                        <TableCell>
                          <div className='flex flex-col'>
                            <span className='text-data-mono font-data-mono text-primary'>#{order.id}</span>
                            <span className='text-body-sm text-muted-foreground mt-0.5'>
                              {dateFormatter.format(new Date(order.issue_date || Date.now()))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-sm'>
                            <div className='size-8 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground shrink-0'>
                              <Building size={14} aria-hidden='true' />
                            </div>
                            <span className='text-body-md text-foreground'>{order.supplier?.name || '---'}</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right font-data-mono text-data-mono text-foreground'>
                          {formatCurrency(order.total_amount, order.currency)}
                        </TableCell>
                        <TableCell className='text-right font-data-mono text-data-mono text-error'>
                          {formatCurrency(order.pendingAmount, order.currency)}
                        </TableCell>
                        <TableCell className='text-center'>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={t('purchasePaymentsMvp.actions.viewDetail', 'Ver detalle')}
                              title={t('purchasePaymentsMvp.actions.viewDetail', 'Ver detalle')}
                              onClick={() => navigate(`/pagos-compras/${order.id}`)}
                              className='h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary'
                            >
                              <Eye size={16} aria-hidden='true' />
                            </Button>
                            {isPayable(order) && (
                              <Button
                                variant='ghost'
                                size='icon'
                                aria-label={t('purchasePaymentsMvp.actions.registerPayment', 'Registrar pago')}
                                title={t('purchasePaymentsMvp.actions.registerPayment', 'Registrar pago')}
                                onClick={() => handleRegisterPayment(order)}
                                className='h-8 w-8 p-0 rounded-full text-primary hover:bg-primary/10 hover:text-primary'
                              >
                                <CheckCircle2 size={16} aria-hidden='true' />
                              </Button>
                            )}
                            {isCancellable(order) && (
                              <Button
                                variant='ghost'
                                size='icon'
                                aria-label={t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
                                title={t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
                                onClick={() => handleCancelOrder(order)}
                                className='h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-error'
                                disabled={isCancelling}
                              >
                                <Ban size={16} aria-hidden='true' />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden divide-y divide-border-subtle'>
                {displayOrders.map((order: PurchaseOrderRow) => (
                  <div key={String(order.id)} className='p-md space-y-md'>
                    <div className='flex items-center justify-between gap-md'>
                      <div className='flex items-center gap-sm min-w-0'>
                        <div className='size-8 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground shrink-0'>
                          <Building size={14} aria-hidden='true' />
                        </div>
                        <div className='flex flex-col min-w-0'>
                          <span className='text-body-md-bold text-foreground truncate'>
                            {order.supplier?.name || '---'}
                          </span>
                          <span className='font-data-mono text-data-mono text-muted-foreground'>
                            #{order.id}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className='grid grid-cols-2 gap-x-4 gap-y-sm'>
                      <div>
                        <p className='text-label-caps uppercase text-muted-foreground mb-xs'>
                          {t('purchasePaymentsMvp.table.date', 'Fecha')}
                        </p>
                        <p className='text-body-md text-muted-foreground'>
                          {dateFormatter.format(new Date(order.issue_date || Date.now()))}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-label-caps uppercase text-muted-foreground mb-xs'>
                          {t('purchasePaymentsMvp.table.total', 'Importe total')}
                        </p>
                        <p className='font-data-mono text-data-mono text-foreground'>
                          {formatCurrency(order.total_amount, order.currency)}
                        </p>
                      </div>
                      <div className='col-span-2 flex justify-between items-end'>
                        <p className='text-label-caps uppercase text-muted-foreground'>
                          {t('purchasePaymentsMvp.table.pending', 'Saldo pendiente')}
                        </p>
                        <p className='font-data-mono text-data-mono text-error'>
                          {formatCurrency(order.pendingAmount, order.currency)}
                        </p>
                      </div>
                    </div>

                    <div className='flex gap-sm pt-sm border-t border-border-subtle'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => navigate(`/pagos-compras/${order.id}`)}
                      >
                        <Eye size={14} className='mr-1.5' aria-hidden='true' />
                        {t('purchasePaymentsMvp.actions.viewDetail', 'Ver detalle')}
                      </Button>
                      {isPayable(order) && (
                        <Button
                          size='sm'
                          variant='secondary'
                          className='flex-1'
                          onClick={() => handleRegisterPayment(order)}
                        >
                          <CheckCircle2 size={14} className='mr-1.5' aria-hidden='true' />
                          {t('purchasePaymentsMvp.actions.registerPayment', 'Registrar pago')}
                        </Button>
                      )}
                      {isCancellable(order) && (
                        <Button
                          size='sm'
                          variant='ghost'
                          className='text-error'
                          aria-label={t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
                          onClick={() => handleCancelOrder(order)}
                          disabled={isCancelling}
                        >
                          <Ban size={14} aria-hidden='true' />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {loading && displayOrders.length > 0 && (
          <div className='flex justify-center py-sm'>
            <Loader2 className='size-4 animate-spin text-muted-foreground' aria-hidden='true' />
          </div>
        )}

        <RegisterPaymentModal open={isRegisterModalOpen} onOpenChange={setRegisterModalOpen} order={modalOrder} onSubmit={handlePaymentSubmit} />

        {/* CANCEL ORDER MODAL */}
        <EnhancedModal
          isOpen={showCancelPreview && !!cancelPreviewData && !!orderToCancel}
          onClose={() => setShowCancelPreview(false)}
          title={t('purchases.cancel.title', '¿Anular esta orden?')}
          variant='error'
          size='sm'
          footer={
            <div className='flex justify-end gap-sm w-full'>
              <Button variant='secondary' onClick={() => setShowCancelPreview(false)}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button variant='destructive' onClick={handleConfirmCancellation}>
                {t('purchases.cancel.confirm', 'Sí, Anular')}
              </Button>
            </div>
          }
        >
          <div className='space-y-md'>
            <p className='text-body-md text-on-surface-deep'>
              {t('purchases.cancel.body', 'Esta acción afectará los saldos con {supplier}.', {
                supplier: orderToCancel?.supplier?.name || t('purchasePaymentsMvp.cancel.fallbackSupplier', 'el proveedor'),
              })}
            </p>
            {cancelPreviewData?.impact_analysis && (
              <div className='p-md bg-error-container text-on-error-container rounded-md text-left space-y-1'>
                <p className='text-body-sm-bold'>{t('purchases.cancel.impact_title', 'Impacto de la anulación:')}</p>
                <ul className='list-disc pl-4 text-body-sm space-y-1'>
                  {cancelPreviewData.impact_analysis.requires_payment_reversal && (
                    <li>
                      {t('purchases.cancel.impact_payments', 'Se reversarán {count} pagos.', {
                        count: cancelPreviewData.impact_analysis.payments_to_cancel || 0,
                      })}
                    </li>
                  )}
                  {cancelPreviewData.impact_analysis.requires_stock_adjustment && (
                    <li>
                      {t('purchases.cancel.impact_stock', 'Se ajustará el stock de {count} items.', {
                        count: cancelPreviewData.impact_analysis.stock_adjustments_required || 0,
                      })}
                    </li>
                  )}
                  <li>
                    {t('purchases.cancel.impact_total', 'Total a reversar: {amount}', {
                      amount: formatCurrency(cancelPreviewData.impact_analysis.total_to_reverse || 0, orderToCancel?.currency),
                    })}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </EnhancedModal>

        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  )
}

export default PurchasePaymentsPage
