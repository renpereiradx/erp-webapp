import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Edit3,
  Globe,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Trash2,
} from 'lucide-react'
import { CurrencyService } from '../services/currencyService.js'
import { PaymentMethodService } from '../services/paymentMethodService.js'
import { ExchangeRateService } from '../services/exchangeRateService.js'

const DEFAULT_PAGE_SIZE = 10

const summaryCardStyles =
  'bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex items-start'

const SummaryCard = ({ icon, accentClass, title, value, description }) => {
  const IconComponent = icon
  return (
    <div className={summaryCardStyles}>
      <div className={`p-2 rounded-lg ${accentClass}`}>
        {IconComponent ? <IconComponent className='w-6 h-6' /> : null}
      </div>
      <div className='ml-4'>
        <p className='text-sm text-slate-500'>{title}</p>
        <p className='text-2xl font-semibold text-slate-900'>{value}</p>
        {description ? (
          <p className='text-xs text-slate-500 mt-1'>{description}</p>
        ) : null}
      </div>
    </div>
  )
}

const SectionCard = ({
  title,
  description,
  icon,
  actions,
  children,
  alert,
  className = '',
  contentClassName = 'px-6 py-6',
}) => {
  const IconComponent = icon
  return (
    <section
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}
    >
      <div className='border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <div className='p-2 bg-blue-50 rounded-lg text-blue-600'>
            {IconComponent ? <IconComponent className='w-5 h-5' /> : null}
          </div>
          <div>
            <h2 className='text-lg font-semibold text-slate-900'>{title}</h2>
            {description ? (
              <p className='text-sm text-slate-500 mt-1'>{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className='flex items-center gap-2'>{actions}</div>
        ) : null}
      </div>
      {alert}
      <div className={contentClassName}>{children}</div>
    </section>
  )
}

const EmptyState = ({ icon, title, description }) => {
  const IconComponent = icon
  return (
    <div className='flex flex-col items-center justify-center text-center py-10'>
      <div className='p-3 rounded-full bg-slate-100 text-slate-500'>
        {IconComponent ? <IconComponent className='w-6 h-6' /> : null}
      </div>
      <h3 className='mt-4 text-base font-medium text-slate-900'>{title}</h3>
      <p className='mt-1 text-sm text-slate-500 max-w-md'>{description}</p>
    </div>
  )
}

const formatNumber = (value, options = {}) => {
  const formatter = new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    ...options,
  })
  return formatter.format(value || 0)
}

