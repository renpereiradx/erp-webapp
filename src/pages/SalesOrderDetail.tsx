/**
 * SalesOrderDetail Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for Mobile/Tablet with Items Card View
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Calendar,
  User,
  Clock,
  CreditCard,
  FileText,
  Package,
  History,
  Receipt,
  RefreshCw,
  Phone,
  CircleDollarSign,
  ArrowUpRight,
  MoreVertical,
  Download,
  Coins,
  Wallet,
  Calculator,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import { SaleEnhancedResponse } from '@/types'

const SalesOrderDetail = () => {
  const { saleId } = useParams<{ saleId: string }>()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { error: showError, success: showSuccess } = useToast()

  const [sale, setSale] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false)

  const loadSale = useCallback(async () => {
    if (!saleId || saleId === 'undefined') return
    setLoading(true)
    setError(null)
    try {
      const saleResponse = await saleService.getSaleById(saleId)
      if (!saleResponse.success) {
        setError('Venta no encontrada')
        return
      }

      // Handle both flat structure and nested { sale: {...}, details: [...] }
      const fullData = saleResponse.data || {}
      const saleHeader = fullData.sale || fullData
      const saleItems = fullData.details || fullData.items || []

      let paymentStatus = null
      try {
        const paymentResponse = await saleService.getSalePaymentStatus(saleId)
        if (paymentResponse.success) {
          paymentStatus = paymentResponse.data
        }
      } catch (err) {
        console.info('ℹ️ Usando fallback para estado de pago (Backend inestable)')
      }

      let clientDetails = null
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
      setError(err.message || 'Error loading sale')
      showError('Error de carga')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])

  useEffect(() => { loadSale() }, [loadSale])

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess('Pago registrado exitosamente')
      await loadSale()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error
    }
  }

  const formatCurrency = useCallback(amount => {
    const code = normalizeCurrencyCode(sale?.currency)
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    }).format(amount || 0)
  }, [lang, sale?.currency])

  const getStatusColor = (status) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return 'bg-success text-success'
    if (s === 'partial' || s === 'partial_payment') return 'bg-info text-info'
    if (s === 'cancelled') return 'bg-error text-error'
    return 'bg-warning text-warning'
  }

  const items = sale?.items || []
  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? sale?.amount_paid ?? 0
  const balanceDue = sale?.balance_due ?? Math.max(totalAmount - paidAmount, 0)
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  if (loading) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Detalle...</p></div>
  if (error || !sale) return <div className="h-[70vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error || 'Venta no encontrada'} onRetry={loadSale} /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-fluent-2">
            <Receipt size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">Detalle de Venta</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">
              Orden #{sale?.id || '—'} • {sale?.date ? new Date(sale.date).toLocaleDateString() : 'Fecha no disponible'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/cobros-ventas')} className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            <ArrowLeft size={14} className="mr-2" /> Volver
          </Button>
          <Button variant="outline" onClick={loadSale} className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            <RefreshCw size={14} className="mr-2" /> Actualizar
          </Button>
          {sale.status !== 'CANCELLED' && sale.status !== 'PAID' && (
            <Button onClick={() => setIsPaymentModalOpen(true)} className="h-10 px-6 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest rounded shadow-fluent-2">
              <DollarSign size={14} className="mr-2" /> Registrar Cobro
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Info & Items */}
        <div className="lg:col-span-8 space-y-8">
          {/* Status Card */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <div className="p-1 bg-slate-50 border-b border-border-subtle flex justify-center">
                <div className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-border-subtle shadow-sm flex items-center gap-2">
                    <span className={cn("size-2 rounded-full animate-pulse", getStatusColor(sale.status).split(' ')[0])}></span>
                    Estado de la Orden: <span className={cn("font-black", getStatusColor(sale.status).split(' ')[1])}>{sale.status}</span>
                </div>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Cliente</p>
                  <p className="font-bold text-sm text-text-main truncate">{sale.client_name}</p>
                  <p className="text-xs text-text-secondary font-mono">{sale.client_document || 'Sin documento'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Vendedor</p>
                  <p className="font-bold text-sm text-text-main">{sale.user_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Método Pago</p>
                  <div className="flex items-center gap-2 font-bold text-sm text-text-main">
                    <CreditCard size={14} className="text-slate-400" /> {sale.payment_method || 'Efectivo'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Moneda</p>
                  <div className="flex items-center gap-2 font-bold text-sm text-text-main font-mono">
                    <Coins size={14} className="text-slate-400" /> {sale.currency}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase">Productos y Servicios</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Detalle de conceptos facturados</CardDescription>
              </div>
              <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">{items.length} Ítems</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {!items || items.length === 0 ? (
                <div className="py-16 text-center opacity-40">
                  <Package size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-widest">No hay items en esta orden</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-border-subtle">
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-8">Ítem</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Cant.</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Precio s/IVA</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">IVA</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right px-8">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-50">
                        {items.map((item, idx) => {
                          const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                          const taxAmount = item.tax_amount ?? 0
                          const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                          return (
                            <TableRow key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="py-5 px-8">
                                <div className="flex flex-col">
                                    <span className="font-bold text-text-main text-sm">{item.product_name || item.name}</span>
                                    {item.applied_tax_rate !== undefined && (
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">IVA Aplicado: {item.applied_tax_rate}%</span>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-text-secondary text-sm">x{item.quantity || 1}</TableCell>
                              <TableCell className="text-right font-bold text-text-secondary tabular-nums font-mono">{formatCurrency(unitPriceWoTax)}</TableCell>
                              <TableCell className="text-right font-bold text-slate-400 tabular-nums font-mono">{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</TableCell>
                              <TableCell className="text-right font-black text-primary tabular-nums px-8 font-mono">{formatCurrency(totalWithTax)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-border-subtle">
                    {items.map((item, idx) => {
                      const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                      const taxAmount = item.tax_amount ?? 0
                      const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                      return (
                        <div key={idx} className="p-6 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-black text-text-main text-sm uppercase tracking-tight leading-tight">
                              {item.product_name || item.name}
                            </span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-text-secondary whitespace-nowrap uppercase tracking-widest">x{item.quantity || 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-border-subtle">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Precio s/IVA</p>
                                <p className="font-bold text-sm tabular-nums font-mono">{formatCurrency(unitPriceWoTax)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">IVA</p>
                                <p className="font-bold text-sm tabular-nums font-mono text-slate-400">{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-200 mt-1 flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-text-secondary tracking-widest">Subtotal con IVA</span>
                                <span className="font-black text-lg text-primary tabular-nums font-mono">{formatCurrency(totalWithTax)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Totals & Payments */}
        <div className="lg:col-span-4 space-y-8">
          {/* Totals Card */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-8 bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Calculator size={120} /></div>
            <CardHeader className="border-b border-white/10 relative z-10">
              <CardTitle className="text-lg font-black tracking-tighter uppercase text-white/90">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Subtotal Neto</p>
                  <p className="text-lg font-bold tabular-nums font-mono">{formatCurrency(sale.total_amount - (sale.tax_amount || 0))}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Impuestos</p>
                  <p className="text-lg font-bold tabular-nums font-mono">+{formatCurrency(sale.tax_amount || 0)}</p>
                </div>
                <div className="pt-6 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Total de Venta</p>
                    <h3 className="text-3xl font-black tabular-nums font-mono tracking-tighter">{formatCurrency(sale.total_amount)}</h3>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status KPI */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardContent className="p-8 space-y-8">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-text-secondary tracking-[0.2em] mb-2">Saldo Pendiente</p>
                        <h2 className={cn(
                            "text-3xl font-black tabular-nums font-mono truncate tracking-tighter",
                            balanceDue > 0 ? "text-error" : "text-success"
                        )}>
                            {formatCurrency(balanceDue)}
                        </h2>
                    </div>
                    <div className={cn(
                        "flex-shrink-0 size-12 rounded-xl flex items-center justify-center shadow-fluent-2",
                        balanceDue > 0 ? "bg-error/10 text-error" : "bg-success/10 text-success"
                    )}>
                        <Wallet size={24} />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary">
                        <span>Progreso de Pago</span>
                        <span>{paymentProgress}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary transition-all duration-1000 shadow-sm" style={{ width: `${paymentProgress}%` }}></div>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Payments History */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6">
              <CardTitle className="text-lg font-black tracking-tighter uppercase">Historial de Cobros</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Pagos parciales recibidos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest">No se registran pagos</div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {payments.map(payment => (
                    <div key={payment.payment_id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-green-50 text-success flex items-center justify-center border border-green-100"><CheckCircle size={16} /></div>
                            <div>
                                <p className="font-bold text-sm text-text-main uppercase tracking-tight">Cobro Recibido</p>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{new Date(payment.payment_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="font-black text-success font-mono text-sm">+{formatCurrency(payment.amount_paid)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border-subtle">{payment.payment_method}</Badge>
                        {payment.payment_reference && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border-subtle max-w-[120px] truncate">Ref: {payment.payment_reference}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} sale={{ ...sale, balance_due: balanceDue, currency: sale?.currency || 'PYG' }} onSubmit={handlePaymentSubmit} />
    </div>
  )
}

export default SalesOrderDetail
