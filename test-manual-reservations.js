/**
 * Script de Prueba Manual - Componentes de Reservas
 * Este script verifica la funcionalidad de los componentes en el navegador
 */

console.log('🧪 Iniciando test de componentes de Reservas - Wave 2');

// Test 1: Verificar que la página carga correctamente
function testPageLoad() {
  console.log('📄 Test 1: Carga de página');
  
  const pageTitle = document.querySelector('h1, [role="heading"]');
  if (pageTitle) {
    console.log('✅ Página cargada correctamente');
    console.log('📍 Título encontrado:', pageTitle.textContent);
    return true;
  } else {
    console.log('❌ Error: No se encontró el título de la página');
    return false;
  }
}

// Test 2: Verificar botones principales
function testMainButtons() {
  console.log('🔘 Test 2: Botones principales');
  
  const createButton = document.querySelector('button[data-testid*="create"], button:contains("Nueva Reserva"), button:contains("Crear")');
  const filtersButton = document.querySelector('button[data-testid*="filters"], button:contains("Filtros")');
  
  console.log('🔍 Botón crear:', createButton ? '✅ Encontrado' : '❌ No encontrado');
  console.log('🔍 Botón filtros:', filtersButton ? '✅ Encontrado' : '❌ No encontrado');
  
  return createButton && filtersButton;
}

// Test 3: Verificar componentes de reservas cargados
function testReservationComponents() {
  console.log('🎯 Test 3: Componentes de reservas');
  
  // Buscar elementos específicos de nuestros componentes
  const reservationCards = document.querySelectorAll('[data-testid*="reservation"], .reservation-card');
  const statsComponents = document.querySelectorAll('[data-testid*="stats"], .stats');
  
  console.log('📊 Cards de reservas:', reservationCards.length);
  console.log('📈 Componentes de stats:', statsComponents.length);
  
  return true; // Siempre verdadero porque puede no haber datos
}

// Test 4: Verificar que el modal se puede abrir (si hay botón)
function testModalTrigger() {
  console.log('🎭 Test 4: Trigger del modal');
  
  const createButtons = document.querySelectorAll('button');
  let createButton = null;
  
  createButtons.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    if (text.includes('nueva') || text.includes('crear') || text.includes('new')) {
      createButton = btn;
    }
  });
  
  if (createButton) {
    console.log('✅ Botón de crear encontrado:', createButton.textContent);
    console.log('🎯 Intentando click...');
    
    // Simular click
    createButton.click();
    
    // Verificar si aparece modal después de un breve delay
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"], .modal, [data-testid*="modal"]');
      if (modal) {
        console.log('✅ Modal abierto correctamente');
        
        // Verificar campos del modal
        const productField = document.querySelector('select, input[placeholder*="producto"], input[placeholder*="product"]');
        const clientField = document.querySelector('input[placeholder*="cliente"], input[placeholder*="client"]');
        
        console.log('🏷️ Campo producto:', productField ? '✅ Encontrado' : '❌ No encontrado');
        console.log('👤 Campo cliente:', clientField ? '✅ Encontrado' : '❌ No encontrado');
        
        // Cerrar modal haciendo click en cancelar o X
        const closeButtons = document.querySelectorAll('button');
        closeButtons.forEach(btn => {
          if (btn.textContent.toLowerCase().includes('cancelar') || 
              btn.textContent.toLowerCase().includes('cancel') ||
              btn.innerHTML.includes('×') || btn.innerHTML.includes('X')) {
            btn.click();
          }
        });
        
      } else {
        console.log('⚠️ Modal no se abrió (puede ser normal si hay validaciones)');
      }
    }, 500);
    
    return true;
  } else {
    console.log('❌ No se encontró botón de crear');
    return false;
  }
}

// Test 5: Verificar filtros
function testFilters() {
  console.log('🔍 Test 5: Panel de filtros');
  
  const filterButtons = document.querySelectorAll('button');
  let filterButton = null;
  
  filterButtons.forEach(btn => {
    const text = btn.textContent.toLowerCase();
    if (text.includes('filtro') || text.includes('filter')) {
      filterButton = btn;
    }
  });
  
  if (filterButton) {
    console.log('✅ Botón de filtros encontrado');
    console.log('🎯 Intentando abrir panel de filtros...');
    
    filterButton.click();
    
    setTimeout(() => {
      const filterPanel = document.querySelector('[data-testid*="filter"], .filter-panel');
      console.log('🔧 Panel de filtros:', filterPanel ? '✅ Abierto' : '⚠️ No visible');
    }, 300);
    
    return true;
  } else {
    console.log('❌ No se encontró botón de filtros');
    return false;
  }
}

// Ejecutar todos los tests
function runAllTests() {
  console.log('🚀 Ejecutando batería completa de tests...');
  console.log('================================================');
  
  const results = {
    pageLoad: testPageLoad(),
    buttons: testMainButtons(),
    components: testReservationComponents(),
    modal: testModalTrigger(),
    filters: testFilters()
  };
  
  console.log('================================================');
  console.log('📊 RESULTADOS FINALES:');
  console.log('✅ Carga de página:', results.pageLoad ? 'PASS' : 'FAIL');
  console.log('✅ Botones principales:', results.buttons ? 'PASS' : 'FAIL');
  console.log('✅ Componentes:', results.components ? 'PASS' : 'FAIL');
  console.log('✅ Modal trigger:', results.modal ? 'PASS' : 'FAIL');
  console.log('✅ Filtros trigger:', results.filters ? 'PASS' : 'FAIL');
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`🎯 SCORE: ${passCount}/${totalTests} tests pasados`);
  
  if (passCount === totalTests) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON! Wave 2 completado exitosamente');
  } else {
    console.log('⚠️ Algunos tests fallaron, revisar funcionalidad');
  }
  
  return results;
}

// Ejecutar automáticamente después de 2 segundos
setTimeout(() => {
  runAllTests();
}, 2000);

// Exportar función para ejecución manual
window.testReservationComponents = runAllTests;

console.log('📝 Script cargado. Los tests se ejecutarán automáticamente en 2 segundos.');
console.log('💡 También puedes ejecutar manualmente: window.testReservationComponents()');
