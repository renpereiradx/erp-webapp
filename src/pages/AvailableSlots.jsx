import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import useAvailableSlotsStore from '@/store/useAvailableSlotsStore'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const DURATION_OPTIONS = [60, 90, 120]

const getTodayISODate = () => new Date().toISOString().split('T')[0]

const AvailableSlots = () => {
  const { t, lang } = useI18n()
  const products = useAvailableSlotsStore(state => state.products)
  const slots = useAvailableSlotsStore(state => state.slots)
  const loading = useAvailableSlotsStore(state => state.loading)
  const productsLoading = useAvailableSlotsStore(state => state.productsLoading)
  const error = useAvailableSlotsStore(state => state.error)
  const productsError = useAvailableSlotsStore(state => state.productsError)
  const fetchProducts = useAvailableSlotsStore(state => state.fetchProducts)
  const searchSlots = useAvailableSlotsStore(state => state.searchSlots)
  const clearError = useAvailableSlotsStore(state => state.clearError)

  const [filters, setFilters] = useState({
    productId: '',
    date: getTodayISODate(),
    duration: String(DURATION_OPTIONS[0]),
  })

  const autoSearchRef = useRef(false)

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [lang]
  )

  const formatSlotRange = useCallback(
    slot => {
      if (!slot?.start_time || !slot?.end_time) {
        return '—'
      }

      try {
        const startDate = new Date(slot.start_time)
        const endDate = new Date(slot.end_time)
        return `${timeFormatter.format(startDate)} - ${timeFormatter.format(
          endDate
        )}`
      } catch {
        return `${slot?.start_time ?? ''} - ${slot?.end_time ?? ''}`
      }
    },
    [timeFormatter]
  )

  useEffect(() => {
    fetchProducts().catch(() => {
      // El estado de error se maneja en el store
    })
  }, [fetchProducts])

  useEffect(() => {
    if (products.length > 0 && !filters.productId) {
      setFilters(prev => ({ ...prev, productId: String(products[0].id) }))
    }
  }, [products, filters.productId])

  useEffect(() => {
    if (
      autoSearchRef.current ||
      !filters.productId ||
      !filters.date ||
      products.length === 0
    ) {
      return
    }

    autoSearchRef.current = true
    searchSlots({
      productId: filters.productId,
      date: filters.date,
      duration: Number(filters.duration),
    })
  }, [filters, products.length, searchSlots])

  const handleSearch = useCallback(
    event => {
      event?.preventDefault()
      if (!filters.productId || !filters.date) {
        return
      }

      clearError()
      searchSlots({
        productId: filters.productId,
        date: filters.date,
        duration: Number(filters.duration),
      })
    },
    [filters, clearError, searchSlots]
  )

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  const renderResults = () => {
    if (loading) {
      return (
        <DataState
          variant='loading'
          skeletonVariant='list'
          skeletonProps={{ count: 4 }}
          testId='available-slots-loading'
        />
      )
    }

    if (error) {
      return (
        <DataState
          variant='error'
          title={t('availableSlots.error.title')}
          message={error || t('availableSlots.error.generic')}
          onRetry={handleSearch}
          testId='available-slots-error'
        />
      )
    }

    if (!slots.length) {
      return (
        <DataState
          variant='empty'
          title={t('availableSlots.empty.title')}
          description={t('availableSlots.empty.message')}
          testId='available-slots-empty'
        />
      )
    }

    return (
      <div className='available-slots__grid' role='list'>
        {slots.map(slot => (
          <div
            key={slot.id}
            className='available-slots__slot-card'
            role='listitem'
          >
            <p className='available-slots__slot-time'>
              {formatSlotRange(slot)}
            </p>
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='available-slots__reserve-button'
            >
              {t('availableSlots.action.reserve')}
            </Button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='available-slots'>
      <div className='available-slots__container'>
        <div className='available-slots__header'>
          <h1 className='available-slots__title'>
            {t('availableSlots.title')}
          </h1>
          <p className='available-slots__description'>
            {t('availableSlots.description')}
          </p>
        </div>

        {!!productsError && (
          <Alert variant='destructive'>
            <AlertTitle>{t('availableSlots.error.products')}</AlertTitle>
            <AlertDescription>{productsError}</AlertDescription>
          </Alert>
        )}

        <form className='available-slots__filters' onSubmit={handleSearch}>
          <div className='available-slots__filters-grid'>
            <label className='available-slots__filter-group'>
              <span className='available-slots__label'>
                {t('availableSlots.filter.product')}
              </span>
              <Select
                value={filters.productId}
                onValueChange={value => handleFilterChange('productId', value)}
                disabled={productsLoading || !products.length}
              >
                <SelectTrigger className='available-slots__input-field'>
                  <SelectValue
                    placeholder={t('availableSlots.filter.productPlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent className='available-slots__select-content'>
                  {products.map(product => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className='available-slots__filter-group'>
              <span className='available-slots__label'>
                {t('availableSlots.filter.date')}
              </span>
              <div className='available-slots__input-wrapper'>
                <Input
                  type='date'
                  name='available-slot-date'
                  value={filters.date}
                  min={getTodayISODate()}
                  onChange={event =>
                    handleFilterChange('date', event.target.value)
                  }
                  aria-label={t('availableSlots.filter.date')}
                  className='available-slots__input-field'
                />
                <div className='available-slots__input-icon' aria-hidden='true'>
                  <CalendarDays className='size-4' />
                </div>
              </div>
            </label>

            <label className='available-slots__filter-group'>
              <span className='available-slots__label'>
                {t('availableSlots.filter.duration')}
              </span>
              <Select
                value={filters.duration}
                onValueChange={value => handleFilterChange('duration', value)}
              >
                <SelectTrigger className='available-slots__input-field'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='available-slots__select-content'>
                  {DURATION_OPTIONS.map(option => (
                    <SelectItem key={option} value={String(option)}>
                      {t('availableSlots.filter.durationOption', {
                        minutes: option,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className='available-slots__actions'>
            <Button
              type='submit'
              variant='outline'
              size='lg'
              disabled={loading || productsLoading || !filters.productId}
              className='available-slots__search-button'
            >
              <span className='available-slots__search-icon' aria-hidden='true'>
                <Search className='size-4' />
              </span>
              <span>{t('availableSlots.action.search')}</span>
            </Button>
          </div>
        </form>

        <div className='available-slots__results' aria-live='polite'>
          <h2 className='available-slots__results-title'>
            {t('availableSlots.results.title')}
          </h2>
          {renderResults()}
        </div>
      </div>
    </div>
  )
}

export default AvailableSlots
