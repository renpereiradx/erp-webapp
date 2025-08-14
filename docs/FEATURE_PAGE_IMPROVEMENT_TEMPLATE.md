# Feature Page Improvement Template

Fecha: YYYY-MM-DD  
Responsable: Equipo Frontend  
Estado: Propuesto

## Objetivo
Elevar cualquier página de feature (ej: Pedidos, Clientes, Inventario, Compras) a un estándar profesional: arquitectura limpia, UI accesible y consistente, rendimiento estable, multitema unificado, observabilidad básica y DX robusta conservando la paridad funcional.

## Alcance
- Refactor UI/UX (densidad, jerarquía visual, accesibilidad, estados vacíos y errores)
- Arquitectura feature-first (aislar vista / lógica / datos)
- Estado y datos: fetching, caché, normalización, paginación o virtualización
- Integración multitema (tokens + utilidades compartidas)
- Calidad: tipado, pruebas, linting, métricas básicas

## Situación Actual (ejemplo de análisis)
Resumir:
- Tamaño y responsabilidades del componente principal
- Estado actual (store central / hooks dispersos / efectos duplicados)
- Patrones de UI (modales, tablas, formularios, toasts)
- Deuda técnica (estilos inline, falta de separación, re-renders, accesibilidad)
- Métricas de rendimiento (FPS en listas, TTFB, tiempo de búsqueda, tamaño bundle)

## Principios
- Single Responsibility y separación clara (vista vs. lógica vs. datos)
- Composición > herencia
- Flujos declarativos y predecibles (side-effects encapsulados)
- Adaptadores / mappers para aislar API de dominio UI
- Accesibilidad WCAG AA (roles, aria, focus, atajos)
- Rendimiento por defecto (memo, virtualización, debounce, lazy, suspense)
- Theming unificado vía tokens (CSS vars) + `useThemeStyles`
- Errores consistentes (objeto ApiError { code, message, hint })

## Arquitectura Feature-First
`srv/features/<feature>/`
- `components/` (Toolbar, Filters, Table/Grid, EmptyState, Stats, BulkActions)
- `modals/` (Create/Edit, Detail/Preview, ConfirmDelete)
- `hooks/` (`use<Feature>Filters`, `use<Feature>Search`, `use<Feature>Page`, `useBulkSelection`, `useDebouncedValue`)
- `services/` (apiClient, mappers, validators, normalizers)
- `store/` (slice Zustand/Redux con acciones atómicas + selectores memoizados)
- `types/` (Modelos dominio, DTO, mappers inversos)
- `__tests__/` (unit + integración ligera con MSW)
- `README.md` (contratos, dependencias internas)

Página en `src/pages/<Feature>.jsx` actúa como shell orquestador (layout, Suspense boundaries, ErrorBoundary local, lazy imports).

## UI/UX: Mejoras Clave
- Densidad compacta (inputs/botones sm, paddings reducidos)
- Listado escalable: tabla virtualizada o grid virtualizado si > 50 ítems
- Filtros persistentes (localStorage + versión)
- Acciones masivas (bulk select + confirmación)
- Edición inline opcional (optimista + rollback en error)
- Accesibilidad: navegación teclado (Arrow / Home / End / Esc / /), focus visible
- Estados: skeletons, vacíos con CTA, errores con retry y diagnósticos
- Lazy-load de modales / paneles pesados
- Preparado para i18n (strings key-based)

## Estado y Datos
- Búsqueda con debounce y cancelación (AbortController)
- Caché SWR-like: strategy stale-while-revalidate (timestamp + background refetch)
- Normalización por id (diccionario + listas ordenadas/paginadas)
- Paginación o infinite scroll parametrizable
- Selectores memoizados (`useShallow` / Reselect) para evitar renders
- Retries con backoff para errores transitorios
- Telemetría: latencia endpoints, ratio error, tiempos interacción

## Multitema
- Reemplazar estilos ad-hoc por tokens globales (colors, spacing, radii, shadows)
- Hook `useThemeStyles` para variantes tipográficas y contenedores (card, button, input)
- Validar contraste (modo claro/oscuro y variantes de tema)

## Calidad y DX
- Tipos dominio (TS o JSDoc) + DTO externos (separación API/UI)
- ESLint + reglas de accesibilidad (`jsx-a11y`), complejidad y exhaustiveness hooks
- Tests:
  - Unit: hooks puros, utils, mappers
  - Integración: flujo CRUD principal usando MSW
  - (Opcional) e2e ligera: escenarios críticos
- MSW para mocks en tests y Storybook (si aplica)
- Scripts de verificación: lint, typecheck, test, size-limit

## Roadmap Fases (Adaptar Duraciones)
- Fase 0 Auditoría (0.5–1d)
  - Inventario de responsabilidades, métricas actuales, deuda crítica
- Fase 1 Infraestructura (1–2d)
  - Crear carpeta feature + skeleton, extraer hooks base (filtros/debounce)
  - Integrar theming tokens
- Fase 2 UI/Accesibilidad (2–3d)
  - Componentes compactos, navegación teclado, estados vacíos/errores
  - Lazy de modales/paneles
- Fase 3 Datos/Rendimiento (2–3d)
  - Debounce + cancelación, caché SWR-like, virtualización, normalización store
  - Errores estandarizados + toasts coherentes
- Fase 4 Calidad (1–2d)
  - Tipos, tests, métricas básicas, documentación, verificación final

## Entregables
- Carpeta feature completa y page shell simplificada
- UI accesible y responsive con virtualización cuando aplica
- Hooks reutilizables y servicios aislando API
- Caché y manejo de errores consistentes
- Tests clave + documentación

