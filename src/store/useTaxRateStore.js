import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { taxRateService } from '@/services/taxRateService'
import {
  DEFAULT_VAT_PERCENT,
  normalizeTaxRatePercent,
} from '@/domain/tax/resolveApplicableRate'

/**
 * System default VAT rate (percent), backed by the cached backend default
 * (`GET /tax_rate/default`) with a sane offline fallback (IVA 10%, Paraguay).
 * Shared by cart calculators to keep displayed totals aligned with the
 * server-side liquidation.
 */
export const getDefaultVatPercent = () => {
  const stored = useTaxRateStore.getState().defaultTaxRate
  return normalizeTaxRatePercent(stored?.rate) ?? DEFAULT_VAT_PERCENT
}

const useTaxRateStore = create()(
  devtools(
    (set, get) => ({
      taxRates: [],
      defaultTaxRate: null,
      loading: false,
      error: null,

      fetchTaxRates: async (page = 1, pageSize = 50) => {
        set({ loading: true, error: null })
        try {
          const data = await taxRateService.getPaginated(page, pageSize)
          set({ taxRates: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchDefaultTaxRate: async () => {
        try {
          const data = await taxRateService.getDefault()
          set({ defaultTaxRate: data })
          return data
        } catch (error) {
          console.error('Error fetching default tax rate:', error)
        }
      },

      createTaxRate: async (taxRateData) => {
        set({ loading: true, error: null })
        try {
          const result = await taxRateService.create(taxRateData)
          await get().fetchTaxRates()
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      updateTaxRate: async (id, taxRateData) => {
        set({ loading: true, error: null })
        try {
          const result = await taxRateService.update(id, taxRateData)
          await get().fetchTaxRates()
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      deleteTaxRate: async (id) => {
        set({ loading: true, error: null })
        try {
          await taxRateService.delete(id)
          await get().fetchTaxRates()
          set({ loading: false })
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      }
    }),
    { name: 'TaxRateStore' }
  )
)

export default useTaxRateStore
