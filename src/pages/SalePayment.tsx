// ===========================================================================
// SalePayment Page — /cobros-ventas
// Design: DESIGN.md (design/tokens.json) — semantic tokens + components ui/
// Logic: salePaymentService / saleService / useBranch / useToast (unchanged)
// i18n: useI18n() (ES/EN — ES keys in src/lib/i18n/locales/es/sales.js)
// ===========================================================================

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Search,
  CreditCard,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  MoreVertical,
  Eye,
  List,
  Ban,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/ui/PageHeader'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DataState from '@/components/ui/DataState'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ToastContainer from '@/components/ui/ToastContainer'
import EnhancedModal from '@/components/ui/EnhancedModal'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { useBranch } from '@/contexts/BranchContext'
import { useToast } from '@/hooks/useToast'
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'
import {
  formatDocumentId,
  normalizeSaleRow,
  normalizeStatusFilterForApi,
  type SaleRow,
} from '@/domain/sale/cobros'

const currencyFormatter = (lang: string, currency: string) => {
  const code = normalizeCurrencyCode(currency)
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: code === 'PYG' ? 0 : 2,
    maximumFractionDigits: code === 'PYG' ? 0 : 2,
  })
}

const dateFormatterFactory = (lang: string) =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

// ── Fila memoizada (desktop) ────────────────────────────────────────────────
interface SaleRowProps {
  sale: SaleRow
  formatDate: (dateStr: string | null | undefined) => string
  formatCurrency: (value: number | null | undefined) => string
  onPayment: (sale: SaleRow) => void
  onCancel: (sale: SaleRow) => void
  onDetails: (saleId: string | number) => void
  onHistory: (saleId: string | number) => void
  getStatusBadge: (status: string) => ReactNode
  t: Function
}

