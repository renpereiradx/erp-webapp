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
        itemsCount: data.details?.length 
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
      // El backend responde { data: [...], pagination: { page, page_size,
      // total_records, total_pages, has_next, has_previous } }. Se normaliza al
      // contrato FE (PaginatedResponse) para los consumidores existentes.
      const pagination = response?.pagination || {};
      return {
        data: response?.data || [],
        page: pagination.page || 1,
        pageSize: pagination.page_size || filters.page_size || 15,
        total: pagination.total_records || 0,
        totalPages: pagination.total_pages || 1,
      };
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
      // El backend responde { budget: BudgetOrderRiched, details: [...] }.
      // Se mapea details -> items para el contrato interno del componente.
      return {
        budget: response?.budget || response,
        items: response?.details || response?.items || [],
      };
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
  },

  /**
   * Imprime el ticket del presupuesto en la impresora RECEIPT default del
   * branch (documents: POST /api/v1/documents/budgets/{id}/ticket/print).
   * Sin impresora configurada el backend responde 404 — la impresión es
   * opcional: el modal consulta /api/v1/printers para deshabilitar antes.
   */
  async printTicket(id: string): Promise<BudgetTicketPrintResult> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(
        `/api/v1/documents/budgets/${encodeURIComponent(id)}/ticket/print`
      ) as BudgetTicketPrintResult;
      telemetry.record('budget.service.print_ticket', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('budget.service.error', {
        duration: Date.now() - startTime,
        operation: 'printTicket',
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Descarga el PDF del presupuesto (documents: GET .../comprobante.pdf)
   * como blob autenticado — window.open no puede enviar el JWT.
   */
  async downloadPdf(id: string): Promise<{ blob: Blob; filename: string }> {
    const startTime = Date.now();
    try {
      const result = await apiClient.getBlob(
        `/api/v1/documents/budgets/${encodeURIComponent(id)}/comprobante.pdf`
      );
      telemetry.record('budget.service.download_pdf', { duration: Date.now() - startTime });
      return { blob: result.blob, filename: result.filename || `presupuesto_${id}.pdf` };
    } catch (error: any) {
      telemetry.record('budget.service.error', {
        duration: Date.now() - startTime,
        operation: 'downloadPdf',
        error: error.message
      });
      throw error;
    }
  }
};

/** Respuesta del backend al imprimir el ticket de un presupuesto. */
export interface BudgetTicketPrintResult {
  success: boolean;
  sale_id: string;
  printer: string;
  printer_host: string;
  reprint_count: number;
  message?: string;
}

export default budgetService;
