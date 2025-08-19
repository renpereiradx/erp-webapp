# Guía de Contribución Simplificada - Products

Objetivo: Reducir fricción para avanzar otras páginas manteniendo los puntos de mayor impacto (UX básica, errores claros, extensibilidad). Esta guía reemplaza temporalmente la versión completa; los elementos avanzados pasan a fases posteriores.

## Fases
| Fase | Enfoque | Incluye |
|------|---------|---------|
| MVP | Entregar valor rápido | Listado, ver detalle mínimo, crear/editar principal, errores genéricos |
| Hardening | Robustez incremental | Unificación estados UI, hints error, i18n completa visible, test básicos |
| Optimización | Rendimiento / escala | Virtualización, cache avanzada, métricas detalladas |

## Principios Simplificados
- Hacerlo funcionar primero (MVP) antes de optimizar.
- Estado global sólo si se comparte entre múltiples componentes relevantes.
- i18n: ninguna cadena visible hardcodeada en JSX (incluye labels internos como DOCUMENTO:, RUC:, REGISTRO:, SUBTOTAL).
- Telemetría mínima: 1 evento load + 1 evento error con duración.
- Evitar premature optimization (sin virtualización ni normalización si < 300 items / sin problemas de perf).
- Reusar `DataState` + `skeletonVariant` para Loading/Empty/Error y mantener un único wrapper/tokens.

## Estructura Mínima
```
src/features/products/
  components/
  hooks/
  services/
  __tests__/
```
`types/` sólo si añadimos TS o generamos tipos compartidos.

## Patrones (Usar Cuando Aplique)
- `_withRetry` (2 intentos + backoff) para fetch críticos.
- `EditableField` sólo si inline edit aporta valor inmediato; si no, usar modal simple.
- LRU / TTL cache: diferir hasta observar repetición de fetch.
 - `DataState` + `skeletonVariant` ('productGrid' o 'list') para unificar placeholders.

## Convenciones Clave
- Telemetría: `products.<accion>` (load, error, update-success).
- Errores: centralizar códigos/hints en `utils/errorCodes.js` (añadir si se usa uno nuevo).
- i18n: `products.*` agrupar por contexto (`products.list.title`, `products.form.save`) y extraer labels internos (ej: `products.card.stock`, etc.) cuando se hagan visibles.
 - Estados UI: `<DataState variant="loading|empty|error" ... />` (wrapper estandarizado `.data-state-wrapper`).

## Flujo para Añadir Campo Editable (Simplificado)
1. Añadir campo al formulario/modal (no inline si no es imprescindible).
2. Validar localmente (requerido / formato) antes de enviar.
3. Emitir evento `products.update-success` o `products.update-error`.

Inline optimista sólo en Hardening si se justifica (alta frecuencia de edición).

## Bulk Actions (Diferir)
Implementar sólo cuando haya caso de uso confirmado que ahorre tiempo (>3 acciones repetidas en tests de usuario). Documentar en el PR por qué se añadió.

## Métricas Requeridas por PR (Reducidas)
- Registrar duración load (performance.now) => telemetry.
- Sólo medir p95 o cache hit ratio si se introdujo optimización relevante.

## Checklist PR (Actual)
- [ ] MVP / Hardening: indicar fase en descripción PR
- [ ] i18n sin hardcodes visibles
- [ ] Manejo error visible + reintentar
- [ ] 1 test smoke render + (si mutaciones) 1 test éxito/fracaso
- [ ] Evento load + error implementados
- [ ] Sin violaciones AXE críticas (ejecutar spec existente si aplica)
 - [ ] Estados unificados usando `DataState` (si aplica a la página)

## Futuro / Parking Lot
- Migración TS completa store.
- Circuit breaker estable y reutilizable.
- Cache persistente multi-tab.
- Cola offline optimista.

Esta guía se revisará cuando: (a) terminemos MVP de todas las páginas principales o (b) se reincorpore capacidad al equipo.
