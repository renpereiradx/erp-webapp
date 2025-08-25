/**
 * Wave 7: Security & Compliance Enterprise
 * Security Module Index
 * 
 * Punto de entrada principal para todo el sistema de seguridad integrado.
 * Este módulo exporta todos los componentes, servicios y hooks de seguridad.
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

// ====================================
// CORE SECURITY SERVICES
// ====================================

// Sistema integrado de seguridad
export { default as SecuritySystem, securitySystem } from './SecuritySystem';

// Servicios individuales
export { default as JWTAuthService, authService } from './JWTAuthService';
export { default as RBACService } from './RBACService';
export { default as GDPRComplianceService } from './GDPRCompliance';
export { default as CSPService } from './CSPService';
export { default as AuditLogger, auditLogger } from './AuditLogger';

// ====================================
// REACT COMPONENTS & PROVIDERS
// ====================================

// Proveedor principal de seguridad
export { 
  default as SecurityProvider,
  useSecurity,
  useAuth,
  useAuthorization,
  useGDPR,
  useSecurityMetrics
} from './SecurityProvider';

// Hooks y componentes de seguridad
export {
  usePermissions,
  useRoles,
  ProtectedRoute,
  PermissionGate,
  SecureButton,
  SecurityContext,
  RoleProvider,
  useSecurityHooks
} from './SecurityHooks';

// Dashboard de seguridad
export { default as SecurityDashboard } from './SecurityDashboard';

// ====================================
// CONFIGURATION
// ====================================

// Configuración de seguridad
export {
  default as SecurityConfig,
  AUTH_CONFIG,
  RBAC_CONFIG,
  GDPR_CONFIG,
  CSP_CONFIG,
  AUDIT_CONFIG,
  MONITORING_CONFIG,
  ENV_CONFIG,
  getCurrentConfig,
  validateSecurityConfig
} from './SecurityConfig';

// ====================================
// UTILITIES & HELPERS
// ====================================

/**
 * Inicializa el sistema de seguridad completo
 * @returns {Promise<Object>} Sistema de seguridad inicializado
 */
