# CxC — Detalle de Cuenta (`/receivables/detail/:id`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/ReceivableDetail.jsx` · **Hook**: `useReceivableDetail.js` — llama `getTransactionDetail` (:85) y `getTransactionHistory` (:109), **ambos inexistentes** en `receivablesService`.

## 1. Screenshot

- `../screenshots/receivables/detail-admin.png` — probado con cuenta real `SALE-1788217329-580` (Oscar Flores, PARTIAL, Gs. 217.070).

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| Página completa | `getTransactionDetail(id)` | `GET /receivables/{id}` — **verificado 200** con la cuenta probada | ❌ método inexistente |
| Historial de transacciones | `getTransactionHistory(id)` | probablemente `GET /receivables/client/{client_id}` (historia por cliente) | ❌ método inexistente |

## 3. Comprensión de usuario

- ✅ Error **honesto y en español**: "No se pudo recuperar la información de la cuenta #SALE-1788217329-580. Por favor, intente de nuevo." con botón Reintentar. El mejor error del bloque (contrasta con el leak técnico de CxP-Detalle).

## 4. Afordancias probadas (runtime)

- "Reintentar" re-intenta (mismo fallo hasta FASE 3). Resto inalcanzable.

## 5. Hardcode scan

- Sin mocks. Sin leak técnico.

## 6. Tabla

- N/A (no renderiza).

## 7. Redirecciones

- Ruta registrada ✅; entrada esperada desde List/dashboard (hoy imposibles por sus propios P0).

## 8. Estados de datos (DESIGN §6.7)

- Error ✅ honesto con retry. Loading/Empty no alcanzables.

## 9. DESIGN.md §10

- ErrorState centrado consistente ✅.

## 10. AGENTS.md

- Legacy `.jsx`; hook FSD en features/receivables.

## Rol vendedor (spot-check)

- Ruta sin guard (patrón transversal CxC); API → 403.

## Veredicto

**FAIL (P0)** — Página muerta por 2 métodos faltantes cuyo destino BE existe y respondió 200 en el smoke. El estado de error está bien hecho.

**Fixes (FASE 3)**: `getTransactionDetail` → `GET /receivables/{id}`; `getTransactionHistory` → decidir endpoint (historia del cliente o pagos de la venta `/cobros-ventas/:id`); re-auditar página completa post-fix.
