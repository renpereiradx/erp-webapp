# Inventario — Rotación y ABC (`/inventory-analytics/turnover-abc`)

**Fecha**: 2026-09-16 · FASE 2G · Rol: admin consolidado · Modo API, BE FASE 1. `.tsx` ✅

**Archivo**: `src/pages/InventoryAnalytics/InventoryTurnoverABC.tsx` → `GET /inventory-analytics/turnover` + `/abc`

## 1. Screenshot

- `../screenshots/inventory-analytics/turnover-abc-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Tasa Promedio 0,01x / Días Promedio **2.839 días** | ✅ reales (dev quirk: poco movimiento vs valuación alta — mismo patrón que kpis 2.192 días; necesita nota interpretativa) |
| Rotación por Categoría (5 filas: Alquiler 0,09x Pobre, MODA 0,05x Pobre…) | ✅ real con status semántico |
| Filtros hoy/semana/mes/año | ✅ cableados |
| ABC por valor | ✅ (sección inferior, consistente con dashboard) |

## 3-10

- Búsqueda/filtros ✅. "Exportar" decorativo 🟡. 5 filas ✅. `.tsx`.

## Veredicto

**PASS condicional** — Real y consistente. Deuda: nota para los días-inventario extremos, Exportar.

**Fixes (FASE 3, P2)**: tooltip/nota "cálculo sobre ventas del período" · Exportar o fuera.
