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
  Receipt,
  Ban,
  CheckCircle2,
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

const headClass = 'text-label-caps uppercase text-on-surface-deep'

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

  const {
    orders, filters, loading, error, fetchOrders, updateFilters: setFilter, resetFilters, processPayment
  } = usePurchasePaymentsMvpStore()

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
    resetFilters()
    fetchOrders()
    showInfo(t('purchasePaymentsMvp.toast.filtersReset', 'Filtros reiniciados'))
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
      return <Badge variant='success'>{t('purchasePaymentsMvp.status.paid', 'Pagado')}</Badge>
    }
    if (s === 'partial' || s === 'parcial') {
      return <Badge variant='info'>{t('purchasePaymentsMvp.status.partial', 'Pago parcial')}</Badge>
    }
    if (s === 'overdue' || s === 'vencido') {
      return <Badge variant='destructive'>{t('purchasePaymentsMvp.status.overdue', 'Vencido')}</Badge>
    }
    if (s === 'cancelled' || s === 'cancelado' || s === 'voided' || s === 'anulado') {
      return <Badge variant='secondary'>{t('purchasePaymentsMvp.status.cancelled', 'Cancelado')}</Badge>
    }
    return <Badge variant='warning'>{t('purchasePaymentsMvp.status.pending', 'Pendiente')}</Badge>
  }

  const isCancellable = (order: PurchaseOrderRow) => order.status?.toLowerCase() !== 'cancelled'
  const isPayable = (order: PurchaseOrderRow) =>
    ['pending', 'partial', 'vencido'].includes(order.status?.toLowerCase() || '')

  return (
    <div className='mx-auto w-full max-w-container-max flex flex-col gap-lg animate-in fade-in duration-150'>
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

      {/* Filters Toolbar */}
      <div className='bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col md:flex-row md:items-center justify-between gap-md'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-outline-fg' size={16} aria-hidden='true' />
          <Input
            aria-label={t('purchasePaymentsMvp.filters.search.label', 'Buscar órdenes')}
            className='pl-9 border-border-subtle bg-surface-muted'
            placeholder={t('purchasePaymentsMvp.filters.search.placeholder', 'Buscar por ID de orden o proveedor...')}
            value={filters.search || ''}
            onChange={e => setFilter({ search: e.target.value })}
          />
        </div>

        <div className='flex items-center gap-sm'>
          <Select value={filters.status || 'all'} onValueChange={(val: string) => setFilter({ status: val })}>
            <SelectTrigger className='w-[180px] rounded-input border-border-subtle text-body-md-bold'>
              <SelectValue placeholder={t('purchasePaymentsMvp.filters.status.label', 'Estado de pago')} />
            </SelectTrigger>
            <SelectContent className='bg-surface border-border-subtle shadow-fluent-8'>
              <SelectItem value='all' className='text-body-md'>{t('purchasePaymentsMvp.filters.status.all', 'Todos los estados')}</SelectItem>
              <SelectItem value='PENDING' className='text-body-md'>{t('purchasePaymentsMvp.status.pending', 'Pendiente')}</SelectItem>
              <SelectItem value='PARTIAL' className='text-body-md'>{t('purchasePaymentsMvp.status.partial', 'Pago parcial')}</SelectItem>
              <SelectItem value='PAID' className='text-body-md'>{t('purchasePaymentsMvp.status.paid', 'Pagado')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='ghost' size='icon' onClick={handleReset} aria-label={t('purchasePaymentsMvp.filters.reset', 'Restablecer')}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      {error ? (
        <DataState
          variant='error'
          testId='purchase-payments-error'
          title={t('purchasePaymentsMvp.data.error.title', 'Error al cargar pagos')}
          message={error}
          onRetry={fetchOrders}
        />
      ) : loading && orders.length === 0 ? (
        <div className='bg-surface rounded-md border border-border-subtle shadow-whisper p-lg'>
          <GenericSkeletonList count={5} data-testid='purchase-payments-loading' />
        </div>
      ) : orders.length === 0 ? (
        <DataState
          variant='empty'
          testId='purchase-payments-empty'
          title={t('purchasePaymentsMvp.data.empty.title', 'Sin resultados')}
          description={t('purchasePaymentsMvp.data.empty.description', 'No hay órdenes de compra que coincidan con los filtros.')}
          onRetry={handleReset}
        />
      ) : (
        <div className='space-y-lg'>
          {/* Desktop Table View */}
          <div className='hidden lg:block overflow-hidden rounded-md border-0 bg-surface shadow-whisper'>
            <Table>
              <TableHeader className='bg-surface-muted'>
                <TableRow className='hover:bg-surface-muted border-0'>
                  <TableHead className={`${headClass} py-md px-lg`}>{t('purchasePaymentsMvp.table.orderDate', 'Orden / Fecha')}</TableHead>
                  <TableHead className={headClass}>{t('purchasePaymentsMvp.table.supplier', 'Proveedor')}</TableHead>
                  <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.table.total', 'Importe total')}</TableHead>
                  <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.table.pending', 'Saldo pendiente')}</TableHead>
                  <TableHead className={headClass}>{t('purchasePaymentsMvp.table.status', 'Estado')}</TableHead>
                  <TableHead className={`${headClass} text-right pr-lg`}>{t('purchasePaymentsMvp.table.actions', 'Acciones')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: PurchaseOrderRow) => (
                  <TableRow key={String(order.id)} className='hover:bg-surface-muted transition-colors duration-150'>
                    <TableCell className='py-md px-lg'>
                      <div className='flex flex-col'>
                        <span className='text-data-mono font-data-mono text-primary'>#{order.id}</span>
                        <span className='text-body-sm text-outline-fg mt-0.5'>
                          {dateFormatter.format(new Date(order.issue_date || Date.now()))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-md'>
                        <div className='size-8 rounded-sm bg-surface-muted border border-border-subtle flex items-center justify-center text-on-surface-deep shrink-0'>
                          <Building size={14} aria-hidden='true' />
                        </div>
                        <span className='text-body-md-bold text-foreground'>{order.supplier?.name || '---'}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-data-mono font-data-mono text-on-surface-deep'>
                      {formatCurrency(order.total_amount, order.currency)}
                    </TableCell>
                    <TableCell className='text-right text-data-mono font-data-mono text-foreground'>
                      {formatCurrency(order.pendingAmount, order.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className='text-right pr-lg'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('purchasePaymentsMvp.actions.viewDetail', 'Ver detalle')}
                          onClick={() => navigate(`/pagos-compras/${order.id}`)}
                          className='text-outline-fg hover:text-primary'
                        >
                          <Eye size={18} aria-hidden='true' />
                        </Button>
                        {isPayable(order) && (
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={t('purchasePaymentsMvp.actions.registerPayment', 'Registrar pago')}
                            onClick={() => handleRegisterPayment(order)}
                            className='text-outline-fg hover:text-success'
                          >
                            <CheckCircle2 size={18} aria-hidden='true' />
                          </Button>
                        )}
                        {isCancellable(order) && (
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
                            onClick={() => handleCancelOrder(order)}
                            className='text-outline-fg hover:text-error'
                            disabled={isCancelling}
                          >
                            <Ban size={18} aria-hidden='true' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className='lg:hidden grid grid-cols-1 md:grid-cols-2 gap-md'>
            {orders.map((order: PurchaseOrderRow) => (
              <div
                key={String(order.id)}
                role='link'
                tabIndex={0}
                onClick={() => navigate(`/pagos-compras/${order.id}`)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/pagos-compras/${order.id}`) }}
                className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden hover:shadow-fluent-8 transition-shadow duration-150 cursor-pointer p-lg space-y-md'
              >
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center gap-md'>
                      <div className='size-10 rounded-md bg-primary/10 flex items-center justify-center text-primary'>
                        <Receipt size={20} aria-hidden='true' />
                      </div>
                      <div>
                        <p className='text-data-mono font-data-mono text-primary leading-none mb-1'>#{order.id}</p>
                        <p className='text-body-sm text-outline-fg'>
                          {dateFormatter.format(new Date(order.issue_date || Date.now()))}
                        </p>
                      </div>
                    </div>
                    <div className='flex flex-col items-end gap-sm'>
                      {getStatusBadge(order.status)}
                      {isCancellable(order) && (
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order);
                          }}
                          className='text-outline-fg hover:text-error'
                          disabled={isCancelling}
                        >
                          <Ban size={16} aria-hidden='true' />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.table.supplier', 'Proveedor')}</p>
                    <p className='text-body-md-bold text-foreground line-clamp-1'>{order.supplier?.name || '---'}</p>
                  </div>

                  <div className='grid grid-cols-2 gap-md pt-sm border-t border-border-subtle'>
                    <div>
                      <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.table.total', 'Importe total')}</p>
                      <p className='text-data-mono font-data-mono text-foreground'>{formatCurrency(order.total_amount, order.currency)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-label-caps uppercase text-primary'>{t('purchasePaymentsMvp.table.pending', 'Saldo pendiente')}</p>
                      <p className='text-data-mono font-data-mono text-primary'>{formatCurrency(order.pendingAmount, order.currency)}</p>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && orders.length > 0 && (
        <div className='flex justify-center py-sm'>
          <Loader2 className='size-4 animate-spin text-outline-fg' aria-hidden='true' />
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
  )
}

export default PurchasePaymentsPage
