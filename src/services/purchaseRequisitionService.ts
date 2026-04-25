import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  PurchaseRequisition, 
  PurchaseRequisitionDetail, 
  CreatePurchaseRequisitionRequest, 
  UpdateRequisitionStatusRequest,
  API_ENDPOINTS 
} from '../types';

/**
 * Servicio para la gestión de Requisiciones de Compra.
 * Este módulo es operativo y utiliza el contexto de sucursal activa.
 */
export const purchaseRequisitionService = {
  /**
   * Crea una nueva requisición de compra
   */
  async createRequisition(data: CreatePurchaseRequisitionRequest): Promise<{ id: string; success: boolean }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.PURCHASE_REQUISITIONS, data);
      telemetry.record('purchase_requisition.service.create', { 
        duration: Date.now() - startTime,
        itemsCount: data.details?.length 
      });
      return response;
    } catch (error: any) {
      telemetry.record('purchase_requisition.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'createRequisition', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Lista requisiciones con filtros (soporta branch context automático)
   */
  async getRequisitions(filters: { 
    status?: string; 
    supplier_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<{ data: PurchaseRequisition[]; count: number; success: boolean }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.PURCHASE_REQUISITIONS, { params: filters });
      return response;
    } catch (error: any) {
      telemetry.record('purchase_requisition.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getRequisitions', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene las requisiciones del usuario autenticado
   */
  async getMyRequisitions(): Promise<{ data: PurchaseRequisition[]; success: boolean }> {
    try {
      return await apiClient.get(API_ENDPOINTS.PURCHASE_REQUISITIONS_MY);
    } catch (error: any) {
      console.error('Error fetching my requisitions:', error);
      throw error;
    }
  },

  /**
   * Obtiene una requisición completa con sus detalles
   */
  async getRequisitionById(id: string): Promise<{ 
    success: boolean; 
    data: { requisition: PurchaseRequisition; details: PurchaseRequisitionDetail[] } 
  }> {
    try {
      return await apiClient.get(API_ENDPOINTS.PURCHASE_REQUISITION_BY_ID(id));
    } catch (error: any) {
      console.error(`Error fetching requisition ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de una requisición (Workflow de aprobación)
   */
  async updateStatus(id: string, data: UpdateRequisitionStatusRequest): Promise<any> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.PURCHASE_REQUISITION_STATUS(id), data);
      telemetry.record('purchase_requisition.service.status_update', { 
        duration: Date.now() - startTime,
        newStatus: data.new_status 
      });
      return response;
    } catch (error: any) {
      telemetry.record('purchase_requisition.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateStatus', 
        error: error.message 
      });
      throw error;
    }
  }
};

export default purchaseRequisitionService;
