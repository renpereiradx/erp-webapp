# Rutas huérfanas BI (decisión FASE 2) — `/bi/inventory/*` y `/finance/profitability`

**Fecha**: 2026-09-16 · FASE 2I · Rol: admin consolidado · Modo API, BE FASE 1.

**Archivos**: `src/pages/StockManagement.jsx` (100% mock — P1-5), `src/components/... InventoryRisk.jsx` de profitability (100% mock — P1-5), `src/pages/ProfitabilityAnalysis.jsx` (legacy huérfano).

## 1. Screenshots

- `../screenshots/huerfanas/stock-management-mock.png` — **ErrorBoundary "Algo salió mal"** (crash en runtime, peor que el mock reportado)
- `../screenshots/huerfanas/finance-profitability-mock.png` — renderiza (legacy, fuera del sidebar)

## 2. Verificación

| Ruta | Runtime |
|:--|:--|
| `/bi/inventory/stock-levels` (StockManagement) | ❌ **CRAShea** ("Algo salió mal") — 100% mock (17 SKU críticos, ₫1.840.500.000 literales) + crash |
| `/bi/inventory/risk-analysis` (InventoryRisk de profitability) | 100% mock por código (P1-5); no capturada (misma decisión) |
| `/finance/profitability` (ProfitabilityAnalysis) | renderiza legacy; duplica la función de `/profitability/dashboard` (gated y mejor) |

## Decisión (según plan §1.1: "eliminar o re-enlazar")

**ELIMINAR en FASE 3** (las 3 rutas + sus componentes si no tienen otros consumidores):

1. `StockManagement.jsx` e `InventoryRisk.jsx` (profitability): 100% literales + crash — no tienen valor; la funcionalidad real vive en `/inventory-analytics/*` (4 páginas PASS).
2. `/finance/profitability`: duplica `/profitability/dashboard`.
3. `services/mocks/receivablesMock.js`, `services/auditService.ts` + `mocks/auditMocks.js`, `features/accounts-payable/data/*`, `components/business-intelligence/receivables/*`, `features/cash-flow/data/mockData.js` (P1-9) — grep de consumidores antes de borrar; mockData tiene el import muerto de CashFlow.

**No re-enlazar ninguna**: las rutas canónicas ya existen y funcionan (stock-levels PASS, profitability/dashboard funcional).

## Veredicto

**FAIL (P1-5 confirmado y agravado: crash)** — Decisión documentada: eliminación en FASE 3 ronda P1.
