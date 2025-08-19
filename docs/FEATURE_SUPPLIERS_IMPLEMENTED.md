# Feature Suppliers - Estado Implementado & Características

Fecha de corte: 2025-08-19  
Responsable: Frontend  
Fase actual: Hardening (Waves 1 & 2 completadas, iniciando Wave 3)

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

## 8. Caching & Prefetch
| Aspecto | Estado | Notas |
|---------|--------|-------|
| Cache page TTL | No | Cada búsqueda refresca completamente; suficiente por ahora |
| Prefetch siguiente página | No | Diferido; evaluar tras métricas de navegación |
| Predictivo | No | No necesario (baja complejidad) |
| Cache local filtrada | Parcial | Filtrado in-memory de lista cargada |

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
| 4 | Optimización UX (prefetch/caching liviano) | Pendiente | Prefetch página siguiente condicional, memorizar búsqueda reciente |
| 5 | Offline & circuit breaker opcional | Pendiente | Circuit breaker alineado a Products, cola offline básica |

## 13.1 Backlog Wave 3 Detallado
1. Mapear `error` → `code` → hint i18n (`errors.hint.<CODE>`) y exponer `lastErrorHintKey` para UI.
2. Consolidar telemetría: deprecar eventos legacy una vez panel soporte `feature.suppliers.*`.
3. Tests adicionales: delete error path (simular primer fallo → retry recupera), anuncio live region tras búsqueda (assert contenido `suppliers-live-region`).
4. Script verificación i18n (opcional) para detectar literales pendientes.

KPIs Wave 3:
- Cobertura tests Suppliers (unit+RTL) ≥ 6.
- 100% eventos migrados al prefijo unificado.
- 1 hint mostrado correctamente en error simulado.

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
Suppliers ahora cuenta con CRUD, búsqueda, retry ligero, telemetría estandarizada `feature.suppliers.*`, accesibilidad mejorada (focus + live region) e i18n completo en modales. Wave 3 se centra en hints de error, limpieza de eventos legacy y ampliación de pruebas antes de optimizaciones (prefetch, offline, circuit breaker).

---
Última actualización: 2025-08-19
