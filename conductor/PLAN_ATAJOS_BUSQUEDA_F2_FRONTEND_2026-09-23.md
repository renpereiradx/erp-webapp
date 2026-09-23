# PLAN_ATAJOS_BUSQUEDA_F2_FRONTEND — 2026-09-23

**Estado: EJECUTADO Y CERRADO** (misma sesión que la convención).

## Contexto

Se escribió la convención de atajos de teclado para búsqueda en `DESIGN.md §12`
(commit `462737e`), tomando como canónicos el buscador global del menú
(`useGlobalSearch`, Ctrl+K) y el POS de ventas (`useSalesShortcuts`, F2/F4/Alt+Q/Alt+X).
Este plan ejecuta la adopción en las 6 páginas de la tabla §12.7.

## Alcance ejecutado

1. **Hook compartido** `src/hooks/useSearchFocusShortcut.ts` + test colocado
   `useSearchFocusShortcut.test.ts` (4 casos: F2 enfoca+selecciona, `enabled=false`
   no dispara, `defaultPrevented` se respeta, teclas ajenas no hacen nada).
   Guards de §12.3 horneados.
2. **Productos**: `useProductsLogic` ya exponía `searchInputRef` → solo faltaba el
   listener. Hook cableado con `enabled: !(isFormModalOpen || isDetailsModalOpen)`.
   Placeholder concatenado `t(...) + ' (F2)'` → key única con sufijo (drift: la pista
   prometía F2 y no existía listener).
3. **Clientes**: ref + hook en la página, gating form/details. Enter ya buscaba.
4. **Proveedores**: ref + hook, gating form/detalles/confirmación pendiente.
5. **Pagos de compras**: F2 al buscador de resultados (`localSearch`), gating
   registro de pago/cancelación. Keys `purchasePaymentsMvp.search.*` agregadas
   es+en (antes solo existían como fallback del `t()`).
6. **Cobros ventas** (`SalePayment`): F2 al buscador, gating cobro/anulación;
   `sales.cobros.search.label` agregado (el input no tenía aria-label).
7. **Compras**: handler F12 inline de la página (sin gating) → hook nuevo
   `features/purchases/hooks/usePurchasesShortcuts.ts` (F12 + F2 al buscador del
   tab Historial, ref `historySearchInputRef` agregado a `usePurchasesLogic` y
   pintado en `PurchaseHistoryTab`), con `enabled` cubriendo TODOS los overlays
   (wizard, transferencia, modal producto, cancelación, pago instantáneo,
   confirmación). En Nueva Compra F2 no hace nada: la búsqueda vive en el modal
   de producto (F3), documentado en el hook.

## i18n

Placeholders actualizados con sufijo "(F2)..." en key única (§12.6):
`products.search.by_name_sku`, `clients.search.placeholder`,
`supplier.search.placeholder`, `purchasePaymentsMvp.search.placeholder`,
`sales.cobros.search.placeholder`, `purchases.search.placeholder`
(es + en donde el módulo tiene archivo en; el resto hereda por spread).
Arias-labels limpios separados del placeholder: `purchases.search.label`,
`sales.cobros.search.label`.

## Auditoría performance (skill vercel-react-best-practices)

Cambio menor aplicado con criterio (AGENTS.md "hotfixes triviales"): hooks
effect+ref sin estado, deps estables (`[enabled, inputRef]`), listeners solo se
re-adjuntan cuando `enabled` cambia (comportamiento deseado: capa §12.2), sin
re-renders nuevos ni impacto de bundle (`rerender-*`/`bundle-*` N/A). Reporte
abreviado aquí por el tamaño del cambio; no se justifica pase completo.

## Gates

- `npx vitest --run`: 153 archivos / 1108 tests, 0 fallos (incluye 4 nuevos).
- `npx tsc --noEmit`: 0 errores.
- `pnpm build`: verde (warning de chunks >500kB preexistente).
- `pnpm lint:design`: "Código nuevo limpio".

## Pendientes / fuera de alcance

- Retro-TSX/Feature-Sliced de páginas legacy tocadas (Clients, Suppliers,
  PurchasePayments, SalePayment): NO es parte de este plan; el toque fue mínimo
  (ref + hook + placeholder), sin refactor pesado.
- El placeholder del buscador global del Header sigue hardcodeando "(Ctrl+K)"
  en vez de `formatShortcut('general.globalSearch')` (§12.6): corregir cuando
  se toque ese archivo.
