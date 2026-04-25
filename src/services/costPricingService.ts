import { apiClient } from './api';
import { telemetry } from '../utils/telemetry';
import { 
  PricingHistoryEntry, 
  UnitPriceUpdate, 
  ProfitabilityAnalysis, 
  API_ENDPOINTS 
} from '../types';

/**
 * Servicio para la gestión de Costos y Precios (Pricing & Profitability).
 * Permite el análisis de márgenes y seguimiento histórico de precios de venta.
 */
export const costPricingService = {
  /**
   * Obtiene las unidades de medida con precios asignados de un producto
   */
  async getProductUnits(productId: string): Promise<{ data: string[] }> {
    try {
      return await apiClient.get(API_ENDPOINTS.PRICING_UNITS(productId));
    } catch (error: any) {
      console.error('Error fetching product units:', error);
      throw error;
    }
  },

  /**
   * Asigna o actualiza un precio de venta para una unidad específica
   */
  async setUnitPrice(productId: string, data: UnitPriceUpdate): Promise<any> {
    const startTime = Date.now();
    try {
      const response = await apiClient.post(API_ENDPOINTS.PRICING_UNITS(productId), data);
      telemetry.record('pricing.service.set_price', { 
        duration: Date.now() - startTime,
        productId,
        unit: data.unit
      });
      return response;
    } catch (error: any) {
      telemetry.record('pricing.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'setUnitPrice', 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * Obtiene el historial de cambios de precio de un producto
   */
  async getPricingHistory(productId: string, params: { unit?: string } = {}): Promise<{ data: PricingHistoryEntry[] }> {
    try {
      return await apiClient.get(API_ENDPOINTS.PRICING_HISTORY(productId), { params });
    } catch (error: any) {
      console.error('Error fetching pricing history:', error);
      throw error;
    }
  },

  /**
   * Obtiene el análisis de rentabilidad (Margen Bruto) de un producto
   */
  async getProfitabilityAnalysis(productId: string): Promise<{ data: ProfitabilityAnalysis[] }> {
    const startTime = Date.now();
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROFITABILITY_ANALYSIS(productId));
      telemetry.record('pricing.service.profitability_check', { duration: Date.now() - startTime });
      return response;
    } catch (error: any) {
      telemetry.record('pricing.service.error', { 
        duration: Date.now() - startTime, 
        operation: 'getProfitabilityAnalysis', 
        error: error.message 
      });
      throw error;
    }
  }
};

export default costPricingService;
