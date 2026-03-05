/**
 * SalePayment Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for high density ERP usage with balanced readability
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Receipt,
  RefreshCw,
  Search,
  CreditCard,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  MoreVertical,
  Eye,
  List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DataState from '@/components/ui/DataState'
import ToastContainer from '@/components/ui/ToastContainer'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { salePaymentService } from '@/services/salePaymentService'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

const formatDocumentId = value => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

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

const SalePayment = () => {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const { toasts, removeToast, error: showError, success: showSuccess, info: showInfo } = useToast()

  // Local state
  const [rawSales, setRawSales] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClientName, setSelectedClientName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Date Filters
  const getDefaultDateRange = () => {
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    return {
      start_date: lastMonth.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total_records: 0,
    total_pages: 0,
  })

  // Modal State
  const [selectedSale, setSelectedSale] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  // Formatters
  const formatCurrency = value => currencyFormatter(lang, 'PYG').format(value || 0)
  const formatDate = dateStr => dateStr ? dateFormatterFactory(lang).format(new Date(dateStr)) : '-'

  const handleLoadSales = async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      let result;
      const filters = {
        page,
        page_size: pagination.page_size,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      }

      if (selectedStatus && selectedStatus !== 'all') {
        filters.payment_status = selectedStatus;
      }

      if (selectedClientName) {
        result = await salePaymentService.getSalesByClientNameWithPaymentStatus(selectedClientName, filters);
      } else {
        result = await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters);
      }

      const normalizedData = (result?.data || []).map(sale => ({
        ...sale,
        id: sale.sale_id || sale.id,
        status: sale.status || sale.payment_status,
        date: sale.sale_date || sale.issue_date || sale.date,
        client_name: sale.client_name || sale.client?.name || 'Ocasional'
      }));

      setRawSales(normalizedData);
      if (result?.pagination) {
        setPagination({
          page: result.pagination.page,
          page_size: result.pagination.page_size,
          total_records: result.pagination.total_records,
          total_pages: result.pagination.total_pages,
        });
      }
    } catch (err) {
      console.error('Error loading sales:', err)
      setError('Error al cargar los cobros de ventas.')
      showError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleLoadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = () => handleLoadSales(1)

  const handleClearFilters = () => {
    setSearchTerm(''); setSelectedClientName(''); setSelectedStatus('all'); setDateRange(getDefaultDateRange());
    setTimeout(() => handleLoadSales(1), 0)
  }

  const handleRefresh = () => {
    handleLoadSales(pagination.page)
    showInfo('Actualizando...')
  }

  const displaySales = useMemo(() => {
    if (!searchTerm) return rawSales;
    const lowerTerm = searchTerm.toLowerCase();
    return rawSales.filter(sale => 
      String(sale.id).includes(lowerTerm) || 
      (sale.client_name || '').toLowerCase().includes(lowerTerm)
    );
  }, [rawSales, searchTerm])

  const handlePaymentSubmit = async paymentData => {
    await salePaymentService.processSalePaymentWithCashRegister(paymentData)
    showSuccess('Cobro registrado exitosamente')
    handleLoadSales(pagination.page)
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid': case 'pagado':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">Pagado</Badge>
      case 'partial': case 'parcial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">Parcial</Badge>
      case 'overdue': case 'vencido':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">Pendiente</Badge>
    }
  }

  if (error) return <div className="h-[60vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error} onRetry={handleRefresh} /></div>

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto py-2 px-4 md:px-0">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-primary pl-4 py-0.5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Cobros de Ventas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Gestión centralizada de cobros</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 border-slate-200 font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-sm">
          <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
        </Button>
      </header>

      {/* KPI Cards (Procesados sobre resultados actuales en pantalla) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {[
           { label: 'Saldos Pendientes', icon: Clock, color: 'amber', value: formatCurrency(displaySales.reduce((acc, s) => acc + (Number(s.balance_due) || 0), 0)) },
           { label: 'Cobros Parciales', icon: CircleDollarSign, color: 'blue', value: `${displaySales.filter(s => s.payment_count > 0 && s.balance_due > 0 || ['partial', 'parcial'].includes(s.status?.toLowerCase())).length} Ventas` },
           { label: 'Cobros Exitosos', icon: CheckCircle2, color: 'green', value: formatCurrency(displaySales.reduce((acc, s) => acc + (Number(s.total_paid) || Number(s.amount_paid) || 0), 0)) }
         ].map((kpi, i) => (
           <Card key={i} className="rounded-xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-4">
                 <div className={`size-10 bg-${kpi.color}-500/10 rounded-xl flex items-center justify-center text-${kpi.color}-600`}><kpi.icon size={20} /></div>
                 <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p><h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">{kpi.value}</h2></div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="space-y-4">
        {/* Filter Toolbar */}
        <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
          <CardContent className="p-4 flex flex-col xl:flex-row items-end gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 truncate block">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Filtrar cliente..."
                    value={selectedClientName}
                    onChange={e => setSelectedClientName(e.target.value)}
                    className="h-10 pl-10 min-w-0 w-full rounded-md bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-primary/20 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 truncate block">Estado</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10 min-w-0 w-full rounded-md bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] tracking-widest shadow-inner [&>span]:truncate">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800 shadow-fluent-16">
                    <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest">Todos</SelectItem>
                    <SelectItem value="pending" className="font-bold uppercase text-[10px] tracking-widest">Pendiente</SelectItem>
                    <SelectItem value="partial" className="font-bold uppercase text-[10px] tracking-widest">Parcial</SelectItem>
                    <SelectItem value="paid" className="font-bold uppercase text-[10px] tracking-widest">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 truncate block">Desde</label>
                <Input
                  type="date"
                  value={dateRange.start_date}
                  onChange={e => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-10 min-w-0 w-full rounded-md bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm font-semibold shadow-inner"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 truncate block">Hasta</label>
                <Input
                  type="date"
                  value={dateRange.end_date}
                  onChange={e => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className="h-10 min-w-0 w-full rounded-md bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm font-semibold shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0">
              <Button 
                onClick={applyFilters} 
                className="h-10 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-md px-6 flex-1 xl:flex-none shadow-sm active:scale-95 transition-all"
              >
                <Filter size={16} className="mr-2" /> Filtrar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="h-10 rounded-md border-slate-200 dark:border-slate-700 font-bold text-slate-500 hover:text-red-500 text-[10px] uppercase tracking-widest min-w-24"
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-fluent-shadow overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
             <div className="relative w-full max-w-sm">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <Input
                 placeholder="Buscar venta (ID o cliente)..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="h-9 pl-10 rounded-md bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 text-sm shadow-sm"
               />
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
               {displaySales.length} Resultados
             </div>
          </div>

          {isLoading && displaySales.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando...</p>
            </div>
          ) : displaySales.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Receipt size={36} className="mx-auto text-slate-200 mb-3" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Sin resultados</h3>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader><TableRow className="bg-transparent border-none hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Cliente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Fecha</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Estado</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Progreso</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Total</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Pendiente</TableHead>
                    <TableHead className="w-16 px-6"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {displaySales.map(sale => (
                      <TableRow key={sale.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => navigate(`/cobros-ventas/${sale.id}`)}>
                        <TableCell className="py-3.5 px-6 font-black text-sm">#{sale.id}</TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{sale.client_name}</span>
                            {(sale.client?.document_id || sale.client_document_id) && (
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                CI: {formatDocumentId(sale.client?.document_id || sale.client_document_id)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-xs font-semibold">{formatDate(sale.date)}</TableCell>
                        <TableCell className="px-4 text-center">{getStatusBadge(sale.status)}</TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col items-end gap-1.5 w-24 ml-auto">
                            <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
                              <span>{sale.payment_progress}%</span>
                              {sale.payment_count > 0 && <span className="text-primary">{sale.payment_count} pago{sale.payment_count > 1 ? 's' : ''}</span>}
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", sale.payment_progress >= 100 ? "bg-green-500" : sale.payment_progress > 0 ? "bg-blue-500" : "bg-transparent")} style={{ width: `${Math.min(100, Math.max(0, sale.payment_progress || 0))}%` }} />
                            </div>
                            {sale.payment_method && <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">{sale.payment_method}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-right font-bold text-sm tabular-nums">{formatCurrency(sale.total_amount)}</TableCell>
                        <TableCell className="px-4 text-right font-black text-primary text-sm tabular-nums">{formatCurrency(sale.balance_due)}</TableCell>
                        <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5"><MoreVertical size={16} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-lg shadow-lg">
                              <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}`)} className="gap-3 py-2.5 font-bold text-xs rounded-md cursor-pointer"><Eye size={16} /> Detalle</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}/pagos`)} className="gap-3 py-2.5 font-bold text-xs rounded-md cursor-pointer"><List size={16} /> Historial</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedSale(sale); setIsPaymentModalOpen(true); }} disabled={['paid', 'pagado'].includes(sale.status?.toLowerCase())} className="gap-3 py-2.5 font-bold text-xs rounded-md text-green-600 cursor-pointer hover:text-green-700 hover:bg-green-50"><CreditCard size={16} /> Cobrar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="lg:hidden divide-y divide-slate-100">
                {displaySales.map(sale => (
                  <div key={sale.id} className="p-4 space-y-4 active:bg-slate-50" onClick={() => navigate(`/cobros-ventas/${sale.id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-sm text-primary">#{sale.id}</span>
                        <span className="font-black text-slate-900 text-base">{sale.client_name}</span>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase">{formatDate(sale.date)}</span>
                        </div>
                      </div>
                      {getStatusBadge(sale.status)}
                    </div>
                    <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Factura</span>
                          <span className="font-bold text-sm tabular-nums">{formatCurrency(sale.total_amount)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                          <span className="font-black text-base text-primary tabular-nums">{formatCurrency(sale.balance_due)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>{sale.payment_progress}% Pagado</span>
                          <span>{sale.payment_count || 0} pago(s) {sale.payment_method ? `• ${sale.payment_method}` : ''}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", sale.payment_progress >= 100 ? "bg-green-500" : sale.payment_progress > 0 ? "bg-blue-500" : "bg-transparent")} style={{ width: `${Math.min(100, Math.max(0, sale.payment_progress || 0))}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                      <Button onClick={() => { setSelectedSale(sale); setIsPaymentModalOpen(true); }} disabled={['paid', 'pagado'].includes(sale.status?.toLowerCase())} className="flex-1 h-9 bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-black uppercase tracking-widest text-[10px] rounded-md transition-all">
                        <CreditCard size={14} className="mr-2" /> Registrar Cobro
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-9 w-11 rounded-md border-slate-200"><MoreVertical size={18} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-2 rounded-lg">
                          <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}`)} className="gap-3 py-3 font-bold text-xs rounded-md"><Eye size={18} /> Ver Detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}/pagos`)} className="gap-3 py-3 font-bold text-xs rounded-md"><List size={18} /> Historial de Pagos</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {pagination.total_pages > 1 && (
             <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pág. {pagination.page} de {pagination.total_pages}</p>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => handleLoadSales(pagination.page - 1)} className="h-9 rounded-md border-slate-200 px-3"><ChevronLeft size={16} /></Button>
                   <Button variant="outline" size="sm" disabled={pagination.page >= pagination.total_pages} onClick={() => handleLoadSales(pagination.page + 1)} className="h-9 rounded-md border-slate-200 px-3"><ChevronRight size={16} /></Button>
                </div>
             </div>
          )}
        </div>
      </div>

      <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={open => { setIsPaymentModalOpen(open); if (!open) setSelectedSale(null); }} sale={selectedSale} onSubmit={handlePaymentSubmit} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default SalePayment
