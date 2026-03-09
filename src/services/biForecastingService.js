import { MOCK_DASHBOARD_PRONOSTICOS, MOCK_SALUD_INVENTARIO, MOCK_PRONOSTICO_VENTAS, MOCK_PRONOSTICO_DEMANDA, MOCK_PRONOSTICO_INGRESOS } from './mocks/biForecastingMock';
import { DEMO_CONFIG } from '@/config/demoAuth';

/**
 * Servicio para el sistema de Pronósticos BI.
 * Utiliza los mocks proporcionados en entorno de demostración.
 */
const biForecastingService = {
  /**
   * Obtiene los datos para el Dashboard principal de Pronósticos
   */
  getDashboard: () => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(MOCK_DASHBOARD_PRONOSTICOS);
    // return apiClient.makeRequest('/bi-forecasting/dashboard', { method: 'GET' });
    return Promise.resolve(MOCK_DASHBOARD_PRONOSTICOS); // Fallback to mock for now
  },

  /**
   * Obtiene los datos para Salud de Inventario y Pronósticos
   */
  getSaludInventario: () => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(MOCK_SALUD_INVENTARIO);
    return Promise.resolve(MOCK_SALUD_INVENTARIO);
  },

  /**
   * Obtiene los datos para Pronóstico de Ventas
   */
  getPronosticoVentas: () => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(MOCK_PRONOSTICO_VENTAS);
    return Promise.resolve(MOCK_PRONOSTICO_VENTAS);
  },

  /**
   * Obtiene los datos para Pronóstico de Demanda
   */
  getPronosticoDemanda: () => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(MOCK_PRONOSTICO_DEMANDA);
    return Promise.resolve(MOCK_PRONOSTICO_DEMANDA);
  },

  /**
   * Obtiene los datos para Pronóstico de Ingresos y Escenarios
   */
  getPronosticoIngresos: () => {
    if (DEMO_CONFIG.enabled) return Promise.resolve(MOCK_PRONOSTICO_INGRESOS);
    return Promise.resolve(MOCK_PRONOSTICO_INGRESOS);
  }
};

export default biForecastingService;
