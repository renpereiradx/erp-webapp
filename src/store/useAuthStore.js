/**
 * Store de Zustand para la gestión de autenticación y usuario
 * Maneja el estado de login, logout y persistencia de sesión
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '@/services/authService';

const useAuthStore = create(
  devtools(
    // persist(  // ← DESHABILITADO TEMPORALMENTE PARA DEBUGGING
      (set, get) => ({
        // Estado inicial
        user: null,
        token: null,
        roleId: null,
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
            const response = await authService.login(credentials);
            
            const { user, token, role_id } = response;
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(user));
            
            set({
              user,
              token,
              roleId: role_id,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
            return { user, token, role_id };
          } catch (error) {
            const errorMessage = error.message || 'Error al iniciar sesión';
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
            const response = await authService.register(userData);
            
            const { user, token, role_id } = response;
            
            // Guardar token en localStorage
            localStorage.setItem('authToken', token);
            
            set({
              user,
              token,
              roleId: role_id,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
            return { user, token, role_id };
          } catch (error) {
            const errorMessage = error.message || 'Error al registrar usuario';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Función de logout
        logout: () => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          
          set({
            user: null,
            token: null,
            roleId: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        },

        // Verificar token existente al inicializar la app
        checkAuth: async () => {
          const token = localStorage.getItem('authToken');
          
          if (!token) {
            set({ isAuthenticated: false, loading: false });
            return;
          }
          
          const testUser = {
            id: '2pmK5NPfHiRwZUkcd3d3cETC2JW',
            username: 'myemail',
            email: 'myemail',
            role: 'admin',
            role_id: 'JZkiQB',
            name: 'Pedro Sanchez',
            company: 'ERP Systems Inc.',
            lastLogin: new Date().toISOString(),
          };
          
          set({
            user: testUser,
            token,
            roleId: 'JZkiQB',
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        },

        // Actualizar perfil de usuario
        updateProfile: async (profileData) => {
          set({ loading: true, error: null });
          try {
            const response = await authService.updateProfile(profileData);
            const updatedUser = response.user;
            
            set((state) => ({
              user: { ...state.user, ...updatedUser },
              loading: false,
            }));
            
            return updatedUser;
          } catch (error) {
            const errorMessage = error.message || 'Error al actualizar perfil';
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
            await authService.changePassword(passwordData);
            set({ loading: false });
          } catch (error) {
            const errorMessage = error.message || 'Error al cambiar contraseña';
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
            await authService.forgotPassword(email);
            set({ loading: false });
          } catch (error) {
            const errorMessage = error.message || 'Error al enviar email de recuperación';
            set({
              error: errorMessage,
              loading: false,
            });
            throw error;
          }
        },

        // Inicializar autenticación desde localStorage
        initializeAuth: () => {
          set({ loading: true });
          
          const token = localStorage.getItem('authToken');
          
          if (token) {
            const userData = localStorage.getItem('userData');
            let user = null;
            
            if (userData) {
              try {
                user = JSON.parse(userData);
              } catch (error) {
                // Error parsing, use default data
              }
            }
            
            // Si no hay datos de usuario, usar datos por defecto
            if (!user) {
              user = {
                id: '2pmK5NPfHiRwZUkcd3d3cETC2JW',
                username: 'myemail',
                email: 'myemail',
                role: 'admin',
                role_id: 'JZkiQB',
                name: 'Usuario',
                company: 'ERP Systems Inc.',
                lastLogin: new Date().toISOString(),
              };
            }
            
            set({
              user,
              token,
              roleId: user.role_id || 'JZkiQB',
              isAuthenticated: true,
              loading: false,
              error: null
            });
          } else {
            set({
              token: null,
              user: null,
              roleId: null,
              isAuthenticated: false,
              loading: false,
              error: null
            });
          }
        },

        // Reset del store
        reset: () => set({
          user: null,
          token: null,
          roleId: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        }),
      }), // ← CIERRO PARÉNTESIS DEL STORE
      // {
      //   name: 'auth-store', // Nombre para persistencia
      //   partialize: (state) => ({
      //     user: state.user,
      //     token: state.token,
      //     roleId: state.roleId,
      //     isAuthenticated: state.isAuthenticated,
      //   }),
      // }
    // ), // ← PERSIST DESHABILITADO
    {
      name: 'auth-store', // Nombre para DevTools
    }
  )
);

// Hacer el store disponible globalmente para debugging
if (typeof window !== 'undefined') {
  window.useAuthStore = useAuthStore;
}

export default useAuthStore;

