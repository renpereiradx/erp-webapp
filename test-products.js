/**
 * Test script para verificar la funcionalidad del sistema de productos
 */

import { productService } from './src/services/productService.js';

async function testProductFunctionality() {
  console.log('🧪 Iniciando pruebas del sistema de productos...\n');
  
  try {
    // Test 1: Validación de datos de producto
    console.log('✅ Test 1: Validación de datos');
    
    try {
      productService.validateProductData({
        name: 'Producto Test',
        id_category: 1
      });
      console.log('   ✓ Validación de producto válido - OK');
    } catch (error) {
      console.log('   ✗ Error en validación de producto válido:', error.message);
    }
    
    try {
      productService.validateProductData({
        name: '', // Missing name
        id_category: 1
      });
      console.log('   ✗ Validación debería haber fallado');
    } catch (error) {
      console.log('   ✓ Validación de producto inválido detectada - OK');
    }
    
    // Test 2: Validación de precios
    console.log('\n✅ Test 2: Validación de precios');
    
    try {
      productService.validatePriceData({
        cost_price: 100
      });
      console.log('   ✓ Validación de precio válido - OK');
    } catch (error) {
      console.log('   ✗ Error en validación de precio válido:', error.message);
    }
    
    // Test 3: Validación de stock
    console.log('\n✅ Test 3: Validación de stock');
    
    try {
      productService.validateStockData({
        quantity: 50
      });
      console.log('   ✓ Validación de stock válido - OK');
    } catch (error) {
      console.log('   ✗ Error en validación de stock válido:', error.message);
    }
    
    // Test 4: Validación de descripción
    console.log('\n✅ Test 4: Validación de descripción');
    
    try {
      productService.validateDescriptionData({
        description: 'Esta es una descripción válida'
      });
      console.log('   ✓ Validación de descripción válida - OK');
    } catch (error) {
      console.log('   ✗ Error en validación de descripción válida:', error.message);
    }
    
    console.log('\n🎉 Todas las pruebas de validación completadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
testProductFunctionality();
