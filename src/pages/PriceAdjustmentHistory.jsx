/**
 * Página de Historial Global de Ajustes de Precios - Patrón MVP
 * Filtros draft-vs-applied (tipear NO fetcha) + tabla server-side paginada.
 * Alineada a DESIGN.md: tokens semánticos, componentes ui/, estados
 * loading/empty/error (§6.7), F2 al buscador de producto (§12.4).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, ArrowDown, ArrowUp, ArrowLeftRight, Filter, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { priceAdjustmentService } from '@/services/priceAdjustmentService'
import { getGroupedUnitOptions } from '@/constants/units'
import { formatPYG } from '@/utils/currencyUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import TablePagination from '@/components/ui/TablePagination'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { useSearchFocusShortcut } from '@/hooks/useSearchFocusShortcut'

// Tipos de ajuste que escribe el backend en metadata->>'adjustment_type'
// (enum del schema de metadata). '' = sin filtro.
const ADJUSTMENT_TYPE_OPTIONS = [
  'MARKET_UPDATE',
  'COMPETITOR_ADJUSTMENT',
  'PROMOTION',
  'COST_CHANGE',
  'CURRENCY_ADJUSTMENT',
  'CORRECTION',
  'SEASONAL',
  'MANUAL_ADJUSTMENT',
]

const UNIT_OPTIONS = getGroupedUnitOptions().flatMap(g => g.options.map(o => o.value))

const EMPTY_FILTERS = {
  product: '',
  user: '',
  unit: '',
  adjustmentType: '',
  dateFrom: '',
  dateTo: '',
}

// Selects nativos estilizados con la misma convención que <Input> (§6.4)
const SELECT_CLASSES =
  'w-full h-10 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer disabled:opacity-60'

const PriceAdjustmentHistory = () => {
  const { t } = useI18n()

  // Borrador de filtros (inputs) vs filtros aplicados (fetch). Aplicar/Limpiar
  // o Enter copian el borrador a los aplicados — tipear NO dispara requests.
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [dateRangeError, setDateRangeError] = useState('')

  // State para los datos
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 25

  const productSearchRef = useRef(null)

  // F2 → foco al buscador de producto (§12.4; sin modales: enabled fijo)
  useSearchFocusShortcut({ enabled: true, inputRef: productSearchRef })

  // Cargar datos — todos los filtros viajan server-side (endpoint
  // /manual_adjustment/price/date-range), incluido el total real para paginar.
  const fetchAdjustments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await priceAdjustmentService.getByDateRange(
        appliedFilters.dateFrom,
        appliedFilters.dateTo,
        appliedFilters.product.trim(),
        itemsPerPage,
        offset,
        {
          user: appliedFilters.user.trim(),
          unit: appliedFilters.unit,
          adjustment_type: appliedFilters.adjustmentType,
        },
      )

      const total = response.total || 0
      setAdjustments(response.data || [])
      setTotalResults(total)
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)))
    } catch (err) {
      // Sin fallback demo: los errores se muestran con reintento.
      setError(err?.message || t('priceAdjustmentHistory.error.loading'))
    } finally {
      setLoading(false)
    }
  }, [currentPage, appliedFilters, t])

  useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  // Handlers para filtros
  const handleFilterChange = useCallback((field, value) => {
    setDraftFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setDateRangeError('')
    setCurrentPage(1)
  }, [])

  const applyFilters = useCallback(() => {
    // Validación de rango: ISO yyyy-mm-dd compara lexicográficamente.
    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) {
      setDateRangeError(t('priceAdjustmentHistory.filters.dateRangeError'))
      return
    }
    setDateRangeError('')
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
  }, [draftFilters, t])

  const handleSubmitFilters = useCallback((e) => {
    e.preventDefault()
    applyFilters()
  }, [applyFilters])

  const handleRefresh = useCallback(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  // Calcular índices de paginación
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalResults)

  // Función para determinar el tipo de cambio de precio
  const getPriceChangeType = useCallback((adjustment) => {
    const oldPrice = Number(adjustment.old_value || adjustment.old_price || 0)
    const newPrice = Number(adjustment.new_value || adjustment.new_price || 0)

    if (newPrice < oldPrice) return 'decrease'
    if (newPrice > oldPrice) return 'increase'
    return 'correction'
  }, [])

  // Tipo declarado en metadata (MARKET_UPDATE, etc.) con fallback a la
  // dirección del cambio. El SELECT trae 'price' literal, que no dice nada.
  const getTypeLabel = useCallback((adjustment, changeType) => {
    const metaType = adjustment.metadata?.adjustment_type
    if (metaType && ADJUSTMENT_TYPE_OPTIONS.includes(metaType)) {
      return t(`priceAdjustmentHistory.adjustmentType.${metaType}`)
    }
    return t(`priceAdjustmentHistory.type.${changeType}`)
  }, [t])

  // Función para formatear fecha
  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-lg">
          <GenericSkeletonList count={6} />
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-lg">
          <ErrorState
            title={t('priceAdjustmentHistory.error.title')}
            message={error}
            onRetry={handleRefresh}
          />
        </div>
      )
    }

    return (
      <>
        {/* Contador de resultados + actualizar */}
        <div className="px-lg py-md border-b border-divider flex justify-between items-center bg-surface-muted">
          <p className="text-body-md text-on-surface-deep">
            {totalResults === 0 ? (
              t('priceAdjustmentHistory.results.results')
            ) : (
              <>
                {t('priceAdjustmentHistory.results.showing')}{' '}
                <span className="text-data-mono font-data-mono text-foreground">{startIndex}</span>{' '}
                {t('priceAdjustmentHistory.results.to')}{' '}
                <span className="text-data-mono font-data-mono text-foreground">{endIndex}</span>{' '}
                {t('priceAdjustmentHistory.results.of')}{' '}
                <span className="text-data-mono font-data-mono text-foreground">{totalResults}</span>{' '}
                {t('priceAdjustmentHistory.results.results')}
              </>
            )}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label={t('priceAdjustmentHistory.actions.refresh', 'Actualizar')}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {adjustments.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('priceAdjustmentHistory.empty.title')}
            description={t('priceAdjustmentHistory.empty.description')}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentHistory.table.adjustmentId')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentHistory.table.product')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                    {t('priceAdjustmentHistory.table.oldPrice')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                    {t('priceAdjustmentHistory.table.newPrice')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentHistory.table.user')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentHistory.table.dateTime')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">
                    {t('priceAdjustmentHistory.table.unit')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                    {t('priceAdjustmentHistory.table.type')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => {
                  const changeType = getPriceChangeType(adjustment)
                  const adjustmentId = adjustment.adjustment_id || adjustment.id || '—'

                  return (
                    <TableRow
                      key={adjustment.id || adjustment.adjustment_id}
                      className="hover:bg-surface-muted transition-colors duration-150"
                    >
                      <TableCell className="text-data-mono font-data-mono text-foreground">
                        {adjustmentId}
                      </TableCell>
                      <TableCell className="text-body-md text-foreground">
                        {adjustment.product_name || adjustment.product?.name || '—'}
                        {adjustment.variant_name && (
                          <Badge variant="secondary" className="ml-sm align-middle">
                            {adjustment.variant_name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right text-on-surface-deep">
                        {formatPYG(adjustment.old_value || adjustment.old_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-xs">
                          <span className="text-data-mono font-data-mono text-foreground">
                            {formatPYG(adjustment.new_value || adjustment.new_price)}
                          </span>
                          {changeType === 'decrease' && (
                            <ArrowDown className="w-4 h-4 text-error" aria-hidden="true" />
                          )}
                          {changeType === 'increase' && (
                            <ArrowUp className="w-4 h-4 text-success" aria-hidden="true" />
                          )}
                          {changeType === 'correction' && (
                            <ArrowLeftRight className="w-4 h-4 text-on-surface-deep" aria-hidden="true" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-body-md text-foreground">
                        {adjustment.user_name || adjustment.user_id || '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-on-surface-deep">
                        {formatDateTime(adjustment.adjustment_date || adjustment.created_at)}
                      </TableCell>
                      <TableCell className="text-body-md text-on-surface-deep italic">
                        {adjustment.unit || adjustment.unit_of_measure || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            changeType === 'increase'
                              ? 'success'
                              : changeType === 'decrease'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {getTypeLabel(adjustment, changeType)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Paginación server-side real */}
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalResults}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-lg animate-in fade-in">
      {/* Filtros (draft vs applied) */}
      <form
        autoComplete="off"
        onSubmit={handleSubmitFilters}
        className="bg-surface rounded-md shadow-whisper border-0 p-lg"
      >
        <div className="flex items-center gap-sm mb-md">
          <Filter className="w-4 h-4 text-primary" aria-hidden="true" />
          <h3 className="text-title-md text-foreground">
            {t('priceAdjustmentHistory.filters.title')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="pa-hist-product" className="text-body-md-bold text-foreground">
              {t('priceAdjustmentHistory.filters.product')}
            </Label>
            <Input
              ref={productSearchRef}
              id="pa-hist-product"
              type="text"
              placeholder={t('priceAdjustmentHistory.filters.productPlaceholder')}
              value={draftFilters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="pa-hist-user" className="text-body-md-bold text-foreground">
              {t('priceAdjustmentHistory.filters.user')}
            </Label>
            <Input
              id="pa-hist-user"
              type="text"
              placeholder={t('priceAdjustmentHistory.filters.userPlaceholder')}
              value={draftFilters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="pa-hist-unit" className="text-body-md-bold text-foreground">
              {t('priceAdjustmentHistory.filters.unit')}
            </Label>
            <select
              id="pa-hist-unit"
              value={draftFilters.unit}
              onChange={(e) => handleFilterChange('unit', e.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="">{t('priceAdjustmentHistory.filters.unitPlaceholder')}</option>
              {UNIT_OPTIONS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className="space-y-xs">
            <Label htmlFor="pa-hist-type" className="text-body-md-bold text-foreground">
              {t('priceAdjustmentHistory.filters.adjustmentType')}
            </Label>
            <select
              id="pa-hist-type"
              value={draftFilters.adjustmentType}
              onChange={(e) => handleFilterChange('adjustmentType', e.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="">{t('priceAdjustmentHistory.filters.adjustmentTypePlaceholder')}</option>
              {ADJUSTMENT_TYPE_OPTIONS.map(typeValue => (
                <option key={typeValue} value={typeValue}>
                  {t(`priceAdjustmentHistory.adjustmentType.${typeValue}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Segunda fila: Rango de fechas y acciones */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-md mt-md pt-md border-t border-divider">
          <div className="flex-1 max-w-md space-y-xs">
            <span className="text-body-md-bold text-foreground">
              {t('priceAdjustmentHistory.filters.dateRange')}
            </span>
            <div className="flex items-center gap-sm">
              <Input
                type="date"
                aria-label={t('priceAdjustmentHistory.filters.dateFromPlaceholder')}
                value={draftFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
              <span className="text-on-surface-deep" aria-hidden="true">—</span>
              <Input
                type="date"
                aria-label={t('priceAdjustmentHistory.filters.dateToPlaceholder')}
                value={draftFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            {dateRangeError && (
              <p className="text-body-sm-bold text-error" role="alert">{dateRangeError}</p>
            )}
          </div>

          <div className="flex gap-sm">
            <Button type="button" variant="secondary" onClick={handleClearFilters}>
              {t('priceAdjustmentHistory.filters.clear')}
            </Button>
            <Button type="submit" variant="primary">
              {t('priceAdjustmentHistory.filters.apply')}
            </Button>
          </div>
        </div>
      </form>

      {/* Contenido principal */}
      <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
        {renderContent()}
      </section>
    </div>
  )
}

export default PriceAdjustmentHistory
