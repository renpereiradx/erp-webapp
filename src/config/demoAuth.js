/**
 * Demo authentication configuration
 * Provides mock authentication for development and testing without API
 */

// Demo users with different roles
export const DEMO_USERS = {
  admin: {
    id: 1,
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin Demo',
    role: 'admin',
    role_id: 1,
    permissions: ['read', 'write', 'delete', 'admin']
  },
  manager: {
    id: 2,
    email: 'manager@demo.com',
    password: 'manager123',
    name: 'Manager Demo',
    role: 'manager',
    role_id: 2,
    permissions: ['read', 'write']
  },
  user: {
    id: 3,
    email: 'user@demo.com',
    password: 'user123',
    name: 'User Demo',
    role: 'user',
    role_id: 3,
    permissions: ['read']
  },
  // Credenciales simples para pruebas rápidas
  demo: {
    id: 4,
    email: 'demo',
    password: 'demo',
    name: 'Demo User',
    role: 'admin',
    role_id: 1,
    permissions: ['read', 'write', 'delete', 'admin']
  }
};

// Token demo (JWT simulado)
export const DEMO_TOKEN = 'demo-jwt-token-12345';

// Configuración de demo
export const DEMO_CONFIG = {
  enabled: import.meta.env.DEV, // 🔧 Solo habilitado en desarrollo
  autoLogin: import.meta.env.DEV, // Auto-login solo en desarrollo
  showCredentials: import.meta.env.DEV, // Mostrar credenciales solo en desarrollo
  sessionDuration: 24 * 60 * 60 * 1000, // 24 horas en ms
};

/**
 * Validar credenciales demo
 * @param {string} email - Email o username
 * @param {string} password - Password
 * @returns {Object|null} - Usuario demo o null si no es válido
 */
export const validateDemoCredentials = (email, password) => {
  // Buscar usuario por email exacto
  const userByEmail = Object.values(DEMO_USERS).find(user => user.email === email);
  if (userByEmail && userByEmail.password === password) {
    return userByEmail;
  }
  
  // Buscar por coincidencia parcial (para 'demo' -> 'demo@demo.com')
  const userByPartial = Object.values(DEMO_USERS).find(user => 
    user.email.startsWith(email) && user.password === password
  );
  
  return userByPartial || null;
};

/**
 * Generar respuesta de login demo
 * @param {Object} user - Usuario demo
 * @returns {Object} - Respuesta de login simulada
 */
export const generateDemoLoginResponse = (user) => ({
  success: true,
  token: DEMO_TOKEN,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
    permissions: user.permissions
  },
  message: 'Demo login successful'
});

/**
 * Verificar si las credenciales son demo
 * @param {string} email 
 * @param {string} password 
 * @returns {boolean}
 */
export const isDemoCredentials = (email, password) => {
  return validateDemoCredentials(email, password) !== null;
};

/**
 * Obtener lista de credenciales para mostrar en UI
 * @returns {Array} - Lista de credenciales demo
 */
export const getDemoCredentialsList = () => [
  { label: 'Admin Demo', email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { label: 'Manager Demo', email: 'manager@demo.com', password: 'manager123', role: 'manager' },
  { label: 'User Demo', email: 'user@demo.com', password: 'user123', role: 'user' },
  { label: 'Quick Demo', email: 'demo', password: 'demo', role: 'admin' }
];

/**
 * Verificar si el token es demo
 * @param {string} token 
 * @returns {boolean}
 */
export const isDemoToken = (token) => {
  return token === DEMO_TOKEN;
};

/**
 * Obtener usuario demo por token
 * @param {string} token 
 * @returns {Object|null}
 */
export const getDemoUserByToken = (token) => {
  if (!isDemoToken(token)) return null;
  
  // En un caso real, decodificaríamos el JWT
  // Para demo, retornamos el usuario admin por defecto
  return DEMO_USERS.demo;
};
