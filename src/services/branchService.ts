import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  Branch, 
  CreateBranchRequest, 
  UpdateBranchRequest,
  BranchFiscalConfig,
  CreateBranchFiscalConfigRequest,
  UserBranchAccess,
  GrantBranchAccessRequest,
  UpdateBranchAccessRequest,
  API_ENDPOINTS,
  PaginatedResponse
} from '../types';

/**
 * Servicio para la administración de sucursales, configuración fiscal y accesos.
 * Estos endpoints NO requieren contexto de sucursal activa ya que son administrativos.
 * La exclusión del header X-Branch-Id está manejada automáticamente en BusinessManagementAPI.ts.
 */
export const branchService = {
  // =================== GESTIÓN DE SUCURSALES ===================

  /**
   * Lista todas las sucursales con filtros opcionales
   */
  async getBranches(filters: { is_active?: boolean; page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Branch>> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCHES, { params: filters });
      telemetry.record('branch.service.list', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getBranches', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene una sucursal por su ID
   */
  async getBranchById(id: number): Promise<Branch> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_BY_ID(id));
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getBranchById', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Crea una nueva sucursal
   */
  async createBranch(data: CreateBranchRequest): Promise<Branch> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BRANCHES, data);
      telemetry.record('branch.service.create', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'createBranch', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Actualiza una sucursal existente
   */
  async updateBranch(id: number, data: UpdateBranchRequest): Promise<Branch> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.BRANCH_BY_ID(id), data);
      telemetry.record('branch.service.update', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateBranch', 
        error: error.message 
      });
      throw error;
    }
  },

  // =================== CONFIGURACIÓN FISCAL ===================

  /**
   * Lista configuraciones fiscales de una sucursal
   */
  async getFiscalConfigs(branchId: number): Promise<{ data: BranchFiscalConfig[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_FISCAL_CONFIG(branchId));
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getFiscalConfigs', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Crea una configuración fiscal para una sucursal
   */
  async createFiscalConfig(branchId: number, data: CreateBranchFiscalConfigRequest): Promise<BranchFiscalConfig> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_FISCAL_CONFIG(branchId), data);
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'createFiscalConfig', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Actualiza una configuración fiscal por su ID
   */
  async updateFiscalConfig(id: number, data: Partial<CreateBranchFiscalConfigRequest>): Promise<BranchFiscalConfig> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.BRANCH_FISCAL_CONFIG_UPDATE(id), data);
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateFiscalConfig', 
        error: error.message 
      });
      throw error;
    }
  },

  // =================== GESTIÓN DE ACCESOS ===================

  /**
   * Otorga acceso a un usuario sobre una sucursal
   */
  async grantAccess(branchId: number, data: GrantBranchAccessRequest): Promise<UserBranchAccess> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ACCESS(branchId), data);
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'grantAccess', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Lista accesos de usuarios para una sucursal
   */
  async getAccesses(branchId: number): Promise<{ data: UserBranchAccess[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ACCESS(branchId));
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getAccesses', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Actualiza el acceso de un usuario a una sucursal
   */
  async updateAccess(branchId: number, userId: string, data: UpdateBranchAccessRequest): Promise<UserBranchAccess> {
    const startTime = Date.now();
    try {
      const response = await apiClient.put(API_ENDPOINTS.BRANCH_ACCESS_UPDATE(branchId, userId), data);
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'updateAccess', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Revoca el acceso de un usuario a una sucursal
   */
  async revokeAccess(branchId: number, userId: string): Promise<void> {
    const startTime = Date.now();
    try {
      await apiClient.delete(API_ENDPOINTS.BRANCH_ACCESS_UPDATE(branchId, userId));
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'revokeAccess', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Lista las sucursales a las que un usuario tiene acceso
   */
  async getUserBranches(userId: string): Promise<{ data: UserBranchAccess[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_BRANCHES(userId));
      return response;
    } catch (error: any) {
      telemetry.record('branch.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getUserBranches', 
        error: error.message 
      });
      throw error;
    }
  }
};

export default branchService;
