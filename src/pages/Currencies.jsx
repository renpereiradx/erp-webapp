// ===========================================================================
// Currencies Page - Fluent Design System 2 + BEM
// Logic: useCurrencyStore
// Design: Fluent 2 (specs/fluent2)
// i18n implemented (ES/EN support)
// ===========================================================================

import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Edit2,
  MoreVertical,
  X,
  Settings,
  CreditCard,
  Coins,
  Info,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useCurrencyStore from '@/store/useCurrencyStore'
import '@/styles/scss/pages/_currencies.scss'

// --- Components ---

// Map for flag images if ISO code is known, otherwise fallback to emoji
const getFlagUrl = (code) => {
  if (!code) return null;
  const mapping = {
    'USD': 'us',
    'EUR': 'eu',
    'GBP': 'gb',
    'JPY': 'jp',
    'CAD': 'ca',
    'AUD': 'au',
    'PYG': 'py',
    'BRL': 'br',
    'ARS': 'ar',
    'MXN': 'mx',
    'CLP': 'cl',
    'COP': 'co',
    'PEN': 'pe',
    'UYU': 'uy',
    'CNY': 'cn',
  };
  const countryCode = mapping[code.toUpperCase()];
  if (countryCode) {
    return `https://flagcdn.com/w40/${countryCode}.png`;
  }
  return null;
}

import { PaymentMethodService } from '@/services/paymentMethodService'

