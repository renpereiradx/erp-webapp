# Suppliers – Backlog Próximo (Post Wave 5)

Fecha: 2025-08-21
Contexto: Waves 1–5 completadas (resiliencia básica + a11y + error hints + cache/prefetch + circuit breaker + offline snapshot). Este backlog lista tareas de valor incremental pendientes antes de considerar la feature "Production Hardened" completa.

## 1. Telemetría & Observabilidad
- [x] Eliminar eventos legacy `suppliers.*` restantes cuando tableros confirmen adopción de `feature.suppliers.*` (migrado a namespace `feature.suppliers.*`).
- [x] Añadir ratio de cache (hits/misses) expuesto via selector + panel métricas (`selectors.selectCacheStats`).
- [x] Contador aperturas de circuito y duración promedio abierta (circuitOpenCount + avgOpenDurationMs selector).
- [x] Evento `feature.suppliers.retry` por intento (implementado en `withRetry`).
- [x] Dashboard mini (React) reutilizando patrón MetricsPanel de Products (component `SuppliersMetricsPanel`).
- [x] LRU trim para `pageCache` + telemetría `feature.suppliers.cache.trim` (`_trimPageCache`).
- [x] Evento `feature.suppliers.cache.invalidate` al invalidar páginas tras mutaciones (create/delete) con detalle de páginas removidas y razón.
- [x] % tiempo circuito abierto última hora (`selectors.selectCircuitOpenPctLastHr` + panel).

(Sección conservada para nuevos items futuros.)

## 2. Testing
- [x] Cache hit/miss (Suppliers) – verificar telemetría `cache.hit|miss`.
- [x] Revalidación background: simular entrada half TTL -> espera -> assert revalidate.
- [x] Prefetch skip reasons: `cached` y `failed`.
- [x] Offline hydrate flow: guardar snapshot, simular offline, hidratar y mostrar lista.
- [x] i18n smoke test: verificar existencia de claves críticas (`errors.hint.*`).
- [x] E2E flujo CRUD completo (create → update → delete) con aserciones básicas (nota: caso edit requiere fallback de mutación directa en store debido a forma actual del mock; ver acción pendiente para remover fallback).

## 3. Offline UX
- [x] Banner o toast persistente cuando `isOffline` true (auto dismiss al reconectar).
- [x] Botón "Reintentar" forzando `fetchSuppliers` ignorando cache.
- [x] Indicador visual de datos potencialmente stale (edad caché > TTL/2).
- [x] Toggle para auto refetch al reconectar en panel métricas.

## 4. Rendimiento / Caching
- [x] Parametrizar TTL vía .env o config build (`VITE_SUPPLIERS_CACHE_TTL_MS`).
- [x] LRU trim para `pageCache` (límite por defecto 30) con telemetría `feature.suppliers.cache.trim`.
- [x] Estrategia de invalidación tras create/delete (limpiar página actual y adyacentes afectadas) + refetch background.

## 5. Circuit Breaker
- [x] Exponer contador fallos consecutivos en UI debug panel (selector circuitStats).
- [x] Métrica de % tiempo en estado abierto última hora (en panel).
- [x] Posibilidad de cierre manual (botón admin) con telemetría `feature.suppliers.circuit.reset`.

## 6. i18n & Accesibilidad
- [x] Auditoría final de literales (script/inspección manual inicial + nuevas keys añadidas a i18n: suppliers.page.*, suppliers.button.*, suppliers.state.*).
- [x] Live region: anunciar reapertura de circuito o retorno online (panel implementa announcements circuito).
- [x] Mensaje contextual en error DataState usando `lastErrorHintKey` + fallback (ya integrado en `Suppliers.jsx`).

## 7. DX / Mantenibilidad
- [x] Extraer helpers comunes (retry / circuit / cache LRU+invalidate / offline snapshot) a módulos compartidos (`store/helpers/{reliability,circuit,cache,offline}.js`).
- [x] Añadir tipos (TS) progresivos al store (actual JS) o JSDoc completo (Supplier + Products stores documentados con typedefs JSDoc).
- [x] Normalizar shape de respuestas mock (update/delete) para eliminar fallback manual en test de edición (removido fallback y simplificadas ramas de normalización en store Suppliers).
- [x] (Opcional) Añadir invalidatePages genérico a Products si se adopta misma estrategia de invalidación por radio tras mutaciones (implementado `_invalidatePages` en Products + refetch background).
- [x] Limpieza de comentarios y ramas legacy (eliminado jitter no usado, comentarios "Lote", ramas raw.results / objeto suelto en Suppliers, comentarios obsoletos en página Suppliers).

## 8. Definition of Done (Post Backlog)
- Cobertura tests Suppliers >= 85% líneas del store principal.
- 0 eventos legacy `suppliers.*` en runtime normal.
- Cache hit ratio visible en panel + circuito métricas básicas.
- UX offline clara y testeada (unit + E2E).
- Auditoría i18n sin literales pendientes críticos.
- Stores alineados usando helpers compartidos (sin duplicación lógica core resiliencia) y con tipado JSDoc homogéneo.

---
Última actualización: 2025-08-21
