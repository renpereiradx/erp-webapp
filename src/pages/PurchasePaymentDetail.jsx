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
  Building,
  PlusCircle,
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
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

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

  const currencyFormatter = useMemo(() => {
    const code = normalizeCurrencyCode(order?.currency)
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1400px] mx-auto py-2 px-4 sm:px-0">
      {/* Navigation & Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="size-12 rounded-2xl border-slate-200 hover:bg-white hover:text-primary hover:border-primary/30 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={22} />
          </Button>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
               <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
                 Orden <span className="text-primary">#{order.id}</span>
               </h1>
               {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary/60" /> {order.issue_date ? new Date(order.issue_date).toLocaleDateString() : '-'}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1.5"><Package size={14} className="text-primary/60" /> {order.items?.length || 0} Items</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 border-slate-200 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 px-6 transition-all"
              >
                Acciones <MoreVertical size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 shadow-2xl">
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-xl focus:bg-slate-50">
                <Printer size={18} className="text-slate-400" /> Imprimir Factura
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-xl focus:bg-slate-50">
                <Share2 size={18} className="text-slate-400" /> Compartir con Proveedor
              </DropdownMenuItem>
              <Separator className="my-2" />
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-xl text-primary focus:bg-primary/5">
                <Download size={18} /> Descargar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setRegisterModalOpen(true)}
            disabled={order.status === 'completed' || order.status === 'paid'}
            className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-primary/25 transition-all active:scale-95 px-8"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Supplier Info */}
             <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 py-5 px-8">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center justify-between">
                      Proveedor
                      <Building size={16} className="text-primary/40 group-hover:text-primary transition-colors" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
                        {order.supplier?.name}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full inline-block">ID: #{order.supplier?.id || '---'}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4 pt-2">
                      {order.supplier?.contact && (
                        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-sm font-bold bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                           <div className="size-8 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary shadow-sm">
                             <User size={16} />
                           </div>
                           {order.supplier.contact}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-sm font-bold bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                         <div className="size-8 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary shadow-sm">
                           <MapPin size={16} />
                         </div>
                         <span className="truncate">
                            {order.supplier?.address?.street || 'Sin dirección registrada'}
                         </span>
                      </div>
                   </div>
                </CardContent>
             </Card>

             {/* Financial Summary */}
             <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-slate-900 dark:bg-surface-dark overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                
                <CardHeader className="bg-white/5 border-b border-white/5 py-5 px-8 relative z-10">
                   <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center justify-between">
                      Resumen Financiero
                      <CircleDollarSign size={16} className="text-primary" />
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8 relative z-10">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monto Total de Compra</p>
                      <h2 className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">
                        {currencyFormatter.format(order.total_amount)}
                      </h2>
                   </div>

                   <div className="grid grid-cols-2 gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pagado</p>
                         <p className="text-lg font-black text-green-400 tabular-nums">
                           {currencyFormatter.format(order.totalPaid || 0)}
                         </p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo Restante</p>
                         <p className="text-lg font-black text-primary tabular-nums">
                           {currencyFormatter.format(order.pendingAmount || 0)}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span className="text-slate-500">Avance de Pago</span>
                         <span className="text-primary bg-primary/20 px-2 py-0.5 rounded-full">{order.paymentProgressPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                         <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                          style={{ width: `${order.paymentProgressPercent}%` }}
                         />
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Items Table */}
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
             <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 py-6 px-8 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">
                   <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Package size={20} />
                   </div>
                   Productos en la Orden
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-black px-3 py-1 uppercase rounded-lg border-slate-200 text-slate-500">
                  {order.items?.length || 0} Registros
                </Badge>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/20 dark:bg-slate-900/10 border-b border-slate-50 dark:border-slate-800">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-5 px-8">Descripción del Producto</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Cant.</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Precio Unit.</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right px-8">Subtotal Neto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {order.items?.map((item, idx) => (
                          <TableRow key={item.id || idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-none transition-colors group cursor-default">
                            <TableCell className="py-6 px-8">
                               <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-slate-900 dark:text-white text-[15px] group-hover:text-primary transition-colors">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SKU-{Math.floor(Math.random() * 10000)}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-center">
                               <span className="inline-flex h-8 w-12 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-black text-slate-600 dark:text-slate-400 tabular-nums">
                                 {item.quantity}
                               </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-600 dark:text-slate-400 tabular-nums text-sm">
                              {currencyFormatter.format(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-900 dark:text-white tabular-nums text-[15px] px-8">
                               {currencyFormatter.format(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Custom Table Footer for Totals */}
                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-8 flex justify-end items-center border-t border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-12">
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Totales</p>
                         <p className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none">{order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total Orden</p>
                         <h3 className="text-3xl font-black text-primary tabular-nums tracking-tighter leading-none">
                            {currencyFormatter.format(order.total_amount)}
                         </h3>
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Right Column: Payments & Timeline */}
        <div className="lg:col-span-4 space-y-8">
           {/* Payment History timeline */}
           <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-fluent-4 bg-white dark:bg-surface-dark overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-white dark:bg-slate-900 py-6 px-8 border-b border-slate-100 dark:border-slate-800">
                 <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white flex items-center justify-between">
                    Historial Pagos
                    <History size={18} className="text-primary" />
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex-1">
                 {!order.payments || order.payments.length === 0 ? (
                   <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                      <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                         <CircleDollarSign size={40} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin pagos electrónicos registrados</p>
                   </div>
                 ) : (
                   <div className="relative space-y-10 before:absolute before:inset-0 before:ml-2.5 before:mt-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      {order.payments.map((payment, idx) => (
                        <div key={payment.id || idx} className="relative pl-10 group">
                           <div className="absolute left-0 top-1.5 size-5 bg-white dark:bg-surface-dark border-[3px] border-primary rounded-full group-hover:scale-125 transition-transform z-10 shadow-sm" />
                           
                           <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                 <p className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums group-hover:text-primary transition-colors">
                                   {currencyFormatter.format(payment.amount)}
                                 </p>
                                 <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none text-[8px] font-black px-2.5 py-0.5 tracking-widest uppercase">Pagado</Badge>
                              </div>
                              
                              <div className="space-y-1.5">
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-2">
                                   <Clock size={12} className="text-primary/60" /> {payment.registered_at ? dateFormatter.format(new Date(payment.registered_at)) : '-'}
                                 </p>
                                 <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-2">
                                   <User size={12} /> {payment.recorded_by || 'Administración'}
                                 </p>
                              </div>
                              
                              {payment.notes && (
                                <div className="mt-2 text-[11px] font-medium leading-relaxed text-slate-600 bg-slate-50/80 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 italic relative">
                                  <div className="absolute top-2 right-3 opacity-10"><FileText size={14} /></div>
                                  "{payment.notes}"
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                 <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-500 font-black uppercase text-[9px] tracking-[0.2em] h-10 hover:bg-white transition-all shadow-sm">
                    Ver Expediente Completo
                 </Button>
              </div>
           </Card>

           {/* Quick Activity Card */}
           <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="bg-slate-50/50 py-5 px-8 border-b border-slate-50">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Actividad del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="space-y-6">
                    {order.history?.slice(0, 3).map((entry, idx) => (
                      <div key={idx} className="flex gap-4 group">
                         <div className="mt-1 size-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                            {entry.action?.toLowerCase().includes('create') ? <PlusCircle size={16} /> : 
                             entry.action?.toLowerCase().includes('pay') ? <CheckCircle2 size={16} /> :
                             <Clock size={16} />}
                         </div>
                         <div className="flex-1 space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate">{entry.action}</p>
                            <p className="text-[10px] text-slate-500 leading-snug">{entry.notes}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                               {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Hoy'}
                            </p>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <RegisterPaymentModal
        open={isRegisterModalOpen}
        onOpenChange={setRegisterModalOpen}
        order={{
          id: order.id,
          pendingAmount: order.pendingAmount,
          currency: order.currency,
          supplierName: order.supplier?.name,
          supplierId: order.supplier?.id,
          priority: order.priority
        }}
        onSubmit={handlePaymentSuccess}
      />
    </div>
  )
}

export default PurchasePaymentDetailPage
