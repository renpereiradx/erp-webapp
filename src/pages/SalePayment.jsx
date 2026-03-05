/**
 * SalePayment Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for Mobile and Tablet
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  RefreshCw,
  Search,
  CreditCard,
  X,
  User,
  Filter,
  ArrowLeft,
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
import useClientStore from '@/store/useClientStore'
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
  const { t, lang } = useI18n()
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
        date: sale.sale_date || sale.issue_date || sale.date
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
      (sale.client?.name || '').toLowerCase().includes(lowerTerm)
    );
  }, [rawSales, searchTerm])

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess('Cobro registrado exitosamente')
      handleLoadSales(pagination.page)
    } catch (error) { throw error }
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid': case 'pagado':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black uppercase text-[9px] tracking-widest px-2 py-0.5">Pagado</Badge>
      case 'partial': case 'parcial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black uppercase text-[9px] tracking-widest px-2 py-0.5">Parcial</Badge>
      case 'overdue': case 'vencido':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black uppercase text-[9px] tracking-widest px-2 py-0.5">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-black uppercase text-[9px] tracking-widest px-2 py-0.5">Pendiente</Badge>
    }
  }

  if (error) return <div className="h-[60vh] flex items-center justify-center"><DataState variant="error" title="Error" message={error} onRetry={handleRefresh} /></div>

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto py-4 px-4 md:px-0">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-primary pl-4 md:pl-6 py-1">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Cobros de Ventas</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-1">Gestión centralizada de cobros y saldos</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="h-10 md:h-12 border-slate-200 font-bold uppercase tracking-widest text-[10px] rounded-xl self-start sm:self-auto">
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
        </Button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
         {[
           { label: 'Saldos Pendientes', icon: Clock, color: 'amber', value: formatCurrency(rawSales.reduce((acc, s) => acc + (['pending', 'pendiente'].includes(s.status?.toLowerCase()) ? s.balance_due : 0), 0)) },
           { label: 'Cobros Parciales', icon: CircleDollarSign, color: 'blue', value: `${rawSales.filter(s => ['partial', 'parcial'].includes(s.status?.toLowerCase())).length} Ventas` },
           { label: 'Cobros Exitosos', icon: CheckCircle2, color: 'green', value: formatCurrency(rawSales.reduce((acc, s) => acc + (s.amount_paid || 0), 0)) }
         ].map((kpi, i) => (
           <Card key={i} className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden transition-all duration-300">
              <CardContent className="p-4 md:p-6 flex items-center gap-4">
                 <div className={`size-12 md:size-14 bg-${kpi.color}-500/10 rounded-2xl flex items-center justify-center text-${kpi.color}-600`}><kpi.icon size={24} /></div>
                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p><h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</h2></div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Filter Toolbar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cliente</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Filtrar cliente..." value={selectedClientName} onChange={e => setSelectedClientName(e.target.value)} className="h-10 pl-9 rounded-lg bg-slate-50 border-slate-200" /></div></div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Estado</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10 rounded-lg bg-slate-50 border-slate-200 font-bold uppercase text-[9px] tracking-widest"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="all" className="font-bold uppercase text-[9px]">Todos</SelectItem><SelectItem value="pending" className="font-bold uppercase text-[9px]">Pendiente</SelectItem><SelectItem value="partial" className="font-bold uppercase text-[9px]">Parcial</SelectItem><SelectItem value="paid" className="font-bold uppercase text-[9px]">Pagado</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Desde</label><Input type="date" value={dateRange.start_date} onChange={e => setDateRange(p => ({ ...p, start_date: e.target.value }))} className="h-10 rounded-lg bg-slate-50 border-slate-200 text-xs" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Hasta</label><Input type="date" value={dateRange.end_date} onChange={e => setDateRange(p => ({ ...p, end_date: e.target.value }))} className="h-10 rounded-lg bg-slate-50 border-slate-200 text-xs" /></div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Button onClick={applyFilters} className="h-10 bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-lg flex-1 sm:flex-none px-8 shadow-md">Filtrar</Button>
            <Button variant="outline" onClick={handleClearFilters} className="h-10 rounded-lg border-slate-200 font-bold text-slate-500 text-[9px] uppercase tracking-widest px-6">Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
           <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Buscar por ID o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9 pl-9 rounded-lg bg-white border-slate-200 text-sm" /></div>
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white border px-3 py-1 rounded-full whitespace-nowrap">{displaySales.length} Resultados</div>
        </div>

        {isLoading && displaySales.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4"><RefreshCw className="w-10 h-10 animate-spin text-primary opacity-30" /><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cargando...</p></div>
        ) : displaySales.length === 0 ? (
          <div className="py-24 text-center px-6"><Receipt size={40} className="mx-auto text-slate-200 mb-4" /><h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Sin resultados</h3></div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader><TableRow className="bg-transparent border-none">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Cliente</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Fecha</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Estado</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Total</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Pendiente</TableHead>
                  <TableHead className="w-20 px-6"></TableHead>
                </TableRow></TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {displaySales.map(sale => (
                    <TableRow key={sale.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/cobros-ventas/${sale.id}`)}>
                      <TableCell className="py-4 px-6 font-black text-sm">#{sale.id}</TableCell>
                      <TableCell className="px-4"><div className="flex flex-col"><span className="font-bold text-sm">{sale.client?.name || 'Ocasional'}</span><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CI: {formatDocumentId(sale.client?.document_id)}</span></div></TableCell>
                      <TableCell className="px-4 text-xs font-semibold">{formatDate(sale.date)}</TableCell>
                      <TableCell className="px-4 text-center">{getStatusBadge(sale.status)}</TableCell>
                      <TableCell className="px-4 text-right font-bold tabular-nums">{formatCurrency(sale.total_amount)}</TableCell>
                      <TableCell className="px-4 text-right font-black text-primary tabular-nums">{formatCurrency(sale.balance_due)}</TableCell>
                      <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8 rounded-full text-slate-400"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-lg">
                          <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}`)} className="gap-3 py-2.5 font-bold rounded-lg cursor-pointer"><Eye size={16} /> Detalle</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}/pagos`)} className="gap-3 py-2.5 font-bold rounded-lg cursor-pointer"><List size={16} /> Historial</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedSale(sale); setIsPaymentModalOpen(true); }} disabled={['paid', 'pagado'].includes(sale.status?.toLowerCase())} className="gap-3 py-2.5 font-bold rounded-lg text-green-600 cursor-pointer"><CreditCard size={16} /> Cobrar</DropdownMenuItem>
                        </DropdownMenuContent></DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Cards View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {displaySales.map(sale => (
                <div key={sale.id} className="p-4 space-y-4 active:bg-slate-50" onClick={() => navigate(`/cobros-ventas/${sale.id}`)}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-sm text-primary">#{sale.id}</span>
                      <span className="font-black text-slate-900 text-base">{sale.client?.name || 'Cliente Ocasional'}</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold uppercase">{formatDate(sale.date)}</span>
                      </div>
                    </div>
                    {getStatusBadge(sale.status)}
                  </div>
                  
                  <div className="flex justify-between items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Factura</span>
                      <span className="font-bold text-sm tabular-nums">{formatCurrency(sale.total_amount)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                      <span className="font-black text-base text-primary tabular-nums">{formatCurrency(sale.balance_due)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    <Button onClick={() => { setSelectedSale(sale); setIsPaymentModalOpen(true); }} disabled={['paid', 'pagado'].includes(sale.status?.toLowerCase())} className="flex-1 h-10 bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-black uppercase tracking-widest text-[9px] rounded-lg transition-all">
                      <CreditCard size={14} className="mr-2" /> Registrar Cobro
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 w-12 rounded-lg border-slate-200"><MoreVertical size={18} /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                        <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}`)} className="gap-3 py-3 font-bold rounded-lg"><Eye size={18} /> Ver Detalle</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}/pagos`)} className="gap-3 py-3 font-bold rounded-lg"><List size={18} /> Historial de Pagos</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {pagination.total_pages > 1 && (
           <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pág. {pagination.page} de {pagination.total_pages}</p>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => handleLoadSales(pagination.page - 1)} className="h-9 rounded-lg border-slate-200 px-3"><ChevronLeft size={16} /></Button>
                 <Button variant="outline" size="sm" disabled={pagination.page >= pagination.total_pages} onClick={() => handleLoadSales(pagination.page + 1)} className="h-9 rounded-lg border-slate-200 px-3"><ChevronRight size={16} /></Button>
              </div>
           </div>
        )}
      </div>

      <RegisterSalePaymentModal open={isPaymentModalOpen} onOpenChange={open => { setIsPaymentModalOpen(open); if (!open) setSelectedSale(null); }} sale={selectedSale} onSubmit={handlePaymentSubmit} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default SalePayment
