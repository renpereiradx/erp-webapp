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
  List,
  Ban,
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
import { saleService } from '@/services/saleService'
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

const normalizeStatusFilterForApi = status => {
  if (!status || status === 'all') return undefined

  const normalized = status.toString().trim().toUpperCase()
  const map = {
    PENDING: 'PENDING',
    PENDING_PAYMENT: 'PENDING',
    PARTIAL: 'PARTIAL',
    PARTIAL_PAYMENT: 'PARTIAL',
    PAID: 'PAID',
    COMPLETED: 'PAID',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
  }

  return map[normalized] || normalized
}

const normalizeSaleStatus = sale => {
  const rawStatus =
    sale?.payment_status || sale?.status || sale?.sale_status || ''
  const normalizedRaw = rawStatus.toString().trim().toUpperCase()

  const normalizedFromRaw = {
    PENDING: 'PENDING',
    PENDING_PAYMENT: 'PENDING',
    PARTIAL: 'PARTIAL',
    PARTIAL_PAYMENT: 'PARTIAL',
    PAID: 'PAID',
    COMPLETED: 'PAID',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
  }[normalizedRaw]

  if (normalizedFromRaw) return normalizedFromRaw

  const balanceDue = Number(sale?.balance_due) || 0
  const totalPaid = Number(sale?.total_paid) || 0

  if (balanceDue <= 0) return 'PAID'
  if (totalPaid > 0) return 'PARTIAL'
  return 'PENDING'
}

/**
 * Componente de fila memoizado para optimizar el renderizado de listas largas
 */
