import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { purchasePaymentsMvpService } from '@/services/purchasePaymentsMvpService'
import { telemetry } from '@/utils/telemetry'

const DEFAULT_PAGE_SIZE = 10

const defaultFilters = {
  search: '',
  supplierId: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  pendingOnly: false,
}

const defaultMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
}

export const usePurchasePaymentsMvpStore = create()(
  devtools((set, get) => ({
    orders: [],
    filters: { ...defaultFilters },
    meta: { ...defaultMeta },
    suppliers: [],
    statuses: [],
    loading: false,
    error: null,

    updateFilters: partial => {
      set(state => ({ filters: { ...state.filters, ...partial } }))
    },

    resetFilters: async () => {
      set({ filters: { ...defaultFilters }, meta: { ...defaultMeta } })
      await get().fetchOrders({ ...defaultFilters, page: 1 })
    },

    clearError: () => set({ error: null }),

    fetchOrders: async (overrides = {}) => {
      const state = get()
      const activeFilters = { ...state.filters, ...overrides }

      const {
        page = state.meta.page,
        pageSize = state.meta.pageSize,
        ...filterParams
      } = { ...activeFilters }

      set({ loading: true, error: null })

      try {
        const result = await purchasePaymentsMvpService.search({
          ...filterParams,
          page,
          pageSize,
        })
        const orders = Array.isArray(result.data) ? result.data : []

        const meta = {
          page: result.meta?.page ?? page,
          pageSize: result.meta?.pageSize ?? pageSize,
          total: result.meta?.total ?? orders.length,
          totalPages:
            result.meta?.totalPages ??
            Math.max(
              1,
              Math.ceil(
                (result.meta?.total ?? orders.length) /
                  (result.meta?.pageSize ?? pageSize)
              )
            ),
        }

        const suppliers = Array.isArray(result.filters?.suppliers)
          ? result.filters.suppliers
          : []

        const statuses = Array.isArray(result.filters?.statuses)
          ? result.filters.statuses
          : []

        telemetry.record('feature.purchasePaymentsMvp.load.success', {
          count: orders.length,
          page: meta.page,
        })

        set({
          orders,
          filters: {
            ...state.filters,
            ...filterParams,
          },
          meta,
          suppliers,
          statuses,
          loading: false,
        })

        return orders
      } catch (error) {
        telemetry.record('feature.purchasePaymentsMvp.load.failure', {
          message: error?.message,
        })

        set({
          loading: false,
          error: error?.message || 'Error al cargar órdenes de compra',
        })

        throw error
      }
    },

    applyFilters: async () => {
      await get().fetchOrders({ page: 1 })
    },

    changePage: async page => {
      if (!Number.isFinite(page) || page < 1) return
      await get().fetchOrders({ page })
    },

    setPageSize: async pageSize => {
      if (!Number.isFinite(pageSize) || pageSize <= 0) return
      await get().fetchOrders({ page: 1, pageSize })
    },

    refresh: async () => {
      const { meta } = get()
      await get().fetchOrders({ page: meta.page })
    },
  })),
  { name: 'purchase-payments-mvp-store' }
)

export default usePurchasePaymentsMvpStore
