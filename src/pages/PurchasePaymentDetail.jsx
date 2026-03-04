/**
 * PurchasePaymentDetail Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  User,
  MapPin,
  Mail,
  Phone,
  CircleDollarSign,
  Package,
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Printer,
  Share2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const PurchasePaymentDetailPage = () => {
  const { orderId } = useParams()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { success: showSuccess } = useToast()

  const {
    currentOrder: order,
    loading,
    error,
    fetchOrder,
  } = usePurchasePaymentsMvpStore()

  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    }
  }, [orderId, fetchOrder])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
        style: 'currency',
        currency: order?.currency || 'PYG',
        minimumFractionDigits: order?.currency === 'PYG' ? 0 : 2,
        maximumFractionDigits: order?.currency === 'PYG' ? 0 : 2,
      }),
    [lang, order?.currency]
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    [lang]
  )

  const handleBack = () => {
    navigate('/pagos-compras')
  }

  const handlePaymentSuccess = () => {
    setRegisterModalOpen(false)
    fetchOrder(orderId)
    showSuccess(t('purchasePaymentsMvp.messages.paymentRegistered'))
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Totalmente Pagado</Badge>
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pago Parcial</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pago Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1.5 shadow-sm">Pendiente</Badge>
    }
  }

  if (loading && !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in duration-700">
        <RefreshCw className="w-12 h-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Cargando expediente...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="animate-in fade-in duration-500 h-[70vh] flex items-center justify-center">
        <DataState
          variant="error"
          title={t('purchasePaymentsMvp.error.title')}
          message={error || 'No se pudo cargar la información de la orden.'}
          onRetry={() => fetchOrder(orderId)}
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
            onClick={handleBack}
            className="size-12 rounded-full hover:bg-primary/10 text-primary transition-all"
          >
            <ArrowLeft size={24} />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
                 Orden #{order.id}
               </h1>
               {getStatusBadge(order.status)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium font-display flex items-center gap-2">
              <Calendar size={14} /> Emitida el {order.issue_date ? new Date(order.issue_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Printer size={16} className="mr-2" /> Imprimir
          </Button>
          <Button
            onClick={() => setRegisterModalOpen(true)}
            disabled={order.status === 'completed' || order.status === 'paid'}
            className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <CircleDollarSign size={18} className="mr-2" />
            Registrar Pago
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Order Info & Items */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Supplier Info */}
             <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4">
                   <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <User size={14} className="text-primary" /> Información del Proveedor
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{order.supplier?.name}</h3>
                   <div className="space-y-3">
                      {order.supplier?.contact && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <User size={16} className="text-slate-300" /> {order.supplier.contact}
                        </div>
                      )}
                      {order.supplier?.email && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <Mail size={16} className="text-slate-300" /> {order.supplier.email}
                        </div>
                      )}
                      {order.supplier?.phone && (
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <Phone size={16} className="text-slate-300" /> {order.supplier.phone}
                        </div>
                      )}
                      {order.supplier?.address && (
                        <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
                           <MapPin size={16} className="text-slate-300 mt-0.5" /> 
                           <span>
                             {order.supplier.address.street}
                             {order.supplier.address.city && `, ${order.supplier.address.city}`}
                           </span>
                        </div>
                      )}
                   </div>
                </CardContent>
             </Card>

             {/* Financial Summary */}
             <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-4">
                   <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <CircleDollarSign size={14} className="text-primary" /> Resumen Financiero
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="flex justify-between items-end border-b border-slate-50 dark:border-slate-800 pb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Total</p>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                        {currencyFormatter.format(order.total_amount)}
                      </h2>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagado</p>
                         <p className="text-lg font-bold text-green-600 tabular-nums tracking-tight">
                           {currencyFormatter.format(order.totalPaid || 0)}
                         </p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendiente</p>
                         <p className="text-lg font-black text-primary tabular-nums tracking-tight">
                           {currencyFormatter.format(order.pendingAmount || 0)}
                         </p>
                      </div>
                   </div>
                   {/* Progress Bar */}
                   <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-400">Progreso de Pago</span>
                         <span className="text-primary">{order.paymentProgressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out" 
                          style={{ width: `${order.paymentProgressPercent}%` }}
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
                   <Package size={18} className="text-primary" /> Detalle de Productos
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader>
                      <TableRow className="bg-slate-50/30 dark:bg-slate-900/20 border-none">
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-8">Producto</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Cantidad</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">P. Unitario</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right px-8">Subtotal</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {order.items?.map((item, idx) => (
                        <TableRow key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-none transition-colors">
                           <TableCell className="py-5 px-8 font-bold text-slate-900 dark:text-white text-sm">{item.name}</TableCell>
                           <TableCell className="text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums">x{item.quantity}</TableCell>
                           <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">{currencyFormatter.format(item.unitPrice)}</TableCell>
                           <TableCell className="text-right font-black text-slate-900 dark:text-white tabular-nums px-8">{currencyFormatter.format(item.total)}</TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Payments & Timeline */}
        <div className="lg:col-span-4 space-y-8">
           {/* Payment History */}
           <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-5 px-6">
                 <CardTitle className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                    <History size={18} className="text-primary" /> Historial de Pagos
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 {!order.payments || order.payments.length === 0 ? (
                   <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                      <CircleDollarSign size={40} className="mb-3 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin pagos registrados</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      {order.payments.map((payment, idx) => (
                        <div key={payment.id || idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-2 group">
                           <div className="absolute -left-[9px] top-0 size-4 bg-white dark:bg-surface-dark border-2 border-primary rounded-full group-hover:bg-primary transition-colors" />
                           <div className="flex justify-between items-start">
                              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                {currencyFormatter.format(payment.amount)}
                              </p>
                              <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] font-black px-2 py-0">EXITOSO</Badge>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                                <Clock size={10} /> {payment.registered_at ? dateFormatter.format(new Date(payment.registered_at)) : '-'}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <User size={10} /> Por: {payment.recorded_by || 'Sistema'}
                              </p>
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

           {/* Activity Log / History */}
           <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 py-5 px-6">
                 <CardTitle className="text-[13px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                    <FileText size={18} className="text-primary" /> Bitácora de Eventos
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 {!order.history || order.history.length === 0 ? (
                   <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                      <History size={40} className="mb-3 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin eventos recientes</p>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      {order.history.map((entry, idx) => (
                        <div key={entry.id || idx} className="flex gap-4">
                           <div className="mt-1">
                              {entry.action?.toLowerCase().includes('create') ? <PlusCircle size={16} className="text-blue-500" /> : 
                               entry.action?.toLowerCase().includes('pay') ? <CheckCircle2 size={16} className="text-green-500" /> :
                               <AlertCircle size={16} className="text-amber-500" />}
                           </div>
                           <div className="space-y-1 min-w-0">
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                {entry.action}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                {entry.notes}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : '-'} • {entry.actor || 'Sistema'}
                              </p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      <RegisterPaymentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        order={{
          id: order.id,
          pendingAmount: order.pendingAmount,
          currency: order.currency,
          supplierName: order.supplier?.name,
          supplierId: order.supplier?.id,
          priority: order.priority
        }}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default PurchasePaymentDetailPage
