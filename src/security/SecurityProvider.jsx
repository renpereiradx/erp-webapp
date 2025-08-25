/**
 * Wave 7: Security & Compliance Enterprise
 * Security Provider React Component
 * 
 * Proveedor principal de seguridad para la aplicación React que:
 * - Inicializa el sistema de seguridad integrado
 * - Proporciona contexto de seguridad a toda la app
 * - Maneja autenticación, autorización y compliance
 * - Monitorea seguridad en tiempo real
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { securitySystem } from './SecuritySystem';
import { useSecurityHooks } from './SecurityHooks';

// ====================================
// SECURITY CONTEXT
// ====================================

const SecurityContext = createContext({
  securitySystem: null,
  isInitialized: false,
  securityStatus: null,
  authState: {
    isAuthenticated: false,
    user: null,
    loading: true
  },
  permissions: {},
  gdprConsent: null,
  securityMetrics: null,
  checkAccess: () => false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateSecurityStatus: () => {},
  recordGDPRConsent: () => Promise.resolve(),
  exportGDPRData: () => Promise.resolve(),
  deleteGDPRData: () => Promise.resolve()
});

// ====================================
// SECURITY PROVIDER
// ====================================

export const SecurityProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  const [permissions, setPermissions] = useState({});
  const [gdprConsent, setGdprConsent] = useState(null);
  const [securityMetrics, setSecurityMetrics] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  
  // ====================================
  // INITIALIZATION
  // ====================================
  
  useEffect(() => {
    initializeSecurity();
  }, []);
  
  const initializeSecurity = async () => {
    try {
      console.log('🔒 Initializing Security Provider...');
      
      // Esperar que el sistema de seguridad esté listo
      await waitForSecuritySystem();
      
      // Configurar listeners de seguridad
      setupSecurityListeners();
      
      // Cargar estado inicial
      await loadInitialSecurityState();
      
      // Configurar monitoreo en tiempo real
      setupRealTimeMonitoring();
      
      setIsInitialized(true);
      
      console.log('✅ Security Provider initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Security Provider:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };
  
  const waitForSecuritySystem = async () => {
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos máximo
    
    while (!securitySystem.isInitialized && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!securitySystem.isInitialized) {
      throw new Error('Security system initialization timeout');
    }
  };
  
  const setupSecurityListeners = () => {
    // Listener para cambios de autenticación
    const authService = securitySystem.getServices().auth;
    
    // Simular event listeners (en producción, usar eventos reales)
    const checkAuthState = () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      setAuthState({
        isAuthenticated,
        user,
        loading: false
      });
      
      if (isAuthenticated && user) {
        loadUserPermissions(user);
        loadUserGDPRConsent(user);
      } else {
        setPermissions({});
        setGdprConsent(null);
      }
    };
    
    // Verificar estado inicial
    checkAuthState();
    
    // Configurar polling para cambios
    const authPolling = setInterval(checkAuthState, 5000);
    
    return () => clearInterval(authPolling);
  };
  
  const loadInitialSecurityState = async () => {
    try {
      const status = securitySystem.getSecurityStatus();
      setSecurityStatus(status);
      setSecurityMetrics(status.metrics);
      
    } catch (error) {
      console.error('Failed to load initial security state:', error);
    }
  };
  
  const setupRealTimeMonitoring = () => {
    // Actualizar métricas cada 30 segundos
    const metricsInterval = setInterval(updateSecurityMetrics, 30000);
    
    // Actualizar estado general cada 60 segundos
    const statusInterval = setInterval(updateSecurityStatus, 60000);
    
    return () => {
      clearInterval(metricsInterval);
      clearInterval(statusInterval);
    };
  };
  
  // ====================================
  // AUTHENTICATION METHODS
  // ====================================
  
  const login = useCallback(async (credentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const result = await securitySystem.secureLogin(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user: result.user,
        loading: false
      });
      
      // Cargar permisos del usuario
      await loadUserPermissions(result.user);
      
      // Cargar estado GDPR
      await loadUserGDPRConsent(result.user);
      
      return result;
      
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);
  
  const logout = useCallback(async () => {
    try {
      const authService = securitySystem.getServices().auth;
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
      setPermissions({});
      setGdprConsent(null);
      
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);
  
  // ====================================
  // AUTHORIZATION METHODS
  // ====================================
  
  const loadUserPermissions = async (user) => {
    try {
      const rbacService = securitySystem.getServices().rbac;
      const userRoles = rbacService.getUserRoles(user.id);
      const userPermissions = {};
      
      // Obtener todas las posibles permissions
      const allPermissions = rbacService.getAllPermissions();
      
      // Verificar cada permission
      allPermissions.forEach(permission => {
        userPermissions[permission] = rbacService.hasPermission(permission);
      });
      
      setPermissions(userPermissions);
      
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      setPermissions({});
    }
  };
  
  const checkAccess = useCallback(async (resource, action, context = {}) => {
    try {
      return await securitySystem.checkAccess(resource, action, context);
    } catch (error) {
      return false;
    }
  }, []);
  
  // ====================================
  // GDPR METHODS
  // ====================================
  
  const loadUserGDPRConsent = async (user) => {
    try {
      const gdprService = securitySystem.getServices().gdpr;
      const consentData = gdprService.getUserConsentData(user.id);
      setGdprConsent(consentData);
      
    } catch (error) {
      console.error('Failed to load GDPR consent:', error);
      setGdprConsent(null);
    }
  };
  
  const recordGDPRConsent = useCallback(async (consentType, purpose, granted = true) => {
    try {
      const gdprService = securitySystem.getServices().gdpr;
      const user = authState.user;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      await gdprService.recordConsent(user.id, consentType, purpose, granted);
      
      // Recargar consent data
      await loadUserGDPRConsent(user);
      
    } catch (error) {
      console.error('Failed to record GDPR consent:', error);
      throw error;
    }
  }, [authState.user]);
  
  const exportGDPRData = useCallback(async () => {
    try {
      const gdprService = securitySystem.getServices().gdpr;
      const user = authState.user;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return await gdprService.exportUserData(user.id);
      
    } catch (error) {
      console.error('Failed to export GDPR data:', error);
      throw error;
    }
  }, [authState.user]);
  
  const deleteGDPRData = useCallback(async () => {
    try {
      const gdprService = securitySystem.getServices().gdpr;
      const user = authState.user;
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      await gdprService.deleteUserData(user.id);
      
      // Logout después de eliminar datos
      await logout();
      
    } catch (error) {
      console.error('Failed to delete GDPR data:', error);
      throw error;
    }
  }, [authState.user, logout]);
  
  // ====================================
  // MONITORING METHODS
  // ====================================
  
  const updateSecurityMetrics = useCallback(() => {
    try {
      const status = securitySystem.getSecurityStatus();
      setSecurityMetrics(status.metrics);
    } catch (error) {
      console.error('Failed to update security metrics:', error);
    }
  }, []);
  
  const updateSecurityStatus = useCallback(() => {
    try {
      const status = securitySystem.getSecurityStatus();
      setSecurityStatus(status);
      setSecurityMetrics(status.metrics);
    } catch (error) {
      console.error('Failed to update security status:', error);
    }
  }, []);
  
  // ====================================
  // CONTEXT VALUE
  // ====================================
  
  const contextValue = {
    // Sistema de seguridad
    securitySystem,
    isInitialized,
    securityStatus,
    
    // Estado de autenticación
    authState,
    
    // Permisos
    permissions,
    
    // GDPR
    gdprConsent,
    
    // Métricas
    securityMetrics,
    securityEvents,
    
    // Métodos de autenticación
    login,
    logout,
    
    // Métodos de autorización
    checkAccess,
    
    // Métodos GDPR
    recordGDPRConsent,
    exportGDPRData,
    deleteGDPRData,
    
    // Métodos de monitoreo
    updateSecurityStatus,
    updateSecurityMetrics
  };
  
  // ====================================
  // ERROR BOUNDARY
  // ====================================
  
  if (!isInitialized) {
    return (
      <div className="security-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Initializing Security System...</p>
        </div>
        <style jsx>{`
          .security-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #f5f5f5;
          }
          .loading-spinner {
            text-align: center;
          }
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 20px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// ====================================
// HOOKS
// ====================================

/**
 * Hook principal para usar el contexto de seguridad
 */
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  
  return context;
};

