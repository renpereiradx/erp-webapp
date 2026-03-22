import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import purchaseService from '@/services/purchaseService'
import { telemetryService } from '@/services/telemetryService'
import { calculatePurchaseSalePriceGs } from '@/domain/purchase/pricing/purchasePricingPolicy'
import { calculatePurchaseTotals } from '@/domain/purchase/calculations/purchaseCalculator'
import { 
  PurchaseOrderRequest, 
  PurchaseWithFullDetails, 
  PaginationState 
} from '@/types'

interface PurchaseState {
  purchaseOrders: any[];
  currentPurchaseOrder: PurchaseWithFullDetails | null;
  loading: boolean;
  error: string | null;
  taxRates: any[];
  suppliers: any[];
  currentOrderData: {
    supplierId: number | null;
    supplierName: string;
    items: any[];
    totalAmount: number;
    subtotalAmount: number;
    taxAmount: number;
    iva10: number;
    iva5: number;
    exento: number;
    expectedDelivery: string | null;
    notes: string;
    status: string;
    auto_update_prices: boolean;
    default_profit_margin: number;
    payment_method_id: number | null;
    currency_id: number | null;
    metadata: Record<string, any>;
  };
  filters: {
    page: number;
    limit: number;
    supplierId: string | number;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    showInactiveSuppliers: boolean;
  };
  pagination: PaginationState;

  // Actions
  fetchPurchaseOrders: (params?: any) => Promise<any>;
  fetchPurchaseOrderById: (id: number | string) => Promise<any>;
  createEnhancedPurchaseOrder: (orderData: PurchaseOrderRequest) => Promise<any>;
  cancelPurchaseOrder: (id: number | string, reason?: string) => Promise<any>;
  cancelPurchaseOrderWithDetails: (cancellationRequest: any) => Promise<any>;
  getPurchaseOrderWithSupplierValidation: (orderId: number | string, supplierName: string) => Promise<any>;
  fetchPurchasesBySupplier: (supplierId: number, options?: any) => Promise<any>;
  setCurrentOrderSupplier: (supplierId: number | null, supplierName?: string) => void;
  addItemToCurrentOrder: (product: any, quantity?: number, unitPrice?: number, options?: any) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, unitPrice: number) => void;
  removeItemFromCurrentOrder: (productId: string) => void;
  setOrderNotes: (notes: string) => void;
  clearCurrentOrder: () => void;
  updateCurrentOrderSettings: (settings: any) => void;
  setFilters: (newFilters: any) => void;
  resetFilters: () => void;
  clearError: () => void;
  clearCurrentPurchaseOrder: () => void;
}

