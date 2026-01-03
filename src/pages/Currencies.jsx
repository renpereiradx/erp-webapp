// ===========================================================================
// Currencies Page - MVP Implementation
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// ===========================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useCurrencyStore from '@/store/useCurrencyStore'
import DataState from '@/components/ui/DataState'
import '@/styles/scss/pages/_currencies.scss'

// Currency Flag Component
const CurrencyFlag = ({ emoji, code }) => (
  <div className='currency-flag' title={code}>
    <span className='currency-flag__emoji'>{emoji || '🏳️'}</span>
  </div>
)

// Status Badge Component
const StatusBadge = ({ enabled }) => {
  const { t } = useI18n()
  return (
    <span
      className={`status-badge status-badge--${
        enabled ? 'enabled' : 'disabled'
      }`}
    >
      <span className='status-badge__dot' />
      {enabled
        ? t('currencies.status.enabled', 'Habilitada')
        : t('currencies.status.disabled', 'Deshabilitada')}
    </span>
  )
}

// Currency Form Modal
const CurrencyFormModal = ({ isOpen, onClose, currency, onSave }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    decimal_places: 2,
    is_enabled: true,
    flag_emoji: '🏳️',
    exchange_rate: 1,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currency) {
      setFormData({
        currency_code: currency.currency_code || '',
        currency_name: currency.currency_name || currency.name || '',
        symbol: currency.symbol || '',
        decimal_places: currency.decimal_places ?? 2,
        is_enabled: currency.is_enabled !== false,
        flag_emoji: currency.flag_emoji || '🏳️',
        exchange_rate: currency.exchange_rate || 1,
      })
    } else {
      setFormData({
        currency_code: '',
        currency_name: '',
        symbol: '',
        decimal_places: 2,
        is_enabled: true,
        flag_emoji: '🏳️',
        exchange_rate: 1,
      })
    }
    setErrors({})
  }, [currency, isOpen])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.currency_code.trim()) {
      newErrors.currency_code = t(
        'currencies.validation.code_required',
        'El código ISO es requerido'
      )
    } else if (formData.currency_code.length !== 3) {
      newErrors.currency_code = t(
        'currencies.validation.code_length',
        'El código debe tener 3 caracteres'
      )
    }

    if (!formData.currency_name.trim()) {
      newErrors.currency_name = t(
        'currencies.validation.name_required',
        'El nombre es requerido'
      )
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = t(
        'currencies.validation.symbol_required',
        'El símbolo es requerido'
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
      await onSave(formData)
      onClose()
    } catch (error) {
      setErrors({
        submit: error.message || t('currencies.error.save', 'Error al guardar'),
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
      <div className='modal currency-modal' onClick={e => e.stopPropagation()}>
        <div className='modal__header'>
          <h2 className='modal__title'>
            {currency
              ? t('currencies.modal.edit_title', 'Editar Moneda')
              : t('currencies.modal.create_title', 'Nueva Moneda')}
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
          {/* Summary Card (Edit Mode) */}
          {currency && (
            <div className='currency-modal__summary'>
              <CurrencyFlag
                emoji={formData.flag_emoji}
                code={formData.currency_code}
              />
              <div className='currency-modal__summary-info'>
                <span className='currency-modal__summary-code'>
                  {formData.currency_code}
                </span>
                <span className='currency-modal__summary-name'>
                  {formData.currency_name}
                </span>
              </div>
              <StatusBadge enabled={formData.is_enabled} />
            </div>
          )}

          {/* Form Fields */}
          <div className='form-grid'>
            <div className='form-group'>
              <label className='form-label' htmlFor='currency_code'>
                {t('currencies.field.code', 'Código ISO')}
              </label>
              <input
                id='currency_code'
                type='text'
                className={`form-input ${
                  errors.currency_code ? 'form-input--error' : ''
                }`}
                value={formData.currency_code}
                onChange={e =>
                  handleChange('currency_code', e.target.value.toUpperCase())
                }
                maxLength={3}
                placeholder='USD'
                disabled={currency?.is_base_currency}
              />
              {errors.currency_code && (
                <span className='form-error'>{errors.currency_code}</span>
              )}
            </div>

            <div className='form-group'>
              <label className='form-label' htmlFor='currency_name'>
                {t('currencies.field.name', 'Nombre')}
              </label>
              <input
                id='currency_name'
                type='text'
                className={`form-input ${
                  errors.currency_name ? 'form-input--error' : ''
                }`}
                value={formData.currency_name}
                onChange={e => handleChange('currency_name', e.target.value)}
                placeholder={t(
                  'currencies.placeholder.name',
                  'Dólar Estadounidense'
                )}
              />
              {errors.currency_name && (
                <span className='form-error'>{errors.currency_name}</span>
              )}
            </div>

            <div className='form-group form-group--half'>
              <label className='form-label' htmlFor='symbol'>
                {t('currencies.field.symbol', 'Símbolo')}
              </label>
              <input
                id='symbol'
                type='text'
                className={`form-input ${
                  errors.symbol ? 'form-input--error' : ''
                }`}
                value={formData.symbol}
                onChange={e => handleChange('symbol', e.target.value)}
                maxLength={5}
                placeholder='$'
              />
              {errors.symbol && (
                <span className='form-error'>{errors.symbol}</span>
              )}
            </div>

            <div className='form-group form-group--half'>
              <label className='form-label' htmlFor='decimal_places'>
                {t('currencies.field.decimals', 'Decimales')}
              </label>
              <input
                id='decimal_places'
                type='number'
                className='form-input'
                value={formData.decimal_places}
                onChange={e =>
                  handleChange(
                    'decimal_places',
                    parseInt(e.target.value, 10) || 0
                  )
                }
                min={0}
                max={8}
              />
            </div>

            <div className='form-group form-group--half'>
              <label className='form-label' htmlFor='flag_emoji'>
                {t('currencies.field.flag', 'Bandera (emoji)')}
              </label>
              <input
                id='flag_emoji'
                type='text'
                className='form-input'
                value={formData.flag_emoji}
                onChange={e => handleChange('flag_emoji', e.target.value)}
                placeholder='🇺🇸'
              />
            </div>

            <div className='form-group form-group--half'>
              <label className='form-label' htmlFor='exchange_rate'>
                {t('currencies.field.exchange_rate', 'Tasa de Cambio')}
              </label>
              <input
                id='exchange_rate'
                type='number'
                className='form-input'
                value={formData.exchange_rate}
                onChange={e =>
                  handleChange('exchange_rate', parseFloat(e.target.value) || 0)
                }
                step='0.0001'
                min={0}
                disabled={currency?.is_base_currency}
              />
              <span className='form-hint'>
                {t(
                  'currencies.hint.exchange_rate',
                  'Equivalente en moneda base'
                )}
              </span>
            </div>

            <div className='form-group form-group--full'>
              <label className='form-checkbox'>
                <input
                  type='checkbox'
                  checked={formData.is_enabled}
                  onChange={e => handleChange('is_enabled', e.target.checked)}
                  disabled={currency?.is_base_currency}
                />
                <span className='form-checkbox__label'>
                  {t(
                    'currencies.field.enabled',
                    'Moneda habilitada para transacciones'
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Warning for base currency */}
          {currency?.is_base_currency && (
            <div className='alert alert--info'>
              <AlertCircle size={18} />
              <p>
                {t(
                  'currencies.warning.base_currency',
                  'Esta es la moneda base del sistema. Algunos campos no pueden modificarse.'
                )}
              </p>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className='alert alert--error'>
              <AlertCircle size={18} />
              <p>{errors.submit}</p>
            </div>
          )}
        </form>

        <div className='modal__footer'>
          <button
            type='button'
            className='btn btn--secondary'
            onClick={onClose}
            disabled={saving}
          >
            {t('action.cancel', 'Cancelar')}
          </button>
          <button
            type='submit'
            className='btn btn--primary'
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving
              ? t('action.saving', 'Guardando...')
              : t('action.save', 'Guardar Cambios')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, currencyName }) => {
  const { t } = useI18n()

  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal modal--sm' onClick={e => e.stopPropagation()}>
        <div className='modal__header'>
          <h2 className='modal__title'>
            {t('currencies.modal.delete_title', 'Eliminar Moneda')}
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

        <div className='modal__body'>
          <p>
            {t(
              'currencies.modal.delete_confirm',
              '¿Estás seguro de que deseas eliminar la moneda "{name}"? Esta acción no se puede deshacer.'
            ).replace('{name}', currencyName)}
          </p>
        </div>

        <div className='modal__footer'>
          <button
            type='button'
            className='btn btn--secondary'
            onClick={onClose}
          >
            {t('action.cancel', 'Cancelar')}
          </button>
          <button type='button' className='btn btn--danger' onClick={onConfirm}>
            {t('action.delete', 'Eliminar')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Currency Detail Side Panel (Sheet)
const CurrencyDetailPanel = ({ currency, isOpen, onClose, onSave }) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    decimal_places: 2,
    is_enabled: true,
    flag_emoji: '🏳️',
    exchange_rate: 1,
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (currency) {
      setFormData({
        currency_code: currency.currency_code || '',
        currency_name: currency.currency_name || currency.name || '',
        symbol: currency.symbol || '',
        decimal_places: currency.decimal_places ?? 2,
        is_enabled: currency.is_enabled !== false,
        flag_emoji: currency.flag_emoji || '🏳️',
        exchange_rate: currency.exchange_rate || 1,
      })
      setHasChanges(false)
    }
  }, [currency])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
      setHasChanges(false)
    } catch (error) {
      // Error handled in parent
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !currency) return null

  const lastUpdate = currency.updated_at
    ? new Date(currency.updated_at).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('currencies.detail.no_update', 'Sin actualización')

  return (
    <div className='currency-detail-panel'>
      {/* Panel Header */}
      <div className='currency-detail-panel__header'>
        <h3 className='currency-detail-panel__title'>
          {t('currencies.detail.title', 'Detalles de Moneda')}
        </h3>
        <button
          type='button'
          className='currency-detail-panel__close'
          onClick={onClose}
          aria-label={t('action.close', 'Cerrar')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Panel Content */}
      <div className='currency-detail-panel__content'>
        {/* Summary Card */}
        <div className='currency-detail-panel__summary'>
          <div className='currency-detail-panel__summary-flag'>
            {currency.flag_emoji || '🏳️'}
          </div>
          <div className='currency-detail-panel__summary-info'>
            <h4 className='currency-detail-panel__summary-code'>
              {currency.currency_code}
            </h4>
            <p className='currency-detail-panel__summary-name'>
              {currency.currency_name || currency.name}
            </p>
          </div>
          <span
            className={`currency-detail-panel__summary-status currency-detail-panel__summary-status--${
              currency.is_enabled !== false ? 'active' : 'inactive'
            }`}
          >
            {currency.is_enabled !== false
              ? t('currencies.status.active', 'Activa')
              : t('currencies.status.inactive', 'Inactiva')}
          </span>
        </div>

        {/* Edit Form */}
        <form className='currency-detail-panel__form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label' htmlFor='detail_currency_code'>
              {t('currencies.field.code', 'Código ISO')}
            </label>
            <input
              id='detail_currency_code'
              type='text'
              className='form-input'
              value={formData.currency_code}
              onChange={e =>
                handleChange('currency_code', e.target.value.toUpperCase())
              }
              maxLength={3}
              disabled={currency.is_base_currency}
            />
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='detail_currency_name'>
              {t('currencies.field.name', 'Nombre')}
            </label>
            <input
              id='detail_currency_name'
              type='text'
              className='form-input'
              value={formData.currency_name}
              onChange={e => handleChange('currency_name', e.target.value)}
            />
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label className='form-label' htmlFor='detail_symbol'>
                {t('currencies.field.symbol', 'Símbolo')}
              </label>
              <input
                id='detail_symbol'
                type='text'
                className='form-input'
                value={formData.symbol}
                onChange={e => handleChange('symbol', e.target.value)}
                maxLength={5}
              />
            </div>

            <div className='form-group'>
              <label className='form-label' htmlFor='detail_decimal_places'>
                {t('currencies.field.decimals', 'Decimales')}
              </label>
              <input
                id='detail_decimal_places'
                type='number'
                className='form-input'
                value={formData.decimal_places}
                onChange={e =>
                  handleChange('decimal_places', parseInt(e.target.value) || 0)
                }
                min={0}
                max={8}
              />
            </div>
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='detail_exchange_rate'>
              {t('currencies.field.exchange_rate', 'Tasa de Cambio (Base PYG)')}
            </label>
            <div className='form-input-wrapper'>
              <span className='form-input-prefix'>
                {currency.symbol || '$'}
              </span>
              <input
                id='detail_exchange_rate'
                type='text'
                className='form-input form-input--with-prefix'
                value={formData.exchange_rate}
                onChange={e =>
                  handleChange('exchange_rate', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <p className='form-hint'>
              {t('currencies.detail.last_update', 'Última actualización:')}{' '}
              {lastUpdate}
            </p>
          </div>

          {/* Info Alert */}
          <div className='currency-detail-panel__alert'>
            <Info size={18} className='currency-detail-panel__alert-icon' />
            <p className='currency-detail-panel__alert-text'>
              {t(
                'currencies.detail.warning',
                'Modificar el código ISO puede afectar reportes históricos. Asegúrese de que este cambio sea estrictamente necesario.'
              )}
            </p>
          </div>
        </form>
      </div>

      {/* Panel Footer */}
      <div className='currency-detail-panel__footer'>
        <button type='button' className='btn btn--secondary' onClick={onClose}>
          {t('action.cancel', 'Cancelar')}
        </button>
        <button
          type='button'
          className='btn btn--primary'
          onClick={handleSubmit}
          disabled={saving || !hasChanges}
        >
          {saving
            ? t('action.saving', 'Guardando...')
            : t('action.save', 'Guardar Cambios')}
        </button>
      </div>
    </div>
  )
}

// Main Currencies Page Component
const CurrenciesPage = () => {
  const { t } = useI18n()

  // Store
  const {
    currencies,
    loading,
    error,
    searchTerm,
    filter,
    selectedCurrency,
    setSearchTerm,
    setFilter,
    setSelectedCurrency,
    clearSelectedCurrency,
    fetchCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    getFilteredCurrencies,
    clearError,
  } = useCurrencyStore()

  // Local state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currencyToDelete, setCurrencyToDelete] = useState(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [detailCurrency, setDetailCurrency] = useState(null)

  // Derived state
  const filteredCurrencies = getFilteredCurrencies()

  // Stats
  const stats = {
    total: currencies.length,
    enabled: currencies.filter(c => c.is_enabled !== false).length,
    disabled: currencies.filter(c => c.is_enabled === false).length,
  }

  // Fetch currencies on mount
  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  // Handlers
  const handleSearchChange = e => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = newFilter => {
    setFilter(newFilter)
  }

  const handleCreate = () => {
    clearSelectedCurrency()
    setIsFormModalOpen(true)
  }

  const handleEdit = currency => {
    setSelectedCurrency(currency)
    setIsFormModalOpen(true)
  }

  const handleDelete = currency => {
    setCurrencyToDelete(currency)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (currencyToDelete) {
      try {
        await deleteCurrency(currencyToDelete.id)
        setIsDeleteModalOpen(false)
        setCurrencyToDelete(null)
        // Close detail panel if the deleted currency was being viewed
        if (detailCurrency?.id === currencyToDelete.id) {
          setIsDetailPanelOpen(false)
          setDetailCurrency(null)
        }
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const handleRowClick = currency => {
    setDetailCurrency(currency)
    setIsDetailPanelOpen(true)
  }

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false)
    setDetailCurrency(null)
  }

  const handleSaveFromPanel = async formData => {
    if (detailCurrency) {
      await updateCurrency(detailCurrency.id, formData)
      // Refresh detail currency with updated data
      const updated = currencies.find(c => c.id === detailCurrency.id)
      if (updated) {
        setDetailCurrency({ ...updated, ...formData })
      }
    }
  }

  const handleSave = async formData => {
    if (selectedCurrency) {
      await updateCurrency(selectedCurrency.id, formData)
    } else {
      await createCurrency(formData)
    }
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    clearSelectedCurrency()
  }

  const handleExport = () => {
    // MVP: Simple CSV export
    const csvContent = [
      [
        'Código',
        'Nombre',
        'Símbolo',
        'Decimales',
        'Estado',
        'Tasa de Cambio',
      ].join(','),
      ...filteredCurrencies.map(c =>
        [
          c.currency_code,
          `"${c.currency_name || c.name}"`,
          c.symbol,
          c.decimal_places,
          c.is_enabled !== false ? 'Habilitada' : 'Deshabilitada',
          c.exchange_rate || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `monedas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Render loading state
  if (loading && currencies.length === 0) {
    return (
      <div className='currencies-page'>
        <DataState variant='loading' skeletonVariant='list' />
      </div>
    )
  }

  // Render error state
  if (error && currencies.length === 0) {
    return (
      <div className='currencies-page'>
        <DataState
          variant='error'
          title={t('currencies.error.title', 'Error')}
          message={error}
          onRetry={fetchCurrencies}
        />
      </div>
    )
  }

  return (
    <div className='currencies-page'>
      {/* Header */}
      <div className='currencies-page__header'>
        <div className='currencies-page__header-content'>
          <h1 className='currencies-page__title'>
            {t('currencies.title', 'Gestión de Monedas')}
          </h1>
          <p className='currencies-page__subtitle'>
            {t(
              'currencies.subtitle',
              'Administre el catálogo de divisas habilitadas para las transacciones del sistema ERP.'
            )}
          </p>
        </div>

        <div className='currencies-page__header-actions'>
          <button
            className='btn btn--secondary'
            onClick={handleExport}
            aria-label={t('action.export', 'Exportar')}
          >
            <Download size={18} />
            <span>{t('action.export', 'Exportar')}</span>
          </button>
          <button
            className='btn btn--primary'
            onClick={handleCreate}
            aria-label={t('currencies.action.create', 'Nueva Moneda')}
          >
            <Plus size={18} />
            <span>{t('currencies.action.create', 'Nueva Moneda')}</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className='currencies-page__toolbar'>
        {/* Search */}
        <div className='currencies-page__search'>
          <Search className='currencies-page__search-icon' size={20} />
          <input
            type='text'
            className='currencies-page__search-input'
            placeholder={t(
              'currencies.search.placeholder',
              'Buscar por código ISO o nombre...'
            )}
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label={t('currencies.search.label', 'Buscar monedas')}
          />
        </div>

        {/* Filter Chips */}
        <div className='currencies-page__filters'>
          <button
            className={`filter-chip ${
              filter === 'all' ? 'filter-chip--active' : ''
            }`}
            onClick={() => handleFilterChange('all')}
          >
            <span>{t('currencies.filter.all', 'Todas')}</span>
            <span className='filter-chip__count'>{stats.total}</span>
          </button>
          <button
            className={`filter-chip ${
              filter === 'enabled' ? 'filter-chip--active' : ''
            }`}
            onClick={() => handleFilterChange('enabled')}
          >
            <span>{t('currencies.filter.enabled', 'Habilitadas')}</span>
            <span className='filter-chip__count'>{stats.enabled}</span>
          </button>
          <button
            className={`filter-chip ${
              filter === 'disabled' ? 'filter-chip--active' : ''
            }`}
            onClick={() => handleFilterChange('disabled')}
          >
            <span>{t('currencies.filter.disabled', 'Deshabilitadas')}</span>
            <span className='filter-chip__count'>{stats.disabled}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className='currencies-page__table-container'>
        <table className='currencies-table'>
          <thead className='currencies-table__header'>
            <tr>
              <th className='currencies-table__th'>
                {t('currencies.table.code', 'Código ISO')}
              </th>
              <th className='currencies-table__th'>
                {t('currencies.table.name', 'Nombre')}
              </th>
              <th className='currencies-table__th'>
                {t('currencies.table.symbol', 'Símbolo')}
              </th>
              <th className='currencies-table__th'>
                {t('currencies.table.status', 'Estado')}
              </th>
              <th className='currencies-table__th currencies-table__th--actions'>
                {t('currencies.table.actions', 'Acciones')}
              </th>
            </tr>
          </thead>

          <tbody className='currencies-table__body'>
            {filteredCurrencies.length === 0 ? (
              <tr>
                <td colSpan='5' className='currencies-table__empty'>
                  {searchTerm
                    ? t(
                        'currencies.empty.search',
                        'No se encontraron monedas con ese criterio'
                      )
                    : t(
                        'currencies.empty.message',
                        'No hay monedas configuradas'
                      )}
                </td>
              </tr>
            ) : (
              filteredCurrencies.map(currency => (
                <tr
                  key={currency.id}
                  className={`currencies-table__row ${
                    currency.is_base_currency
                      ? 'currencies-table__row--base'
                      : ''
                  } ${
                    detailCurrency?.id === currency.id
                      ? 'currencies-table__row--selected'
                      : ''
                  }`}
                  onClick={() => handleRowClick(currency)}
                >
                  <td className='currencies-table__td currencies-table__td--code'>
                    <div className='currencies-table__code-cell'>
                      <CurrencyFlag
                        emoji={currency.flag_emoji}
                        code={currency.currency_code}
                      />
                      <span className='currencies-table__code'>
                        {currency.currency_code}
                      </span>
                      {currency.is_base_currency && (
                        <span className='currencies-table__base-badge'>
                          {t('currencies.badge.base', 'Base')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='currencies-table__td'>
                    {currency.currency_name || currency.name}
                  </td>
                  <td className='currencies-table__td currencies-table__td--symbol'>
                    <span className='currencies-table__symbol'>
                      {currency.symbol}
                    </span>
                  </td>
                  <td className='currencies-table__td'>
                    <StatusBadge enabled={currency.is_enabled !== false} />
                  </td>
                  <td className='currencies-table__td currencies-table__td--actions'>
                    <div className='currencies-table__actions'>
                      <button
                        className='action-btn'
                        onClick={e => {
                          e.stopPropagation()
                          handleEdit(currency)
                        }}
                        aria-label={t('action.edit', 'Editar')}
                        title={t('action.edit', 'Editar')}
                      >
                        <Edit2 size={16} />
                      </button>
                      {!currency.is_base_currency && (
                        <button
                          className='action-btn action-btn--danger'
                          onClick={e => {
                            e.stopPropagation()
                            handleDelete(currency)
                          }}
                          aria-label={t('action.delete', 'Eliminar')}
                          title={t('action.delete', 'Eliminar')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      <div className='currencies-page__footer'>
        <span className='currencies-page__results'>
          {t('currencies.results', 'Mostrando {count} de {total} resultados')
            .replace('{count}', filteredCurrencies.length)
            .replace('{total}', currencies.length)}
        </span>
      </div>

      {/* Detail Side Panel */}
      <CurrencyDetailPanel
        currency={detailCurrency}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onSave={handleSaveFromPanel}
      />

      {/* Form Modal */}
      <CurrencyFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        currency={selectedCurrency}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        currencyName={
          currencyToDelete?.currency_name || currencyToDelete?.name || ''
        }
      />
    </div>
  )
}

export default CurrenciesPage
