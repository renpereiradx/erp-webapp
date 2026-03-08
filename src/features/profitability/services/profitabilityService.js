import axios from 'axios';
import { profitabilityMocks } from '@/data/profitabilityMocks';

const isDemo = import.meta.env.VITE_APP_DEMO === 'true' || true; // Forzado a true para desarrollo inicial
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Servicio para obtener datos de rentabilidad.
 * Maneja tanto la API real como los mocks para el modo demo.
 */
const profitabilityService = {
  getDashboard: async (period = 'month') => {
    if (isDemo) return { success: true, data: profitabilityMocks.dashboard };
    const response = await axios.get(`${API_BASE_URL}/profitability/dashboard`, { params: { period } });
    return response.data;
  },

  getOverview: async (period = 'month') => {
    if (isDemo) return { success: true, data: profitabilityMocks.overview };
    const response = await axios.get(`${API_BASE_URL}/profitability/overview`, { params: { period } });
    return response.data;
  },

  getProducts: async (params) => {
    if (isDemo) return { success: true, data: profitabilityMocks.products };
    const response = await axios.get(`${API_BASE_URL}/profitability/products`, { params });
    return response.data;
  },

  getCustomers: async (params) => {
    if (isDemo) return { success: true, data: profitabilityMocks.customers };
    const response = await axios.get(`${API_BASE_URL}/profitability/customers`, { params });
    return response.data;
  },

  getCategories: async (period = 'month') => {
    if (isDemo) return { success: true, data: profitabilityMocks.categories };
    const response = await axios.get(`${API_BASE_URL}/profitability/categories`, { params: { period } });
    return response.data;
  },

  getTrends: async (params) => {
    if (isDemo) return { success: true, data: profitabilityMocks.trends };
    const response = await axios.get(`${API_BASE_URL}/profitability/trends`, { params });
    return response.data;
  },

  getSellers: async (period = 'month') => {
    if (isDemo) return { success: true, data: profitabilityMocks.sellers };
    const response = await axios.get(`${API_BASE_URL}/profitability/sellers`, { params: { period } });
    return response.data;
  }
};

export default profitabilityService;
