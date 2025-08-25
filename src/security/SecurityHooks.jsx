/**
 * Wave 7: Security & Compliance Enterprise
 * RBAC React Hooks & Components
 * 
 * Hooks y componentes React para integración RBAC:
 * - usePermissions hook
 * - useRoles hook  
 * - ProtectedRoute component
 * - PermissionGate component
 * - Security context
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from './JWTAuthService';
import RBACService, { ROLES, PERMISSIONS } from './RBACService';

// ====================================
// SECURITY CONTEXT
// ====================================

const SecurityContext = createContext(null);

/**
 * Provider de contexto de seguridad
 */
export const SecurityProvider = ({ children }) => {
  const [rbacService] = useState(() => new RBACService(authService));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Verificar autenticación inicial
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Listener para cambios de autenticación
    const handleAuthChange = (event) => {
      if (event.detail.type === 'logout') {
        setUser(null);
        setIsAuthenticated(false);
        rbacService.clearCache();
      } else if (event.detail.type === 'login') {
        setUser(event.detail.user);
        setIsAuthenticated(true);
        rbacService.clearCache();
      }
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [rbacService]);
  
  const value = {
    user,
    isAuthenticated,
    loading,
    rbacService,
    authService
  };
  
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook para usar el contexto de seguridad
 */
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// ====================================
// PERMISSION HOOKS
// ====================================

/**
 * Hook para verificar permisos
 */
export const usePermissions = (permissions = []) => {
  const { rbacService, isAuthenticated } = useSecurity();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setHasPermission(false);
      setLoading(false);
      return;
    }
    
    const checkPermissions = () => {
      if (Array.isArray(permissions)) {
        // Verificar múltiples permisos (AND)
        const result = rbacService.hasAllPermissions(permissions);
        setHasPermission(result);
      } else {
        // Verificar un solo permiso
        const result = rbacService.hasPermission(permissions);
        setHasPermission(result);
      }
      setLoading(false);
    };
    
    checkPermissions();
  }, [permissions, rbacService, isAuthenticated]);
  
  return {
    hasPermission,
    loading,
    hasAnyPermission: (perms) => rbacService.hasAnyPermission(perms),
    hasAllPermissions: (perms) => rbacService.hasAllPermissions(perms),
    requirePermission: (perm, action, context) => 
      rbacService.requirePermission(perm, action, context)
  };
};

/**
 * Hook para verificar roles
 */
export const useRoles = (roles = []) => {
  const { rbacService, isAuthenticated } = useSecurity();
  const [hasRole, setHasRole] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setHasRole(false);
      setUserRoles([]);
      setLoading(false);
      return;
    }
    
    const checkRoles = () => {
      const currentUserRoles = rbacService.getUserRoles();
      setUserRoles(currentUserRoles);
      
      if (Array.isArray(roles)) {
        const result = rbacService.hasAllRoles(roles);
        setHasRole(result);
      } else {
        const result = rbacService.hasRole(roles);
        setHasRole(result);
      }
      setLoading(false);
    };
    
    checkRoles();
  }, [roles, rbacService, isAuthenticated]);
  
  return {
    hasRole,
    userRoles,
    loading,
    hasAnyRole: (roleList) => rbacService.hasAnyRole(roleList),
    hasAllRoles: (roleList) => rbacService.hasAllRoles(roleList),
    isAdmin: () => rbacService.isAdmin(),
    isSuperAdmin: () => rbacService.isSuperAdmin()
  };
};

/**
 * Hook para acciones protegidas
 */
export const useSecureAction = () => {
  const { rbacService } = useSecurity();
  
  const executeSecureAction = async (action, requiredPermission, context = {}) => {
    try {
      // Verificar permiso antes de ejecutar
      rbacService.requirePermission(requiredPermission, action.name, context);
      
      // Ejecutar acción
      const result = await action();
      
      // Log éxito
      console.log(`✅ Secure action executed: ${action.name}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Secure action failed: ${action.name}`, error);
      throw error;
    }
  };
  
  return { executeSecureAction };
};

// ====================================
// PROTECTED COMPONENTS
// ====================================

/**
 * Componente para rutas protegidas
 */
