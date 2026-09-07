// ===========================================================================
// SalesOrderDetail Page — /cobros-ventas/:saleId
// Design: DESIGN.md (design/tokens.json) — semantic tokens + components ui/
// Logic: saleService / salePaymentService / clientService (unchanged)
// i18n: useI18n() (ES/EN — ES keys in src/lib/i18n/locales/es/sales.js)
// ===========================================================================

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Package,
  Receipt,
  RefreshCw,
  ChevronRight,
  Coins,
  Wallet,
  Calculator,
  CheckCircle,
  DollarSign,
  Ban,
} from 'lucide-react'
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
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import SaleFiscalPanel from '@/features/fiscal/components/SaleFiscalPanel'
import CancelSaleModal from '@/features/fiscal/components/CancelSaleModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import ToastContainer from '@/components/ui/ToastContainer'

const SalesOrderDetail = () => {
  const { saleId } = useParams<{ saleId: string }>()
  const navigate = useNavigate()
  const { lang, t } = useI18n()
  const { error: showError, success: showSuccess, toasts, removeToast } = useToast()
  const { hasPermission } = useAuth()

  // Detalle acotado (perfil vendedor puro): lo que cobra, anula o fiscaliza
  // se gatea por permiso — el vendedor ve venta (cliente, productos, totales),
  // el cajero además cobros (cash:write) y los roles avanzados anulación.
  const canCollect = hasPermission('cash:write')
  const canCancelSale = hasPermission('sales:cancel')
  const canSeeFiscal = hasPermission('sifen:read')

  const [sale, setSale] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false)
  const [showCancelPreview, setShowCancelPreview] = useState(false)
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const loadSale = useCallback(async () => {
    if (!saleId || saleId === 'undefined') return
    setLoading(true)
    setError(null)
    try {
      const saleResponse = await saleService.getSaleById(saleId)
      if (!saleResponse.success) {
        setError(t('sales.detail.notFound', 'Venta no encontrada'))
        return
      }

      // Handle both flat structure and nested { sale: {...}, details: [...] }
      const fullData = saleResponse.data || {}
      const saleHeader = fullData.sale || fullData
      const saleItems = fullData.details || fullData.items || []

      let paymentStatus: any = null
      try {
        const paymentResponse = await saleService.getSalePaymentStatus(saleId)
        if (paymentResponse.success) {
          paymentStatus = paymentResponse.data
        }
      } catch (err) {
        console.info('ℹ️ Usando fallback para estado de pago (Backend inestable)')
      }

      let clientDetails: any = null
      try {
        const clientId =
          saleHeader.client_id || (paymentStatus && paymentStatus.client_id)
        if (clientId) clientDetails = await clientService.getById(clientId)
      } catch (err) {
        console.warn('Client fetch error', err)
      }

      // Calcular balance basado en la información disponible
      const totalAmount = saleHeader.total_amount || 0
      const totalPaid = (paymentStatus && paymentStatus.total_paid) || 0
      const balanceDue =
        paymentStatus && paymentStatus.balance_due !== undefined
          ? paymentStatus.balance_due
          : Math.max(0, totalAmount - totalPaid)

      let correctedStatus =
        saleHeader.status ||
        (paymentStatus &&
          (paymentStatus.status || paymentStatus.payment_status)) ||
        'PENDING'
      if (
        balanceDue === 0 &&
        (correctedStatus === 'PARTIAL_PAYMENT' ||
          correctedStatus === 'PARTIAL' ||
          correctedStatus === 'PENDING')
      ) {
        correctedStatus = 'PAID'
      }

      setSale({
        ...saleHeader,
        ...(paymentStatus || {}),
        id: saleHeader.sale_id || saleHeader.id,
        status: correctedStatus,
        balance_due: balanceDue,
        items: saleItems,
        user_name:
          saleHeader.user_name ||
          (paymentStatus && paymentStatus.user_name) ||
          'Vendedor',
        client_name:
          saleHeader.client_name ||
          (paymentStatus && paymentStatus.client_name) ||
          (clientDetails && clientDetails.name) ||
          'Cliente',
        client_document:
          (clientDetails && clientDetails.document_id) ||
          (paymentStatus &&
            paymentStatus.client &&
            paymentStatus.client.document_id),
        client_contact:
          (clientDetails && clientDetails.contact) ||
          (paymentStatus &&
            paymentStatus.client &&
            paymentStatus.client.contact),
        date:
          saleHeader.sale_date ||
          saleHeader.date ||
          (paymentStatus && paymentStatus.sale_date),
        currency:
          saleHeader.currency ||
          (paymentStatus && paymentStatus.currency) ||
          'PYG',
      })

      if (paymentStatus?.payments) setPayments(paymentStatus.payments)
    } catch (err: any) {
      console.error('Error in loadSale:', err)
      setError(err.message || t('sales.detail.errorLoad', 'Error al cargar la venta'))
      showError(t('sales.detail.errorLoad', 'Error de carga'))
    } finally {
      setLoading(false)
    }
  }, [saleId, showError, t])

  useEffect(() => { loadSale() }, [loadSale])

  const handleCancelSale = async () => {
    if (!sale) return
    setIsCancelling(true)

    try {
      const previewResult =
        await saleService.previewSaleCancellation(sale.id)
      if (previewResult?.success) {
        setCancelPreviewData(
          previewResult.data || { sale_info: { id: sale.id } },
        )
      } else {
        setCancelPreviewData({ sale_info: { id: sale.id } })
      }
    } catch {
      setCancelPreviewData({ sale_info: { id: sale.id } })
    } finally {
      setIsCancelling(false)
      setShowCancelPreview(true)
    }
  }

  /**
   * Confirmación de anulación (FE4.1): el motivo es la justificativa del
   * evento de cancelación SIFEN (viaja en el body de PUT /sale/{id}).
   * Si el backend responde 409 (DE aprobado fuera de plazo legal 48 h/168 h),
   * el mensaje del servidor se muestra tal cual (guía a NCE/trámite).
   */
  const handleConfirmCancellation = async (motivo: string) => {
    if (!sale) return
    setIsCancelling(true)
    setShowCancelPreview(false)
    try {
      const result = await saleService.revertSale(
        sale.id,
        motivo.trim() || 'ANULADO_DESDE_DETALLE_COBROS_VENTAS'
      )
      if (result.success) {
        showSuccess(t('fiscal.cancel.cancelled', 'Venta anulada exitosamente'))
        loadSale()
      } else {
        showError(result.error || t('fiscal.cancel.error', 'No se pudo anular la venta'))
        setShowCancelPreview(true)
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || t('fiscal.cancel.error', 'No se pudo anular la venta'))
      setShowCancelPreview(true)
    } finally {
      setIsCancelling(false)
    }
  }

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(t('sales.detail.paymentSuccess', 'Pago registrado exitosamente'))
      await loadSale()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error
    }
  }

  const formatCurrency = useCallback((amount: number | string | null | undefined) => {
    const code = normalizeCurrencyCode(sale?.currency)
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    }).format((Number(amount) || 0))
  }, [lang, sale?.currency])

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return 'bg-success text-success'
    if (s === 'partial' || s === 'partial_payment') return 'bg-warning text-warning'
    if (s === 'cancelled') return 'bg-error text-error'
    return 'bg-secondary text-secondary'
  }

  const items = sale?.items || []
  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? sale?.amount_paid ?? 0
  const balanceDue = sale?.balance_due ?? Math.max(totalAmount - paidAmount, 0)
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0
  // IVA liquidado por el backend (snapshots por línea). El header no trae
  // tax_amount: se suma el de las líneas; fallback al campo legacy.
  const totalTax =
    items.reduce((acc: number, it: any) => acc + (Number(it.tax_amount) || 0), 0) ||
    Number(sale?.tax_amount) ||
    0

  if (loading)
    return (
      <div className='flex flex-col items-center justify-center h-[70vh] gap-4'>
        <RefreshCw className='w-10 h-10 animate-spin text-primary opacity-20' />
        <p className='text-label-caps uppercase text-muted-foreground'>
          {t('sales.detail.loading', 'Cargando Detalle...')}
        </p>
      </div>
    )
  if (error || !sale)
    return (
      <div className='h-[70vh] flex items-center justify-center'>
        <DataState variant='error' title={t('common.error', 'Error')} message={error || t('sales.detail.notFound', 'Venta no encontrada')} onRetry={loadSale} testId='detail-error' />
      </div>
    )

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-xl'>
        {/* Header */}
        <header className='flex flex-col md:flex-row md:items-start justify-between gap-md border-l-4 border-primary pl-4'>
          <div className='flex items-center gap-md'>
            <div className='size-12 bg-primary/10 rounded-md flex items-center justify-center text-primary'>
              <Receipt size={24} />
            </div>
            <div>
              <h1 className='text-headline-lg text-foreground leading-none'>
                {t('sales.detail.title', 'Detalle de Venta')}
              </h1>
              <p className='text-body-md text-muted-foreground'>
                {t('sales.detail.orderLine', { id: sale?.id || '—' })} •{' '}
                {sale?.date
                  ? new Date(sale.date).toLocaleDateString()
                  : t('sales.detail.noDate', 'Fecha no disponible')}
              </p>
            </div>
          </div>
          <div className='flex flex-wrap gap-sm'>
            <Button variant='outline' size='sm' onClick={() => navigate(-1)}>
              <ArrowLeft size={14} className='mr-1.5' />
              {t('action.back', 'Volver')}
            </Button>
            <Button variant='outline' size='sm' onClick={loadSale}>
              <RefreshCw size={14} className='mr-1.5' />
              {t('action.update', 'Actualizar')}
            </Button>
            {canCollect && sale.status !== 'CANCELLED' && sale.status !== 'PAID' && (
              <Button variant='primary' onClick={() => setIsPaymentModalOpen(true)}>
                <DollarSign size={14} className='mr-1.5' />
                {t('sales.cobros.action.payment', 'Registrar Cobro')}
              </Button>
            )}
            {canCancelSale && sale.status !== 'CANCELLED' && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleCancelSale}
                disabled={isCancelling}
                className='text-error border-error hover:bg-error/10'
              >
                <Ban size={14} className='mr-1.5' />
                {t('sales.cobros.action.cancel', 'Anular Venta')}
              </Button>
            )}
          </div>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-lg'>
          {/* Left Column: Info & Items */}
          <div className='lg:col-span-8 space-y-xl'>
            {/* Status Card */}
            <div className='bg-surface rounded-md shadow-whisper overflow-hidden'>
              <div className='p-sm bg-surface-muted border-b border-border-subtle flex justify-center'>
                <div className='px-md py-xs rounded-full text-label-caps uppercase bg-surface border border-border-subtle shadow-whisper flex items-center gap-2'>
                  <span className={cn('size-2 rounded-full animate-pulse', getStatusColor(sale.status).split(' ')[0])} />
                  {t('sales.detail.statusLine', 'Estado de la Orden:')}{' '}
                  <span className={cn('font-black', getStatusColor(sale.status).split(' ')[1])}>{sale.status}</span>
                </div>
              </div>
              <div className='p-lg'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg'>
                  <div className='space-y-xs'>
                    <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.customer', 'Información del Cliente')}</p>
                    <p className='text-body-md-bold text-foreground truncate'>{sale.client_name}</p>
                    <p className='text-body-md text-muted-foreground font-data-mono'>{sale.client_document || t('sales.detail.noDocument', 'Sin documento')}</p>
                  </div>
                  <div className='space-y-xs'>
                    <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.seller', 'Vendedor')}</p>
                    <p className='text-body-md-bold text-foreground'>{sale.user_name}</p>
                  </div>
                  {canCollect && (
                    <div className='space-y-xs'>
                      <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.paymentMethod', 'Método de Pago')}</p>
                      <div className='flex items-center gap-2 text-body-md-bold text-foreground'>
                        <CreditCard size={14} className='text-muted-foreground' /> {sale.payment_method || t('sales.detail.defaultPayment', 'Efectivo')}
                      </div>
                    </div>
                  )}
                  <div className='space-y-xs'>
                    <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.currency', 'Moneda')}</p>
                    <div className='flex items-center gap-2 text-body-md-bold text-foreground font-data-mono'>
                      <Coins size={14} className='text-muted-foreground' /> {sale.currency}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className='bg-surface rounded-md shadow-whisper overflow-hidden'>
              <div className='bg-surface-muted border-b border-border-subtle p-md flex flex-row items-center justify-between'>
                <div>
                  <div className='text-title-md text-foreground tracking-tight'>
                    {t('sales.detail.itemsTitle', 'Productos y Servicios')}
                  </div>
                  <div className='text-body-sm-bold text-muted-foreground'>
                    {t('sales.detail.itemsSubtitle', 'Detalle de conceptos facturados')}
                  </div>
                </div>
                <Badge variant='secondary' size='sm'>
                  {t('sales.detail.itemsCount', { count: items.length })}
                </Badge>
              </div>
              <div className='p-0'>
                {!items || items.length === 0 ? (
                  <div className='py-16 text-center'>
                    <Package size={48} className='mx-auto mb-md text-muted-foreground/40' />
                    <p className='text-label-caps uppercase text-muted-foreground'>
                      {t('sales.detail.noItems', 'No hay items en esta orden')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className='hidden md:block overflow-x-auto'>
                      <Table>
                        <TableHeader className='bg-surface-muted'>
                          <TableRow className='border-b border-border-subtle'>
                            <TableHead className='text-label-caps uppercase text-muted-foreground py-4 px-lg'>
                              {t('sales.detail.colItem', 'Ítem')}
                            </TableHead>
                            <TableHead className='text-label-caps uppercase text-muted-foreground text-center'>
                              {t('sales.detail.quantityShort', 'Cant.')}
                            </TableHead>
                            <TableHead className='text-label-caps uppercase text-muted-foreground text-right'>
                              {t('sales.detail.colUnitPrice', 'Precio s/IVA')}
                            </TableHead>
                            <TableHead className='text-label-caps uppercase text-muted-foreground text-right'>
                              {t('sales.detail.colTax', 'IVA')}
                            </TableHead>
                            <TableHead className='text-label-caps uppercase text-muted-foreground text-right px-lg'>
                              {t('sales.detail.colTotal', 'Total')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, idx) => {
                            const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                            const taxAmount = item.tax_amount ?? 0
                            const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                            return (
                              <TableRow key={item.id || idx} className='hover:bg-surface-muted transition-colors duration-150'>
                                <TableCell className='py-5 px-lg'>
                                  <div className='flex flex-col'>
                                    <span className='text-body-md-bold text-foreground'>{item.product_name || item.name}</span>
                                    {item.variant_name && (
                                      <span className='text-body-md text-muted-foreground mt-0.5'>{item.variant_name}</span>
                                    )}
                                    {item.applied_tax_rate !== undefined && (
                                      <span className='text-label-caps text-muted-foreground mt-xs'>
                                        {t('sales.detail.taxApplied', { rate: item.applied_tax_rate })}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className='text-center text-body-md text-muted-foreground'>x{item.quantity || 1}</TableCell>
                                <TableCell className='text-right font-data-mono text-data-mono text-muted-foreground'>{formatCurrency(unitPriceWoTax)}</TableCell>
                                <TableCell className='text-right font-data-mono text-data-mono text-muted-foreground'>{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</TableCell>
                                <TableCell className='text-right text-data-mono font-data-mono text-primary px-lg'>{formatCurrency(totalWithTax)}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className='md:hidden divide-y divide-border-subtle'>
                      {items.map((item, idx) => {
                        const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                        const taxAmount = item.tax_amount ?? 0
                        const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                        return (
                          <div key={idx} className='p-md space-y-md'>
                            <div className='flex justify-between items-start gap-md'>
                              <div className='flex flex-col'>
                                <span className='font-data-mono text-data-mono text-foreground uppercase tracking-tight leading-tight'>
                                  {item.product_name || item.name}
                                </span>
                                {item.variant_name && (
                                  <span className='text-body-md text-muted-foreground mt-xs leading-tight'>{item.variant_name}</span>
                                )}
                              </div>
                              <span className='bg-surface-muted px-sm py-xs rounded text-label-caps text-muted-foreground whitespace-nowrap uppercase'>
                                x{item.quantity || 1} {item.unit || ''}
                              </span>
                            </div>
                            <div className='grid grid-cols-2 gap-sm p-md bg-surface-muted rounded-md border border-border-subtle'>
                              <div className='space-y-xs'>
                                <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.colUnitPrice', 'Precio s/IVA')}</p>
                                <p className='text-body-md-bold font-data-mono text-data-mono'>{formatCurrency(unitPriceWoTax)}</p>
                              </div>
                              <div className='space-y-xs text-right'>
                                <p className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.colTax', 'IVA')}</p>
                                <p className='text-body-md-bold font-data-mono text-data-mono text-muted-foreground'>{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</p>
                              </div>
                              <div className='col-span-2 pt-sm border-t border-border-subtle mt-xs flex justify-between items-center'>
                                <span className='text-label-caps uppercase text-muted-foreground'>{t('sales.detail.subtotalWithTax', 'Subtotal con IVA')}</span>
                                <span className='text-title-md font-data-mono text-data-mono text-primary'>{formatCurrency(totalWithTax)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Totals & Payments */}
          <div className='lg:col-span-4 space-y-xl'>
            {/* Totals Card */}
            <div className='bg-primary text-primary-foreground rounded-md shadow-fluent-8 overflow-hidden relative'>
              <div className='absolute top-0 right-0 p-lg opacity-10'><Calculator size={120} /></div>
              <div className='border-b border-primary-foreground/10 relative z-10 p-md'>
                <div className='text-title-md font-black tracking-tight uppercase text-primary-foreground/90'>
                  {t('sales.detail.summary', 'Resumen Financiero')}
                </div>
              </div>
              <div className='p-lg space-y-xl relative z-10'>
                <div className='space-y-lg'>
                  <div className='flex justify-between items-center'>
                    <p className='text-label-caps uppercase tracking-widest text-primary-foreground/60'>{t('sales.detail.subtotal', 'Subtotal Neto')}</p>
                    <p className='text-body-lg font-bold font-data-mono text-data-mono text-primary-foreground'>{formatCurrency(totalAmount - totalTax)}</p>
                  </div>
                  <div className='flex justify-between items-center'>
                    <p className='text-label-caps uppercase tracking-widest text-primary-foreground/60'>{t('sales.detail.tax', 'Total Impuestos')}</p>
                    <p className='text-body-lg font-bold font-data-mono text-data-mono text-primary-foreground'>+{formatCurrency(totalTax)}</p>
                  </div>
                  <div className='pt-lg border-t border-primary-foreground/20 flex justify-between items-end'>
                    <div>
                      <p className='text-label-caps uppercase tracking-widest text-primary-foreground/60 mb-xs'>{t('sales.detail.totalAmount', 'Total de Venta')}</p>
                      <h3 className='text-headline-lg font-data-mono text-data-mono text-primary-foreground tracking-tighter'>{formatCurrency(totalAmount)}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status KPI — solo roles de cobranza (cash:write) */}
            {canCollect && (
              <div className='bg-surface rounded-md shadow-whisper overflow-hidden'>
                <div className='p-lg space-y-xl'>
                  <div className='flex justify-between items-start gap-md'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-label-caps uppercase text-muted-foreground mb-sm'>{t('sales.detail.balanceDue', 'Saldo Pendiente')}</p>
                      <h2 className={cn(
                        'text-headline-lg font-data-mono text-data-mono truncate tracking-tighter',
                        balanceDue > 0 ? 'text-error' : 'text-success'
                      )}>
                        {formatCurrency(balanceDue)}
                      </h2>
                    </div>
                    <div className={cn(
                      'shrink-0 size-12 rounded-md flex items-center justify-center shadow-whisper',
                      balanceDue > 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                    )}>
                      <Wallet size={24} />
                    </div>
                  </div>

                  <div className='space-y-sm pt-md border-t border-border-subtle'>
                    <div className='flex justify-between text-label-caps uppercase text-muted-foreground tabular-nums'>
                      <span>{t('sales.detail.paymentProgress', 'Progreso de Pago')}</span>
                      <span>{paymentProgress}%</span>
                    </div>
                    <div className='h-2.5 bg-surface-muted rounded-full overflow-hidden'>
                      <div className='h-full bg-primary transition-colors duration-150' style={{ width: `${paymentProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payments History — solo roles de cobranza (cash:write) */}
            {canCollect && (
              <div className='bg-surface rounded-md shadow-whisper overflow-hidden group'>
              <div
                className='bg-surface-muted border-b border-border-subtle p-md cursor-pointer hover:bg-surface-subtle transition-colors duration-150 flex flex-row items-center justify-between space-y-0'
                onClick={() => navigate(`/cobros-ventas/${saleId}/pagos`)}
              >
                <div>
                  <div className='text-title-md text-foreground tracking-tight flex items-center gap-2'>
                    {t('sales.detail.paymentHistory', 'Historial de Cobros')}
                    <ChevronRight size={18} className='text-primary opacity-0 group-hover:opacity-100 transition-all duration-150' />
                  </div>
                  <div className='text-body-sm-bold text-muted-foreground'>
                    {t('sales.detail.historySubtitle', 'Pagos parciales recibidos')}
                  </div>
                </div>
                <Button variant='ghost' size='sm' className='text-label-caps uppercase text-primary border border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-colors duration-150'>
                  {t('sales.cobros.action.details', 'Ver Detalles')}
                </Button>
              </div>
              <div className='p-0'>
                {payments.length === 0 ? (
                  <div className='py-12 text-center text-label-caps uppercase text-muted-foreground'>
                    {t('sales.detail.noPayments', 'No se registran pagos')}
                  </div>
                ) : (
                  <div className='divide-y divide-border-subtle'>
                    {payments.map(payment => (
                      <div key={payment.payment_id} className='p-md hover:bg-surface-muted transition-colors duration-150'>
                        <div className='flex justify-between items-start mb-sm'>
                          <div className='flex items-center gap-md'>
                            <div className='size-8 rounded-md bg-success/10 text-success flex items-center justify-center border border-success/30'><CheckCircle size={16} /></div>
                            <div>
                              <p className='text-body-md-bold text-foreground tracking-tight'>{t('sales.detail.paymentReceived', 'Cobro Recibido')}</p>
                              <p className='text-label-caps uppercase text-muted-foreground'>{new Date(payment.payment_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className='font-data-mono text-data-mono text-success'>+{formatCurrency(payment.amount_paid)}</p>
                        </div>
                        <div className='flex flex-wrap gap-sm mt-sm'>
                          <Badge variant='outline' size='sm' className='text-label-caps uppercase text-muted-foreground border-border-subtle'>{payment.payment_method}</Badge>
                          {payment.payment_reference && <Badge variant='outline' size='sm' className='text-label-caps uppercase text-muted-foreground border-border-subtle max-w-[120px] truncate'>Ref: {payment.payment_reference}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel fiscal SIFEN (FE3) — complementa el detalle; 404 = branch no fiscal.
            Gateado a sifen:read: el vendedor puro no ve estado fiscal. */}
        {saleId && canSeeFiscal && <SaleFiscalPanel saleId={saleId} saleTotal={Number(totalAmount) || undefined} />}

        <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} sale={{ ...sale, balance_due: balanceDue, currency: sale?.currency || 'PYG' }} onSubmit={handlePaymentSubmit} />

        {/* CANCEL SALE MODAL (FE4.1) — motivo obligatorio + aviso de plazos SIFEN */}
        <CancelSaleModal
          open={showCancelPreview && !!cancelPreviewData}
          onClose={() => setShowCancelPreview(false)}
          sale={sale}
          cancelPreviewData={cancelPreviewData}
          isSubmitting={isCancelling}
          onSubmit={handleConfirmCancellation}
          formatTotal={formatCurrency}
        />
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  )
}

export default SalesOrderDetail