/**
 * Hook para autenticación
 */
export const useAuth = () => {
  const { authState, login, logout } = useSecurity();
  
  return {
    ...authState,
    login,
    logout
  };
};

/**
 * Hook para autorización
 */
export const useAuthorization = () => {
  const { permissions, checkAccess } = useSecurity();
  
  return {
    permissions,
    checkAccess,
    hasPermission: (permission) => permissions[permission] || false
  };
};

/**
 * Hook para GDPR
 */
export const useGDPR = () => {
  const { 
    gdprConsent, 
    recordGDPRConsent, 
    exportGDPRData, 
    deleteGDPRData 
  } = useSecurity();
  
  return {
    gdprConsent,
    recordConsent: recordGDPRConsent,
    exportData: exportGDPRData,
    deleteData: deleteGDPRData,
    hasConsent: (type, purpose) => {
      return gdprConsent?.consents?.some(consent => 
        consent.type === type && 
        consent.purpose === purpose && 
        consent.granted &&
        new Date(consent.expiresAt) > new Date()
      ) || false;
    }
  };
};

/**
 * Hook para métricas de seguridad
 */
export const useSecurityMetrics = () => {
  const { securityMetrics, securityStatus, updateSecurityStatus } = useSecurity();
  
  return {
    metrics: securityMetrics,
    status: securityStatus,
    refresh: updateSecurityStatus
  };
};

// ====================================
// EXPORTS
// ====================================

export default SecurityProvider;
