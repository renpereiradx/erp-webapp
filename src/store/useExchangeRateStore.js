// ===========================================================================
// Exchange Rate Store - MVP Implementation
// Patrón: Zustand + DevTools según docs/GUIA_MVP_DESARROLLO.md
// API: Basado en docs/api/PAYMENT_CONFIG_API.md
// ===========================================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ExchangeRateService } from '@/services/exchangeRateService'
import { CurrencyService } from '@/services/currencyService'
import { telemetry } from '@/utils/telemetry'

const useExchangeRateStore = create()(
  devtools(
    (set, get) => ({
      // State
      exchangeRates: [],
      currencies: [],
      selectedRate: null,
      loading: false,
      error: null,

      // Filters
      filters: {
        searchTerm: '',
        currencyCode: '',
        dateFrom: '',
        dateTo: '',
        viewMode: 'latest', // 'latest' | 'historical'
      },

      // Pagination
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },

      // Actions - Basic
      clearError: () => set({ error: null }),
      setSelectedRate: rate => set({ selectedRate: rate }),
      clearSelectedRate: () => set({ selectedRate: null }),

      // Actions - Filters
      setFilter: (key, value) =>
        set(state => ({
          filters: { ...state.filters, [key]: value },
          pagination: { ...state.pagination, page: 1 }, // Reset page on filter change
        })),

      setViewMode: mode =>
        set(state => ({
          filters: { ...state.filters, viewMode: mode },
          pagination: { ...state.pagination, page: 1 },
        })),

      resetFilters: () =>
        set({
          filters: {
            searchTerm: '',
            currencyCode: '',
            dateFrom: '',
            dateTo: '',
            viewMode: 'latest',
          },
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        }),

      // Actions - Pagination
      setPage: page =>
        set(state => ({
          pagination: { ...state.pagination, page },
        })),

      // Fetch currencies for dropdown
      fetchCurrencies: async () => {
        try {
          const currencies = await CurrencyService.getAll()
          set({ currencies })
          return currencies
        } catch (error) {
          console.error('[ExchangeRateStore] Error fetching currencies:', error)
          return []
        }
      },

      // Fetch exchange rates with filters
      fetchExchangeRates: async () => {
        const startTime = Date.now()
        const { filters, pagination } = get()

        set({ loading: true, error: null })

        try {
          let rates = []

          if (filters.viewMode === 'latest') {
            // Get latest rates for all currencies
            rates = await ExchangeRateService.getLatestAll()
          } else {
            // Get historical rates with filters
            const query = {
              page: pagination.page,
              page_size: pagination.pageSize,
            }

            if (filters.currencyCode) {
              query.code = filters.currencyCode
            }

            if (filters.dateFrom) {
              query.from = filters.dateFrom
            }

            if (filters.dateTo) {
              query.to = filters.dateTo
            }

            rates = await ExchangeRateService.getAll(query)
          }

          // Apply local search filter if needed
          if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase()
            rates = rates.filter(
              rate =>
                rate.currency_code?.toLowerCase().includes(term) ||
                rate.currency_name?.toLowerCase().includes(term)
            )
          }

          set({
            exchangeRates: rates,
            loading: false,
            pagination: {
              ...pagination,
              total: rates.length,
              totalPages: Math.ceil(rates.length / pagination.pageSize),
            },
          })

          telemetry.record('feature.exchangeRates.load', {
            duration: Date.now() - startTime,
            count: rates.length,
            viewMode: filters.viewMode,
          })

          return rates
        } catch (error) {
          console.error(
            '[ExchangeRateStore] Error fetching exchange rates:',
            error
          )
          const errorMessage =
            error?.message || 'Error al cargar los tipos de cambio'

          set({ error: errorMessage, loading: false })

          telemetry.record('feature.exchangeRates.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      // Create exchange rate
      createExchangeRate: async data => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          const newRate = await ExchangeRateService.create(data)

          set(state => ({
            exchangeRates: [newRate, ...state.exchangeRates],
            loading: false,
          }))

          telemetry.record('feature.exchangeRates.create', {
            duration: Date.now() - startTime,
            currencyId: data.currency_id,
          })

          return newRate
        } catch (error) {
          console.error(
            '[ExchangeRateStore] Error creating exchange rate:',
            error
          )
          const errorMessage =
            error?.message || 'Error al crear el tipo de cambio'

          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // Update exchange rate
      updateExchangeRate: async (id, data) => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          const updatedRate = await ExchangeRateService.update(id, data)

          set(state => ({
            exchangeRates: state.exchangeRates.map(rate =>
              rate.id === id ? { ...rate, ...updatedRate } : rate
            ),
            selectedRate:
              state.selectedRate?.id === id
                ? { ...state.selectedRate, ...updatedRate }
                : state.selectedRate,
            loading: false,
          }))

          telemetry.record('feature.exchangeRates.update', {
            duration: Date.now() - startTime,
            rateId: id,
          })

          return updatedRate
        } catch (error) {
          console.error(
            '[ExchangeRateStore] Error updating exchange rate:',
            error
          )
          const errorMessage =
            error?.message || 'Error al actualizar el tipo de cambio'

          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // Delete exchange rate
      deleteExchangeRate: async id => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          await ExchangeRateService.delete(id)

          set(state => ({
            exchangeRates: state.exchangeRates.filter(rate => rate.id !== id),
            selectedRate:
              state.selectedRate?.id === id ? null : state.selectedRate,
            loading: false,
          }))

          telemetry.record('feature.exchangeRates.delete', {
            duration: Date.now() - startTime,
            rateId: id,
          })
        } catch (error) {
          console.error(
            '[ExchangeRateStore] Error deleting exchange rate:',
            error
          )
          const errorMessage =
            error?.message || 'Error al eliminar el tipo de cambio'

          set({ error: errorMessage, loading: false })
          throw error
        }
      },

      // Selectors
      getFilteredRates: () => {
        const { exchangeRates, filters, pagination } = get()
        let filtered = [...exchangeRates]

        // Apply search filter (already applied in fetchExchangeRates for API,
        // this is for local filtering when data is cached)
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase()
          filtered = filtered.filter(
            rate =>
              rate.currency_code?.toLowerCase().includes(term) ||
              rate.currency_name?.toLowerCase().includes(term)
          )
        }

        // Apply pagination locally
        const start = (pagination.page - 1) * pagination.pageSize
        const end = start + pagination.pageSize

        return filtered.slice(start, end)
      },

      getTotalPages: () => {
        const { exchangeRates, pagination } = get()
        return Math.ceil(exchangeRates.length / pagination.pageSize)
      },
    }),
    { name: 'ExchangeRateStore' }
  )
)

export default useExchangeRateStore
