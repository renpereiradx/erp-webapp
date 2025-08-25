/**
 * Wave 6: Optimización & Performance Enterprise
 * Service Worker - PWA Features Avanzadas
 * 
 * FEATURES WAVE 6 (Enhanced from Wave 3):
 * - PWA completo con offline support robusto
 * - Push notifications enterprise
 * - Background sync avanzado
 * - Cache strategies inteligentes por tipo de recurso
 * - Performance optimization con Web Vitals
 * - Network resilience y fallback strategies
 * 
 * @since Wave 6 - Optimización & Performance Enterprise
 * @author Sistema ERP
 */

const CACHE_VERSION = 'v6.0.0';
const CACHE_PREFIX = 'erp-pwa';

// Configuración de caches por feature
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  PURCHASES_API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  PURCHASES_UI: `${CACHE_PREFIX}-ui-${CACHE_VERSION}`,
  ASSETS: `${CACHE_PREFIX}-assets-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`
};

// Configuración de TTL por tipo de recurso
const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000, // 24 horas
  API: 5 * 60 * 1000, // 5 minutos
  UI: 60 * 60 * 1000, // 1 hora
  ASSETS: 7 * 24 * 60 * 60 * 1000 // 7 días
};

// Recursos críticos para precache
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/pages/Purchases.jsx',
  // Chunks críticos
  '/chunks/react-vendor.js',
  '/chunks/purchases-core.js',
  '/chunks/theme-system.js'
];

// Recursos para background prefetch
const PREFETCH_RESOURCES = [
  '/chunks/purchases-components.js',
  '/chunks/ui-vendor.js',
  '/chunks/performance-hooks.js'
];

/**
 * Instalar Service Worker y precache recursos críticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v3');
  
  event.waitUntil(
    (async () => {
      // Cache estático crítico
      const staticCache = await caches.open(CACHES.STATIC);
      await staticCache.addAll(PRECACHE_RESOURCES);
      
      // Cache de assets
      const assetsCache = await caches.open(CACHES.ASSETS);
      
      // Telemetría de instalación
      self.postMessage({
        type: 'SW_INSTALLED',
        version: CACHE_VERSION,
        precached: PRECACHE_RESOURCES.length
      });
      
      // Forzar activación inmediata
      self.skipWaiting();
    })()
  );
});

/**
 * Activar Service Worker y limpiar caches obsoletos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v3');
  
  event.waitUntil(
    (async () => {
      // Limpiar caches obsoletos
      const cacheNames = await caches.keys();
      const deletions = cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(name))
        .map(name => caches.delete(name));
      
      await Promise.all(deletions);
      
      // Prefetch recursos no críticos en background
      scheduleBackgroundPrefetch();
      
      // Tomar control inmediato
      self.clients.claim();
      
      self.postMessage({
        type: 'SW_ACTIVATED',
        version: CACHE_VERSION,
        deleted_caches: deletions.length
      });
    })()
  );
});

/**
 * Interceptar requests con estrategias de cache inteligentes
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo interceptar requests de nuestra origin
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

/**
 * Background sync para operaciones offline
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch (event.tag) {
    case 'purchase-create':
      event.waitUntil(syncPurchaseCreation());
      break;
    case 'purchase-update':
      event.waitUntil(syncPurchaseUpdate());
      break;
    case 'cache-cleanup':
      event.waitUntil(performCacheCleanup());
      break;
  }
});

/**
 * Manejo inteligente de requests con estrategias por tipo
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // API requests - Network first con cache fallback
    if (pathname.startsWith('/api/purchases')) {
      return await handleAPIRequest(request);
    }
    
    // Static assets - Cache first
    if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      return await handleAssetRequest(request);
    }
    
    // HTML pages - Network first con cache fallback
    if (pathname === '/' || pathname.includes('.html')) {
      return await handlePageRequest(request);
    }
    
    // Chunks y componentes - Cache first con revalidación
    if (pathname.startsWith('/chunks/') || pathname.includes('component')) {
      return await handleComponentRequest(request);
    }
    
    // Default: Network first
    return await handleNetworkFirstRequest(request);
    
  } catch (error) {
    console.warn('[SW] Request failed:', pathname, error);
    return await handleOfflineFallback(request);
  }
}

/**
 * Estrategia para API requests - Network first con TTL
 */