const SaleRow = React.memo(({ 
  sale, 
  formatDate, 
  formatCurrency, 
  onPayment, 
  onCancel, 
  onDetails, 
  onHistory,
  getStatusBadge 
}) => {
  return (
    <TableRow
      key={sale.id}
      className='hover:bg-slate-50 transition-colors cursor-pointer group'
      onClick={() => onDetails(sale.id)}
    >
      <TableCell className='py-4 px-6 font-semibold text-sm'>
        #{sale.id}
      </TableCell>
      <TableCell className='px-4'>
        <div className='flex flex-col'>
          <span className='font-semibold text-sm'>
            {sale.client_name}
          </span>
          {(sale.client?.document_id || sale.client_document_id) && (
            <span className='text-xs text-slate-500 font-medium'>
              CI: {formatDocumentId(sale.client?.document_id || sale.client_document_id)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className='px-4 text-sm text-slate-600'>
        {formatDate(sale.date)}
      </TableCell>
      <TableCell className='px-4 text-center'>
        {getStatusBadge(sale.status)}
      </TableCell>
      <TableCell className='px-4 text-right'>
        <div className='flex items-center justify-end gap-2'>
          <div className='h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden'>
            <div
              className={cn(
                'h-full transition-all duration-500',
                Number(sale.payment_progress) >= 100
                  ? 'bg-green-500'
                  : Number(sale.payment_progress) > 0
                    ? 'bg-blue-500'
                    : 'bg-transparent',
              )}
              style={{
                width: `${Math.min(100, Math.max(0, sale.payment_progress || 0))}%`,
              }}
            />
          </div>
          <span className='text-[10px] font-bold text-slate-500 tabular-nums'>
            {Math.round(sale.payment_progress || 0)}%
          </span>
        </div>
      </TableCell>
      <TableCell className='px-4 text-right font-bold text-sm'>
        {formatCurrency(sale.total_amount)}
      </TableCell>
      <TableCell className='px-4 text-right font-bold text-sm text-error'>
        {formatCurrency(sale.balance_due)}
      </TableCell>
      <TableCell className='py-4 px-6 text-right'>
        <div className='flex items-center justify-end gap-1'>
          {sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
            <Button
              size='sm'
              variant='ghost'
              onClick={e => {
                e.stopPropagation()
                onPayment(sale)
              }}
              className='h-8 w-8 p-0 text-primary hover:bg-primary/10 hover:text-primary rounded-full'
              title='Registrar Cobro'
            >
              <CreditCard size={16} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full'
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical size={16} className='text-slate-400' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-48 p-1 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-xl z-50'
            >
              <DropdownMenuItem
                onClick={() => onDetails(sale.id)}
                className='gap-2 py-2 font-medium text-sm rounded'
              >
                <Eye size={16} /> Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onHistory(sale.id)}
                className='gap-2 py-2 font-medium text-sm rounded'
              >
                <List size={16} /> Historial de Cobros
              </DropdownMenuItem>
              {sale.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={() => onCancel(sale)}
                  className='gap-2 py-2 font-medium text-sm rounded text-red-600'
                >
                  <Ban size={16} /> Anular Venta
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});

/**
 * Componente de tarjeta memoizado para vista móvil
 */
const SaleCard = React.memo(({ 
  sale, 
  formatDate, 
  formatCurrency, 
  onPayment,
  onCancel,
  onDetails,
  onHistory,
  getStatusBadge 
}) => {
  return (
    <div
      key={sale.id}
      className='p-4 space-y-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800'
    >
      <div className='flex items-center justify-between' onClick={() => onDetails(sale.id)}>
        <div className='flex items-center gap-2'>
          <div className='size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500'>
            <User size={14} />
          </div>
          <span className='font-bold text-slate-900 dark:text-white text-sm'>
            {sale.client_name}
          </span>
        </div>
        <span className='font-mono text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded'>
          #{sale.id}
        </span>
      </div>

      <div className='grid grid-cols-2 gap-4' onClick={() => onDetails(sale.id)}>
        <div>
          <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1'>
            Fecha
          </p>
          <p className='text-xs font-medium text-slate-600 dark:text-slate-400'>
            {formatDate(sale.date)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1'>
            Total
          </p>
          <p className='text-xs font-bold text-slate-900 dark:text-white tabular-nums'>
            {formatCurrency(sale.total_amount)}
          </p>
        </div>
        <div>
          <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1'>
            Estado
          </p>
          {getStatusBadge(sale.status)}
        </div>
        <div className='text-right'>
          <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1'>
            Pendiente
          </p>
          <p className='text-xs font-bold text-error tabular-nums'>
            {formatCurrency(sale.balance_due)}
          </p>
        </div>
      </div>

      {/* Botones de Acción en Card */}
      <div className='flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800'>
        {sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
          <Button
            size='sm'
            onClick={() => onPayment(sale)}
            className='flex-1 h-9 bg-primary/10 text-primary hover:bg-primary hover:text-white border-none font-bold text-[10px] uppercase tracking-tighter'
          >
            <CreditCard size={14} className='mr-1.5' /> Registrar Cobro
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-9 w-10 p-0 border-slate-200'
            >
              <MoreVertical size={16} className='text-slate-400' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48 p-1'>
            <DropdownMenuItem onClick={() => onDetails(sale.id)} className='gap-2 text-xs font-medium'>
              <Eye size={14} /> Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistory(sale.id)} className='gap-2 text-xs font-medium'>
              <List size={14} /> Historial de Cobros
            </DropdownMenuItem>
            {sale.status !== 'CANCELLED' && (
              <DropdownMenuItem onClick={() => onCancel(sale)} className='gap-2 text-xs font-medium text-red-600'>
                <Ban size={14} /> Anular Venta
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

const SalePayment = () => {
  const { lang } = useI18n()
  const navigate = useNavigate()
  const {
    toasts,
    removeToast,
    error: showError,
    success: showSuccess,
    info: showInfo,
  } = useToast()

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
    const last3Months = new Date(today)
    last3Months.setMonth(today.getMonth() - 3)
    return {
      start_date: last3Months.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // Pagination & Cache State
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 100, // Fetch 100 records from server
    total_records: 0,
    total_pages: 0,
  })
  
  const [localPage, setLocalPage] = useState(1)
  const localPageSize = 20 // Show 20 items per local page
  
  // Caché persistente para evitar recargas innecesarias y gestionar memoria
  const pagesCache = React.useRef(new Map())
  const abortControllerRef = React.useRef(null)

  // Modal State
  const [selectedSale, setSelectedSale] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState(null)
  const [showCancelPreview, setShowCancelPreview] = useState(false)
  const [cancelPreviewData, setCancelPreviewData] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Formatters memoizados para rendimiento
  const formatCurrency = React.useCallback(value =>
    currencyFormatter(lang, 'PYG').format(value || 0), [lang])
  
  const formatDate = React.useCallback(dateStr =>
    dateStr ? dateFormatterFactory(lang).format(new Date(dateStr)) : '-', [lang])

  const handleLoadSales = async (page = 1, forceRefresh = false) => {
    // Reset local page if it's a new fetch or different page
    setLocalPage(1)

    // Cancelar petición previa si existe (evita race conditions)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Generar llave de caché única basada en filtros para gestión inteligente de memoria
    const cacheKey = `${page}-${selectedClientName}-${selectedStatus}-${dateRange.start_date}-${dateRange.end_date}`
    
    if (!forceRefresh && pagesCache.current.has(cacheKey)) {
      const cachedData = pagesCache.current.get(cacheKey)
      setRawSales(cachedData.data)
      setPagination(cachedData.pagination)
      return
    }

    setIsLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()

    try {
      let result
      const filters = {
        page,
        page_size: pagination.page_size,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      }

      if (selectedStatus && selectedStatus !== 'all') {
        filters.payment_status = normalizeStatusFilterForApi(selectedStatus)
      }

      // Llamada al servicio: Unificando inteligencia
      if (selectedClientName?.trim()) {
        result = await salePaymentService.getSalesByClientNameWithPaymentStatus(
          selectedClientName.trim(),
          filters,
        )
      } else {
        result =
          await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters)
      }

      const normalizedData = (result?.data || [])
        .map(item => {
          const sale = item.sale || item
          const totalPaid = Number(sale.total_paid) || Number(sale.amount_paid) || 0
          const rawTotal = Number(sale.total_amount) || Number(sale.total) || 0
          const rawBalance = sale.balance_due !== undefined ? Number(sale.balance_due) : null
          
          const status = normalizeSaleStatus({ ...sale, total_paid: totalPaid, balance_due: rawBalance ?? (rawTotal - totalPaid) })
          const isPaid = status === 'PAID'
          
          let finalTotal = rawTotal
          let finalBalance = rawBalance ?? Math.max(0, rawTotal - totalPaid)
          
          if (totalPaid > 0 && Math.abs(rawTotal - finalBalance) < 1 && rawTotal > 0) {
            finalTotal = totalPaid + finalBalance
          } else if (totalPaid > 0 && rawTotal > 0 && rawTotal > totalPaid && rawBalance === null) {
            finalBalance = rawTotal - totalPaid
          }

          if (isPaid) finalBalance = 0
          
          return {
            ...sale,
            id: sale.sale_id || sale.id,
            status: status,
            date: sale.sale_date || sale.issue_date || sale.date,
            client_name:
              sale.client_name ||
              sale.client?.name ||
              (item.client && item.client.name) ||
              'Ocasional',
            total_amount: finalTotal,
            total_paid: totalPaid,
            balance_due: finalBalance,
          }
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const paginationData = result?.pagination ? {
        page: result.pagination.page,
        page_size: result.pagination.page_size,
        total_records: result.pagination.total_records,
        total_pages: result.pagination.total_pages,
      } : pagination

      // Guardar en caché para acceso instantáneo posterior
      pagesCache.current.set(cacheKey, { data: normalizedData, pagination: paginationData })
      
      setRawSales(normalizedData)
      setPagination(paginationData)
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Error loading sales:', err)
      setError('Error al cargar los cobros de ventas.')
      showError('Error de conexión')
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Limpiar caché cuando cambian filtros base
  // Efecto para búsqueda inteligente (Auto-fetch al cambiar filtros)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo disparar si ha pasado 1s desde el último cambio en el nombre
      // o inmediatamente si es estado/fecha
      handleLoadSales(1);
    }, selectedClientName ? 800 : 0);

    return () => clearTimeout(timer);
  }, [selectedStatus, dateRange.start_date, dateRange.end_date]);

  // Manejar cambio de nombre por separado con debounce más largo
  useEffect(() => {
    if (!selectedClientName) return;
    const timer = setTimeout(() => {
      handleLoadSales(1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedClientName]);

  const handleHistory = React.useCallback((saleId) => {
    navigate(`/cobros-ventas/${saleId}/pagos`)
  }, [navigate])

  const handleDetails = React.useCallback((saleId) => {
    navigate(`/cobros-ventas/${saleId}`)
  }, [navigate])

  const handleOpenPayment = React.useCallback((sale) => {
    setSelectedSale(sale)
    setIsPaymentModalOpen(true)
  }, [])

  const handleRefresh = React.useCallback(() => {
    pagesCache.current.clear()
    handleLoadSales(pagination.page, true)
    showInfo('Actualizando...')
  }, [pagination.page])

  const applyFilters = React.useCallback(() => {
    pagesCache.current.clear()
    handleLoadSales(1, true)
  }, [])

  const handleClearFilters = React.useCallback(() => {
    pagesCache.current.clear()
    setSearchTerm('')
    setSelectedClientName('')
    setSelectedStatus('all')
    setDateRange(getDefaultDateRange())
    setTimeout(() => handleLoadSales(1, true), 0)
  }, [])

  const { filteredSales, displaySales } = React.useMemo(() => {
    // 1. Filtrado local por término de búsqueda e Inteligencia de Estado
    let filtered = rawSales;
    
    // Filtro por Estado (Local sobre datos ya obtenidos)
    if (selectedStatus && selectedStatus !== 'all') {
      const targetStatus = selectedStatus.toUpperCase();
      filtered = filtered.filter(sale => sale.status === targetStatus);
    }

    // Filtro por Término de búsqueda (ID o Cliente)
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        sale =>
          String(sale.id).includes(lowerTerm) ||
          (sale.client_name || '').toLowerCase().includes(lowerTerm),
      )
    }

    // 2. Paginación local: Mostrar solo 20 de los cargados
    const start = (localPage - 1) * localPageSize;
    return {
      filteredSales: filtered,
      displaySales: filtered.slice(start, start + localPageSize)
    };
  }, [rawSales, searchTerm, selectedStatus, localPage, localPageSize])

  const handlePaymentSubmit = async paymentData => {
    await salePaymentService.processSalePaymentWithCashRegister(paymentData)
    showSuccess('Cobro registrado exitosamente')
    handleLoadSales(pagination.page)
  }

  const handleCancelSale = async sale => {
    setSaleToCancel(sale)
    setIsCancelling(true)

    try {
      const previewResult =
        await saleService.previewSaleCancellation(sale.id)
      if (previewResult?.success) {
        setCancelPreviewData(
          previewResult.data || { sale_info: { id: sale.id } },
        )
      } else {
        setCancelPreviewData({ sale_info: { id: sale.id } })
      }
    } catch {
      setCancelPreviewData({ sale_info: { id: sale.id } })
    } finally {
      setIsCancelling(false)
      setShowCancelPreview(true)
    }
  }

  const handleConfirmCancellation = async () => {
    if (!saleToCancel) return
    setIsCancelling(true)
    setShowCancelPreview(false)
    try {
      const result = await saleService.revertSale(
        saleToCancel.id,
        'ANULADO_DESDE_COBROS_VENTAS'
      )
      if (result.success) {
        showSuccess('Venta anulada exitosamente.')
        handleLoadSales(pagination.page)
      }
    } catch (err) {
      showError('No se pudo anular la venta')
    } finally {
      setIsCancelling(false)
      setSaleToCancel(null)
    }
  }

  const getStatusBadge = status => {
    const s = status?.toString().trim().toUpperCase()
    switch (s) {
      case 'PAID':
        return (
          <Badge className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-medium text-xs px-2 py-0.5'>
            Pagado
          </Badge>
        )
      case 'PARTIAL':
        return (
          <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none font-medium text-xs px-2 py-0.5'>
            Parcial
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className='bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-medium text-xs px-2 py-0.5'>
            Cancelado
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge className='bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-medium text-xs px-2 py-0.5'>
            Pendiente
          </Badge>
        )
      default:
        return (
          <Badge className='bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-none font-medium text-xs px-2 py-0.5'>
            Sin estado
          </Badge>
        )
    }
  }

  if (error)
    return (
      <div className='h-[60vh] flex items-center justify-center'>
        <DataState
          variant='error'
          title='Error'
          message={error}
          onRetry={handleRefresh}
        />
      </div>
    )

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500'>
      {/* Header Section */}
      <header className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-primary pl-4 py-1'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-white tracking-tight'>
            Cobros de Ventas
          </h1>
          <p className='text-slate-500 dark:text-slate-400 text-sm font-medium mt-1'>
            Gestión centralizada de cobros
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
          className='h-9 border-slate-200 font-medium text-sm rounded-md shadow-sm'
        >
          <RefreshCw
            size={14}
            className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />{' '}
          Sincronizar
        </Button>
      </header>

      {/* KPI Cards (Procesados sobre resultados filtrados totales en memoria) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'>
        {[
          {
            label: 'Saldos Pendientes',
            icon: Clock,
            color: 'amber',
            count: filteredSales.filter(s => s.status === 'PENDING' || s.status === 'PARTIAL').length,
            amount: filteredSales.reduce((acc, s) => acc + (Number(s.balance_due) || 0), 0)
          },
          {
            label: 'Cobros Parciales',
            icon: CircleDollarSign,
            color: 'blue',
            count: filteredSales.filter(s => s.status === 'PARTIAL').length,
            amount: filteredSales.reduce((acc, s) => acc + (s.status === 'PARTIAL' ? (Number(s.total_paid) || 0) : 0), 0)
          },
          {
            label: 'Cobros Exitosos',
            icon: CheckCircle2,
            color: 'green',
            count: filteredSales.filter(s => s.status === 'PAID').length,
            amount: filteredSales.reduce((acc, s) => acc + (s.status === 'PAID' ? (Number(s.total_amount) || 0) : 0), 0)
          },
          {
            label: 'Ventas Anuladas',
            icon: Ban,
            color: 'slate',
            count: filteredSales.filter(s => s.status === 'CANCELLED').length,
            amount: filteredSales.reduce((acc, s) => acc + (s.status === 'CANCELLED' ? (Number(s.total_amount) || 0) : 0), 0)
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className='rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden transition-all duration-300 hover:shadow-md group'
          >
            <CardContent className='p-4 flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <div className={`p-2 bg-${kpi.color}-500/10 rounded-lg text-${kpi.color}-600 group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={20} />
                </div>
                <Badge variant='secondary' className='bg-slate-100 text-slate-600 font-bold text-[10px]'>
                  {kpi.count} OP
                </Badge>
              </div>
              <div>
                <p className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
                  {kpi.label}
                </p>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5'>
                  {formatCurrency(kpi.amount)}
                </h2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='space-y-4'>
        {/* Filter Toolbar */}
        <Card className='rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark overflow-hidden'>
          <CardContent className='p-4 md:p-6 flex flex-col xl:flex-row items-end gap-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full'>
              <div className='space-y-1.5 min-w-0'>
                <label className='text-xs font-medium text-slate-600 ml-1 truncate block'>
                  Cliente
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4' />
                  <Input
                    placeholder='Filtrar cliente...'
                    value={selectedClientName}
                    onChange={e => setSelectedClientName(e.target.value)}
                    className='h-10 pl-10 min-w-0 w-full rounded-md bg-white border-slate-400 text-sm font-medium focus:ring-2 focus:ring-primary/20'
                  />
                </div>
              </div>

              <div className='space-y-1.5 min-w-0'>
                <label className='text-xs font-medium text-slate-600 ml-1 truncate block'>
                  Estado
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className='h-10 min-w-0 w-full rounded-md bg-white border-slate-400 font-medium text-sm [&>span]:truncate'>
                    <SelectValue placeholder='Estado' />
                  </SelectTrigger>
                  <SelectContent className='rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shadow-md z-50'>
                    <SelectItem value='all' className='text-sm'>
                      Todos
                    </SelectItem>
                    <SelectItem value='pending' className='text-sm'>
                      Pendiente
                    </SelectItem>
                    <SelectItem value='partial' className='text-sm'>
                      Parcial
                    </SelectItem>
                    <SelectItem value='paid' className='text-sm'>
                      Pagado
                    </SelectItem>
                    <SelectItem value='cancelled' className='text-sm text-red-500'>
                      Anulado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5 min-w-0'>
                <label className='text-xs font-medium text-slate-600 ml-1 truncate block'>
                  Desde
                </label>
                <Input
                  type='date'
                  value={dateRange.start_date}
                  onChange={e =>
                    setDateRange(prev => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className='h-10 min-w-0 w-full rounded-md bg-white border-slate-400 text-sm font-medium'
                />
              </div>

              <div className='space-y-1.5 min-w-0'>
                <label className='text-xs font-medium text-slate-600 ml-1 truncate block'>
                  Hasta
                </label>
                <Input
                  type='date'
                  value={dateRange.end_date}
                  onChange={e =>
                    setDateRange(prev => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className='h-10 min-w-0 w-full rounded-md bg-white border-slate-400 text-sm font-medium'
                />
              </div>
            </div>

            <div className='flex gap-2 w-full xl:w-auto mt-2 xl:mt-0'>
              <Button
                onClick={applyFilters}
                className='h-10 bg-primary hover:bg-primary-hover text-white font-medium text-sm rounded-md px-6 flex-1 xl:flex-none shadow-sm active:scale-95 transition-all'
              >
                <Filter size={16} className='mr-2' /> Filtrar
              </Button>
              <Button
                variant='outline'
                onClick={handleClearFilters}
                className='h-10 rounded-md border-slate-400 font-medium text-slate-500 hover:text-red-500 text-sm min-w-24'
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Container */}
        <div className='bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden'>
          <div className='p-4 border-b border-slate-200 bg-white flex justify-between items-center'>
            <div className='relative w-full max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4' />
              <Input
                placeholder='Buscar venta (ID o cliente)...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-9 pl-9 rounded-md bg-white border-slate-400 text-sm'
              />
            </div>
            <div className='text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md whitespace-nowrap'>
              {displaySales.length} Resultados
            </div>
          </div>

          {isLoading && displaySales.length === 0 ? (
            <div className='py-24 flex flex-col items-center gap-4'>
              <RefreshCw className='w-10 h-10 animate-spin text-primary opacity-30' />
              <p className='text-sm font-medium text-slate-500'>Cargando...</p>
            </div>
          ) : displaySales.length === 0 ? (
            <div className='py-24 text-center px-6'>
              <Receipt size={40} className='mx-auto text-slate-200 mb-4' />
              <h3 className='text-base font-semibold text-slate-900 dark:text-white'>
                Sin resultados
              </h3>
            </div>
          ) : (
            <>
              <div className='hidden lg:block overflow-x-auto'>
                <Table className='min-w-[1000px]'>
                  <TableHeader>
                    <TableRow className='bg-slate-50 border-b border-slate-200'>
                      <TableHead className='text-xs font-semibold text-slate-600 py-3 px-6'>
                        ID
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4'>
                        Cliente
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4'>
                        Fecha
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4 text-center'>
                        Estado
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4 text-right'>
                        Progreso
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4 text-right'>
                        Total
                      </TableHead>
                      <TableHead className='text-xs font-semibold text-slate-600 px-4 text-right'>
                        Pendiente
                      </TableHead>
                      <TableHead className='w-16 px-6'></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className='divide-y divide-slate-200'>
                    {displaySales.map(sale => (
                      <SaleRow
                        key={sale.id}
                        sale={sale}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                        onPayment={handleOpenPayment}
                        onCancel={handleCancelSale}
                        onDetails={handleDetails}
                        onHistory={handleHistory}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden divide-y divide-slate-200'>
                {displaySales.map(sale => (
                  <SaleCard
                    key={sale.id}
                    sale={sale}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onDetails={handleDetails}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination Footer - Inteligente & Híbrido */}
          {(pagination.total_records > localPageSize) && (
            <div className='p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
                Viendo <span className='text-primary'>{(localPage - 1) * localPageSize + 1}-{Math.min(localPage * localPageSize, pagination.total_records)}</span> de {pagination.total_records} Registros
                {pagination.total_pages > 1 && <span className='ml-2 text-slate-400'>(Pág. Servidor: {pagination.page}/{pagination.total_pages})</span>}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={(localPage === 1 && pagination.page === 1) || isLoading}
                  onClick={() => {
                    if (localPage > 1) {
                      setLocalPage(prev => prev - 1);
                    } else if (pagination.page > 1) {
                      handleLoadSales(pagination.page - 1);
                      // handleLoadSales resets localPage to 1, but we want the last local page of previous set
                      setTimeout(() => setLocalPage(Math.ceil(pagination.page_size / localPageSize)), 100);
                    }
                  }}
                  className='h-8 px-3 border-slate-300 font-bold uppercase text-[10px] tracking-widest'
                >
                  <ChevronLeft size={14} className='mr-1' /> Anterior
                </Button>
                
                <div className='flex gap-1'>
                  <span className='px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-primary'>
                    BLOQUE {localPage}
                  </span>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  disabled={(localPage * localPageSize >= rawSales.length && pagination.page >= pagination.total_pages) || isLoading}
                  onClick={() => {
                    if (localPage * localPageSize < rawSales.length) {
                      setLocalPage(prev => prev + 1);
                    } else if (pagination.page < pagination.total_pages) {
                      handleLoadSales(pagination.page + 1);
                    }
                  }}
                  className='h-8 px-3 border-slate-300 font-bold uppercase text-[10px] tracking-widest'
                >
                  Siguiente <ChevronRight size={14} className='ml-1' />
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

      {/* CANCEL SALE MODAL - Fluent 2 Dialog */}
      {showCancelPreview && cancelPreviewData && saleToCancel && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowCancelPreview(false)}
          ></div>
          <div className='relative bg-white dark:bg-surface-dark w-full max-w-sm rounded-xl shadow-fluent-64 p-6 border border-border-subtle text-center space-y-5 animate-in zoom-in-95 duration-200'>
            <div className='w-14 h-14 bg-red-100 text-error rounded-full flex items-center justify-center mx-auto'>
              <Ban size={28} />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-text-main'>
                ¿Anular esta venta?
              </h3>
              <p className='text-sm text-text-secondary mt-2'>
                Esta acción revertirá los cobros y devolverá el stock. Cliente:{' '}
                <span className='font-semibold text-error'>
                  {saleToCancel.client_name}
                </span>.
              </p>
              {cancelPreviewData.impact_analysis && (
                <div className='mt-4 p-3 bg-red-50 text-red-700 text-xs rounded text-left'>
                  <p className='font-semibold mb-1'>Impacto de la anulación:</p>
                  <ul className='list-disc pl-4 space-y-1'>
                    {cancelPreviewData.impact_analysis.requires_payment_reversal && (
                      <li>Se reversarán {cancelPreviewData.impact_analysis.payments_to_cancel || 0} cobros.</li>
                    )}
                    {cancelPreviewData.impact_analysis.requires_stock_adjustment && (
                      <li>Se devolverá al stock {cancelPreviewData.impact_analysis.stock_adjustments_required || 0} items.</li>
                    )}
                    <li>Total a devolver: {formatCurrency(cancelPreviewData.impact_analysis.total_to_reverse || 0)}</li>
                  </ul>
                </div>
              )}
            </div>
            <div className='flex gap-3 pt-2'>
              <Button
                variant='outline'
                className='flex-1 font-bold uppercase text-[10px] tracking-widest'
                onClick={() => setShowCancelPreview(false)}
              >
                Cancelar
              </Button>
              <Button
                className='flex-1 bg-error hover:bg-error/90 text-white font-bold uppercase text-[10px] tracking-widest shadow-fluent-4'
                onClick={handleConfirmCancellation}
                disabled={isCancelling}
              >
                {isCancelling ? 'Anulando...' : 'Sí, Anular'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default SalePayment