export const initializeSecurity = async () => {
  try {
    console.log('🔒 Initializing ERP Security System...');
    
    // Validar configuración
    const configValidation = validateSecurityConfig();
    if (!configValidation.valid) {
      console.warn('⚠️ Security configuration issues:', configValidation.issues);
    }
    
    // Esperar que el sistema de seguridad esté listo
    await waitForInitialization();
    
    console.log('✅ ERP Security System initialized successfully');
    
    return {
      system: securitySystem,
      services: securitySystem.getServices(),
      status: securitySystem.getSecurityStatus()
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize security system:', error);
    throw error;
  }
};

/**
 * Espera a que el sistema de seguridad esté completamente inicializado
 */
const waitForInitialization = async () => {
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

/**
 * Obtiene el estado actual del sistema de seguridad
 * @returns {Object} Estado del sistema
 */
export const getSecurityStatus = () => {
  return securitySystem.getSecurityStatus();
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {string} permission - Permiso a verificar
 * @returns {boolean} True si tiene el permiso
 */
export const checkPermission = (permission) => {
  const rbacService = securitySystem.getServices().rbac;
  return rbacService.hasPermission(permission);
};

/**
 * Verifica acceso a un recurso específico
 * @param {string} resource - Recurso
 * @param {string} action - Acción
 * @param {Object} context - Contexto adicional
 * @returns {Promise<boolean>} True si tiene acceso
 */
export const checkAccess = async (resource, action, context = {}) => {
  try {
    await securitySystem.checkAccess(resource, action, context);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Registra un evento de seguridad
 * @param {string} eventType - Tipo de evento
 * @param {Object} details - Detalles del evento
 */
export const logSecurityEvent = (eventType, details) => {
  const auditService = securitySystem.getServices().audit;
  auditService.logSecurityEvent(eventType, details);
};

/**
 * Obtiene las métricas de seguridad actuales
 * @returns {Object} Métricas de seguridad
 */
export const getSecurityMetrics = () => {
  return securitySystem.getSecurityStatus().metrics;
};

/**
 * Exporta datos de usuario para GDPR
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos exportados
 */
export const exportUserDataGDPR = async (userId) => {
  const gdprService = securitySystem.getServices().gdpr;
  return await gdprService.exportUserData(userId);
};

/**
 * Elimina datos de usuario (derecho al olvido GDPR)
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export const deleteUserDataGDPR = async (userId) => {
  const gdprService = securitySystem.getServices().gdpr;
  await gdprService.deleteUserData(userId);
};

/**
 * Registra consentimiento GDPR
 * @param {string} userId - ID del usuario
 * @param {string} consentType - Tipo de consentimiento
 * @param {string} purpose - Propósito
 * @param {boolean} granted - Si se otorgó el consentimiento
 * @returns {Promise<void>}
 */
export const recordGDPRConsent = async (userId, consentType, purpose, granted = true) => {
  const gdprService = securitySystem.getServices().gdpr;
  await gdprService.recordConsent(userId, consentType, purpose, granted);
};

// ====================================
// MIDDLEWARE & INTEGRATIONS
// ====================================

/**
 * Middleware de autenticación para React Router
 */
export const authMiddleware = (Component) => {
  return (props) => {
    const { authState } = useSecurity();
    
    if (!authState.isAuthenticated) {
      return <div>Please log in to access this page</div>;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Higher-Order Component para protección de rutas
 */
export const withAuth = (Component, requiredPermission = null) => {
  return (props) => {
    if (requiredPermission) {
      return (
        <ProtectedRoute requiredPermission={requiredPermission}>
          <Component {...props} />
        </ProtectedRoute>
      );
    }
    
    return authMiddleware(Component)(props);
  };
};

/**
 * Hook personalizado para operaciones seguras
 */
export const useSecureOperation = () => {
  const { checkAccess } = useSecurity();
  
  const executeSecure = async (resource, action, operation, context = {}) => {
    try {
      const hasAccess = await checkAccess(resource, action, context);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }
      
      return await operation();
      
    } catch (error) {
      logSecurityEvent('SECURE_OPERATION_FAILED', {
        resource,
        action,
        error: error.message,
        context
      });
      
      throw error;
    }
  };
  
  return { executeSecure };
};

// ====================================
// CONSTANTS & TYPES
// ====================================

// Eventos de seguridad
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  ACCESS_DENIED: 'ACCESS_DENIED',
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  DATA_ACCESS: 'DATA_ACCESS',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  GDPR_REQUEST: 'GDPR_REQUEST',
  CSP_VIOLATION: 'CSP_VIOLATION'
};

// Roles predefinidos
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
  INVENTORY: 'INVENTORY',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
  AUDITOR: 'AUDITOR',
  GUEST: 'GUEST'
};

// Permisos comunes
export const PERMISSIONS = {
  // Usuarios
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Productos
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  
  // Clientes
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_READ: 'clients:read',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // Órdenes
  ORDERS_CREATE: 'orders:create',
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',
  
  // Reportes
  REPORTS_READ: 'reports:read',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',
  
  // Auditoría
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export'
};

// ====================================
// VERSION INFO
// ====================================

export const SECURITY_VERSION = '1.0.0';
export const SECURITY_BUILD = 'Wave7-Enterprise';

console.log(`🔒 ERP Security Module v${SECURITY_VERSION} (${SECURITY_BUILD}) loaded`);

// ====================================
// DEFAULT EXPORT
// ====================================

export default {
  // Sistema principal
  SecuritySystem,
  securitySystem,
  
  // Servicios
  JWTAuthService,
  RBACService,
  GDPRComplianceService,
  CSPService,
  AuditLogger,
  
  // Componentes React
  SecurityProvider,
  SecurityDashboard,
  ProtectedRoute,
  PermissionGate,
  
  // Hooks
  useSecurity,
  useAuth,
  useAuthorization,
  useGDPR,
  useSecurityMetrics,
  usePermissions,
  useRoles,
  
  // Configuración
  SecurityConfig,
  
  // Utilidades
  initializeSecurity,
  getSecurityStatus,
  checkPermission,
  checkAccess,
  logSecurityEvent,
  getSecurityMetrics,
  
  // GDPR
  exportUserDataGDPR,
  deleteUserDataGDPR,
  recordGDPRConsent,
  
  // HOCs y middleware
  withAuth,
  authMiddleware,
  useSecureOperation,
  
  // Constantes
  SECURITY_EVENTS,
  ROLES,
  PERMISSIONS,
  SECURITY_VERSION,
  SECURITY_BUILD
};
