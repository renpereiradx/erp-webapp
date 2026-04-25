import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  Budget, 
  BudgetItem, 
  CreateBudgetRequest, 
  UpdateBudgetStatusRequest,
  API_ENDPOINTS,
  PaginatedResponse
} from '../types';

/**
 * Servicio para la gestión de Presupuestos (Budgets/Cotizaciones).
 * Este módulo es operativo y utiliza el contexto de sucursal activa.
 */
export const budgetService = {
  /**
   * Crea un nuevo presupuesto
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BUDGETS, data);
      telemetry.record('budget.service.create', { 
        duration: Date.now() - startTime,
        itemsCount: data.items?.length 
      });
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'createBudget', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Lista presupuestos con filtros (soporta branch context automático)
   */
  async getBudgets(filters: { 
    status?: string; 
    client_id?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedResponse<Budget>> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BUDGETS, { params: filters });
      telemetry.record('budget.service.list', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getBudgets', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene un presupuesto completo con sus items
   */
  async getBudgetById(id: string): Promise<{ budget: Budget; items: BudgetItem[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BUDGET_BY_ID(id));
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getBudgetById', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Actualiza el estado de un presupuesto
   */
  async updateBudgetStatus(id: string, data: UpdateBudgetStatusRequest): Promise<Budget> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.BUDGET_STATUS(id), data);
      telemetry.record('budget.service.status_update', { 
        duration: Date.now() - startTime,
        newStatus: data.status 
      });
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateBudgetStatus', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Convierte un presupuesto en una venta firme
   */
  async convertToSale(id: string): Promise<{ success: boolean; sale_id: string; message: string }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BUDGET_CONVERT_TO_SALE(id), {});
      telemetry.record('budget.service.convert_to_sale', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'convertToSale', 
        error: error.message 
      });
      throw error;
    }
  }
};

export default budgetService;
