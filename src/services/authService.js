/**
 * Servicio de autenticación para el sistema ERP
 * Migrado para usar el cliente oficial del Business Management API
 */

import { apiClient } from './api';

// Helper para categorizar errores y proporcionar contexto adicional
const getErrorDetails = (error) => {
  const status = error.response?.status;
  const code = error.code;
  
  // Categorías de errores con iconos y sugerencias
  const errorCategories = {
    AUTHENTICATION: {
      icon: '🔐',
      title: 'Error de Autenticación',
      color: 'red'
    },
    NETWORK: {
      icon: '🌐',
      title: 'Error de Conexión',
      color: 'orange'
    },
    SERVER: {
      icon: '⚙️',
      title: 'Error del Servidor',
      color: 'red'
    },
    VALIDATION: {
      icon: '📝',
      title: 'Error de Validación',
      color: 'yellow'
    },
    PERMISSION: {
      icon: '🚫',
      title: 'Error de Permisos',
      color: 'red'
    },
    RATE_LIMIT: {
      icon: '⏰',
      title: 'Límite de Solicitudes',
      color: 'orange'
    }
  };
  
  // Determinar categoría basada en el error
  let category = 'SERVER';
  let suggestions = [];
  
  if (status === 401) {
    category = 'AUTHENTICATION';
    suggestions = [
      'Verifica que el usuario y contraseña sean correctos',
      'Asegúrate de que tu cuenta esté activa',
      'Intenta recuperar tu contraseña si la has olvidado'
    ];
  } else if (status === 403) {
    category = 'PERMISSION';
    suggestions = [
      'Contacta al administrador del sistema',
      'Verifica que tu cuenta tenga los permisos necesarios',
      'Espera a que se active tu cuenta si es nueva'
    ];
  } else if (status === 400 || status === 422) {
    category = 'VALIDATION';
    suggestions = [
      'Verifica que todos los campos estén completos',
      'Asegúrate de que el formato de los datos sea correcto',
      'Intenta con diferentes credenciales'
    ];
  } else if (status === 429) {
    category = 'RATE_LIMIT';
    suggestions = [
      'Espera unos minutos antes de intentar nuevamente',
      'No hagas demasiadas solicitudes seguidas',
      'Contacta al soporte si necesitas acceso urgente'
    ];
  } else if (code === 'ECONNREFUSED' || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    category = 'NETWORK';
    suggestions = [
      'Verifica tu conexión a internet',
      'Comprueba que el servidor esté disponible',
      'Intenta nuevamente en unos minutos',
      'Contacta al soporte técnico si persiste'
    ];
  } else if (status >= 500) {
    category = 'SERVER';
    suggestions = [
      'El problema es temporal, intenta más tarde',
      'Nuestro equipo técnico ha sido notificado',
      'Contacta al soporte si es urgente'
    ];
  }
  
  return {
    category: errorCategories[category],
    suggestions
  };
};

