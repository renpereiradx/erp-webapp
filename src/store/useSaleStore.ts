import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import saleService from '@/services/saleService'
import { telemetryService } from '@/services/telemetryService'
import { normalizeSalePriceGs } from '@/domain/sale/pricing/salesPricingPolicy'
import {
  calculateSaleTotals,
  applyGeneralDiscount,
} from '@/domain/sale/calculations/saleCalculator'
import { resolveApplicableRateFraction } from '@/domain/tax/resolveApplicableRate'
import { getDefaultVatPercent } from '@/store/useTaxRateStore'
import { 
  SaleEnhancedResponse, 
  SaleMetadata,
  PaginationState 
} from '@/types'

interface SaleState {
  sales: any[];
  currentSale: SaleEnhancedResponse | null;
  currentSaleMetadata: SaleMetadata | null;
  saleItems: any[];
  loading: boolean;
  error: string | null;
  paymentInProgress: boolean;
  paymentResult: any | null;
  changeCalculation: any | null;
  filters: {
    page: number;
    limit: number;
    clientId: string;
    dateFrom: string;
    dateTo: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  pagination: PaginationState;
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalRevenue: number;
    todayRevenue: number;
    averageOrderValue: number;
    topSellingProducts: any[];
  };
  pendingSales: any[];
  pendingSalesLoading: boolean;
  pendingSalesError: string | null;
  currentSaleData: {
    clientId: string | null;
    sessionId: string | null;
    items: any[];
    totalAmount: number;
    subtotalAmount: number;
    taxAmount: number;
    iva10: number;
    iva5: number;
    exento: number;
    discountAmount: number;
    notes: string;
    paymentMethod: string;
    amountPaid: number;
    changeAmount: number;
    posTerminalId: string;
  };

  // Actions
  processPayment: (saleId: string, paymentData: any) => Promise<any>;
  calculateChange: (totalAmount: number, amountPaid: number) => Promise<any>;
  fetchSales: (params?: any) => Promise<any>;
  fetchSalesByDateRange: (params?: any) => Promise<any>;
  fetchSalesByClientName: (clientName: string, params?: any) => Promise<any>;
  clearSales: () => void;
  clearCurrentSaleMetadata: () => void;
  fetchPendingSalesByClient: (clientId: string) => Promise<any>;
  clearPendingSales: () => void;
  fetchSaleById: (id: string) => Promise<any>;
  fetchSaleMetadata: (id: string) => Promise<any>;
  fetchSalePaymentStatus: (id: string) => Promise<any>;
  addProductsToSale: (saleId: string, payload: any) => Promise<any>;
  createSale: (saleData?: any) => Promise<any>;
  cancelSale: (id: string, reason?: string) => Promise<any>;
  completeSale: (id: string, paymentData?: any) => Promise<any>;
  fetchTodaySales: () => Promise<any>;
  calculateTotal: (items: any[], clientId?: string | null) => Promise<any>;
  setCurrentSaleClient: (clientId: string | null) => void;
  setPaymentMethod: (method: string) => void;
  addItemToCurrentSale: (product: any, quantity?: number) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItemFromCurrentSale: (itemId: string) => void;
  applyDiscount: (amount: number) => void;
  setNotes: (notes: string) => void;
  clearCurrentSale: () => void;
  updateStats: () => void;
  setFilters: (newFilters: any) => void;
  resetFilters: () => void;
  clearError: () => void;
  clearCurrentSaleEntity: () => void;
  clearPaymentResult: () => void;
  clearPendingSalesError: () => void;
}

const getSaleIdentifier = (sale: any) =>
  sale?.sale_id || sale?.id || sale?.saleId || null