export const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallback = null,
  redirectTo = '/unauthorized'
}) => {
  const { isAuthenticated, loading } = useSecurity();
  const { hasPermission } = usePermissions(requiredPermissions);
  const { hasRole } = useRoles(requiredRoles);
  const location = useLocation();
  
  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificar permisos y roles
  const hasRequiredPermissions = requiredPermissions.length === 0 || hasPermission;
  const hasRequiredRoles = requiredRoles.length === 0 || hasRole;
  
  if (!hasRequiredPermissions || !hasRequiredRoles) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

/**
 * Gate component para mostrar/ocultar contenido basado en permisos
 */
export const PermissionGate = ({ 
  permission, 
  permissions = [],
  roles = [],
  mode = 'all', // 'all' | 'any'
  children, 
  fallback = null,
  showError = false
}) => {
  const { rbacService, isAuthenticated } = useSecurity();
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  let hasAccess = false;
  
  // Verificar permisos únicos
  if (permission) {
    hasAccess = rbacService.hasPermission(permission);
  }
  
  // Verificar múltiples permisos
  if (permissions.length > 0) {
    if (mode === 'all') {
      hasAccess = rbacService.hasAllPermissions(permissions);
    } else {
      hasAccess = rbacService.hasAnyPermission(permissions);
    }
  }
  
  // Verificar roles
  if (roles.length > 0) {
    const roleAccess = mode === 'all' 
      ? rbacService.hasAllRoles(roles)
      : rbacService.hasAnyRole(roles);
    
    hasAccess = hasAccess || roleAccess;
  }
  
  if (!hasAccess) {
    if (showError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Acceso Denegado
              </h3>
              <div className="mt-2 text-sm text-red-700">
                No tienes permisos para ver este contenido.
              </div>
            </div>
          </div>
        </div>
      );
    }
    return fallback;
  }
  
  return children;
};

/**
 * Componente para mostrar información del usuario con roles
 */
export const UserInfo = ({ className = "" }) => {
  const { user, isAuthenticated } = useSecurity();
  const { userRoles } = useRoles();
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className={`user-info ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {user.name || 'Usuario'}
          </div>
          <div className="text-xs text-gray-500">
            {userRoles.join(', ') || 'Sin roles'}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HOC para proteger componentes
 */
export const withPermission = (WrappedComponent, requiredPermission) => {
  return function PermissionWrapper(props) {
    const { hasPermission } = usePermissions(requiredPermission);
    
    if (!hasPermission) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-sm text-yellow-700">
            Permisos insuficientes para acceder a esta función.
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

/**
 * HOC para proteger componentes con roles
 */
export const withRole = (WrappedComponent, requiredRole) => {
  return function RoleWrapper(props) {
    const { hasRole } = useRoles(requiredRole);
    
    if (!hasRole) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-sm text-yellow-700">
            Rol insuficiente para acceder a esta función.
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// ====================================
// UTILITY COMPONENTS
// ====================================

/**
 * Botón con verificación de permisos
 */
export const SecureButton = ({ 
  permission, 
  onClick, 
  children, 
  className = "",
  disabled = false,
  ...props 
}) => {
  const { hasPermission } = usePermissions(permission);
  const { executeSecureAction } = useSecureAction();
  
  const handleClick = async (event) => {
    if (!hasPermission) return;
    
    try {
      await executeSecureAction(
        () => onClick(event),
        permission,
        { component: 'SecureButton' }
      );
    } catch (error) {
      console.error('Secure button action failed:', error);
    }
  };
  
  const isDisabled = disabled || !hasPermission;
  
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${className}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={!hasPermission ? 'Sin permisos' : ''}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Link con verificación de permisos
 */
export const SecureLink = ({ 
  permission, 
  to, 
  children, 
  className = "",
  ...props 
}) => {
  const { hasPermission } = usePermissions(permission);
  
  if (!hasPermission) {
    return (
      <span 
        className={`${className} opacity-50 cursor-not-allowed`}
        title="Sin permisos"
      >
        {children}
      </span>
    );
  }
  
  return (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  );
};

// ====================================
// EXPORTS
// ====================================

export { ROLES, PERMISSIONS };
export default {
  SecurityProvider,
  useSecurity,
  usePermissions,
  useRoles,
  useSecureAction,
  ProtectedRoute,
  PermissionGate,
  UserInfo,
  withPermission,
  withRole,
  SecureButton,
  SecureLink
};
