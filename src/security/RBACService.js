/**
 * Wave 7: Security & Compliance Enterprise
 * RBAC (Role-Based Access Control) System
 * 
 * Sistema completo de control de acceso basado en roles:
 * - Definición de roles y permisos granulares
 * - Verificación de permisos en tiempo real
 * - Guards para rutas y componentes
 * - Audit trail de acciones privilegiadas
 * - Principio de menor privilegio
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

// ====================================
// RBAC CONFIGURATION
// ====================================

/**
 * Definición de roles del sistema ERP
 */
export const ROLES = {
  // Roles administrativos
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  
  // Roles operacionales
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  
  // Roles de usuario
  USER: 'user',
  READONLY: 'readonly',
  
  // Roles especializados
  ACCOUNTANT: 'accountant',
  SALES_REP: 'sales_rep',
  INVENTORY_MANAGER: 'inventory_manager'
};

/**
 * Definición de permisos granulares
 */
export const PERMISSIONS = {
  // Gestión de clientes
  CLIENTS: {
    CREATE: 'clients:create',
    READ: 'clients:read',
    UPDATE: 'clients:update',
    DELETE: 'clients:delete',
    EXPORT: 'clients:export',
    IMPORT: 'clients:import'
  },
  
  // Gestión de productos
  PRODUCTS: {
    CREATE: 'products:create',
    READ: 'products:read',
    UPDATE: 'products:update',
    DELETE: 'products:delete',
    MANAGE_INVENTORY: 'products:manage_inventory',
    SET_PRICES: 'products:set_prices'
  },
  
  // Gestión de reservas
  RESERVATIONS: {
    CREATE: 'reservations:create',
    READ: 'reservations:read',
    UPDATE: 'reservations:update',
    DELETE: 'reservations:delete',
    APPROVE: 'reservations:approve',
    CANCEL: 'reservations:cancel'
  },
  
  // Gestión de compras
  PURCHASES: {
    CREATE: 'purchases:create',
    READ: 'purchases:read',
    UPDATE: 'purchases:update',
    DELETE: 'purchases:delete',
    APPROVE: 'purchases:approve',
    BUDGET_OVERRIDE: 'purchases:budget_override'
  },
  
  // Analytics y reportes
  ANALYTICS: {
    VIEW_BASIC: 'analytics:view_basic',
    VIEW_DETAILED: 'analytics:view_detailed',
    VIEW_FINANCIAL: 'analytics:view_financial',
    EXPORT_REPORTS: 'analytics:export_reports'
  },
  
  // Administración del sistema
  SYSTEM: {
    MANAGE_USERS: 'system:manage_users',
    MANAGE_ROLES: 'system:manage_roles',
    VIEW_LOGS: 'system:view_logs',
    MANAGE_SETTINGS: 'system:manage_settings',
    BACKUP_RESTORE: 'system:backup_restore'
  },
  
  // Compliance y auditoría
  COMPLIANCE: {
    VIEW_AUDIT_LOGS: 'compliance:view_audit_logs',
    EXPORT_COMPLIANCE_DATA: 'compliance:export_compliance_data',
    MANAGE_DATA_RETENTION: 'compliance:manage_data_retention',
    GDPR_OPERATIONS: 'compliance:gdpr_operations'
  }
};

