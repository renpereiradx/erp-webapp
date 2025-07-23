/**
 * Utilidad para debugging de autenticación
 */

export const debugAuth = {
  // Verificar estado de autenticación
  checkAuthState: () => {
    const token = localStorage.getItem('authToken');
    const state = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'N/A',
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Auth Debug State:', state);
    return state;
  },

  // Verificar headers que se enviarán
  checkHeaders: () => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': token } : {};
    
    console.log('📋 Headers que se enviarán:', headers);
    return headers;
  },

  // Log de llamada a API
  logApiCall: (endpoint, hasToken) => {
    console.log(`🚀 API Call: ${endpoint}`, {
      hasToken,
      timestamp: new Date().toISOString()
    });
  }
};

export default debugAuth;
