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
      if (result.success) {
        console.log('🔐 AuthContext: Login successful, updating state...', result);
        
        // Almacenar token en apiService para persistencia
        if (result.token) {
          apiService.setToken(result.token);
        }
        setIsAuthenticated(true);
        setUser(result.user);
        setToken(result.token);
        setError(null);
        
        console.log('🔐 AuthContext: State updated, isAuthenticated should be true');
      } else {
        setError(result.message || 'Login failed');
      }
      return result;
    } catch (error) {
      const errorMessage = error.message || 'An error occurred during login';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout service error:', error);
    }
    
    // Limpiar estado local
    apiService.clearToken();
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setError(null);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    initializeAuth();
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