/**
 * Mapeo de roles a permisos
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Todos los permisos del sistema
    ...Object.values(PERMISSIONS.CLIENTS),
    ...Object.values(PERMISSIONS.PRODUCTS),
    ...Object.values(PERMISSIONS.RESERVATIONS),
    ...Object.values(PERMISSIONS.PURCHASES),
    ...Object.values(PERMISSIONS.ANALYTICS),
    ...Object.values(PERMISSIONS.SYSTEM),
    ...Object.values(PERMISSIONS.COMPLIANCE)
  ],
  
  [ROLES.ADMIN]: [
    // Permisos administrativos sin gestión de sistema crítico
    ...Object.values(PERMISSIONS.CLIENTS),
    ...Object.values(PERMISSIONS.PRODUCTS),
    ...Object.values(PERMISSIONS.RESERVATIONS),
    ...Object.values(PERMISSIONS.PURCHASES),
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.SYSTEM.MANAGE_USERS,
    PERMISSIONS.SYSTEM.VIEW_LOGS,
    PERMISSIONS.COMPLIANCE.VIEW_AUDIT_LOGS
  ],
  
  [ROLES.MANAGER]: [
    // Gestión operacional completa
    ...Object.values(PERMISSIONS.CLIENTS),
    ...Object.values(PERMISSIONS.PRODUCTS),
    ...Object.values(PERMISSIONS.RESERVATIONS),
    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.UPDATE,
    PERMISSIONS.PURCHASES.APPROVE,
    PERMISSIONS.ANALYTICS.VIEW_BASIC,
    PERMISSIONS.ANALYTICS.VIEW_DETAILED,
    PERMISSIONS.ANALYTICS.EXPORT_REPORTS
  ],
  
  [ROLES.SUPERVISOR]: [
    // Supervisión y aprobaciones
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.CLIENTS.UPDATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
    ...Object.values(PERMISSIONS.RESERVATIONS),
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.APPROVE,
    PERMISSIONS.ANALYTICS.VIEW_BASIC
  ],
  
  [ROLES.USER]: [
    // Usuario estándar
    PERMISSIONS.CLIENTS.CREATE,
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.CLIENTS.UPDATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.RESERVATIONS.CREATE,
    PERMISSIONS.RESERVATIONS.READ,
    PERMISSIONS.RESERVATIONS.UPDATE,
    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ
  ],
  
  [ROLES.READONLY]: [
    // Solo lectura
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.RESERVATIONS.READ,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.ANALYTICS.VIEW_BASIC
  ],
  
  [ROLES.ACCOUNTANT]: [
    // Gestión financiera
    PERMISSIONS.CLIENTS.READ,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.SET_PRICES,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.APPROVE,
    ...Object.values(PERMISSIONS.ANALYTICS),
    PERMISSIONS.COMPLIANCE.VIEW_AUDIT_LOGS
  ],
  
  [ROLES.SALES_REP]: [
    // Representante de ventas
    ...Object.values(PERMISSIONS.CLIENTS),
    PERMISSIONS.PRODUCTS.READ,
    ...Object.values(PERMISSIONS.RESERVATIONS),
    PERMISSIONS.ANALYTICS.VIEW_BASIC
  ],
  
  [ROLES.INVENTORY_MANAGER]: [
    // Gestión de inventario
    PERMISSIONS.CLIENTS.READ,
    ...Object.values(PERMISSIONS.PRODUCTS),
    PERMISSIONS.RESERVATIONS.READ,
    PERMISSIONS.PURCHASES.CREATE,
    PERMISSIONS.PURCHASES.READ,
    PERMISSIONS.PURCHASES.UPDATE,
    PERMISSIONS.ANALYTICS.VIEW_BASIC
  ]
};

// ====================================
// RBAC SERVICE CLASS
// ====================================

export class RBACService {
  constructor(authService) {
    this.authService = authService;
    this.cache = new Map();
    this.auditLog = [];
  }
  
  // ====================================
  // PERMISSION CHECKING
  // ====================================
  
  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission) {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    // Cache key
    const cacheKey = `${user.id}:${permission}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Verificar permisos por roles
    const userRoles = user.roles || [];
    const hasPermission = userRoles.some(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      return rolePermissions.includes(permission);
    });
    
    // Cache result
    this.cache.set(cacheKey, hasPermission);
    
    // Audit log para permisos críticos
    if (this.isCriticalPermission(permission)) {
      this.logPermissionCheck(permission, hasPermission);
    }
    
    return hasPermission;
  }
  
  /**
   * Verificar múltiples permisos (AND)
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }
  
  /**
   * Verificar al menos uno de varios permisos (OR)
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }
  
  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role) {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    const userRoles = user.roles || [];
    return userRoles.includes(role);
  }
  
  /**
   * Verificar múltiples roles (AND)
   */
  hasAllRoles(roles) {
    return roles.every(role => this.hasRole(role));
  }
  
  /**
   * Verificar al menos uno de varios roles (OR)
   */
  hasAnyRole(roles) {
    return roles.some(role => this.hasRole(role));
  }
  
  // ====================================
  // ACCESS CONTROL GUARDS
  // ====================================
  
  /**
   * Guard para funciones que requieren permisos
   */
  requirePermission(permission, action, context = {}) {
    if (!this.hasPermission(permission)) {
      const error = new PermissionDeniedError(permission, context);
      
      // Log intento de acceso no autorizado
      this.logUnauthorizedAccess(permission, action, context);
      
      throw error;
    }
    
    // Log acceso autorizado
    this.logAuthorizedAccess(permission, action, context);
  }
  
  /**
   * Guard para roles específicos
   */
  requireRole(role, action, context = {}) {
    if (!this.hasRole(role)) {
      const error = new RoleRequiredError(role, context);
      
      this.logUnauthorizedAccess(`role:${role}`, action, context);
      
      throw error;
    }
    
    this.logAuthorizedAccess(`role:${role}`, action, context);
  }
  
  /**
   * Guard condicional con callback
   */
  requireCondition(conditionFn, errorMessage, context = {}) {
    if (!conditionFn()) {
      const error = new AccessDeniedError(errorMessage, context);
      
      this.logUnauthorizedAccess('condition', errorMessage, context);
      
      throw error;
    }
  }
  
  // ====================================
  // UTILITY METHODS
  // ====================================
  
  /**
   * Obtener todos los permisos del usuario actual
   */
  getUserPermissions() {
    const user = this.authService.getCurrentUser();
    if (!user) return [];
    
    const userRoles = user.roles || [];
    const permissions = new Set();
    
    userRoles.forEach(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(permission => permissions.add(permission));
    });
    
    return Array.from(permissions);
  }
  
  /**
   * Obtener roles del usuario actual
   */
  getUserRoles() {
    const user = this.authService.getCurrentUser();
    return user?.roles || [];
  }
  
  /**
   * Verificar si es administrador
   */
  isAdmin() {
    return this.hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);
  }
  
  /**
   * Verificar si es super administrador
   */
  isSuperAdmin() {
    return this.hasRole(ROLES.SUPER_ADMIN);
  }
  
  /**
   * Filtrar elementos basado en permisos
   */
  filterByPermission(items, permissionKey) {
    return items.filter(item => {
      const permission = item[permissionKey];
      return permission ? this.hasPermission(permission) : true;
    });
  }
  
  // ====================================
  // AUDIT & LOGGING
  // ====================================
  
  /**
   * Verificar si un permiso es crítico
   */
  isCriticalPermission(permission) {
    const criticalPermissions = [
      ...Object.values(PERMISSIONS.SYSTEM),
      ...Object.values(PERMISSIONS.COMPLIANCE),
      PERMISSIONS.PURCHASES.BUDGET_OVERRIDE,
      PERMISSIONS.PRODUCTS.SET_PRICES
    ];
    
    return criticalPermissions.includes(permission);
  }
  
  /**
   * Log verificación de permisos
   */
  logPermissionCheck(permission, granted) {
    const logEntry = {
      type: 'PERMISSION_CHECK',
      permission,
      granted,
      user: this.authService.getCurrentUser()?.id,
      timestamp: Date.now()
    };
    
    this.auditLog.push(logEntry);
    this.sendAuditLog(logEntry);
  }
  
  /**
   * Log acceso autorizado
   */
  logAuthorizedAccess(permission, action, context) {
    const logEntry = {
      type: 'AUTHORIZED_ACCESS',
      permission,
      action,
      context,
      user: this.authService.getCurrentUser()?.id,
      timestamp: Date.now()
    };
    
    this.auditLog.push(logEntry);
    this.sendAuditLog(logEntry);
  }
  
  /**
   * Log intento de acceso no autorizado
   */
  logUnauthorizedAccess(permission, action, context) {
    const logEntry = {
      type: 'UNAUTHORIZED_ACCESS',
      permission,
      action,
      context,
      user: this.authService.getCurrentUser()?.id,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      severity: 'HIGH'
    };
    
    this.auditLog.push(logEntry);
    this.sendAuditLog(logEntry);
    
    // Alerta de seguridad
    console.warn('🚨 Unauthorized access attempt:', logEntry);
  }
  
  /**
   * Enviar log de auditoría
   */
  sendAuditLog(logEntry) {
    // Enviar al servidor de auditoría
    navigator.sendBeacon('/api/security/audit', JSON.stringify(logEntry));
  }
  
  /**
   * Limpiar cache de permisos
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Obtener estadísticas de auditoría
   */
  getAuditStats() {
    const stats = {
      total: this.auditLog.length,
      authorized: 0,
      unauthorized: 0,
      criticalAccess: 0
    };
    
    this.auditLog.forEach(entry => {
      if (entry.type === 'AUTHORIZED_ACCESS') stats.authorized++;
      if (entry.type === 'UNAUTHORIZED_ACCESS') stats.unauthorized++;
      if (this.isCriticalPermission(entry.permission)) stats.criticalAccess++;
    });
    
    return stats;
  }
}

// ====================================
// CUSTOM ERRORS
// ====================================

export class PermissionDeniedError extends Error {
  constructor(permission, context = {}) {
    super(`Permission denied: ${permission}`);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
    this.context = context;
  }
}

export class RoleRequiredError extends Error {
  constructor(role, context = {}) {
    super(`Role required: ${role}`);
    this.name = 'RoleRequiredError';
    this.role = role;
    this.context = context;
  }
}

export class AccessDeniedError extends Error {
  constructor(message, context = {}) {
    super(`Access denied: ${message}`);
    this.name = 'AccessDeniedError';
    this.context = context;
  }
}

// ====================================
// EXPORTS
// ====================================

export default RBACService;
