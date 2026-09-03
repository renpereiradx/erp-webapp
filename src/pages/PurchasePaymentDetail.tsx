/**
 * PurchasePaymentDetail Page — detalle de orden de compra (Fluent 2 / DESIGN.md).
 * Estado, items, resumen de pago e historial de pagos de una orden. La lógica
 * vive en usePurchasePaymentsMvpStore.
 */

import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Package,
  CheckCircle,
  Ban,
  Coins,
  DollarSign,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import PageHeader from '@/components/ui/PageHeader'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import purchaseService from '@/services/purchaseService'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

interface OrderItem {
  name?: string
  sku?: string
  quantity?: number
  unit_price_without_tax?: number
  unitPrice?: number
  tax_amount?: number
  total_line_with_tax?: number
  total?: number
  [key: string]: any
}

interface PurchaseOrderDetail {
  id: number | string
  issue_date?: string
  total_amount?: number
  totalPaid?: number
  pendingAmount?: number | string | null
  paymentProgressPercent?: number
  currency?: string
  status?: string
  priority?: number | null
  supplier?: {
    id?: number | string
    name?: string
    contact?: string
    address?: { street?: string } | null
  } | null
  items?: OrderItem[]
  payments?: Array<{ amount?: number; registered_at?: string; notes?: string }>
  [key: string]: any
}

const headClass = 'text-label-caps uppercase text-on-surface-deep'

