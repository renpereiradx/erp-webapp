import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Download, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ArrowLeftRight, Filter, Package } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { priceAdjustmentService } from '@/services/priceAdjustmentService'
import { getGroupedUnitOptions } from '@/constants/units'

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

  const handleExport = useCallback(() => {
    // TODO: Implementar exportación
    console.log('Exportar datos')
  }, [])

  // Paginación
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, totalPages])

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

  // Función para formatear precio
  const formatPrice = useCallback((price) => {
    return `PYG ${Number(price || 0).toLocaleString('es-PY')}`
  }, [])

  const inputClass = "h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
  const filterLabelClass = "text-[10px] font-black uppercase text-slate-400 tracking-wider"

  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-20 flex justify-center flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className='text-sm font-bold text-slate-400 uppercase tracking-widest'>Cargando historial...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-12 text-center bg-white rounded-xl border border-border-subtle shadow-fluent-2">
          <p className="text-error font-black uppercase mb-4">{t('priceAdjustmentHistory.error.title')}</p>
          <p className="text-text-secondary text-sm mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden">
        {/* Contador de resultados */}
        <div className="px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-[#fafafa]">
          <p className="text-[13px] text-gray-500 font-medium">
            {totalResults === 0 ? (
              t('priceAdjustmentHistory.results.results')
            ) : (
              <>
                {t('priceAdjustmentHistory.results.showing')}{' '}
                <span className="font-bold text-text-main">{startIndex}</span>{' '}
                {t('priceAdjustmentHistory.results.to')}{' '}
                <span className="font-bold text-text-main">{endIndex}</span>{' '}
                {t('priceAdjustmentHistory.results.of')}{' '}
                <span className="font-bold text-text-main">{totalResults}</span>{' '}
                {t('priceAdjustmentHistory.results.results')}
              </>
            )}
          </p>
          <div className='flex gap-2'>
            <button
              className="p-2 text-text-secondary hover:bg-slate-100 rounded transition-colors"
              onClick={handleRefresh}
              title='Refrescar'
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="p-2 text-text-secondary hover:bg-slate-100 rounded transition-colors"
              onClick={handleExport}
              title='Descargar CSV'
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {adjustments.length === 0 ? (
            <div className="py-20 text-center text-slate-400 italic">
              {t('priceAdjustmentHistory.empty.title')}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-6">{t('priceAdjustmentHistory.table.adjustmentId')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.product')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.oldPrice')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.newPrice')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.user')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.dateTime')}</th>
                  <th className="py-3 px-4">{t('priceAdjustmentHistory.table.unit')}</th>
                  <th className="py-3 px-6 text-right">{t('priceAdjustmentHistory.table.type')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-text-main">
                {adjustments.map((adjustment) => {
                  const changeType = getPriceChangeType(adjustment)
                  const adjustmentId = adjustment.adjustment_id || adjustment.id || '—'

                  return (
                    <tr key={adjustment.id || adjustment.adjustment_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-primary font-bold">
                        {adjustmentId}
                      </td>
                      <td className="py-4 px-4 font-bold text-text-main">
                        {adjustment.product_name || adjustment.product?.name || '—'}
                        {adjustment.variant_name && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-primary/10 text-primary align-middle">
                            <Package size={10} />
                            {adjustment.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {formatPrice(adjustment.old_value || adjustment.old_price)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className='font-black'>{formatPrice(adjustment.new_value || adjustment.new_price)}</span>
                          {changeType === 'decrease' && (
                            <ArrowDown className="text-error" size={14} />
                          )}
                          {changeType === 'increase' && (
                            <ArrowUp className="text-success" size={14} />
                          )}
                          {changeType === 'correction' && (
                            <ArrowLeftRight className="text-info" size={14} />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {adjustment.user_name || adjustment.user_id || '—'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {formatDateTime(adjustment.adjustment_date || adjustment.created_at)}
                      </td>
                      <td className="py-4 px-4 italic text-slate-400">
                        {adjustment.unit || adjustment.unit_of_measure || '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${changeType === 'increase' ? 'bg-[#dff6dd] text-[#107c10]' : changeType === 'decrease' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          {getTypeLabel(adjustment, changeType)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {adjustments.length > 0 && (
          <div className="px-6 py-4 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4 bg-[#fafafa]">
            <span className="text-[13px] text-gray-500 font-medium">
              {t('priceAdjustmentHistory.pagination.page')}{' '}
              <span className="font-bold text-text-main">{currentPage}</span>{' '}
              {t('priceAdjustmentHistory.pagination.of')}{' '}
              <span className="font-bold text-text-main">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border border-border-subtle rounded-lg text-xs font-bold uppercase text-text-secondary hover:bg-white hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
                <span>{t('priceAdjustmentHistory.pagination.previous')}</span>
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-border-subtle rounded-lg text-xs font-bold uppercase text-text-secondary hover:bg-white hover:text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
              >
                <span>{t('priceAdjustmentHistory.pagination.next')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Filtros */}
      <form className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle" onSubmit={handleSubmitFilters}>
        <div className="flex items-center gap-2 mb-6">
          <Filter size={18} className='text-primary' />
          <h3 className="text-sm font-black uppercase text-text-main tracking-widest">
            {t('priceAdjustmentHistory.filters.title')}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className='flex flex-col gap-1.5'>
            <label htmlFor="pa-hist-product" className={filterLabelClass}>
              {t('priceAdjustmentHistory.filters.product')}
            </label>
            <input
              id="pa-hist-product"
              type="text"
              placeholder={t('priceAdjustmentHistory.filters.productPlaceholder')}
              value={draftFilters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label htmlFor="pa-hist-user" className={filterLabelClass}>
              {t('priceAdjustmentHistory.filters.user')}
            </label>
            <input
              id="pa-hist-user"
              type="text"
              placeholder={t('priceAdjustmentHistory.filters.userPlaceholder')}
              value={draftFilters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label htmlFor="pa-hist-unit" className={filterLabelClass}>
              {t('priceAdjustmentHistory.filters.unit')}
            </label>
            <select
              id="pa-hist-unit"
              value={draftFilters.unit}
              onChange={(e) => handleFilterChange('unit', e.target.value)}
              className={inputClass}
            >
              <option value="">{t('priceAdjustmentHistory.filters.unitPlaceholder')}</option>
              {UNIT_OPTIONS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label htmlFor="pa-hist-type" className={filterLabelClass}>
              {t('priceAdjustmentHistory.filters.adjustmentType')}
            </label>
            <select
              id="pa-hist-type"
              value={draftFilters.adjustmentType}
              onChange={(e) => handleFilterChange('adjustmentType', e.target.value)}
              className={inputClass}
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
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mt-6 pt-6 border-t border-slate-50">
          <div className="flex-1 max-w-md flex flex-col gap-1.5">
            <span className={filterLabelClass}>
              {t('priceAdjustmentHistory.filters.dateRange')}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label={t('priceAdjustmentHistory.filters.dateFromPlaceholder')}
                value={draftFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={inputClass}
              />
              <span className="text-slate-300">—</span>
              <input
                type="date"
                aria-label={t('priceAdjustmentHistory.filters.dateToPlaceholder')}
                value={draftFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={inputClass}
              />
            </div>
            {dateRangeError && (
              <p className="text-error text-[10px] font-bold uppercase" role="alert">{dateRangeError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-2.5 border border-border-subtle text-text-main text-xs font-bold uppercase rounded hover:bg-slate-50 transition-all"
            >
              {t('priceAdjustmentHistory.filters.clear')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all"
            >
              {t('priceAdjustmentHistory.filters.apply')}
            </button>
          </div>
        </div>
      </form>

      {/* Contenido principal */}
      {renderContent()}
    </div>
  )
}

export default PriceAdjustmentHistory