const normalizeStorePagination = (rawPagination: any, fallbackCount = 0): PaginationState => {
  const totalRecords = Number(
    rawPagination?.total_records ??
      rawPagination?.totalRecords ??
      rawPagination?.total ??
      fallbackCount,
  )

  const totalPages = Number(
    rawPagination?.total_pages ?? rawPagination?.totalPages ?? 0,
  )

  const currentPage = Number(
    rawPagination?.page ?? rawPagination?.current_page ?? 1,
  )

  return {
    totalItems:
      Number.isFinite(totalRecords) && totalRecords >= 0
        ? totalRecords
        : fallbackCount,
    totalPages: Number.isFinite(totalPages) && totalPages >= 0 ? totalPages : 0,
    currentPage:
      Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
    pageSize: Number(rawPagination?.page_size || rawPagination?.pageSize || 10),
  }
}

const useSaleStore = create<SaleState>()(
  devtools(
    (set, get) => ({
      // ============ Estado MVP (Arrays simples) ============
      sales: [],
      currentSale: null,
      currentSaleMetadata: null,
      saleItems: [],
      loading: false,
      error: null,

      // ============ Procesamiento de pagos ============
      paymentInProgress: false,
      paymentResult: null,
      changeCalculation: null,
      filters: {
        page: 1,
        limit: 10,
        clientId: '',
        dateFrom: '',
        dateTo: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
      },
      stats: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        averageOrderValue: 0,
        topSellingProducts: [],
      },
      pendingSales: [],
      pendingSalesLoading: false,
      pendingSalesError: null,

      // ============ Estado temporal para venta en curso (MVP) ============
      currentSaleData: {
        clientId: null,
        sessionId: null,
        items: [],
        totalAmount: 0,
        subtotalAmount: 0,
        taxAmount: 0,
        discountAmount: 0,
        notes: '',
        paymentMethod: 'cash',
        amountPaid: 0,
        changeAmount: 0,
        posTerminalId: 'POS_001',
      },

      // ============ PROCESAMIENTO DE PAGOS ============

      processPayment: async (saleId, paymentData) => {
        set({ paymentInProgress: true, error: null })
        try {
          const response = await saleService.processPayment(saleId, paymentData)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              paymentResult: response.data,
              paymentInProgress: false,
            })

            telemetryService.recordEvent('payment_processed', {
              sale_id: saleId,
              payment_method: paymentData.paymentMethod,
              amount: paymentData.amountPaid,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, paymentInProgress: false })
          throw error
        }
      },

      calculateChange: async (totalAmount, amountPaid) => {
        try {
          const response = await saleService.calculateChange(
            totalAmount,
            amountPaid,
          )

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({ changeCalculation: response.data })

            // Actualizar datos de venta actual
            const currentSaleData = get().currentSaleData
            set({
              currentSaleData: {
                ...currentSaleData,
                amountPaid: amountPaid,
                changeAmount: response.data.change_amount,
              },
            })
          }

          return response
        } catch (error: any) {
          console.error('Error calculating change:', error)
          throw error
        }
      },

      // ============ CRUD OPERATIONS (MVP Style) ============
      fetchSales: async (params = {}) => {
        set({ loading: true, error: null })
        try {
          const filters = { ...get().filters, ...params }
          const response = await saleService.getSales(filters)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              sales: response.data || [],
              pagination: normalizeStorePagination(response.pagination, response.data?.length || 0),
              filters,
              loading: false,
            })

            telemetryService.recordEvent('sales_fetched', {
              count: response.data?.length || 0,
              filters: JSON.stringify(filters),
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchSalesByDateRange: async (params = {}) => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getSalesByDateRange(params)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              sales: response.data || [],
              pagination: normalizeStorePagination(response.pagination, response.data?.length || 0),
              loading: false,
            })

            telemetryService.recordEvent('sales_fetched_by_date_range', {
              count: response.data?.length || 0,
              params: JSON.stringify(params),
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchSalesByClientName: async (clientName, params = {}) => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getSalesByClientName(clientName, params)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              sales: response.data || [],
              pagination: normalizeStorePagination(response.pagination, response.data?.length || 0),
              loading: false,
            })

            telemetryService.recordEvent('sales_fetched_by_client_name', {
              count: response.data?.length || 0,
              client_name: clientName,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      clearSales: () => {
        set({
          sales: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize: 10
          },
          currentSaleMetadata: null,
        })
      },

      clearCurrentSaleMetadata: () => set({ currentSaleMetadata: null }),

      fetchPendingSalesByClient: async clientId => {
        if (!clientId) {
          set({ pendingSales: [], pendingSalesError: null })
          return { success: true, data: [] }
        }

        set({ pendingSalesLoading: true, pendingSalesError: null })
        try {
          const response = await saleService.getPendingSalesByClient(clientId)
          const data = Array.isArray(response?.data) ? response.data : []

          set({ pendingSales: data, pendingSalesLoading: false })
          return { success: true, data }
        } catch (error: any) {
          set({
            pendingSalesError: error.message || 'Error al cargar ventas pendientes',
            pendingSalesLoading: false,
          })
          throw error
        }
      },

      clearPendingSales: () => {
        set({ pendingSales: [], pendingSalesError: null })
      },

      fetchSaleById: async id => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getSaleById(id)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              currentSale: response.data,
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchSaleMetadata: async id => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getSaleMetadata(id)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              currentSaleMetadata: response.data?.metadata || response.data,
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchSalePaymentStatus: async id => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getSalePaymentStatus(id)
          set({ loading: false })
          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      addProductsToSale: async (saleId, payload) => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.addProductsToSale(saleId, payload)
          set({ loading: false })
          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      createSale: async (saleData = null) => {
        set({ loading: true, error: null })
        try {
          const dataToSend = saleData || get().currentSaleData
          const response = await saleService.createSale(dataToSend)

          // response is a loose union (demo/real paths); success flag only on some members
          if ((response as any).success) {
            set({
              sales: [response.data, ...get().sales],
              loading: false,
            })
            get().clearCurrentSale()
            get().updateStats()
          } else {
            set({ loading: false })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      cancelSale: async (id, reason = '') => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.revertSale(id, reason)
          const sales = get().sales.map(sale =>
            getSaleIdentifier(sale) === id ? { ...sale, status: 'CANCELLED' } : sale,
          )
          set({ sales, loading: false })
          get().updateStats()
          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      completeSale: async (id, paymentData = {}) => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.completeSale(id, paymentData)
          const sales = get().sales.map(sale =>
            getSaleIdentifier(sale) === id ? { ...sale, status: 'PAID' } : sale,
          )
          set({ sales, loading: false })
          get().updateStats()
          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchTodaySales: async () => {
        set({ loading: true, error: null })
        try {
          const response = await saleService.getTodaySales()
          set({ loading: false })
          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      calculateTotal: async (items, clientId = null) => {
        try {
          const response = await saleService.calculateTotal(items, clientId)
          return response
        } catch (error: any) {
          console.error('Error calculating total:', error)
          throw error
        }
      },

      // ============ GESTIÓN DE CARRITO (MVP Style) ============

      setCurrentSaleClient: clientId => {
        const currentSaleData = get().currentSaleData
        set({
          currentSaleData: {
            ...currentSaleData,
            clientId,
          },
        })
      },

      setPaymentMethod: paymentMethod => {
        const currentSaleData = get().currentSaleData
        set({
          currentSaleData: {
            ...currentSaleData,
            paymentMethod,
          },
        })
      },

      addItemToCurrentSale: (product, quantity = 1) => {
        const currentSaleData = get().currentSaleData
        const existingItemIndex = currentSaleData.items.findIndex(
          item => (item.product_id || item.id) === product.id,
        )

        let newItems
        if (existingItemIndex >= 0) {
          newItems = currentSaleData.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        } else {
          const unitPriceGs = normalizeSalePriceGs(product.price)
          newItems = [
            ...currentSaleData.items,
            {
              id: product.id,
              product_id: product.id,
              name: product.name,
              quantity: quantity,
              unit_price: unitPriceGs,
              unit: product.unit || product.unit_name || 'unit',
              tax_rate: resolveApplicableRateFraction(product, getDefaultVatPercent()) // Backend-resolved rate; 0 (EXENTO) is valid
            },
          ]
        }

        // Usar lógica de dominio para recalcular totales
        const totals = calculateSaleTotals(newItems);

        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax_amount,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      updateItemQuantity: (itemId, quantity) => {
        const currentSaleData = get().currentSaleData

        if (quantity <= 0) {
          get().removeItemFromCurrentSale(itemId)
          return
        }

        const newItems = currentSaleData.items.map(item =>
          item.id === itemId ? { ...item, quantity } : item,
        )

        const totals = calculateSaleTotals(newItems);

        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax_amount,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      removeItemFromCurrentSale: itemId => {
        const currentSaleData = get().currentSaleData
        const newItems = currentSaleData.items.filter(
          item => item.id !== itemId,
        )

        const totals = calculateSaleTotals(newItems);

        set({
          currentSaleData: {
            ...currentSaleData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax_amount,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      applyDiscount: discountAmount => {
        const currentSaleData = get().currentSaleData

        if (!discountAmount || discountAmount <= 0) {
          // Sin descuento general: recalcular sin prorrateo
          const totals = calculateSaleTotals(currentSaleData.items)
          set({
            currentSaleData: {
              ...currentSaleData,
              discountAmount: 0,
              subtotalAmount: totals.subtotal,
              taxAmount: totals.tax_amount,
              iva10: totals.iva10,
              iva5: totals.iva5,
              exento: totals.exento,
              totalAmount: totals.total,
            },
          })
          return
        }

        // Prorratear el descuento general por línea ANTES de extraer el IVA
        // (semántica del backend: descuentos primero, IVA después).
        const discountedItems = applyGeneralDiscount(
          currentSaleData.items,
          discountAmount,
        )
        const totals = calculateSaleTotals(discountedItems)

        set({
          currentSaleData: {
            ...currentSaleData,
            discountAmount: discountAmount,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax_amount,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      setNotes: notes => {
        const currentSaleData = get().currentSaleData
        set({
          currentSaleData: {
            ...currentSaleData,
            notes,
          },
        })
      },

      clearCurrentSale: () => {
        set({
          currentSaleData: {
            clientId: null,
            sessionId: null,
            items: [],
            totalAmount: 0,
            subtotalAmount: 0,
            taxAmount: 0,
            iva10: 0,
            iva5: 0,
            exento: 0,
            discountAmount: 0,
            notes: '',
            paymentMethod: 'cash',
            amountPaid: 0,
            changeAmount: 0,
            posTerminalId: 'POS_001',
          },
        })
      },

      updateStats: () => {
        const sales = get().sales
        const today = new Date().toISOString().split('T')[0]

        const todaySales = sales.filter(sale => 
          sale && sale.sale_date?.toString().startsWith(today) && sale.status !== 'CANCELLED'
        )

        const totalRevenue = sales
          .filter(sale => sale && sale.status === 'PAID')
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

        const todayRevenue = todaySales
          .filter(sale => sale && sale.status === 'PAID')
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

        set({
          stats: {
            ...get().stats,
            total: sales.length,
            today: todaySales.length,
            totalRevenue,
            todayRevenue,
            averageOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
          },
        })
      },

      setFilters: newFilters => set({ filters: { ...get().filters, ...newFilters } }),
      resetFilters: () => set({
        filters: {
          page: 1,
          limit: 10,
          clientId: '',
          dateFrom: '',
          dateTo: '',
          status: '',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      }),
      clearError: () => set({ error: null }),
      clearCurrentSaleEntity: () => set({ currentSale: null }),
      clearPaymentResult: () => set({ paymentResult: null, changeCalculation: null }),
      clearPendingSalesError: () => set({ pendingSalesError: null }),
    }),
    { name: 'sale-store' },
  ),
)

export default useSaleStore

