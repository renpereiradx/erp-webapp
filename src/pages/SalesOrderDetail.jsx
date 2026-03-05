/**
 * SalesOrderDetail Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Mail,
  Download,
  Calendar,
  User,
  Clock,
  CreditCard,
  FileText,
  AlertCircle,
  Package,
  History,
  CircleDollarSign,
  CheckCircle2,
  Phone,
  MapPin,
  Receipt,
  RefreshCw
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
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

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

    setLoading(true)
    setError(null)

    try {
      // PASO 1: Obtener estado de pago con historial de pagos
      const paymentStatusResponse = await salePaymentService.getSalePaymentStatus(saleId)

      if (!paymentStatusResponse) {
        setError('Sale not found')
        return
      }

      // PASO 2: Obtener detalles completos de la venta (con items/productos)
      let saleDetails = null

      try {
        const clientSalesResponse = await saleService.getSalesByClient(
          paymentStatusResponse.client_id || paymentStatusResponse.client?.id
        )

        if (clientSalesResponse?.data && Array.isArray(clientSalesResponse.data)) {
          const saleItem = clientSalesResponse.data.find(item => {
            const itemSaleId = item.sale_id || item.id || item.sale?.sale_id
            return String(itemSaleId) === String(saleId)
          })

          if (saleItem) {
            saleDetails = saleItem
          }
        }
      } catch (err) {
        console.warn('Error loading sale details from client endpoint:', err)
      }

      // PASO 3: Obtener datos completos del cliente desde CLIENT_API
      let clientDetails = null
      try {
        const clientId = paymentStatusResponse.client_id || paymentStatusResponse.client?.id
        if (clientId) {
          clientDetails = await clientService.getById(clientId)
        }
      } catch (err) {
        console.warn('Error loading client details:', err)
      }

      // PASO 4: Combinar datos de todos los endpoints
      const balanceDue = paymentStatusResponse.balance_due || 0
      let correctedStatus = paymentStatusResponse.status || paymentStatusResponse.payment_status

      if (balanceDue === 0 && (correctedStatus === 'PARTIAL_PAYMENT' || correctedStatus === 'partial')) {
        correctedStatus = 'PAID'
      }

      const saleData = {
        ...paymentStatusResponse,
        id: paymentStatusResponse.sale_id || paymentStatusResponse.id,
        sale_id: paymentStatusResponse.sale_id || paymentStatusResponse.id,
        status: correctedStatus,
        balance_due: balanceDue,
        items:
          saleDetails?.details ||
          saleDetails?.items ||
          saleDetails?.sale?.details ||
          paymentStatusResponse.items ||
          [],
        user_name:
          saleDetails?.sale?.user_name ||
          saleDetails?.user_name ||
          paymentStatusResponse.user_name || 'Vendedor',
        client_name: paymentStatusResponse.client_name || paymentStatusResponse.client?.name || clientDetails?.name,
        client_document: clientDetails?.document_id || paymentStatusResponse.client?.document_id,
        client_contact: clientDetails?.contact || paymentStatusResponse.client?.contact,
        client_last_name: clientDetails?.last_name,
        date: paymentStatusResponse.issue_date || paymentStatusResponse.sale_date || paymentStatusResponse.created_at || paymentStatusResponse.date,
        currency: paymentStatusResponse.currency || 'PYG'
      }

      setSale(saleData)

      if (paymentStatusResponse.payments && Array.isArray(paymentStatusResponse.payments)) {
        setPayments(paymentStatusResponse.payments)
      }
    } catch (err) {
      console.error('Error loading sale:', err)
      const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status
      if (statusCode === 404) {
        setError('Sale not found')
      } else {
        setError(err.message || 'Error loading sale details')
      }
      showError('Error loading sale details')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])


  useEffect(() => {
    loadSale()
  }, [loadSale])

  const handlePrint = () => {
    window.print()
  }

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(
        t('common.success'),
        t('sales.registerPaymentModal.successMessage', 'Pago registrado exitosamente')
      )
      await loadSale()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error
    }
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Totalmente Pagado</Badge>
      case 'partial':
      case 'partial_payment':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pago Parcial</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pago Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pendiente</Badge>
    }
  }

  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date)
  }

  const formatCurrency = amount => {
    const currencyCode = normalizeCurrencyCode(sale?.currency)

    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
    }).format(amount || 0)
  }

  const items = sale?.items || []
  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? sale?.amount_paid ?? 0
  const balanceDue = sale?.balance_due ?? Math.max(totalAmount - paidAmount, 0)
  
  const paymentProgress = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  const normalizedPayments = payments.length
    ? payments.map(payment => ({
        id: payment.payment_id || payment.id,
        date: payment.payment_date || payment.registered_at,
        user: payment.processed_by_name || payment.recorded_by || '—',
        amount: payment.amount_paid || payment.amount_received || payment.amount || 0,
        change: payment.change_amount || 0,
        method: payment.payment_method_code || payment.payment_method || 'CASH',
        reference: payment.payment_reference || payment.reference || '—',
        notes: payment.payment_notes || payment.notes || '',
        status: (payment.status || 'COMPLETED').toLowerCase(),
      }))
    : []

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in duration-700">
        <RefreshCw className="w-12 h-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargando expediente...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="animate-in fade-in duration-500 h-[70vh] flex items-center justify-center">
        <DataState
          variant="error"
          title={t('common.error')}
          message={error || 'No se pudo cargar la información de la venta.'}
          onRetry={loadSale}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto py-2">
      {/* Navigation & Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/cobros-ventas')}
            className="size-12 rounded-full hover:bg-primary/10 text-primary transition-all"
          >
            <ArrowLeft size={24} />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
                 Venta #{sale.id}
               </h1>
               {getStatusBadge(sale.status)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium font-display flex items-center gap-2">
              <Calendar size={14} /> Fecha: {formatDate(sale.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-12 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer size={16} className="mr-2" /> Imprimir
          </Button>
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={balanceDue <= 0}
            className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <CircleDollarSign size={18} className="mr-2" />
            Registrar Cobro
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order Info & Items */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Client Info */}
             <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4">
                   <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <User size={14} className="text-primary" /> Información del Cliente
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                     {sale.client_name || 'Cliente Ocasional'} {sale.client_last_name || ''}
                   </h3>
                   <div className="space-y-3">
                      {sale.client_document && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <FileText size={16} className="text-slate-300" /> CI/RUC: {sale.client_document}
                        </div>
                      )}
                      {sale.client_contact && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <Phone size={16} className="text-slate-300" /> {sale.client_contact}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                         <User size={16} className="text-slate-300" /> Atendido por: {sale.user_name}
                      </div>
                   </div>
                </CardContent>
             </Card>

             {/* Financial Summary */}
             <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4">
                   <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Receipt size={14} className="text-primary" /> Resumen de Cuenta
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="flex justify-between items-end border-b border-slate-50 dark:border-slate-800 pb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Facturado</p>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                        {formatCurrency(totalAmount)}
                      </h2>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cobrado</p>
                         <p className="text-lg font-bold text-green-600 tabular-nums tracking-tight">
                           {formatCurrency(paidAmount)}
                         </p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo a Cobrar</p>
                         <p className="text-lg font-black text-primary tabular-nums tracking-tight">
                           {formatCurrency(balanceDue)}
                         </p>
                      </div>
                   </div>
                   {/* Progress Bar */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">Progreso de Cobro</span>
                         <span className="text-primary">{paymentProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${paymentProgress}%` }}
                         />
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Items Table */}
          <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
             <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-5 px-8">
                <CardTitle className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                   <Package size={18} className="text-primary" /> Productos y Servicios
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                     <Package size={32} className="mb-3 text-slate-300" />
                     <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin detalles disponibles</p>
                  </div>
                ) : (
                  <Table>
                     <TableHeader>
                        <TableRow className="bg-slate-50/30 dark:bg-slate-900/20 border-none">
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-8">Ítem</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Cantidad</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">P. Unitario</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right px-8">Subtotal</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {items.map((item, idx) => (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-none transition-colors">
                             <TableCell className="py-5 px-8 font-bold text-slate-900 dark:text-white text-sm">
                               {item.product_name || item.name || 'Producto Desconocido'}
                             </TableCell>
                             <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                               x{item.quantity || 1}
                             </TableCell>
                             <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                               {formatCurrency(item.unit_price || item.price || 0)}
                             </TableCell>
                             <TableCell className="text-right font-black text-slate-900 dark:text-white tabular-nums px-8">
                               {formatCurrency(item.total_price || item.total || (item.quantity * (item.unit_price || item.price || 0)))}
                             </TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                  </Table>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Payments */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden sticky top-24">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-5 px-6 flex flex-row items-center justify-between">
                 <CardTitle className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                    <History size={18} className="text-primary" /> Historial de Cobros
                 </CardTitle>
                 <Badge className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-none font-bold text-[10px]">
                    {normalizedPayments.length} Registros
                 </Badge>
              </CardHeader>
              <CardContent className="p-6">
                 {normalizedPayments.length === 0 ? (
                   <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                      <CreditCard size={40} className="mb-3 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin cobros registrados</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      {normalizedPayments.map((payment, idx) => (
                        <div key={payment.id || idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-2 group">
                           <div className="absolute -left-[9px] top-0 size-4 bg-white dark:bg-surface-dark border-2 border-primary rounded-full group-hover:bg-primary transition-colors" />
                           <div className="flex justify-between items-start">
                              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(payment.amount)}
                              </p>
                              <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] font-black px-2 py-0">EXITOSO</Badge>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                                <Clock size={10} /> {formatDate(payment.date)}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <User size={10} /> Por: {payment.user}
                              </p>
                              {payment.reference && payment.reference !== '—' && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <FileText size={10} /> Ref: {payment.reference}
                                </p>
                              )}
                           </div>
                           {payment.notes && (
                             <p className="text-[10px] italic text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                               "{payment.notes}"
                             </p>
                           )}
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {sale && (
        <RegisterSalePaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          sale={{
            ...sale,
            balance_due: balanceDue,
            currency: sale.currency || 'PYG'
          }}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  )
}
export default SalesOrderDetail
