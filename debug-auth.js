/**
 * Debug específico para el problema de categorías vs productos
 * Ejecutar este código en la consola del navegador para debug
 */

const debugAuthTokens = () => {
  console.log('🔍 DEBUG AUTH TOKENS - Productos vs Categorías:');
  console.log('');
  
  // Verificar token actual
  const token = localStorage.getItem('authToken');
  console.log('� Token actual:');
  console.log('  exists:', !!token);
  console.log('  length:', token ? token.length : 0);
  console.log('  preview:', token ? `${token.substring(0, 30)}...` : 'N/A');
  console.log('');
  
  // Simular headers para productos vs categorías
  const headers = token ? { 'Authorization': token } : {};
  console.log('📋 Headers que se enviarían:');
  console.log('  Authorization:', headers.Authorization || 'NO TOKEN');
  console.log('');
  
  // URLs que se están llamando
  console.log('🚀 APIs que deberían funcionar:');
  console.log('  Productos: /products/products/1/10');
  console.log('  Categorías: /categories');
  console.log('');
  
  // Verificar si hay inconsistencias
  if (token) {
    console.log('✅ Token disponible - ambas APIs deberían funcionar');
    console.log('🔧 Si categorías falla pero productos funciona:');
    console.log('   - Revisar timing de llamadas');
    console.log('   - Verificar que el token no expire entre llamadas');
    console.log('   - Comprobar que ambas usen el mismo formato de header');
  } else {
    console.log('❌ Token no disponible - ambas APIs fallarían');
    console.log('🔧 Solución: Iniciar sesión primero');
  }
  
  return { hasToken: !!token, headers };
};

// Auto ejecutar
const result = debugAuthTokens();

// Exportar para uso manual
window.debugAuthTokens = debugAuthTokens;
window.authResult = result;

console.log('🔧 Debug auth tokens cargado. Resultado:', result);
