/**
 * PurchasePayments Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Download,
  PlusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Calendar,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  CircleDollarSign,
  Building,
  User,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import ToastContainer from '@/components/ui/ToastContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { classifySupplierSearchTerm } from '@/services/purchasePaymentsMvpService'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

const currencyFormatter = (lang, currency) => {
  const code = normalizeCurrencyCode(currency)
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: code === 'PYG' ? 0 : 2,
    maximumFractionDigits: code === 'PYG' ? 0 : 2,
  })
}

const dateFormatterFactory = lang =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

const buildStatusOptions = (raw = []) => [
  { value: 'all', label: 'purchasePaymentsMvp.filters.status.all' },
  ...raw.map(option => ({
    value: option.value,
    label: `purchasePaymentsMvp.status.${option.value}`,
  })),
]

const normalizeOrderForModal = order => {
  if (!order) return null

  const rawPending = order.pendingAmount ?? null
  const pendingValue =
    rawPending === null || rawPending === undefined
      ? null
      : Number.parseFloat(rawPending)
  const pendingAmount = Number.isNaN(pendingValue) ? null : pendingValue

  return {
    id: order.id,
    pendingAmount,
    currency: order.currency || 'PYG',
    supplierName: order.supplier?.name || '',
    supplierId: order.supplier?.id ?? null,
    priority: order.priority ?? null,
  }
}

const PurchasePaymentsPage = () => {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { toasts, removeToast, info: showInfo, success: showSuccess, error: showError } = useToast()

  const [selectedOrders, setSelectedOrders] = useState(() => new Set())
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState(null)

  const {
    orders,
    filters,
    meta,
    statuses,
    loading,
    error,
    fetchOrders,
    setFilter,
    resetFilters,
  } = usePurchasePaymentsMvpStore()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const statusOptions = useMemo(() => buildStatusOptions(statuses), [statuses])
  const dateFormatter = useMemo(() => dateFormatterFactory(lang), [lang])

  const handleSearchChange = e => {
    const value = e.target.value
    setFilter('search', value)
  }

  const handleStatusChange = value => {
    setFilter('status', value)
  }

  const handleDateChange = (field, value) => {
    setFilter(field, value)
  }

  const handleRefresh = () => {
    fetchOrders()
    showInfo(t('purchasePaymentsMvp.messages.refreshing'))
  }

  const handleReset = () => {
    resetFilters()
    fetchOrders()
  }

  const handleSelectAll = checked => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }

  const handleSelectOrder = (id, checked) => {
    const next = new Set(selectedOrders)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSelectedOrders(next)
  }

  const handleRegisterPayment = order => {
    setModalOrder(normalizeOrderForModal(order))
    setRegisterModalOpen(true)
  }

  const handleViewDetail = id => {
    navigate(`/pagos-compras/${id}`)
  }

  const handlePaymentSuccess = result => {
    setRegisterModalOpen(false)
    fetchOrders()
    showSuccess(t('purchasePaymentsMvp.messages.paymentRegistered'))
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Pagado</Badge>
      case 'partial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Parcial</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">Pendiente</Badge>
    }
  }

  const getPriorityBadge = priority => {
    const p = priority?.toLowerCase()
    switch (p) {
      case 'high':
        return <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 text-[9px] font-black uppercase px-2">Alta</Badge>
      case 'medium':
        return <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30 text-[9px] font-black uppercase px-2">Media</Badge>
      default:
        return <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700 text-[9px] font-black uppercase px-2">Baja</Badge>
    }
  }

  if (error) {
    return (
      <div className="animate-in fade-in duration-500 h-[60vh] flex items-center justify-center">
        <DataState
          variant="error"
          title={t('purchasePaymentsMvp.error.title')}
          message={error}
          onRetry={handleRefresh}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-[1600px] mx-auto py-4 px-4 sm:px-0">
      {/* Page Header - Refined Glassmorphism */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 dark:border-slate-800/60 shadow-fluent-8 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3 mb-1">
             <div className="size-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
               <CircleDollarSign size={24} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
               {t('purchasePaymentsMvp.title', 'Pagos a Proveedores')}
             </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-bold uppercase tracking-widest px-1 opacity-70">
            {t('purchasePaymentsMvp.subtitle', 'Gestión inteligente de obligaciones y tesorería')}
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="h-14 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95 px-8"
          >
            <RefreshCw size={18} className={`mr-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button
            className="h-14 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-primary/40 transition-all active:scale-95 px-10 border-t border-white/20"
          >
            <PlusCircle size={20} className="mr-3" />
            Nueva Operación
          </Button>
        </div>
      </header>

      {/* Stats Overview - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {[
           { label: 'Pendientes de Pago', count: orders.filter(o => o.status === 'pending').length, color: 'amber', icon: Clock },
           { label: 'En Proceso (Parcial)', count: orders.filter(o => o.status === 'partial').length, color: 'blue', icon: CircleDollarSign },
           { label: 'Liquidadas Hoy', count: orders.filter(o => o.status === 'completed' || o.status === 'paid').length, color: 'emerald', icon: CheckCircle2 }
         ].map((stat, i) => (
           <Card key={i} className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-16 hover:-translate-y-1 transition-all duration-500 cursor-default">
              <CardContent className="p-8 flex items-center justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">{stat.label}</p>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none tabular-nums">
                      {stat.count} <span className="text-sm font-bold text-slate-300 uppercase tracking-widest ml-1 opacity-50">Docs</span>
                    </h2>
                 </div>
                 <div className={`size-16 bg-${stat.color}-500/10 rounded-3xl flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:bg-${stat.color}-500 group-hover:text-white transition-all duration-500 shadow-inner`}>
                    <stat.icon size={32} />
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-10">
        {/* Advanced Filter Bar - Integrated Design */}
        <div className="flex flex-col lg:flex-row items-end gap-6 bg-slate-100/50 dark:bg-slate-900/30 p-8 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex-1 w-full space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2 flex items-center gap-2">
              <Search size={12} className="text-primary" /> Búsqueda Global de Transacciones
            </label>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Busca por proveedor, RUC, número de orden o referencia..."
                value={filters.search}
                onChange={handleSearchChange}
                className="h-16 pl-14 rounded-2xl bg-white dark:bg-slate-900 border-none font-bold text-slate-900 dark:text-white transition-all focus-visible:ring-4 focus-visible:ring-primary/10 shadow-fluent-shadow placeholder:text-slate-400 placeholder:font-medium placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
              />
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Filtro de Estado</label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-16 rounded-2xl bg-white dark:bg-slate-900 border-none font-black uppercase text-[10px] tracking-widest shadow-fluent-shadow transition-all focus:ring-4 focus:ring-primary/10">
                <SelectValue placeholder={t('purchasePaymentsMvp.filters.status.all')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl p-2 min-w-[240px]">
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-xl font-bold uppercase text-[10px] tracking-[0.15em] py-4 focus:bg-primary/5 focus:text-primary transition-colors">
                    {t(opt.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 h-16 w-full lg:w-auto mt-2">
             <Button 
              variant="default" 
              onClick={handleRefresh}
              className="h-full px-8 rounded-2xl bg-slate-900 hover:bg-black dark:bg-primary dark:hover:bg-primary-hover text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95"
             >
               <Filter size={18} className="mr-3" />
               Aplicar
             </Button>
             <Button 
              variant="outline" 
              onClick={handleReset}
              className="h-full px-6 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all hover:bg-red-50/50"
             >
               <RefreshCw size={20} />
             </Button>
          </div>
        </div>

        {/* Improved Date Range Picker Row */}
        <div className="flex flex-wrap items-center gap-10 px-4">
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rango:</span>
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl px-4 py-2 shadow-sm border border-slate-100 dark:border-slate-800">
                <input 
                  type="date" 
                  value={filters.dateFrom} 
                  onChange={e => handleDateChange('dateFrom', e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 outline-none w-32 cursor-pointer"
                />
                <div className="w-4 h-[1px] bg-slate-200 mx-3" />
                <input 
                  type="date" 
                  value={filters.dateTo} 
                  onChange={e => handleDateChange('dateTo', e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 outline-none w-32 cursor-pointer"
                />
              </div>
           </div>
           
           <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800" />
           
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">
              <Download size={14} className="opacity-40" /> {meta.total} Entradas indexadas en el core
           </div>
        </div>

        {/* Data Table Area - Ultra Premium Table */}
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-fluent-16 overflow-hidden">
          {loading && orders.length === 0 ? (
            <div className="py-56 flex flex-col items-center justify-center gap-6">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <RefreshCw className="w-16 h-16 animate-spin text-primary relative z-10" />
               </div>
               <p className="text-[11px] font-black uppercase tracking-[0.5em] text-primary/60 animate-pulse">Consultando base de datos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-56 flex flex-col items-center justify-center text-center px-12">
               <div className="size-32 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-800 mb-8 border border-slate-100 dark:border-slate-800 shadow-inner group">
                  <Search size={64} className="group-hover:scale-110 transition-transform duration-500" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin coincidencias</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-3 font-bold uppercase tracking-wide opacity-70">Ajusta los filtros o intenta con términos más generales para encontrar la transacción.</p>
               <Button variant="outline" onClick={handleReset} className="mt-10 h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] px-10 border-2 border-slate-200 group hover:border-primary transition-all">
                 <RefreshCw size={16} className="mr-3 group-hover:rotate-180 transition-transform duration-500" />
                 Restaurar Filtros
               </Button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <Table className="min-w-[1300px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="w-20 py-8 px-8">
                      <Checkbox
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="rounded-lg border-slate-300 w-5 h-5 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Identificador</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Proveedor de Servicios</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Fecha Registro</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Estado Contable</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6">Prioridad</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 text-right">Monto Facturado</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 text-right">Obligación Neta</TableHead>
                    <TableHead className="w-24 px-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-pointer h-24" onClick={() => handleViewDetail(order.id)}>
                      <TableCell className="py-6 px-8" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={checked => handleSelectOrder(order.id, checked)}
                          className="rounded-lg border-slate-200 w-5 h-5 transition-all group-hover:border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-slate-900 dark:text-white text-base tracking-tighter group-hover:text-primary transition-colors">#{order.id}</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Doc No: {4000 + order.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex items-center gap-4">
                           <div className="size-12 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary transition-all duration-500 shadow-sm relative overflow-hidden">
                              <Building size={20} className="relative z-10" />
                              <div className="absolute inset-0 bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-700" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-sm group-hover:text-primary transition-colors">
                                {order.supplier?.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                  <User size={10} className="text-slate-300" /> {order.supplier?.contact || 'N/A'}
                                </span>
                              </div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex flex-col gap-1">
                           <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 capitalize">
                             <Calendar size={14} className="text-primary/40" />
                             {order.issue_date ? dateFormatter.format(new Date(order.issue_date)) : '-'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="px-6">
                        {getPriorityBadge(order.priority)}
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        <span className="font-bold text-slate-400 text-xs">
                           {currencyFormatter(lang, order.currency).format(order.total_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        <span className="font-black text-slate-900 dark:text-white text-lg tracking-tighter leading-none block group-hover:text-primary transition-colors">
                           {currencyFormatter(lang, order.currency).format(order.pendingAmount)}
                        </span>
                        {order.totalPaid > 0 && (
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Pagado: {currencyFormatter(lang, order.currency).format(order.totalPaid)}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-10 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-11 rounded-2xl text-slate-300 hover:text-primary hover:bg-primary/10 transition-all">
                              <MoreVertical size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 p-3 rounded-[1.5rem] border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
                            <DropdownMenuItem onClick={() => handleViewDetail(order.id)} className="gap-4 py-4 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl focus:bg-primary/5 focus:text-primary transition-colors">
                               <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center"><Search size={18} /></div>
                               Ver Detalle Maestro
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRegisterPayment(order)}
                              disabled={order.status === 'completed' || order.status === 'paid'}
                              className="gap-4 py-4 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl focus:bg-emerald-50 focus:text-emerald-600 dark:focus:bg-emerald-900/30 transition-colors"
                            >
                               <div className="size-8 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600"><CircleDollarSign size={18} /></div>
                               Registrar Pago Ahora
                            </DropdownMenuItem>
                            <Separator className="my-2 opacity-50" />
                            <DropdownMenuItem className="gap-4 py-4 px-5 font-black uppercase text-[10px] tracking-widest rounded-xl text-slate-400 hover:text-slate-600 focus:bg-slate-50 transition-colors">
                               <div className="size-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center"><Download size={18} /></div>
                               Descargar Comprobante
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination - Premium Layout */}
          <footer className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página</span>
                  <span className="text-sm font-black text-primary">{meta.page}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">de {meta.totalPages}</span>
               </div>
               <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Core Transaction Engine v2.4</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setFilter('page', meta.page - 1)}
                disabled={!meta.hasPrevious || loading}
                className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-700 font-black uppercase tracking-[0.1em] text-[10px] hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft size={16} className="mr-2" /> Anterior
              </Button>
              
              <div className="flex items-center gap-2">
                 {[...Array(meta.totalPages)].map((_, i) => {
                   const p = i + 1;
                   if (p === 1 || p === meta.totalPages || (p >= meta.page - 1 && p <= meta.page + 1)) {
                     return (
                       <Button
                        key={p}
                        variant={p === meta.page ? "default" : "ghost"}
                        className={`size-11 rounded-xl text-xs font-black shadow-none transition-all ${p === meta.page ? 'bg-slate-900 text-white dark:bg-primary shadow-xl shadow-primary/20 scale-110' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}
                        onClick={() => setFilter('page', p)}
                       >
                         {p}
                       </Button>
                     )
                   }
                   if (p === meta.page - 2 || p === meta.page + 2) return <span key={p} className="w-4 text-center text-slate-300 font-bold">·</span>
                   return null;
                 })}
              </div>

              <Button
                variant="outline"
                onClick={() => setFilter('page', meta.page + 1)}
                disabled={!meta.hasNext || loading}
                className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-700 font-black uppercase tracking-[0.1em] text-[10px] hover:bg-white hover:text-primary transition-all shadow-sm active:scale-95"
              >
                Siguiente <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </footer>
        </div>
      </div>

      <RegisterPaymentModal
        open={isRegisterModalOpen}
        onOpenChange={setRegisterModalOpen}
        order={modalOrder}
        onSubmit={handlePaymentSuccess}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default PurchasePaymentsPage
