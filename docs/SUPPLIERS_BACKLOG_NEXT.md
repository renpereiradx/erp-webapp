# Suppliers – Backlog Próximo (Post Wave 5)

Fecha: 2025-08-19
Contexto: Waves 1–5 completadas (resiliencia básica + a11y + error hints + cache/prefetch + circuit breaker + offline snapshot). Este backlog lista tareas de valor incremental pendientes antes de considerar la feature "Production Hardened" completa.

## 1. Telemetría & Observabilidad
- [ ] Eliminar eventos legacy `suppliers.*` restantes cuando tableros confirmen adopción de `feature.suppliers.*`.
- [ ] Añadir ratio de cache (hits/misses) expuesto via selector + panel métricas.
- [ ] Contador aperturas de circuito y duración promedio abierta.
- [ ] Evento `feature.suppliers.retry` por intento (actualmente retries encapsulados sin granularidad).
- [ ] Dashboard mini (React) reutilizando patrón MetricsPanel de Products.

## 2. Testing
- [ ] Cache hit/miss (Suppliers) – verificar telemetría `cache.hit|miss`.
- [ ] Revalidación background: simular entrada half TTL -> espera -> assert revalidate.
- [ ] Prefetch skip reasons: `cached` y `failed`.
- [ ] Offline hydrate flow: guardar snapshot, simular offline, hidratar y mostrar lista.
- [ ] i18n smoke test: verificar existencia de claves críticas (`errors.hint.*`).
- [ ] E2E flujo CRUD completo (create → update → delete) con aserciones de toast / DataState.

## 3. Offline UX
- [ ] Banner o toast persistente cuando `isOffline` true (auto dismiss al reconectar).
- [ ] Botón "Reintentar" forzando `fetchSuppliers` ignorando cache.
- [ ] Indicador visual de datos potencialmente stale (edad caché > TTL/2).

## 4. Rendimiento / Caching
- [ ] Parametrizar TTL vía .env o config build.
- [ ] LRU trim para `pageCache` (límite p.ej. 25 entradas) con telemetría `cache.trim`.
- [ ] Estrategia de invalidación tras create/delete (limpiar página actual y adyacentes afectadas).

## 5. Circuit Breaker
- [ ] Exponer contador fallos consecutivos en UI debug panel.
- [ ] Métrica de % tiempo en estado abierto última hora (en panel).
- [ ] Posibilidad de cierre manual (botón admin) con telemetría `circuit.close.manual`.

## 6. i18n & Accesibilidad
- [ ] Auditoría final de literales (script de escaneo regex vs diccionario).
- [ ] Live region: anunciar reapertura de circuito o retorno online.
- [ ] Mensaje contextual en error DataState usando `lastErrorHintKey` + fallback.

## 7. DX / Mantenibilidad
- [ ] Extraer helpers comunes (withRetry / circuit) a util compartido para evitar divergencia con Products.
- [ ] Añadir tipos (TS) progresivos al store (actual JS) o JSDoc completo.

## 8. Definition of Done (Post Backlog)
- Cobertura tests Suppliers >= 85% líneas del store principal.
- 0 eventos legacy `suppliers.*` en runtime normal.
- Cache hit ratio visible en panel + circuito métricas básicas.
- UX offline clara y testeada (unit + E2E).
- Auditoría i18n sin literales pendientes críticos.

---
Última actualización: 2025-08-19