const formatDate = value => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PaymentManagement = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false)

  const [currencies, setCurrencies] = useState([])
  const [currenciesLoading, setCurrenciesLoading] = useState(false)
  const [currencyForm, setCurrencyForm] = useState({
    currency_code: '',
    currency_name: '',
  })
  const [currencyFormMessage, setCurrencyFormMessage] = useState(null)
  const [currencyFormLoading, setCurrencyFormLoading] = useState(false)
  const [editCurrencyId, setEditCurrencyId] = useState('')
  const [editCurrencyForm, setEditCurrencyForm] = useState({
    currency_code: '',
    currency_name: '',
  })
  const [editCurrencyLoading, setEditCurrencyLoading] = useState(false)

  const [latestRates, setLatestRates] = useState([])
  const [latestRatesLoading, setLatestRatesLoading] = useState(false)

  const [enrichedRates, setEnrichedRates] = useState({
    data: [],
    total: 0,
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
    total_pages: 0,
  })
  const [enrichedRatesQuery, setEnrichedRatesQuery] = useState({
    date: '',
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
  })
  const [enrichedRatesLoading, setEnrichedRatesLoading] = useState(false)

  const [rateCreateForm, setRateCreateForm] = useState({
    currency_id: '',
    rate_to_base: '',
    date: '',
    source: '',
  })
  const [rateCreateLoading, setRateCreateLoading] = useState(false)
  const [rateCreateMessage, setRateCreateMessage] = useState(null)

  const [rateByDateForm, setRateByDateForm] = useState({
    currency_id: '',
    date: '',
  })
  const [rateByDateLoading, setRateByDateLoading] = useState(false)
  const [rateByDateResult, setRateByDateResult] = useState(null)
  const [rateByDateError, setRateByDateError] = useState(null)

  const [rateRangeForm, setRateRangeForm] = useState({
    currency_id: '',
    start_date: '',
    end_date: '',
  })
  const [rateRangeLoading, setRateRangeLoading] = useState(false)
  const [rateRangeResult, setRateRangeResult] = useState([])
  const [rateRangeError, setRateRangeError] = useState(null)

  const [methodSearchCode, setMethodSearchCode] = useState('')
  const [methodSearchId, setMethodSearchId] = useState('')
  const [methodSearchLoading, setMethodSearchLoading] = useState(false)
  const [methodSearchResult, setMethodSearchResult] = useState(null)
  const [methodSearchError, setMethodSearchError] = useState(null)

  const systemTabs = useMemo(
    () => [
      {
        id: 'methods',
        label: 'Métodos de pago',
        description:
          'Consulta el catálogo expuesto por /payment-methods y verifica códigos, descripciones y consistencia de datos.',
        icon: CreditCard,
      },
      {
        id: 'currencies',
        label: 'Monedas',
        description:
          'Administra altas, ediciones y bajas controladas desde /currencies. Respeta códigos ISO 4217 y evita eliminar monedas en uso.',
        icon: Globe,
      },
      {
        id: 'rates',
        label: 'Tipos de cambio',
        description:
          'Carga diaria, consultas puntuales e histórico completo mediante los endpoints de /exchange-rate.',
        icon: TrendingUp,
      },
    ],
    []
  )

  const [activeSystemTab, setActiveSystemTab] = useState(
    systemTabs[0]?.id ?? 'methods'
  )

  const activeTabMeta = useMemo(
    () => systemTabs.find(tab => tab.id === activeSystemTab) || null,
    [systemTabs, activeSystemTab]
  )

  const [pageTimestamp, setPageTimestamp] = useState(() => new Date())

  const baseCurrency = useMemo(() => {
    return currencies.find(
      currency => currency.is_base_currency || currency.currency_code === 'PYG'
    )
  }, [currencies])

  const nonBaseCurrencies = useMemo(() => {
    return currencies.filter(
      currency =>
        !currency.is_base_currency &&
        currency.currency_code !== (baseCurrency?.currency_code ?? 'PYG')
    )
  }, [currencies, baseCurrency])

  const stats = useMemo(
    () => ({
      totalMethods: paymentMethods.length,
      totalCurrencies: currencies.length,
      latestRatesCount: latestRates.length,
      baseCurrency: baseCurrency?.currency_code || 'Sin asignar',
    }),
    [paymentMethods.length, currencies.length, latestRates.length, baseCurrency]
  )

  const bootstrapData = async () => {
    setIsBootstrapping(true)
    setGlobalError(null)
    try {
      await Promise.all([
        loadPaymentMethods(),
        loadCurrencies(),
        loadLatestRates(),
        loadEnrichedRates(enrichedRatesQuery),
      ])
      setPageTimestamp(new Date())
    } catch (error) {
      setGlobalError(
        error?.message ||
          'No se pudieron obtener los datos iniciales del sistema de pagos.'
      )
    } finally {
      setIsBootstrapping(false)
    }
  }

  useEffect(() => {
    bootstrapData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPaymentMethods = async () => {
    setPaymentMethodsLoading(true)
    try {
      const data = await PaymentMethodService.getAll()
      setPaymentMethods(Array.isArray(data) ? data : [])
    } finally {
      setPaymentMethodsLoading(false)
    }
  }

  const loadCurrencies = async () => {
    setCurrenciesLoading(true)
    try {
      const data = await CurrencyService.getAll()
      setCurrencies(Array.isArray(data) ? data : [])
    } finally {
      setCurrenciesLoading(false)
    }
  }

  const loadLatestRates = async () => {
    setLatestRatesLoading(true)
    try {
      const data = await ExchangeRateService.getLatestAll()
      setLatestRates(Array.isArray(data) ? data : [])
    } finally {
      setLatestRatesLoading(false)
    }
  }

  const loadEnrichedRates = async query => {
    setEnrichedRatesLoading(true)
    try {
      const normalizedQuery = {
        date: query?.date || '',
        page: query?.page || 1,
        page_size: query?.page_size || DEFAULT_PAGE_SIZE,
      }
      const response = await ExchangeRateService.getEnriched(normalizedQuery)
      setEnrichedRates(response)
      setEnrichedRatesQuery(normalizedQuery)
    } finally {
      setEnrichedRatesLoading(false)
    }
  }

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true)
    try {
      await bootstrapData()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCurrencyFormChange = event => {
    const { name, value } = event.target
    setCurrencyForm(prev => ({ ...prev, [name]: value }))
    setCurrencyFormMessage(null)
  }

  const handleCurrencyCreate = async event => {
    event.preventDefault()
    if (currencyFormLoading) return
    setCurrencyFormLoading(true)
    setCurrencyFormMessage(null)
    try {
      await CurrencyService.create({
        currency_code: currencyForm.currency_code,
        currency_name: currencyForm.currency_name,
      })
      setCurrencyForm({ currency_code: '', currency_name: '' })
      setCurrencyFormMessage({
        type: 'success',
        text: 'Moneda creada correctamente.',
      })
      await loadCurrencies()
    } catch (error) {
      setCurrencyFormMessage({
        type: 'error',
        text: error?.message || 'No se pudo crear la moneda.',
      })
    } finally {
      setCurrencyFormLoading(false)
    }
  }

  const handleEditCurrencySelect = event => {
    const { value } = event.target
    setEditCurrencyId(value)
    if (!value) {
      setEditCurrencyForm({ currency_code: '', currency_name: '' })
      return
    }
    const selected = currencies.find(currency => String(currency.id) === value)
    if (selected) {
      setEditCurrencyForm({
        currency_code: selected.currency_code || '',
        currency_name: selected.currency_name || selected.name || '',
      })
    }
  }

  const handleEditCurrencyChange = event => {
    const { name, value } = event.target
    setEditCurrencyForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCurrencyUpdate = async event => {
    event.preventDefault()
    if (!editCurrencyId || editCurrencyLoading) {
      return
    }
    setEditCurrencyLoading(true)
    setCurrencyFormMessage(null)
    try {
      await CurrencyService.update(Number(editCurrencyId), {
        currency_code: editCurrencyForm.currency_code,
        currency_name: editCurrencyForm.currency_name,
      })
      setCurrencyFormMessage({
        type: 'success',
        text: 'Moneda actualizada correctamente.',
      })
      await loadCurrencies()
    } catch (error) {
      setCurrencyFormMessage({
        type: 'error',
        text: error?.message || 'No se pudo actualizar la moneda.',
      })
    } finally {
      setEditCurrencyLoading(false)
    }
  }

  const handleCurrencyDelete = async () => {
    if (!editCurrencyId || editCurrencyLoading) {
      return
    }
    const selected = currencies.find(
      currency => String(currency.id) === String(editCurrencyId)
    )
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `¿Eliminar la moneda ${
          selected?.currency_code || ''
        }? Esta acción no es reversible.`
      )
      if (!confirmed) {
        return
      }
    }
    setEditCurrencyLoading(true)
    setCurrencyFormMessage(null)
    try {
      await CurrencyService.delete(Number(editCurrencyId))
      setCurrencyFormMessage({
        type: 'success',
        text: 'Moneda eliminada correctamente.',
      })
      setEditCurrencyId('')
      setEditCurrencyForm({ currency_code: '', currency_name: '' })
      await loadCurrencies()
    } catch (error) {
      setCurrencyFormMessage({
        type: 'error',
        text: error?.message || 'No se pudo eliminar la moneda.',
      })
    } finally {
      setEditCurrencyLoading(false)
    }
  }

  const handleMethodSearchByCode = async event => {
    event.preventDefault()
    if (!methodSearchCode.trim()) {
      setMethodSearchError('Ingresa un código para buscar.')
      return
    }
    setMethodSearchLoading(true)
    setMethodSearchResult(null)
    setMethodSearchError(null)
    try {
      const result = await PaymentMethodService.getByCode(
        methodSearchCode.trim()
      )
      setMethodSearchResult(result)
    } catch (error) {
      setMethodSearchError(
        error?.message || 'No se encontró el método de pago.'
      )
    } finally {
      setMethodSearchLoading(false)
    }
  }

  const handleMethodSearchById = async event => {
    event.preventDefault()
    if (!methodSearchId.trim()) {
      setMethodSearchError('Ingresa un ID para buscar.')
      return
    }
    setMethodSearchLoading(true)
    setMethodSearchResult(null)
    setMethodSearchError(null)
    try {
      const numericId = Number(methodSearchId.trim())
      const result = await PaymentMethodService.getById(numericId)
      setMethodSearchResult(result)
    } catch (error) {
      setMethodSearchError(
        error?.message || 'No se encontró el método de pago.'
      )
    } finally {
      setMethodSearchLoading(false)
    }
  }

  const handleRateCreateChange = event => {
    const { name, value } = event.target
    setRateCreateForm(prev => ({ ...prev, [name]: value }))
    setRateCreateMessage(null)
  }

  const handleRateCreate = async event => {
    event.preventDefault()
    if (rateCreateLoading) return
    setRateCreateLoading(true)
    setRateCreateMessage(null)
    try {
      await ExchangeRateService.create({
        currency_id: Number(rateCreateForm.currency_id),
        rate_to_base: rateCreateForm.rate_to_base,
        date: rateCreateForm.date,
        source: rateCreateForm.source,
      })
      setRateCreateMessage({
        type: 'success',
        text: 'Tipo de cambio registrado correctamente.',
      })
      setRateCreateForm({
        currency_id: '',
        rate_to_base: '',
        date: '',
        source: '',
      })
      await Promise.all([
        loadLatestRates(),
        loadEnrichedRates(enrichedRatesQuery),
      ])
    } catch (error) {
      setRateCreateMessage({
        type: 'error',
        text: error?.message || 'No se pudo crear el tipo de cambio.',
      })
    } finally {
      setRateCreateLoading(false)
    }
  }

  const handleRateByDateChange = event => {
    const { name, value } = event.target
    setRateByDateForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRateByDateSubmit = async event => {
    event.preventDefault()
    if (rateByDateLoading) return
    setRateByDateLoading(true)
    setRateByDateResult(null)
    setRateByDateError(null)
    try {
      const result = await ExchangeRateService.getByDate({
        currency_id: Number(rateByDateForm.currency_id),
        date: rateByDateForm.date || undefined,
      })
      setRateByDateResult(result)
    } catch (error) {
      setRateByDateError(
        error?.message || 'No se pudo obtener el tipo de cambio.'
      )
    } finally {
      setRateByDateLoading(false)
    }
  }

  const handleRateRangeChange = event => {
    const { name, value } = event.target
    setRateRangeForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRateRangeSubmit = async event => {
    event.preventDefault()
    if (rateRangeLoading) return
    setRateRangeLoading(true)
    setRateRangeResult([])
    setRateRangeError(null)
    try {
      const result = await ExchangeRateService.getByRange({
        currency_id: Number(rateRangeForm.currency_id),
        start_date: rateRangeForm.start_date,
        end_date: rateRangeForm.end_date,
      })
      setRateRangeResult(Array.isArray(result) ? result : [])
    } catch (error) {
      setRateRangeError(
        error?.message || 'No se pudo obtener el histórico de tipos de cambio.'
      )
    } finally {
      setRateRangeLoading(false)
    }
  }

  const handleRatesPageChange = async direction => {
    const nextPage = enrichedRates.page + direction
    if (
      nextPage < 1 ||
      (enrichedRates.total_pages && nextPage > enrichedRates.total_pages)
    ) {
      return
    }
    await loadEnrichedRates({ ...enrichedRatesQuery, page: nextPage })
  }

  if (isBootstrapping) {
    return (
      <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-500' />
        <p className='mt-3 text-sm'>Preparando el sistema de pagos...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50 pb-12'>
      <div className='max-w-7xl mx-auto px-6 pt-10'>
        <header className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <span className='p-2 bg-blue-100 text-blue-600 rounded-lg'>
                <DollarSign className='w-6 h-6' />
              </span>
              <div>
                <h1 className='text-3xl font-semibold text-slate-900'>
                  Gestión de Pagos
                </h1>
                <p className='text-sm text-slate-500 mt-1 max-w-2xl'>
                  Panel unificado para métodos de pago, monedas y tipos de
                  cambio basado en la documentación oficial{' '}
                  <strong>PAYMENT API v1.0</strong>.
                </p>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <div className='text-xs text-slate-500 text-right'>
              <p>Última sincronización</p>
              <p className='font-medium text-slate-700'>
                {pageTimestamp.toLocaleString('es-PY')}
              </p>
            </div>
            <button
              type='button'
              onClick={handleGlobalRefresh}
              disabled={isRefreshing}
              className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60'
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
          </div>
        </header>

        {globalError ? (
          <div
            className='mt-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-3'
            role='alert'
          >
            <AlertTriangle className='w-4 h-4 mt-0.5 flex-shrink-0' />
            <div>
              <p className='font-medium'>
                No se pudo contactar con la API de Pagos.
              </p>
              <p className='mt-1'>{globalError}</p>
            </div>
          </div>
        ) : null}

        <div className='mt-10'>
          <div className='bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 md:px-6 md:py-5'>
            <div
              className='flex flex-wrap gap-2'
              role='tablist'
              aria-label='Sistemas del módulo de pagos'
            >
              {systemTabs.map(tab => {
                const IconComponent = tab.icon
                const isActive = tab.id === activeSystemTab
                return (
                  <button
                    key={tab.id}
                    type='button'
                    role='tab'
                    id={`system-tab-trigger-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`system-tab-${tab.id}`}
                    onClick={() => setActiveSystemTab(tab.id)}
                    className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {IconComponent ? (
                      <IconComponent
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-white'
                            : 'text-blue-500 group-hover:text-blue-600'
                        }`}
                      />
                    ) : null}
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
            {activeTabMeta ? (
              <p className='mt-4 text-sm text-slate-500 leading-relaxed max-w-3xl'>
                {activeTabMeta.description}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className='mt-6'
          id={`system-tab-${activeSystemTab}`}
          role='tabpanel'
          aria-labelledby={`system-tab-trigger-${activeSystemTab}`}
        >
          {activeSystemTab === 'methods' ? (
            <SectionCard
              title='Métodos de Pago'
              description='Endpoints de solo lectura documentados en PAYMENT.md. Usa consultas por lista, ID o código para validar configuraciones.'
              icon={CreditCard}
              className='shadow-md ring-1 ring-blue-100/40'
              actions={
                <button
                  type='button'
                  onClick={loadPaymentMethods}
                  disabled={paymentMethodsLoading}
                  className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 disabled:opacity-70'
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      paymentMethodsLoading ? 'animate-spin' : ''
                    }`}
                  />
                  Refrescar listado
                </button>
              }
            >
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2'>
                  <div className='border border-slate-200 rounded-lg overflow-hidden'>
                    <div className='bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-500'>
                      Lista completa
                    </div>
                    <div className='max-h-72 overflow-y-auto'>
                      {paymentMethodsLoading ? (
                        <EmptyState
                          icon={Loader2}
                          title='Cargando métodos'
                          description='Solicitando información desde /payment-methods'
                        />
                      ) : paymentMethods.length === 0 ? (
                        <EmptyState
                          icon={AlertTriangle}
                          title='Sin métodos registrados'
                          description='Configura métodos directamente en la base de datos conforme a la guía.'
                        />
                      ) : (
                        <table className='min-w-full divide-y divide-slate-200 text-sm'>
                          <thead className='bg-white text-left text-xs uppercase tracking-wide text-slate-500'>
                            <tr>
                              <th className='px-4 py-3'>ID</th>
                              <th className='px-4 py-3'>Código</th>
                              <th className='px-4 py-3'>Descripción</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-200 bg-white'>
                            {paymentMethods.map(method => (
                              <tr key={method.id}>
                                <td className='px-4 py-3 font-mono text-xs text-slate-500'>
                                  {method.id}
                                </td>
                                <td className='px-4 py-3 font-semibold text-slate-800'>
                                  {method.method_code}
                                </td>
                                <td className='px-4 py-3 text-slate-600'>
                                  {method.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                  <p className='mt-3 text-xs text-slate-500'>
                    🔒 Operaciones de escritura (POST, PUT, DELETE) están
                    deshabilitadas según la documentación: los métodos se
                    administran directamente en base de datos.
                  </p>
                </div>

                <div className='space-y-4'>
                  <form
                    onSubmit={handleMethodSearchByCode}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Search className='w-4 h-4' />
                      Buscar por código
                    </div>
                    <input
                      type='text'
                      name='code'
                      value={methodSearchCode}
                      onChange={event =>
                        setMethodSearchCode(event.target.value.toUpperCase())
                      }
                      placeholder='Ej: CASH, CREDIT_CARD'
                      className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      aria-label='Código del método de pago'
                    />
                    <button
                      type='submit'
                      className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                      disabled={methodSearchLoading}
                    >
                      <Search className='w-4 h-4' />
                      Consultar /payment-methods/code
                    </button>
                  </form>

                  <form
                    onSubmit={handleMethodSearchById}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Search className='w-4 h-4' />
                      Buscar por ID
                    </div>
                    <input
                      type='number'
                      min='1'
                      name='id'
                      value={methodSearchId}
                      onChange={event => setMethodSearchId(event.target.value)}
                      placeholder='Ej: 5'
                      className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      aria-label='ID del método de pago'
                    />
                    <button
                      type='submit'
                      className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                      disabled={methodSearchLoading}
                    >
                      <Search className='w-4 h-4' />
                      {'Consultar /payment-methods/{id}'}
                    </button>
                  </form>

                  {methodSearchLoading ? (
                    <div className='border border-slate-200 rounded-lg p-4 text-sm text-slate-600 flex items-center gap-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Consultando endpoint…
                    </div>
                  ) : null}

                  {methodSearchError ? (
                    <div className='border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700'>
                      {methodSearchError}
                    </div>
                  ) : null}

                  {methodSearchResult ? (
                    <div className='border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-sm text-emerald-800 space-y-1'>
                      <p className='font-semibold'>Resultado</p>
                      <p>
                        <span className='font-medium'>ID:</span>{' '}
                        {methodSearchResult.id}
                      </p>
                      <p>
                        <span className='font-medium'>Código:</span>{' '}
                        {methodSearchResult.method_code}
                      </p>
                      <p>
                        <span className='font-medium'>Descripción:</span>{' '}
                        {methodSearchResult.description}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeSystemTab === 'currencies' ? (
            <SectionCard
              title='Gestión de Monedas'
              description='CRUD completo soportado por la API. Valida códigos ISO 4217 y evita eliminar monedas con referencias activas.'
              icon={Globe}
              className='shadow-md ring-1 ring-blue-100/40'
              actions={
                <button
                  type='button'
                  onClick={loadCurrencies}
                  disabled={currenciesLoading}
                  className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 disabled:opacity-70'
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      currenciesLoading ? 'animate-spin' : ''
                    }`}
                  />
                  Actualizar
                </button>
              }
              alert={
                <div className='px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-500'>
                  Recomendado: cachear el catálogo de monedas al iniciar la
                  aplicación y refrescar sólo cuando se cree o edite una moneda.
                </div>
              }
            >
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-2'>
                  <div className='border border-slate-200 rounded-lg overflow-hidden'>
                    <div className='bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-500 flex items-center justify-between'>
                      <span>Monedas registradas</span>
                      <span>
                        Base: {baseCurrency?.currency_code || 'No definida'}
                      </span>
                    </div>
                    <div className='max-h-80 overflow-y-auto'>
                      {currenciesLoading ? (
                        <EmptyState
                          icon={Loader2}
                          title='Cargando monedas'
                          description='Consultando /currencies'
                        />
                      ) : currencies.length === 0 ? (
                        <EmptyState
                          icon={AlertTriangle}
                          title='Sin monedas configuradas'
                          description='Registra al menos la moneda base antes de operar ventas.'
                        />
                      ) : (
                        <table className='min-w-full divide-y divide-slate-200 text-sm'>
                          <thead className='bg-white text-left text-xs uppercase tracking-wide text-slate-500'>
                            <tr>
                              <th className='px-4 py-3'>ID</th>
                              <th className='px-4 py-3'>Código</th>
                              <th className='px-4 py-3'>Nombre</th>
                              <th className='px-4 py-3'>Base</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-200 bg-white'>
                            {currencies.map(currency => (
                              <tr key={currency.id}>
                                <td className='px-4 py-3 font-mono text-xs text-slate-500'>
                                  {currency.id}
                                </td>
                                <td className='px-4 py-3 font-semibold text-slate-800'>
                                  {currency.currency_code}
                                </td>
                                <td className='px-4 py-3 text-slate-600'>
                                  {currency.currency_name || currency.name}
                                </td>
                                <td className='px-4 py-3'>
                                  {currency.is_base_currency ? (
                                    <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-md'>
                                      <ShieldCheck className='w-3 h-3' /> Base
                                    </span>
                                  ) : (
                                    <span className='text-xs text-slate-400'>
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>

                <div className='space-y-6'>
                  <form
                    onSubmit={handleCurrencyCreate}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Plus className='w-4 h-4' />
                      Crear moneda (POST /currencies)
                    </div>
                    <div className='space-y-2'>
                      <label className='block text-xs font-medium text-slate-500'>
                        Código ISO (3 letras)
                        <input
                          type='text'
                          name='currency_code'
                          value={currencyForm.currency_code}
                          onChange={handleCurrencyFormChange}
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                          placeholder='Ej: USD'
                          maxLength={3}
                          required
                        />
                      </label>
                      <label className='block text-xs font-medium text-slate-500'>
                        Nombre
                        <input
                          type='text'
                          name='currency_name'
                          value={currencyForm.currency_name}
                          onChange={handleCurrencyFormChange}
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                          placeholder='Ej: Dólar estadounidense'
                        />
                      </label>
                    </div>
                    <button
                      type='submit'
                      className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60'
                      disabled={currencyFormLoading}
                    >
                      {currencyFormLoading ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Plus className='w-4 h-4' />
                      )}
                      Registrar moneda
                    </button>
                  </form>

                  <form
                    onSubmit={handleCurrencyUpdate}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Edit3 className='w-4 h-4' />
                      Actualizar / Eliminar (PUT / DELETE)
                    </div>
                    <label className='block text-xs font-medium text-slate-500'>
                      Selecciona moneda
                      <select
                        value={editCurrencyId}
                        onChange={handleEditCurrencySelect}
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      >
                        <option value=''>---</option>
                        {currencies.map(currency => (
                          <option key={currency.id} value={currency.id}>
                            {currency.currency_code} •{' '}
                            {currency.currency_name || currency.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className='block text-xs font-medium text-slate-500'>
                      Código ISO
                      <input
                        type='text'
                        name='currency_code'
                        value={editCurrencyForm.currency_code}
                        onChange={handleEditCurrencyChange}
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        placeholder='Ej: EUR'
                        maxLength={3}
                        required
                      />
                    </label>
                    <label className='block text-xs font-medium text-slate-500'>
                      Nombre
                      <input
                        type='text'
                        name='currency_name'
                        value={editCurrencyForm.currency_name}
                        onChange={handleEditCurrencyChange}
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        placeholder='Ej: Euro'
                      />
                    </label>
                    <div className='flex items-center gap-3'>
                      <button
                        type='submit'
                        className='flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                        disabled={!editCurrencyId || editCurrencyLoading}
                      >
                        {editCurrencyLoading ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <Edit3 className='w-4 h-4' />
                        )}
                        Guardar cambios
                      </button>
                      <button
                        type='button'
                        onClick={handleCurrencyDelete}
                        className='inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60'
                        disabled={!editCurrencyId || editCurrencyLoading}
                      >
                        <Trash2 className='w-4 h-4' />
                        Eliminar
                      </button>
                    </div>
                  </form>

                  {currencyFormMessage ? (
                    <div
                      className={`border rounded-lg p-4 text-sm ${
                        currencyFormMessage.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {currencyFormMessage.text}
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeSystemTab === 'rates' ? (
            <SectionCard
              title='Tipos de Cambio'
              description='Gestión de histórico, últimos registros y carga diaria según PAYMENT.md.'
              icon={TrendingUp}
              className='shadow-md ring-1 ring-blue-100/40'
              actions={
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={loadLatestRates}
                    disabled={latestRatesLoading}
                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 disabled:opacity-70'
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        latestRatesLoading ? 'animate-spin' : ''
                      }`}
                    />
                    Actualizar últimos
                  </button>
                  <button
                    type='button'
                    onClick={() => loadEnrichedRates(enrichedRatesQuery)}
                    disabled={enrichedRatesLoading}
                    className='inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 disabled:opacity-70'
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        enrichedRatesLoading ? 'animate-spin' : ''
                      }`}
                    />
                    Actualizar listado
                  </button>
                </div>
              }
              alert={
                <div className='px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-500'>
                  ⚠️ Mejores prácticas: evitar modificar históricos; registrar
                  un nuevo tipo cuando se requiera corrección y documentar la
                  fuente (<code className='font-mono'>source</code>).
                </div>
              }
            >
              <div className='grid grid-cols-1 xl:grid-cols-5 gap-6'>
                <div className='xl:col-span-2 space-y-6'>
                  <div className='border border-slate-200 rounded-lg'>
                    <div className='bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2'>
                      <TrendingUp className='w-3.5 h-3.5' /> Últimos registros
                      por moneda (/exchange-rate/latest)
                    </div>
                    <div className='max-h-72 overflow-y-auto'>
                      {latestRatesLoading ? (
                        <EmptyState
                          icon={Loader2}
                          title='Cargando últimos tipos'
                          description='Esperando respuesta del endpoint /exchange-rate/latest'
                        />
                      ) : latestRates.length === 0 ? (
                        <EmptyState
                          icon={AlertTriangle}
                          title='Sin tipos de cambio'
                          description='Carga los tipos actuales antes de procesar ventas en moneda extranjera.'
                        />
                      ) : (
                        <table className='min-w-full divide-y divide-slate-200 text-sm'>
                          <thead className='bg-white text-left text-xs uppercase tracking-wide text-slate-500'>
                            <tr>
                              <th className='px-4 py-3'>Moneda</th>
                              <th className='px-4 py-3'>Tasa</th>
                              <th className='px-4 py-3'>Fuente</th>
                              <th className='px-4 py-3'>Fecha</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-200 bg-white'>
                            {latestRates.map(rate => (
                              <tr key={rate.id}>
                                <td className='px-4 py-3'>
                                  <p className='font-semibold text-slate-800'>
                                    {rate.currency_code}
                                  </p>
                                  <p className='text-xs text-slate-500'>
                                    {rate.currency_name}
                                  </p>
                                </td>
                                <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                                  {formatNumber(rate.rate_to_base)}
                                </td>
                                <td className='px-4 py-3 text-xs text-slate-500'>
                                  {rate.source || '—'}
                                </td>
                                <td className='px-4 py-3 text-xs text-slate-500'>
                                  {formatDate(rate.date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <form
                    onSubmit={handleRateCreate}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Plus className='w-4 h-4' />
                      Registrar tipo diario (POST /exchange-rate)
                    </div>
                    <label className='block text-xs font-medium text-slate-500'>
                      Moneda
                      <select
                        name='currency_id'
                        value={rateCreateForm.currency_id}
                        onChange={handleRateCreateChange}
                        required
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      >
                        <option value=''>Seleccionar…</option>
                        {nonBaseCurrencies.map(currency => (
                          <option key={currency.id} value={currency.id}>
                            {currency.currency_code} •{' '}
                            {currency.currency_name || currency.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className='block text-xs font-medium text-slate-500'>
                      Tasa (a moneda base)
                      <input
                        type='number'
                        step='0.000001'
                        min='0'
                        name='rate_to_base'
                        value={rateCreateForm.rate_to_base}
                        onChange={handleRateCreateChange}
                        required
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        placeholder='Ej: 7350.50'
                      />
                    </label>
                    <label className='block text-xs font-medium text-slate-500'>
                      Fecha de vigencia
                      <input
                        type='date'
                        name='date'
                        value={rateCreateForm.date}
                        onChange={handleRateCreateChange}
                        required
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                      />
                    </label>
                    <label className='block text-xs font-medium text-slate-500'>
                      Fuente (opcional)
                      <input
                        type='text'
                        name='source'
                        value={rateCreateForm.source}
                        onChange={handleRateCreateChange}
                        className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        placeholder='Ej: BCP, Manual'
                      />
                    </label>
                    <button
                      type='submit'
                      className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60'
                      disabled={rateCreateLoading}
                    >
                      {rateCreateLoading ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Plus className='w-4 h-4' />
                      )}
                      Guardar tipo de cambio
                    </button>
                    {rateCreateMessage ? (
                      <div
                        className={`text-xs mt-2 ${
                          rateCreateMessage.type === 'success'
                            ? 'text-emerald-700'
                            : 'text-red-600'
                        }`}
                      >
                        {rateCreateMessage.text}
                      </div>
                    ) : null}
                  </form>
                </div>

                <div className='xl:col-span-3 space-y-6'>
                  <form
                    onSubmit={handleRateByDateSubmit}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <Calendar className='w-4 h-4' />
                      {'Consulta puntual (/exchange-rate/currency/{id})'}
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <label className='block text-xs font-medium text-slate-500'>
                        Moneda
                        <select
                          name='currency_id'
                          value={rateByDateForm.currency_id}
                          onChange={handleRateByDateChange}
                          required
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        >
                          <option value=''>Seleccionar…</option>
                          {currencies.map(currency => (
                            <option key={currency.id} value={currency.id}>
                              {currency.currency_code}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className='block text-xs font-medium text-slate-500'>
                        Fecha (opcional)
                        <input
                          type='date'
                          name='date'
                          value={rateByDateForm.date}
                          onChange={handleRateByDateChange}
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        />
                      </label>
                      <div className='flex items-end'>
                        <button
                          type='submit'
                          className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                          disabled={rateByDateLoading}
                        >
                          {rateByDateLoading ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <Search className='w-4 h-4' />
                          )}
                          Consultar
                        </button>
                      </div>
                    </div>
                    {rateByDateError ? (
                      <div className='text-xs text-red-600'>
                        {rateByDateError}
                      </div>
                    ) : null}
                    {rateByDateResult ? (
                      <div className='mt-3 border border-emerald-200 bg-emerald-50 rounded-lg p-4 text-sm text-emerald-800 space-y-1'>
                        <p>
                          <span className='font-medium'>Tasa:</span>{' '}
                          {formatNumber(rateByDateResult.rate_to_base)}
                        </p>
                        <p>
                          <span className='font-medium'>Fecha efectiva:</span>{' '}
                          {formatDate(rateByDateResult.date)}
                        </p>
                        <p>
                          <span className='font-medium'>Fuente:</span>{' '}
                          {rateByDateResult.source || '—'}
                        </p>
                        <p className='text-xs text-emerald-700/80 mt-2'>
                          Si no se envía fecha, la API responde con el último
                          registro disponible.
                        </p>
                      </div>
                    ) : null}
                  </form>

                  <form
                    onSubmit={handleRateRangeSubmit}
                    className='border border-slate-200 rounded-lg p-4 space-y-3'
                  >
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase'>
                      <History className='w-4 h-4' />
                      {
                        'Histórico por rango (/exchange-rate/currency/{id}/range)'
                      }
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                      <label className='block text-xs font-medium text-slate-500 md:col-span-1'>
                        Moneda
                        <select
                          name='currency_id'
                          value={rateRangeForm.currency_id}
                          onChange={handleRateRangeChange}
                          required
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        >
                          <option value=''>Seleccionar…</option>
                          {currencies.map(currency => (
                            <option key={currency.id} value={currency.id}>
                              {currency.currency_code}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className='block text-xs font-medium text-slate-500 md:col-span-1'>
                        Fecha inicio
                        <input
                          type='date'
                          name='start_date'
                          value={rateRangeForm.start_date}
                          onChange={handleRateRangeChange}
                          required
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        />
                      </label>
                      <label className='block text-xs font-medium text-slate-500 md:col-span-1'>
                        Fecha fin
                        <input
                          type='date'
                          name='end_date'
                          value={rateRangeForm.end_date}
                          onChange={handleRateRangeChange}
                          required
                          className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                        />
                      </label>
                      <div className='flex items-end md:col-span-1'>
                        <button
                          type='submit'
                          className='w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60'
                          disabled={rateRangeLoading}
                        >
                          {rateRangeLoading ? (
                            <Loader2 className='w-4 h-4 animate-spin' />
                          ) : (
                            <Search className='w-4 h-4' />
                          )}
                          Consultar
                        </button>
                      </div>
                    </div>
                    {rateRangeError ? (
                      <div className='text-xs text-red-600'>
                        {rateRangeError}
                      </div>
                    ) : null}
                    {rateRangeResult.length > 0 ? (
                      <div className='mt-3 border border-slate-200 rounded-lg overflow-hidden'>
                        <table className='min-w-full divide-y divide-slate-200 text-xs'>
                          <thead className='bg-slate-50 text-slate-500 uppercase tracking-wide'>
                            <tr>
                              <th className='px-3 py-2 text-left'>Fecha</th>
                              <th className='px-3 py-2 text-left'>Tasa</th>
                              <th className='px-3 py-2 text-left'>Fuente</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-200 bg-white'>
                            {rateRangeResult.map(rate => (
                              <tr key={`${rate.id}-${rate.date}`}>
                                <td className='px-3 py-2 font-mono text-[11px] text-slate-500'>
                                  {formatDate(rate.date)}
                                </td>
                                <td className='px-3 py-2 font-semibold text-slate-800'>
                                  {formatNumber(rate.rate_to_base)}
                                </td>
                                <td className='px-3 py-2 text-slate-500'>
                                  {rate.source || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </form>

                  <div className='border border-slate-200 rounded-lg'>
                    <div className='bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs uppercase tracking-wide text-slate-500 flex items-center justify-between'>
                      <span>Listado paginado (/exchange-rate/enriched)</span>
                      <span className='text-[11px] text-slate-400'>
                        {enrichedRates.total} registros
                      </span>
                    </div>
                    <div className='overflow-x-auto'>
                      {enrichedRatesLoading ? (
                        <EmptyState
                          icon={Loader2}
                          title='Cargando historial'
                          description='Pagos /exchange-rate/enriched'
                        />
                      ) : enrichedRates.data.length === 0 ? (
                        <EmptyState
                          icon={AlertTriangle}
                          title='Sin registros'
                          description='Filtra por fecha o crea nuevas entradas para poblar el histórico.'
                        />
                      ) : (
                        <table className='min-w-full divide-y divide-slate-200 text-xs'>
                          <thead className='bg-white text-slate-500 uppercase tracking-wide'>
                            <tr>
                              <th className='px-4 py-2 text-left'>Moneda</th>
                              <th className='px-4 py-2 text-left'>Tasa</th>
                              <th className='px-4 py-2 text-left'>Fecha</th>
                              <th className='px-4 py-2 text-left'>Fuente</th>
                              <th className='px-4 py-2 text-left'>Creado</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-slate-200 bg-white'>
                            {enrichedRates.data.map(rate => (
                              <tr key={rate.id}>
                                <td className='px-4 py-2'>
                                  <p className='font-semibold text-slate-800'>
                                    {rate.currency_code}
                                  </p>
                                  <p className='text-[11px] text-slate-500'>
                                    {rate.currency_name}
                                  </p>
                                </td>
                                <td className='px-4 py-2 font-mono text-[11px] text-slate-600'>
                                  {formatNumber(rate.rate_to_base)}
                                </td>
                                <td className='px-4 py-2 text-[11px] text-slate-500'>
                                  {formatDate(rate.date)}
                                </td>
                                <td className='px-4 py-2 text-[11px] text-slate-500'>
                                  {rate.source || '—'}
                                </td>
                                <td className='px-4 py-2 text-[11px] text-slate-500'>
                                  {formatDate(rate.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div className='flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500'>
                      <div>
                        Página {enrichedRates.page} de{' '}
                        {enrichedRates.total_pages || 1}
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => handleRatesPageChange(-1)}
                          className='inline-flex items-center justify-center rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:opacity-50'
                          disabled={
                            enrichedRates.page <= 1 || enrichedRatesLoading
                          }
                          aria-label='Página anterior'
                        >
                          <ChevronLeft className='w-4 h-4' />
                        </button>
                        <button
                          type='button'
                          onClick={() => handleRatesPageChange(1)}
                          className='inline-flex items-center justify-center rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100 disabled:opacity-50'
                          disabled={
                            Boolean(
                              enrichedRates.total_pages &&
                                enrichedRates.page >= enrichedRates.total_pages
                            ) || enrichedRatesLoading
                          }
                          aria-label='Página siguiente'
                        >
                          <ChevronRight className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <footer className='mt-12 text-xs text-slate-400 border-t border-slate-200 pt-6'>
          <p>
            Referencia rápida • Endpoints base:{' '}
            <code className='font-mono'>GET /payment-methods</code>,{' '}
            <code className='font-mono'>CRUD /currencies</code>,{' '}
            <code className='font-mono'>CRUD /exchange-rate</code>.
          </p>
          <p className='mt-1'>
            Implementación alineada a la documentación PAYMENT.md v1.0
            (10/10/2025).
          </p>
        </footer>
      </div>
    </div>
  )
}

export default PaymentManagement
