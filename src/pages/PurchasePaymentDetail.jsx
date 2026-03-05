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

  const { currentOrder: order, loading, error, fetchOrder } = usePurchasePaymentsMvpStore()
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)

  useEffect(() => { if (orderId) fetchOrder(orderId) }, [orderId, fetchOrder])

  const currencyFormatter = useMemo(() => {
    const code = normalizeCurrencyCode(order?.currency)
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, order?.currency])

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 border-none font-black uppercase text-[9px] px-3 py-1">Pagado</Badge>
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 border-none font-black uppercase text-[9px] px-3 py-1">Parcial</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 border-none font-black uppercase text-[9px] px-3 py-1">Pendiente</Badge>
    }
  }

  if (loading && !order) return <div className="flex flex-col items-center justify-center h-[70vh] gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando...</p></div>
  if (error || !order) return <div className="h-[70vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error || 'No se pudo cargar la orden.'} onRetry={() => fetchOrder(orderId)} /></div>

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto py-2 px-4 md:px-0">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/pagos-compras')} className="size-10 md:size-12 rounded-xl border-slate-200 shrink-0"><ArrowLeft size={20} /></Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
               <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Orden <span className="text-primary">#{order.id}</span></h1>
               {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar size={12} /> {order.issue_date ? new Date(order.issue_date).toLocaleDateString() : '-'}</span>
              <span className="flex items-center gap-1.5"><Package size={12} /> {order.items?.length || 0} Items</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 md:h-12 border-slate-200 font-black uppercase tracking-widest text-[9px] rounded-xl px-4 flex-1 sm:flex-none">Acciones <MoreVertical size={14} className="ml-2" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-slate-200 shadow-xl">
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-lg"><Printer size={16} /> Imprimir</DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-lg"><Share2 size={16} /> Compartir</DropdownMenuItem>
              <Separator className="my-2" />
              <DropdownMenuItem className="gap-3 py-3 font-bold rounded-lg text-primary"><Download size={16} /> Descargar PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setRegisterModalOpen(true)} disabled={['completed', 'paid'].includes(order.status?.toLowerCase())} className="h-10 md:h-12 bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-xl px-6 flex-1 sm:flex-none shadow-lg shadow-primary/20 transition-all active:scale-95">Registrar Pago</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
                <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-50"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">Proveedor <Building size={14} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="space-y-1"><h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{order.supplier?.name}</h3><p className="text-[9px] font-black uppercase text-slate-400">ID: #{order.supplier?.id || '---'}</p></div>
                   <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-3 text-slate-600 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-transparent"><div className="size-7 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm"><User size={14} /></div><span className="truncate">{order.supplier?.contact || 'N/A'}</span></div>
                      <div className="flex items-center gap-3 text-slate-600 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-transparent"><div className="size-7 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm"><MapPin size={14} /></div><span className="truncate">{order.supplier?.address?.street || 'Sin dirección'}</span></div>
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-3xl border-none shadow-lg bg-slate-900 overflow-hidden text-white relative">
                <div className="absolute top-0 right-0 size-24 bg-primary/20 rounded-full blur-3xl" />
                <CardHeader className="bg-white/5 py-4 px-6 relative z-10"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">Finanzas <CircleDollarSign size={14} /></CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6 relative z-10">
                   <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Compra</p><h2 className="text-2xl md:text-3xl font-black text-white tabular-nums">{currencyFormatter.format(order.total_amount)}</h2></div>
                   <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-500 uppercase">Pagado</p><p className="text-sm font-black text-green-400 tabular-nums">{currencyFormatter.format(order.totalPaid || 0)}</p></div>
                      <div className="space-y-0.5"><p className="text-[8px] font-black text-slate-500 uppercase">Saldo</p><p className="text-sm font-black text-primary tabular-nums">{currencyFormatter.format(order.pendingAmount || 0)}</p></div>
                   </div>
                   <div className="space-y-2"><div className="flex justify-between text-[9px] font-black uppercase"><span className="text-slate-500">Avance</span><span className="text-primary">{order.paymentProgressPercent}%</span></div><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-1000" style={{ width: `${order.paymentProgressPercent}%` }} /></div></div>
                </CardContent>
             </Card>
          </div>

          {/* REDISEÑO: Items Section for Purchase */}
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
             <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2"><Package size={16} /> Productos en la Orden</CardTitle><Badge variant="outline" className="text-[8px] font-black px-2 py-0.5 border-slate-200 text-slate-400">{order.items?.length || 0} Registros</Badge></CardHeader>
             <CardContent className="p-0">
                {order.items?.length === 0 ? (
                  <div className="py-12 text-center opacity-40"><Package size={32} className="mx-auto text-slate-200 mb-2" /><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sin productos registrados</p></div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-50/20 border-b border-slate-50"><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 py-4 px-8">Descripción</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Cant.</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Precio</TableHead><TableHead className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-right px-8">Subtotal</TableHead></TableRow></TableHeader>
                        <TableBody className="divide-y divide-slate-50">{order.items?.map((item, idx) => (<TableRow key={idx} className="hover:bg-slate-50 transition-colors"><TableCell className="py-5 px-8"><div className="flex flex-col"><span className="font-bold text-slate-900 text-xs">{item.name}</span><span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">SKU-{Math.floor(Math.random() * 10000)}</span></div></TableCell><TableCell className="text-center font-black text-slate-600 text-[10px]">x{item.quantity}</TableCell><TableCell className="text-right font-bold text-slate-600 text-xs tabular-nums">{currencyFormatter.format(item.unitPrice)}</TableCell><TableCell className="text-right font-black text-slate-900 text-xs tabular-nums px-8">{currencyFormatter.format(item.total)}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-50">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="p-5 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-black text-slate-900 text-sm leading-tight">{item.name}</span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-black text-slate-600 whitespace-nowrap">x{item.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Precio Unit.</span><span className="font-bold text-xs tabular-nums">{currencyFormatter.format(item.unitPrice)}</span></div>
                            <div className="flex flex-col text-right"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span><span className="font-black text-sm text-primary tabular-nums">{currencyFormatter.format(item.total)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="bg-slate-50/50 p-6 flex justify-end items-center border-t border-slate-50"><div className="text-right"><p className="text-[8px] font-black text-primary uppercase mb-0.5">Total Orden</p><h3 className="text-xl md:text-2xl font-black text-primary tabular-nums tracking-tighter leading-none">{currencyFormatter.format(order.total_amount)}</h3></div></div>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6 md:y-8">
           <Card className="rounded-3xl border-slate-100 shadow-sm bg-white dark:bg-surface-dark overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-3">Historial Pagos <History size={14} className="text-primary" /></CardTitle></CardHeader>
              <CardContent className="p-6">
                 {!order.payments || order.payments.length === 0 ? (
                   <div className="py-12 text-center opacity-40"><CircleDollarSign size={32} className="mx-auto text-slate-200 mb-2" /><p className="text-[9px] font-black uppercase text-slate-400">Sin pagos registrados</p></div>
                 ) : (
                   <div className="relative space-y-8 before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-slate-50">
                      {order.payments.map((p, idx) => (
                        <div key={idx} className="relative pl-8 group">
                           <div className="absolute left-0 top-1 size-4 bg-white border-[2.5px] border-primary rounded-full z-10" />
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center"><p className="text-sm font-black text-slate-900 tabular-nums">{currencyFormatter.format(p.amount)}</p><Badge className="bg-green-50 text-green-600 border-none text-[7px] font-black px-2 py-0.5 tracking-widest uppercase">Pagado</Badge></div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2"><Clock size={10} /> {new Date(p.registered_at).toLocaleDateString()}</p>
                              {p.notes && <div className="mt-1 text-[10px] font-medium text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-snug">"{p.notes}"</div>}
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
              <div className="p-4 bg-slate-50/50 border-t border-slate-50"><Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[8px] h-9 tracking-widest">Ver Expediente</Button></div>
           </Card>
        </div>
      </div>

      <RegisterPaymentModal open={isRegisterModalOpen} onOpenChange={setRegisterModalOpen} order={{ id: order.id, pendingAmount: order.pendingAmount, currency: order.currency, supplierName: order.supplier?.name, supplierId: order.supplier?.id, priority: order.priority }} onSubmit={() => { setRegisterModalOpen(false); fetchOrder(orderId); showSuccess('Pago registrado'); }} />
    </div>
  )
}

export default PurchasePaymentDetailPage
