/**
 * SalePayment Page - Refactored to Tailwind (Fluent 2.0)
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
  PlusCircle,
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

  // Zustand stores
  const { searchResults, searchClients, loading: clientsLoading } = useClientStore()

  // Local state
  const [rawSales, setRawSales] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
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

      // Add status filter if not all
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
        id: sale.sale_id || sale.id, // Asegurar ID consistente
        sale_id: sale.sale_id || sale.id,
        status: sale.status || sale.payment_status, // Normalizar estado
        date: sale.sale_date || sale.issue_date || sale.date // Normalizar fecha
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
      setError('Error al cargar los cobros de ventas. Por favor intente nuevamente.')
      showError('Error de conexión con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleLoadSales()
  }, []) // Initial load only

  // Apply filters button
  const applyFilters = () => {
    handleLoadSales(1)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedClient('')
    setSelectedClientName('')
    setSelectedStatus('all')
    setDateRange(getDefaultDateRange())
    
    // We need to defer the load slightly so state updates
    setTimeout(() => handleLoadSales(1), 0)
  }

  const handleRefresh = () => {
    handleLoadSales(pagination.page)
    showInfo('Actualizando datos...')
  }

  // Derived filtered results (for search term on current page)
  const displaySales = useMemo(() => {
    if (!searchTerm) return rawSales;
    const lowerTerm = searchTerm.toLowerCase();
    return rawSales.filter(sale => 
      String(sale.id || sale.sale_id).includes(lowerTerm) || 
      (sale.client?.name || '').toLowerCase().includes(lowerTerm) ||
      (sale.client?.document_id || '').includes(lowerTerm)
    );
  }, [rawSales, searchTerm])

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess('Cobro registrado exitosamente')
      handleLoadSales(pagination.page)
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
      case 'pagado':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-sm">Pagado</Badge>
      case 'partial':
      case 'partial_payment':
      case 'parcial':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-sm">Parcial</Badge>
      case 'overdue':
      case 'vencido':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-sm">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-black uppercase text-[10px] tracking-widest px-3 py-1 shadow-sm">Pendiente</Badge>
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 h-[60vh] justify-center">
        <DataState variant="error" title="Error de Carga" message={error} onRetry={handleRefresh} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto py-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none font-display">
            Cobros de Ventas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium font-display">
            Administración centralizada de cobros, saldos pendientes y pagos parciales
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="h-12 border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-slate-100 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden group hover:shadow-fluent-8 transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-5">
               <div className="size-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <Clock size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldos Pendientes</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(rawSales.reduce((acc, sale) => acc + (['pending', 'pendiente'].includes(sale.status?.toLowerCase()) ? sale.balance_due : 0), 0))}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobros Parciales</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                   {rawSales.filter(sale => ['partial', 'partial_payment', 'parcial'].includes(sale.status?.toLowerCase())).length} Ventas
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobros Exitosos</p>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(rawSales.reduce((acc, sale) => acc + (sale.amount_paid || 0), 0))}
                  </h2>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="space-y-6">
        {/* Filter Toolbar */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
          <CardContent className="p-6 flex flex-col lg:flex-row items-end gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
              {/* Cliente Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Filtrar por cliente..."
                    value={selectedClientName}
                    onChange={e => setSelectedClientName(e.target.value)}
                    className="h-11 pl-10 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold focus:ring-2 focus:ring-primary shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Estado</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-11 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px] tracking-widest shadow-inner">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-16">
                    <SelectItem value="all" className="font-bold uppercase text-[10px] tracking-widest">Todos los estados</SelectItem>
                    <SelectItem value="pending" className="font-bold uppercase text-[10px] tracking-widest">Pendiente</SelectItem>
                    <SelectItem value="partial" className="font-bold uppercase text-[10px] tracking-widest">Parcial</SelectItem>
                    <SelectItem value="paid" className="font-bold uppercase text-[10px] tracking-widest">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Desde Fecha</label>
                <Input
                  type="date"
                  value={dateRange.start_date}
                  onChange={e => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className="h-11 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hasta Fecha</label>
                <Input
                  type="date"
                  value={dateRange.end_date}
                  onChange={e => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className="h-11 rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-semibold shadow-inner"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button 
                onClick={applyFilters} 
                className="h-11 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-lg px-6 flex-1 lg:flex-none shadow-md shadow-primary/20 active:scale-95 transition-all"
              >
                <Filter size={16} className="mr-2" />
                Filtrar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="h-11 rounded-lg border-slate-200 dark:border-slate-700 font-bold text-slate-500 hover:text-red-500"
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Local Search inside Table Container */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-fluent-shadow overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
             <div className="relative w-full max-w-sm">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
               <Input
                 placeholder="Buscar venta (ID o cliente)..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="h-9 pl-9 rounded-md bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 text-sm shadow-sm"
               />
             </div>
             <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
               {displaySales.length} Resultados
             </div>
          </div>

          {isLoading && displaySales.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando operaciones...</p>
            </div>
          ) : displaySales.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-6">
              <div className="size-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border-4 border-white dark:border-slate-800 shadow-inner">
                <Receipt size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin cobros pendientes</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-2 font-medium">No se encontraron ventas con los filtros actuales. Ajuste la búsqueda para ver más resultados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-transparent border-none">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 px-6">Nro. Venta</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Cliente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Fecha Emisión</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-center">Estado</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Total Facturado</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 text-right">Saldo Pendiente</TableHead>
                    <TableHead className="w-20 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {displaySales.map(sale => (
                    <TableRow 
                      key={sale.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/cobros-ventas/${sale.id}`)}
                    >
                      <TableCell className="py-4 px-6">
                        <span className="font-black text-slate-900 dark:text-white text-sm">#{sale.id}</span>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                           <div className="size-9 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                              <User size={18} />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                                {sale.client?.name || 'Cliente Ocasional'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest truncate max-w-[180px]">
                                CI: {formatDocumentId(sale.client?.document_id) || 'N/A'}
                              </span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {formatDate(sale.date)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        {getStatusBadge(sale.status)}
                      </TableCell>
                      <TableCell className="px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(sale.total_amount)}
                      </TableCell>
                      <TableCell className="px-4 text-right font-black text-primary dark:text-primary-foreground tabular-nums">
                        {formatCurrency(sale.balance_due)}
                      </TableCell>
                      <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-9 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-16">
                            <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}`)} className="gap-3 py-3 font-bold rounded-lg focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                              <Eye size={18} /> Ver Detalle de Venta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/cobros-ventas/${sale.id}/pagos`)} className="gap-3 py-3 font-bold rounded-lg focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                              <List size={18} /> Historial de Pagos
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedSale(sale)
                                setIsPaymentModalOpen(true)
                              }}
                              disabled={['paid', 'completed', 'pagado'].includes(sale.status?.toLowerCase())}
                              className="gap-3 py-3 font-bold rounded-lg focus:bg-green-50 focus:text-green-600 dark:focus:bg-green-900/30 cursor-pointer"
                            >
                              <CreditCard size={18} /> Registrar Cobro
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

          {/* Pagination Footer */}
          {pagination.total_pages > 1 && (
             <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Página {pagination.page} de {pagination.total_pages}
                </p>
                <div className="flex gap-2">
                   <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handleLoadSales(pagination.page - 1)}
                    className="h-9 rounded-md border-slate-200 font-bold px-3 text-xs"
                   >
                     <ChevronLeft size={16} />
                   </Button>
                   <Button 
                    variant="outline" 
                    size="sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => handleLoadSales(pagination.page + 1)}
                    className="h-9 rounded-md border-slate-200 font-bold px-3 text-xs"
                   >
                     <ChevronRight size={16} />
                   </Button>
                </div>
             </div>
          )}
        </div>
      </div>

      <RegisterSalePaymentModal
        open={isPaymentModalOpen}
        onOpenChange={open => {
          setIsPaymentModalOpen(open)
          if (!open) setSelectedSale(null)
        }}
        sale={selectedSale}
        onSubmit={handlePaymentSubmit}
      />

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default SalePayment
