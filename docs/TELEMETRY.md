# Telemetría mínima

Este proyecto incluye una utilidad de telemetría ligera en `src/utils/telemetry.js` para registrar eventos y medir duraciones sin dependencias externas.

## API
- `telemetry.record(event: string, payload?: object)`
  - Registra un evento con un payload opcional. En modo dev (`import.meta.env.DEV`), hace `console.debug`.
- `const t = telemetry.startTimer(name: string, meta?: object)`
  - Inicia un timer. Devuelve un token opaco.
- `telemetry.endTimer(t, extra?: object): number`
  - Finaliza el timer y devuelve la duración en ms. Puede adjuntar metadata extra que se fusiona.
- `telemetry.get(event: string)` / `telemetry.getAll()`
  - Devuelve eventos acumulados en memoria (solo para debugging/test).

## Eventos actuales (namespaces legacy y feature coexistieron; legacy marcados como deprecated)

Productos (`src/pages/Products.jsx` y `src/store/useProductStore.js`)
- `products.search.success` { ms, total }
- `products.search.error` { code, message }
- `products.search.abort` {}
- `products.delete.success` { id }
- `products.delete.error` { id, message }
- `products.modal.success` {}
- `products.error.store` { message }

Clientes (`src/pages/Clients.jsx`)
- `clients.search.success` { ms }
- `clients.search.error` { message }
- `clients.delete.success` { id }
- `clients.delete.error` { id, message }
- `clients.modal.success` {}
- `clients.error.store` { message }

Proveedores – feature namespace (`src/store/useSupplierStore.js`, `src/pages/Suppliers.jsx`, `SuppliersMetricsPanel`)
- `feature.suppliers.load` { page, count, search, latencyMs }
- `feature.suppliers.search.success` { latencyMs, term }
- `feature.suppliers.search.error` { message, term? } (emitido en paths de error búsqueda)
- `feature.suppliers.create` { latencyMs }
- `feature.suppliers.update-success` { latencyMs }
- `feature.suppliers.delete-success` { latencyMs }
- `feature.suppliers.error` { code, op?, page?, search?, latencyMs, message? }
- `feature.suppliers.retry` { attempt, max, op }
- `feature.suppliers.cache.hit` { page, search }
- `feature.suppliers.cache.miss` { page, search }
- `feature.suppliers.cache.revalidate.success` { page }
- `feature.suppliers.cache.revalidate.error` { page, message }
- `feature.suppliers.cache.trim` { removed, remaining, limit }
- `feature.suppliers.cache.reset` {}
- `feature.suppliers.prefetch.success` { page, count }
- `feature.suppliers.prefetch.error` { page, message }
- `feature.suppliers.prefetch.skip` { page, reason }
- `feature.suppliers.circuit.open` { failures, openUntil }
- `feature.suppliers.circuit.close` { reason, durationMs? }
- `feature.suppliers.circuit.skip` { page, search, context? }
- `feature.suppliers.circuit.reset` {}
- `feature.suppliers.circuit.reopened` {}
- `feature.suppliers.offline.snapshot.persist` { count }
- `feature.suppliers.offline.snapshot.hydrate` { count }
- `feature.suppliers.circuit.panel.opened` {}
- `feature.suppliers.circuit.panel.reopened` {}
- `feature.suppliers.circuit.panel.closed` {}

(Proveedores legacy – DEPRECATED: `suppliers.search.success|error`, `suppliers.delete.success|error`, `suppliers.modal.success`, `suppliers.error.store`)

## Uso típico
```js
// Medir una búsqueda suppliers (feature namespace)
const t = telemetry.startTimer('feature.suppliers.search');
try {
  await loadPage(1, 10, term);
  const ms = telemetry.endTimer(t, { term });
  telemetry.record('feature.suppliers.search.success', { latencyMs: ms, term });
} catch (err) {
  telemetry.endTimer(t);
  telemetry.record('feature.suppliers.error', { op: 'search', message: err?.message });
}
```

## Pruebas
En tests se stubbean con:
```js
vi.mock('@/utils/telemetry', () => ({
  telemetry: { record: vi.fn(), startTimer: vi.fn(), endTimer: vi.fn() }
}));
```
Se verifican las llamadas a `telemetry.record(...)`.

## Notas
- La telemetría es en memoria y no persiste. Adecuada para debugging/local y tests.
- Para integrar con un backend/servicio real, reimplementar `record()` para enviar a su colector conservando la misma interfaz.
