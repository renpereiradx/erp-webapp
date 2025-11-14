import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { purchasePaymentsMvpService } from '@/services/purchasePaymentsMvpService'

const buildFilters = (overrides = {}) => ({
  search: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
  ...overrides,
})

const buildMeta = (overrides = {}) => ({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
  ...overrides,
})

const usePurchasePaymentsMvpStore = create(
  devtools(
    (set, get) => ({
      orders: [],
      filters: buildFilters(),
      appliedFilters: buildFilters(),
      meta: buildMeta(),
      statuses: [],
      loading: false,
      error: null,

      updateFilters: updates =>
        set(state => ({
          filters: buildFilters({ ...state.filters, ...updates }),
        })),

      clearError: () => set({ error: null }),

      fetchOrders: async (options = {}) => {
        const state = get()
        const page = options.page ?? state.meta.page ?? 1
        const pageSize = options.pageSize ?? state.meta.pageSize ?? 10
        const filters = options.filters
          ? buildFilters(options.filters)
          : state.appliedFilters

        set({ loading: true, error: null })

        try {
          const response = await purchasePaymentsMvpService.fetchOrders({
            page,
            pageSize,
            search: filters.search,
            status: filters.status,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          })

          set({
            orders: response.data ?? [],
            meta: buildMeta({
              page: response.meta?.page ?? page,
              pageSize: response.meta?.pageSize ?? pageSize,
              total: response.meta?.total ?? response.data?.length ?? 0,
              totalPages: response.meta?.totalPages ?? 1,
            }),
            statuses: response.statuses ?? state.statuses,
            loading: false,
            error: null,
            appliedFilters: filters,
          })

          return response
        } catch (error) {
          set({
            loading: false,
            error: error?.message ?? 'Unable to load purchase payment orders',
          })
          throw error
        }
      },

      applyFilters: async () => {
        const filters = buildFilters(get().filters)
        set({ appliedFilters: filters })
        return get().fetchOrders({ page: 1, filters })
      },

      resetFilters: async () => {
        const filters = buildFilters()
        set({
          filters,
          appliedFilters: filters,
          meta: buildMeta({ page: 1 }),
        })
        return get().fetchOrders({ page: 1, filters })
      },

      changePage: async nextPage => get().fetchOrders({ page: nextPage }),

      refresh: async () => {
        const { meta } = get()
        return get().fetchOrders({ page: meta.page })
      },
    }),
    { name: 'purchase-payments-mvp-store' }
  )
)

export default usePurchasePaymentsMvpStore
