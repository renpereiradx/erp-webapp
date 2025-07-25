/**
 * Script de prueba para auto-login
 * Ejecutar en la consola del navegador para probar el auto-login
 */

console.log('🔧 Test de Auto-Login iniciado...');

// Limpiar localStorage
localStorage.removeItem('authToken');
localStorage.removeItem('userData');
console.log('🧹 localStorage limpiado');

// Importar API client
import { apiClient } from '/src/services/api.js';

// Probar auto-login
async function testAutoLogin() {
  try {
    console.log('🔐 Iniciando test de auto-login...');
    const result = await apiClient.ensureAuthentication();
    console.log('✅ Auto-login result:', result);
    
    const token = localStorage.getItem('authToken');
    console.log('🎫 Token en localStorage:', token ? 'Present' : 'Missing');
    
    // Probar una request que requiera autenticación
    try {
      const productDetails = await apiClient.getProductWithDetails('test-id');
      console.log('✅ Test de autenticación exitoso:', productDetails);
    } catch (error) {
      console.log('⚠️ Test de autenticación falló (esperado):', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en test de auto-login:', error);
  }
}

// Ejecutar test
testAutoLogin();
