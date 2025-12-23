import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronDown, AlertCircle, Loader2, Search } from 'lucide-react'
import { CurrencyService } from '../../services/currencyService.js'

/**
 * Currency Selector Component
 * Allows users to select a currency from available options
 */
const CurrencySelector = ({
  value,
  onChange,
  placeholder = 'Seleccionar moneda...',
  disabled = false,
  showSearch = false,
  excludeBase = false,
  className = '',
  currencies: externalCurrencies,
  loading: externalLoading = false,
  error: externalError = null,
}) => {
  const [currencies, setCurrencies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const usesExternalData = typeof externalCurrencies !== 'undefined'

  // Si se pasan currencies desde el padre, usarlas
  const loadCurrencies = useCallback(async () => {
    if (usesExternalData) {
      return
    }
    try {
      setIsLoading(true)
      setError(null)

      const data = excludeBase
        ? await CurrencyService.getAllExceptBase()
        : await CurrencyService.getAll()

      setCurrencies(data)
    } catch (err) {
      console.error('Error loading currencies:', err)
      setError('Error al cargar las monedas')
    } finally {
      setIsLoading(false)
    }
  }, [excludeBase, usesExternalData])

  useEffect(() => {
    if (usesExternalData) {
      setCurrencies(externalCurrencies || [])
      setIsLoading(false)
      setError(externalError || null)
      return
    }
    loadCurrencies()
  }, [usesExternalData, externalCurrencies, externalError, loadCurrencies])

  // Filter currencies based on search term
  const resolvedCurrencies = useMemo(() => {
    return usesExternalData ? externalCurrencies || [] : currencies
  }, [usesExternalData, externalCurrencies, currencies])

  const resolvedLoading = usesExternalData ? externalLoading : isLoading
  const resolvedError = usesExternalData ? externalError : error

  const filteredCurrencies = resolvedCurrencies.filter(currency => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      currency.name?.toLowerCase().includes(searchLower) ||
      currency.currency_code?.toLowerCase().includes(searchLower)
    )
  })

  // Find selected currency - soporta tanto ID como currency_code
  const selectedCurrency = resolvedCurrencies.find(
    c =>
      (c.id != null && value != null && String(c.id) === String(value)) ||
      (c.currency_code &&
        value &&
        c.currency_code.toUpperCase() === String(value).toUpperCase())
  )

  const handleCurrencySelect = currency => {
    onChange(currency)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Usar loading externo si está disponible
  if (resolvedLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className='flex items-center justify-center p-3 border border-gray-300 rounded-md bg-gray-50'>
          <Loader2 className='w-4 h-4 animate-spin mr-2' />
          <span className='text-sm text-gray-600'>Cargando monedas...</span>
        </div>
      </div>
    )
  }

  if (resolvedError) {
    return (
      <div className={`relative ${className}`}>
        <div className='flex items-center p-3 border border-red-300 rounded-md bg-red-50'>
          <AlertCircle className='w-4 h-4 text-red-500 mr-2' />
          <span className='text-sm text-red-600'>{resolvedError}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main selector button */}
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full p-3 text-left border rounded-md bg-white flex items-center justify-between
          ${
            disabled
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
              : 'hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300'
          }
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className='flex items-center'>
          {selectedCurrency ? (
            <>
              <span className='inline-block w-8 h-5 mr-2 text-xs font-mono font-bold text-center text-white bg-blue-500 rounded'>
                {selectedCurrency.currency_code}
              </span>
              <span className='text-sm'>{selectedCurrency.name}</span>
            </>
          ) : (
            <span className='text-gray-500 text-sm'>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden'>
          {/* Search input */}
          {showSearch && (
            <div className='p-2 border-b border-gray-200'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Buscar moneda...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500'
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Currency options */}
          <div className='max-h-48 overflow-y-auto'>
            {filteredCurrencies.length === 0 ? (
              <div className='p-3 text-sm text-gray-500 text-center'>
                {searchTerm
                  ? 'No se encontraron monedas'
                  : 'No hay monedas disponibles'}
              </div>
            ) : (
              filteredCurrencies.map(currency => (
                <button
                  key={currency.id}
                  type='button'
                  onClick={() => handleCurrencySelect(currency)}
                  className={`
                    w-full p-3 text-left hover:bg-blue-50 flex items-center transition-colors
                    ${
                      selectedCurrency?.id === currency.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700'
                    }
                  `}
                >
                  <span className='inline-block w-8 h-5 mr-3 text-xs font-mono font-bold text-center text-white bg-blue-500 rounded'>
                    {currency.currency_code}
                  </span>
                  <span className='text-sm'>{currency.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

export default CurrencySelector
