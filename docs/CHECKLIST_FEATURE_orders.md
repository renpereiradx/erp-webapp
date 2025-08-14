# Checklist: Implementación feature `orders` (plantilla basada en Products)

Fecha: 2025-08-14
Responsable: Equipo Frontend
Estado: Borrador

## Objetivo
Crear la página `Orders` siguiendo el estándar del template: accesible, performante, themeable, observable y testeable, manteniendo paridad funcional.

## Estructura mínima a crear
- `src/features/orders/components/` — Toolbar, Filters, OrdersGrid, OrderCard, EmptyState
- `src/features/orders/modals/` — CreateEditOrder, ConfirmBulk, OrderDetail (lazy)
- `src/features/orders/hooks/` — `useOrdersFilters`, `useOrdersPage`, `useDebouncedValue`
- `src/features/orders/services/` — `ordersApi.js`, `ordersMappers.js`, validators
- `src/features/orders/store/` — `useOrdersStore.js` (Zustand slice con byId/orderList, cache, optimistic updates)
- `src/features/orders/__tests__/` — unit + integration (MSW)
- `src/features/orders/README.md` — contratos y decisiones API

## Pasos de implementación (orden recomendado)
1. Crear carpeta feature + README con contratos API y mappers.
2. Extraer hooks base (`useDebouncedValue`, `useBulkSelection`) si no existen.
3. Implementar `useOrdersStore` con:
   - Normalización por id, pageCache SWR-like, TTLs
   - `_withRetry` para transitorios
   - Optimistic update + rollback para inline edits y bulk
   - CorrelationId en operaciones
4. UI: OrdersGrid virtualizado (react-virtuoso si >50), OrderCard con `EditableField` para campos permitidos.
5. Accesibilidad:
   - `aria-live="polite"` para anuncios (búsqueda, bulk)
   - Keyboard navigation y focus restore en modals
6. Telemetría:
   - registrar latencia, cache hits/misses, retries, rollback
7. Tests:
   - Unit: hooks, mappers, utils
   - Integration: CRUD + bulk + search con MSW
   - A11y: focus + live-region (axe opcional)
8. QA antes de merge (ver checklist abajo).

## Checklist antes de merge
- [ ] Feature flag `ordersNewUI` creado y respetado
- [ ] Todas las cadenas en `src/lib/i18n.js` (keys) y traducciones básicas añadidas
- [ ] Linter y typecheck (o JSDoc) sin errores
- [ ] Tests unitarios e integración pasan
- [ ] Accesibilidad: navegación teclado, focus visible, live announcements
- [ ] Telemetría mínima instrumentada (latencia + error rate)
- [ ] Demo en Storybook o capturas con >50 items virtualizados

## Archivos de referencia para leer antes de empezar
- `docs/FEATURE_PAGE_IMPROVEMENT_TEMPLATE.md`
- `docs/CACHE_IMPLEMENTATION.md`
- `docs/OBSERVABILITY.md`
- `src/components/EditableField.jsx`
- `src/store/useProductStore.js` (patrón de store)
- `src/lib/i18n.js`

---

Usa esta checklist como punto de partida y ajusta según alcance de `orders`.