## Criterios de Éxito
- Rendimiento: lista > 50 ítems sin jank (scroll suave / FPS estable)
- Búsqueda: < 400ms respuesta percibida tras debounce, cancelable
- Accesibilidad: Navegación teclado completa, roles/aria, contraste AA
- Multitema: Cambios tema sin pérdida jerarquía visual
- Calidad: Lint + Typecheck cero errores, tests verdes (>80% crítico), tamaño bundle controlado

## Riesgos y Mitigaciones
- Complejidad virtualización → componente wrapper `Virtualized[List|Grid]` aislado
- Cambios API → mappers + validadores minimizan reescritura
- Migración progresiva → feature flag `<feature>.newUI`
- Rendimiento selectors → memo + normalización anticipada

## Próximos Pasos Inmediatos (Checklist)
1. Auditoría presente (snapshot métricas + deuda)
2. Crear estructura feature + README de contratos
3. Extraer filtros / debounce / selección múltiple
4. Integrar tokens de tema y eliminar estilos inline
5. Implementar lista/tabla virtualizada (si aplica)
6. Añadir caché SWR-like + normalización
7. Centralizar errores y telemetría mínima
8. Añadir tests unitarios e integración
9. Documentar patrones y ejemplos de uso

## Métricas Sugeridas a Monitorear
- Tiempo primera interacción (TTI) page
- Tiempo búsqueda (usuario → resultados)
- Re-renders promedio por item
- Latencia API promedio / p95
- Errores de fetch por 100 requests
- FPS scroll lista (sample > 60fps ideal / > 50fps aceptable)

## Recomendaciones Temáticas y Extensiones Opcionales
Adaptar según el tipo de feature y complejidad de datos.

### Theming / UI
- Variantes adicionales según tema (ej: barras de énfasis, estilo de chips) controladas por tokens, no condicionales dispersos.
- Componente `ThemedBadge` para estados (active/inactive/warning) reutilizable en features.
- Modo denso (compact density) con toggles por usuario almacenado en preferencias.

### Accesibilidad Avanzada
- Anunciar resultados de búsqueda con `aria-live="polite"` (ej: "8 resultados para 'zapatos'").
- Focus trap consistente en modales y retorno de foco al origen al cerrar.
- Atajos configurables (registrar en una tabla central de comandos).

### Estado y Datos
- Implementar controlador global de abort para cancelar requests al navegar.
- TTL dinámico por tipo de dato (ej: categorías vs. productos activos).
- Prefetch anticipado de la siguiente página al 70% del scroll (si es lista extensa).

### Rendimiento
- Medir y registrar re-renders por item en desarrollo (custom hook `useRenderCountDev`).
- Memo granular: usar `memo` + selectors focalizados + `useSyncExternalStore` si se requieren actualizaciones masivas.
- Split de bundle: separar modales/paneles avanzados, gráficos, y editor enriquecido.

### Inline Editing
- Componente `EditableField` con estados: view, edit, saving, error (rollback automático).
- Validación en blur + confirmación con Enter / cancel con Esc.
- Buffer local de cambios masivos con botón "Aplicar todo".

### Bulk Operations
- Acciones encadenadas (activar + asignar categoría) con pipeline y feedback incremental.
- Vista de progreso (modal bottom-sheet) para operaciones > 1s.

### Errores y Observabilidad
- Normalizar ApiError y mapear códigos a hints de recuperación.
- Canal de logs silenciosos para diagnósticos (telemetry.debug) activable por flag.
- Correlación de request mediante header `x-request-id` expuesto en toasts si hay fallo.

### Seguridad / Resiliencia
- Sanitizar input de búsqueda (trim, limitar longitud, whitelist de caracteres opcional).
- Circuit breaker simple para endpoints inestables (desactiva intentos 30s tras N fallos).

### Internacionalización
- Tabla de claves: `feature.<entity>.<action>`.
- Extracción automática de cadenas con script de verificación.

### Testing Ampliado
- Tests de selección masiva (activar/desactivar) y rollback.
- Tests de inline edit optimista (éxito y error).
- Contract tests de mappers (API -> dominio) con fixtures congeladas.
- Pruebas de accesibilidad automatizadas (axe) en componentes clave.
- Smoke e2e flujo CRUD completo + búsqueda + bulk action.

### Métricas Operativas Extras
- Tiempo medio entre cambios inline y persistencia.
- Porcentaje de búsquedas abortadas vs. completadas.
- Ratio de cache hits (searchCache) y ahorro estimado.

### Feature Flags
- Estructura: `featureFlags = { productsNewUI: true, productsInlineEdit: false, productsBulkPipeline: false }`.
- Hook `useFeatureFlag(key)` para lectura reactiva (context + localStorage override dev).

### DX / Tooling
- Script `analyze-products-performance` que recolecta métricas de render y peso de componentes.
- Storybook stories para estados vacíos, loading, error, >50 items virtualizados.

---
Este template sirve como guía reutilizable; ajustar tiempos, componentes y estrategias según la complejidad de cada feature.

## Estado Actual Products (Progreso Fases)
- Fase 0 Auditoría: COMPLETADA
- Fase 1 Infraestructura: COMPLETADA (feature folder, hooks base, theming)
- Fase 2 UI/Accesibilidad: AVANCE (>70%) (virtualización, teclas, estados, bulk UI) Falta: aria-live, focus return modales
- Fase 3 Datos/Rendimiento: PARCIAL (normalización, caché básica, telemetry; falta SWR background categories completo, prefetch next page, circuit breaker)
- Fase 4 Calidad: EN CURSO (tests adicionales agregados: filtros, grid A11y/teclado, store abort/cache, bulk, optimista, normalization, mappers)

Nuevos entregables añadidos: mappers (`productMappers.js`), tipos dominio (`types/index.d
