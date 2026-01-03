// ===========================================================================
// Exchange Rates Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// Spec: specs/fluent2/payment_dashboard_summary/exchange_rates_(table_with_filters)
// ===========================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Download,
  Calendar,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertCircle,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useExchangeRateStore from '@/store/useExchangeRateStore'
import DataState from '@/components/ui/DataState'
import '@/styles/scss/pages/_exchange-rates.scss'

// Currency Pair Cell Component
const CurrencyPairCell = ({ rate, baseCurrency = 'PYG' }) => {
  const currencyCode = rate.currency_code || 'XXX'
  const currencyName = rate.currency_name || rate.name || 'Unknown Currency'

  // Get flag emoji from currency or fallback
  const getFlag = code => {
    const flagMap = {
      PYG: '🇵🇾',
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      CAD: '🇨🇦',
      AUD: '🇦🇺',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      MXN: '🇲🇽',
      BRL: '🇧🇷',
      PEN: '🇵🇪',
      COP: '🇨🇴',
      ARS: '🇦🇷',
      CLP: '🇨🇱',
      UYU: '🇺🇾',
      BOB: '🇧🇴',
    }
    return flagMap[code] || '🏳️'
  }

  return (
    <div className='currency-pair'>
      <div className='currency-pair__flags'>
        <div className='currency-pair__flag'>{getFlag(currencyCode)}</div>
        <div className='currency-pair__flag'>{getFlag(baseCurrency)}</div>
      </div>
      <div className='currency-pair__info'>
        <span className='currency-pair__code'>
          {currencyCode} / {baseCurrency}
        </span>
        <span className='currency-pair__name'>{currencyName}</span>
      </div>
    </div>
  )
}

// Source Badge Component
const SourceBadge = ({ source }) => {
  const { t } = useI18n()
  const sourceKey = source?.toLowerCase().replace(/\s+/g, '-') || 'manual'

  const sourceLabels = {
    manual: t('exchangeRates.source.manual', 'Manual'),
    'central-bank': t('exchangeRates.source.centralBank', 'Banco Central'),
    'forex-api': t('exchangeRates.source.forexApi', 'Forex API'),
    system: t('exchangeRates.source.system', 'Sistema'),
  }

  return (
    <span className={`source-badge source-badge--${sourceKey}`}>
      {sourceLabels[sourceKey] || source || 'Manual'}
    </span>
  )
}

// Status Indicator Component
const StatusIndicator = ({ active = true }) => {
  const { t } = useI18n()
  const title = active
    ? t('exchangeRates.status.active', 'Activo')
    : t('exchangeRates.status.inactive', 'Inactivo')

  return (
    <div
      className={`status-indicator status-indicator--${
        active ? 'active' : 'inactive'
      }`}
      title={title}
    />
  )
}