// Payment Methods Tab Component
const PaymentMethodsTab = ({ searchTerm }) => {
  const { t } = useI18n()
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMethods()
  }, [])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      const data = await PaymentMethodService.getAll()
      setMethods(data)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMethods = methods.filter(method => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      method.method_code.toLowerCase().includes(term) ||
      method.description.toLowerCase().includes(term)
    )
  })

  return (
    <>
      <table className='currencies-table'>
        <thead className='currencies-table__head'>
          <tr>
            <th className='currencies-table__th'>{t('currencies.table.code')}</th>
            <th className='currencies-table__th'>{t('currencies.table.name')}</th>
            <th className='currencies-table__th'>{t('currencies.payment_methods.table.type')}</th>
            <th className='currencies-table__th'>{t('currencies.table.status')}</th>
            <th className='currencies-table__th currencies-table__th--actions'>{t('currencies.table.actions')}</th>
          </tr>
        </thead>
        <tbody className='currencies-table__body'>
          {loading ? (
            <tr>
              <td colSpan='5' className='currencies-table__empty'>{t('common.loading')}</td>
            </tr>
          ) : filteredMethods.length === 0 ? (
            <tr>
              <td colSpan='5' className='currencies-table__empty'>{t('currencies.empty.search')}</td>
            </tr>
          ) : (
            filteredMethods.map(method => (
              <tr key={method.id} className='currencies-table__row'>
                <td className='currencies-table__td'>
                  <span className='currencies-table__code'>{method.method_code}</span>
                </td>
                <td className='currencies-table__td currencies-table__td--name'>
                  {method.description}
                </td>
                <td className='currencies-table__td'>
                  {PaymentMethodService.requiresAdditionalInfo(method) 
                    ? t('currencies.payment_methods.type.complex') 
                    : t('currencies.payment_methods.type.simple')}
                </td>
                <td className='currencies-table__td'>
                  <span className={`status-badge ${method.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                    <span className='status-badge__dot'></span>
                    <span className='status-badge__text'>
                      {method.is_active ? t('currencies.status.active') : t('currencies.status.inactive')}
                    </span>
                  </span>
                </td>
                <td className='currencies-table__td currencies-table__td--actions'>
                  <button className='currencies-table__action-btn' disabled title={t('currencies.payment_methods.action.edit_disabled')}>
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Pagination - Placeholder for now */}
      <div className='currencies-pagination'>
        <span className='currencies-pagination__info'>
          {t('currencies.results', { count: filteredMethods.length, total: filteredMethods.length })}
        </span>
        <div className='currencies-pagination__buttons'>
          <button className='currencies-pagination__btn' disabled>{t('common.pagination.previous')}</button>
          <button className='currencies-pagination__btn' disabled>{t('common.pagination.next')}</button>
        </div>
      </div>
    </>
  )
}

// Drawer (Slide-over) Component for Add/Edit
const CurrencyDrawer = ({ isOpen, onClose, currency, onSave, baseCurrency }) => {
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
  }, [currency, isOpen])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save currency', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const lastUpdate =
    currency && currency.updated_at
      ? new Date(currency.updated_at).toLocaleString()
      : t('currencies.detail.no_update')

  const flagUrl = getFlagUrl(formData.currency_code);

  return (
    <div className='currency-detail-panel'>
      <div className='currency-detail-panel__header'>
        <h3 className='currency-detail-panel__title'>
          {currency ? t('currencies.modal.edit_title') : t('currencies.modal.create_title')}
        </h3>
        <button
          type='button'
          className='currency-detail-panel__close'
          onClick={onClose}
          aria-label={t('action.close')}
        >
          <X size={20} />
        </button>
      </div>

      <div className='currency-detail-panel__content'>
        <div className='currency-detail-panel__summary'>
          <div className='currency-flag'>
            {flagUrl ? (
               <img src={flagUrl} alt={formData.currency_code} style={{ width: '32px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
            ) : (
               <span className='currency-flag__emoji'>{formData.flag_emoji || '🏳️'}</span>
            )}
          </div>
          <div className='currency-detail-panel__summary-info'>
            <h4 className='currency-detail-panel__summary-code'>
              {formData.currency_code || 'NEW'}
            </h4>
            <p className='currency-detail-panel__summary-name'>
              {formData.currency_name || t('currencies.placeholder.name')}
            </p>
          </div>
        </div>

        <form className='currency-detail-panel__form' onSubmit={handleSubmit}>
          {/* Nombre de la moneda */}
          <div className='form-group'>
            <label className='form-label' htmlFor='currency_name'>
              {t('currencies.field.name')}
            </label>
            <input
              id='currency_name'
              type='text'
              className='form-input'
              value={formData.currency_name}
              onChange={e => handleChange('currency_name', e.target.value)}
              placeholder={t('currencies.placeholder.name')}
              required
            />
          </div>

          {/* Código ISO y Símbolo en una fila */}
          <div className='form-grid'>
            <div className='form-group'>
              <label className='form-label' htmlFor='currency_code'>
                {t('currencies.field.code')}
              </label>
              <input
                id='currency_code'
                type='text'
                className='form-input'
                value={formData.currency_code}
                onChange={e =>
                  handleChange('currency_code', e.target.value.toUpperCase())
                }
                maxLength={3}
                placeholder='EUR'
                disabled={currency?.is_base_currency || !!currency?.id}
                required
              />
            </div>
            <div className='form-group'>
              <label className='form-label' htmlFor='symbol'>
                {t('currencies.field.symbol')}
              </label>
              <input
                id='symbol'
                type='text'
                className='form-input'
                value={formData.symbol}
                onChange={e => handleChange('symbol', e.target.value)}
                placeholder='$'
                maxLength={5}
              />
            </div>
          </div>

          {/* Decimales */}
          <div className='form-group'>
            <label className='form-label' htmlFor='decimal_places'>
              {t('currencies.field.decimals')}
            </label>
            <input
              id='decimal_places'
              type='number'
              className='form-input'
              min={0}
              max={4}
              value={formData.decimal_places}
              onChange={e =>
                handleChange('decimal_places', parseInt(e.target.value) || 0)
              }
            />
            <p className='form-hint'>
              Cantidad de decimales a usar al mostrar montos (0-4)
            </p>
          </div>

          {/* Tasa de cambio - Solo informativo, viene de /exchange-rates */}
          {currency && !currency.is_base_currency && (
            <div className='form-group'>
              <label className='form-label'>
                {t('currencies.field.exchange_rate')}
              </label>
              <div className='form-static'>
                {currency.exchange_rate 
                  ? Number(currency.exchange_rate).toLocaleString('es-PY')
                  : 'N/A'
                }
              </div>
              <p className='form-hint'>
                Base: 1 {baseCurrency?.currency_code || 'PYG'} • {t('currencies.detail.last_update')} {lastUpdate}
              </p>
            </div>
          )}

          {currency?.is_base_currency && (
             <div className='alert alert--info'>
               <Info size={16} />
               <p>{t('currencies.warning.base_currency')}</p>
             </div>
          )}

        </form>
      </div>

      <div className='currency-detail-panel__footer'>
        <button
          type='button'
          className='btn btn--primary'
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? t('action.saving') : t('action.save')}
        </button>
        <button
            type='button' 
            className='btn btn--secondary' 
            onClick={onClose}
        >
          {t('action.cancel')}
        </button>
      </div>
    </div>
  )
}

// Main Page Component
const CurrenciesPage = () => {
  const { t } = useI18n()
  const {
    currencies,
    loading,
    searchTerm,
    fetchCurrencies,
    createCurrency,
    updateCurrency,
    setSearchTerm,
    getFilteredCurrencies,
  } = useCurrencyStore()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [activeTab, setActiveTab] = useState('currencies')
  const filteredCurrencies = getFilteredCurrencies()
  
  // Find base currency from list
  const baseCurrency = currencies.find(c => c.is_base_currency)

  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  const handleOpenCreate = () => {
    setSelectedCurrency(null)
    setDrawerOpen(true)
  }

  const handleOpenEdit = currency => {
    setSelectedCurrency(currency)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedCurrency(null)
  }

  const handleSave = async formData => {
    if (selectedCurrency) {
      await updateCurrency(selectedCurrency.id, formData)
    } else {
      await createCurrency(formData)
    }
  }

  const handleExport = () => {
    const csvContent = [
      [t('currencies.table.code'), t('currencies.table.name'), t('currencies.table.symbol'), t('currencies.field.decimals'), t('currencies.table.status'), t('currencies.table.exchange_rate')].join(','),
      ...filteredCurrencies.map(c =>
        [
          c.currency_code,
          `"${c.currency_name || c.name}"`,
          c.symbol,
          c.decimal_places,
          c.is_enabled !== false ? t('currencies.status.enabled') : t('currencies.status.disabled'),
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
  }

  // Format date correctly
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-PY')
  }

  // Format currency values according to their decimal places and locale
  const formatCurrencyValue = (value, currency) => {
    if (value === null || value === undefined) return '-'
    
    // If we're displaying a rate where the base is PYG, follow the user's rule (0 decimals)
    // Otherwise use the currency's own decimal preference or 4 for rates
    let decimals = 4
    if (baseCurrency?.currency_code === 'PYG') {
      decimals = 0
    } else if (currency?.decimal_places !== undefined) {
      decimals = currency.decimal_places
    }
    
    return Number(value).toLocaleString('es-PY', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  return (
    <div className='currencies-page'>
      {/* Page Header */}
      <div className='currencies-page__header'>
        <div className='currencies-page__header-content'>
          <h1 className='currencies-page__title'>
            {t('currencies.page.title')}
          </h1>
          <p className='currencies-page__subtitle'>
            {t('currencies.page.subtitle')}
          </p>
        </div>
        
        {/* Base Currency Widget */}
        <div className='base-currency-widget'>
          <span className='base-currency-widget__label'>{t('currencies.widget.base_currency')}</span>
          <div className='base-currency-widget__value'>
            <span className='base-currency-widget__code'>{baseCurrency?.currency_code || 'PYG'}</span>
            <span className='base-currency-widget__symbol'>({baseCurrency?.symbol || 'Gs'})</span>
          </div>
          <button className='base-currency-widget__change'>{t('currencies.widget.change')}</button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className='currencies-card'>
        {/* Tabs */}
        <div className='currencies-tabs'>
          <button 
            className={`currencies-tabs__tab ${activeTab === 'currencies' ? 'currencies-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('currencies')}
          >
            <Coins size={18} />
            <span>{t('currencies.tabs.currencies')}</span>
          </button>
          <button 
            className={`currencies-tabs__tab ${activeTab === 'payment-methods' ? 'currencies-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('payment-methods')}
          >
            <CreditCard size={18} />
            <span>{t('currencies.tabs.payment_methods')}</span>
          </button>
          <button 
            className={`currencies-tabs__tab ${activeTab === 'settings' ? 'currencies-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>{t('currencies.tabs.settings')}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className='currencies-toolbar'>
          <div className='currencies-toolbar__left'>
            <button className='btn btn--primary' onClick={handleOpenCreate}>
              <Plus size={18} />
              <span>{t('currencies.action.create')}</span>
            </button>
            <div className='currencies-toolbar__divider'></div>
            <button className='currencies-toolbar__icon-btn' onClick={fetchCurrencies} title={t('currencies.action.refresh')}>
              <RefreshCw size={18} />
            </button>
            <button className='currencies-toolbar__icon-btn' onClick={handleExport} title={t('currencies.action.export')}>
              <Download size={18} />
            </button>
          </div>

          <div className='currencies-toolbar__right'>
            <div className='currencies-toolbar__search'>
              <Search size={16} className='currencies-toolbar__search-icon' />
              <input
                type='text'
                className='currencies-toolbar__search-input'
                placeholder={t('currencies.search.placeholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='currencies-table-wrapper'>
          {activeTab === 'currencies' && (
            <>
              {/* Currencies Table */}
              <table className='currencies-table'>
                <thead className='currencies-table__head'>
                  <tr>
                    <th className='currencies-table__th currencies-table__th--checkbox'>
                      <input type='checkbox' className='fluent-checkbox' />
                    </th>
                    <th className='currencies-table__th'>{t('currencies.table.code')}</th>
                    <th className='currencies-table__th'>{t('currencies.table.name')}</th>
                    <th className='currencies-table__th'>{t('currencies.table.symbol')}</th>
                    <th className='currencies-table__th'>{t('currencies.table.exchange_rate')}</th>
                    <th className='currencies-table__th'>{t('currencies.table.status')}</th>
                    <th className='currencies-table__th'>{t('currencies.table.last_updated')}</th>
                    <th className='currencies-table__th currencies-table__th--actions'>{t('currencies.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className='currencies-table__body'>
                  {loading ? (
                    <tr>
                      <td colSpan='8' className='currencies-table__empty'>{t('common.loading')}</td>
                    </tr>
                  ) : filteredCurrencies.length === 0 ? (
                    <tr>
                      <td colSpan='8' className='currencies-table__empty'>{t('currencies.empty.search')}</td>
                    </tr>
                  ) : (
                    filteredCurrencies.map(currency => {
                      const flagUrl = getFlagUrl(currency.currency_code);
                      return (
                        <tr 
                          key={currency.id} 
                          className={`currencies-table__row ${currency.is_base_currency ? 'currencies-table__row--base' : ''}`}
                        >
                          <td className='currencies-table__td currencies-table__td--checkbox'>
                            <input type='checkbox' className='fluent-checkbox' />
                          </td>
                          <td className='currencies-table__td'>
                            <div className='currencies-table__code-cell'>
                              <div className='currencies-table__flag'>
                                {flagUrl ? (
                                  <img src={flagUrl} alt={currency.currency_code} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span className='currencies-table__flag-emoji'>{currency.flag_emoji || '🏳️'}</span>
                                )}
                              </div>
                              <span className='currencies-table__code'>{currency.currency_code}</span>
                              {currency.is_base_currency && (
                                <span className='currencies-table__base-badge'>{t('currencies.badge.base')}</span>
                              )}
                            </div>
                          </td>
                          <td className='currencies-table__td currencies-table__td--name'>
                            {currency.currency_name || currency.name}
                          </td>
                          <td className='currencies-table__td currencies-table__td--symbol'>
                            {currency.symbol}
                          </td>
                          <td className='currencies-table__td currencies-table__td--rate'>
                            {currency.is_base_currency ? 'N/A' : formatCurrencyValue(currency.exchange_rate, currency)}
                          </td>
                          <td className='currencies-table__td'>
                            <span className={`status-badge ${currency.is_enabled !== false ? 'status-badge--active' : 'status-badge--inactive'}`}>
                              <span className='status-badge__dot'></span>
                              <span className='status-badge__text'>
                                {currency.is_enabled !== false ? t('currencies.status.active') : t('currencies.status.inactive')}
                              </span>
                            </span>
                          </td>
                          <td className='currencies-table__td currencies-table__td--date'>
                            {formatDate(currency.updated_at)}
                          </td>
                          <td className='currencies-table__td currencies-table__td--actions'>
                            <div className='currencies-table__actions'>
                              <button 
                                className='currencies-table__action-btn' 
                                onClick={() => handleOpenEdit(currency)} 
                                title={t('currencies.action.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button className='currencies-table__action-btn' title={t('action.more')}>
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className='currencies-pagination'>
                <span className='currencies-pagination__info'>
                  {t('currencies.results', { count: filteredCurrencies.length, total: filteredCurrencies.length })}
                </span>
                <div className='currencies-pagination__buttons'>
                  <button className='currencies-pagination__btn' disabled>{t('common.pagination.previous')}</button>
                  <button className='currencies-pagination__btn' disabled>{t('common.pagination.next')}</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payment-methods' && (
            <PaymentMethodsTab searchTerm={searchTerm} />
          )}

          {activeTab === 'settings' && (
             <div className='settings-tab'>
               <div className='settings-section'>
                 <h3 className='settings-section__title'>{t('currencies.settings.general.title')}</h3>
                 <p className='settings-section__desc'>{t('currencies.settings.general.description')}</p>
                 
                 <div className='settings-form'>
                    <div className='form-group'>
                      <label className='form-label'>{t('currencies.settings.field.number_format')}</label>
                      <select className='form-select' disabled>
                        <option>{t('currencies.settings.field.number_format.es_py')}</option>
                        <option>{t('currencies.settings.field.number_format.en_us')}</option>
                      </select>
                      <p className='form-hint'>{t('currencies.settings.hint.number_format')}</p>
                    </div>

                    <div className='form-group'>
                       <label className='form-checkbox'>
                         <input type='checkbox' checked readOnly />
                         <span className='form-checkbox__label'>{t('currencies.settings.field.show_symbols')}</span>
                       </label>
                    </div>

                    <div className='form-group'>
                       <label className='form-checkbox'>
                         <input type='checkbox' disabled />
                         <span className='form-checkbox__label'>{t('currencies.settings.field.auto_update')}</span>
                       </label>
                    </div>
                 </div>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Drawer Overlay & Panel */}
      {drawerOpen && (
        <div className='drawer-overlay' onClick={handleCloseDrawer}>
          <div className='drawer-panel' onClick={e => e.stopPropagation()}>
            <CurrencyDrawer
              isOpen={drawerOpen}
              onClose={handleCloseDrawer}
              currency={selectedCurrency}
              onSave={handleSave}
              baseCurrency={baseCurrency}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CurrenciesPage
