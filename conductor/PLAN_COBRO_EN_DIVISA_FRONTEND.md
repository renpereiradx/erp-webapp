# PLAN — Cobro en divisa en el wizard de ventas (frontend)

Fecha: 2026-08-27
Alcance: `src/features/sales/`, `src/pages/SalesNew.tsx`, `src/types.ts`, `src/domain/sale/calculations/`, i18n
Estado: **IMPLEMENTADO**

---

## Política

El documento de venta se crea **siempre en moneda base (PYG)**. La moneda que se elige en el
paso "Pago" del wizard es la **moneda de cobro**: define en qué divisa se entrega el dinero y
a qué tasa, pero no re-etiqueta los precios del carrito (que quedan en PYG).

## Cambios

| Archivo | Cambio |
|:--------|:-------|
| `src/domain/sale/calculations/foreignPayment.ts` | NUEVO: helpers puros `computeForeignDue`, `computeBaseFromForeign`, `computeForeignChange` (+ tests) |
| `src/types.ts` | `POSPayment` suma `currency_id`, `exchange_rate`, `original_amount` (opcionales) |
| `PaymentStep.tsx` | El input "Monto original" manual se reemplaza por el equivalente **calculado** del total en la divisa elegida (la tasa sigue precargada y editable) |
| `CollectionStep.tsx` | Consciente de divisa: monto recibido y vuelto en la divisa de cobro; reporta `currencyId`, `exchangeRate`, `foreignAmountReceived` y `amountReceived` (base) en `CollectionData`; botones rápidos en PYG solo en modo base |
| `SaleCheckoutWizard.tsx` | Carrito siempre en moneda base + línea "≈ divisa" bajo el Total; arma los datos de cobro en divisa |
| `SalesNew.tsx` | `buildNewSaleData` envía `currency_id` de la **moneda base**; el pago del `posCheckout` envía `currency_id/exchange_rate/original_amount`; la moneda inicial del selector pasa a ser la base |
| `locales/{es,en}/sales.js` | Claves nuevas para equivalente, monto recibido en divisa y total en divisa |

## Verificación (2026-08-27)

- `pnpm build` ✓ · `tsc --noEmit` ✓
- `pnpm vitest --run src/domain` ✓ (114 tests, incluye los 8 nuevos de `foreignPayment`)
- `pnpm test`: 49 fallos preexistentes (productos/temas/clientes/cajas), idénticos a HEAD
  sin estos cambios — cero regresiones nuevas.

## Contrato con el backend

- `payment.amount_received`: **siempre en moneda base** (para efectivo en divisa:
  `foreignAmountReceived × exchangeRate`).
- `payment.currency_id` + `payment.exchange_rate` + `payment.original_amount`: metadatos del
  cobro en divisa (el backend valida que exista tasa si no se envía explícita, y deriva
  `original_amount` si falta).
- **Vuelto: se entrega en guaraníes** (moneda base). La UI lo muestra como cifra principal
  (`computeBaseChange`, p. ej. entrega US$ 70 → vuelto 11.000 PYG) con el equivalente en
  divisa como referencia; el backend ya lo persistía en base (`change_amount` del SQL).

## Auditoría y correcciones (2026-08-27, post-implementación)

Auditoría contra este plan; la implementación coincidía salvo por 3 bugs (corregidos) y
2 desviaciones documentadas:

**Fixes aplicados:**

1. **Divisa sin tasa cobraba en silencio en base** (grave): el paso Pago no exigía tasa
   con divisa ≠ base → `foreignCurrency` era null → CollectionStep entraba en modo base y
   el pago viajaba SIN `currency_id` (el operador creía cobrar USD y se registraban PYG).
   Ahora `isStepValid('payment')` exige tasa > 0 con divisa elegida.
2. **Tasa stale**: `exchangeRate` nunca se limpiaba al cambiar divisa ni al reabrir el
   wizard (elegir USD → EUR conservaba la tasa de USD). Se limpia al abrir el wizard y en
   el `onValueChange` del selector de `PaymentStep` (re-precarga).
3. **Fallback `|| totalAmount` en CollectionStep**: input vacío de monto en divisa
   registraba silenciosamente el pago exacto. Eliminado; además `isStepValid('collection')`
   exige `amountReceived > 0` en efectivo (Avanzar/Confirmar bloqueado).

**RegisterSalePaymentModal alineado al flujo** (cobro de ventas pendientes: SalePayment,
SalesPaymentHistory, ReceivableDetail, SalesOrderDetail): el "Equivalente" manual se
reemplaza por el equivalente CALCULADO; con divisa ≠ documento el Importe Entregado se
tipea en ESA divisa (decimales), tasa precargada/editable, `amount_received` viaja
convertido a base, vuelto en moneda del documento, y el submit se bloquea sin tasa.
`SalePayment.jsx` pasa los metadatos de divisa al `confirm-payment`. Requiere los cambios
backend del mismo día (ver plan backend, sección Auditoría).

**Desviaciones documentadas (no corregidas):**

- `locales/en/sales.js` no existe: el inglés cae al fallback completo `es` (patrón
  preexistente del módulo, marcado TEMPORARY FALLBACK en `en/index.js`).
- Tests de `foreignPayment`: son 11, no los 8 declarados (mayor cobertura que lo
  declarado).

**Verificación post-fix (2026-08-27):** `pnpm build` ✓ · `tsc --noEmit` ✓ ·
`vitest src/domain` 117/117 ✓ · `pnpm test`: 49 fallos preexistentes idénticos a HEAD
(productos/temas/clientes/cajas) — cero regresiones nuevas.