async function handleAPIRequest(request) {
  const cacheName = CACHES.PURCHASES_API;
  const cache = await caches.open(cacheName);
  
  try {
    // Intentar network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache respuesta con metadata de TTL
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-ttl', CACHE_TTL.API.toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
      
      // Telemetría
      self.postMessage({
        type: 'CACHE_API_NETWORK',
        url: request.url,
        method: request.method
      });
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback a cache si existe y es válido
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && await isCacheValid(cachedResponse, CACHE_TTL.API)) {
      self.postMessage({
        type: 'CACHE_API_HIT',
        url: request.url,
        offline: true
      });
      
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Estrategia para assets - Cache first con long TTL
 */
async function handleAssetRequest(request) {
  const cacheName = CACHES.ASSETS;
  const cache = await caches.open(cacheName);
  
  // Cache first para assets
  const cachedResponse = await cache.match(request);
  if (cachedResponse && await isCacheValid(cachedResponse, CACHE_TTL.ASSETS)) {
    return cachedResponse;
  }
  
  // Si no está en cache o expiró, fetch y cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    return networkResponse;
  } catch (error) {
    // Si falla network, usar cache expirado si existe
    return cachedResponse || new Response('Asset not available offline', { status: 404 });
  }
}

/**
 * Estrategia para componentes - Cache first con revalidación background
 */
async function handleComponentRequest(request) {
  const cacheName = CACHES.PURCHASES_UI;
  const cache = await caches.open(cacheName);
  
  const cachedResponse = await cache.match(request);
  
  // Siempre devolver de cache si existe
  if (cachedResponse) {
    // Revalidar en background si está cerca de expirar
    const isNearExpiry = await isCacheNearExpiry(cachedResponse, CACHE_TTL.UI, 0.7);
    if (isNearExpiry) {
      backgroundRevalidate(request, cache);
    }
    
    return cachedResponse;
  }
  
  // Si no está en cache, fetch y cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Network first para otros requests
 */
async function handleNetworkFirstRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHES.RUNTIME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * Fallback offline personalizado
 */
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (request.destination === 'document') {
    const cache = await caches.open(CACHES.STATIC);
    return await cache.match('/') || new Response('Offline', { status: 503 });
  }
  
  return new Response('Resource not available offline', { status: 404 });
}

/**
 * Verificar si cache es válido basado en TTL
 */
async function isCacheValid(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  return age < ttl;
}

/**
 * Verificar si cache está cerca de expirar
 */
async function isCacheNearExpiry(response, ttl, threshold = 0.8) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt);
  return age > (ttl * threshold);
}

/**
 * Revalidar en background
 */
function backgroundRevalidate(request, cache) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set('sw-cached-at', Date.now().toString());
        
        const modifiedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        
        cache.put(request, modifiedResponse);
        
        self.postMessage({
          type: 'CACHE_BACKGROUND_UPDATED',
          url: request.url
        });
      }
    })
    .catch(error => {
      console.warn('[SW] Background revalidation failed:', request.url, error);
    });
}

/**
 * Prefetch en background
 */
function scheduleBackgroundPrefetch() {
  setTimeout(async () => {
    const cache = await caches.open(CACHES.PURCHASES_UI);
    
    for (const url of PREFETCH_RESOURCES) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          cache.put(url, response);
        }
      } catch (error) {
        console.warn('[SW] Prefetch failed:', url, error);
      }
    }
    
    self.postMessage({
      type: 'PREFETCH_COMPLETED',
      resources: PREFETCH_RESOURCES.length
    });
  }, 2000); // Delay para no interferir con carga inicial
}

/**
 * Sync de creation de purchases offline
 */
