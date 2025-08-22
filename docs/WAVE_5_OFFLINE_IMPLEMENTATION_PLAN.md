# Wave 5: Offline Support & Circuit Breaker - Plan de Implementación

## 🎯 Objetivo
Completar la implementación de soporte offline robusto y mejoras del circuit breaker UI para el sistema de reservas, alcanzando nivel "Production Hardened" con experiencia offline completa.

## 📋 Estado Actual vs Objetivo

### ✅ **Ya Implementado** (Infraestructura Base)
- `circuitHelpers` y `offlineHelpers` importados y configurados
- Estado básico offline en store (isOffline, lastOfflineSnapshot, etc.)
- `_persistOfflineSnapshot` helper implementado
- Circuit breaker básico configurado (threshold 4, cooldown 30s)
- Helpers compartidos en `src/store/helpers/`

### 🎯 **Funcionalidades a Implementar/Completar**
- **Banner offline persistente** con UX clara y opción "Reintentar"
- **Hidratación automática** desde storage al volver online
- **Auto-snapshot** de reservas críticas (hoy + próximos 7 días)
- **Circuit breaker UI** con indicador visual y reset manual
- **Detección stale data** con indicadores visuales
- **Auto-refetch** configurable al reconectar
- **Listeners** online/offline del navegador
- **Telemetría offline** completa

## 🏗️ Arquitectura de Implementación

### **Archivos a Modificar/Crear**
```
src/
├── store/
│   └── useReservationStore.js         ✅ EXTENDER - Completar funciones offline
├── components/
│   ├── reservations/
│   │   ├── OfflineBanner.jsx          🆕 NUEVO - Banner persistente offline
│   │   └── CircuitBreakerIndicator.jsx 🆕 NUEVO - Indicador estado circuit
│   └── ui/
│       └── NetworkStatus.jsx          🆕 NUEVO - Status network global
├── hooks/
│   ├── useNetworkStatus.js            🆕 NUEVO - Hook detección online/offline
│   └── useOfflineSync.js              🆕 NUEVO - Hook sincronización offline
├── pages/
│   └── Reservations.jsx               ✅ EXTENDER - Integrar banner + indicadores
└── lib/
    └── i18n.js                        ✅ EXTENDER - Claves offline/circuit
```

### **Nuevas Funcionalidades a Implementar**
```javascript
// Store - Nuevas acciones offline
- setOfflineStatus(isOffline)
- hydrateFromOfflineSnapshot()
- createCriticalReservationsSnapshot()
- forceRevalidateOnReconnect()
- resetCircuitBreaker()
- updateStaleDataWarning()

// Store - Nuevos selectores
- selectOfflineStatus()
- selectCircuitBreakerStatus()
- selectStaleDataIndicators()
- selectOfflineCapableData()
```

## 📈 Plan de Implementación Wave 5

### **Fase 1: Network Detection & Offline Listeners** (0.5 días)
1. **Crear useNetworkStatus hook**
   - Listeners navigator.onLine/offline
   - Detección cambios conectividad
   - Estado persistente en store

2. **Extender store con listeners**
   - Auto-setOfflineStatus en cambios
   - Telemetría `feature.reservations.offline.*`
   - Timestamps lastOfflineAt/lastOnlineAt

### **Fase 2: Offline Banner & UI** (0.5 días)
1. **OfflineBanner component**
   - Banner persistente cuando offline
   - Botón "Reintentar" para forzar revalidación
   - Integración con LiveRegion para a11y

2. **CircuitBreakerIndicator component**
   - Indicador visual estado circuit breaker
   - Botón reset manual con confirmación
   - Panel métricas circuit breaker

### **Fase 3: Auto-Snapshot & Hydration** (0.5 días)
1. **Auto-snapshot de reservas críticas**
   - Crear snapshot automático en loadPage success
   - Filtrar reservas próximas (hoy + 7 días)
   - Persistir en localStorage con timestamp

2. **Hidratación automática**
   - Detectar volver online
   - Merge inteligente snapshot + cache actual
   - Telemetría hydration events

### **Fase 4: Stale Data & Auto-Refetch** (0.5 días)
1. **Detección stale data**
   - Indicadores visuales edad > TTL/2
   - Warnings contextuales en UI
   - Auto-refresh configurable

2. **Auto-refetch al reconectar**
   - Revalidación automática en reconnect
   - Configuración desde panel métricas
   - Queue de revalidación inteligente

## 🎨 UX/UI Components

