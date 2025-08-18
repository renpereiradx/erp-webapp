# Plan de Mejora de la Página de Productos

Fecha: 2025-08-10
Responsable: Equipo Frontend
- Estado: Propuesto
+ Estado: En progreso (última actualización: 2025-08-16)

## Objetivo
Elevar la página de Productos a un estándar profesional: arquitectura limpia, UI minimalista y accesible, rendimiento consistente, multitema unificado y DX robusta, manteniendo paridad funcional y mejorando la experiencia operativa.

## Alcance
- Refactor de UI/UX (densidad compacta, consistencia, accesibilidad)
- Arquitectura por características (feature-first), desacople de vistas y lógica
- Estado y datos (fetching, caché, paginación/virtualización, errores)
- Integración con multitema (Neo-Brutalism, Material, Fluent, light/dark)
- Calidad (tests, tipado, linting, métricas)

## Situación actual (resumen)
Basado en `src/pages/Products.jsx`:
- Componente de gran tamaño con múltiples responsabilidades (búsqueda, filtros, tabla/listado, paginación, modales, toasts, estilos por tema en línea).
- Estado central con `useProductStore` (Zustand), búsqueda en API, paginación, categorías.
- Múltiples modales: `ProductModal`, `ProductDetailModal`, `DeleteProductModal`.
- Lógica de estilos por tema embebida (getCardStyles/getTypographyStyles/etc.).
- UX: acciones principales claras; oportunidad de densidad compacta, accesibilidad y rendimiento en listas grandes.

## Principios y buenas prácticas
- Single Responsibility: dividir por funciones/áreas (vista vs. lógica vs. datos).
- Composición sobre herencia; hooks reutilizables para lógica de UI.
- Declarativo y predecible: componentes puros, side-effects en hooks/servicios.
- Patrón de datos consistente: DTOs, mappers, validación ligera.
- Diseño accesible: WCAG AA, roles/aria, focus management.
- Rendimiento por defecto: virtualización, memoización, debounce, suspenso progresivo.
- Tema único de estilos: tokens (CSS vars), hook `useThemeStyles`, clases utilitarias.

## Arquitectura propuesta (feature-first)
Estructura sugerida:
- `src/features/products/`
  - `components/` Toolbar, Filters, ProductTable, ProductListItem, EmptyState, CompactStats, BulkActions
  - `modals/` ProductModal, ProductDetailModal (compacto), DeleteProductModal
  - `hooks/` useProductFilters, useProductSearch, useProductsPage, useBulkSelection, useDebouncedValue
  - `services/` productApi (fetch/paginación), mappers (API -> dominio), validators
  - `store/` slice del store (selectores, acciones atómicas)
  - `types/` Product, Category, Price, Stock (TS o JSDoc con typedefs)
  - `__tests__/` unitarios + integración ligera
- `src/pages/Products.jsx` solo orquesta el feature (shell + lazy)

Patrones a emplear:
- Container-Presentational (shell/page vs. UI pura)
- Command/Action pattern para operaciones (create/update/delete/bulk)
- Adapter/Mapper para convertir API <-> dominio
- Suspense boundaries y Error Boundaries locales
- Atomic/Design Tokens alineado con `docs/ATOMIC_ARCHITECTURE_IMPLEMENTATION.md`

## UI/UX: mejoras concretas
- Densidad compacta: alturas h-8/h-9 en inputs, botones `size="sm"`, paddings reducidos.
- Tabla virtualizada para listados grandes (opción: `@tanstack/react-virtual` o `react-window`).
- Filtros persistentes y guardados (localStorage o store): búsqueda, categoría, stock, orden.
- Acciones masivas: activar/desactivar, cambio de precios, categorías en lote.
- Edición inline opcional con confirmación (optimista + rollback en error).
- Accesibilidad: navegación por teclado, atajos (/, Enter, Esc), focus visible, aria-labels, roles en tablas y modales.
- Estados: skeletons y vacíos con CTA claros; errores con retry.
- Modales lazy-loaded con `React.lazy` + `Suspense` para reducir el TTI.
- Soporte i18n futuro (claveado de strings).
- Modo minimalista consistente con Compras: `useThemeStyles`, tarjetas y textos compactos.

## Estado y datos
- Búsqueda con debounce (300–500ms) y cancelación (AbortController).
- Caché normalizada por página/filtros; revalidación en background (stale-while-revalidate) manteniendo Zustand.
- Paginación o infinite-scroll seleccionable; exponer tamaño de página configurable.
- Selectores memoizados en store para evitar renders (Zustand `useShallow/selectors`).
- Manejo de errores estandarizado (dominio): ApiError { code, message, hint }.
- Telemetría mínima: latencia de endpoints, ratio de errores, intentos de reintento.

## Multitema
- Unificar estilos de Products con el hook `useThemeStyles` usado en Compras.
- Sustituir funciones locales de estilo (getCardStyles/typography) por tokens y utilidades comunes.
- Asegurar contraste (light/dark) y consistencia entre Neo-Brutalism, Material y Fluent.

## Calidad y DX
- Tipado: migración progresiva a TypeScript (al menos tipos de dominio y servicios).
- ESLint + Prettier ya configurados; añadir reglas para accesibilidad (jsx-a11y) y complejidad.
- Tests: unit (utils/hooks), integración (feature), e2e ligera (flujos CRUD básicos con Playwright).
- Mock de API con MSW para pruebas y storybook de componentes clave (opcional).

## Roadmap por fases
- Fase 0 – Auditoría (0.5–1 día)
  - Mapear props/estado/efectos en `Products.jsx` y dependencias.
  - Identificar deuda (estilos inline, lógica duplicada, render pesado).
