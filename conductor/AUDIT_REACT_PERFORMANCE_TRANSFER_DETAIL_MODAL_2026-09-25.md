# Auditoría React Performance — TransferDetailModal enriquecido (2026-09-25)

Cambio: el modal de detalle de transferencias muestra ficha (ruta con nombres,
tipo, fecha, solicitante, notas) + tabla de ítems (producto resuelto,
solicitada/aprobada/enviada/recibida, totales). Skill `vercel-react-best-practices`
(SPA Vite sin SSR: reglas `server-*` no aplican).

## Hallazgos por regla

- `async-parallel` ✅: nombres de productos vía un solo `Promise.allSettled`
  (tolerante a fallos por ítem; fallback al `product_id`, nunca celda vacía).
- `client-swr-dedup` ✅: react-query con `staleTime` 5 min. Key `branches-names`
  compartida con `TransfersPage`/`CreateTransferModal` (cache hit entre bandeja
  y modal). Key `transfer-product-names` ordenada y estable. Queries con
  `enabled` (ramas solo con modal abierto; productos solo si hay IDs sin nombre).
- `rerender-*` ✅: `branchNameById` y `missingProductIds` en `useMemo`; sin
  componentes inline; sin effects manuales; sin subscripciones innecesarias.
- `bundle-*` ✅: imports directos (`branchService`, `productService`,
  `Table/*`); sin barrels nuevos ni dinámicos necesarios (modal liviano).
- `rendering-*` ✅: tabla corta (típico 1–10 ítems, sin virtualización);
  ternario para empty; sin animaciones > 150 ms.
- `js-set-map-lookups` ✅: `Map` para resolución sucursal/producto (O(1)).

## Acción

Ningún cambio requerido. Gates: vitest transfers 20/20, `tsc --noEmit` 0
errores, `lint:design` código nuevo limpio.
