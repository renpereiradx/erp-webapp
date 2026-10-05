# PLAN_CIERRE_SALES_FRONTEND — Purga del último cable legacy de ventas

**Fecha:** 2026-10-05 · **Estado: EJECUTADO** (mismas sesión; ver Resultados de gates)
**Scope:** solo frontend (`erp-webapp`). Origen: auditoría de pendientes según AGENTS.md
(2026-10-05) — punto 1 del orden sugerido: cerrar la migración Feature-Sliced de Sales.

---

## Diagnóstico (verificado por import, 2026-10-05)

AGENTS.md declara Sales como `🔄 En progreso — useSalesLogic en extracción`. La auditoría
muestra que **la extracción ya ocurrió**: lo que quedó atrás es un encadenado de tres
archivos legacy **muertos** (cero consumidores, verificado con grep de ocurrencias sobre
todo `src/`, incluidos imports dinámicos y strings):

```
src/components/DiscountModal.jsx   (471 líneas — SIN consumidores)
  ├── import PRICE_CHANGE_REASONS  ← src/hooks/useSalesLogic.js (491 líneas — sin otros consumidores)
  └── import validateDiscount, calculateFinalPrice, requiresAuthorization
                                    ← src/utils/discountValidation.js (207 líneas — sin otros consumidores)
```

### El sucesor vivo ya cubre todo

| Responsabilidad legacy | Sucesor vivo | Nota |
|---|---|---|
| `PRICE_CHANGE_REASONS` (14 razones, con `requiresAuth`/`description`) | `features/sales/constants/priceChangeReasons.ts` (9 razones alineadas al backend `price_change_reason`) | Consumidores: `EditItemModal.tsx`, `SalesNew.tsx:1152`. La lista reducida fue decisión de la migración previa, no de este plan |
| Modal de descuento (`DiscountModal.jsx`, Dialog artesanal con hex) | `features/sales/components/EditItemModal.tsx` (EnhancedModal, i18n, moneyInput de dominio) | Header del propio archivo: "Reemplaza el modal artesanal de SalesNew" |
| Validación de descuentos (`utils/discountValidation.js`) | `domain/sale/validators/saleValidator.ts` (reglas v1.10: razón obligatoria, no mezclar fijo+%, rango 0–100, justificación de cambio de precio) | Con tests en `domain/sale/` (`cobros.test.ts`, `walkInCart.test.ts`) |
| Estado del carrito / cálculos (`useSalesLogic`) | `store/useSaleStore.ts` + `domain/sale/` | `SalesNew.tsx` no importa ningún hook legacy de ventas (imports verificados uno a uno) |

Además: `features/sales/` contiene **0 archivos `.js/.jsx`**; la página viva es
`src/pages/SalesNew.tsx` (TSX).

## Decisión

**DELETE, no migración.** Fundamento:

1. Regla 6 del diseño de tests (`PLAN_TEST_DESIGN_FRONTEND.md`): componente retirado →
   DELETE, nunca placeholder. No hay test de `DiscountModal` que borrar (sin `.test.` asociado).
2. Regla de workspace: archivo legacy que se toca pesadamente se migra completo — pero
   estos no se tocan: se eliminan porque nadie los importa.
3. Migrar contenido a la feature duplicaría lógica que ya vive en `domain/sale/` con
   reglas más nuevas (v1.10) que las del legacy (SALE_WITH_DISCOUNT_API.md).

## Cambios

1. **Eliminar** `src/components/DiscountModal.jsx`
2. **Eliminar** `src/hooks/useSalesLogic.js` (incluye su constante `PRICE_CHANGE_REASONS`
   duplicada — la canónica es la de `features/sales/constants/`)
3. **Eliminar** `src/utils/discountValidation.js`
4. **Actualizar** `AGENTS.md` del wrapper: fila Sales de la tabla de migración frontend
   `🔄 En progreso` → `✅ Completo` (commit aparte, es otro repo).

Efecto colateral positivo: `src/hooks/` pierde el hook legacy más grande (491 líneas).

## Fuera de alcance (queda para los siguientes puntos del orden sugerido)

- `SalesPaymentHistory.jsx` (página, 6 .jsx de pages) — módulo pagos/ventas, se aborda
  en la purga de pages.
- Stores `.js` que `SalesNew.tsx` sí usa (`useSaleStore.ts` ya es TS; quedan
  `useToast`, `useTaxRateStore.js`, `ApiError.js`) — deuda transversal, no de Sales.
- Plan PROPUESTO `PLAN_BUSQUEDA_INTELIGENTE_FRONTEND_2026-10-04.md` — independiente.

## Verificación (gates de salida)

Previos a eliminar: grep de ocurrencias = 0 consumidores (hecho, ver Diagnóstico).

1. `npx tsc --noEmit` — 0 errores
2. `npx vitest --run` — 0 fallos
3. `pnpm build` — verde
4. `pnpm lint:design` — verde

## Resultados de gates

- `tsc --noEmit`: 0 errores ✅
- `vitest --run`: **1433/1433** (206 archivos) ✅ — el suite creció mucho desde el
  baseline mental del 09-29 (1226); ninguna rotura atribuible a la purga
- `pnpm build`: verde ✅ (warning de chunk >500 kB preexistente)
- `pnpm lint:design`: verde ✅ ("Código nuevo limpio"; los .jsx listados son legacy
  preexistente que el linter reporta sin fallar)

Commits: FE (purga + plan) · wrapper (AGENTS.md fila Sales → ✅).