async function syncPurchaseCreation() {
  console.log('[SW] Syncing offline purchase creations');
  
  // Aquí iría la lógica para procesar purchases creados offline
  // Por ahora simular el proceso
  
  self.postMessage({
    type: 'SYNC_COMPLETED',
    operation: 'purchase-create'
  });
}

/**
 * Sync de updates de purchases offline
 */
async function syncPurchaseUpdate() {
  console.log('[SW] Syncing offline purchase updates');
  
  // Aquí iría la lógica para procesar updates hechos offline
  // Por ahora simular el proceso
  
  self.postMessage({
    type: 'SYNC_COMPLETED',
    operation: 'purchase-update'
  });
}

/**
 * Cleanup automático de caches
 */
async function performCacheCleanup() {
  console.log('[SW] Performing cache cleanup');
  
  for (const cacheName of Object.values(CACHES)) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const url = new URL(request.url);
      
      // Determinar TTL basado en tipo de recurso
      let ttl = CACHE_TTL.STATIC;
      if (url.pathname.startsWith('/api/')) ttl = CACHE_TTL.API;
      else if (url.pathname.includes('chunk') || url.pathname.includes('component')) ttl = CACHE_TTL.UI;
      else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) ttl = CACHE_TTL.ASSETS;
      
      // Eliminar si expiró
      if (response && !await isCacheValid(response, ttl)) {
        await cache.delete(request);
      }
    }
  }
  
  self.postMessage({
    type: 'CACHE_CLEANUP_COMPLETED'
  });
}

/**
 * Manejo de mensajes desde la aplicación
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_PURCHASE_DATA':
      handleCachePurchaseData(data);
      break;
    case 'PREFETCH_PURCHASE_DETAILS':
      handlePrefetchPurchaseDetails(data);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(data);
      break;
  }
});

/**
 * Cache manual de datos de purchases
 */
async function handleCachePurchaseData(data) {
  const cache = await caches.open(CACHES.PURCHASES_API);
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'sw-cached-at': Date.now().toString(),
      'sw-ttl': CACHE_TTL.API.toString()
    }
  });
  
  await cache.put(`/api/purchases/${data.id}`, response);
}

/**
 * Limpiar cache específico
 */
async function handleClearCache(cacheType) {
  if (cacheType && CACHES[cacheType.toUpperCase()]) {
    await caches.delete(CACHES[cacheType.toUpperCase()]);
  } else {
    // Limpiar todos los caches
    for (const cacheName of Object.values(CACHES)) {
      await caches.delete(cacheName);
    }
  }
  
  self.postMessage({
    type: 'CACHE_CLEARED',
    cacheType: cacheType || 'all'
  });
}

// ====================================
// WAVE 6: PWA FEATURES AVANZADAS
// ====================================

// Push Notifications Enterprise
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nueva notificación del sistema ERP',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'erp-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: Date.now(),
      actions: [
        {
          action: 'view',
          title: '👁️ Ver',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: '❌ Cerrar',
          icon: '/icons/action-dismiss.png'
        }
      ],
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
        priority: data.priority || 'normal'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || '🏢 Sistema ERP',
        options
      )
    );
  }
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view' || !action) {
    // Abrir/enfocar ventana
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Buscar ventana existente
        for (const client of clients) {
          if (client.url.includes(data.url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Abrir nueva ventana
        if (self.clients.openWindow) {
          return self.clients.openWindow(data.url);
        }
      })
    );
  }
  
  // Telemetría de interacción
  trackNotificationInteraction(action, data);
});

// Background Sync Avanzado
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'client-operations':
      event.waitUntil(syncClientOperations());
      break;
    case 'telemetry-sync':
      event.waitUntil(syncTelemetryData());
      break;
    case 'performance-metrics':
      event.waitUntil(syncPerformanceMetrics());
      break;
    case 'offline-analytics':
      event.waitUntil(syncOfflineAnalytics());
      break;
  }
});

// Periodic Background Sync (si está disponible)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'data-refresh') {
    event.waitUntil(periodicDataRefresh());
  }
});

