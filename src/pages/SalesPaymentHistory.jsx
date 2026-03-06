/**
 * SalesPaymentHistory Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Download,
  Plus,
  AlertCircle,
  Receipt,
  User,
  Calendar,
  CreditCard,
  RefreshCw,
  Clock,
  History,
  CircleDollarSign,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

const SalesPaymentHistory = () => {
  const { saleId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { error: showError, success: showSuccess } = useToast()

  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!saleId) return

    setLoading(true)
    setError(null)

    try {
      // PASO 1: Obtener estado de pago con historial de pagos
      const paymentStatusResponse = await salePaymentService.getSalePaymentStatus(saleId)

      if (!paymentStatusResponse) {
        setError('Sale not found')
        return
      }

      // PASO 2: Obtener detalles completos de la venta
      let saleDetails = null
      try {
        const clientId = paymentStatusResponse.client_id || paymentStatusResponse.client?.id
        const clientSalesResponse = await saleService.getSalesByClient(clientId)

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

      // PASO 3: Obtener datos completos del cliente
      let clientDetails = null
      try {
        const clientId = paymentStatusResponse.client_id || paymentStatusResponse.client?.id
        if (clientId) {
          clientDetails = await clientService.getById(clientId)
        }
      } catch (err) {
        console.warn('Error loading client details:', err)
      }

      // PASO 4: Combinar datos
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
        date: paymentStatusResponse.issue_date || paymentStatusResponse.sale_date || paymentStatusResponse.created_at || paymentStatusResponse.date
      }

      setSale(saleData)

      if (paymentStatusResponse.payments && Array.isArray(paymentStatusResponse.payments)) {
        setPayments(paymentStatusResponse.payments)
      }
    } catch (err) {
      console.error('Error loading payment history:', err)
      const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status
      if (statusCode === 404) {
        setError('Sale not found')
      } else {
        setError(err.message || 'Error loading payment history')
      }
      showError('Error loading payment history')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    console.log('Descargar reporte de pagos')
  }

  const handleAddPayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(
        t('common.success'),
        t('sales.registerPaymentModal.successMessage', 'Pago registrado exitosamente')
      )
      await loadData()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error
    }
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

  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(date)
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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargando historial...</p>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="animate-in fade-in duration-500 h-[70vh] flex items-center justify-center">
        <DataState
          variant="error"
          title={t('common.error')}
          message={error || 'No se pudo cargar el historial de pagos.'}
          onRetry={loadData}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto py-2">
      {/* Header */}
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
                 Historial de Cobros
               </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium font-display flex items-center gap-2">
              Venta #{sale.id} • {sale.client_name || 'Cliente Ocasional'}
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
            variant="outline"
            onClick={handleDownload}
            className="h-12 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download size={16} className="mr-2" /> Exportar
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Venta</p>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalAmount)}</h2>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cobrado</p>
               <h2 className="text-2xl font-bold text-green-600 tracking-tight">{formatCurrency(paidAmount)}</h2>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Restante</p>
               <h2 className="text-2xl font-black text-primary tracking-tight">{formatCurrency(balanceDue)}</h2>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
               <div className="mt-1">{getStatusBadge(sale.status)}</div>
            </CardContent>
         </Card>
      </div>

      {/* Progress Bar */}
      <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
        <CardContent className="p-6 flex items-center gap-6">
           <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">Progreso de Cobro</span>
                 <span className="text-primary">{paymentProgress}% Completado</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out" 
                  style={{ width: `${paymentProgress}%` }}
                 />
              </div>
           </div>
           {balanceDue > 0 && (
             <Button
                onClick={handleAddPayment}
                className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={18} className="mr-2" />
                Registrar Cobro
              </Button>
           )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-5 px-8">
           <CardTitle className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
              <History size={18} className="text-primary" /> Línea de Tiempo de Cobros
           </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
           {normalizedPayments.length === 0 ? (
             <div className="py-16 flex flex-col items-center justify-center text-center opacity-40">
                <CreditCard size={48} className="mb-4 text-slate-300" />
                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-500 mb-1">Sin Registros</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Esta venta aún no tiene cobros asociados.</p>
             </div>
           ) : (
             <div className="space-y-8">
                {normalizedPayments.map((payment, idx) => (
                  <div key={payment.id || idx} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 group">
                     <div className="absolute -left-[11px] top-0 size-5 bg-white dark:bg-surface-dark border-4 border-primary rounded-full group-hover:bg-primary transition-colors" />
                     
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:shadow-sm transition-all">
                        <div className="space-y-2 flex-1">
                           <div className="flex items-center gap-3">
                             <Badge className="bg-green-500/10 text-green-600 border-none text-[9px] font-black px-2 py-0.5">COBRO APLICADO</Badge>
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                               <Clock size={12} /> {formatDate(payment.date)}
                             </span>
                           </div>
                           
                           <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                             {formatCurrency(payment.amount)}
                           </h3>
                           
                           <div className="flex flex-wrap gap-4 pt-2">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <User size={12} className="text-slate-400" /> Cajero: {payment.user}
                              </p>
                              {payment.reference && payment.reference !== '—' && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                  <FileText size={12} className="text-slate-400" /> Ref: {payment.reference}
                                </p>
                              )}
                           </div>
                        </div>

                        {payment.notes && (
                           <div className="md:w-1/3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas</p>
                             <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{payment.notes}"</p>
                           </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
           )}
        </CardContent>
      </Card>

      <RegisterSalePaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        sale={sale}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}
export default SalesPaymentHistory
