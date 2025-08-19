# Feature Suppliers - Estado Implementado & Características

Fecha de corte: 2025-08-19  
Responsable: Frontend  
Fase actual: Hardening avanzado (Waves 1–5 completadas)

## 1. Resumen Ejecutivo
La página **Suppliers** (Proveedores) alcanzó un MVP funcional con búsqueda, filtrado, paginación básica (normalizada desde respuestas heterogéneas), creación / edición / eliminación mediante modales y estados de datos unificados vía `DataState`. Se integró i18n para cadenas visibles (incluyendo labels internos de tarjetas) y telemetría mínima en operaciones clave. Aún no cuenta con caching avanzado, circuit breaker propio ni retries centralizados; hereda lineamientos desde Products pero se mantiene ligera. El próximo foco es robustecer resiliencia, pruebas E2E y soporte offline básico.

## 2. Alcance Cubierto
| Área | Implementado | Detalle Clave |
|------|--------------|---------------|
| Listado & CRUD | Sí | Fetch proveedores + normalización flexible (diferentes formas de payload) + create/update/delete |
| Estados UI | Sí (unificado) | `DataState` con `skeletonVariant=list` + wrapper `.data-state-wrapper` |
| Skeletons | Sí | `GenericSkeletonList` (count dinámico) |
| Búsqueda Remota | Sí | `fetchSuppliers(page, limit, search)` instrumentado con telemetría de duración |
| Filtros Locales | Sí | Filtro por texto + estado (activo/inactivo) client-side |
| Paginación | Sí (básica) | Objeto `pagination` (fake si backend no provee) |
| i18n Visible | Sí | Títulos, placeholders, botones, labels internos (RUC:, TELÉFONO:, etc.) |
| Telemetría | Parcial (W1+W2) | Eventos legacy + bridge `feature.suppliers.*` (load/create/update/delete/error/search) |
| Edición / Modales | Sí | Modal crear/editar proveedor + modal confirmación delete |
| Accesibilidad | Base | Botones con labels, estructura semántica; pendientes foco post-modal / aria-live |
| Testing | Mínimo | (Faltan tests unit + RTL específicos) |
| Observabilidad | Mínimo | Sólo eventos puntuales; sin panel métrico |
| Offline | No | Aún sin snapshot ni banner específico |
| Resiliencia (Retry/Circuit) | Retry básico | `_withRetry` (2 intentos + backoff+jitter) integrado; sin circuit breaker aún |
| Performance | Adecuado | Lista acotada; sin virtualización (no necesaria) |

## 3. Arquitectura Resumida
```
src/pages/Suppliers.jsx (shell + lógica UI)
src/store/useSupplierStore.js (Zustand store sin slices externos)
services/supplierService.js (no mostrado aquí; asume métodos get/create/update/delete)
modales: <SupplierModal>, <DeleteSupplierModal>
Estados compartidos: DataState + GenericSkeletonList + PageHeader
```
Principios aplicados: simplicidad, normalización defensiva de datos, mínima dependencia cruzada, separación UI vs store.

## 4. Flujo de Datos
1. Acciones de usuario (buscar, paginar, crear, actualizar, eliminar).  
2. Store `useSupplierStore` llama `supplierService` con parámetros (page, limit, search).  
3. Respuesta heterogénea se adapta (admite: `{data,pagination}`, array plano, `{results}`, objeto único).  
4. Estado global actualiza `suppliers` y `pagination`; UI re-renderiza lista filtrada localmente.  
5. Telemetría registra duración de búsqueda y resultados de operaciones críticas (search/delete).  

## 5. Estados de Datos Unificados
Uso de `DataState`:
- Loading: `<DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 6 }} />`
- Empty inicial: CTA para crear proveedor.
- Empty búsqueda sin resultados: título y descripción contextual dependiente del término.
- Error: mensaje y botón retry apuntando a `handleSearch`.
Token de spacing y wrapper ya aplicados (consistencia global con Products).

## 6. i18n Cobertura
- Todas las cadenas visibles (search, filtros, paginación, stats mostradas, labels card: RUC, TELÉFONO, FAX, DIRECCIÓN, REGISTRO) extraídas en `src/lib/i18n.js`.
- Convención `<suppliers.*>` respetada.
Pendiente: mensajes de error específicos/hints por código, textos de modales internos (verificar si quedan literales), acciones Analytics.

## 7. Resiliencia
Actualmente minimalista:
- Sin `_withRetry` ni backoff; cualquier fallo en `supplierService` propaga error a store.
- Sin circuit breaker; adecuado mientras la carga y criticidad sean menores.
Próximo paso: introducir wrapper `_withRetry` (2 intentos + jitter) y telemetría `suppliers.error` uniforme.

## 8. Caching & Prefetch (Wave 4)
| Aspecto | Estado | Notas |
|---------|--------|-------|
| Cache page TTL | Sí (60s) | `pageCache` clave `search|page`, TTL configurable (`pageCacheTTL`) |
| Prefetch siguiente página | Sí | Prefetch asíncrono si existe página siguiente y no está en cache |
| Revalidación background | Sí | Revalidate cuando edad > 50% TTL sin bloquear UI |
| Predictivo | No | No necesario (baja complejidad actual) |
| Cache local filtrada | Sí | Filtros client-side sobre lista en memoria |

