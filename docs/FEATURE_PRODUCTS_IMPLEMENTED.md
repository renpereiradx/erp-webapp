# Feature Products - Estado Implementado & Características

Fecha de corte: 2025-08-19  
Responsable: Frontend  
Fase actual: Transición MVP → Hardening consolidado ("Fase 1.5")

## 1. Resumen Ejecutivo
La página **Products** evolucionó desde un MVP funcional hacia una base robusta con caché tipo SWR, resiliencia con retry + circuit breaker, edición inline básica, telemetría mínima, i18n extendido y estados de datos unificados. El enfoque ahora es reducir riesgos (flakiness circuito, cobertura i18n residual, E2E CRUD/offline) antes de activar optimizaciones avanzadas (prefetch predictivo, virtualización, panel de métricas ampliado).

## 2. Alcance Cubierto
| Área | Implementado | Detalle Clave |
|------|--------------|---------------|
| Listado & CRUD | Sí | Búsqueda remota + paginación; modales create/detail/delete; edición inline selectiva |
| Estados UI | Sí (unificado) | `DataState` con `skeletonVariant=productGrid`; wrapper `.data-state-wrapper` + token `--ds-spacing-y` |
| Skeletons | Sí | Grid específico y `GenericSkeletonList` para variantes list |
| i18n Visible | Sí | Títulos, acciones, placeholders, labels internos extraídos (incluye DOCUMENTO:, RUC:, REGISTRO:, SUBTOTAL en dominios relacionados) |
| Caching | Sí (básico) | TTL + page cache + invalidación controlada; sin prefetch inteligente todavía |
| Retry | Sí | `_withRetry` (backoff + jitter) en operaciones críticas |
| Circuit Breaker | Sí (refactor) | `_closeCircuit` central; eventos `circuit.open` / `circuit.close`; guardas en prefetch |
| Telemetría | Sí (mínima) | Eventos `products.load`, `products.error`, counters de error internos (base) |
| Edición Inline | Básico | Optimista puntual; sin undo / batching aún |
| Selección Múltiple | Parcial | Bulk activar/desactivar; persistencia entre páginas pendiente |
| Accesibilidad | Base | Roles semánticos, navegación consistente, reducción de ruido (un solo contenedor estados); foco post-modal pendiente |
| Testing | Base + UI States | Unit store parcial, skeleton tests, list/product skeleton variant, pruebas de estados; faltan E2E CRUD/bulk/offline |
| Observabilidad | Parcial | Telemetría mínima; panel métrico bajo flag; falta surfacing UI counters |
| Offline | Parcial | Banner + snapshot; falta cola optimista y replay |
| Performance | Adecuado | No virtualización (no umbral >300 items); sin problemas de jank actuales |

## 3. Arquitectura Resumida
```
src/features/products/
  components/ (Grid, Cards, SkeletonGrid, ...)
  services/ (productService, mappers livianos)
  store/ (useProductStore.js - Zustand)
  __tests__/ (skeleton / estado / unit básicos)
```
Principios aplicados: feature-first, separación UI / datos, retries y resiliencia encapsulados, estados centralizados.

## 4. Flujo de Datos
1. Usuario interactúa (search / paginación / mutate) → acciones del store.
2. `useProductStore` ejecuta fetch con `_withRetry` y validaciones estado circuito.
3. Respuesta mapeada (si procede) + cache page TTL.
4. UI se re-renderiza consumiendo selectores focalizados.
5. Telemetría (`products.load` / `products.error`) registra duración y códigos.

## 5. Estados de Datos Unificados
Uso de `DataState`:
- Loading: `<DataState variant="loading" skeletonVariant="productGrid" />`
- Empty inicial / filtros sin resultados: variantes `empty` con i18n.
- Error: `<DataState variant="error" code={lastErrorCode} hint={lastErrorHint} onRetry={retryFn} />`
Token de spacing: `--ds-spacing-y` configurable; se evita hardcode de paddings.

## 6. i18n Cobertura
- Claves de Products + claves internas compartidas (stats, labels de tarjetas, resúmenes financieros) extraídas en `src/lib/i18n.js`.
- Eliminación de strings visibles en JSX (convención `<feature>.*`).
- Extendido además a páginas relacionadas (Clients, Suppliers, Purchases, Booking, Login) para coherencia inter-dominio.
Pendiente: Dashboard widgets, modales secundarios heredados, hints de error exhaustivos.