- Fase 1 – Infra y carpeta feature (1–2 días)
  - Crear `src/features/products/` con skeleton de componentes, hooks y servicios.
  - Extraer hooks: `useDebouncedValue`, `useProductFilters`.
  - Añadir `useThemeStyles` a la página y componentes clave.
- Fase 2 – UI compacta + accesible (2–3 días)
  - Toolbar/Filters compactos, tabla/lista con densidad reducida.
  - Estados vacíos/skeletons, roles/aria, navegación por teclado.
  - Lazy-load de modales y división de código.
- Fase 3 – Datos y rendimiento (2–3 días)
  - Debounce + cancelación en búsqueda; caché SWR-like en store.
  - Virtualización de lista; selectores memoizados.
  - Manejo estandarizado de errores y toasts coherentes.
- Fase 4 – Calidad (1–2 días)
  - Tipos principales, tests unitarios/integración, fixtures MSW.
  - Lint/CI, métricas básicas, documentación.

## Progreso reciente (Sprint actual)
Lista de hitos completados o parcialmente entregados desde estado "Propuesto":

### Hecho ✅
 - Circuit breaker funcional en store con métricas de fallos y cierre tras cooldown.
 - Backoff con jitter (+/-30%) integrado en _withRetry.
 - Telemetría granular: cache hits/misses, retries, errores store, inlineUpdate rollback/success, prefetch.
 - TTL override & tests de expiración (pageCache + searchCache) con helpers de testing (setTestingTTL, fast retries).
 - i18n base ampliada (claves de validación, hints de error, acciones principales, inline edit UI).
 - Exposición de hint traducible en ErrorState (mapping code→hint key) y toasts unificados.
 - Panel métrico mínimo (`MetricsPanel` – hits, misses, ratio, circuito abierto/cerrado) detrás de flag `productsMetricsPanel`.
 - Scaffold Playwright + script `test:e2e` + workflow CI + test inicial con intercept de /api/products y integración condicional AXE.
 - Selectores `data-testid` estables en `ProductCard` para E2E (card, view, edit, inline).
 - Mejora accesibilidad inline edit (roles/aria-labels, mensajes de validación en aria-live cuando aplica).
 - Refuerzo de pruebas unitarias (store resiliencia, TTL, circuit breaker, inline edit rollback) y nuevo test de panel métricas.

### Parcial ⏳
 - AXE integrado de forma opcional (import dinámico) pero faltan suites dedicadas y baseline de violaciones.
 - Extracción completa de cadenas restantes (placeholders, tooltips, paginación) pendiente.
 - Unificación de estados Skeleton / Empty / Error aún no implementada (diseño pendiente).
 - Prefetch predictivo solo soportado manualmente vía `prefetchNextPage` (no trigger por scroll todavía).
 - Slices detallados (products/categories/ui) no creados; store sigue monolítico.

### Riesgos / Observaciones
 - Necesario endurecer tests de circuit breaker con timers fake para validar reapertura determinista.
 - Panel métricas carece aún de FPS / counters por código de error (planificado siguiente iteración).

## Estado por Fase (Roadmap revisado)
| Fase | Estado | Comentario |
|------|--------|------------|
| 0 Auditoría | ✅ | Mapeo inicial completado |
| 1 Infra / Skeleton | ✅ | Helpers testing + selectors + panel básico añadidos |
| 2 UI compacta + A11y | ⏳ | Inline edit y labels mejorados; faltan unified states & focus mgmt completo |
| 3 Datos & Rendimiento | ⏳ | Cache SWR-like, TTL, retry jitter, circuit breaker listos; falta virtualización y prefetch predictivo automático |
| 4 Calidad | ⏳ | Unit coverage elevada en store; E2E scaffold listo, faltan escenarios CRUD/bulk/offline y AXE baseline |

## Próximos pasos inmediatos (re-priorizados)
1) (P1) Unificar componentes Empty / Error / Skeleton + extraer strings remanentes a i18n.
2) (P1) Ampliar suite Playwright: crear, búsqueda, inline edit, bulk toggle, offline banner, rollback.
3) (P1) Añadir report AXE (fail build si violaciones críticas/serias) y test de live-region announcements.
4) (P2) Extender MetricsPanel: FPS (rAF sampler), error counters por código, latencias percentiles.
5) (P2) Implementar prefetch predictivo por near-end scroll + flag `productsInfiniteScroll` (inicial desactivado).
6) (P2) Refactor store → slices (products/categories/ui) manteniendo API pública estable.
7) (P1) Completar internacionalización (placeholders, tooltips, paginación, toasts pendientes) + toggle idioma runtime.

## Métricas objetivo siguientes iteraciones
| Métrica | Objetivo | Nota |
|---------|----------|------|
| AXE violaciones críticas/serias | 0 | Falla pipeline si >0 |
| Cache hit ratio (warm) | ≥ 0.55 | Después de 2 páginas navegadas |
| Latencia fetch (p50) | < 400ms local (mock) | Telemetría actual p50 ~ <300ms |
| Tiempo reapertura circuito | Igual a cooldown configurado ±5% | Validado con fake timers |
| Cobertura tests store | > 80% líneas | Actual ~ alto (por revisar con cobertura) |

## Riesgos y mitigaciones
- Incremento de complejidad por virtualización: encapsular en componente `VirtualizedList`.
- Cambios de API: usar mappers y validadores para aislar impactos.
- Migración progresiva: feature flag `products.newUI` para rollout seguro.

## Próximos pasos inmediatos
- Reemplazado por sección "Próximos pasos inmediatos (re-priorizados)" más arriba.
