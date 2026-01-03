import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { PaymentBootstrapService } from '@/services/paymentBootstrapService'
import { CurrencyService } from '@/services/currencyService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { ExchangeRateService } from '@/services/exchangeRateService'
import { telemetry } from '@/utils/telemetry'

/**
 * Payment Bootstrap Store
 *
 * Manages the initialization of all payment-related data in a single call.
 * Uses the new /payments/bootstrap endpoint for optimal performance.
 * Falls back to individual service calls if bootstrap endpoint is unavailable.
 */
const usePaymentBootstrapStore = create()(
  devtools(
    (set, get) => ({
      // State
      currencies: [],
      paymentMethods: [],
      exchangeRates: {
        date: null,
        rates: [],
      },
      config: {
        base_currency_id: 1,
        base_currency_code: 'PYG',
        default_decimals: 0,
      },
      loading: false,
      error: null,
      initialized: false,
      lastFetchedAt: null,

      // Actions
      clearError: () => set({ error: null }),

      /**
       * Initialize all payment data via bootstrap endpoint
       * Falls back to individual calls if bootstrap fails
       */
      initialize: async (forceRefresh = false) => {
        const { initialized, loading, lastFetchedAt } = get()

        // Skip if already initialized and not forcing refresh
        if (initialized && !forceRefresh && !loading) {
          // Check if data is stale (older than 5 minutes)
          const STALE_TIME = 5 * 60 * 1000 // 5 minutes
          if (lastFetchedAt && Date.now() - lastFetchedAt < STALE_TIME) {
            return get()
          }
        }

        if (loading) {
          return get()
        }

        const startTime = Date.now()
        set({ loading: true, error: null })

        try {
          // Try bootstrap endpoint first
          const bootstrapData = await PaymentBootstrapService.getBootstrap()

          set({
            currencies: bootstrapData.currencies || [],
            paymentMethods: bootstrapData.payment_methods || [],
            exchangeRates: bootstrapData.exchange_rates || {
              date: null,
              rates: [],
            },
            config: bootstrapData.config || {
              base_currency_id: 1,
              base_currency_code: 'PYG',
              default_decimals: 0,
            },
            loading: false,
            initialized: true,
            lastFetchedAt: Date.now(),
          })

          telemetry.record('feature.payment.bootstrap', {
            duration: Date.now() - startTime,
            source: 'bootstrap',
            currencyCount: bootstrapData.currencies?.length || 0,
            methodCount: bootstrapData.payment_methods?.length || 0,
          })

          return get()
        } catch (bootstrapError) {
          console.warn(
            '[PaymentBootstrapStore] Bootstrap endpoint failed, falling back to individual calls:',
            bootstrapError
          )

          // Fallback to individual service calls
          return get().initializeFallback(startTime)
        }
      },

      /**
       * Fallback initialization using individual service calls
       */
      initializeFallback: async (startTime = Date.now()) => {
        try {
          const [currencies, paymentMethods, exchangeRates] = await Promise.all(
            [
              CurrencyService.getAll().catch(e => {
                console.warn(
                  '[PaymentBootstrapStore] Failed to load currencies:',
                  e
                )
                return []
              }),
              PaymentMethodService.getAll().catch(e => {
                console.warn(
                  '[PaymentBootstrapStore] Failed to load payment methods:',
                  e
                )
                return []
              }),
              ExchangeRateService.getLatestAll().catch(e => {
                console.warn(
                  '[PaymentBootstrapStore] Failed to load exchange rates:',
                  e
                )
                return []
              }),
            ]
          )

          // Find base currency
          const baseCurrency = currencies.find(
            c => c.is_base || c.is_base_currency
          )

          set({
            currencies,
            paymentMethods,
            exchangeRates: {
              date: new Date().toISOString().split('T')[0],
              rates: exchangeRates.map(r => ({
                currency_id: r.currency_id,
                currency_code: r.currency_code,
                rate_to_base: r.rate_to_base,
              })),
            },
            config: {
              base_currency_id: baseCurrency?.id || 1,
              base_currency_code: baseCurrency?.currency_code || 'PYG',
              default_decimals: baseCurrency?.decimal_places || 0,
            },
            loading: false,
            initialized: true,
            lastFetchedAt: Date.now(),
          })

          telemetry.record('feature.payment.bootstrap', {
            duration: Date.now() - startTime,
            source: 'fallback',
            currencyCount: currencies.length,
            methodCount: paymentMethods.length,
          })

          return get()
        } catch (error) {
          console.error(
            '[PaymentBootstrapStore] Fallback initialization failed:',
            error
          )

          const errorMessage =
            error?.message || 'Error al inicializar datos de pago'
          set({
            error: errorMessage,
            loading: false,
            initialized: false,
          })

          telemetry.record('feature.payment.bootstrap.error', {
            duration: Date.now() - startTime,
            error: errorMessage,
          })

          throw error
        }
      },

      /**
       * Refresh all payment data
       */
      refresh: async () => {
        return get().initialize(true)
      },

      // Selectors
      getBaseCurrency: () => {
        const { currencies, config } = get()
        return currencies.find(c => c.id === config.base_currency_id) || null
      },

      getCurrencyByCode: code => {
        const { currencies } = get()
        return (
          currencies.find(c => c.currency_code === code || c.code === code) ||
          null
        )
      },

      getCurrencyById: id => {
        const { currencies } = get()
        return currencies.find(c => c.id === id) || null
      },

      getExchangeRate: currencyCode => {
        const { exchangeRates } = get()
        return (
          exchangeRates.rates.find(r => r.currency_code === currencyCode) ||
          null
        )
      },

      getPaymentMethodByCode: code => {
        const { paymentMethods } = get()
        return paymentMethods.find(m => m.method_code === code) || null
      },

      getPaymentMethodById: id => {
        const { paymentMethods } = get()
        return paymentMethods.find(m => m.id === id) || null
      },

      /**
       * Get all non-base currencies
       */
      getForeignCurrencies: () => {
        const { currencies, config } = get()
        return currencies.filter(c => c.id !== config.base_currency_id)
      },

      /**
       * Check if data is stale
       */
      isStale: () => {
        const { lastFetchedAt } = get()
        if (!lastFetchedAt) return true
        const STALE_TIME = 5 * 60 * 1000 // 5 minutes
        return Date.now() - lastFetchedAt > STALE_TIME
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set({
          currencies: [],
          paymentMethods: [],
          exchangeRates: { date: null, rates: [] },
          config: {
            base_currency_id: 1,
            base_currency_code: 'PYG',
            default_decimals: 0,
          },
          loading: false,
          error: null,
          initialized: false,
          lastFetchedAt: null,
        })
      },
    }),
    { name: 'PaymentBootstrapStore' }
  )
)

export default usePaymentBootstrapStore
