# PLAN — Fixes de IVA en frontend (Fase 1 del plan de revisión senior)

**Fecha:** 2026-08-18
**Alcance:** `erp-webapp` — corrección de bugs de cálculo/visualización de IVA
**Tipo:** Bug fixes priorizados (P0) + consolidación de lógica duplicada
**Estado:** ✅ Implementado (commits `911ce2f`, `66bf5bf`, `23f56a6`, `9c9a09d`, 2026-08-18)
**Plan padre:** [business_management/conductor/PLAN_IVA_SENIOR_REVIEW_FIXES.md](../../business_management/conductor/PLAN_IVA_SENIOR_REVIEW_FIXES.md)
(Fases 0–3; la fase backend es independiente de esta).

**Contexto:** desde el commit backend `1d9efd5` (17-ago) el IVA se liquida server-side en
SQL con snapshots por línea; el cálculo del frontend es **solo estimativo** para mostrar
totales en el carrito. Los bugs acá no corrompen datos persistidos, pero hacen que el
total mostrado difiera del cobrado/persistido.

---

## Fixes (en orden)

### 1. Bug exento→10% + fallbacks unificados (H1, H2)

- `src/store/useSaleStore.ts:561` — `tax_rate: product.applicable_tax_rate?.rate / 100 || 0.10`:
  con rate `0` (EXENTO), `0/100 = 0` es falsy y cae a `0.10`. Un producto exento se
  calcula con IVA 10% en el carrito. Fix: rate `0` es válido (exento); usar nullish (`??`)
  solo cuando la tasa no viene.
- Unificar los fallbacks divergentes: `src/pages/SalesNew.tsx:164` y `:410`,
  `src/features/sales/hooks/useBarcodeScanner.ts:63` (→ 0.10),
  `src/hooks/useProductSearch.ts:49` (→ 0),
  `src/store/usePurchaseStore.ts:339` (→ 0.10):
  reemplazar constantes sueltas por la **tasa default del backend**
  (`taxRateService.getDefault()` — ya existe, GET `/tax_rate/default`) cacheada en el
  store de tasas (`src/store/useTaxRateStore.js`).
- Purga del legado México 16%: `src/hooks/useSalesLogic.js:9` (`TAX_RATE = 0.16`, exportada
  en :492), `src/config/mockData/sales.js` (0.16/1.16 y moneda "MXN"),
  `src/config/demoData.js` (`DEMO_TAX_RATES_DATA` con 16%/8% → IVA10/IVA5/EXENTO),
  `src/constants/purchaseData.js` (`IVA_16`/`IVA_8`/`IEPS`).

### 2. Buckets dinámicos por tasa (H3)

- `src/domain/sale/calculations/saleCalculator.ts:77-81` y
  `src/domain/purchase/calculations/purchaseCalculator.ts:62-65`: hoy solo acumulan
  `iva10`/`iva5` (comparación `Math.abs(rate - 0.10) < 0.001`); cualquier otra tasa
  calcula el IVA pero lo descarta de `tax_amount` → los totales no cuadran.
- Fix: agrupar por tasa (`Map<rate, amount>`), mantener `iva10`/`iva5` como campos
  derivados (compatibilidad) y `tax_amount` = suma de todas las tasas. Etiquetas de UI
  por tasa vía `src/lib/i18n.js` (sin strings hardcoded).

### 3. Descuento general vs IVA (H4)

- `src/store/useSaleStore.ts:633-646` (`applyDiscount`): aplica el descuento general
  DESPUÉS de extraer el IVA; el descuento por línea se aplica ANTES (semántica del
  backend). Fix: prorratear el descuento general por línea antes de la extracción,
  consistente con `saleCalculator` y con la liquidación server-side.

### 4. Consolidar la jerarquía de resolución (H5)

La jerarquía producto > SIFEN > categoría está reimplementada con variantes en 4 lugares:
`src/pages/SalesNew.tsx:150-173`, `src/hooks/useProductSearch.ts:33-55`,
`src/features/purchases/hooks/usePurchasesLogic.ts:617-641`,
`src/pages/BudgetCreate.tsx:109`.

- Fix: helper único de dominio, p. ej. `src/domain/tax/resolveApplicableRate.ts` (puro,
  sin dependencias de React), que consuma el `applicable_tax_rate` que el backend ya
  resuelve en el GET de producto, con normalización percent ↔ fracción en un solo punto.
- Decisión registrada: **no** crear endpoint `POST /tax/calculate`; el backend sigue
  siendo autoritativo al crear la venta.

---

## Verificación

- `pnpm test` y `pnpm build` en verde antes de cada commit.
- Commits convencionales en inglés, uno por fix (`fix(iva): ...`).
- Prueba manual: carrito con producto exento (tasa 0) → total sin IVA y línea en
  "exento"; carrito con tasa no estándar si existiera → `tax_amount` la incluye.
- Actualizar el **Estado** de este archivo y del plan padre al terminar.
