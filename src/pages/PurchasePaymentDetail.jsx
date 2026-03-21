/**
 * PurchasePaymentDetail Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for Mobile and Tablet with Items Card View
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  RefreshCw,
  User,
  MapPin,
  CircleDollarSign,
  Package,
  History,
  CheckCircle2,
  MoreVertical,
  Printer,
  Share2,
  Building,
  PlusCircle,
  Receipt,
  DollarSign,
  Calculator,
  Coins,
  Wallet,
  CheckCircle
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

const PurchasePaymentDetailPage = () => {
  const { orderId } = useParams()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { success: showSuccess } = useToast()

  const { currentOrder: order, loading, error, fetchOrder, processPayment } = usePurchasePaymentsMvpStore()
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)

  const handlePaymentSubmit = async (paymentData) => {
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
      fetchOrder(orderId)
      showSuccess('Pago registrado exitosamente')
    } catch (err) {
      throw err
    }
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

  const getStatusColor = (status) => {
    const s = status?.toLowerCase()
    if (s === 'paid' || s === 'completed') return 'bg-success text-success'
    if (s === 'partial') return 'bg-info text-info'
    if (s === 'cancelled') return 'bg-error text-error'
    return 'bg-warning text-warning'
  }

  if (loading && !order) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando Detalle...</p></div>
  if (error || !order) return <div className="h-[70vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error || 'No se pudo cargar la orden.'} onRetry={() => fetchOrder(orderId)} /></div>

  const totalAmount = order.total_amount ?? 0
  const paidAmount = order.totalPaid ?? 0
  const balanceDue = order.pendingAmount ?? 0
  const paymentProgress = order.paymentProgressPercent ?? 0

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-fluent-2">
            <Receipt size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">Detalle de Compra</h1>
            <p className="text-text-secondary text-sm font-medium mt-1">Orden #{order.id} • {order.issue_date ? new Date(order.issue_date).toLocaleDateString() : '-'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/pagos-compras')} className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            <ArrowLeft size={14} className="mr-2" /> Volver
          </Button>
          <Button variant="outline" onClick={() => fetchOrder(orderId)} className="h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
            <RefreshCw size={14} className="mr-2" /> Actualizar
          </Button>
          {!['completed', 'paid'].includes(order.status?.toLowerCase()) && (
            <Button onClick={() => setRegisterModalOpen(true)} className="h-10 px-6 bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest rounded shadow-fluent-2">
              <DollarSign size={14} className="mr-2" /> Registrar Pago
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Status Card */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <div className="p-1 bg-slate-50 border-b border-border-subtle flex justify-center">
                <div className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-white border border-border-subtle shadow-sm flex items-center gap-2">
                    <span className={cn("size-2 rounded-full animate-pulse", getStatusColor(order.status).split(' ')[0])}></span>
                    Estado de la Orden: <span className={cn("font-black", getStatusColor(order.status).split(' ')[1])}>{order.status}</span>
                </div>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Proveedor</p>
                  <p className="font-bold text-sm text-text-main truncate">{order.supplier?.name}</p>
                  <p className="text-xs text-text-secondary font-mono">ID: #{order.supplier?.id || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Contacto</p>
                  <p className="font-bold text-sm text-text-main">{order.supplier?.contact || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Dirección</p>
                  <div className="flex items-center gap-2 font-bold text-sm text-text-main truncate">
                    <MapPin size={14} className="text-slate-400 shrink-0" /> {order.supplier?.address?.street || 'Sin dirección'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Moneda</p>
                  <div className="flex items-center gap-2 font-bold text-sm text-text-main font-mono">
                    <Coins size={14} className="text-slate-400" /> {order.currency || 'PYG'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase">Productos en la Orden</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Detalle de mercadería recibida</CardDescription>
              </div>
              <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest">{order.items?.length || 0} Ítems</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {!order.items || order.items.length === 0 ? (
                <div className="py-16 text-center opacity-40">
                  <Package size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-xs font-black uppercase tracking-widest">No hay productos en esta orden</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="border-b border-border-subtle">
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-8">Descripción</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Cant.</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Precio s/IVA</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">IVA</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right px-8">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-50">
                        {order.items.map((item, idx) => {
                          const unitPriceWoTax = item.unit_price_without_tax ?? item.unitPrice
                          const taxAmount = item.tax_amount ?? 0
                          const lineTotal = item.total_line_with_tax ?? item.total
                          return (
                            <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="py-5 px-8">
                                <div className="flex flex-col">
                                    <span className="font-bold text-text-main text-sm">{item.name}</span>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">SKU-{Math.floor(Math.random() * 10000)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-text-secondary text-sm">x{item.quantity}</TableCell>
                              <TableCell className="text-right font-bold text-text-secondary tabular-nums font-mono">{currencyFormatter.format(unitPriceWoTax)}</TableCell>
                              <TableCell className="text-right font-bold text-slate-400 tabular-nums font-mono">{taxAmount > 0 ? currencyFormatter.format(taxAmount) : '-'}</TableCell>
                              <TableCell className="text-right font-black text-primary tabular-nums px-8 font-mono">{currencyFormatter.format(lineTotal)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden divide-y divide-border-subtle">
                    {order.items.map((item, idx) => {
                      const unitPriceWoTax = item.unit_price_without_tax ?? item.unitPrice
                      const taxAmount = item.tax_amount ?? 0
                      const lineTotal = item.total_line_with_tax ?? item.total
                      return (
                        <div key={idx} className="p-6 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-black text-text-main text-sm uppercase tracking-tight leading-tight">{item.name}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black text-text-secondary whitespace-nowrap uppercase tracking-widest">x{item.quantity}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-border-subtle">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Precio s/IVA</p>
                                <p className="font-bold text-sm tabular-nums font-mono">{currencyFormatter.format(unitPriceWoTax)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">IVA</p>
                                <p className="font-bold text-sm tabular-nums font-mono text-slate-400">{taxAmount > 0 ? currencyFormatter.format(taxAmount) : '-'}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-200 mt-1 flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-text-secondary tracking-widest">Subtotal</span>
                                <span className="font-black text-lg text-primary tabular-nums font-mono">{currencyFormatter.format(lineTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
              <div className="bg-slate-50 p-6 flex justify-end items-center border-t border-border-subtle"><div className="text-right"><p className="text-sm font-medium text-slate-600 mb-0.5">Total Orden</p><h3 className="text-xl md:text-2xl font-bold text-primary tabular-nums tracking-tight leading-none">{currencyFormatter.format(totalAmount)}</h3></div></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* Totals Card */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-8 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Calculator size={120} /></div>
            <CardHeader className="border-b border-white/10 relative z-10">
              <CardTitle className="text-lg font-black tracking-tighter uppercase text-white/90">Resumen de Pago</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Total Pagado</p>
                  <p className="text-lg font-bold tabular-nums font-mono text-green-400">{currencyFormatter.format(paidAmount)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Saldo Pendiente</p>
                  <p className="text-lg font-bold tabular-nums font-mono text-primary">{currencyFormatter.format(balanceDue)}</p>
                </div>
                <div className="pt-6 border-t border-white/20">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
                        <span>Progreso</span>
                        <span>{paymentProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${paymentProgress}%` }} />
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments History */}
          <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle p-6">
              <CardTitle className="text-lg font-black tracking-tighter uppercase">Historial de Pagos</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Registros de tesorería</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!order.payments || order.payments.length === 0 ? (
                <div className="py-12 text-center text-text-secondary font-bold italic uppercase text-[10px] tracking-widest">Sin pagos registrados</div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {order.payments.map((p, idx) => (
                    <div key={idx} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-green-50 text-success flex items-center justify-center border border-green-100"><CheckCircle size={16} /></div>
                            <div>
                                <p className="font-bold text-sm text-text-main uppercase tracking-tight">Pago Realizado</p>
                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{new Date(p.registered_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="font-black text-success font-mono text-sm">-{currencyFormatter.format(p.amount)}</p>
                      </div>
                      {p.notes && <p className="mt-3 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-lg border border-border-subtle italic">"{p.notes}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RegisterPaymentModal open={isRegisterModalOpen} onOpenChange={setRegisterModalOpen} order={{ id: order.id, pendingAmount: order.pendingAmount, currency: order.currency, supplierName: order.supplier?.name, supplierId: order.supplier?.id, priority: order.priority }} onSubmit={handlePaymentSubmit} />
    </div>
  )
}

export default PurchasePaymentDetailPage
