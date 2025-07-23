/**
 * Hook personalizado para debuggear el estado de autenticación
 */

import { useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';

export const useAuthDebug = () => {
  const authState = useAuthStore();
  
  useEffect(() => {
    console.log('🔍 AuthDebug: Estado de autenticación actualizado', {
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      user: authState.user,
      token: localStorage.getItem('token') ? '✅ Token presente' : '❌ Sin token',
      timestamp: new Date().toISOString()
    });
  }, [authState.isAuthenticated, authState.loading, authState.user]);
  
  return authState;
};

export default useAuthDebug;
