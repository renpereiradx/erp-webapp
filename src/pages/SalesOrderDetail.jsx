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
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const SalesOrderDetail = () => {
  const { saleId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { error: showError, success: showSuccess } = useToast()

  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const loadSale = useCallback(async () => {
    if (!saleId || saleId === 'undefined') return
    setLoading(true); setError(null)
    try {
      const paymentStatusResponse = await salePaymentService.getSalePaymentStatus(saleId)
      if (!paymentStatusResponse) { setError('Venta no encontrada'); return }

      let saleDetails = null
      try {
        const clientSalesResponse = await saleService.getSalesByClient(paymentStatusResponse.client_id || paymentStatusResponse.client?.id)
        if (clientSalesResponse?.data) {
          saleDetails = clientSalesResponse.data.find(item => String(item.sale_id || item.id) === String(saleId))
        }
      } catch (err) { console.warn('Details fetch error', err) }

      let clientDetails = null
      try {
        const clientId = paymentStatusResponse.client_id || paymentStatusResponse.client?.id
        if (clientId) clientDetails = await clientService.getById(clientId)
      } catch (err) { console.warn('Client fetch error', err) }

      const balanceDue = paymentStatusResponse.balance_due || 0
      let correctedStatus = paymentStatusResponse.status || paymentStatusResponse.payment_status
      if (balanceDue === 0 && (correctedStatus === 'PARTIAL_PAYMENT' || correctedStatus === 'partial')) correctedStatus = 'PAID'

      setSale({
        ...paymentStatusResponse,
        id: paymentStatusResponse.sale_id || paymentStatusResponse.id,
        status: correctedStatus,
        balance_due: balanceDue,
        items: saleDetails?.details || saleDetails?.items || paymentStatusResponse.items || [],
        user_name: saleDetails?.user_name || paymentStatusResponse.user_name || 'Vendedor',
        client_name: paymentStatusResponse.client_name || paymentStatusResponse.client?.name || clientDetails?.name,
        client_document: clientDetails?.document_id || paymentStatusResponse.client?.document_id,
        client_contact: clientDetails?.contact || paymentStatusResponse.client?.contact,
        date: paymentStatusResponse.issue_date || paymentStatusResponse.sale_date || paymentStatusResponse.date,
        currency: paymentStatusResponse.currency || 'PYG'
      })
      if (paymentStatusResponse.payments) setPayments(paymentStatusResponse.payments)
    } catch (err) { setError(err.message || 'Error loading sale'); showError('Error de carga') } finally { setLoading(false) }
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

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 border-none font-black uppercase text-[9px] px-3 py-1">Pagado</Badge>
      case 'partial': case 'partial_payment':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 border-none font-black uppercase text-[9px] px-3 py-1">Parcial</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 border-none font-black uppercase text-[9px] px-3 py-1">Pendiente</Badge>
    }
  }

  const items = sale?.items || []
  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? sale?.amount_paid ?? 0
  const balanceDue = sale?.balance_due ?? Math.max(totalAmount - paidAmount, 0)
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  if (loading) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando...</p></div>
  if (error || !sale) return <div className="h-[70vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error || 'Venta no encontrada'} onRetry={loadSale} /></div>

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto py-2 px-4 md:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/cobros-ventas')} className="size-10 md:size-12 rounded-xl border-slate-200 shrink-0"><ArrowLeft size={20} /></Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
               <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Venta <span className="text-primary">#{sale.id}</span></h1>
               {getStatusBadge(sale.status)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> {new Date(sale.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="h-10 md:h-12 border-slate-200 font-black uppercase tracking-widest text-[9px] rounded-xl px-4 flex-1 sm:flex-none">Imprimir</Button>
          <Button onClick={() => setIsPaymentModalOpen(true)} disabled={balanceDue <= 0} className="h-10 md:h-12 bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-xl px-6 flex-1 sm:flex-none shadow-lg shadow-primary/20 transition-all active:scale-95">Registrar Cobro</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             {/* Client Card */}
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
                <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-50"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">Cliente <User size={14} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-1"><h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{sale.client_name || 'Consumidor Final'}</h3><p className="text-[9px] font-black uppercase text-slate-400">CI/RUC: {sale.client_document || 'N/A'}</p></div>
                   <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-3 text-slate-600 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-transparent"><div className="size-7 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm"><User size={14} /></div><span className="truncate">Vendedor: {sale.user_name}</span></div>
                      {sale.client_contact && <div className="flex items-center gap-3 text-slate-600 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-transparent"><div className="size-7 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm"><Phone size={14} /></div><span className="truncate">{sale.client_contact}</span></div>}
                   </div>
                </CardContent>
             </Card>

             {/* Financial Summary */}
             <Card className="rounded-3xl border-none shadow-lg bg-slate-900 overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 size-24 bg-primary/20 rounded-full blur-3xl" />
                <CardHeader className="bg-white/5 py-4 px-6 relative z-10"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">Cuentas <Receipt size={14} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6 relative z-10">
                   <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Facturado</p><h2 className="text-2xl md:text-3xl font-black text-white tabular-nums">{formatCurrency(totalAmount)}</h2></div>
                   <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-500 uppercase">Cobrado</p><p className="text-sm font-black text-green-400 tabular-nums">{formatCurrency(paidAmount)}</p></div>
                      <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-500 uppercase">Saldo</p><p className="text-sm font-black text-primary tabular-nums">{formatCurrency(balanceDue)}</p></div>
                   </div>
                   <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase"><span className="text-slate-500">Progreso</span><span className="text-primary">{paymentProgress}%</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${paymentProgress}%` }} /></div></div>
                </CardContent>
             </Card>
          </div>

          {/* Items Section */}
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
             <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2"><Package size={16} /> Productos y Servicios</CardTitle><Badge variant="outline" className="text-[8px] font-black px-2 py-0.5 border-slate-200 text-slate-400">{items.length} Registros</Badge></CardHeader>
             <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="py-12 text-center opacity-40"><Package size={32} className="mx-auto text-slate-200 mb-2" /><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sin detalles disponibles</p></div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50/20 border-b border-slate-50"><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-8">Ítem</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Cant.</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">P. Unitario</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-right px-8">Subtotal</TableHead></TableRow></TableHeader>
                        <TableBody className="divide-y divide-slate-50">{items.map((item, idx) => (<TableRow key={item.id || idx} className="hover:bg-slate-50/50 transition-colors"><TableCell className="py-5 px-8 font-bold text-slate-900 dark:text-white text-xs">{item.product_name || item.name}</TableCell><TableCell className="text-center font-black text-slate-600 text-[10px]">x{item.quantity || 1}</TableCell><TableCell className="text-right font-medium text-slate-600 tabular-nums">{formatCurrency(item.unit_price || item.price || 0)}</TableCell><TableCell className="text-right font-black text-slate-900 tabular-nums px-8">{formatCurrency(item.total_price || item.total || 0)}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden divide-y divide-slate-50">
                      {items.map((item, idx) => (
                        <div key={idx} className="p-5 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-black text-slate-900 text-sm leading-tight">{item.product_name || item.name}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-600 whitespace-nowrap">x{item.quantity || 1}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Precio Unit.</span><span className="font-bold text-xs tabular-nums">{formatCurrency(item.unit_price || item.price || 0)}</span></div>
                            <div className="flex flex-col text-right"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span><span className="font-black text-sm text-primary tabular-nums">{formatCurrency(item.total_price || item.total || 0)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="bg-slate-50/50 p-6 flex justify-end items-center border-t border-slate-50"><div className="text-right"><p className="text-[8px] font-black text-primary uppercase mb-0.5">Total Venta</p><h3 className="text-xl md:text-2xl font-black text-primary tabular-nums tracking-tighter leading-none">{formatCurrency(totalAmount)}</h3></div></div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6 md:y-8">
           <Card className="rounded-3xl border-slate-100 shadow-sm bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">Historial Cobros <History size={14} className="text-primary" /></CardTitle><Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-bold">{payments.length} Reg.</Badge></CardHeader>
              <CardContent className="p-6">
                 {payments.length === 0 ? (
                   <div className="py-12 text-center opacity-40"><CircleDollarSign size={32} className="mx-auto text-slate-200 mb-2" /><p className="text-[9px] font-black uppercase text-slate-400">Sin cobros registrados</p></div>
                 ) : (
                   <div className="relative space-y-8 before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-slate-50">
                      {payments.map((p, idx) => (
                        <div key={idx} className="relative pl-8 group">
                           <div className="absolute left-0 top-1 size-4 bg-white border-[2.5px] border-primary rounded-full z-10" />
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center"><p className="text-sm font-black text-slate-900 tabular-nums">{formatCurrency(p.amount_paid || p.amount)}</p><Badge className="bg-green-50 text-green-600 border-none text-[7px] font-black px-2 py-0.5 tracking-widest uppercase">Éxito</Badge></div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2"><Clock size={10} /> {new Date(p.payment_date || p.date).toLocaleDateString()}</p>
                              {p.payment_notes && <div className="mt-1 text-[10px] font-medium text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-snug">"{p.payment_notes}"</div>}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
              <div className="p-4 bg-slate-50/50 border-t border-slate-50"><Button variant="outline" onClick={() => navigate(`/cobros-ventas/${saleId}/pagos`)} className="w-full rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[8px] h-9 tracking-widest">Ver Todo el Historial</Button></div>
           </Card>
        </div>
      </div>

      <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} sale={{ ...sale, balance_due: balanceDue, currency: sale?.currency || 'PYG' }} onSubmit={handlePaymentSubmit} />
    </div>
  )
}

export default SalesOrderDetail
