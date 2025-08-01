/**
 * Script para probar la API de categorías
 * Ejecutar en la consola del navegador
 */

console.log('=== TEST API CATEGORÍAS ===');

// 1. Verificar token
const token = localStorage.getItem('authToken');
console.log('Token disponible:', !!token);

if (token) {
  // 2. Probar API directa
  fetch('http://localhost:5050/categories', {
    method: 'GET',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.text(); // Primero como texto para ver qué llega
  })
  .then(text => {
    console.log('Respuesta cruda:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Respuesta parseada:', json);
      console.log('Tipo:', typeof json);
      console.log('Es array:', Array.isArray(json));
      if (json && json.data) {
        console.log('Propiedad data:', json.data);
        console.log('data es array:', Array.isArray(json.data));
      }
    } catch (e) {
      console.log('No es JSON válido, respuesta como texto:', text);
    }
  })
  .catch(error => {
    console.error('Error en la petición:', error);
    console.error('Detalles:', {
      message: error.message,
      stack: error.stack
    });
  });
} else {
  console.error('No hay token disponible');
}
