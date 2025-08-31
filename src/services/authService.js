import apiService from './api';
import { telemetry } from '../utils/telemetry';

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  throw lastError;
};

const authService = {
  login: async (credentials) => {
    const startTime = Date.now();
    try {
      const result = await _fetchWithRetry(async () => {
        // El endpoint real es /login, apiService ya lo conoce
        return await apiService.login(credentials.email, credentials.password);
      });
      telemetry.record('auth.login.success', {
        duration: Date.now() - startTime,
      });
      return result;
    } catch (error) {
      telemetry.record('auth.login.error', {
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  },

  // Mantener otros métodos si existen y son necesarios
  logout: async () => {
    return await apiService.logout();
  },
};

export default authService;