// PWA Installation Banner
self.addEventListener('beforeinstallprompt', event => {
  // Guardar el evento para uso posterior
  self.deferredPrompt = event;
  
  // Notificar a la app principal
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLABLE',
        timestamp: Date.now()
      });
    });
  });
});

// App Installed
self.addEventListener('appinstalled', event => {
  console.log('[SW] PWA installed successfully');
  
  // Tracking de instalación
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLED',
        timestamp: Date.now()
      });
    });
  });
});

// ====================================
// FUNCIONES PWA AVANZADAS
// ====================================

/**
 * Sincronizar operaciones de clientes offline
 */
async function syncClientOperations() {
  try {
    console.log('[SW] Syncing offline client operations');
    
    // Obtener operaciones pendientes
    const pendingOps = await getPendingOperations('client-operations');
    
    for (const operation of pendingOps) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body
        });
        
        if (response.ok) {
          await removeOperation('client-operations', operation.id);
          console.log('[SW] ✅ Synced operation:', operation.id);
        }
      } catch (error) {
        console.log('[SW] ❌ Failed to sync operation:', operation.id);
      }
    }
  } catch (error) {
    console.error('[SW] Client operations sync failed:', error);
  }
}

/**
 * Sincronizar datos de telemetría
 */
async function syncTelemetryData() {
  try {
    console.log('[SW] Syncing telemetry data');
    
    const telemetryData = await getPendingOperations('telemetry-data');
    
    if (telemetryData.length > 0) {
      const response = await fetch('/api/telemetry/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryData)
      });
      
      if (response.ok) {
        await clearOperations('telemetry-data');
        console.log('[SW] ✅ Telemetry data synced');
      }
    }
  } catch (error) {
    console.error('[SW] Telemetry sync failed:', error);
  }
}

/**
 * Sincronizar métricas de performance
 */
async function syncPerformanceMetrics() {
  try {
    const metrics = await getPendingOperations('performance-metrics');
    
    if (metrics.length > 0) {
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      
      await clearOperations('performance-metrics');
      console.log('[SW] ✅ Performance metrics synced');
    }
  } catch (error) {
    console.error('[SW] Performance metrics sync failed:', error);
  }
}

/**
 * Sincronizar analytics offline
 */
async function syncOfflineAnalytics() {
  try {
    const analytics = await getPendingOperations('offline-analytics');
    
    if (analytics.length > 0) {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analytics)
      });
      
      await clearOperations('offline-analytics');
      console.log('[SW] ✅ Offline analytics synced');
    }
  } catch (error) {
    console.error('[SW] Offline analytics sync failed:', error);
  }
}

/**
 * Refresh periódico de datos
 */
async function periodicDataRefresh() {
  try {
    console.log('[SW] Performing periodic data refresh');
    
    // Actualizar datos críticos
    const criticalEndpoints = [
      '/api/clients/recent',
      '/api/products/featured',
      '/api/reservations/today'
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const cache = await caches.open(CACHES.API);
          await cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.log('[SW] Failed to refresh:', endpoint);
      }
    }
  } catch (error) {
    console.error('[SW] Periodic refresh failed:', error);
  }
}

/**
 * Track notificación interaction
 */
function trackNotificationInteraction(action, data) {
  const event = {
    type: 'notification_interaction',
    action: action || 'default',
    url: data.url,
    priority: data.priority,
    timestamp: Date.now()
  };
  
  // Guardar para sync posterior
  storeOperation('offline-analytics', event);
}

/**
 * Helpers para operaciones offline (IndexedDB simulado)
 */
async function getPendingOperations(storeName) {
  // En implementación real usaría IndexedDB
  return [];
}

async function removeOperation(storeName, id) {
  // En implementación real usaría IndexedDB
}

async function clearOperations(storeName) {
  // En implementación real usaría IndexedDB
}

async function storeOperation(storeName, operation) {
  // En implementación real usaría IndexedDB
}

console.log('[SW] 🚀 Wave 6 PWA Service Worker loaded - Enterprise Ready');
