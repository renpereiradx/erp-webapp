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
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

// ── Tipos (forma normalizada que consume la vista) ──────────────────────────
interface SaleRow {
  id: string | number
  date: string
  client_name?: string
  client?: { document_id?: string | number } | null
  client_document_id?: string | number
  status: string
  total_amount: number
  total_paid: number
  balance_due: number
  payment_progress: number
  [key: string]: any
}

// ── Helpers de presentación (sin lógica de negocio) ─────────────────────────
const formatDocumentId = (value: string | number | null | undefined): string => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

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

const normalizeStatusFilterForApi = (status: string): string | undefined => {
  if (!status || status === 'all') return undefined

  const normalized = status.toString().trim().toUpperCase()
  const map: Record<string, string> = {
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

const normalizeSaleStatus = (sale: Record<string, any>): string => {
  const rawStatus =
    sale?.payment_status || sale?.status || sale?.sale_status || ''
  const normalizedRaw = rawStatus.toString().trim().toUpperCase()

  const normalizedFromRaw: Record<string, string> = {
    PENDING: 'PENDING',
    PENDING_PAYMENT: 'PENDING',
    PARTIAL: 'PARTIAL',
    PARTIAL_PAYMENT: 'PARTIAL',
    PAID: 'PAID',
    COMPLETED: 'PAID',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
  }

  if (normalizedFromRaw[normalizedRaw]) return normalizedFromRaw[normalizedRaw]

  const balanceDue = Number(sale?.remaining_amount ?? sale?.balance_due) || 0
  const totalPaid = Number(sale?.paid_amount ?? sale?.total_paid) || 0

  if (balanceDue <= 0) return 'PAID'
  if (totalPaid > 0) return 'PARTIAL'
  return 'PENDING'
}

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
            <span className='text-body-sm-bold text-muted-foreground'>
              {t('sales.cobros.client.cid', { id: formatDocumentId(sale.client?.document_id || sale.client_document_id) })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className='text-body-md text-muted-foreground'>
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
          <span className='font-data-mono text-data-mono text-muted-foreground'>
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
            >
              <CreditCard size={16} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 hover:bg-surface-muted rounded-full'
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical size={16} className='text-muted-foreground' />
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
                <Eye size={16} />
                {t('sales.cobros.action.details', 'Ver Detalles')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onHistory(sale.id)}
                className='gap-2 py-2 text-body-md rounded'
              >
                <List size={16} />
                {t('sales.cobros.action.history', 'Historial de Cobros')}
              </DropdownMenuItem>
              {sale.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={() => onCancel(sale)}
                  className='gap-2 py-2 text-body-md rounded text-error'
                >
                  <Ban size={16} />
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
    <div className='p-md space-y-md transition-colors border-b border-divider'>
      <div className='flex items-center justify-between' onClick={() => onDetails(sale.id)}>
        <div className='flex items-center gap-sm'>
          <div className='size-8 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground'>
            <User size={14} />
          </div>
          <div className='flex flex-col'>
            <span className='text-body-md-bold text-foreground'>
              {sale.client_name}
            </span>
            <span className='font-data-mono text-data-mono text-muted-foreground'>
              #{sale.id}
            </span>
          </div>
        </div>
        {getStatusBadge(sale.status)}
      </div>

      <div className='grid grid-cols-2 gap-x-4 gap-y-sm' onClick={() => onDetails(sale.id)}>
        <div>
          <p className='text-label-caps uppercase text-muted-foreground mb-xs'>
            {t('sales.cobros.table.date', 'Fecha')}
          </p>
          <p className='text-body-md text-muted-foreground'>
            {formatDate(sale.date)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-label-caps uppercase text-muted-foreground mb-xs'>
            {t('sales.cobros.table.total', 'Total')}
          </p>
          <p className='font-data-mono text-data-mono text-foreground'>
            {formatCurrency(sale.total_amount)}
          </p>
        </div>

        <div className='col-span-2 space-y-sm'>
          <div className='flex justify-between items-end'>
            <p className='text-label-caps uppercase text-muted-foreground'>
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
            <CreditCard size={14} className='mr-1.5' />
            {t('sales.cobros.action.payment', 'Registrar Cobro')}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-9 px-3 text-body-sm-bold text-muted-foreground'
            >
              {t('action.more', 'Más opciones')} <MoreVertical size={14} className='ml-1 text-muted-foreground' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48 p-1'>
            <DropdownMenuItem onClick={() => onDetails(sale.id)} className='gap-2 text-body-md'>
              <Eye size={14} />
              {t('sales.cobros.action.details', 'Ver Detalles')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHistory(sale.id)} className='gap-2 text-body-md'>
              <List size={14} />
              {t('sales.cobros.action.history', 'Historial de Cobros')}
            </DropdownMenuItem>
            {sale.status !== 'CANCELLED' && (
              <DropdownMenuItem onClick={() => onCancel(sale)} className='gap-2 text-body-md text-error'>
                <Ban size={14} />
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
  icon: ComponentType<{ size?: number; className?: string }>
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
        .map((item: any) => {
          const sale = item.sale || item
          const totalPaid = Number(sale.paid_amount ?? sale.total_paid ?? sale.amount_paid) || 0
          const rawTotal = Number(sale.total_amount) || Number(sale.total) || 0
          const rawBalance =
            (sale.remaining_amount !== undefined && sale.remaining_amount !== null)
              ? Number(sale.remaining_amount)
              : (sale.balance_due !== undefined && sale.balance_due !== null)
                ? Number(sale.balance_due)
                : null

          let finalTotal = rawTotal
          let finalBalance =
            rawBalance !== null ? rawBalance : Math.max(0, rawTotal - totalPaid)

          const status = normalizeSaleStatus({ ...sale, total_paid: totalPaid, balance_due: finalBalance })

          if (status === 'PAID' || status === 'CANCELLED') finalBalance = 0

          let paymentProgress =
            finalTotal > 0 ? ((finalTotal - finalBalance) / finalTotal) * 100 : 0
          if (status === 'CANCELLED') paymentProgress = 0

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
            payment_progress: paymentProgress,
          }
        })
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
        valueClass: 'text-muted-foreground',
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
      <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-xl'>
        {/* Header */}
        <header className='flex flex-col gap-2 border-l-4 border-primary pl-4'>
          <h1 className='text-headline-lg text-foreground tracking-tight leading-none'>
            {t('sales.cobros.page.title', 'Cobros de Ventas')}
          </h1>
          <p className='text-body-md text-muted-foreground'>
            {t('sales.cobros.page.subtitle', 'Gestión centralizada de cobros')}
          </p>
          <div className='mt-sm'>
            <Button variant='outline' size='sm' onClick={handleRefresh} className='h-9'>
              <RefreshCw
                size={14}
                className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              {t('sales.cobros.action.sync', 'Sincronizar')}
            </Button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md'>
          {kpis.map(({ cfg, count, amount }, i) => (
            <div
              key={i}
              className='bg-surface rounded-md border border-border-subtle shadow-whisper p-lg flex flex-col gap-md'
            >
              <div className='flex items-center justify-between'>
                <div className='p-sm bg-surface-muted rounded-md'>
                  <cfg.icon size={20} className={cfg.valueClass} />
                </div>
                <Badge variant='secondary' size='sm'>
                  {t('sales.cobros.kpi.operations', { count })}
                </Badge>
              </div>
              <div>
                <p className='text-label-caps uppercase text-muted-foreground leading-none mb-sm'>
                  {cfg.label}
                </p>
                <h2 className='text-title-md font-data-mono text-data-mono text-foreground tracking-tight'>
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
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('sales.cobros.filter.client', 'Cliente')}
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4' />
                  <Input
                    placeholder={t('sales.cobros.filter.clientPlaceholder', 'Filtrar cliente...')}
                    value={selectedClientName}
                    onChange={e => setSelectedClientName(e.target.value)}
                    className='pl-10 min-w-0 w-full'
                  />
                </div>
              </div>

              <div className='space-y-xs min-w-0'>
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('sales.cobros.filter.status', 'Estado')}
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className='min-w-0 w-full'>
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
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('sales.cobros.filter.from', 'Desde')}
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
                  className='min-w-0 w-full'
                />
              </div>

              <div className='space-y-xs min-w-0'>
                <label className='text-body-sm-bold text-muted-foreground mb-xs block'>
                  {t('sales.cobros.filter.to', 'Hasta')}
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
                <Filter size={16} className='mr-1.5' />
                {t('sales.cobros.action.filter', 'Filtrar')}
              </Button>
              <Button
                variant='outline'
                onClick={handleClearFilters}
                className='min-w-24'
              >
                {t('sales.cobros.action.clear', 'Limpiar')}
              </Button>
            </div>
          </div>
        </section>

        {/* Table Container */}
        <section className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
          <div className='p-md border-b border-border-subtle bg-surface flex justify-between items-center gap-md'>
            <div className='relative w-full max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4' />
              <Input
                placeholder={t('sales.cobros.search.placeholder', 'Buscar venta (ID o cliente)...')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='text-label-caps uppercase text-muted-foreground bg-surface-muted border border-border-subtle px-sm py-xs rounded-md whitespace-nowrap tabular-nums'>
              {t('sales.cobros.results', { count: displaySales.length })}
            </div>
          </div>

          {/* Estados de datos */}
          {isLoading && displaySales.length === 0 ? (
            <GenericSkeletonList count={6} lineHeight={44} data-testid='cobros-loading' />
          ) : displaySales.length === 0 ? (
            <DataState
              variant='empty'
              title={t('sales.cobros.empty.title', 'Sin resultados')}
              description={t(
                'sales.cobros.empty.description',
                'No se encontraron ventas con los filtros seleccionados.',
              )}
              testId='cobros-empty'
            />
          ) : (
            <>
              <div className='hidden lg:block overflow-x-auto'>
                <Table className='min-w-[1000px]'>
                  <TableHeader>
                    <TableRow className='bg-surface-muted hover:bg-surface-muted border-b border-border-subtle'>
                      <TableHead className='text-label-caps uppercase text-muted-foreground'>
                        {t('sales.cobros.table.id', 'ID')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground'>
                        {t('sales.cobros.table.client', 'Cliente')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground'>
                        {t('sales.cobros.table.date', 'Fecha')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground text-center'>
                        {t('sales.cobros.table.status', 'Estado')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground text-right'>
                        {t('sales.cobros.table.progress', 'Progreso')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground text-right'>
                        {t('sales.cobros.table.total', 'Total')}
                      </TableHead>
                      <TableHead className='text-label-caps uppercase text-muted-foreground text-right'>
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
                        t={t}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='lg:hidden divide-y divide-border-subtle'>
                {displaySales.map(sale => (
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
                ))}
              </div>
            </>
          )}

          {/* Pagination Footer */}
          {pagination.total_records > localPageSize && (
            <div className='p-md border-t border-border-subtle bg-surface-muted flex flex-col sm:flex-row items-center justify-between gap-md'>
              <div className='text-label-caps uppercase text-muted-foreground tabular-nums'>
                {t('sales.cobros.pagination.showing', {
                  from: (localPage - 1) * localPageSize + 1,
                  to: Math.min(localPage * localPageSize, pagination.total_records),
                  total: pagination.total_records,
                })}
                {pagination.total_pages > 1 && (
                  <span className='ml-2 text-muted-foreground'>
                    {t('sales.cobros.pagination.serverPage', {
                      page: pagination.page,
                      totalPages: pagination.total_pages,
                    })}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-sm'>
                <Button
                  variant='outline'
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
                  <ChevronLeft size={14} className='mr-1' />
                  {t('sales.cobros.pagination.previous', 'Anterior')}
                </Button>

                <span className='px-sm py-xs font-data-mono text-data-mono text-primary bg-background border border-border-subtle rounded-md'>
                  {t('sales.cobros.pagination.block', { page: localPage })}
                </span>

                <Button
                  variant='outline'
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
                  <ChevronRight size={14} className='ml-1' />
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
                variant='outline'
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
            <p className='text-body-md text-muted-foreground'>
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
