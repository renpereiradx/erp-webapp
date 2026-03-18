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
      // Intentar obtener datos completos de la venta primero (incluye items enriquecidos con IVA)
      const saleResponse = await saleService.getSaleById(saleId)
      if (!saleResponse.success) { setError('Venta no encontrada'); return }
      
      const fullSaleData = saleResponse.data?.sale || saleResponse.data
      const saleItems = saleResponse.data?.details || saleResponse.data?.items || []

      // Obtener estado de pago actualizado
      let paymentStatus = null
      try {
        paymentStatus = await salePaymentService.getSalePaymentStatus(saleId)
      } catch (err) { console.warn('Payment status fetch error', err) }

      let clientDetails = null
      try {
        const clientId = fullSaleData.client_id || paymentStatus?.client_id
        if (clientId) clientDetails = await clientService.getById(clientId)
      } catch (err) { console.warn('Client fetch error', err) }

      const balanceDue = paymentStatus?.balance_due ?? (fullSaleData.total_amount - (paymentStatus?.total_paid || 0))
      let correctedStatus = fullSaleData.status || paymentStatus?.status || paymentStatus?.payment_status
      if (balanceDue === 0 && (correctedStatus === 'PARTIAL_PAYMENT' || correctedStatus === 'partial')) correctedStatus = 'PAID'

      setSale({
        ...fullSaleData,
        ...paymentStatus,
        id: fullSaleData.sale_id || fullSaleData.id,
        status: correctedStatus,
        balance_due: balanceDue,
        items: saleItems,
        user_name: fullSaleData.user_name || paymentStatus?.user_name || 'Vendedor',
        client_name: fullSaleData.client_name || paymentStatus?.client_name || clientDetails?.name,
        client_document: clientDetails?.document_id || paymentStatus?.client?.document_id,
        client_contact: clientDetails?.contact || paymentStatus?.client?.contact,
        date: fullSaleData.sale_date || fullSaleData.date || paymentStatus?.sale_date,
        currency: fullSaleData.currency || paymentStatus?.currency || 'PYG'
      })
      
      if (paymentStatus?.payments) setPayments(paymentStatus.payments)
    } catch (err) { 
      console.error('Error in loadSale:', err)
      setError(err.message || 'Error loading sale'); 
      showError('Error de carga') 
    } finally { setLoading(false) }
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
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 border-none font-medium text-xs px-2 py-0.5">Pagado</Badge>
      case 'partial': case 'partial_payment':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 border-none font-medium text-xs px-2 py-0.5">Parcial</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 border-none font-medium text-xs px-2 py-0.5">Pendiente</Badge>
    }
  }

  const items = sale?.items || []
  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? sale?.amount_paid ?? 0
  const balanceDue = sale?.balance_due ?? Math.max(totalAmount - paidAmount, 0)
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  if (loading) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /><p className="text-sm font-medium text-slate-500">Cargando...</p></div>
  if (error || !sale) return <div className="h-[70vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error || 'Venta no encontrada'} onRetry={loadSale} /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/cobros-ventas')} className="size-10 md:size-12 rounded-lg border-slate-400 shrink-0"><ArrowLeft size={20} /></Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
               <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">Venta <span className="text-primary">#{sale.id}</span></h1>
               {getStatusBadge(sale.status)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-2"><Calendar size={14} /> {new Date(sale.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="h-10 border-slate-400 font-medium text-sm rounded-md px-4 flex-1 sm:flex-none">Imprimir</Button>
          <Button onClick={() => setIsPaymentModalOpen(true)} disabled={balanceDue <= 0} className="h-10 bg-primary text-white font-medium text-sm rounded-md px-6 flex-1 sm:flex-none shadow-sm transition-all active:scale-95">Registrar Cobro</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             {/* Client Card */}
             <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
                <CardHeader className="bg-slate-50 py-4 px-6 border-b border-slate-200"><CardTitle className="text-sm font-semibold text-slate-700 flex items-center justify-between">Cliente <User size={16} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{sale.client_name || 'Consumidor Final'}</h3><p className="text-xs font-medium text-slate-500">CI/RUC: {sale.client_document || 'N/A'}</p></div>
                   <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-3 text-slate-600 text-sm font-medium bg-slate-50 p-3 rounded-md border border-slate-200"><div className="size-8 bg-white rounded-md flex items-center justify-center text-primary shadow-sm"><User size={16} /></div><span className="truncate">Vendedor: {sale.user_name}</span></div>
                      {sale.client_contact && <div className="flex items-center gap-3 text-slate-600 text-sm font-medium bg-slate-50 p-3 rounded-md border border-slate-200"><div className="size-8 bg-white rounded-md flex items-center justify-center text-primary shadow-sm"><Phone size={16} /></div><span className="truncate">{sale.client_contact}</span></div>}
                   </div>
                </CardContent>
             </Card>

             {/* Financial Summary */}
             <Card className="rounded-xl border border-slate-800 shadow-md bg-slate-900 overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 size-24 bg-primary/20 rounded-full blur-3xl" />
                <CardHeader className="bg-white/5 py-4 px-6 relative z-10 border-b border-white/10"><CardTitle className="text-sm font-semibold text-white/80 flex items-center justify-between">Cuentas <Receipt size={16} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6 relative z-10">
                   <div><p className="text-xs font-medium text-white/60 mb-1">Total Facturado</p><h2 className="text-2xl md:text-3xl font-bold text-white tabular-nums">{formatCurrency(totalAmount)}</h2></div>
                   <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-md border border-white/10">
                      <div className="space-y-0.5"><p className="text-xs font-medium text-white/60">Cobrado</p><p className="text-sm font-semibold text-green-400 tabular-nums">{formatCurrency(paidAmount)}</p></div>
                      <div className="space-y-0.5"><p className="text-xs font-medium text-white/60">Saldo</p><p className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(balanceDue)}</p></div>
                   </div>
                   <div className="space-y-2"><div className="flex justify-between text-xs font-medium"><span className="text-white/60">Progreso</span><span className="text-primary">{paymentProgress}%</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${paymentProgress}%` }} /></div></div>
                </CardContent>
             </Card>
          </div>

          {/* Items Section */}
          <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
             <CardHeader className="bg-slate-50 py-4 px-6 border-b border-slate-200 flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2"><Package size={18} /> Productos y Servicios</CardTitle><Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-slate-400 text-slate-500">{items.length} Registros</Badge></CardHeader>
             <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="py-12 text-center opacity-40"><Package size={32} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-500">Sin detalles disponibles</p></div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50 border-b border-slate-200"><TableHead className="text-xs font-semibold text-slate-600 py-3 px-8">Ítem</TableHead><TableHead className="text-xs font-semibold text-slate-600 text-center">Cant.</TableHead><TableHead className="text-xs font-semibold text-slate-600 text-right">Precio s/IVA</TableHead><TableHead className="text-xs font-semibold text-slate-600 text-right">IVA</TableHead><TableHead className="text-xs font-semibold text-slate-600 text-right px-8">Total con IVA</TableHead></TableRow></TableHeader>
                        <TableBody className="divide-y divide-slate-200">{items.map((item, idx) => {
                          const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                          const taxAmount = item.tax_amount ?? 0
                          const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                          return (
                            <TableRow key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="py-4 px-8 font-semibold text-slate-900 dark:text-white text-sm">
                                {item.product_name || item.name}
                                {item.applied_tax_rate !== undefined && (
                                  <span className="ml-2 text-[10px] text-slate-400 font-normal">({item.applied_tax_rate}%)</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-medium text-slate-600 text-sm">x{item.quantity || 1}</TableCell>
                              <TableCell className="text-right font-medium text-slate-600 tabular-nums text-sm">{formatCurrency(unitPriceWoTax)}</TableCell>
                              <TableCell className="text-right font-medium text-slate-400 tabular-nums text-sm">{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</TableCell>
                              <TableCell className="text-right font-semibold text-slate-900 tabular-nums px-8 text-sm">{formatCurrency(totalWithTax)}</TableCell>
                            </TableRow>
                          )
                        })}</TableBody>
                      </Table>
                    </div>
                    <div className="md:hidden divide-y divide-slate-200">
                      {items.map((item, idx) => {
                        const unitPriceWoTax = item.unit_price_without_tax ?? item.unit_price ?? item.price
                        const taxAmount = item.tax_amount ?? 0
                        const totalWithTax = item.total_with_tax ?? item.total_price ?? item.total
                        return (
                          <div key={idx} className="p-5 space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-semibold text-slate-900 text-base leading-tight">
                                {item.product_name || item.name}
                                {item.applied_tax_rate !== undefined && (
                                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">Tasa IVA: {item.applied_tax_rate}%</span>
                                )}
                              </span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 whitespace-nowrap">x{item.quantity || 1}</span>
                            </div>
                            <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-500">Precio s/IVA</span>
                                <span className="font-semibold text-sm tabular-nums">{formatCurrency(unitPriceWoTax)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-500">IVA</span>
                                <span className="font-medium text-sm tabular-nums text-slate-400">{taxAmount > 0 ? formatCurrency(taxAmount) : '-'}</span>
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                                <span className="text-xs font-bold text-slate-700">Subtotal con IVA</span>
                                <span className="font-bold text-base text-primary tabular-nums">{formatCurrency(totalWithTax)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
                <div className="bg-slate-50 p-6 flex justify-end items-center border-t border-slate-200"><div className="text-right"><p className="text-sm font-medium text-slate-600 mb-0.5">Total Venta</p><h3 className="text-xl md:text-2xl font-bold text-primary tabular-nums tracking-tight leading-none">{formatCurrency(totalAmount)}</h3></div></div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
           <Card className="rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-200 bg-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-sm font-semibold text-slate-700 dark:text-white flex items-center gap-3">Historial Cobros <History size={16} className="text-primary" /></CardTitle><Badge className="bg-slate-100 text-slate-600 border-none text-xs font-medium">{payments.length} Reg.</Badge></CardHeader>
              <CardContent className="p-6">
                 {payments.length === 0 ? (
                   <div className="py-12 text-center opacity-40"><CircleDollarSign size={32} className="mx-auto text-slate-400 mb-2" /><p className="text-sm font-medium text-slate-500">Sin cobros registrados</p></div>
                 ) : (
                   <div className="relative space-y-8 before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-slate-200">
                      {payments.map((p, idx) => (
                        <div key={idx} className="relative pl-8 group">
                           <div className="absolute left-0 top-1 size-4 bg-white border-[2px] border-primary rounded-full z-10" />
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center"><p className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(p.amount_paid || p.amount)}</p><Badge className="bg-green-50 text-green-600 border-none text-xs font-medium px-2 py-0.5">Éxito</Badge></div>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-2"><Clock size={12} /> {new Date(p.payment_date || p.date).toLocaleDateString()}</p>
                              {p.payment_notes && <div className="mt-1 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 italic leading-relaxed">"{p.payment_notes}"</div>}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
              <div className="p-4 bg-slate-50 border-t border-slate-200"><Button variant="outline" onClick={() => navigate(`/cobros-ventas/${saleId}/pagos`)} className="w-full rounded-md border-slate-400 text-slate-600 font-medium text-sm h-10">Ver Todo el Historial</Button></div>
           </Card>
        </div>
      </div>

      <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} sale={{ ...sale, balance_due: balanceDue, currency: sale?.currency || 'PYG' }} onSubmit={handlePaymentSubmit} />
    </div>
  )
}

export default SalesOrderDetail
