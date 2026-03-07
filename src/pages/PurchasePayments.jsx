/**
 * PurchasePayments Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for Mobile and Tablet - Unified with Sales style
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
  Eye,
  Receipt
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'

const currencyFormatter = (lang, currency) => {
  const code = normalizeCurrencyCode(currency)
  if (code === 'PYG') {
    return { format: (val) => formatPYG(val) }
  }
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const dateFormatterFactory = lang =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

const normalizeOrderForModal = order => {
  if (!order) return null
  const pendingAmount = order.pendingAmount ?? null
  return {
    id: order.id,
    pendingAmount: pendingAmount !== null ? Number.parseFloat(pendingAmount) : null,
    currency: order.currency || 'PYG',
    supplierName: order.supplier?.name || '',
    supplierId: order.supplier?.id ?? null,
    priority: order.priority ?? null,
  }
}

const PurchasePaymentsPage = () => {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { toasts, removeToast, info: showInfo, success: showSuccess } = useToast()

  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState(null)

  const {
    orders, filters, meta, loading, error, fetchOrders, setFilter, resetFilters,
  } = usePurchasePaymentsMvpStore()

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const dateFormatter = useMemo(() => dateFormatterFactory(lang), [lang])
  const formatCurrency = (val, cur) => currencyFormatter(lang, cur).format(val || 0)

  const handleRefresh = () => { fetchOrders(); showInfo('Actualizando...') }
  const handleReset = () => { resetFilters(); fetchOrders() }

  const handleRegisterPayment = order => {
    setModalOrder(normalizeOrderForModal(order))
    setRegisterModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    setRegisterModalOpen(false)
    fetchOrders()
    showSuccess('Pago registrado exitosamente')
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid': case 'pagado':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-medium text-xs px-2 py-0.5">Pagado</Badge>
      case 'partial': case 'parcial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-medium text-xs px-2 py-0.5">Parcial</Badge>
      case 'overdue': case 'vencido':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-medium text-xs px-2 py-0.5">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-medium text-xs px-2 py-0.5">Pendiente</Badge>
    }
  }

  if (error) return <div className="h-[60vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error} onRetry={handleRefresh} /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-primary pl-4 md:pl-6 py-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Pagos Compras</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestión de obligaciones y tesorería</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="h-10 md:h-12 border-slate-200 font-medium text-sm rounded-lg self-start sm:self-auto transition-all">
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
        </Button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
         {[
           { label: 'Pendientes de Pago', count: orders.filter(o => o.status === 'pending').length, color: 'amber', icon: Clock },
           { label: 'Pagos Parciales', count: orders.filter(o => o.status === 'partial').length, color: 'blue', icon: CircleDollarSign },
           { label: 'Liquidadas Hoy', count: orders.filter(o => o.status === 'completed' || o.status === 'paid').length, color: 'emerald', icon: CheckCircle2 }
         ].map((stat, i) => (
           <Card key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-6 flex items-start gap-4">
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-500 truncate">{stat.label}</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums break-words mt-1">{stat.count} <span className="text-sm font-normal text-slate-400">Docs</span></h2>
                 </div>
                 <div className={`flex-shrink-0 size-12 bg-${stat.color}-500/10 rounded-lg flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}><stat.icon size={24} /></div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600 ml-1">Proveedor</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Filtrar proveedor..." value={filters.search} onChange={e => setFilter('search', e.target.value)} className="h-10 pl-9 rounded-md bg-white border-slate-400" /></div></div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 ml-1">Estado</label>
              <Select value={filters.status} onValueChange={val => setFilter('status', val)}>
                <SelectTrigger className="h-10 rounded-md bg-white border-slate-400 text-sm font-medium"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent className="rounded-md"><SelectItem value="all" className="text-sm">Todos</SelectItem><SelectItem value="pending" className="text-sm">Pendiente</SelectItem><SelectItem value="partial" className="text-sm">Parcial</SelectItem><SelectItem value="paid" className="text-sm">Pagado</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600 ml-1">Desde</label><Input type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} className="h-10 rounded-md bg-white border-slate-400 text-sm" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-slate-600 ml-1">Hasta</label><Input type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} className="h-10 rounded-md bg-white border-slate-400 text-sm" /></div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Button onClick={handleRefresh} className="h-10 bg-primary text-white font-medium text-sm rounded-md flex-1 sm:flex-none px-8 transition-all active:scale-95">Filtrar</Button>
            <Button variant="outline" onClick={handleReset} className="h-10 rounded-md border-slate-400 font-medium text-sm px-6 hover:text-red-500">Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
           <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Buscar por ID o proveedor..." value={filters.search} onChange={e => setFilter('search', e.target.value)} className="h-9 pl-9 rounded-md bg-white border-slate-400 text-sm" /></div>
           <div className="text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md whitespace-nowrap">{meta.total} Resultados</div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-30" /><p className="text-sm font-medium text-slate-500">Cargando...</p></div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center px-6"><Search size={40} className="mx-auto text-slate-200 mb-4" /><h3 className="text-base font-semibold text-slate-900 dark:text-white">Sin coincidencias</h3></div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader><TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 px-6">ID Orden</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 px-4">Proveedor</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 px-4">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 px-4 text-center">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 px-4 text-right">Facturado</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 px-4 text-right">Pendiente</TableHead>
                  <TableHead className="w-20 px-6"></TableHead>
                </TableRow></TableHeader>
                <TableBody className="divide-y divide-slate-200">
                  {orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/pagos-compras/${order.id}`)}>
                      <TableCell className="py-4 px-6 font-semibold text-sm">#{order.id}</TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                           <div className="size-9 bg-primary/5 rounded-md flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors"><Building size={18} /></div>
                           <div className="flex flex-col">
                              <span className="font-semibold text-sm truncate max-w-[200px]">{order.supplier?.name}</span>
                              <span className="text-xs text-slate-500 font-medium">Doc: {4000 + order.id}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm text-slate-600">{order.issue_date ? dateFormatter.format(new Date(order.issue_date)) : '-'}</TableCell>
                      <TableCell className="px-4 text-center">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="px-4 text-right font-medium text-slate-500 tabular-nums">{formatCurrency(order.total_amount, order.currency)}</TableCell>
                      <TableCell className="px-4 text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(order.pendingAmount, order.currency)}</TableCell>
                      <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 rounded-md text-slate-400 hover:text-primary hover:bg-slate-100 transition-all"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-1 rounded-md shadow-md border-slate-200">
                          <DropdownMenuItem onClick={() => navigate(`/pagos-compras/${order.id}`)} className="gap-2 py-2 text-sm font-medium rounded cursor-pointer"><Eye size={16} /> Ver Maestro</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRegisterPayment(order)} disabled={order.status === 'paid'} className="gap-2 py-2 text-sm font-medium rounded text-emerald-600 cursor-pointer"><CircleDollarSign size={16} /> Registrar Pago</DropdownMenuItem>
                        </DropdownMenuContent></DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Cards View */}
            <div className="lg:hidden divide-y divide-slate-200">
              {orders.map(order => (
                <div key={order.id} className="p-4 space-y-4 active:bg-slate-50 transition-colors" onClick={() => navigate(`/pagos-compras/${order.id}`)}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-primary">ORDEN #{order.id}</span>
                      <span className="font-semibold text-slate-900 text-base leading-tight">{order.supplier?.name}</span>
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <Calendar size={12} />
                        <span className="text-xs font-medium">{order.issue_date ? dateFormatter.format(new Date(order.issue_date)) : '-'}</span>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex justify-between items-end bg-slate-50 p-3 rounded-md border border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-500">Importe Total</span>
                      <span className="font-semibold text-sm tabular-nums">{formatCurrency(order.total_amount, order.currency)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-medium text-slate-500">Saldo Pendiente</span>
                      <span className="font-bold text-base text-slate-900 tabular-nums">{formatCurrency(order.pendingAmount, order.currency)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    <Button onClick={() => handleRegisterPayment(order)} disabled={order.status === 'paid'} className="flex-1 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-medium text-sm rounded-md transition-all">
                      <CircleDollarSign size={16} className="mr-2" /> Registrar Pago
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 w-12 rounded-md border-slate-400 transition-all active:scale-95"><MoreVertical size={18} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1 rounded-md shadow-md border-slate-200">
                        <DropdownMenuItem onClick={() => navigate(`/pagos-compras/${order.id}`)} className="gap-2 py-2 font-medium text-sm rounded"><Eye size={16} /> Ver Detalle Maestro</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 py-2 font-medium text-sm rounded text-slate-500"><Download size={16} /> Descargar Comprobante</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
           <div className="px-4 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Pág. {meta.page} de {meta.totalPages}</p>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" disabled={!meta.hasPrevious} onClick={() => setFilter('page', meta.page - 1)} className="h-9 rounded-md border-slate-400 px-3 transition-all active:scale-95"><ChevronLeft size={16} /></Button>
                 <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setFilter('page', meta.page + 1)} className="h-9 rounded-md border-slate-400 px-3 transition-all active:scale-95"><ChevronRight size={16} /></Button>
              </div>
           </div>
        )}
      </div>

      <RegisterPaymentModal open={isRegisterModalOpen} onOpenChange={setRegisterModalOpen} order={modalOrder} onSubmit={handlePaymentSuccess} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default PurchasePaymentsPage
