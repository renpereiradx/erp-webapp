# Inventario — Riesgos y Stock Muerto (`/inventory-analytics/risk`)

**Fecha**: 2026-09-16 · FASE 2G · Rol: admin consolidado · Modo API, BE FASE 1. `.tsx` ✅

**Archivo**: `src/pages/InventoryAnalytics/InventoryRisk.tsx` → `GET /inventory-analytics/dead-stock` (+ reorder)

## 1. Screenshot

- `../screenshots/inventory-analytics/risk-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Pérdida Potencial Gs. 2.149.350 (31,31% capital inmovilizado) | ✅ real (consistente con dashboard) |
| Productos >90 días (tabla 9 filas: Mouse Golitec 107 días Gs. 5.024.000 "Promocionar activamente") | ✅ real — 500 crónico resucitado en T13 ahora con datos |
| "Valor de Reorden Recomendado: Gs. 0 — 2 SKUs" | 🟡 incoherencia menor (2 SKUs con valor 0 — mapping o dato) |

## 3-10

- Recomendaciones por fila útiles. 9 filas ✅. `.tsx`. Nota: este componente NO es el `InventoryRisk.jsx` huérfano de profitability (ese va en 2I rutas huérfanas).

## Veredicto

**PASS** — Datos reales y accionables. Menor: reorden Gs. 0 con 2 SKUs.