### **OfflineBanner Component Layout**
```jsx
// OfflineBanner.jsx - Diseño propuesto
<div className="offline-banner" role="alert" aria-live="polite">
  <div className="offline-content">
    <WifiOff className="offline-icon" />
    <div className="offline-message">
      <span className="offline-title">{t('reservations.offline.title')}</span>
      <span className="offline-subtitle">{t('reservations.offline.subtitle')}</span>
    </div>
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRetry}
      disabled={retrying}
    >
      {retrying ? <Loader2 className="spinning" /> : <RefreshCw />}
      {t('reservations.offline.retry')}
    </Button>
  </div>
</div>
```

### **CircuitBreakerIndicator Component**
```jsx
// CircuitBreakerIndicator.jsx - Estado del circuit breaker
<div className="circuit-status" data-state={circuitState}>
  <AlertTriangle className={`circuit-icon ${circuitState}`} />
  <span className="circuit-label">
    {t(`reservations.circuit.${circuitState}`)}
  </span>
  {circuitState === 'open' && (
    <Button size="sm" variant="ghost" onClick={handleReset}>
      {t('reservations.circuit.reset')}
    </Button>
  )}
</div>
```

## 🔧 Technical Implementation

### **New Store Actions**
```javascript
// useReservationStore.js - Nuevas acciones Wave 5
const useReservationStore = create((set, get) => ({
  // ... estado existente

  // === OFFLINE ACTIONS ===
  setOfflineStatus: (isOffline) => {
    const now = Date.now();
    set({ 
      isOffline,
      [isOffline ? 'lastOfflineAt' : 'lastOnlineAt']: now,
      offlineBannerShown: isOffline
    });
    
    telemetry.track(`feature.reservations.offline.${isOffline ? 'detected' : 'restored'}`, {
      timestamp: now,
      wasOfflineMs: isOffline ? 0 : (now - get().lastOfflineAt)
    });

    // Auto-snapshot al ir offline
    if (isOffline && get().reservations.length > 0) {
      get().createCriticalSnapshot();
    }

    // Auto-refetch al volver online
    if (!isOffline) {
      get().hydrateAndRefresh();
    }
  },

  createCriticalSnapshot: () => {
    const state = get();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Filtrar reservas críticas (próximos 7 días)
    const criticalReservations = state.reservations.filter(reservation => {
      const startTime = new Date(reservation.start_time);
      return startTime >= today && startTime <= nextWeek;
    });

    const snapshot = {
      reservations: criticalReservations,
      pagination: state.pagination,
      timestamp: Date.now(),
      searchTerm: state.searchTerm,
      filters: state.filters
    };

    state._persistOfflineSnapshot(snapshot);
    
    telemetry.track('feature.reservations.offline.snapshot.created', {
      reservationsCount: criticalReservations.length,
      timestamp: snapshot.timestamp
    });
  },

  hydrateFromOfflineSnapshot: () => {
    const snapshot = offlineHelpers.getSnapshot();
    if (!snapshot) return false;

    const age = Date.now() - snapshot.timestamp;
    const isStale = age > (24 * 60 * 60 * 1000); // 24h stale

    set({
      reservations: snapshot.reservations || [],
      pagination: snapshot.pagination || { current_page: 1, per_page: 20, total: 0, total_pages: 0 },
      searchTerm: snapshot.searchTerm || '',
      filters: snapshot.filters || {},
      dataState: isStale ? 'stale' : 'success',
      lastOfflineSnapshot: snapshot
    });

    telemetry.track('feature.reservations.offline.snapshot.hydrated', {
      reservationsCount: snapshot.reservations?.length || 0,
      ageMs: age,
      isStale
    });

    return true;
  },

  hydrateAndRefresh: async () => {
    const hydrated = get().hydrateFromOfflineSnapshot();
    
    if (hydrated) {
      // Refrescar datos en background
      setTimeout(() => {
        get().loadPage(1, true); // force refresh
      }, 1000);
    }
  },

  // === CIRCUIT BREAKER ACTIONS ===
  resetCircuitBreaker: () => {
    circuitHelpers.reset();
    set({ 
      circuitOpenCount: get().circuitOpenCount + 1,
      circuitLastOpenedAt: Date.now()
    });
    
    telemetry.track('feature.reservations.circuit.manual_reset', {
      timestamp: Date.now(),
      previousFailures: get().circuit.failures
    });
  },

  // === STALE DATA DETECTION ===
  checkStaleData: () => {
    const state = get();
    const now = Date.now();
    const staleThreshold = RESERVATION_CACHE_TTL_MS / 2; // 50% del TTL
    
    const stalePages = Object.entries(state.pageCache).filter(([key, entry]) => {
      return (now - entry.ts) > staleThreshold;
    });

    if (stalePages.length > 0) {
      set({ hasStaleData: true, staleDataCount: stalePages.length });
      
      telemetry.track('feature.reservations.cache.stale_detected', {
        stalePagesCount: stalePages.length,
        oldestAge: Math.max(...stalePages.map(([_, entry]) => now - entry.ts))
      });
    }

    return stalePages.length > 0;
  }
}));
```