// Exchange Rate Form Modal
const ExchangeRateFormModal = ({
  isOpen,
  onClose,
  rate,
  currencies,
  onSave,
}) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    currency_id: '',
    rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    source: 'manual',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (rate) {
      setFormData({
        currency_id: rate.currency_id || '',
        rate: rate.rate_to_base || rate.rate || '',
        effective_date:
          rate.effective_date?.split('T')[0] ||
          rate.date ||
          new Date().toISOString().split('T')[0],
        source: rate.source || 'manual',
      })
    } else {
      setFormData({
        currency_id: '',
        rate: '',
        effective_date: new Date().toISOString().split('T')[0],
        source: 'manual',
      })
    }
    setErrors({})
  }, [rate, isOpen])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.currency_id) {
      newErrors.currency_id = t(
        'exchangeRates.validation.currency_required',
        'La moneda es requerida'
      )
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      newErrors.rate = t(
        'exchangeRates.validation.rate_positive',
        'La tasa debe ser mayor a 0'
      )
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      await onSave({
        ...formData,
        rate: parseFloat(formData.rate),
      })
      onClose()
    } catch (error) {
      setErrors({
        submit:
          error.message || t('exchangeRates.error.save', 'Error al guardar'),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal exchange-rate-modal'
        onClick={e => e.stopPropagation()}
      >
        <div className='modal__header'>
          <h2 className='modal__title'>
            {rate
              ? t('exchangeRates.modal.edit_title', 'Editar Tasa de Cambio')
              : t('exchangeRates.modal.create_title', 'Nueva Tasa de Cambio')}
          </h2>
          <button
            type='button'
            className='modal__close'
            onClick={onClose}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='modal__body'>
          <div className='form-grid'>
            <div className='form-group'>
              <label className='form-label' htmlFor='currency_id'>
                {t('exchangeRates.field.currency', 'Moneda')}
              </label>
              <select
                id='currency_id'
                className={`form-input ${
                  errors.currency_id ? 'form-input--error' : ''
                }`}
                value={formData.currency_id}
                onChange={e => handleChange('currency_id', e.target.value)}
                disabled={!!rate}
              >
                <option value=''>
                  {t('exchangeRates.filter.fromCurrency', 'Seleccionar moneda')}
                </option>
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.currency_code} -{' '}
                    {currency.currency_name || currency.name}
                  </option>
                ))}
              </select>
              {errors.currency_id && (
                <span className='form-error'>{errors.currency_id}</span>
              )}
            </div>

            <div className='form-group'>
              <label className='form-label' htmlFor='rate'>
                {t('exchangeRates.field.rate', 'Tasa')}
              </label>
              <input
                id='rate'
                type='number'
                className={`form-input ${
                  errors.rate ? 'form-input--error' : ''
                }`}
                value={formData.rate}
                onChange={e => handleChange('rate', e.target.value)}
                step='0.000001'
                min='0'
                placeholder='0.0000'
              />
              {errors.rate && <span className='form-error'>{errors.rate}</span>}
            </div>

            <div className='form-group'>
              <label className='form-label' htmlFor='effective_date'>
                {t('exchangeRates.field.effectiveDate', 'Fecha Efectiva')}
              </label>
              <input
                id='effective_date'
                type='date'
                className='form-input'
                value={formData.effective_date}
                onChange={e => handleChange('effective_date', e.target.value)}
              />
            </div>

            <div className='form-group'>
              <label className='form-label' htmlFor='source'>
                {t('exchangeRates.field.source', 'Fuente')}
              </label>
              <select
                id='source'
                className='form-input'
                value={formData.source}
                onChange={e => handleChange('source', e.target.value)}
              >
                <option value='manual'>
                  {t('exchangeRates.source.manual', 'Manual')}
                </option>
                <option value='central-bank'>
                  {t('exchangeRates.source.centralBank', 'Banco Central')}
                </option>
                <option value='forex-api'>
                  {t('exchangeRates.source.forexApi', 'Forex API')}
                </option>
                <option value='system'>
                  {t('exchangeRates.source.system', 'Sistema')}
                </option>
              </select>
            </div>
          </div>

          {errors.submit && (
            <div className='alert alert--error'>
              <AlertCircle size={18} />
              <p>{errors.submit}</p>
            </div>
          )}

          <div className='modal__footer'>
            <button type='button' className='btn-export' onClick={onClose}>
              {t('action.cancel', 'Cancelar')}
            </button>
            <button type='submit' className='btn-primary' disabled={saving}>
              {saving
                ? t('action.saving', 'Guardando...')
                : t('action.save', 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useI18n()
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal modal--small' onClick={e => e.stopPropagation()}>
        <div className='modal__header'>
          <h2 className='modal__title'>
            {t('exchangeRates.modal.delete_title', 'Eliminar Tasa de Cambio')}
          </h2>
          <button type='button' className='modal__close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className='modal__body'>
          <p>
            {t(
              'exchangeRates.modal.delete_confirm',
              '¿Estás seguro de que deseas eliminar esta tasa de cambio? Esta acción no se puede deshacer.'
            )}
          </p>
        </div>
        <div className='modal__footer'>
          <button type='button' className='btn-export' onClick={onClose}>
            {t('action.cancel', 'Cancelar')}
          </button>
          <button
            type='button'
            className='btn-primary btn-primary--danger'
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting
              ? t('action.deleting', 'Eliminando...')
              : t('action.delete', 'Eliminar')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Action Menu Component
const ActionMenu = ({ rate, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className='action-menu' style={{ position: 'relative' }}>
      <button
        className='action-menu-btn'
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('action.more', 'Más opciones')}
      >
        <MoreVertical size={20} />
      </button>
      {isOpen && (
        <>
          <div
            className='action-menu__overlay'
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10,
            }}
          />
          <div
            className='action-menu__dropdown'
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              zIndex: 20,
              minWidth: '120px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            <button
              className='action-menu__item'
              onClick={() => {
                onEdit(rate)
                setIsOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
              }}
            >
              {t('exchangeRates.action.edit', 'Editar')}
            </button>
            <button
              className='action-menu__item action-menu__item--danger'
              onClick={() => {
                onDelete(rate)
                setIsOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                color: '#dc2626',
              }}
            >
              {t('exchangeRates.action.delete', 'Eliminar')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Main Exchange Rates Page Component
const ExchangeRates = () => {
  const { t } = useI18n()

  // Store
  const {
    exchangeRates,
    currencies,
    loading,
    error,
    filters,
    pagination,
    fetchExchangeRates,
    fetchCurrencies,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    setFilter,
    setViewMode,
    setPage,
  } = useExchangeRateStore()

  // Local State
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedRate, setSelectedRate] = useState(null)

  // Load data on mount
  useEffect(() => {
    fetchCurrencies()
    fetchExchangeRates()
  }, [fetchCurrencies, fetchExchangeRates])

  // Refetch when filters change
  useEffect(() => {
    fetchExchangeRates()
  }, [
    filters.viewMode,
    filters.currencyCode,
    filters.dateFrom,
    filters.dateTo,
    fetchExchangeRates,
  ])

  // Handlers
  const handleSearch = useCallback(
    e => {
      setFilter('searchTerm', e.target.value)
    },
    [setFilter]
  )

  const handleViewModeChange = useCallback(
    mode => {
      setViewMode(mode)
    },
    [setViewMode]
  )

  const handleCreateClick = () => {
    setSelectedRate(null)
    setShowFormModal(true)
  }

  const handleEditClick = rate => {
    setSelectedRate(rate)
    setShowFormModal(true)
  }

  const handleDeleteClick = rate => {
    setSelectedRate(rate)
    setShowDeleteModal(true)
  }

  const handleSave = async data => {
    if (selectedRate) {
      await updateExchangeRate(selectedRate.id, data)
    } else {
      await createExchangeRate(data)
    }
  }

  const handleDelete = async () => {
    if (selectedRate) {
      await deleteExchangeRate(selectedRate.id)
    }
  }

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Export to CSV')
  }

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format rate number
  const formatRate = rate => {
    if (rate === null || rate === undefined) return '-'
    return parseFloat(rate).toFixed(4)
  }

  // Pagination calculations
  const totalItems = exchangeRates.length
  const startItem =
    totalItems > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const endItem = Math.min(pagination.page * pagination.pageSize, totalItems)

  // Get paginated rates
  const paginatedRates = exchangeRates.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  )

  // Filter rates by search term (local filtering)
  const filteredRates = filters.searchTerm
    ? paginatedRates.filter(
        rate =>
          rate.currency_code
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          rate.currency_name
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase())
      )
    : paginatedRates

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pagination.pageSize)

  // Loading state
  if (loading && exchangeRates.length === 0) {
    return (
      <div className='exchange-rates-page'>
        <DataState
          variant='loading'
          skeletonVariant='list'
          skeletonProps={{ count: 5 }}
        />
      </div>
    )
  }

  // Error state
  if (error && exchangeRates.length === 0) {
    return (
      <div className='exchange-rates-page'>
        <DataState
          variant='error'
          title={t('exchangeRates.error.title', 'Error')}
          message={error}
          actionLabel={t('action.retry', 'Reintentar')}
          onRetry={fetchExchangeRates}
        />
      </div>
    )
  }

  return (
    <div className='exchange-rates-page'>
      {/* Header */}
      <header className='exchange-rates-page__header'>
        <div className='exchange-rates-page__header-content'>
          <h1 className='exchange-rates-page__title'>
            {t('exchangeRates.title', 'Tipos de Cambio')}
          </h1>
          <p className='exchange-rates-page__subtitle'>
            {t(
              'exchangeRates.subtitle',
              'Visualice y administre las tasas de cambio diarias y pares de divisas.'
            )}
          </p>
        </div>
        <div className='exchange-rates-page__header-actions'>
          <button className='btn-export' onClick={handleExport}>
            <Download size={20} />
            {t('exchangeRates.action.export', 'Exportar CSV')}
          </button>
          <button className='btn-primary' onClick={handleCreateClick}>
            <Plus size={20} />
            {t('exchangeRates.action.create', 'Nueva Tasa')}
          </button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className='exchange-rates-page__toolbar'>
        <div className='exchange-rates-page__filters'>
          {/* Search Input */}
          <div className='exchange-rates-page__search'>
            <Search className='exchange-rates-page__search-icon' size={20} />
            <input
              type='text'
              className='exchange-rates-page__search-input'
              placeholder={t(
                'exchangeRates.search.placeholder',
                'Buscar moneda (ej. USD, EUR)'
              )}
              value={filters.searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Date Range Input */}
          <div className='exchange-rates-page__date-range'>
            <input
              type='date'
              className='exchange-rates-page__date-input'
              value={filters.dateFrom}
              onChange={e => setFilter('dateFrom', e.target.value)}
              placeholder={t('exchangeRates.filter.from', 'Desde')}
            />
            <Calendar className='exchange-rates-page__date-icon' size={20} />
          </div>

          {/* Currency Selects */}
          <div className='exchange-rates-page__currency-filters'>
            <div className='exchange-rates-page__select-wrapper'>
              <select
                className='exchange-rates-page__select'
                value={filters.currencyCode}
                onChange={e => setFilter('currencyCode', e.target.value)}
              >
                <option value=''>
                  {t('exchangeRates.filter.fromCurrency', 'Moneda origen')}
                </option>
                {currencies.map(currency => (
                  <option key={currency.id} value={currency.currency_code}>
                    {currency.currency_code}
                  </option>
                ))}
              </select>
              <ChevronDown
                className='exchange-rates-page__select-icon'
                size={20}
              />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className='exchange-rates-page__view-toggle'>
          <button
            className={`exchange-rates-page__toggle-btn ${
              filters.viewMode === 'latest'
                ? 'exchange-rates-page__toggle-btn--active'
                : ''
            }`}
            onClick={() => handleViewModeChange('latest')}
          >
            {t('exchangeRates.view.latest', 'Recientes')}
          </button>
          <button
            className={`exchange-rates-page__toggle-btn ${
              filters.viewMode === 'historical'
                ? 'exchange-rates-page__toggle-btn--active'
                : ''
            }`}
            onClick={() => handleViewModeChange('historical')}
          >
            {t('exchangeRates.view.historical', 'Histórico')}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className='exchange-rates-page__table-container'>
        <div className='exchange-rates-page__table-scroll'>
          <table className='exchange-rates-table'>
            <thead className='exchange-rates-table__head'>
              <tr className='exchange-rates-table__header-row'>
                <th className='exchange-rates-table__th'>
                  {t('exchangeRates.table.currencyPair', 'Par de Moneda')}
                </th>
                <th className='exchange-rates-table__th exchange-rates-table__th--right'>
                  {t('exchangeRates.table.rate', 'Tasa')}
                </th>
                <th className='exchange-rates-table__th'>
                  {t('exchangeRates.table.source', 'Fuente')}
                </th>
                <th className='exchange-rates-table__th'>
                  {t('exchangeRates.table.createdAt', 'Fecha de Creación')}
                </th>
                <th className='exchange-rates-table__th exchange-rates-table__th--center'>
                  {t('exchangeRates.table.status', 'Estado')}
                </th>
                <th className='exchange-rates-table__th exchange-rates-table__th--right'>
                  {t('exchangeRates.table.actions', 'Acciones')}
                </th>
              </tr>
            </thead>
            <tbody className='exchange-rates-table__body'>
              {filteredRates.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '48px' }}
                  >
                    <DataState
                      variant='empty'
                      title={t(
                        'exchangeRates.empty.title',
                        'Sin tipos de cambio'
                      )}
                      message={
                        filters.searchTerm
                          ? t(
                              'exchangeRates.empty.search',
                              'No se encontraron tipos de cambio con ese criterio'
                            )
                          : t(
                              'exchangeRates.empty.message',
                              'No hay tipos de cambio registrados'
                            )
                      }
                      actionLabel={t(
                        'exchangeRates.action.create',
                        'Nueva Tasa'
                      )}
                      onAction={handleCreateClick}
                    />
                  </td>
                </tr>
              ) : (
                filteredRates.map(rate => (
                  <tr key={rate.id} className='exchange-rates-table__row'>
                    <td className='exchange-rates-table__td'>
                      <CurrencyPairCell rate={rate} />
                    </td>
                    <td className='exchange-rates-table__td exchange-rates-table__td--right exchange-rates-table__td--mono'>
                      {formatRate(rate.rate_to_base || rate.rate)}
                    </td>
                    <td className='exchange-rates-table__td'>
                      <SourceBadge source={rate.source} />
                    </td>
                    <td className='exchange-rates-table__td exchange-rates-table__td--muted'>
                      {formatDate(rate.created_at || rate.effective_date)}
                    </td>
                    <td className='exchange-rates-table__td exchange-rates-table__td--center'>
                      <StatusIndicator active={rate.is_active !== false} />
                    </td>
                    <td className='exchange-rates-table__td exchange-rates-table__td--right'>
                      <ActionMenu
                        rate={rate}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredRates.length > 0 && (
          <div className='exchange-rates-pagination'>
            <div className='exchange-rates-pagination__info'>
              <span>
                {t('exchangeRates.pagination.rowsPerPage', 'Filas por página:')}
              </span>
              <select
                className='exchange-rates-pagination__select'
                value={pagination.pageSize}
                onChange={e => {
                  // Update page size in store if needed
                  console.log('Page size:', e.target.value)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className='exchange-rates-pagination__count'>
                {startItem}-{endItem} de {totalItems}
              </span>
            </div>
            <div className='exchange-rates-pagination__controls'>
              <button
                className='exchange-rates-pagination__btn'
                onClick={() => setPage(1)}
                disabled={pagination.page === 1}
                aria-label='Primera página'
              >
                <ChevronsLeft size={20} />
              </button>
              <button
                className='exchange-rates-pagination__btn'
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                aria-label='Página anterior'
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className='exchange-rates-pagination__btn'
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                aria-label='Página siguiente'
              >
                <ChevronRight size={20} />
              </button>
              <button
                className='exchange-rates-pagination__btn'
                onClick={() => setPage(totalPages)}
                disabled={pagination.page >= totalPages}
                aria-label='Última página'
              >
                <ChevronsRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ExchangeRateFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        rate={selectedRate}
        currencies={currencies}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        rate={selectedRate}
      />
    </div>
  )
}

export default ExchangeRates
