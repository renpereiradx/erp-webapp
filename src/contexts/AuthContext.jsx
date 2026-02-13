/**
 * Context de autenticación compatible con React 19
 * Reemplaza Zustand para evitar problemas de compatibilidad
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import apiService from '../services/api';
import userService from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const initializeAuth = async () => {
    try {
      const savedToken = apiService.getToken();
      if (savedToken) {
        setToken(savedToken);
        setIsAuthenticated(true);
        
        // Fetch current user data to ensure we have real data
        try {
          const response = await userService.getMe();
          if (response.success && response.data) {
            setUser(response.data);
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
  };

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.token) {
        // Guardar token en localStorage
        apiService.setToken(result.token);

        // Verificar que el token se guardó correctamente
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
            setUser(meResponse.data);
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
    } catch (error) {
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
