/**
 * Configuración principal de la API
 * Migrado para usar el cliente oficial del Business Management API
 */

import BusinessManagementAPI from './BusinessManagementAPI'
import API_CONFIG from '@/config/api.config'
import clientService from './clientService'
import supplierService from './supplierService'
import branchService from './branchService'
import branchTransferService from './branchTransferService'
import taxClassificationService from './taxClassificationService'
import budgetService from './budgetService'
import purchaseRequisitionService from './purchaseRequisitionService'
import costPricingService from './costPricingService'

// Instancia única del cliente API usando configuración centralizada
const businessAPI = new BusinessManagementAPI({
  baseUrl: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  defaultHeaders: API_CONFIG.defaultHeaders,
})

export const apiClient = businessAPI

// Servicio API legacy manteniendo compatibilidad
export const apiService: any = {
  // Métodos de autenticación
  login: (username: string, password: string) => (apiClient as any).login(username, password),
  signup: (email: string, password: string) => (apiClient as any).signup(email, password),
  logout: () => apiClient.logout(),

  // Métodos HTTP genéricos para compatibilidad
  get: (endpoint: string, options = {}) => apiClient.get(endpoint, options),
  post: (endpoint: string, data: any) =>
    apiClient.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    apiClient.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) => apiClient.makeRequest(endpoint, { method: 'DELETE' }),

  // Métodos específicos de productos (delegando al apiClient)
  getProducts: (page: number, pageSize: number) => (apiClient as any).getProducts(page, pageSize),
  getProductById: (id: string | number) => (apiClient as any).getProductById(id),
  getProductByBarcode: (barcode: string) => (apiClient as any).getProductByBarcode(barcode),
  getBeachTennisCourts: () => (apiClient as any).getBeachTennisCourts(),
  searchProducts: (term: string) => (apiClient as any).searchProducts(term),
  searchProductsByName: (name: string) => (apiClient as any).searchProductsByName(name),
  createProduct: (data: any) => (apiClient as any).createProduct(data),
  updateProduct: (id: string | number, data: any) => (apiClient as any).updateProduct(id, data),
  deleteProduct: (id: string | number) => (apiClient as any).deleteProduct(id),

  // Métodos de clientes (redirigiendo al nuevo clientService para consistencia)
  getClients: (params: any) => clientService.getAll(params?.page, params?.pageSize),
  getClientById: (id: string | number) => clientService.getById(id),
  searchClientsByName: (name: string) => clientService.searchByName(name),
  createClient: (data: any) => clientService.create(data),
  updateClient: (id: string | number, data: any) => clientService.update(id, data),
  deleteClient: (id: string | number) => clientService.delete(id),

  // Métodos de proveedores (redirigiendo al nuevo supplierService para consistencia)
  getSuppliers: (params: any) => supplierService.getAll(params),
  getSupplierById: (id: string | number) => supplierService.getById(id),
  searchSuppliersByName: (name: string) => supplierService.searchByName(name),
  createSupplier: (data: any) => supplierService.create(data),
  updateSupplier: (id: string | number, data: any) => supplierService.update(id, data),
  deleteSupplier: (id: string | number) => supplierService.delete(id),

  // Métodos de sucursales
  getBranches: (filters: any) => branchService.getBranches(filters),
  getBranchById: (id: number) => branchService.getBranchById(id),
  createBranch: (data: any) => branchService.createBranch(data),
  updateBranch: (id: number, data: any) => branchService.updateBranch(id, data),

  // Métodos de transferencias entre sucursales
  getBranchTransfers: (filters: any) => branchTransferService.getTransfers(filters),
  getBranchTransferById: (id: number) => branchTransferService.getTransferById(id),
  createBranchTransfer: (data: any) => branchTransferService.createTransfer(data),
  updateBranchTransferStatus: (id: number, data: any) => branchTransferService.updateTransferStatus(id, data),

  // Métodos de presupuestos
  getBudgets: (filters: any) => budgetService.getBudgets(filters),
  getBudgetById: (id: string) => budgetService.getBudgetById(id),
  createBudget: (data: any) => budgetService.createBudget(data),
  updateBudgetStatus: (id: string, data: any) => budgetService.updateBudgetStatus(id, data),
  convertBudgetToSale: (id: string) => budgetService.convertToSale(id),

  // Métodos de requisiciones de compra
  getPurchaseRequisitions: (filters: any) => purchaseRequisitionService.getRequisitions(filters),
  getPurchaseRequisitionById: (id: string) => purchaseRequisitionService.getRequisitionById(id),
  createPurchaseRequisition: (data: any) => purchaseRequisitionService.createRequisition(data),
  updatePurchaseRequisitionStatus: (id: string, data: any) => purchaseRequisitionService.updateStatus(id, data),

  // Métodos de Costos y Precios
  getProductPricingHistory: (productId: string, params: any) => costPricingService.getPricingHistory(productId, params),
  getProfitabilityAnalysis: (productId: string) => costPricingService.getProfitabilityAnalysis(productId),
  updateProductPrice: (productId: string, data: any) => costPricingService.setUnitPrice(productId, data),

  // Métodos de categorías
  getAllCategories: () => (apiClient as any).getAllCategories(),

  // Métodos de ventas
  getSalesByClientId: (id: string | number) => (apiClient as any).getSalesByClientId(id),
  getSalesByClientName: (name: string) => (apiClient as any).getSalesByClientName(name),
  getSaleById: (id: string | number) => (apiClient as any).getSaleById(id),
  processSalePaymentCashRegister: (data: any) => (apiClient as any).processSalePaymentCashRegister(data),
  getSalePaymentDetails: (saleId: string | number) => (apiClient as any).getSalePaymentDetails(saleId),
  getChangeStatistics: (filters: any) => (apiClient as any).getChangeStatistics({ params: filters }),

  // Métodos de compras
  getPurchasesByDateRange: (startDate: string, endDate: string, page = 1, pageSize = 50) => 
    (apiClient as any).getPurchasesByDateRange(startDate, endDate, page, pageSize),
  getPurchaseById: (id: string | number) => (apiClient as any).getPurchaseById(id),
  processPurchasePayment: (data: any) => (apiClient as any).processPurchasePayment(data),
  processPurchasePaymentCashRegister: (data: any) => (apiClient as any).processPurchasePaymentCashRegister(data),
  getPurchasePaymentStatistics: (filters: any) => (apiClient as any).getPurchasePaymentStatistics({ params: filters }),

  // Métodos de reservas con fallback robusto
  getReservationReport: async (params: any = {}) => {
    try {
      // Ensure authentication first
      if (!apiClient.hasValidToken()) {
        throw new Error('No authentication token found')
      }

      // Use GET /reserve/all and filter client-side as /reserve/report is not documented
      // This ensures we get real data instead of mock data
      const response = await apiClient.makeRequest('/reserve/all', {
        method: 'GET',
      })

      let filtered = Array.isArray(response) ? response : []

      if (params.client_id) {
        // Loose equality to handle string/number mismatch
        filtered = filtered.filter((r: any) => r.client_id == params.client_id)
      }

      if (params.status) {
        filtered = filtered.filter((r: any) => r.status === params.status)
      }

      return filtered
    } catch (error) {
      console.error('Error fetching reservations:', error)
      return []
    }
  },

  // Utilidades
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token: string) => localStorage.setItem('authToken', token),
  clearToken: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
  },
}

export default apiService