const PurchasePaymentDetailPage = () => {
  const { orderId } = useParams()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  const { currentOrder: order, loading, error, fetchOrder, processPayment } = usePurchasePaymentsMvpStore()
  const [isRegisterModalOpen, setRegisterModalOpen] = React.useState(false)
  const [showCancelPreview, setShowCancelPreview] = React.useState(false)
  const [cancelPreviewData, setCancelPreviewData] = React.useState<any>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)

  const handleCancelOrder = async () => {
    if (!order) return
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
    if (!order) return
    setIsCancelling(true)
    setShowCancelPreview(false)
    try {
      const result = await purchaseService.cancelPurchaseOrderWithDetails({
        purchase_order_id: order.id,
        user_id: 'system',
        cancellation_reason: 'ANULADO_DESDE_DETALLE_PAGOS',
        force_cancel: false,
      })
      if (result.success) {
        showSuccess(t('purchasePaymentsMvp.toast.cancelSuccess', 'Orden de compra anulada exitosamente.'))
        fetchOrder(orderId)
      }
    } catch (err) {
      showError(t('purchasePaymentsMvp.toast.cancelError', 'No se pudo anular la orden'))
    } finally {
      setIsCancelling(false)
    }
  }

  const handlePaymentSubmit = async (paymentData: any) => {
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
    fetchOrder(orderId)
    showSuccess(t('purchasePaymentsMvp.toast.paymentSuccess', 'Pago registrado exitosamente'))
  }

  useEffect(() => { if (orderId) fetchOrder(orderId) }, [orderId, fetchOrder])

  const currencyFormatter = useMemo(() => {
    const code = normalizeCurrencyCode(order?.currency)
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return <Badge variant='success'>{t('purchasePaymentsMvp.status.paid', 'Pagado')}</Badge>
    if (s === 'partial') return <Badge variant='info'>{t('purchasePaymentsMvp.status.partial', 'Pago parcial')}</Badge>
    if (s === 'cancelled') return <Badge variant='destructive'>{t('purchasePaymentsMvp.status.cancelled', 'Cancelado')}</Badge>
    return <Badge variant='warning'>{t('purchasePaymentsMvp.status.pending', 'Pendiente')}</Badge>
  }

  if (loading && !order) {
    return (
      <div className='mx-auto w-full max-w-container-max py-xl'>
        <GenericSkeletonList count={4} data-testid='purchase-payment-detail-loading' />
      </div>
    )
  }
  if (error || !order) {
    return (
      <div className='mx-auto w-full max-w-container-max h-[70vh] flex items-center justify-center'>
        <DataState
          variant='error'
          testId='purchase-payment-detail-error'
          title={t('purchasePaymentsMvp.data.error.title', 'Error al cargar pagos')}
          message={error || t('purchasePaymentsMvp.detail.loadError', 'No se pudo cargar la orden.')}
          onRetry={() => fetchOrder(orderId)}
        />
      </div>
    )
  }

  const typedOrder = order as PurchaseOrderDetail
  const totalAmount = typedOrder.total_amount ?? 0
  const paidAmount = typedOrder.totalPaid ?? 0
  const balanceDue = typedOrder.pendingAmount ?? 0
  const paymentProgress = typedOrder.paymentProgressPercent ?? 0

  const isPaid = ['completed', 'paid'].includes(typedOrder.status?.toLowerCase() || '')
  const isCancelled = typedOrder.status?.toLowerCase() === 'cancelled'

  return (
    <div className='mx-auto w-full max-w-container-max flex flex-col gap-lg animate-in fade-in duration-150'>
      <PageHeader
        breadcrumb={t('purchasePaymentsMvp.title', 'Pagos de compras')}
        title={t('purchasePaymentsMvp.detail.title', 'Detalle de Compra')}
        subtitle={`${t('purchasePaymentsMvp.table.id', 'ID')} #${typedOrder.id} • ${typedOrder.issue_date ? new Date(typedOrder.issue_date).toLocaleDateString() : '-'}`}
        actions={
          <div className='flex flex-wrap gap-sm'>
            <Button variant='outline' onClick={() => navigate(-1)}>
              <ArrowLeft size={14} className='mr-2' aria-hidden='true' /> {t('purchasePaymentsMvp.actions.back', 'Volver')}
            </Button>
            <Button variant='outline' onClick={() => fetchOrder(orderId)}>
              <RefreshCw size={14} className='mr-2' aria-hidden='true' /> {t('purchasePaymentsMvp.actions.refresh', 'Actualizar')}
            </Button>
            {!isPaid && (
              <Button variant='primary' onClick={() => setRegisterModalOpen(true)}>
                <DollarSign size={14} className='mr-2' aria-hidden='true' /> {t('purchasePaymentsMvp.actions.registerPayment', 'Registrar pago')}
              </Button>
            )}
            {!isCancelled && (
              <Button variant='outline' onClick={handleCancelOrder} disabled={isCancelling} className='border-error text-error hover:bg-error-container hover:text-on-error-container'>
                <Ban size={14} className='mr-2' aria-hidden='true' /> {t('purchasePaymentsMvp.actions.cancelOrder', 'Anular orden')}
              </Button>
            )}
          </div>
        }
      />

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-lg'>
        {/* Left Column */}
        <div className='lg:col-span-8 space-y-lg'>
          {/* Status Card */}
          <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
            <div className='p-sm bg-surface-muted border-b border-border-subtle flex justify-center'>
              <div className='px-md py-1 rounded-full bg-surface border border-border-subtle shadow-whisper flex items-center gap-sm text-body-sm-bold text-foreground'>
                {getStatusBadge(typedOrder.status)}
                <span className='text-outline-fg'>·</span>
                <span className='text-body-sm text-on-surface-deep'>{typedOrder.status}</span>
              </div>
            </div>
            <div className='p-lg'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg'>
                <div className='space-y-1'>
                  <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.table.supplier', 'Proveedor')}</p>
                  <p className='text-body-md-bold text-foreground truncate'>{typedOrder.supplier?.name}</p>
                  <p className='text-body-sm text-on-surface-deep font-data-mono'>
                    {t('purchasePaymentsMvp.detail.supplierId', 'ID: #{id}', { id: typedOrder.supplier?.id || '---' })}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.detail.supplier.contact', 'Contacto')}</p>
                  <p className='text-body-md-bold text-foreground'>{typedOrder.supplier?.contact || 'N/A'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.detail.supplier.address', 'Dirección')}</p>
                  <div className='flex items-center gap-sm text-body-md-bold text-foreground truncate'>
                    <MapPin size={14} className='text-outline-fg shrink-0' aria-hidden='true' />
                    {typedOrder.supplier?.address?.street || t('purchasePaymentsMvp.detail.noAddress', 'Sin dirección')}
                  </div>
                </div>
                <div className='space-y-1'>
                  <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.detail.currency', 'Moneda')}</p>
                  <div className='flex items-center gap-sm text-body-md-bold text-foreground font-data-mono'>
                    <Coins size={14} className='text-outline-fg' aria-hidden='true' /> {typedOrder.currency || 'PYG'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Items Table */}
          <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
            <div className='bg-surface-muted border-b border-border-subtle p-lg flex flex-row items-center justify-between'>
              <div>
                <h2 className='text-title-md text-foreground'>
                  {t('purchasePaymentsMvp.detail.products.title', 'Productos incluidos')}
                </h2>
                <p className='text-body-sm text-on-surface-deep'>
                  {t('purchasePaymentsMvp.detail.products.subtitle', 'Detalle de mercadería recibida')}
                </p>
              </div>
              <Badge variant='secondary'>
                {t('purchasePaymentsMvp.detail.products.count', '{count} Ítems', { count: typedOrder.items?.length || 0 })}
              </Badge>
            </div>
            <div>
              {!typedOrder.items || typedOrder.items.length === 0 ? (
                <div className='py-xl text-center'>
                  <Package size={44} className='mx-auto mb-md text-outline-fg' aria-hidden='true' />
                  <p className='text-body-md text-on-surface-deep'>
                    {t('purchasePaymentsMvp.detail.products.empty', 'No hay productos asociados a esta orden.')}
                  </p>
                </div>
              ) : (
                <>
                  <div className='hidden md:block overflow-x-auto'>
                    <Table>
                      <TableHeader className='bg-surface-muted'>
                        <TableRow className='hover:bg-surface-muted border-0'>
                          <TableHead className={`${headClass} py-md px-lg`}>{t('purchasePaymentsMvp.detail.products.headers.description', 'Descripción')}</TableHead>
                          <TableHead className={`${headClass} text-center`}>{t('purchasePaymentsMvp.detail.products.headers.quantity', 'Cantidad')}</TableHead>
                          <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.detail.products.headers.priceWithoutTax', 'Precio s/IVA')}</TableHead>
                          <TableHead className={`${headClass} text-right`}>{t('purchasePaymentsMvp.detail.products.headers.tax', 'IVA')}</TableHead>
                          <TableHead className={`${headClass} text-right px-lg`}>{t('purchasePaymentsMvp.detail.products.headers.total', 'Total')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typedOrder.items.map((item: OrderItem, idx: number) => {
                          const unitPriceWoTax = item.unit_price_without_tax ?? item.unitPrice
                          const taxAmount = item.tax_amount ?? 0
                          const lineTotal = item.total_line_with_tax ?? item.total
                          return (
                            <TableRow key={idx} className='hover:bg-surface-muted transition-colors duration-150'>
                              <TableCell className='py-md px-lg'>
                                <div className='flex flex-col'>
                                  <span className='text-body-md-bold text-foreground'>{item.name}</span>
                                  {item.sku && (
                                    <span className='text-body-sm text-outline-fg font-data-mono mt-0.5'>
                                      {t('purchasePaymentsMvp.detail.products.labels.sku', 'Código: {code}', { code: item.sku })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className='text-center text-data-mono font-data-mono text-on-surface-deep'>
                                ×{item.quantity}
                              </TableCell>
                              <TableCell className='text-right text-data-mono font-data-mono text-on-surface-deep'>
                                {currencyFormatter.format(unitPriceWoTax ?? 0)}
                              </TableCell>
                              <TableCell className='text-right text-data-mono font-data-mono text-outline-fg'>
                                {taxAmount > 0 ? currencyFormatter.format(taxAmount ?? 0) : '-'}
                              </TableCell>
                              <TableCell className='text-right text-data-mono font-data-mono text-primary px-lg'>
                                {currencyFormatter.format(lineTotal ?? 0)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className='md:hidden divide-y divide-border-subtle'>
                    {typedOrder.items.map((item: OrderItem, idx: number) => {
                      const unitPriceWoTax = item.unit_price_without_tax ?? item.unitPrice
                      const taxAmount = item.tax_amount ?? 0
                      const lineTotal = item.total_line_with_tax ?? item.total
                      return (
                        <div key={idx} className='p-lg space-y-md'>
                          <div className='flex justify-between items-start gap-md'>
                            <span className='text-body-md-bold text-foreground leading-tight'>{item.name}</span>
                            <Badge variant='secondary' className='font-data-mono shrink-0'>×{item.quantity}</Badge>
                          </div>
                          <div className='grid grid-cols-2 gap-md p-md bg-surface-muted rounded-md border border-border-subtle'>
                            <div className='space-y-1'>
                              <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.detail.products.headers.priceWithoutTax', 'Precio s/IVA')}</p>
                              <p className='text-data-mono font-data-mono text-foreground'>{currencyFormatter.format(unitPriceWoTax ?? 0)}</p>
                            </div>
                            <div className='space-y-1 text-right'>
                              <p className='text-label-caps uppercase text-outline-fg'>{t('purchasePaymentsMvp.detail.products.headers.tax', 'IVA')}</p>
                              <p className='text-data-mono font-data-mono text-on-surface-deep'>{taxAmount > 0 ? currencyFormatter.format(taxAmount ?? 0) : '-'}</p>
                            </div>
                            <div className='col-span-2 pt-sm border-t border-border-subtle mt-1 flex justify-between items-center'>
                              <span className='text-label-caps uppercase text-on-surface-deep'>{t('purchasePaymentsMvp.detail.products.headers.total', 'Total')}</span>
                              <span className='text-title-md text-primary font-data-mono text-data-mono'>{currencyFormatter.format(lineTotal ?? 0)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              <div className='bg-surface-muted p-lg flex justify-end items-center border-t border-border-subtle'>
                <div className='text-right'>
                  <p className='text-body-md text-on-surface-deep mb-0.5'>{t('purchasePaymentsMvp.detail.orderTotal', 'Total Orden')}</p>
                  <h3 className='text-title-md text-primary font-data-mono text-data-mono tracking-tight leading-none'>
                    {currencyFormatter.format(totalAmount)}
                  </h3>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className='lg:col-span-4 space-y-lg'>
          {/* Totals Card */}
          <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
            <div className='bg-surface-muted border-b border-border-subtle p-lg'>
              <h2 className='text-title-md text-foreground'>
                {t('purchasePaymentsMvp.detail.summary.title', 'Resumen de la orden')}
              </h2>
            </div>
            <div className='p-lg space-y-md'>
              <div className='flex justify-between items-center'>
                <p className='text-label-caps uppercase text-muted-foreground'>{t('purchasePaymentsMvp.detail.summary.paid', 'Monto abonado')}</p>
                <p className='text-data-mono font-data-mono text-success'>{currencyFormatter.format(paidAmount)}</p>
              </div>
              <div className='flex justify-between items-center'>
                <p className='text-label-caps uppercase text-muted-foreground'>{t('purchasePaymentsMvp.detail.summary.pending', 'Saldo pendiente')}</p>
                <p className='text-data-mono font-data-mono text-error'>{currencyFormatter.format(Number(balanceDue) || 0)}</p>
              </div>
              <div className='pt-md border-t border-border-subtle'>
                <div className='flex justify-between text-label-caps uppercase text-muted-foreground mb-sm'>
                  <span>{t('purchasePaymentsMvp.detail.summary.progress', 'Progreso del pago')}</span>
                  <span className='font-data-mono text-foreground'>{paymentProgress}%</span>
                </div>
                <div className='h-2 w-full bg-surface-muted rounded-full overflow-hidden'>
                  <div
                    className={`h-full transition-colors duration-150 ${paymentProgress >= 100 ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Payments History */}
          <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
            <div className='bg-surface-muted border-b border-border-subtle p-lg'>
              <h2 className='text-title-md text-foreground'>
                {t('purchasePaymentsMvp.detail.history.title', 'Historial de pagos')}
              </h2>
              <p className='text-body-sm text-on-surface-deep'>
                {t('purchasePaymentsMvp.detail.history.subtitle', 'Registros de tesorería')}
              </p>
            </div>
            <div>
              {!typedOrder.payments || typedOrder.payments.length === 0 ? (
                <div className='py-lg text-center text-body-md text-on-surface-deep'>
                  {t('purchasePaymentsMvp.detail.history.empty', 'No hay pagos registrados todavía.')}
                </div>
              ) : (
                <div className='divide-y divide-border-subtle'>
                  {typedOrder.payments.map((p, idx: number) => (
                    <div key={idx} className='p-md hover:bg-surface-muted transition-colors duration-150'>
                      <div className='flex justify-between items-start mb-sm'>
                        <div className='flex items-center gap-md'>
                          <div className='size-8 rounded-sm bg-success/10 text-success flex items-center justify-center border border-success/20'>
                            <CheckCircle size={16} aria-hidden='true' />
                          </div>
                          <div>
                            <p className='text-body-md-bold text-foreground'>
                              {t('purchasePaymentsMvp.detail.history.entryTitle', 'Pago Realizado')}
                            </p>
                            <p className='text-body-sm text-outline-fg font-data-mono'>
                              {p.registered_at ? new Date(p.registered_at).toLocaleDateString() : '-'}
                            </p>
                          </div>
                        </div>
                        <p className='text-data-mono font-data-mono text-success'>
                          -{currencyFormatter.format(p.amount ?? 0)}
                        </p>
                      </div>
                      {p.notes && (
                        <p className='mt-md text-body-sm text-on-surface-deep bg-surface-muted p-md rounded-md border border-border-subtle'>
                          "{p.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <RegisterPaymentModal
        open={isRegisterModalOpen}
        onOpenChange={setRegisterModalOpen}
        order={{ id: typedOrder.id, pendingAmount: typedOrder.pendingAmount as number | null, currency: typedOrder.currency || 'PYG', supplierName: typedOrder.supplier?.name, supplierId: typedOrder.supplier?.id, priority: typedOrder.priority ?? null }}
        onSubmit={handlePaymentSubmit}
      />

      {/* CANCEL ORDER MODAL */}
      <EnhancedModal
        isOpen={showCancelPreview && !!cancelPreviewData}
        onClose={() => setShowCancelPreview(false)}
        title={t('purchases.cancel.title', '¿Anular esta orden?')}
        variant='error'
        size='sm'
        footer={
          <div className='flex justify-end gap-sm w-full'>
            <Button variant='secondary' onClick={() => setShowCancelPreview(false)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button variant='destructive' onClick={handleConfirmCancellation} disabled={isCancelling}>
              {t('purchases.cancel.confirm', 'Sí, Anular')}
            </Button>
          </div>
        }
      >
        <div className='space-y-md'>
          <p className='text-body-md text-on-surface-deep'>
            {t('purchases.cancel.body', 'Esta acción afectará los saldos con {supplier}.', {
              supplier: typedOrder.supplier?.name || t('purchasePaymentsMvp.cancel.fallbackSupplier', 'el proveedor'),
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
                    amount: currencyFormatter.format(cancelPreviewData.impact_analysis.total_to_reverse || 0),
                  })}
                </li>
              </ul>
            </div>
          )}
        </div>
      </EnhancedModal>
    </div>
  )
}

export default PurchasePaymentDetailPage
