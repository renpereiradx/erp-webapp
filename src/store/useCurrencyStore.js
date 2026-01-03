import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { CurrencyService } from '@/services/currencyService'
import { telemetry } from '@/utils/telemetry'
import {
  DEMO_CONFIG_CURRENCIES,
  getDemoCurrencies,
  createDemoCurrency,
  updateDemoCurrency,
  deleteDemoCurrency,
} from '@/config/demoData'

const useCurrencyStore = create()(
  devtools(
    (set, get) => ({
      // Estado
      currencies: [],
      selectedCurrency: null,
      loading: false,
      error: null,
      searchTerm: '',
      filter: 'all', // 'all' | 'enabled' | 'disabled'

      // Acciones básicas
      clearError: () => set({ error: null }),
      setSearchTerm: term => set({ searchTerm: term }),
      setFilter: filter => set({ filter }),
      setSelectedCurrency: currency => set({ selectedCurrency: currency }),
      clearSelectedCurrency: () => set({ selectedCurrency: null }),

      // Selectores computados
      getFilteredCurrencies: () => {
        const { currencies, searchTerm, filter } = get()
        let filtered = currencies

        // Filtro por búsqueda
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim()
          filtered = filtered.filter(
            c =>
              c.currency_code?.toLowerCase().includes(term) ||
              c.currency_name?.toLowerCase().includes(term) ||
              c.name?.toLowerCase().includes(term)
          )
        }

        // Filtro por estado
        if (filter === 'enabled') {
          filtered = filtered.filter(c => c.is_enabled !== false)
        } else if (filter === 'disabled') {
          filtered = filtered.filter(c => c.is_enabled === false)
        }

        return filtered
      },

      // Fetch currencies
      fetchCurrencies: async () => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          // Demo mode fallback
          if (DEMO_CONFIG_CURRENCIES?.enabled) {
            const demoCurrencies = getDemoCurrencies()
            set({ currencies: demoCurrencies, loading: false })
            telemetry.record('feature.currencies.load', {
              duration: Date.now() - startTime,
              count: demoCurrencies.length,
              source: 'demo',
            })
            return demoCurrencies
          }

          const data = await CurrencyService.getAll()
          set({ currencies: data, loading: false })

          telemetry.record('feature.currencies.load', {
            duration: Date.now() - startTime,
            count: data.length,
            source: 'api',
          })

          return data
        } catch (error) {
          console.error('[CurrencyStore] Error fetching currencies:', error)

          // Fallback a demo si está configurado
          if (DEMO_CONFIG_CURRENCIES?.fallbackOnError) {
            const demoCurrencies = getDemoCurrencies()
            set({
              currencies: demoCurrencies,
              loading: false,
              error: null,
            })
            return demoCurrencies
          }

          const errorMessage = error?.message || 'Error al cargar las monedas'
          set({ error: errorMessage, loading: false })

          telemetry.record('feature.currencies.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      // Create currency
      createCurrency: async currencyData => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          // Demo mode
          if (DEMO_CONFIG_CURRENCIES?.enabled) {
            const newCurrency = createDemoCurrency(currencyData)
            set(state => ({
              currencies: [...state.currencies, newCurrency],
              loading: false,
            }))
            telemetry.record('feature.currencies.create', {
              duration: Date.now() - startTime,
              source: 'demo',
            })
            return newCurrency
          }

          const newCurrency = await CurrencyService.create(currencyData)
          set(state => ({
            currencies: [...state.currencies, newCurrency],
            loading: false,
          }))

          telemetry.record('feature.currencies.create', {
            duration: Date.now() - startTime,
            source: 'api',
          })

          return newCurrency
        } catch (error) {
          console.error('[CurrencyStore] Error creating currency:', error)
          const errorMessage = error?.message || 'Error al crear la moneda'
          set({ error: errorMessage, loading: false })

          telemetry.record('feature.currencies.create.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      // Update currency
      updateCurrency: async (id, currencyData) => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          // Demo mode
          if (DEMO_CONFIG_CURRENCIES?.enabled) {
            const updated = updateDemoCurrency(id, currencyData)
            set(state => ({
              currencies: state.currencies.map(c =>
                c.id === id ? { ...c, ...updated } : c
              ),
              selectedCurrency:
                state.selectedCurrency?.id === id
                  ? { ...state.selectedCurrency, ...updated }
                  : state.selectedCurrency,
              loading: false,
            }))
            telemetry.record('feature.currencies.update', {
              duration: Date.now() - startTime,
              source: 'demo',
            })
            return updated
          }

          const updated = await CurrencyService.update(id, currencyData)
          set(state => ({
            currencies: state.currencies.map(c =>
              c.id === id ? { ...c, ...updated } : c
            ),
            selectedCurrency:
              state.selectedCurrency?.id === id
                ? { ...state.selectedCurrency, ...updated }
                : state.selectedCurrency,
            loading: false,
          }))

          telemetry.record('feature.currencies.update', {
            duration: Date.now() - startTime,
            source: 'api',
          })

          return updated
        } catch (error) {
          console.error('[CurrencyStore] Error updating currency:', error)
          const errorMessage = error?.message || 'Error al actualizar la moneda'
          set({ error: errorMessage, loading: false })

          telemetry.record('feature.currencies.update.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      // Delete currency
      deleteCurrency: async id => {
        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          // Demo mode
          if (DEMO_CONFIG_CURRENCIES?.enabled) {
            deleteDemoCurrency(id)
            set(state => ({
              currencies: state.currencies.filter(c => c.id !== id),
              selectedCurrency:
                state.selectedCurrency?.id === id
                  ? null
                  : state.selectedCurrency,
              loading: false,
            }))
            telemetry.record('feature.currencies.delete', {
              duration: Date.now() - startTime,
              source: 'demo',
            })
            return true
          }

          await CurrencyService.delete(id)
          set(state => ({
            currencies: state.currencies.filter(c => c.id !== id),
            selectedCurrency:
              state.selectedCurrency?.id === id ? null : state.selectedCurrency,
            loading: false,
          }))

          telemetry.record('feature.currencies.delete', {
            duration: Date.now() - startTime,
            source: 'api',
          })

          return true
        } catch (error) {
          console.error('[CurrencyStore] Error deleting currency:', error)
          const errorMessage = error?.message || 'Error al eliminar la moneda'
          set({ error: errorMessage, loading: false })

          telemetry.record('feature.currencies.delete.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      // Toggle currency status
      toggleCurrencyStatus: async id => {
        const { currencies } = get()
        const currency = currencies.find(c => c.id === id)
        if (!currency) return

        const newStatus = !currency.is_enabled
        return get().updateCurrency(id, { is_enabled: newStatus })
      },
    }),
    { name: 'CurrencyStore' }
  )
)

export default useCurrencyStore
