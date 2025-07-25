/**
 * Hook personalizado para debuggear el estado de autenticación
 */

import { useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';

export const useAuthDebug = () => {
  const authState = useAuthStore();
  
  useEffect(() => {
    // Debug logging removed for production
  }, [authState.isAuthenticated, authState.loading, authState.user]);
  
  return authState;
};

export default useAuthDebug;