## 7. Resiliencia & Circuit Breaker
- Incremento de fallos → abre circuito con cooldown configurable.
- `_closeCircuit(reason)` asegura código DRY y limpieza de timers.
- Telemetría: `circuit.open` (failures, openUntil) y `circuit.close` (reason).
- Guardas anti-prefetch cuando el circuito está abierto o hay carga activa.

## 8. Caching Estratégico
| Tipo | Implementado | Notas |
|------|--------------|-------|
| Page Cache | Sí | TTL temporal; invalida al cambiar filtros clave |
| Prefetch Siguiente Página | Parcial | Condicionado; ahora añade guardas (no si loading/circuit) |
| Predictivo | No | Diferido (necesita señal de navegación) |
| Offline Persistente | No | Plan: IndexedDB + cola |

## 9. Telemetría
Eventos actuales (mínimos):
- `products.load` (latencia ms)
- `products.error` (code, latency)
- `circuit.open` / `circuit.close` (resilience)
Pendiente: surfaced counters UI (error rate, cache hit ratio) y tipado estricto de payloads.

## 10. Accesibilidad
Implementado:
- Estados unificados reducen ruido visual y duplicación de regiones.
- Único wrapper para skeleton / error / empty.
Pendiente:
- Gestión de foco tras cerrar modales.
- Audit aria-live (central) y diferenciación de mensajes error vs info.

## 11. Testing Actual
| Tipo | Estado | Próximo Paso |
|------|--------|--------------|
| Unit Store | Parcial | Añadir casos edge (circuit, retries, cache expiry) |
| UI States | Implementado | Cobertura variantes error/empty con i18n keys |
| E2E CRUD | Pendiente | Flujos create → edit inline → delete |
| Bulk / Offline | Pendiente | Simulación desconexión + replay futuro |
| A11y (axe) | Scaffold | Integrar en CI con severidad fail crítico/serio |

## 12. Performance
- Sin señal de degradación (lista acotada). Virtualización diferida hasta >300 items o jank medible (<50 FPS scroll). Split oportunista en modales (lazy) ya aplicado.

## 13. Deuda / Próximos Pasos (Orden Sugerido)
1. Cerrar brechas i18n (hints errores, modales residuales).  
2. Test determinista de circuit breaker (fake timers unificados).  
3. Suite E2E CRUD + inline + bulk básico + fallback offline.  
4. Cola offline mínima (persist + replay) + eventos `products.queue.enqueue|replay`.  
5. UI surfaced metrics: error counter, cache hit ratio.  
6. Prefetch predictivo / infinite scroll (feature flag).  
7. Virtualización (si se alcanza umbral).  
8. Undo inline / batch editing (si frecuencia edición confirmada).  
9. Tipado estricto eventos telemetry (esquema central).  

## 14. Riesgos Activos
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Flakiness circuit breaker timers | Bloqueo CI / tests inestables | Normalizar fake timers + test dedicado |
| Falta E2E CRUD/offline | Regresiones silenciosas | Priorizar suite base antes de nuevas features |
| i18n hints incompletos | UX inconsistente multi-idioma | Auditoría de claves + script verificación futura |
| Ausencia cola offline | Pérdida de cambios desconectado | Implementar MVP persistente antes de ampliar alcance |

## 15. Indicadores de Salida de Hardening
| Criterio | Meta |
|----------|------|
| E2E CRUD&bulk estables | 3 corridas CI consecutivas sin flake |
| Circuit breaker determinista | 5 corridas locales sin variación |
| Cobertura i18n | ≥95% (script auditoría <5% literales) |
| Estados UI duplicados | 0 instancias fuera de `DataState` |
| Telemetría base | load/error + circuit + errorCounter surfaced |

## 16. Convenciones Clave (Recordatorio)
- Telemetría: `products.<accion>` (load, error, update-success, circuit.*).  
- i18n: Agrupar por contexto (`products.list.*`, `products.form.*`).  
- Estados: `<DataState variant="loading|empty|error" skeletonVariant="productGrid|list" />`.  
- Retries: `_withRetry(fn, { retries:2 })` con jitter.  
- Circuit: usar `_circuitOpen()` y `_closeCircuit(reason)` (no duplicar lógica).  

## 17. TL;DR
Products ya cuenta con: estados unificados, i18n visible completo, resiliencia (retry + circuito), caché básica con TTL, edición inline mínima, telemetría esencial y pruebas iniciales de estados. Falta consolidar fiabilidad (circuit, E2E CRUD/offline) y luego expandir a optimizaciones (prefetch predictivo, virtualización, métricas avanzadas). Priorizar cierre de P1 antes de añadir superficie.

---
Última actualización automática: 2025-08-19
