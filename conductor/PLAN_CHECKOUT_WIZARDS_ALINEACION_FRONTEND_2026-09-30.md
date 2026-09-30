# PLAN — Alineación UI/UX de los wizards de checkout (Concretar Venta / Concretar Compra)

Fecha: 2026-09-30 · Repo: erp-webapp · Rama: dev · Origen: feedback del owner con
capturas de ambos wizards: "No es el mismo ui/ux de compras que el de ventas".
Continúa a PLAN_CARD_CON_TABLA_RECETA_FRONTEND_2026-09-30 (esa alineó las cards de
página; esta alinea los wizards).

## Diagnóstico (los shells ya son gemelos; difiere el contenido)

| Aspecto | Ventas (`SaleCheckoutWizard`) | Compras (`PurchaseCheckoutWizard`) |
| :-- | :-- | :-- |
| Método de pago | Grilla de tarjetas + hotkeys [1..9] (`steps/PaymentStep`) | Select Radix (`steps/PurchasePaymentStep`) |
| Hints de teclado en footer | NO tiene | Sí (`Ctrl+G / Enter / Esc / F2` + específicos del paso) |
| Título panel derecho | **"Cart Review" en inglés** — key `sales.checkoutWizard.cartReview` NO existe en locales y el fallback es inglés (bug i18n) | `purchases.checkoutWizard.cart` = "Orden" |
| Badge del panel | Solo cantidad de líneas | `líneas · unidades` (ej. "1 · 13,5") |
| Datos específicos | Tasa de cambio multi-moneda | Banner sucursal de carga + notas |

## Decisión de unificación (cada lado adopta lo mejor del otro)

1. **Grilla de métodos con hotkeys [1..9] = patrón canónico** para selección de
   método de pago en wizards (más rápida, teclado-first, coherente con §12). Se
   extrae componente compartido `src/components/checkout/PaymentMethodGrid.tsx`
   (iconos + hotkeys + radiogroup) usado por ambos pasos de pago — la lógica no
   se duplica. Compras además reestructura su paso: método (grilla full width) →
   moneda (full width, como ventas) → notas.
2. **Fila de hints kbd = patrón canónico del footer** de todo wizard. Ventas la
   adopta (base: atajo principal + Enter + Esc + F2; por paso: F3 cliente,
   ↑↓ pendientes, [1..9] pago). Compras ya la tiene.
3. **Panel derecho**: ventas corrige el título a la key existente
   `sales.checkoutWizard.cart` ("Carrito"; aria-label incluido) y adopta el badge
   `líneas · unidades` de compras.
4. Los datos específicos de dominio NO se tocan (notas y sucursal quedan en
   compras; tasa de cambio queda en ventas).

## Cambios

1. `src/components/checkout/PaymentMethodGrid.tsx` — nuevo (compartido).
2. `src/features/sales/components/steps/PaymentStep.tsx` — usa el grid compartido
   (fuera grid local + hotkey effect + `paymentMethodIcon`).
3. `src/features/purchases/components/steps/PurchasePaymentStep.tsx` — Select →
   grid compartido; moneda full width debajo.
4. `src/features/sales/components/SaleCheckoutWizard.tsx` — fila de hints en
   footer (mismo markup que compras) + título/aria "Carrito" + badge líneas·unidades.
5. `src/lib/i18n/locales/es/sales.js` — keys `sales.checkoutWizard.hints.*`
   (en no tiene sales.js: fallback español, condición ya existente).
6. `DESIGN.md` — §6.9 "Wizard de checkout": anatomía compartida (shell, chips de
   pasos, hints kbd obligatorios, panel carrito, método = grilla con hotkeys).
7. Test nuevo: `src/components/checkout/__tests__/PaymentMethodGrid.test.tsx`
   (hotkeys 1..9, guard de inputs, selección, radiogroup).

## Fuera de alcance

- Pasos Cobro (difieren por diseño de dominio: caja/monto en compras, vuelto en
  ventas). Flujos de 3 vs 4 pasos (ventas tiene Cliente/Pendientes/Reservas).

## Gates

`npx vitest --run` · `npx tsc --noEmit` · `pnpm build` · `pnpm lint:design` +
smoke visual de ambos wizards en :5173 (con producto y proveedor en carrito).
