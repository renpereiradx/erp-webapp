/**
 * Context de autenticación compatible con React 19
 * Reemplaza Zustand para evitar problemas de compatibilidad
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const initializeAuth = () => {
    try {
      const savedToken = apiService.getToken();
      if (savedToken) {
        setIsAuthenticated(true);
        setToken(savedToken);
        setAuthLoading(false);
      } else {
        setAuthLoading(false);
      }
    } catch (e) {
      setAuthLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      if (result.success && result.token) {
        // 🔧 FIX: Asegurar que el token se guarde correctamente antes de actualizar el estado
        // Esto previene race conditions donde los componentes intentan hacer requests
        // antes de que el token esté disponible
        apiService.setToken(result.token);

        // Verificar que el token se guardó correctamente
        const savedToken = apiService.getToken();
        if (!savedToken || savedToken !== result.token) {
          throw new Error('Error al guardar el token de autenticación');
        }

        // Actualizar estado solo después de verificar que el token está guardado
        setIsAuthenticated(true);
        setUser(result.user);
        setToken(result.token);
        setError(null);
      } else {
        setError(result.message || 'Login failed');
      }
      return result;
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during login';
      setError(errorMessage);
      // Limpiar cualquier token residual en caso de error
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
  }, []);

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
      initializeAuth
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