const usePurchaseStore = create<PurchaseState>()(
  devtools(
    (set, get) => ({
      // ============ Estado MVP (Arrays simples) ============
      purchaseOrders: [],
      currentPurchaseOrder: null,
      loading: false,
      error: null,

      // ============ Datos de apoyo ============
      taxRates: [],
      suppliers: [],

      // ============ Estado temporal para nueva orden (MVP) ============
      currentOrderData: {
        supplierId: null,
        supplierName: '',
        items: [],
        totalAmount: 0,
        subtotalAmount: 0,
        taxAmount: 0,
        expectedDelivery: null,
        notes: '',
        status: 'PENDING',
        auto_update_prices: true,
        default_profit_margin: 30.0,
        payment_method_id: null,
        currency_id: null,
        metadata: {},
      },

      // ============ Configuración y filtros ============
      filters: {
        page: 1,
        limit: 10,
        supplierId: '',
        status: '',
        sortBy: 'order_date',
        sortOrder: 'desc',
        showInactiveSuppliers: false,
      },
      pagination: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 10
      },

      // ============ CRUD OPERATIONS (MVP Style) ============

      fetchPurchaseOrders: async (params = {}) => {
        set({ loading: true, error: null })
        try {
          const filters = { ...get().filters, ...params }
          // In basic MVP we use getPurchasesByDateRange or similar for general fetch
          // but for consistency with filters:
          const response = await purchaseService.getPurchasesByDateRange(
            filters.dateFrom || '2020-01-01',
            filters.dateTo || new Date().toISOString().split('T')[0],
            filters.page,
            filters.limit
          )

          if (response.success) {
            set({
              purchaseOrders: response.data || [],
              pagination: {
                totalItems: response.pagination?.totalRecords || 0,
                totalPages: response.pagination?.totalPages || 0,
                currentPage: response.pagination?.page || 1,
                pageSize: response.pagination?.pageSize || 10
              },
              filters,
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      fetchPurchaseOrderById: async id => {
        set({ loading: true, error: null })
        try {
          const response = await purchaseService.getPurchaseOrderWithSupplierValidation(id, '')

          if (response.success) {
            set({
              currentPurchaseOrder: response.data,
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      // Enhanced purchase order creation with auto-pricing
      createEnhancedPurchaseOrder: async orderData => {
        set({ loading: true, error: null })
        try {
          const response = await purchaseService.createEnhancedPurchaseOrder(
            orderData
          )

          if (response.success) {
            const purchaseOrders = get().purchaseOrders
            set({
              purchaseOrders: [response.data, ...purchaseOrders],
              loading: false,
            })

            get().clearCurrentOrder()
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      cancelPurchaseOrder: async (id, reason = '') => {
        set({ loading: true, error: null })
        try {
          const response = await purchaseService.cancelPurchaseOrderWithDetails({
            purchase_order_id: id,
            cancellation_reason: reason
          })

          if (response.success) {
            const purchaseOrders = get().purchaseOrders.map(order =>
              (order.id === id || order.purchase?.id === id) ? { ...order, status: 'CANCELLED' } : order
            )

            set({ purchaseOrders, loading: false })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      cancelPurchaseOrderWithDetails: async cancellationRequest => {
        set({ loading: true, error: null })
        try {
          const response = await purchaseService.cancelPurchaseOrderWithDetails(
            cancellationRequest
          )

          if (response.success) {
            const purchaseOrders = get().purchaseOrders.map(order =>
              (order.id === cancellationRequest.purchase_order_id || order.purchase?.id === cancellationRequest.purchase_order_id)
                ? { ...order, status: 'CANCELLED' }
                : order
            )

            set({ purchaseOrders, loading: false })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      // Obtener orden con validación de proveedor
      getPurchaseOrderWithSupplierValidation: async (orderId, supplierName) => {
        set({ loading: true, error: null })
        try {
          const response =
            await purchaseService.getPurchaseOrderWithSupplierValidation(
              orderId,
              supplierName
            )

          if (response.success) {
            set({
              currentPurchaseOrder: response.data,
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      // Obtener compras por proveedor con filtros enriquecidos
      fetchPurchasesBySupplier: async (supplierId, options = {}) => {
        set({ loading: true, error: null })
        try {
          const serviceOptions = {
            showInactiveSuppliers: get().filters.showInactiveSuppliers || false,
            ...options,
          }

          const response = await purchaseService.getPurchasesBySupplier(
            supplierId,
            serviceOptions
          )

          if (response.success) {
            set({
              purchaseOrders: response.data || [],
              loading: false,
            })
          }

          return response
        } catch (error: any) {
          set({ error: error.message, loading: false })
          throw error
        }
      },

      // ============ GESTIÓN DE ORDEN ACTUAL (MVP Style) ============

      setCurrentOrderSupplier: (supplierId, supplierName = '') => {
        set({
          currentOrderData: {
            ...get().currentOrderData,
            supplierId,
            supplierName,
          },
        })
      },

      addItemToCurrentOrder: (
        product,
        quantity = 1,
        unitPrice = 0,
        options = {}
      ) => {
        const currentOrderData = get().currentOrderData
        const existingItemIndex = currentOrderData.items.findIndex(
          item => item.productId === product.id
        )

        let newItems
        if (existingItemIndex >= 0) {
          newItems = currentOrderData.items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          const unitPriceValue = unitPrice || product.price || 0
          newItems = [
            ...currentOrderData.items,
            {
              productId: product.id,
              productName: product.name,
              quantity: quantity,
              unitPrice: unitPriceValue,
              totalPrice: unitPriceValue * quantity,
              unit: options.unit || product.unit || 'unit',
              profit_pct: options.profit_pct || 30,
              tax_rate: options.tax_rate || 0.10,
            },
          ]
        }

        // Usar lógica de dominio para recalcular totales
        const totals = calculatePurchaseTotals(newItems);

        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      updateItemQuantity: (productId, quantity) => {
        const currentOrderData = get().currentOrderData

        if (quantity <= 0) {
          get().removeItemFromCurrentOrder(productId)
          return
        }

        const newItems = currentOrderData.items.map(item =>
          item.productId === productId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        )

        const totals = calculatePurchaseTotals(newItems);

        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      updateItemPrice: (productId, unitPrice) => {
        const currentOrderData = get().currentOrderData

        const newItems = currentOrderData.items.map(item =>
          item.productId === productId
            ? { ...item, unitPrice, totalPrice: item.quantity * unitPrice }
            : item
        )

        const totals = calculatePurchaseTotals(newItems);

        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      removeItemFromCurrentOrder: productId => {
        const currentOrderData = get().currentOrderData
        const newItems = currentOrderData.items.filter(
          item => item.productId !== productId
        )

        const totals = calculatePurchaseTotals(newItems);

        set({
          currentOrderData: {
            ...currentOrderData,
            items: newItems,
            subtotalAmount: totals.subtotal,
            taxAmount: totals.tax,
            iva10: totals.iva10,
            iva5: totals.iva5,
            exento: totals.exento,
            totalAmount: totals.total,
          },
        })
      },

      setOrderNotes: notes => {
        set({
          currentOrderData: {
            ...get().currentOrderData,
            notes,
          },
        })
      },

      clearCurrentOrder: () => {
        set({
          currentOrderData: {
            supplierId: null,
            supplierName: '',
            items: [],
            totalAmount: 0,
            subtotalAmount: 0,
            taxAmount: 0,
            iva10: 0,
            iva5: 0,
            exento: 0,
            expectedDelivery: null,
            notes: '',
            status: 'PENDING',
            auto_update_prices: true,
            default_profit_margin: 30.0,
            payment_method_id: null,
            currency_id: null,
            metadata: {},
          },
        })
      },

      updateCurrentOrderSettings: settings => {
        set({
          currentOrderData: {
            ...get().currentOrderData,
            ...settings,
          },
        })
      },

      // ============ GESTIÓN DE ESTADO ============

      setFilters: newFilters => set({ filters: { ...get().filters, ...newFilters } }),
      resetFilters: () => set({
        filters: {
          page: 1,
          limit: 10,
          supplierId: '',
          status: '',
          sortBy: 'order_date',
          sortOrder: 'desc',
          showInactiveSuppliers: false,
        },
      }),
      clearError: () => set({ error: null }),
      clearCurrentPurchaseOrder: () => set({ currentPurchaseOrder: null }),
    }),
    { name: 'purchase-store' }
  )
)

export default usePurchaseStore