const SaleRow = memo(({
  sale,
  formatDate,
  formatCurrency,
  onPayment,
  onCancel,
  onDetails,
  onHistory,
  getStatusBadge,
  t,
}: SaleRowProps) => {
  return (
    <TableRow
      className='hover:bg-surface-muted transition-colors duration-150 cursor-pointer'
      onClick={() => onDetails(sale.id)}
    >
      <TableCell className='font-data-mono text-data-mono text-foreground'>
        #{sale.id}
      </TableCell>
      <TableCell>
        <div className='flex flex-col'>
          <span className='text-body-md text-foreground'>
            {sale.client_name}
          </span>
          {(sale.client?.document_id || sale.client_document_id) && (
            <span className='text-body-sm-bold text-on-surface-deep'>
              {t('sales.cobros.client.cid', { id: formatDocumentId(sale.client?.document_id || sale.client_document_id) })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className='text-data-mono font-data-mono text-on-surface-deep'>
        {formatDate(sale.date)}
      </TableCell>
      <TableCell className='text-center'>
        {getStatusBadge(sale.status)}
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex items-center justify-end gap-2'>
          <div className='h-1.5 w-16 bg-surface-muted rounded-full overflow-hidden'>
            <div
              className={cn(
                'h-full transition-colors duration-150',
                Number(sale.payment_progress) >= 100
                  ? 'bg-success'
                  : Number(sale.payment_progress) > 0
                    ? 'bg-primary'
                    : 'bg-transparent',
              )}
              style={{
                width: `${Math.min(100, Math.max(0, sale.payment_progress || 0))}%`,
              }}
            />
          </div>
          <span className='font-data-mono text-data-mono text-on-surface-deep'>
            {Math.round(sale.payment_progress || 0)}%
          </span>
        </div>
      </TableCell>
      <TableCell className='text-right font-data-mono text-data-mono text-foreground'>
        {formatCurrency(sale.total_amount)}
      </TableCell>
      <TableCell className='text-right font-data-mono text-data-mono text-error'>
        {formatCurrency(sale.balance_due)}
      </TableCell>
      <TableCell className='text-right'>
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
              title={t('sales.cobros.action.payment', 'Registrar Cobro')}
              aria-label={t('sales.cobros.action.payment', 'Registrar Cobro')}
            >
              <CreditCard className='w-4 h-4' />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 hover:bg-surface-muted rounded-full'
                onClick={e => e.stopPropagation()}
                aria-label={t('sales.cobros.table.actions', 'Acciones')}
              >
                <MoreVertical className='w-4 h-4 text-on-surface-deep' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-48 p-1 rounded-md bg-surface border border-border-subtle shadow-fluent-8 z-50'
            >
              <DropdownMenuItem
                onClick={() => onDetails(sale.id)}
                className='gap-2 py-2 text-body-md rounded'
              >
                <Eye className='w-4 h-4' />
                {t('sales.cobros.action.details', 'Ver Detalles')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onHistory(sale.id)}
                className='gap-2 py-2 text-body-md rounded'
              >
                <List className='w-4 h-4' />
                {t('sales.cobros.action.history', 'Historial de Cobros')}
              </DropdownMenuItem>
              {sale.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={() => onCancel(sale)}
                  className='gap-2 py-2 text-body-md rounded text-error'
                >
                  <Ban className='w-4 h-4' />
                  {t('sales.cobros.action.cancel', 'Anular Venta')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
})

SaleRow.displayName = 'SaleRow'

// ── Card memoizada (móvil) ──────────────────────────────────────────────────
interface SaleCardProps extends SaleRowProps {}

const SaleCard = memo(({
  sale,
  formatDate,
  formatCurrency,
  onPayment,
  onCancel,
  onDetails,
  onHistory,
  getStatusBadge,
  t,
}: SaleCardProps) => {
  const progress =
    sale.total_amount > 0
      ? ((sale.total_amount - sale.balance_due) / sale.total_amount) * 100
      : 0

  return (
    <div className='p-md space-y-md transition-colors border-b border-border-subtle'>
      <div className='flex items-center justify-between' onClick={() => onDetails(sale.id)}>
        <div className='flex items-center gap-sm'>
          <div className='size-8 rounded-full bg-surface-muted flex items-center justify-center text-on-surface-deep'>
            <User className='w-4 h-4' />
          </div>
          <div className='flex flex-col'>
            <span className='text-body-md-bold text-foreground'>
              {sale.client_name}
            </span>
            <span className='font-data-mono text-data-mono text-on-surface-deep'>
              #{sale.id}
            </span>
          </div>
        </div>
        {getStatusBadge(sale.status)}
      </div>

      <div className='grid grid-cols-2 gap-x-4 gap-y-sm' onClick={() => onDetails(sale.id)}>
        <div>
          <p className='text-label-caps uppercase text-on-surface-deep mb-xs'>
            {t('sales.cobros.table.date', 'Fecha')}
          </p>
          <p className='text-data-mono font-data-mono text-on-surface-deep'>
            {formatDate(sale.date)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-label-caps uppercase text-on-surface-deep mb-xs'>
            {t('sales.cobros.table.total', 'Total')}
          </p>
          <p className='font-data-mono text-data-mono text-foreground'>
            {formatCurrency(sale.total_amount)}
          </p>
        </div>

        <div className='col-span-2 space-y-sm'>
          <div className='flex justify-between items-end'>
            <p className='text-label-caps uppercase text-on-surface-deep'>
              {t('sales.cobros.card.progress', 'Progreso de Cobro')}
            </p>
            <p className='font-data-mono text-data-mono text-error'>
              {t('sales.cobros.card.balance', { amount: formatCurrency(sale.balance_due) })}
            </p>
          </div>
          <div className='h-1.5 w-full bg-surface-muted rounded-full overflow-hidden'>
            <div
              className='h-full bg-primary transition-colors duration-150'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Acciones en Card */}
      <div className='flex gap-sm pt-sm border-t border-border-subtle'>
        {sale.status !== 'PAID' && sale.status !== 'CANCELLED' && (
          <Button
            size='sm'
            variant='secondary'
            onClick={() => onPayment(sale)}
            className='flex-1 h-9 text-body-sm-bold'
          >
            <CreditCard className='w-4 h-4 mr-1.5' />
            {t('sales.cobros.action.payment', 'Registrar Cobro')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='secondary'
              size='sm'
              className='h-9 px-3 text-body-sm-bold text-on-surface-deep'
              aria-label={t('action.more', 'Más opciones')}
            >
              {t('action.more', 'Más opciones')} <MoreVertical className='w-4 h-4 ml-1 text-on-surface-deep' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48 p-1'>
            <DropdownMenuItem onClick={() => onDetails(sale.id)} className='gap-2 text-body-md'>
              <Eye className='w-4 h-4' />
              {t('sales.cobros.action.details', 'Ver Detalles')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistory(sale.id)} className='gap-2 text-body-md'>
              <List className='w-4 h-4' />
              {t('sales.cobros.action.history', 'Historial de Cobros')}
            </DropdownMenuItem>
            {sale.status !== 'CANCELLED' && (
              <DropdownMenuItem onClick={() => onCancel(sale)} className='gap-2 text-body-md text-error'>
                <Ban className='w-4 h-4' />
                {t('sales.cobros.action.cancel', 'Anular Venta')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})

SaleCard.displayName = 'SaleCard'

// ── Configuración de KPIs (estático; solo cambia la clase semántica) ──────────
interface KpiConfig {
  label: string
  icon: ComponentType<{ className?: string }>
  valueClass: string
}

const SalePayment = () => {
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const { currentBranchId } = useBranch()
  const {
    toasts,
    removeToast,
    error: showError,
    success: showSuccess,
    info: showInfo,
  } = useToast()

  // Local state
  const [rawSales, setRawSales] = useState<SaleRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    page_size: 100,
    total_records: 0,
    total_pages: 0,
  })

  const [localPage, setLocalPage] = useState(1)
  const localPageSize = 20

  const pagesCache = useRef(new Map<string, { data: SaleRow[]; pagination: any }>())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Modal State
  const [selectedSale, setSelectedSale] = useState<SaleRow | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState<SaleRow | null>(null)
  const [showCancelPreview, setShowCancelPreview] = useState(false)
  const [cancelPreviewData, setCancelPreviewData] = useState<any>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // F2 → foco al filtro de cliente (buscador principal de la página,
  // DESIGN.md §12); muere si hay un modal abierto. Al cargar, el foco cae
  // en el mismo input para empezar a filtrar sin clic.
  const clientFilterRef = useRef<HTMLInputElement>(null)
  useSearchFocusShortcut({
    enabled: !(isPaymentModalOpen || showCancelPreview),
    inputRef: clientFilterRef,
  })
  useEffect(() => {
    clientFilterRef.current?.focus()
  }, [])

  // Formatters memoizados
  const formatCurrency = useCallback(
    (value: number | null | undefined) =>
      currencyFormatter(lang, 'PYG').format(value || 0),
    [lang],
  )

  const formatDate = useCallback(
    (dateStr: string | null | undefined) =>
      dateStr ? dateFormatterFactory(lang).format(new Date(dateStr)) : '-',
    [lang],
  )

  const handleLoadSales = async (page: number = 1, forceRefresh: boolean = false) => {
    setLocalPage(1)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const cacheKey = `${page}-${selectedClientName}-${selectedStatus}-${dateRange.start_date}-${dateRange.end_date}`

    if (!forceRefresh && pagesCache.current.has(cacheKey)) {
      const cachedData = pagesCache.current.get(cacheKey)!
      setRawSales(cachedData.data)
      setPagination(cachedData.pagination)
      return
    }

    setIsLoading(true)
    setError(null)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      let result: any
      const filters: any = {
        page,
        page_size: pagination.page_size,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      }

      if (selectedStatus && selectedStatus !== 'all') {
        filters.payment_status = normalizeStatusFilterForApi(selectedStatus)
      }

      if (selectedClientName?.trim()) {
        result = await salePaymentService.getSalesByClientNameWithPaymentStatus(
          selectedClientName.trim(),
          filters,
        )
      } else {
        result =
          await salePaymentService.getSalesByDateRangeWithPaymentStatus(filters)
      }

      const normalizedData: SaleRow[] = (result?.data || [])
        .map((item: any) => normalizeSaleRow(item))
        .sort((a: SaleRow, b: SaleRow) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const paginationData = result?.pagination
        ? {
            page: result.pagination.page,
            page_size: result.pagination.page_size,
            total_records: result.pagination.total_records,
            total_pages: result.pagination.total_pages,
          }
        : pagination

      pagesCache.current.set(cacheKey, { data: normalizedData, pagination: paginationData })

      setRawSales(normalizedData)
      setPagination(paginationData)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('Error loading sales:', err)
      setError(t('sales.cobros.error.load', 'Error al cargar los cobros de ventas.'))
      showError(t('sales.cobros.toast.connection', 'Error de conexión'))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // Limpiar caché al cambiar filtros/sucursal (Auto-fetch con debounce)
  useEffect(() => {
    pagesCache.current.clear()

    const timer = setTimeout(() => {
      handleLoadSales(1)
    }, selectedClientName ? 800 : 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, dateRange.start_date, dateRange.end_date, currentBranchId])

  // Debounce de búsqueda por cliente
  useEffect(() => {
    if (!selectedClientName) return
    const timer = setTimeout(() => {
      handleLoadSales(1)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientName])

  const handleHistory = useCallback(
    (saleId: string | number) => {
      navigate(`/cobros-ventas/${saleId}/pagos`)
    },
    [navigate],
  )

  const handleDetails = useCallback(
    (saleId: string | number) => {
      navigate(`/cobros-ventas/${saleId}`)
    },
    [navigate],
  )

  const handleOpenPayment = useCallback((sale: SaleRow) => {
    setSelectedSale(sale)
    setIsPaymentModalOpen(true)
  }, [])

  const handleRefresh = useCallback(() => {
    pagesCache.current.clear()
    handleLoadSales(pagination.page, true)
    showInfo(t('sales.cobros.toast.refreshing', 'Actualizando...'))
  }, [pagination.page, handleLoadSales, showInfo, t])

  const applyFilters = useCallback(() => {
    pagesCache.current.clear()
    handleLoadSales(1, true)
  }, [handleLoadSales])

  const handleClearFilters = useCallback(() => {
    pagesCache.current.clear()
    setSearchTerm('')
    setSelectedClientName('')
    setSelectedStatus('all')
    setDateRange(getDefaultDateRange())
    setTimeout(() => handleLoadSales(1, true), 0)
  }, [handleLoadSales])

  const { filteredSales, displaySales } = useMemo(() => {
    let filtered = rawSales

    if (selectedStatus && selectedStatus !== 'all') {
      const targetStatus = selectedStatus.toUpperCase()
      filtered = filtered.filter(sale => sale.status === targetStatus)
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        sale =>
          String(sale.id).toLowerCase().includes(lowerTerm) ||
          (sale.client_name || '').toLowerCase().includes(lowerTerm),
      )
    }

    const start = (localPage - 1) * localPageSize
    return {
      filteredSales: filtered,
      displaySales: filtered.slice(start, start + localPageSize),
    }
  }, [rawSales, searchTerm, selectedStatus, localPage, localPageSize])

  const handlePaymentSubmit = async (paymentData: any) => {
    // Mapear a PUT /sale/{id}/confirm-payment. El cobro en divisa viaja
    // como metadatos de la pata (currency_id/exchange_rate/original_amount +
    // amount_received ya convertido a la moneda del documento por el modal).
    const confirmPayload = {
      payment_methods: [
        {
          method: paymentData.payment_method_name || 'CASH',
          amount: paymentData.amount_to_apply,
          amount_received: paymentData.amount_received,
          currency_id: paymentData.currency_id || undefined,
          exchange_rate: paymentData.exchange_rate || undefined,
          original_amount: paymentData.original_amount || undefined,
        },
      ],
      caja_id: paymentData.cash_register_id || undefined,
    }

    try {
      const result = await salePaymentService.confirmSalePayment(paymentData.sales_order_id, confirmPayload)
      if (result && result.success === false) {
        throw new Error(result.message || result.error || t('sales.payments.confirmFailed', 'No se pudo confirmar el cobro'))
      }
      showSuccess(t('sales.payments.confirmSuccess', 'Cobro registrado exitosamente'))
      pagesCache.current.clear()
      handleLoadSales(pagination.page, true)
    } catch (err: any) {
      showError(err?.message || t('sales.payments.confirmFailed', 'No se pudo confirmar el cobro'))
      throw err
    }
  }

  const handleCancelSale = async (sale: SaleRow) => {
    setSaleToCancel(sale)
    setIsCancelling(true)

    try {
      const previewResult: any = await saleService.previewSaleCancellation(sale.id as string)
      if (previewResult?.success) {
        setCancelPreviewData(previewResult.data || { sale_info: { id: sale.id } })
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
      const result: any = await saleService.revertSale(
        saleToCancel.id as string,
        'ANULADO_DESDE_COBROS_VENTAS',
      )
      if (result.success) {
        showSuccess(t('sales.cobros.toast.cancelled', 'Venta anulada exitosamente.'))
        pagesCache.current.clear()
        handleLoadSales(pagination.page, true)
      }
    } catch (err) {
      showError(t('sales.cobros.toast.cancelFailed', 'No se pudo anular la venta'))
    } finally {
      setIsCancelling(false)
      setSaleToCancel(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const s = status?.toString().trim().toUpperCase()
    switch (s) {
      case 'PAID':
        return (
          <Badge variant='success' size='sm'>
            {t('sales.cobros.status.paid', 'Pagado')}
          </Badge>
        )
      case 'PARTIAL':
        return (
          <Badge variant='info' size='sm'>
            {t('sales.cobros.status.partial', 'Parcial')}
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant='destructive' size='sm'>
            {t('sales.cobros.status.cancelled', 'Cancelado')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant='warning' size='sm'>
            {t('sales.cobros.status.pending', 'Pendiente')}
          </Badge>
        )
      default:
        return (
          <Badge variant='secondary' size='sm'>
            {t('sales.cobros.status.none', 'Sin estado')}
          </Badge>
        )
    }
  }

  if (error && !isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl'>
          <DataState
            variant='error'
            title={t('sales.cobros.error.title', 'Error al cargar')}
            message={error}
            onRetry={handleRefresh}
            testId='cobros-error'
          />
        </div>
      </div>
    )
  }

  const kpis: Array<{ cfg: KpiConfig; count: number; amount: number }> = [
    {
      cfg: {
        label: t('sales.cobros.kpi.pendingBalances', 'Saldos Pendientes'),
        icon: Clock,
        valueClass: 'text-warning',
      },
      count: filteredSales.filter(s => s.status === 'PENDING' || s.status === 'PARTIAL').length,
      amount: filteredSales.reduce((acc, s) => acc + (Number(s.balance_due) || 0), 0),
    },
    {
      cfg: {
        label: t('sales.cobros.kpi.partialCollections', 'Cobros Parciales'),
        icon: CircleDollarSign,
        valueClass: 'text-primary',
      },
      count: filteredSales.filter(s => s.status === 'PARTIAL').length,
      amount: filteredSales.reduce(
        (acc, s) => acc + (s.status === 'PARTIAL' ? Number(s.total_paid) || 0 : 0),
        0,
      ),
    },
    {
      cfg: {
        label: t('sales.cobros.kpi.successfulCollections', 'Cobros Exitosos'),
        icon: CheckCircle2,
        valueClass: 'text-success',
      },
      count: filteredSales.filter(s => s.status === 'PAID').length,
      amount: filteredSales.reduce(
        (acc, s) => acc + (s.status === 'PAID' ? Number(s.total_amount) || 0 : 0),
        0,
      ),
    },
    {
      cfg: {
        label: t('sales.cobros.kpi.cancelledSales', 'Ventas Anuladas'),
        icon: Ban,
        valueClass: 'text-on-surface-deep',
      },
      count: filteredSales.filter(s => s.status === 'CANCELLED').length,
      amount: filteredSales.reduce(
        (acc, s) => acc + (s.status === 'CANCELLED' ? Number(s.total_amount) || 0 : 0),
        0,
      ),
    },
  ]

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg animate-in fade-in duration-150'>
        <PageHeader
          breadcrumb={t('sales.title', 'Ventas')}
          title={t('sales.cobros.page.title', 'Cobros de Ventas')}
          subtitle={t('sales.cobros.page.subtitle', 'Gestión centralizada de cobros')}
        />

        {/* KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md'>
          {kpis.map(({ cfg, count, amount }, i) => (
            <div
              key={i}
              className='bg-surface rounded-md border border-border-subtle shadow-whisper p-lg flex flex-col gap-md'
            >
              <div className='flex items-center justify-between'>
                <div className='p-sm bg-surface-muted rounded-md'>
                  <cfg.icon className={`w-5 h-5 ${cfg.valueClass}`} />
                </div>
                <Badge variant='secondary' size='sm'>
                  {t('sales.cobros.kpi.operations', { count })}
                </Badge>
              </div>
              <div>
                <p className='text-label-caps uppercase text-on-surface-deep mb-sm'>
                  {cfg.label}
                </p>
                <h2 className='text-title-md font-data-mono text-data-mono text-foreground'>
                  {formatCurrency(amount)}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <section className='bg-surface rounded-md border border-border-subtle shadow-whisper p-md'>
          <div className='flex flex-col xl:flex-row items-end gap-md'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md flex-1 w-full'>
              <div className='space-y-xs min-w-0'>
                <Label htmlFor='cobros-filter-client' className='text-body-sm-bold text-on-surface-deep mb-xs'>
                  {t('sales.cobros.filter.client', 'Cliente')}
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep w-4 h-4' />
                  <Input
                    id='cobros-filter-client'
                    ref={clientFilterRef}
                    placeholder={t('sales.cobros.filter.clientPlaceholder', 'Filtrar cliente... (F2)')}
                    value={selectedClientName}
                    onChange={e => setSelectedClientName(e.target.value)}
                    className='pl-10 min-w-0 w-full'
                  />
                </div>
              </div>

              <div className='space-y-xs min-w-0'>
                <Label htmlFor='cobros-filter-status' className='text-body-sm-bold text-on-surface-deep mb-xs'>
                  {t('sales.cobros.filter.status', 'Estado')}
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id='cobros-filter-status' className='min-w-0 w-full'>
                    <SelectValue placeholder={t('sales.cobros.filter.status', 'Estado')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>
                      {t('sales.cobros.filter.all', 'Todos')}
                    </SelectItem>
                    <SelectItem value='pending'>
                      {t('sales.cobros.status.pending', 'Pendiente')}
                    </SelectItem>
                    <SelectItem value='partial'>
                      {t('sales.cobros.status.partial', 'Parcial')}
                    </SelectItem>
                    <SelectItem value='paid'>
                      {t('sales.cobros.status.paid', 'Pagado')}
                    </SelectItem>
                    <SelectItem value='cancelled' className='text-error'>
                      {t('sales.cobros.filter.cancelled', 'Anulado')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-xs min-w-0'>
                <Label htmlFor='cobros-filter-from' className='text-body-sm-bold text-on-surface-deep mb-xs'>
                  {t('sales.cobros.filter.from', 'Desde')}
                </Label>
                <Input
                  id='cobros-filter-from'
                  type='date'
                  value={dateRange.start_date}
                  onChange={e =>
                    setDateRange(prev => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  className='min-w-0 w-full'
                />
              </div>

              <div className='space-y-xs min-w-0'>
                <Label htmlFor='cobros-filter-to' className='text-body-sm-bold text-on-surface-deep mb-xs'>
                  {t('sales.cobros.filter.to', 'Hasta')}
                </Label>
                <Input
                  id='cobros-filter-to'
                  type='date'
                  value={dateRange.end_date}
                  onChange={e =>
                    setDateRange(prev => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  className='min-w-0 w-full'
                />
              </div>
            </div>

            <div className='flex gap-sm w-full xl:w-auto'>
              <Button
                variant='primary'
                onClick={applyFilters}
                className='flex-1 xl:flex-none'
              >
                <Filter className='w-4 h-4 mr-1.5' />
                {t('sales.cobros.action.filter', 'Filtrar')}
              </Button>
              <Button
                variant='secondary'
                onClick={handleClearFilters}
                className='min-w-24'
              >
                {t('sales.cobros.action.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        </section>

        {/* Table Container — card con tabla (§6.3): toolbar + tabla full-bleed */}
        <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
          <div className='p-md border-b border-border-subtle bg-surface flex justify-between items-center gap-md'>
            <div className='relative w-full max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-deep w-4 h-4' />
              <Input
                id='cobros-search'
                aria-label={t('sales.cobros.search.label', 'Buscar ventas')}
                placeholder={t('sales.cobros.search.placeholder', 'Buscar en resultados (ID o cliente)...')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-9 bg-surface'
              />
            </div>
            <div className='text-label-caps uppercase text-on-surface-deep bg-surface-muted border border-border-subtle px-sm py-xs rounded-md whitespace-nowrap tabular-nums'>
              {t('sales.cobros.results', { count: displaySales.length })}
            </div>
          </div>

          {/* Estados de datos */}
          {isLoading && displaySales.length === 0 ? (
            <div className='p-lg'>
              <GenericSkeletonList count={6} lineHeight={44} data-testid='cobros-loading' />
            </div>
          ) : (
            <>
              <div className='hidden lg:block overflow-x-auto'>
                <Table className='min-w-[1000px]'>
                  <TableHeader>
                    <TableRow className='bg-surface-muted hover:bg-surface-muted border-b border-border-subtle'>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep'>
                        {t('sales.cobros.table.id', 'ID')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep'>
                        {t('sales.cobros.table.client', 'Cliente')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep'>
                        {t('sales.cobros.table.date', 'Fecha')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep text-center'>
                        {t('sales.cobros.table.status', 'Estado')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>
                        {t('sales.cobros.table.progress', 'Progreso')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>
                        {t('sales.cobros.table.total', 'Total')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>
                        {t('sales.cobros.table.balance', 'Pendiente')}
                      </TableHead>
                      <TableHead className='w-16 text-right'>
                        <span className='sr-only'>
                          {t('sales.cobros.table.actions', 'Acciones')}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displaySales.length === 0 ? (
                      <TableRow className='hover:bg-transparent border-0'>
                        <TableCell colSpan={8} className='py-xl' data-testid='cobros-empty'>
                          <div className='flex flex-col items-center justify-center gap-sm text-on-surface-deep'>
                            <div className='size-16 rounded-full bg-surface-muted flex items-center justify-center'>
                              <Package size={28} strokeWidth={1.5} className='text-on-surface-deep' aria-hidden='true' />
                            </div>
                            <p className='text-body-md-bold text-foreground'>
                              {t('sales.cobros.empty.title', 'Sin resultados')}
                            </p>
                            <p className='text-body-md text-on-surface-deep'>
                              {t(
                                'sales.cobros.empty.description',
                                'No se encontraron ventas con los filtros seleccionados.',
                              )}
                            </p>
                            <Button variant='secondary' size='sm' onClick={handleClearFilters}>
                              {t('sales.cobros.empty.action', 'Limpiar filtros')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displaySales.map(sale => (
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
                          t={t}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden divide-y divide-border-subtle'>
                {displaySales.length === 0 ? (
                  <div className='flex flex-col items-center justify-center gap-sm py-xl text-on-surface-deep' data-testid='cobros-empty-mobile'>
                    <div className='size-16 rounded-full bg-surface-muted flex items-center justify-center'>
                      <Package size={28} strokeWidth={1.5} className='text-on-surface-deep' aria-hidden='true' />
                    </div>
                    <p className='text-body-md-bold text-foreground'>
                      {t('sales.cobros.empty.title', 'Sin resultados')}
                    </p>
                    <p className='text-body-md text-on-surface-deep'>
                      {t(
                        'sales.cobros.empty.description',
                        'No se encontraron ventas con los filtros seleccionados.',
                      )}
                    </p>
                    <Button variant='secondary' size='sm' onClick={handleClearFilters}>
                      {t('sales.cobros.empty.action', 'Limpiar filtros')}
                    </Button>
                  </div>
                ) : (
                  displaySales.map(sale => (
                    <SaleCard
                      key={sale.id}
                      sale={sale}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                      onPayment={handleOpenPayment}
                      onCancel={handleCancelSale}
                      onDetails={handleDetails}
                      onHistory={handleHistory}
                      getStatusBadge={getStatusBadge}
                      t={t}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {pagination.total_records > localPageSize && (
            <div className='p-md border-t border-border-subtle bg-surface-muted flex flex-col sm:flex-row items-center justify-between gap-md'>
              <div className='text-label-caps uppercase text-on-surface-deep tabular-nums'>
                {t('sales.cobros.pagination.showing', {
                  from: (localPage - 1) * localPageSize + 1,
                  to: Math.min(localPage * localPageSize, pagination.total_records),
                  total: pagination.total_records,
                })}
                {pagination.total_pages > 1 && (
                  <span className='ml-2 text-on-surface-deep'>
                    {t('sales.cobros.pagination.serverPage', {
                      page: pagination.page,
                      totalPages: pagination.total_pages,
                    })}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-sm'>
                <Button
                  variant='secondary'
                  size='sm'
                  disabled={(localPage === 1 && pagination.page === 1) || isLoading}
                  onClick={() => {
                    if (localPage > 1) {
                      setLocalPage(prev => prev - 1)
                    } else if (pagination.page > 1) {
                      handleLoadSales(pagination.page - 1)
                      setTimeout(() => setLocalPage(Math.ceil(pagination.page_size / localPageSize)), 100)
                    }
                  }}
                  className='text-label-caps uppercase'
                >
                  <ChevronLeft className='w-4 h-4 mr-1' />
                  {t('sales.cobros.pagination.previous', 'Anterior')}
                </Button>

                <span className='px-sm py-xs font-data-mono text-data-mono text-primary bg-background border border-border-subtle rounded-md'>
                  {t('sales.cobros.pagination.block', { page: localPage })}
                </span>

                <Button
                  variant='secondary'
                  size='sm'
                  disabled={(localPage * localPageSize >= rawSales.length && pagination.page >= pagination.total_pages) || isLoading}
                  onClick={() => {
                    if (localPage * localPageSize < rawSales.length) {
                      setLocalPage(prev => prev + 1)
                    } else if (pagination.page < pagination.total_pages) {
                      handleLoadSales(pagination.page + 1)
                    }
                  }}
                  className='text-label-caps uppercase'
                >
                  {t('sales.cobros.pagination.next', 'Siguiente')}
                  <ChevronRight className='w-4 h-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Registro de cobro */}
        <RegisterSalePaymentModal
          open={isPaymentModalOpen}
          onOpenChange={open => {
            setIsPaymentModalOpen(open)
            if (!open) setSelectedSale(null)
          }}
          sale={selectedSale}
          onSubmit={handlePaymentSubmit}
        />

        {/* Anular venta — confirmación (EnhancedModal) */}
        <EnhancedModal
          isOpen={showCancelPreview && !!cancelPreviewData && !!saleToCancel}
          onClose={() => setShowCancelPreview(false)}
          title={t('sales.cobros.cancel.title', '¿Anular esta venta?')}
          variant='error'
          size='sm'
          footer={
            <div className='flex flex-col-reverse sm:flex-row gap-sm'>
              <Button
                variant='secondary'
                className='flex-1'
                onClick={() => setShowCancelPreview(false)}
              >
                {t('action.cancel', 'Cancelar')}
              </Button>
              <Button
                variant='destructive'
                className='flex-1'
                onClick={handleConfirmCancellation}
                disabled={isCancelling}
              >
                {isCancelling
                  ? t('sales.cobros.cancel.processing', 'Anulando...')
                  : t('sales.cobros.cancel.confirm', 'Sí, Anular')}
              </Button>
            </div>
          }
        >
          <div className='space-y-md'>
            <p className='text-body-md text-on-surface-deep'>
              {t('sales.cobros.cancel.message', 'Esta acción revertirá los cobros y devolverá el stock. Cliente:')}{' '}
              <span className='text-body-md-bold text-error'>
                {saleToCancel?.client_name}
              </span>
              .
            </p>
            {cancelPreviewData?.impact_analysis && (
              <div className='p-md bg-error-container text-error rounded-md text-body-md'>
                <p className='text-body-md-bold mb-xs'>
                  {t('sales.cobros.cancel.impactTitle', 'Impacto de la anulación:')}
                </p>
                <ul className='list-disc pl-4 space-y-xs'>
                  {cancelPreviewData.impact_analysis.requires_payment_reversal && (
                    <li>
                      {t('sales.cobros.cancel.payments', {
                        count: cancelPreviewData.impact_analysis.payments_to_cancel || 0,
                      })}
                    </li>
                  )}
                  {cancelPreviewData.impact_analysis.requires_stock_adjustment && (
                    <li>
                      {t('sales.cobros.cancel.items', {
                        count: cancelPreviewData.impact_analysis.stock_adjustments_required || 0,
                      })}
                    </li>
                  )}
                  <li>
                    {t('sales.cobros.cancel.totalToReverse', {
                      amount: formatCurrency(cancelPreviewData.impact_analysis.total_to_reverse || 0),
                    })}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </EnhancedModal>

        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  )
}

export default SalePayment
