# Observabilidad Productos

## Eventos Clave (Telemetry)
- products.fetch.* (attempt, success.afterRetry, giveup, error)
- products.search.* (cache.hit/miss, revalidate.auto.*, abort, error)
- products.pageCache.* (hit, direct.hit, trim, revalidate.success/error)
- products.searchCache.trim
- products.bulkActivate.* / bulkDeactivate.*
- products.inlineUpdate.*
- products.prefetch.*
- products.perf.snapshot
- products.render.batch

## Campos estándar
- correlationId: identifica operación individual.
- code: código de error normalizado.
- page / term / count según contexto.

## Umbrales Recomendados
| Métrica | Umbral | Acción |
|---------|--------|--------|
| fetch latencia p95 | < 800ms | Revisar backend o reducir pageSize |
| search latencia p95 | < 500ms | Optimizar índices backend / cache TTL |
| ratio cache hits (search) | > 0.6 | Si menor, subir TTL o revisar patrones |
| circuit openings / hora | < 3 | Si mayor, investigar errores backend |
| bulk error rate | < 2% | Agregar retry selectivo |
| inline rollback rate | < 5% | Mejorar validación previa |
| avgFPS | > 50 | Si menor, reducir costo render / virtualización |

## Dashboards (Sugerencia)
1. Rendimiento
   - fetch/search timers (p50/p95), cache hit ratio, circuit openings
2. UX Interacción
   - bulk operaciones éxito/error, inline updates éxito/rollback
3. Estabilidad
   - códigos de error (stacked), giveups por retry, revalidate errores
4. Render
   - avgFPS, batch sizes, renders ProductCard acumulados

## Alertas
- Circuit breaker abierto > 5 min (posible caída backend).
- Inline rollback rate > 10% (validación insuficiente).
- Cache hit ratio cae < 40% (TTL corto o queries muy variables).

## Extensiones Futuras
- Incluir jitter en backoff y registrar backoff.totalDelay.
- Correlación userId/session en eventos.
- Exportar snapshot perf cada 5 min a backend.

