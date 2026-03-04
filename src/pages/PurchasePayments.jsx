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
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { classifySupplierSearchTerm } from '@/services/purchasePaymentsMvpService'

const currencyFormatter = (lang, currency) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: currency || 'PYG',
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  })

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
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto py-2">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
            {t('purchasePaymentsMvp.title', 'Pagos a Proveedores')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium font-display">
            {t('purchasePaymentsMvp.subtitle', 'Gestione y registre pagos de órdenes de compra')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="h-12 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            className="h-12 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <PlusCircle size={18} className="mr-2" />
            Nueva Compra
          </Button>
        </div>
      </header>

      {/* Stats Overview (Optional Refinement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-5">
               <div className="size-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <Clock size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendientes de Pago</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {orders.filter(o => o.status === 'pending').length} Órdenes
                  </h2>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-5">
               <div className="size-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <CircleDollarSign size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagos Parciales</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {orders.filter(o => o.status === 'partial').length} Órdenes
                  </h2>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-5">
               <div className="size-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completadas hoy</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {orders.filter(o => o.status === 'completed').length} Órdenes
                  </h2>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Advanced Filters */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Buscar Proveedor u Orden</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder={t('purchasePaymentsMvp.filters.search.placeholder')}
                      value={filters.search}
                      onChange={handleSearchChange}
                      className="h-12 pl-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-medium transition-all focus:ring-2 focus:ring-primary shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado de Pago</label>
                  <Select value={filters.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-bold uppercase text-[10px] tracking-widest shadow-inner transition-all">
                      <SelectValue placeholder={t('purchasePaymentsMvp.filters.status.all')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-16 p-1">
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="rounded-lg font-bold uppercase text-[10px] tracking-widest py-3">
                          {t(opt.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                   <Button 
                    variant="secondary" 
                    onClick={handleRefresh}
                    className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                   >
                     <Filter size={16} className="mr-2" />
                     Filtrar
                   </Button>
                   <Button 
                    variant="ghost" 
                    onClick={handleReset}
                    className="h-12 px-4 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                   >
                     <RefreshCw size={18} />
                   </Button>
                </div>
              </div>

              {/* Secondary Filters (Dates) */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Desde Fecha
                    </label>
                    <Input 
                      type="date" 
                      value={filters.dateFrom} 
                      onChange={e => handleDateChange('dateFrom', e.target.value)}
                      className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 font-semibold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Hasta Fecha
                    </label>
                    <Input 
                      type="date" 
                      value={filters.dateTo} 
                      onChange={e => handleDateChange('dateTo', e.target.value)}
                      className="h-11 rounded-lg bg-transparent border-slate-200 dark:border-slate-800 font-semibold"
                    />
                 </div>
                 <div className="flex justify-end pt-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                      Visualizando {orders.length} de {meta.total} registros
                    </div>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-fluent-shadow overflow-hidden">
          {loading && orders.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center gap-4">
               <RefreshCw className="w-12 h-12 animate-spin text-primary opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando órdenes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center text-center px-6">
               <div className="size-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-800 mb-6 border-4 border-white dark:border-slate-800 shadow-inner">
                  <Search size={48} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin resultados</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-2 font-medium">No se encontraron órdenes de compra que coincidan con los criterios de búsqueda.</p>
               <Button variant="outline" onClick={handleReset} className="mt-8 rounded-xl font-bold uppercase tracking-widest text-[10px]">Limpiar Filtros</Button>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50/80 border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="w-14 py-5 px-6">
                      <Checkbox
                        checked={selectedOrders.size === orders.length && orders.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">Orden ID</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">Proveedor</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">Fecha Emisión</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">Estado Pago</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4">Prioridad</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4 text-right">Monto Total</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-500 px-4 text-right">Saldo Pendiente</TableHead>
                    <TableHead className="w-20 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => handleViewDetail(order.id)}>
                      <TableCell className="py-5 px-6" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={checked => handleSelectOrder(order.id, checked)}
                          className="rounded border-slate-300"
                        />
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="font-black text-slate-900 dark:text-white text-sm">#{order.id}</span>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                           <div className="size-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <PlusCircle size={18} />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                                {order.supplier?.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest truncate max-w-[180px]">
                                {order.supplier?.contact || 'Sin contacto'}
                              </span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {order.issue_date ? dateFormatter.format(new Date(order.issue_date)) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="px-4">
                        {getPriorityBadge(order.priority)}
                      </TableCell>
                      <TableCell className="px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {currencyFormatter(lang, order.currency).format(order.total_amount)}
                      </TableCell>
                      <TableCell className="px-4 text-right font-black text-primary dark:text-primary-foreground tabular-nums">
                        {currencyFormatter(lang, order.currency).format(order.pendingAmount)}
                      </TableCell>
                      <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-16">
                            <DropdownMenuItem onClick={() => handleViewDetail(order.id)} className="gap-3 py-3 font-bold rounded-lg focus:bg-slate-50">
                              <Search size={18} /> Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRegisterPayment(order)}
                              disabled={order.status === 'completed' || order.status === 'paid'}
                              className="gap-3 py-3 font-bold rounded-lg focus:bg-green-50 focus:text-green-600 dark:focus:bg-green-900/30"
                            >
                              <CircleDollarSign size={18} /> Registrar Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-3 font-bold rounded-lg text-slate-400 focus:bg-slate-50">
                              <Download size={18} /> Exportar PDF
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

          {/* Pagination */}
          <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Página {meta.page} de {meta.totalPages} ({meta.total} registros totales)
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('page', meta.page - 1)}
                disabled={!meta.hasPrevious || loading}
                className="h-10 rounded-lg border-slate-200 dark:border-slate-700 font-bold px-4"
              >
                <ChevronLeft size={16} className="mr-2" /> Anterior
              </Button>
              <div className="flex items-center gap-1 px-4">
                 {[...Array(meta.totalPages)].map((_, i) => {
                   const p = i + 1;
                   // Show only first, last and near current page
                   if (p === 1 || p === meta.totalPages || (p >= meta.page - 1 && p <= meta.page + 1)) {
                     return (
                       <Button
                        key={p}
                        variant={p === meta.page ? "default" : "ghost"}
                        size="sm"
                        className={`size-10 rounded-lg font-black ${p === meta.page ? 'bg-primary text-white shadow-md' : 'text-slate-500'}`}
                        onClick={() => setFilter('page', p)}
                       >
                         {p}
                       </Button>
                     )
                   }
                   if (p === meta.page - 2 || p === meta.page + 2) return <span key={p} className="px-1 text-slate-300">...</span>
                   return null;
                 })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('page', meta.page + 1)}
                disabled={!meta.hasNext || loading}
                className="h-10 rounded-lg border-slate-200 dark:border-slate-700 font-bold px-4"
              >
                Siguiente <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RegisterPaymentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        order={modalOrder}
        onSuccess={handlePaymentSuccess}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default PurchasePaymentsPage
