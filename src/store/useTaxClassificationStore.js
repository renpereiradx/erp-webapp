import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { taxClassificationService } from '@/services/taxClassificationService'

const useTaxClassificationStore = create()(
  devtools(
    (set, get) => ({
      classificationsInfo: [],
      classificationsDefaults: [],
      loading: false,
      error: null,

      fetchInfo: async () => {
        set({ loading: true, error: null })
        try {
          const data = await taxClassificationService.getInfo()
          set({ classificationsInfo: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchDefaults: async () => {
        set({ loading: true, error: null })
        try {
          const data = await taxClassificationService.getDefaults()
          set({ classificationsDefaults: data, loading: false })
          return data
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      assignClassification: async (data) => {
        set({ loading: true, error: null })
        try {
          const result = await taxClassificationService.assign(data)
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      bulkAssignClassification: async (data) => {
        set({ loading: true, error: null })
        try {
          const result = await taxClassificationService.bulkAssign(data)
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      autoClassifyProducts: async () => {
        set({ loading: true, error: null })
        try {
          const result = await taxClassificationService.autoClassify()
          set({ loading: false })
          return result
        } catch (error) {
          set({ error: error.message, loading: false })
          throw error
        }
      }
    }),
    { name: 'TaxClassificationStore' }
  )
)

export default useTaxClassificationStore
