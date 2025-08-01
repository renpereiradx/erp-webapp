/**
 * Script para probar el estado del backend
 * Ejecutar en la consola del navegador
 */

console.log('=== TEST ESTADO DEL BACKEND ===');

const token = localStorage.getItem('authToken');
console.log('Token disponible:', !!token);

if (token) {
  // Pruebas básicas del backend
  const tests = [
    { name: 'Productos (GET)', url: 'http://localhost:5050/products?page=1&limit=5' },
    { name: 'Categorías (GET)', url: 'http://localhost:5050/categories' },
    { name: 'Búsqueda (GET)', url: 'http://localhost:5050/products/search?q=test&limit=5' }
  ];

  tests.forEach(async (test, index) => {
    try {
      console.log(`\n--- Prueba ${index + 1}: ${test.name} ---`);
      
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          console.log('✅ Éxito:', json);
        } catch (e) {
          console.log('✅ Éxito (texto):', text);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Error de red:', error.message);
    }
  });
} else {
  console.error('❌ No hay token disponible. Inicia sesión primero.');
}

// También probar la función de categorías del store directamente
console.log('\n=== TEST STORE CATEGORIES ===');
if (window.location.pathname.includes('products')) {
  // Si estamos en la página de productos, probar el store
  setTimeout(() => {
    try {
      // Intentar acceder al store de Zustand si está disponible
      console.log('Probando fetchCategories del store...');
    } catch (e) {
      console.log('Store no disponible en esta página');
    }
  }, 1000);
}