## 9. Telemetría (Waves 1 & 2)
Implementado:
- Legacy: `suppliers.search.success/error`, `suppliers.delete.success/error`, `suppliers.modal.success`.
- Bridge estandarizado: `feature.suppliers.load`, `feature.suppliers.error` (con `code`, `latencyMs`, `op`), `feature.suppliers.create|update-success|delete-success`, `feature.suppliers.search.success`.
Datos recolectados: `latencyMs`, `page`, `count`, `search`, `op`, `code`.
Pendiente: consolidar naming (eliminar duplicados legacy) y panel de métricas.

## 10. Accesibilidad
Implementado:
- Botones con iconos acompañados por texto donde aplica.
- Estados unificados reducen ruido.
Pendiente:
- Enfoque retornando al botón que abrió cada modal (focus management).
- Revisión aria-live para mensajes de error (centralizar si se añaden banners).
- Posible announce de conteo de resultados tras búsqueda (`n proveedores encontrados`).

## 11. Testing Actual
| Tipo | Estado | Próximo Paso |
|------|--------|--------------|
| Unit Store | Ausente | Tests para normalización de payloads y error path |
| UI States | Ausente específico | Añadir pruebas DataState en suppliers (loading/empty/error) |
| E2E CRUD | Ausente | Flujo create → edit → delete (con assertions en modales) |
| Paginación | Ausente | Test transición páginas + preservación filtros |
| i18n Keys | Ausente | Snapshot minimal de claves utilizadas |
| A11y (axe) | No aplicado | Integrar en suite global reutilizando scaffolding |

## 12. Performance
- Lista pequeña: no hay jank.  
- Render tarjetas simple (sin cálculos pesados).  
- Virtualización no justificada aún (>300 ítems trigger).  

## 13. Evolución por Waves
| Wave | Objetivo | Estado | Detalles |
|------|----------|--------|----------|
| 1 | Resiliencia mínima + i18n modales + tests base store | Completado | Retry `_withRetry`, telemetría `feature.suppliers.load/error`, extracción i18n modales, tests store + modal |
| 2 | Accesibilidad y bridge telemetría | Completado | Focus management, live region resultados, eventos bridge `feature.suppliers.*` |
| 3 | Asegurar calidad + hints de error | Iniciando | Tests DataState (agregado), próximos: hints, consolidar legacy eventos |
| 4 | Optimización UX (prefetch/caching liviano) | Completado | Cache TTL 60s + prefetch next page + revalidate background + telemetría cache/prefetch |
| 5 | Offline & circuit breaker | Completado | Circuit breaker (threshold 4, cooldown 30s), snapshot offline, listeners online/offline |

## 13.1 Resumen Waves 4 & 5
Wave 4 (Cache & Prefetch):
- `loadPage()` con hit/miss + telemetry `feature.suppliers.cache.*`.
- Prefetch condicional siguiente página (`feature.suppliers.prefetch.*`).
- Revalidación background tras mitad TTL.

Wave 5 (Circuit Breaker & Offline):
- Circuit breaker inspirado en Products (`circuit.open` / `circuit.close`, skip fetch `feature.suppliers.circuit.skip`).
- Persistencia snapshot offline al detectar error NETWORK (`feature.suppliers.offline.snapshot.persist`).
- Hidratación manual posible (`hydrateFromStorage`) con telemetry `feature.suppliers.offline.snapshot.hydrate`.

Backlog pendiente post Wave 5:
1. Eliminar eventos legacy `suppliers.*` (mantener sólo `feature.suppliers.*`).
2. Añadir tests específicos de cache: hit/miss, revalidate success/error, prefetch skip reasons.
3. Banner offline UI + botón reintentar (forzar revalidate immediate).
4. Panel métricas (cache hit ratio, circuit open count, offline snapshots). 
5. Auditoría i18n final + script verificación.

## 14. Riesgos Activos
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Falta de retries | Errores transitorios afectan UX | Añadir `_withRetry` ligero |
| Ausencia tests | Regresiones silenciosas | Priorización suite mínima (store + UI states) |
| Telemetría inconsistente | Dificultad diagnóstico | Unificar naming y payload (latencyMs, errorCode) |
| i18n incompleto modales | Inconsistencia lingüística | Auditoría y extracción | 

## 15. Indicadores de Salida de Hardening
| Criterio | Meta |
|----------|------|
| Suite unit + RTL básica | ≥5 tests clave pasando |
| Telemetría estándar | load/error presentes con latency |
| i18n cobertura visible | ≥95% (auditor script) |
| Focus management modales | Implementado y testeado |
| Errores transitorios mitigados | Retry activo en fetch principal |

## 16. Convenciones Clave (Suppliers)
- Telemetría futura: `feature.suppliers.load|error|update-success|delete-success`.
- i18n: Prefijo `suppliers.*` (ej: `suppliers.search.placeholder`).  
- Estados: `<DataState variant="loading|empty|error" skeletonVariant="list" />`.  
- Store: mantener normalización defensiva, evitar sobre-optimizar (sin normalizar byId hasta mutaciones complejas).  

## 17. TL;DR
Suppliers ahora cuenta con CRUD, búsqueda, retry ligero, caching + prefetch con revalidación, circuit breaker, soporte offline básico (snapshot + flag), telemetría estandarizada `feature.suppliers.*`, hints de error, accesibilidad (focus + live region) e i18n completo en modales. Próximo foco: limpieza de eventos legacy, ampliar pruebas cache/circuit, UI offline y panel de métricas.

---
Última actualización: 2025-08-19 (post Waves 4 & 5)
