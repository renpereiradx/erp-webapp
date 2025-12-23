import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { availableSlotsService } from '@/services/availableSlotsService'
import { telemetry } from '@/utils/telemetry'

const useAvailableSlotsStore = create(
  devtools(
    set => ({
      products: [],
      slots: [],
      loading: false,
      productsLoading: false,
      error: null,
      productsError: null,
      lastQuery: null,

      fetchProducts: async () => {
        set({ productsLoading: true, productsError: null })
        const timer = telemetry.startTimer(
          'feature.availableSlots.products.fetch'
        )

        try {
          const response = await availableSlotsService.getReservableProducts()
          const data = response?.data ?? []

          telemetry.record('feature.availableSlots.products.load', {
            duration: telemetry.endTimer(timer, { count: data.length }),
            count: data.length,
          })

          set({ products: data, productsLoading: false })
          return data
        } catch (error) {
          telemetry.record('feature.availableSlots.products.error', {
            duration: telemetry.endTimer(timer, { error: error?.message }),
            error: error?.message,
          })

          set({
            productsError: error?.message || 'Error al cargar productos',
            productsLoading: false,
          })
          throw error
        }
      },

      searchSlots: async ({ productId, date, duration }) => {
        if (!productId || !date) {
          const message = 'Filtros incompletos para la búsqueda'
          set({ error: message })
          return { success: false, error: message }
        }

        set({ loading: true, error: null })
        const timer = telemetry.startTimer('feature.availableSlots.search')

        try {
          const response = await availableSlotsService.searchAvailableSlots({
            productId,
            date,
            duration,
          })
          const data = response?.data ?? []
          const durationMs = telemetry.endTimer(timer, { count: data.length })

          telemetry.record('feature.availableSlots.search.success', {
            duration: durationMs,
            count: data.length,
          })

          set({
            slots: data,
            loading: false,
            lastQuery: { productId, date, duration },
          })

          return { success: true, data }
        } catch (error) {
          const durationMs = telemetry.endTimer(timer, {
            error: error?.message,
          })

          telemetry.record('feature.availableSlots.search.error', {
            duration: durationMs,
            error: error?.message,
          })

          set({
            error: error?.message || 'Error al buscar horarios',
            loading: false,
          })

          return { success: false, error: error?.message }
        }
      },

      clearError: () => set({ error: null, productsError: null }),
      clearSlots: () => set({ slots: [], lastQuery: null }),
    }),
    {
      name: 'available-slots-store',
    }
  )
)

export default useAvailableSlotsStore