### **New Hooks Implementation**
```javascript
// hooks/useNetworkStatus.js
export const useNetworkStatus = () => {
  const setOfflineStatus = useReservationStore(state => state.setOfflineStatus);
  
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Estado inicial
    setOfflineStatus(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);
  
  return useReservationStore(state => ({
    isOffline: state.isOffline,
    lastOfflineAt: state.lastOfflineAt,
    lastOnlineAt: state.lastOnlineAt
  }));
};

// hooks/useOfflineSync.js
export const useOfflineSync = () => {
  const store = useReservationStore();
  
  const forceSync = useCallback(async () => {
    if (!store.isOffline) {
      await store.hydrateAndRefresh();
    }
  }, [store]);
  
  const hasOfflineData = useMemo(() => {
    return store.lastOfflineSnapshot !== null;
  }, [store.lastOfflineSnapshot]);
  
  return {
    forceSync,
    hasOfflineData,
    lastSnapshot: store.lastOfflineSnapshot,
    isOffline: store.isOffline
  };
};
```

## 📊 Integration Benefits

### **Immediate Benefits**
- ✅ **Offline Resilience**: Sistema funcional sin conexión con datos críticos
- ✅ **UX Transparency**: Usuario informado del estado de conectividad
- ✅ **Auto-Recovery**: Sincronización automática al reconectar
- ✅ **Circuit Breaker UI**: Visibilidad y control del estado de fallas
- ✅ **Stale Data Awareness**: Indicadores cuando datos están desactualizados

### **Long-term Benefits**
- 🚀 **Production Ready**: Sistema robusto para entornos reales
- 🔄 **Data Consistency**: Sincronización inteligente offline→online
- 📈 **Observability**: Métricas completas de estados offline y circuit
- 🛠️ **Maintainability**: Patrones consistentes con Products/Suppliers
- 🎯 **User Trust**: Experiencia predecible en condiciones adversas

## 🎯 Success Metrics

### **Implementation Success**
- [ ] Offline banner aparece inmediatamente al perder conexión
- [ ] Hydratación automática funcional al reconectar
- [ ] Circuit breaker UI con reset manual operativo
- [ ] Auto-snapshot persiste reservas críticas (próximos 7 días)
- [ ] Stale data indicators visibles en UI
- [ ] Telemetría completa offline/circuit events
- [ ] Integración a11y con LiveRegion para offline status

### **UX Success**  
- [ ] Navegación fluida en modo offline con datos snapshot
- [ ] Transición transparente offline→online con sync automático
- [ ] Indicadores claros de estado (offline, circuit open, stale data)
- [ ] Botón "Reintentar" funcional desde banner offline
- [ ] Panel métricas muestra estadísticas offline/circuit
- [ ] Zero data loss en transiciones de conectividad

## 🕐 Timeline

| Fase | Duración | Entregables |
|------|----------|-------------|
| **Fase 1** | 0.5 días | Network detection + store listeners |
| **Fase 2** | 0.5 días | OfflineBanner + CircuitBreakerIndicator |
| **Fase 3** | 0.5 días | Auto-snapshot + hydratation system |
| **Fase 4** | 0.5 días | Stale data detection + auto-refetch |
| **Total** | **2 días** | **Wave 5 offline support completamente implementado** |

## 🔄 Next Steps Post-Wave 5

Después de completar Wave 5, el sistema estará listo para:
- **Wave 6**: Testing comprehensive de scenarios offline/circuit
- **Wave 7**: Métricas avanzadas y observabilidad completa
- **Production**: Deploy con confianza en entornos reales

## 🌟 Technical Highlights

### **Patrones Implementados**
- **Auto-snapshot Strategy**: Persistencia inteligente de datos críticos
- **Graceful Degradation**: Funcionalidad offline con datos esenciales
- **Progressive Enhancement**: Mejora automática al reconectar
- **Circuit Breaker UI**: Visibilidad y control de estados de falla
- **Stale Data Management**: Detección y refrescado inteligente

### **Observability Integration**
- **Offline Telemetry**: `feature.reservations.offline.*` events
- **Circuit Telemetry**: `feature.reservations.circuit.*` events  
- **Hydration Metrics**: Snapshot age, count, success rate
- **Connectivity Metrics**: Time offline, reconnection patterns
- **User Actions**: Manual retry, circuit reset, force refresh

---

**Conclusión**: Wave 5 completará la experiencia offline robusta del sistema de reservas, alcanzando nivel "Production Hardened" con resiliencia completa ante problemas de conectividad y fallas del sistema.

---
**Preparado para implementación**: 2025-08-22
**Estimación total**: 2 días de desarrollo
**Dependencies**: Waves 1-4 completados, helpers offline/circuit disponibles
