# Inventario — Dashboard (`/inventory-analytics/dashboard`)

**Fecha**: 2026-09-16 · FASE 2G · Rol: admin consolidado · Modo API, BE FASE 1. **Rutas .tsx** ✅ (grupo migrado).

**Archivo**: `src/pages/InventoryAnalytics/InventoryDashboard.tsx` → `GET /inventory-analytics/overview`

## 1. Screenshot

- `../screenshots/inventory-analytics/dashboard-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| KPIs Valor 37.532.095 / Ganancia Potencial 14.650.745 / Rotación 0,06x / Stock Muerto 31,31% | ✅ reales (coherentes con risk 2.149.350=31,31% del valor) |
| Donut Estado del Stock (21 productos: 16 en stock / 4 bajo / 1 sin / 12 sobre) | ✅ real (dimensiones superpuestas — sobre-stock cruza con en-stock; aceptable con leyenda) |
| Alertas Críticas con CTAs "Liquidar producto" / "Revisar stock mínimo" | ✅ enlazan a las páginas del grupo |
| Resumen ABC (A 64,80% 1 prod 24.3M / B 25,75% 2 / C 9,45% 18) | ✅ real (post-T13 el ABC respire y funciona) |

## 3-10

- La mejor página BI del sistema junto a Aging CxC. Período actual mostrado. "Actualizar" ✅. `.tsx` ✅. Estados ✅.

## Veredicto

**PASS** — Datos reales, coherentes y accionables. Sin hallazgos P0/P1.
