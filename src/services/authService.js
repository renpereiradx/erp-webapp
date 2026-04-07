import apiService from './api';
import { telemetry } from '../utils/telemetry';
import { 
  DEMO_CONFIG,
  validateDemoCredentials,
  generateDemoLoginResponse,
  isDemoCredentials 
} from '../config/demoAuth';

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
    const username = credentials.username || credentials.email;
    const password = credentials.password;
    
    // Verificar si son credenciales demo
    if (DEMO_CONFIG.enabled && isDemoCredentials(username, password)) {
      const demoUser = validateDemoCredentials(username, password);
      
      if (demoUser) {
        // Simular delay de red para realismo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = generateDemoLoginResponse(demoUser);
        
        // Simular almacenamiento del token demo
        apiService.setToken(response.token);
        
        telemetry.record('auth.demo_login.success', {
          duration: Date.now() - startTime,
          user_role: demoUser.role
        });
        
        return response;
      }
    }
    
    // Llamar a la API real de login
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiService.login(username, password);
      });

      telemetry.record('auth.login.success', {
        duration: Date.now() - startTime,
      });

      // Normalizar la respuesta del backend
      const token = result.token || result.data?.token;
      const refreshToken = result.refresh_token || result.data?.refresh_token;
      const user = result.user || result.data?.user || result.data;
      const role_id = result.role_id || result.data?.role_id;
      
      // Asegurarnos de que el refreshToken se guarde si viene en la respuesta del login
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      return {
        success: true,
        token,
        refreshToken,
        user,
        role_id,
        ...result
      };
    } catch (error) {
      telemetry.record('auth.login.error', {
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  },

  // Mantener otros métodos si existen y son necesarios
  refreshToken: async (refreshToken) => {
    try {
      return await apiService.post('/auth/refresh', { refresh_token: refreshToken });
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  logoutAll: async () => {
    try {
      const response = await apiService.post('/auth/logout-all');
      apiService.clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:logout'));
      }
      return response;
    } catch (error) {
      console.error('Error en logout global:', error);
      throw error;
    }
  },

  logout: async () => {
    // 🔧 FIX: El token se limpia en AuthContext, no aquí
    // Solo intentar notificar al servidor del logout
    const currentToken = apiService.getToken();
    if (currentToken === 'demo-jwt-token-12345') {
      return { success: true, message: 'Demo logout successful' };
    }

    // Para API real, intentar logout en el servidor
    try {
      return await apiService.logout();
    } catch (error) {
      // Si falla el logout de API, está OK - el token se limpia en AuthContext
      console.warn('Server logout failed:', error);
      return { success: true, message: 'Logged out locally' };
    }
  },
};

export default authService;
