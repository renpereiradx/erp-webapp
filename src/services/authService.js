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
    
    // Verificar si son credenciales demo
    if (DEMO_CONFIG.enabled && isDemoCredentials(credentials.email, credentials.password)) {
      const demoUser = validateDemoCredentials(credentials.email, credentials.password);
      
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
    
    // Si no es demo o demo está deshabilitado, usar API real
    try {
      const result = await _fetchWithRetry(async () => {
        // El endpoint real es /login, apiService ya lo conoce
        return await apiService.login(credentials.email, credentials.password);
      });

      telemetry.record('auth.login.success', {
        duration: Date.now() - startTime,
      });

      // Normalizar la respuesta del backend para que tenga success: true
      return {
        success: true,
        token: result.token,
        user: result.user,
        role_id: result.role_id,
        ...result
      };
    } catch (error) {
      // Si la API falla y demo está habilitado, mostrar mensaje informativo
      if (DEMO_CONFIG.enabled) {
        const demoError = new Error(
          'API no disponible. Usa credenciales demo: admin@demo.com / admin123 o demo / demo'
        );
        demoError.isDemoHint = true;
        throw demoError;
      }
      
      telemetry.record('auth.login.error', {
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  },

  // Mantener otros métodos si existen y son necesarios
  logout: async () => {
    // Para demo, simplemente limpiar token local
    const currentToken = apiService.getToken();
    if (currentToken === 'demo-jwt-token-12345') {
      apiService.clearToken();
      return { success: true, message: 'Demo logout successful' };
    }
    
    // Para API real, usar logout normal
    try {
      return await apiService.logout();
    } catch (error) {
      // Si falla el logout de API, al menos limpiar token local
      apiService.clearToken();
      return { success: true, message: 'Logged out locally' };
    }
  },
};

export default authService;