export const authService = {
  /**
   * Iniciar sesión con username/email y contraseña
   * Usa el cliente oficial del Business Management API
   */
  login: async (credentials) => {
    try {
      const { username, password } = credentials;
      
      // Usar el método login del cliente oficial
      const response = await apiClient.login(username, password);
      
      // Extraer token y role_id de la respuesta
      const { token, role_id } = response;
      
      if (!token) {
        throw new Error('Token no recibido del servidor');
      }
      
      // Crear objeto de usuario basado en la respuesta
      const user = {
        id: role_id || 1,
        username,
        email: username, // Guardar el valor ingresado como email también
        role: role_id || 'user',
        role_id,
        name: username || 'Usuario',
        company: 'ERP Systems Inc.',
        lastLogin: new Date().toISOString(),
      };
      
      return {
        user,
        token,
        role_id,
        message: 'Login exitoso'
      };
      
    } catch (error) {
      // Manejo de errores de la API con mensajes amigables para el usuario
      console.error('Error en login:', error);
      
      const { category, suggestions } = getErrorDetails(error);
      
      // Si la respuesta del servidor contiene un mensaje específico, usarlo
      const serverMessage = error.response?.data?.message || error.response?.data || error.message;
      
      if (category.title === 'Error de Autenticación') {
        // Usar el mensaje del servidor si está disponible y es específico
        if (typeof serverMessage === 'string' && serverMessage.length > 0) {
          throw new Error(serverMessage);
        }
        throw new Error('Usuario o contraseña incorrectos. Por favor, verifica tus credenciales e intenta nuevamente.');
      } else if (category.title === 'Error de Validación') {
        throw new Error('Los datos ingresados no son válidos. Asegúrate de completar todos los campos correctamente.');
      } else if (category.title === 'Error de Permisos') {
        throw new Error('Tu cuenta ha sido bloqueada o no tienes permisos para acceder. Contacta al administrador del sistema.');
      } else if (category.title === 'Error del Servidor') {
        // Para errores 500+, pero si el servidor responde con un mensaje específico, usarlo
        if (typeof serverMessage === 'string' && serverMessage.length > 0) {
          throw new Error(serverMessage);
        }
        throw new Error('El servicio de autenticación no está disponible. Contacta al soporte técnico.');
      } else if (category.title === 'Límite de Solicitudes') {
        throw new Error('Demasiados intentos de inicio de sesión. Espera unos minutos antes de intentar nuevamente.');
      } else {
        // Mensaje genérico más amigable - priorizar mensaje del servidor
        if (typeof serverMessage === 'string' && serverMessage.length > 0) {
          throw new Error(serverMessage);
        }
        throw new Error(error.message || 'Error inesperado al iniciar sesión. Intenta nuevamente o contacta al soporte técnico.');
      }
    }
  },

  /**
   * Registrar nuevo usuario usando el cliente oficial
   */
  register: async (userData) => {
    try {
      // Usar el método signup del cliente oficial
      const response = await apiClient.signup(userData.email || userData.username, userData.password);
      
      const { token, role_id } = response;
      
      if (!token) {
        throw new Error('Token no recibido del servidor');
      }
      
      const user = {
        id: role_id || 1,
        username: userData.username || userData.email,
        email: userData.email || userData.username,
        name: userData.name,
        role: role_id || 'user',
        role_id,
        company: userData.company || 'Mi Empresa',
        lastLogin: new Date().toISOString(),
      };
      
      return {
        user,
        token,
        role_id,
        message: 'Usuario registrado exitosamente'
      };
      
    } catch (error) {
      console.error('Error en registro:', error);
      
      const { category, suggestions } = getErrorDetails(error);
      
      if (category.title === 'Error de Autenticación') {
        throw new Error('Ya existe una cuenta con este email o nombre de usuario. Intenta con datos diferentes o inicia sesión.');
      } else if (category.title === 'Error de Validación') {
        throw new Error('Los datos proporcionados no son válidos. Verifica que todos los campos estén completos y correctos.');
      } else if (category.title === 'Error de Permisos') {
        throw new Error('No tienes permisos para registrarte en este sistema. Contacta al administrador.');
      } else if (category.title === 'Error del Servidor') {
        throw new Error('Error interno del servidor durante el registro. Intenta más tarde o contacta al soporte técnico.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Error inesperado durante el registro. Intenta nuevamente o contacta al soporte técnico.');
      }
    }
  },

  /**
   * Verificar token y obtener información del usuario
   * Para API real, esto haría una llamada al servidor para validar el token
   */
  verifyToken: async (token) => {
    try {
      if (!token) {
        throw new Error('Token no proporcionado');
      }
      
      // Verificar que el token tenga el formato JWT básico
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Formato de token inválido');
      }
      
      // Intentar hacer una llamada simple para verificar que el token funciona
      try {
        await apiClient.getCategories();
      } catch (apiError) {
        throw new Error('Token inválido o expirado');
      }
      
      // Si llegamos aquí, el token es válido
      const storedUser = JSON.parse(localStorage.getItem('auth-store') || '{}');
      
      if (storedUser.state?.user) {
        return {
          user: storedUser.state.user,
          valid: true
        };
      }
      
      // Si no hay usuario almacenado, crear uno básico
      return {
        user: {
          id: 1,
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          role_id: 1,
          name: 'Usuario',
          company: 'ERP Systems Inc.',
          lastLogin: new Date().toISOString(),
        },
        valid: true
      };
      
    } catch (error) {
      console.error('Error verificando token:', error);
      throw new Error('Token inválido o expirado');
    }
  },

  /**
   * Obtener perfil del usuario actual
   */
  getProfile: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      // Si tu API tiene un endpoint para obtener el perfil, úsalo así:
      // const response = await apiService.get('/profile');
      // return response;
      
      return await authService.verifyToken(token);
      
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  },

  /**
   * Actualizar perfil de usuario
   */
  updateProfile: async (profileData) => {
    try {
      // Por ahora mantenemos funcionalidad básica hasta que haya endpoint específico
      // const response = await apiClient.updateProfile(profileData);
      
      throw new Error('La actualización de perfil no está disponible actualmente');
      
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      const { category, suggestions } = getErrorDetails(error);
      
      if (category.title === 'Error de Autenticación') {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (category.title === 'Error de Permisos') {
        throw new Error('No tienes permisos para actualizar este perfil.');
      } else if (category.title === 'Error de Validación') {
        throw new Error('Los datos proporcionados no son válidos. Verifica que todos los campos estén correctos.');
      } else if (category.title === 'Error del Servidor') {
        throw new Error('Error interno del servidor. No se pudo actualizar tu perfil. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error inesperado al actualizar el perfil. Intenta nuevamente.');
      }
    }
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (passwordData) => {
    try {
      // Por ahora mantenemos funcionalidad básica hasta que haya endpoint específico  
      // await apiClient.changePassword(passwordData);
      
      throw new Error('El cambio de contraseña no está disponible actualmente');
      
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      
      const { category, suggestions } = getErrorDetails(error);
      
      if (category.title === 'Error de Autenticación') {
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (category.title === 'Error de Permisos') {
        throw new Error('La contraseña actual es incorrecta. Verifica e intenta nuevamente.');
      } else if (category.title === 'Error de Validación') {
        throw new Error('Los datos proporcionados no son válidos. Asegúrate de completar todos los campos.');
      } else if (category.title === 'Error del Servidor') {
        throw new Error('Error interno del servidor. No se pudo cambiar tu contraseña. Intenta más tarde.');
      } else {
        throw new Error(error.message || 'Error inesperado al cambiar la contraseña. Intenta nuevamente.');
      }
    }
  },

  /**
   * Recuperar contraseña
   */
  forgotPassword: async (emailOrUsername) => {
    try {
      // Por ahora mantenemos funcionalidad básica hasta que haya endpoint específico
      // await apiClient.forgotPassword(emailOrUsername);
      
      throw new Error('La recuperación de contraseña no está disponible actualmente');
      
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      
      const { category, suggestions } = getErrorDetails(error);
      
      if (category.title === 'Error de Autenticación') {
        throw new Error('No se encontró una cuenta con ese email o nombre de usuario. Verifica los datos ingresados.');
      } else if (category.title === 'Error de Validación') {
        throw new Error('Los datos proporcionados no son válidos. Asegúrate de ingresar un email o usuario válido.');
      } else if (category.title === 'Límite de Solicitudes') {
        throw new Error('Has solicitado demasiadas recuperaciones de contraseña. Espera unos minutos antes de intentar nuevamente.');
      } else if (category.title === 'Error del Servidor') {
        throw new Error('Error interno del servidor. No se pudo enviar el email de recuperación. Intenta más tarde.');
      } else if (category.title === 'Error de Conexión') {
        throw new Error('No se puede conectar al servidor. Verifica tu conexión a internet o contacta al soporte técnico.');
      } else {
        throw new Error(error.message || 'Error inesperado al enviar el email de recuperación. Intenta nuevamente.');
      }
    }
  },

  /**
   * Cerrar sesión usando el cliente oficial
   */
  logout: async () => {
    try {
      // Usar el método logout del cliente oficial
      apiClient.logout();
      
      return {
        message: 'Sesión cerrada exitosamente'
      };
      
    } catch (error) {
      console.error('Error en logout:', error);
      // No lanzar error en logout para permitir cerrar sesión localmente
      return {
        message: 'Sesión cerrada'
      };
    }
  }
};

export default authService;
