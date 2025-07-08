/**
 * Store de Zustand para la gestión de autenticación y usuario
 * Maneja el estado de login, logout y persistencia de sesión
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiService } from '@/services/api';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        // Acciones para manejo de loading y errores
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Función de login
        login: async (credentials) => {
          set({ loading: true, error: null });
          try {
            // Simular llamada a API de login
            const response = await apiService.post('/auth/login', credentials);
            
            const { user, token } = response;
            
            // Guardar token en localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
            return { user, token };
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
            set({
              error: errorMessage,
              loading: false,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        // Función de registro
        register: async (userData) => {
          set({ loading: true, error: null });
          try {
            const response = await apiService.post('/auth/register', userData);
            
            const { user, token } = response;
            
            // Guardar token en localStorage
            localStorage.setItem('auth_token', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
            return { user, token };
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al registrar usuario';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Función de logout
        logout: () => {
          // Limpiar token del localStorage
          localStorage.removeItem('auth_token');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        },

        // Verificar token existente al inicializar la app
        checkAuth: async () => {
          const token = localStorage.getItem('auth_token');
          
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }
          
          set({ loading: true });
          try {
            // Verificar token con el servidor
            const response = await apiService.get('/auth/me');
            const user = response.user || response;
            
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            });
          } catch (error) {
            // Token inválido o expirado
            localStorage.removeItem('auth_token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        },

        // Actualizar perfil de usuario
        updateProfile: async (profileData) => {
          set({ loading: true, error: null });
          try {
            const response = await apiService.put('/auth/profile', profileData);
            const updatedUser = response.user || response;
            
            set((state) => ({
              user: { ...state.user, ...updatedUser },
              loading: false,
            }));
            
            return updatedUser;
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al actualizar perfil';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Cambiar contraseña
        changePassword: async (passwordData) => {
          set({ loading: true, error: null });
          try {
            await apiService.put('/auth/change-password', passwordData);
            set({ loading: false });
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Recuperar contraseña
        forgotPassword: async (email) => {
          set({ loading: true, error: null });
          try {
            await apiService.post('/auth/forgot-password', { email });
            set({ loading: false });
          } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al enviar email de recuperación';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Reset del store
        reset: () => set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        }),
      }),
      {
        name: 'auth-store', // Nombre para persistencia
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store', // Nombre para DevTools
    }
  )
);

export default useAuthStore;

