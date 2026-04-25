/**
 * Context de autenticación compatible con React 19
 * Reemplaza Zustand para evitar problemas de compatibilidad
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import authService from '../services/authService';
import apiService from '../services/api';
import userService from '../services/userService';
import { User } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  authLoading: boolean;
  login: (credentials: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    // El rol ADMIN siempre tiene todos los permisos
    if (user.role_id === 'admin') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const initializeAuth = useCallback(async () => {
    try {
      const savedToken = apiService.getToken();
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);

        // Fetch current user data to ensure we have real data
        try {
          const response = await userService.getMe();
          if (response.success && response.data) {
            const userData = response.data;
            
            // 🔧 FIX: Persistir roles encontrados en /me para el cliente API
            // Si el backend los devuelve aquí, los guardamos para los headers
            if (userData.role_id) localStorage.setItem('roleId', userData.role_id);
            if (userData.role_name) localStorage.setItem('roleName', userData.role_name);
            if (userData.active_branch) localStorage.setItem('activeBranch', userData.active_branch.toString());
            if (userData.allowed_branches) localStorage.setItem('allowedBranches', JSON.stringify(userData.allowed_branches));

            setUser({
              ...userData,
              // Mantener compatibilidad si vienen en el objeto o en localStorage
              role_id: userData.role_id || localStorage.getItem('roleId') || undefined,
              role_name: userData.role_name || localStorage.getItem('roleName') || undefined,
              active_branch: userData.active_branch || (localStorage.getItem('activeBranch') ? parseInt(localStorage.getItem('activeBranch')!) : undefined),
              allowed_branches: userData.allowed_branches || (localStorage.getItem('allowedBranches') ? JSON.parse(localStorage.getItem('allowedBranches')!) : undefined)
            });
          }
        } catch (e) {
          // Silent error: If token is invalid/expired, it's expected during init or refresh
        }
      }
    } catch (e) {
      // Silent error for base init
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.token) {
        // Guardar token en localStorage
        apiService.setToken(result.token);
        
        // 🔧 NUEVO: Persistir información de rol para el cliente API
        if (result.role_id) localStorage.setItem('roleId', result.role_id);
        if (result.role_name) localStorage.setItem('roleName', result.role_name);
        const savedToken = apiService.getToken();
        if (!savedToken || savedToken !== result.token) {
          throw new Error('Error al guardar el token de autenticación');
        }

        // Actualizar estado de autenticación básico
        setToken(result.token);
        setIsAuthenticated(true);
        
        // Cargar datos completos del usuario desde /me
        try {
          const meResponse = await userService.getMe();
          if (meResponse.success && meResponse.data) {
            // 🔧 FIX: Fusionar datos de /me con el role_id crítico del login
            // Esto asegura que role_id no se pierda si /me no lo devuelve en la raíz
            setUser({
              ...meResponse.data,
              role_id: result.role_id || meResponse.data.role_id,
              role_name: result.role_name || meResponse.data.role_name
            });
          } else {
            // Fallback al usuario de la respuesta de login si /me falla
            setUser(result.user);
          }
        } catch (e) {
          console.warn('Could not fetch full user details, using login response:', e);
          setUser(result.user);
        }
        
        setError(null);
        return { success: true };
      } else {
        // Login fallido - mostrar mensaje del servidor o genérico
        const errorMsg = result.message || result.error?.message || 'Credenciales inválidas';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      // Manejar errores de red o del servidor
      let errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Usuario no encontrado';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Error del servidor. Intenta más tarde.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      apiService.clearToken();
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Intentar logout en el servidor
      await authService.logout();
    } catch (error) {
      // Silent logout error - service might not be available
      console.warn('Logout service error:', error);
    }

    // 🔧 FIX: Limpiar token ANTES de actualizar el estado
    // Esto previene que requests pendientes usen un token inválido
    apiService.clearToken();

    // Verificar que el token se limpió correctamente
    const remainingToken = apiService.getToken();
    if (remainingToken) {
      console.error('Error: El token no se limpió correctamente');
      // Forzar limpieza directa de localStorage como fallback
      localStorage.removeItem('authToken');
    }

    // Actualizar estado después de limpiar el token
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setError(null);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    initializeAuth();

    // 🔧 FIX: Escuchar eventos de token expirado desde la API
    // Esto permite que el estado se actualice automáticamente cuando el token expira
    const handleUnauthorized = () => {
      console.warn('Token expirado detectado - cerrando sesión automáticamente');
      // Limpiar estado de autenticación
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    };

    window.addEventListener('api:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('api:unauthorized', handleUnauthorized);
    };
  }, [initializeAuth]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      token,
      loading,
      error,
      authLoading,
      login,
      logout,
      clearError,
      initializeAuth,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
