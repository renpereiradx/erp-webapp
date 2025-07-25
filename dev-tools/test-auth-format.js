/**
 * Test rápido para verificar el formato del token de autorización
 */
console.log('🧪 Testing Auth Header Format...');

// Simular token
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
localStorage.setItem('authToken', mockToken);

// Simular la función getAuthHeaders
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const headers = getAuthHeaders();
console.log('📋 Headers generados:', headers);

if (headers.Authorization && headers.Authorization.startsWith('Bearer ')) {
  console.log('✅ Formato correcto: Bearer token incluido');
} else {
  console.log('❌ Formato incorrecto: Bearer token faltante');
}

// Limpiar
localStorage.removeItem('authToken');
console.log('🧹 Token de prueba eliminado');
