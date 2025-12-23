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
import availableSlotsService from '@/services/availableSlotsService'

// Solo horas completas: 1h, 2h, 3h, 4h, 5h, 6h, 7h, 8h (en minutos)
const DURATION_OPTIONS = [60, 120, 180, 240, 300, 360, 420, 480]

const AvailableSlots = ({ onReserveClick }) => {
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

  const autoSearchRef = useRef(false)
  const [allSlots, setAllSlots] = useState([])
  const [filteredSlots, setFilteredSlots] = useState([])

  const defaultSearchDate = useMemo(() => {
    return availableSlotsService.getDefaultSearchDate()
  }, [])

  const minimumSearchDate = useMemo(() => {
    return availableSlotsService.getMinimumSearchDate()
  }, [])

  const [filters, setFilters] = useState({
    productId: '',
    date: defaultSearchDate,
    duration: String(DURATION_OPTIONS[0]),
  })

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
        // Remover la 'Z' para que JavaScript interprete como hora local
        const startTimeLocal = slot.start_time.replace('Z', '')
        const endTimeLocal = slot.end_time.replace('Z', '')

        const startDate = new Date(startTimeLocal)
        const endDate = new Date(endTimeLocal)

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
    async event => {
      event?.preventDefault()
      if (!filters.productId || !filters.date) {
        return
      }

      clearError()

      // Buscar con la duración mínima (1 hora) para obtener todos los slots
      const result = await searchSlots({
        productId: filters.productId,
        date: filters.date,
        duration: 60, // Siempre buscar con 1 hora para obtener todos los slots
      })

      // Guardar todos los slots para filtrado dinámico
      if (result?.success && result?.data) {
        setAllSlots(result.data)
      }
    },
    [filters.productId, filters.date, clearError, searchSlots]
  )

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }, [])

  // Filtrar slots dinámicamente cuando cambia la duración
  useEffect(() => {
    if (allSlots.length === 0) {
      setFilteredSlots(slots)
      return
    }

    const durationMinutes = Number(filters.duration)
    const durationHours = durationMinutes / 60

    // Generar TODOS los slots posibles con la duración solicitada
    // No solo consecutivos, sino cada hora de inicio posible
    const newSlots = []

    // Crear un Set de horas disponibles para búsqueda rápida
    const availableHours = new Set()
    allSlots.forEach(slot => {
      const startDate = new Date(slot.start_time.replace('Z', ''))
      availableHours.add(startDate.getTime())
    })

    // Para cada slot de 1 hora, verificar si hay disponibilidad consecutiva
    // para la duración completa
    allSlots.forEach(slot => {
      const startDate = new Date(slot.start_time.replace('Z', ''))
      const startTimeMs = startDate.getTime()
      const oneHourMs = 60 * 60 * 1000

      // Verificar si todas las horas necesarias están disponibles
      let allHoursAvailable = true
      const slotsInRange = []

      for (let i = 0; i < durationHours; i++) {
        const checkTimeMs = startTimeMs + i * oneHourMs
        const slotInHour = allSlots.find(s => {
          const sTime = new Date(s.start_time.replace('Z', '')).getTime()
          return sTime === checkTimeMs
        })

        if (!slotInHour) {
          allHoursAvailable = false
          break
        }

        slotsInRange.push(slotInHour)
      }

      if (allHoursAvailable && slotsInRange.length > 0) {
        const endTimeMs = startTimeMs + durationMinutes * 60 * 1000
        const slotEnd = new Date(endTimeMs)

        // Formatear como ISO local (sin conversión UTC)
        const year = slotEnd.getFullYear()
        const month = String(slotEnd.getMonth() + 1).padStart(2, '0')
        const day = String(slotEnd.getDate()).padStart(2, '0')
        const hours = String(slotEnd.getHours()).padStart(2, '0')
        const minutes = String(slotEnd.getMinutes()).padStart(2, '0')
        const seconds = String(slotEnd.getSeconds()).padStart(2, '0')
        const endTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`

        // El slot combinado solo está disponible si TODOS los slots del rango están disponibles
        const isRangeAvailable = slotsInRange.every(s => s.is_available !== false)

        newSlots.push({
          id: null,
          product_id: slot.product_id,
          product_name: slot.product_name,
          start_time: slot.start_time, // Ya tiene formato correcto
          end_time: endTimeFormatted,
          duration_minutes: durationMinutes,
          available_consecutive_hours: durationHours,
          is_available: isRangeAvailable,
        })
      }
    })

    setFilteredSlots(newSlots)
  }, [filters.duration, allSlots, slots])

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

    const slotsToShow = filteredSlots.length > 0 ? filteredSlots : slots

    if (!slotsToShow.length) {
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
        {slotsToShow.map((slot, index) => {
          const isAvailable = slot.is_available !== false
          const uniqueKey = slot.id || `${slot.start_time}-${slot.end_time}-${index}`

          return (
            <div
              key={uniqueKey}
              className='available-slots__slot-card'
              role='listitem'
              style={{
                position: 'relative',
                backgroundColor: isAvailable ? '#ffffff' : '#f9fafb',
                borderColor: isAvailable ? '#e5e7eb' : '#e5e7eb',
                opacity: isAvailable ? 1 : 1,
                cursor: isAvailable ? 'default' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              {!isAvailable && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    color: '#dc2626',
                    backgroundColor: '#fee2e2',
                    borderRadius: '0.375rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em',
                    border: '1px solid #fecaca'
                  }}
                >
                  Reservado
                </div>
              )}
              <p
                className='available-slots__slot-time'
                style={{
                  color: isAvailable ? '#111827' : '#6b7280',
                  fontWeight: isAvailable ? '600' : '500'
                }}
              >
                {formatSlotRange(slot)}
              </p>
              {isAvailable && (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='available-slots__reserve-button'
                  onClick={() => {
                    if (onReserveClick) {
                      // Convertir duration de minutos a horas para la API
                      const durationInHours = slot.duration_minutes ? slot.duration_minutes / 60 : 1

                      // Encontrar el producto seleccionado para obtener su nombre
                      const selectedProduct = products.find(p => p.id === filters.productId)

                      onReserveClick({
                        product_id: filters.productId,
                        product_name: selectedProduct?.name || '',
                        start_time: slot.start_time,
                        duration: durationInHours,
                        date: filters.date
                      })
                    }
                  }}
                >
                  {t('availableSlots.action.reserve')}
                </Button>
              )}
            </div>
          )
        })}
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
                    <SelectItem
                      key={product.id}
                      value={String(product.id)}
                      className='available-slots__select-item'
                    >
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
                  value={filters.date}
                  min={minimumSearchDate}
                  onChange={event =>
                    handleFilterChange('date', event.target.value)
                  }
                  className='available-slots__input-field'
                />
                <span className='available-slots__input-icon'>
                  <CalendarDays className='size-4' aria-hidden='true' />
                </span>
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
                  {DURATION_OPTIONS.map(option => {
                    const hours = option / 60
                    return (
                      <SelectItem
                        key={option}
                        value={String(option)}
                        className='available-slots__select-item'
                      >
                        {hours === 1 ? '1 hora' : `${hours} horas`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className='available-slots__actions'>
            <Button
              type='submit'
              size='sm'
              disabled={loading || productsLoading || !filters.productId}
              className='available-slots__search-button'
            >
              <Search className='size-4' aria-hidden='true' />
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
