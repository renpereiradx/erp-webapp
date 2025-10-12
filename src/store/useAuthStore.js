import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import authService from '../services/authService';
import apiService from '../services/api';

const useAuthStore = create()(
  devtools(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false, // Estado de carga para la acción de login
      error: null, // Estado de error para la acción de login
      authLoading: true, // Para la carga inicial de la app

      initializeAuth: () => {
        try {
          const token = apiService.getToken();
          if (token) {
            // Aquí podrías decodificar el token para obtener info del usuario si fuera necesario
            set({ isAuthenticated: true, token, authLoading: false });
          } else {
            set({ authLoading: false });
          }
        } catch (e) {
          set({ authLoading: false });
        }
      },

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(credentials);
          if (response && response.token) {
            apiService.setToken(response.token);
            set({ 
              isAuthenticated: true, 
              user: response.user || { role_id: response.role_id }, 
              token: response.token, 
              loading: false 
            });
          } else {
            throw new Error(response.message || 'Respuesta de login inválida');
          }
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      logout: () => {
        authService.logout();
        apiService.clearToken();
        set({ isAuthenticated: false, user: null, token: null, error: null });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    { name: 'auth-store' }
  )
);

export default useAuthStore;
