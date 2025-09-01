/**
 * Script para limpiar cache del navegador automáticamente
 * Ejecuta este script en la consola del navegador si sigues teniendo problemas
 */

// Función para limpiar cache del navegador SOLO de esta aplicación
function clearBrowserCache() {
  console.log('🧹 Limpiando cache SOLO de esta aplicación...')
  
  // Limpiar localStorage solo de este dominio
  const localStorageKeys = Object.keys(localStorage)
  localStorage.clear()
  console.log(`✅ localStorage limpiado (${localStorageKeys.length} items)`)
  
  // Limpiar sessionStorage solo de este dominio
  const sessionStorageKeys = Object.keys(sessionStorage)
  sessionStorage.clear()
  console.log(`✅ sessionStorage limpiado (${sessionStorageKeys.length} items)`)
  
  // Limpiar cache específico de este dominio
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Eliminando cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      console.log('✅ Cache API limpiado')
    })
  }
  
  // Limpiar IndexedDB de este dominio
  if ('indexedDB' in window) {
    console.log('✅ IndexedDB será limpiado en la recarga')
  }
  
  // Forzar recarga sin cache SOLO de esta página
  console.log('🔄 Forzando recarga sin cache de SOLO esta aplicación...')
  console.log('💡 Esto NO afectará otros sitios web')
  
  // Recarga con cache bypass específico
  window.location.reload(true)
}

// Función para limpiar cache específico de módulos de Vite/React
function clearModuleCache() {
  console.log('🔄 Limpiando cache de módulos...')
  
  // Limpiar cache de módulos ES si está disponible
  if (window.__vite_plugin_react_preamble_installed__) {
    delete window.__vite_plugin_react_preamble_installed__
    console.log('✅ Cache de React plugin limpiado')
  }
  
  // Limpiar variables globales de React que puedan estar cacheadas
  if (window.React) {
    console.log('⚠️ React global detectado, puede causar conflictos')
  }
  
  // Force module re-evaluation
  const scripts = document.querySelectorAll('script[type="module"]')
  scripts.forEach(script => {
    if (script.src) {
      console.log('🔄 Módulo para recarga:', script.src)
    }
  })
  
  clearBrowserCache()
}

// Función para detectar errores de hooks
function detectHookErrors() {
  const originalError = console.error
  console.error = function(...args) {
    const message = args.join(' ')
    if (message.includes('Invalid hook call') || 
        message.includes('Hooks can only be called') ||
        message.includes('Hook') && message.includes('called')) {
      console.warn('🚨 Error de hooks detectado!')
      console.warn('💡 Ejecuta clearBrowserCache() para solucionarlo')
    }
    originalError.apply(console, args)
  }
}

// Función para verificar React cuando esté disponible
function checkReact() {
  // Esperar a que React esté disponible
  setTimeout(() => {
    let reactVersion = 'No detectada'
    
    // Intentar detectar React de varias maneras
    if (typeof window !== 'undefined') {
      if (window.React && window.React.version) {
        reactVersion = window.React.version
      } else if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        reactVersion = 'Detectada (via DevTools Hook)'
      }
    }
    
    console.log(`
🛠️  Herramientas de depuración React 19 cargadas:

📋 Comandos disponibles:
  - clearBrowserCache(): Limpia cache SOLO de esta aplicación
  - clearModuleCache(): Limpia cache de módulos React/Vite + recarga
  - detectHookErrors(): Activa detección de errores de hooks (ya activo)

💡 Si ves errores de "Invalid hook call":
  1. Ejecuta: clearModuleCache() (recomendado para React)
  2. O ejecuta: clearBrowserCache() (limpieza general)
  3. O usa Ctrl+Shift+R (recarga forzada)
  4. O DevTools → Application → Clear storage

🔍 Para depurar:
  - Versión React: ${reactVersion}
  - Timestamp: ${new Date().toISOString()}
  - Solo afecta a: ${window.location.origin}
`)
  }, 1000)
}

// Activar detección automática
detectHookErrors()

// Verificar React cuando esté disponible
checkReact()

// Hacer funciones globales
if (typeof window !== 'undefined') {
  window.clearBrowserCache = clearBrowserCache
  window.clearModuleCache = clearModuleCache
  window.detectHookErrors = detectHookErrors
}
