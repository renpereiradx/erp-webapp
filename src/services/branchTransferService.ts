import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  BranchTransfer, 
  BranchTransferItem,
  CreateBranchTransferRequest, 
  UpdateBranchTransferStatusRequest,
  API_ENDPOINTS,
  PaginatedResponse
} from '../types';

/**
 * Servicio para la gestión de transferencias entre sucursales.
 * Este módulo es operativo y utiliza el contexto de sucursal activa.
 */
export const branchTransferService = {
  /**
   * Crea una nueva solicitud de transferencia
   */
  async createTransfer(data: CreateBranchTransferRequest): Promise<BranchTransfer> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_TRANSFERS, data);
      telemetry.record('branch_transfer.service.create', { 
        duration: Date.now() - startTime,
        itemsCount: data.items?.length 
      });
      return response;
    } catch (error: any) {
      telemetry.record('branch_transfer.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'createTransfer', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Lista transferencias con filtros (soporta branch context automático)
   */
  async getTransfers(filters: { 
    branch_id?: number; 
    status?: string; 
    source_branch_id?: number; 
    destination_branch_id?: number;
    page?: number;
    page_size?: number;
  } = {}): Promise<PaginatedResponse<BranchTransfer>> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_TRANSFERS, { params: filters });
      telemetry.record('branch_transfer.service.list', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('branch_transfer.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getTransfers', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene una transferencia completa con sus items
   */
  async getTransferById(id: number): Promise<{ transfer: BranchTransfer; items: BranchTransferItem[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_TRANSFER_BY_ID(id));
      return response;
    } catch (error: any) {
      telemetry.record('branch_transfer.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getTransferById', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Actualiza el estado de una transferencia (Flujo de aprobación/envío/recepción)
   */
  async updateTransferStatus(id: number, data: UpdateBranchTransferStatusRequest): Promise<BranchTransfer> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.BRANCH_TRANSFER_STATUS(id), data);
      telemetry.record('branch_transfer.service.status_update', { 
        duration: Date.now() - startTime,
        newStatus: data.new_status 
      });
      return response;
    } catch (error: any) {
      telemetry.record('branch_transfer.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateTransferStatus', 
        error: error.message 
      });
      throw error;
    }
  }
};

export default branchTransferService;
