# Guía de Contribución - Feature Products

## Principios
- Single Responsibility en componentes y hooks.
- Estado global mínimo: productos, cachés, selección, meta.
- Operaciones con correlationId para trazabilidad.
- Caché SWR-like + revalidación background.
- Telemetría en cada flujo crítico (fetch, search, bulk, inline, perf).

## Estructura
```
src/features/products/
  components/
  hooks/
  services/
  types/
  __tests__/
```

## Patrones
- EditableField para edición granular optimista.
- _withRetry para resiliencia con backoff uniforme.
- LRU trimming simple por timestamp (mantener límites definidos en docs).

## Convenciones
- Eventos telemetry: prefijo products.*
- Error codes centralizados en utils/errorCodes.js
- i18n: claves kebab-like agrupadas por dominio (products.*).

## Añadir Campo Editable
1. Actualizar dominio (types / store si cambia shape).
2. Incluir validación en EditableField o antes de onInlineSave.
3. Telemetría products.inlineUpdate.* ya reutilizable.

## Añadir Nueva Acción Bulk
1. Agregar acción en store (optimista + rollback).
2. Telemetría: products.bulk<Accion>.success/error.
3. Test unit Bulk (mock updateProduct).

## Métricas Requeridas por PR
- p95 fetch/search (manual devtools) si se modifica fetching.
- Cache hit ratio si se manipula TTL.
- Renders ProductCard (getPerfSnapshot) en lista de 100 elementos.

## Checklist PR
- [ ] Telemetría añadida / actualizada
- [ ] Docs relevantes actualizados (CACHE, OBSERVABILITY)
- [ ] Tests agregados/pasando (unit + integración)
- [ ] Claves i18n nuevas documentadas
- [ ] Sin regresiones de accesibilidad (role/aria)

## Futuro
- Migración a TypeScript incremental (store + services).
- Persistencia opcional de cachés.
- Flags remotos.
