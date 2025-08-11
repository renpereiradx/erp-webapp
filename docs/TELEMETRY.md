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

## Eventos actuales

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

Proveedores (`src/pages/Suppliers.jsx`)
- `suppliers.search.success` { ms }
- `suppliers.search.error` { message }
- `suppliers.delete.success` { id }
- `suppliers.delete.error` { id, message }
- `suppliers.modal.success` {}
- `suppliers.error.store` { message }

## Uso típico
```js
// Medir una búsqueda
const t = telemetry.startTimer('products.search');
try {
  const res = await searchProducts(term);
  const ms = telemetry.endTimer(t, { total: res.total });
  telemetry.record('products.search.success', { ms, total: res.total });
} catch (err) {
  telemetry.endTimer(t);
  telemetry.record('products.search.error', { message: err?.message });
}
```

## Pruebas
En tests se stubbean con:
- `vi.mock('@/utils/telemetry', () => ({ telemetry: { record: vi.fn(), startTimer: vi.fn(), endTimer: vi.fn() } }))`
- Se verifican las llamadas a `telemetry.record(...)`.

## Notas
- La telemetría es en memoria y no persiste. Adecuada para debugging/local y tests.
- Para integrar con un backend/servicio real, reimplementar `record()` para enviar a su colector conservando la misma interfaz.
