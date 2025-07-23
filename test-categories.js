/**
 * Test para verificar la funcionalidad de obtener categorías
 * Ejecutar con: node test-categories.js
 */

import { productService } from './src/services/productService.js';

const testCategories = async () => {
  console.log('🧪 Testing Categories API...');
  
  try {
    console.log('📞 Llamando a productService.getCategories()...');
    const categories = await productService.getCategories();
    
    console.log('✅ Respuesta recibida:');
    console.log(JSON.stringify(categories, null, 2));
    
    if (Array.isArray(categories)) {
      console.log(`📊 Total de categorías: ${categories.length}`);
      
      categories.forEach(category => {
        console.log(`- ID: ${category.id}, Nombre: ${category.name}`);
        if (category.description) {
          console.log(`  Descripción: ${category.description}`);
        }
      });
    } else {
      console.log('⚠️ La respuesta no es un array');
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error.message);
    console.log('🔧 Esto puede ser normal si el servidor no está corriendo');
  }
};

testCategories();
